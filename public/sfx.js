/* Asimon — the sounds.

   Synthesised on the fly, every one of them. There is not a single audio
   file in this repo for the same reason there is not a single image: the
   art is drawn in art.js and the sound is played here, so the whole game
   is still a folder you can read.

   This file listens rather than being called. It reads the state app.js
   already holds and watches for the moments worth hearing, so nothing in
   app.js has to know it exists — and turning the sound off is deleting one
   script tag.                                                             */
"use strict";
(function(){

const KEY = "asimon.sound";
let ctx = null, bus = null, off = false;
try{ off = localStorage.getItem(KEY) === "off"; }catch(e){}

/* Phones will not make a sound until they have been touched, so the context
   is built on the first tap and nothing before it is missed — the first tap
   in this game is always a name or a face. */
function ready(){
  if(ctx){
    try{
      if(ctx.state === "suspended" && ctx.resume){
        const r = ctx.resume();
        if(r && r.catch) r.catch(function(){});
      }
    }catch(e){}
    return ctx;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return null;
  try{
    ctx = new AC();
    bus = ctx.createGain();
    bus.gain.value = 0.8;
    bus.connect(ctx.destination);
  }catch(e){ ctx = null; }
  return ctx;
}
const now = () => ctx.currentTime + 0.005;

/* ---------------- the instrument ---------------- */
/* One shaped tone. Everything below is built out of this and noise. */
function tone(o){
  if(!ctx) return;
  const t = o.t || now(), a = o.a || 0.006, h = o.h || 0, d = o.d || 0.18;
  const g = ctx.createGain(), osc = ctx.createOscillator();
  osc.type = o.type || "sine";
  osc.frequency.setValueAtTime(Math.max(20, o.f), t);
  if(o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + a + h + d);
  if(o.detune) osc.detune.value = o.detune;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.g || 0.12), t + a);
  if(h) g.gain.setValueAtTime(Math.max(0.0002, o.g || 0.12), t + a + h);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + h + d);
  let out = g;
  if(o.pan && ctx.createStereoPanner){
    const p = ctx.createStereoPanner();
    p.pan.value = o.pan; g.connect(p); out = p;
  }
  osc.connect(g); out.connect(bus);
  osc.start(t); osc.stop(t + a + h + d + 0.03);
}

let nbuf = null;
function noiseBuf(){
  if(nbuf) return nbuf;
  nbuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
  const d = nbuf.getChannelData(0);
  for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return nbuf;
}
/* filtered noise: clicks, rasps and the air in a whoosh */
function air(o){
  if(!ctx) return;
  const t = o.t || now(), d = o.d || 0.12;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf(); s.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = o.filter || "highpass";
  f.frequency.setValueAtTime(o.freq || 2000, t);
  if(o.freqTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, o.freqTo), t + d);
  if(o.q) f.Q.value = o.q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.g || 0.06), t + (o.a || 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  s.connect(f); f.connect(g); g.connect(bus);
  s.start(t); s.stop(t + d + 0.05);
}
/* a marimba-ish note: the fourth partial is what makes it sound wooden */
function mallet(f, t, g, d){
  tone({ f: f,      t: t, a: .004, d: d || .34, g: (g || .12),        type: "sine" });
  tone({ f: f * 4,  t: t, a: .003, d: (d || .34) * .45, g: (g || .12) * .30, type: "sine" });
}
/* the token itself — struck metal, inharmonic and bright */
function coinRing(t, g){
  [[2100, 1, .46], [3170, .58, .34], [4480, .36, .24], [5900, .18, .17]]
    .forEach(p => tone({ f: p[0], t: t, a: .002, d: p[2], g: (g || .10) * p[1], type: "sine" }));
  air({ t: t, d: .03, g: (g || .10) * .5, freq: 6000 });
}
const seq = (notes, t0, g, d) => notes.forEach((n, i) => mallet(n, t0 + i * (d || .075), g));

/* ---------------- the sounds ---------------- */
const S = {
  tap:   () => tone({ f: 640, d: .05, g: .045, type: "triangle" }),
  nope:  () => { tone({ f: 220, to: 170, d: .16, g: .07, type: "sine" }); },

  /* the lobby */
  join:  () => { mallet(523.25, now(), .09); mallet(783.99, now() + .085, .08); },
  start: () => seq([392, 523.25, 659.25, 783.99], now(), .11, .085),

  /* your turn to give the clue */
  turn:  () => { mallet(659.25, now(), .10); mallet(987.77, now() + .11, .085); },
  /* a word is worth 2..5, so the blip climbs with the price */
  word:  v => tone({ f: 440 * Math.pow(2, ((v || 3) - 2) / 12 * 2), d: .09, g: .07, type: "triangle" }),
  aim:   () => { air({ d: .05, g: .05, freq: 3200 }); tone({ f: 330, t: now() + .04, d: .12, g: .07 }); },
  go:    () => { air({ d: .26, g: .05, filter: "lowpass", freq: 300, freqTo: 1400 });
                 mallet(523.25, now() + .16, .10); },

  /* the clock. warn once when the ring turns red, then count the last ten */
  warn:  () => { tone({ f: 880, d: .1, g: .07, type: "triangle" });
                 tone({ f: 740, t: now() + .12, d: .14, g: .07, type: "triangle" }); },
  tick:  n => { const hot = n <= 3;
                 air({ d: .022, g: hot ? .075 : .05, freq: 3000 });
                 tone({ f: hot ? 1400 : 1050, d: hot ? .06 : .04, g: hot ? .07 : .045, type: "square" }); },
  timeup: () => { tone({ f: 300, to: 120, d: .5, g: .10, type: "sawtooth" });
                  air({ d: .3, g: .04, filter: "lowpass", freq: 800 }); },

  /* the dome */
  press: () => { air({ d: .06, g: .13, filter: "lowpass", freq: 800 }); },
  buzz:  () => { const t = now();
                 [146, 292, 438].forEach((f, i) =>
                   tone({ f: f, t: t, a: .004, h: .18, d: .1, g: .085 / (i + 1), type: "sawtooth" }));
                 air({ t: t, d: .26, g: .03, filter: "bandpass", freq: 900, q: 1.2 }); },

  /* judging */
  correct: () => { const t = now(); seq([523.25, 659.25, 783.99, 1046.5], t, .075, .07);
                   coinRing(t + .1, .055); },
  wrong:   () => { tone({ f: 392, d: .13, g: .075, type: "triangle" });
                   tone({ f: 311.13, t: now() + .13, d: .22, g: .075, type: "triangle" }); },
  /* nobody got there — sympathy, not punishment */
  nobody:  () => { tone({ f: 440, to: 349.23, d: .34, g: .07, type: "sine" });
                   mallet(261.63, now() + .2, .07); },

  /* cards and the board */
  card:  () => { air({ d: .17, g: .055, filter: "bandpass", freq: 1800, q: .8, freqTo: 600 });
                 mallet(880, now() + .07, .08); },
  deal:  () => { air({ d: .13, g: .05, filter: "highpass", freq: 1500 });
                 mallet(698.46, now() + .06, .09); },
  step:  () => tone({ f: 520, to: 700, d: .07, g: .05, type: "triangle" }),
  land:  () => { mallet(587.33, now(), .10); mallet(880, now() + .07, .075); },

  /* the end */
  win:   () => { const t = now();
                 seq([523.25, 659.25, 783.99, 1046.5, 1318.5], t, .10, .095);
                 coinRing(t + .42, .07);
                 [1568, 2093, 2637].forEach((f, i) =>
                   tone({ f: f, t: t + .5 + i * .07, d: .5, g: .05, type: "sine" })); }
};

/* one voice per face, because choosing yours should feel like something */
const FACES_SND = {
  boy:     t => { mallet(523.25, t, .10); mallet(659.25, t + .08, .09); },
  girl:    t => { mallet(587.33, t, .10); mallet(783.99, t + .08, .09); },
  grandpa: t => { mallet(329.63, t, .11, .5); mallet(392, t + .13, .09, .5); },
  grandma: t => { tone({ f: 392, t: t, d: .3, g: .09, type: "sine" });
                  tone({ f: 493.88, t: t + .1, d: .34, g: .08, type: "sine", detune: 12 }); },
  hippy:   t => seq([329.63, 415.3, 493.88, 587.33], t, .085, .07),
  beard:   t => { mallet(293.66, t, .11, .45); mallet(349.23, t + .11, .09, .45); },
  curly:   t => { mallet(523.25, t, .09, .2); mallet(523.25, t + .07, .08, .2);
                  mallet(659.25, t + .14, .10); },
  beanie:  t => { tone({ f: 466.16, t: t, d: .09, g: .07, type: "square" });
                  tone({ f: 622.25, t: t + .08, d: .14, g: .07, type: "square" }); },
  astro:   t => { tone({ f: 880, to: 240, t: t, d: .3, g: .08, type: "sine" });
                  [1568, 2093].forEach((f, i) => tone({ f: f, t: t + .18 + i * .06, d: .22, g: .045 })); },
  robot:   t => [400, 620, 500].forEach((f, i) =>
                  tone({ f: f, t: t + i * .07, d: .06, g: .06, type: "square" })),
  fox:     t => { tone({ f: 700, to: 1250, t: t, a: .004, d: .11, g: .075, type: "triangle" });
                  tone({ f: 1100, to: 820, t: t + .12, d: .09, g: .06, type: "triangle" }); },
  cat:     t => { tone({ f: 620, to: 980, t: t, a: .03, h: .05, d: .12, g: .075, type: "triangle" });
                  tone({ f: 900, to: 660, t: t + .2, a: .02, d: .18, g: .06, type: "triangle" }); },
  owl:     t => [0, .26].forEach(o => {
                  tone({ f: 392, to: 370, t: t + o, a: .05, h: .06, d: .14, g: .085, type: "sine" }); }),
  frog:    t => { for(let i = 0; i < 5; i++)
                    tone({ f: 210 - i * 14, t: t + i * .035, a: .003, d: .035, g: .085, type: "sawtooth" });
                  air({ t: t, d: .16, g: .03, filter: "bandpass", freq: 400, q: 2 }); },
  panda:   t => { mallet(261.63, t, .11, .4); mallet(261.63, t + .12, .085, .4); }
};

/* ---------------- playing ---------------- */
function play(name, arg){
  if(off || !ready()) return;
  try{
    if(name === "pick"){
      const f = FACES_SND[arg] || FACES_SND.boy;
      f(now());
      try{ document.dispatchEvent(new CustomEvent("asimon:sound", { detail: { name: name, arg: arg } })); }catch(e){}
      return;
    }
    const fn = S[name];
    if(fn) fn(arg);
  }catch(e){}
  /* so the page can watch what it just heard — used by the tests, and
     handy if something visual ever wants to answer a sound */
  try{ document.dispatchEvent(new CustomEvent("asimon:sound", { detail: { name: name, arg: arg } })); }catch(e){}
}

/* ---------------- what is worth hearing ---------------- */
/* app.js replaces #app wholesale on every render and nudges the clock five
   times a second, so watching the DOM would mean watching noise. The state
   it holds is the honest signal: poll it and act on what changed.        */
let was = null, tickedAt = -1, warned = false, endedFor = -1;

function look(){
  let s = null, scr = "";
  try{ s = (typeof state !== "undefined") ? state : null;
       scr = (typeof screen !== "undefined") ? screen : ""; }catch(e){}
  const now_ = s ? {
    phase: s.phase, round: s.round || 0, players: (s.players || []).length,
    isGiver: !!s.isGiver, solved: s.result ? (s.result.solvedBy || "none") : null,
    over: s.phase === "over", award: !!(s.award && s.award.mine), scr: scr
  } : { phase: "-", round: 0, players: 0, isGiver: false, solved: null, over: false, award: false, scr: scr };

  if(was === null){ was = now_; return; }        /* the first look is silent */
  const p = was, n = now_;

  if(n.phase === "lobby" && n.players > p.players) play("join");
  if(p.phase !== n.phase){
    if(p.phase === "lobby" && n.phase !== "lobby") play("start");
    else if(n.phase === "giver" && n.isGiver) play("turn");
    else if(n.phase === "table" && p.phase !== "judge") play("go");
    else if(n.phase === "judge") play("buzz");
    else if(n.phase === "table" && p.phase === "judge") play("wrong");
    else if(n.phase === "reveal") play(n.solved && n.solved !== "none" ? "correct" : "nobody");
    else if(n.phase === "over") play("win");
    if(n.phase !== "table"){ warned = false; tickedAt = -1; }
  }
  if(n.award && !p.award) play("deal");

  /* the clock, while it is running */
  if(n.phase === "table"){
    let left = -1;
    try{ left = (typeof remain === "function") ? remain() : -1; }catch(e){}
    if(left >= 0){
      const sec = Math.ceil(left / 1000);
      if(!warned && left > 0 && left <= 15200){ warned = true; play("warn"); }
      if(sec <= 10 && sec > 0 && sec !== tickedAt){ tickedAt = sec; play("tick", sec); }
      if(left <= 0 && endedFor !== n.round){ endedFor = n.round; play("timeup"); }
    }
  }
  was = now_;
}

/* ---------------- taps ---------------- */
/* Delegated, in the capture phase, so a sound is heard the instant a finger
   lands rather than after the server has agreed. */
document.addEventListener("pointerdown", () => { ready(); }, { passive: true, capture: true });
document.addEventListener("click", ev => {
  if(off) return;
  const el = ev.target && ev.target.closest ? ev.target.closest("button,[data-go]") : null;
  if(!el) return;
  const d = el.dataset || {};
  if(el.id === "sfxbtn") return;
  if(d.face || d.reface) play("pick", d.face || d.reface);
  else if(d.w !== undefined || d.sw !== undefined){
    const wv = el.querySelector(".wv");
    play("word", wv ? Number(wv.textContent) : 3);
  }
  else if(d.aim !== undefined) play("aim");
  else if(d.hand !== undefined || d.card !== undefined) play("card");
  else if(d.up !== undefined || d.take !== undefined) play("deal");
  else if(d.go !== undefined) play("step");
  else if(el.classList.contains("buzz") || el.id === "bz") play("press");
  else if(el.id === "go") play("land");
  else if(el.id === "start" || el.id === "create" || el.id === "again") play("tap");
  else play("tap");
}, true);

/* ---------------- the switch ---------------- */
const ICON = m => '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" ' +
  'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M11 5 6.5 9H3v6h3.5L11 19z"/>' +
  (m ? '<path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>'
     : '<path d="M15.6 8.6a4.8 4.8 0 0 1 0 6.8M18.3 6a8.5 8.5 0 0 1 0 12"/>') + '</svg>';

function paintBtn(){
  const b = document.getElementById("sfxbtn");
  if(!b) return;
  b.innerHTML = ICON(off);
  b.classList.toggle("muted", off);
  b.setAttribute("aria-pressed", off ? "true" : "false");
  b.setAttribute("aria-label", off
    ? (document.documentElement.lang === "en" ? "Turn sound on" : "להפעיל צלילים")
    : (document.documentElement.lang === "en" ? "Turn sound off" : "לכבות צלילים"));
}
function mount(){
  const css = document.createElement("style");
  css.textContent =
    /* it floats over whatever the screen is showing, so it is translucent ink
       rather than paper — that reads as a control on the black room card and
       on the light screens alike */
    '#sfxbtn{position:fixed;top:calc(8px + env(safe-area-inset-top));left:8px;z-index:70;' +
      'width:32px;height:32px;padding:0;border-radius:50%;display:grid;place-items:center;' +
      'background:rgba(23,22,28,.5);color:#fff;border:1px solid rgba(255,255,255,.28);' +
      '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);' +
      'box-shadow:0 4px 14px -8px rgba(23,22,28,.6);cursor:pointer;' +
      'opacity:.5;transition:opacity .15s ease,background .15s ease}' +
    '#sfxbtn:hover,#sfxbtn:focus-visible{opacity:1}' +
    '#sfxbtn.muted{background:rgba(216,53,28,.62);opacity:.85}' +
    '';
  document.head.appendChild(css);

  const b = document.createElement("button");
  b.id = "sfxbtn"; b.type = "button";
  b.onclick = () => {
    off = !off;
    try{ localStorage.setItem(KEY, off ? "off" : "on"); }catch(e){}
    paintBtn();
    if(!off){ ready(); play("tap"); }
  };
  document.body.appendChild(b);
  paintBtn();
  setInterval(look, 120);
}

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
else mount();

/* a hand-hold for tests: render one sound offline and measure it */
window.SFX = {
  play: play,
  muted: () => off,
  _use: (c, b) => { ctx = c; bus = b; nbuf = null; },
  _names: () => Object.keys(S).concat(Object.keys(FACES_SND).map(k => "pick:" + k))
};

})();
