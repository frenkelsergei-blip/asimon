/* Asimon — the drawn bits.
   Card faces, the draining clock ring, and the burst when someone lands it.
   Everything here checks prefers-reduced-motion before it moves.            */
"use strict";

const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- the mark ---------------- */
/* The asimon: a struck token, milled edge, groove inset so it stays a channel
   and not a prohibition sign. Two cuts of the same coin — the milling closes
   into a solid ring below about 40px, so small sizes drop it and keep the rim,
   which is the part that gives an amber disc an edge on paper.               */
const COIN_FACE = "#FFB020", COIN_RIM = "#D18A08", COIN_INK = "#17161C";

function coinSvg(css, milled){
  return '<svg viewBox="0 0 100 100" style="'+css+'" aria-hidden="true">'+
    '<circle cx="50" cy="50" r="50" fill="'+COIN_RIM+'"/>'+
    (milled ? '<circle cx="50" cy="50" r="47" fill="none" stroke="'+COIN_INK+'" stroke-width="6" '+
              'stroke-dasharray="3 6.2285" stroke-linecap="butt" opacity=".85"/>' : '')+
    '<circle cx="50" cy="50" r="'+(milled ? 42 : 43)+'" fill="'+COIN_FACE+'"/>'+
    '<rect x="26" y="41" width="48" height="18" rx="9" fill="'+COIN_INK+'" '+
      'transform="rotate(-30 50 50)"/></svg>';
}

/* the same token as a shape inside somebody else's 40x40 drawing */
function coin(cx, cy, r, milled){
  const k = r / 50;
  return '<g transform="translate('+(cx - r)+','+(cy - r)+') scale('+k.toFixed(4)+')">'+
    '<circle cx="50" cy="50" r="50" fill="'+COIN_RIM+'"/>'+
    (milled ? '<circle cx="50" cy="50" r="47" fill="none" stroke="'+COIN_INK+'" stroke-width="6" '+
              'stroke-dasharray="3 6.2285" stroke-linecap="butt" opacity=".85"/>' : '')+
    '<circle cx="50" cy="50" r="'+(milled ? 42 : 43)+'" fill="'+COIN_FACE+'"/>'+
    '<rect x="26" y="41" width="48" height="18" rx="9" fill="'+COIN_INK+'" '+
      'transform="rotate(-30 50 50)"/></g>';
}

/* the token on its own, at a pixel size */
function coinMark(px){
  return coinSvg("width:"+px+"px;height:"+px+"px;display:block", px >= 40);
}

/* the wordmark: the round letter — ס in Hebrew, O in English — is the token.
   Set in the logo face; the h1 around it keeps its own size.                 */
function wordmark(lg){
  const he = lg === "he";
  const tok = coinSvg("width:.78em;height:.78em;display:inline-block;vertical-align:"+
                      (he ? "-.05" : "-.06")+"em", false);
  return he ? '<span class="wm">א'+tok+'ימון</span>'
            : '<span class="wm en">ASIM'+tok+'N</span>';
}

/* ---------------- card faces ---------------- */
/* The seven cards, drawn the way the fifteen faces are: a 40x40 box of flat
   shapes on a coloured disc, no hairlines, so one drawing serves a 200px card
   face, a 34px banner tile and a 23px pip in a card's corner.               */

const CARD_ART = {
  /* a white dial on the red field — the one shape that survives 23px */
  stopwatch:
    '<rect x="16.2" y="1.6" width="7.6" height="4.6" rx="2.3" fill="#17161C"/>'+
    '<rect x="17.9" y="5.4" width="4.2" height="4" fill="#17161C"/>'+
    '<rect x="29.6" y="6.2" width="6.4" height="3.8" rx="1.9" fill="#17161C" transform="rotate(42 32.8 8.1)"/>'+
    '<circle cx="20" cy="23.6" r="14.6" fill="#17161C"/>'+
    '<circle cx="20" cy="23.6" r="11.4" fill="#FFFFFF"/>'+
    '<rect x="18.4" y="14" width="3.2" height="11.2" rx="1.6" fill="#17161C"/>'+
    '<circle cx="20" cy="23.6" r="2.4" fill="#17161C"/>'+
    '<rect x="19" y="11.4" width="2" height="2.6" rx="1" fill="#17161C"/>'+
    '<rect x="30" y="22.6" width="2.6" height="2" rx="1" fill="#17161C"/>'+
    '<rect x="7.4" y="22.6" width="2.6" height="2" rx="1" fill="#17161C"/>',

  /* the four words, face up. Each card is cut clear of its neighbour by a
     ring of the field colour, or they merge into one white blob. */
  insight: (function(){
    const F = "#7A5AF8";
    const card = (rot) =>
      '<g transform="rotate('+rot+')">'+
        '<rect x="-9.9" y="-27.4" width="19.8" height="24.8" rx="4.8" fill="'+F+'"/>'+
        '<rect x="-7.3" y="-24.8" width="14.6" height="19.6" rx="3" fill="#FFFFFF"/>'+
        '<rect x="-7.3" y="-24.8" width="14.6" height="7" rx="3" fill="#5E3FDB"/>'+
        '<rect x="-7.3" y="-21.8" width="14.6" height="4" fill="#5E3FDB"/>'+
        '<rect x="-4.6" y="-14.2" width="9.2" height="2.8" rx="1.4" fill="#C4B5FD"/>'+
      '</g>';
    return '<g transform="translate(20 33.4)">'+ card(-25) + card(0) + card(25) + '</g>';
  })(),

  /* the sentence struck out, a fresh one already rising behind it */
  veto:
    '<path d="M19.4 3.4h13.2A5.4 5.4 0 0 1 38 8.8v5.8a5.4 5.4 0 0 1-5.4 5.4h-1.4l.9 4.2-4.7-4.2h-8a5.4 5.4 0 0 1-5.4-5.4V8.8a5.4 5.4 0 0 1 5.4-5.4Z" fill="#B77800"/>'+
    '<path d="M6.6 11.6h16.8a5.6 5.6 0 0 1 5.6 5.6v8.2a5.6 5.6 0 0 1-5.6 5.6H14l-5.8 5.2 1.1-5.2h-2.7A5.6 5.6 0 0 1 1 25.4v-8.2a5.6 5.6 0 0 1 5.6-5.6Z" fill="#FFFFFF"/>'+
    '<rect x="7.2" y="19.4" width="15.6" height="3.8" rx="1.9" fill="#17161C" transform="rotate(38 15 21.3)"/>'+
    '<rect x="7.2" y="19.4" width="15.6" height="3.8" rx="1.9" fill="#17161C" transform="rotate(-38 15 21.3)"/>',

  /* a mime: white face, beret, sealed mouth. The stripes are ink, so the
     same drawing works on the blue card and the red Mime round. */
  mime:
    '<path d="M5.5 40c0-7.6 6.5-11.2 14.5-11.2S34.5 32.4 34.5 40Z" fill="#F8FAFC"/>'+
    '<rect x="6.4" y="31.4" width="27.2" height="2.8" fill="#17161C"/>'+
    '<rect x="7.2" y="36.2" width="25.6" height="2.8" fill="#17161C"/>'+
    '<circle cx="20" cy="18.4" r="11.6" fill="#FFFFFF"/>'+
    '<ellipse cx="20" cy="8.4" rx="11.8" ry="4.8" fill="#17161C"/>'+
    '<circle cx="20" cy="4.2" r="2.5" fill="#17161C"/>'+
    '<circle cx="15.4" cy="17.4" r="2" fill="#17161C"/>'+
    '<circle cx="24.6" cy="17.4" r="2" fill="#17161C"/>'+
    '<rect x="16.6" y="24" width="6.8" height="2.4" rx="1.2" fill="#17161C"/>',

  /* two tokens instead of one. A white rim cuts the front coin clear of the
     back one on any field colour. */
  double:
    '<circle cx="11.4" cy="20.6" r="11.4" fill="#FFFFFF"/>'+ coin(11.4, 20.6, 9.6, false)+
    '<circle cx="28.6" cy="20.6" r="11.4" fill="#FFFFFF"/>'+ coin(28.6, 20.6, 9.6, false),

  /* two arrows, the plainest thing that means "change places" */
  swap:
    '<path d="M4 12.4h22.6l-5.6-5.6 4-4 12.4 12.4L25 27.6l-4-4 5.6-5.6H4Z" fill="#FFFFFF"/>'+
    '<path d="M36 27.6H13.4l5.6 5.6-4 4L2.6 24.8 15 12.4l4 4-5.6 5.6H36Z" fill="#FFB020"/>',

  /* a soft wide band across the eyes; the smile stays visible */
  blindfold:
    '<path d="M5.5 40c0-7.6 6.5-11.2 14.5-11.2S34.5 32.4 34.5 40Z" fill="#FFFFFF"/>'+
    '<circle cx="20" cy="18.6" r="11.8" fill="#F2C79E"/>'+
    '<path d="M8.4 13.2a11.8 11.8 0 0 1 23.2 0Z" fill="#3B2A1A"/>'+
    '<path d="M31.6 16.4 36.4 14l-.9 4.4.9 4.4-4.8-2.4Z" fill="#17161C"/>'+
    '<rect x="5.6" y="14.2" width="27.6" height="8.4" rx="4.2" fill="#17161C"/>'+
    '<path d="M16 25.8q4 3.4 8 0" stroke="#2A2118" stroke-width="2" fill="none" stroke-linecap="round"/>'
};

/* the tone each card is set in */
const CARD_TONE = {
  stopwatch:"guilty", insight:"violet", veto:"blind", mime:"accent",
  double:"good", swap:"ink", blindfold:"violet"
};
/* the disc each emblem sits on, and the field its card is printed in */
const CARD_HUE = {
  stopwatch:"#FF5A3D", insight:"#7A5AF8", veto:"#FFB020", mime:"#2C6BFF",
  double:"#12B886", swap:"#46445A", blindfold:"#7A5AF8"
};
const PC = {
  guilty:{ deep:"#D8351C", soft:"#FFEDE9", ink:"#D8351C" },
  violet:{ deep:"#5E3FDB", soft:"#F1EDFE", ink:"#5E3FDB" },
  blind: { deep:"#D18A08", soft:"#FFF3DB", ink:"#B77800" },
  accent:{ deep:"#1B4FD1", soft:"#EAF0FF", ink:"#1B4FD1" },
  good:  { deep:"#0D8F69", soft:"#E6F7F1", ink:"#0D8F69" },
  ink:   { deep:"#17161C", soft:"#F4F2FA", ink:"#17161C" }
};

/* the emblem alone, on its disc */
function cardEmblem(key, px){
  const a = CARD_ART[key] || CARD_ART.insight, s = px || 40;
  return '<svg class="em" viewBox="0 0 40 40" width="'+s+'" height="'+s+'" aria-hidden="true">'+
         '<circle cx="20" cy="20" r="20" fill="'+(CARD_HUE[key]||"#2C6BFF")+'"/>'+
         '<g clip-path="url(#lsface)">'+a+'</g></svg>';
}
/* the small form, wherever a card is named in a row or a banner */
function cardTile(key, size){
  return '<span class="ctile t-'+(CARD_TONE[key]||"accent")+'">'+cardEmblem(key, size || 46)+'</span>';
}

/* ---------------- a card, as a card ---------------- */
/* Portrait, five by seven. A field in the card's own tone, a paler panel
   inside it, the emblem large, the name beneath, and the emblem again small
   in two opposite corners — the index a playing card carries.               */
function cardFace(key, name, w, opts){
  const o = opts || {}, t = PC[CARD_TONE[key]] || PC.accent;
  const h = Math.round(w * 7 / 5), pad = Math.max(5, Math.round(w * .055));
  const pip = (rot) => '<span class="pcx" style="'+rot+'">'+cardEmblem(key, Math.round(w * .105))+'</span>';
  return '<span class="pcard'+(o.cls ? " " + o.cls : "")+'"'+(o.attr || "")+
    ' style="width:'+w+'px;height:'+h+'px;border-radius:'+Math.round(w*.1)+'px;background:'+t.deep+';'+
    'padding:'+pad+'px'+(o.style ? ";" + o.style : "")+'">'+
    '<span class="pcf" style="border-radius:'+Math.round(w*.062)+'px;background:'+t.soft+';'+
      'gap:'+Math.round(w*.06)+'px">'+
      pip('inset-inline-start:'+Math.round(w*.055)+'px;top:'+Math.round(w*.055)+'px')+
      pip('inset-inline-end:'+Math.round(w*.055)+'px;bottom:'+Math.round(w*.055)+'px;transform:rotate(180deg)')+
      cardEmblem(key, Math.round(w * .44))+
      '<span class="pcn" style="font-size:'+Math.max(11, Math.round(w * .118))+'px;color:'+t.ink+'">'+
        name+'</span>'+
    '</span></span>';
}
/* one back for every card, so a row of them reads as a deck at a glance */
function cardBack(w, opts){
  const o = opts || {}, h = Math.round(w * 7 / 5), pad = Math.max(5, Math.round(w * .055));
  const dot = Math.max(7, Math.round(w * .075));
  return '<span class="pcard'+(o.cls ? " " + o.cls : "")+'"'+(o.attr || "")+
    ' style="width:'+w+'px;height:'+h+'px;border-radius:'+Math.round(w*.1)+'px;background:'+COIN_INK+';'+
    'padding:'+pad+'px'+(o.style ? ";" + o.style : "")+'">'+
    '<span class="pcb" style="border-radius:'+Math.round(w*.062)+'px;'+
      'background-size:'+dot+'px '+dot+'px">'+
      '<svg viewBox="0 0 40 40" width="'+Math.round(w*.42)+'" height="'+Math.round(w*.42)+'" aria-hidden="true">'+
      coin(20, 20, 16.5, true)+'</svg></span></span>';
}

/* ---------------- the clock, as a draining ring ---------------- */
const RING_R = 66, RING_C = 2 * Math.PI * RING_R;
function clockRing(label){
  return '<div class="ring">'+
    '<svg viewBox="0 0 160 160" aria-hidden="true">'+
      '<circle class="ring-bg" cx="80" cy="80" r="'+RING_R+'"/>'+
      '<circle class="ring-fg" id="ring" cx="80" cy="80" r="'+RING_R+'" '+
        'stroke-dasharray="'+RING_C.toFixed(1)+'" stroke-dashoffset="0"/>'+
    '</svg>'+
    '<div class="bigclock" id="clk">'+label+'</div></div>';
}
function setRing(frac){
  const el = document.getElementById("ring");
  if(!el) return;
  const f = Math.max(0, Math.min(1, frac));
  el.setAttribute("stroke-dashoffset", (RING_C * (1 - f)).toFixed(1));
}

/* ---------------- the burst when it lands ---------------- */
let burstCanvas = null;
function burst(opts){
  if(REDUCED) return;
  const o = opts || {};
  if(!burstCanvas){
    burstCanvas = document.createElement("canvas");
    burstCanvas.className = "burst";
    document.body.appendChild(burstCanvas);
  }
  const cv = burstCanvas, ctx = cv.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = cv.width  = innerWidth  * dpr;
  const h = cv.height = innerHeight * dpr;
  cv.style.width = innerWidth + "px";
  cv.style.height = innerHeight + "px";

  const colors = o.colors || ["#12B886","#2C6BFF","#FFB020","#FF5A3D","#7A5AF8"];
  const cx = (o.x !== undefined ? o.x : innerWidth / 2) * dpr;
  const cy = (o.y !== undefined ? o.y : innerHeight * 0.34) * dpr;
  const n = o.count || 90;
  const bits = [];
  for(let i = 0; i < n; i++){
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const speed = (4 + Math.random() * 9) * dpr;
    bits.push({
      x:cx, y:cy,
      vx:Math.cos(a) * speed * (0.6 + Math.random() * 0.8),
      vy:Math.sin(a) * speed - 5 * dpr,
      w:(4 + Math.random() * 5) * dpr,
      h:(7 + Math.random() * 7) * dpr,
      rot:Math.random() * Math.PI,
      spin:(Math.random() - 0.5) * 0.35,
      col:colors[(Math.random() * colors.length) | 0],
      life:0
    });
  }
  const TTL = 95;
  let frame = 0, raf = 0;
  function step(){
    ctx.clearRect(0, 0, w, h);
    frame++;
    let alive = 0;
    for(const b of bits){
      b.life++;
      if(b.life > TTL) continue;
      alive++;
      b.vy += 0.42 * dpr;
      b.vx *= 0.99;
      b.x += b.vx; b.y += b.vy; b.rot += b.spin;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - b.life / TTL);
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.col;
      ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h);
      ctx.restore();
    }
    if(alive && frame < TTL + 10) raf = requestAnimationFrame(step);
    else { ctx.clearRect(0, 0, w, h); cancelAnimationFrame(raf); }
  }
  step();
}

/* the card you just played, thrown into the middle of the screen. Drawn from
   the element you tapped, so it leaves from where your thumb was.          */
function throwCard(el){
  if(REDUCED || !el) return;
  const r = el.getBoundingClientRect();
  if(!r.width) return;
  const g = document.createElement("div");
  g.className = "thrown";
  g.style.cssText = "left:"+r.left+"px;top:"+r.top+"px;width:"+r.width+"px;height:"+r.height+"px";
  g.innerHTML = el.innerHTML;
  document.body.appendChild(g);
  const dx = innerWidth / 2 - (r.left + r.width / 2);
  const dy = innerHeight * 0.36 - (r.top + r.height / 2);
  requestAnimationFrame(() => {
    g.style.transform = "translate("+dx.toFixed(0)+"px,"+dy.toFixed(0)+"px) scale(1.85)";
    g.style.opacity = "0";
  });
  setTimeout(() => g.remove(), 640);
}

/* a quick coloured flash behind the whole screen — used when a card lands */
function flash(tone){
  if(REDUCED) return;
  const el = document.createElement("div");
  el.className = "flash t-" + (tone || "accent");
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

/* ============================================================
   The cast. Fifteen faces: people first, then a few creatures.
   Each is drawn in a 40x40 box on its own coloured disc, so the
   same art serves a 46px picker tile and a 23px board token.
   ============================================================ */
const SKIN = { light:"#F2C79E", tan:"#D99A6C", deep:"#8D5524", old:"#EFCBAA" };
const LINE = "#2A2118";
function eyes(y, c){
  const f = c || LINE;
  /* named so gestures.css can close one of them — a wink needs to know
     which eye it is holding */
  return '<circle class="ey el" cx="16" cy="'+y+'" r="1.6" fill="'+f+'"/>'+
         '<circle class="ey er" cx="24" cy="'+y+'" r="1.6" fill="'+f+'"/>';
}
function smile(y){
  return '<path d="M16.4 '+y+'q3.6 3 7.2 0" stroke="'+LINE+'" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
}
/* shoulders, head, then whatever makes this one a person */
function person(o){
  return '<path d="M5.5 40c0-8 6.5-11.6 14.5-11.6S34.5 32 34.5 40Z" fill="'+o.shirt+'"/>'+
         '<circle cx="20" cy="18.5" r="11" fill="'+(o.skin || SKIN.light)+'"/>'+
         (o.hair || "") + (o.eyes || eyes(18)) + (o.mouth || smile(23.4)) + (o.extra || "");
}

const FACES = [
  { id:"boy", bg:"#2C6BFF", art: person({
      shirt:"#1B4FD1",
      hair:'<ellipse cx="20" cy="11.4" rx="11" ry="6.2" fill="#3B2A1A"/>' }) },

  { id:"girl", bg:"#DB2777", art: person({
      shirt:"#A81A5B",
      hair:'<rect x="8.2" y="13" width="4" height="16" rx="2" fill="#4A2C17"/>'+
           '<rect x="27.8" y="13" width="4" height="16" rx="2" fill="#4A2C17"/>'+
           '<ellipse cx="20" cy="12" rx="11.8" ry="7" fill="#4A2C17"/>' }) },

  { id:"grandpa", bg:"#78716C", art: person({
      shirt:"#57534E", skin:SKIN.old,
      hair:'<ellipse cx="10.4" cy="16.5" rx="2.7" ry="4.6" fill="#D6D3D1"/>'+
           '<ellipse cx="29.6" cy="16.5" rx="2.7" ry="4.6" fill="#D6D3D1"/>'+
           '<ellipse cx="20" cy="9.6" rx="7.6" ry="2.4" fill="#D6D3D1"/>',
      extra:'<ellipse cx="20" cy="25.4" rx="5.4" ry="2.1" fill="#D6D3D1"/>'+
            '<circle cx="15.4" cy="17.8" r="3.6" fill="none" stroke="#3F3A36" stroke-width="1.1"/>'+
            '<circle cx="24.6" cy="17.8" r="3.6" fill="none" stroke="#3F3A36" stroke-width="1.1"/>'+
            '<path d="M19 17.8h2M11.8 17.2l-2.4-.6M28.2 17.2l2.4-.6" stroke="#3F3A36" stroke-width="1.1" stroke-linecap="round"/>',
      eyes: eyes(17.8),
      mouth:'<path d="M17.4 28.4h5.2" stroke="'+LINE+'" stroke-width="1.3" stroke-linecap="round"/>' }) },

  { id:"grandma", bg:"#7A5AF8", art: person({
      shirt:"#5E3FDB", skin:SKIN.old,
      hair:'<circle cx="20" cy="5.4" r="4.4" fill="#E7E5E4"/>'+
           '<ellipse cx="20" cy="11.6" rx="11.2" ry="6.6" fill="#E7E5E4"/>',
      extra:'<circle cx="15.4" cy="17.8" r="3.6" fill="none" stroke="#3B2E6B" stroke-width="1.1"/>'+
            '<circle cx="24.6" cy="17.8" r="3.6" fill="none" stroke="#3B2E6B" stroke-width="1.1"/>'+
            '<path d="M19 17.8h2M11.8 17.2l-2.4-.6M28.2 17.2l2.4-.6" stroke="#3B2E6B" stroke-width="1.1" stroke-linecap="round"/>',
      eyes: eyes(17.8) }) },

  { id:"hippy", bg:"#12B886", art: person({
      shirt:"#0D8F69",
      hair:'<rect x="7.4" y="12" width="4.4" height="18" rx="2.2" fill="#7C4A21"/>'+
           '<rect x="28.2" y="12" width="4.4" height="18" rx="2.2" fill="#7C4A21"/>'+
           '<ellipse cx="20" cy="12" rx="12.2" ry="7.4" fill="#7C4A21"/>'+
           '<rect x="8" y="12.4" width="24" height="3.4" rx="1.7" fill="#FF5A3D"/>',
      eyes:'<circle cx="15.2" cy="19.4" r="3.7" fill="#3A2405" opacity=".82"/>'+
           '<circle cx="24.8" cy="19.4" r="3.7" fill="#3A2405" opacity=".82"/>'+
           '<path d="M18.9 19.4h2.2" stroke="#3A2405" stroke-width="1.1"/>',
      mouth: smile(25) }) },

  { id:"beard", bg:"#B45309", art: person({
      shirt:"#92400E", skin:SKIN.tan,
      /* forehead and cheeks stay bare — the dark sits only on the jaw */
      hair:'<ellipse cx="20" cy="10.4" rx="11" ry="5.6" fill="#2F241A"/>'+
           '<ellipse cx="20" cy="27.4" rx="9.4" ry="6.4" fill="#2F241A"/>'+
           '<ellipse cx="20" cy="22.6" rx="4.8" ry="1.8" fill="#2F241A"/>',
      eyes: eyes(17.4),
      mouth:'' }) },

  { id:"curly", bg:"#FF5A3D", art: person({
      shirt:"#C2410C", skin:SKIN.deep,
      hair:'<circle cx="11.8" cy="13.6" r="4.6" fill="#1E1712"/><circle cx="28.2" cy="13.6" r="4.6" fill="#1E1712"/>'+
           '<circle cx="15.6" cy="9.8" r="4.4" fill="#1E1712"/><circle cx="24.4" cy="9.8" r="4.4" fill="#1E1712"/>'+
           '<circle cx="20" cy="8.6" r="4.8" fill="#1E1712"/>',
      eyes: eyes(18.4, "#1E1712"),
      mouth: smile(23.8) }) },

  { id:"beanie", bg:"#0891B2", art: person({
      shirt:"#0E7490",
      hair:'<ellipse cx="20" cy="12.4" rx="11.2" ry="6.6" fill="#F97316"/>'+
           '<rect x="7.8" y="13.2" width="24.4" height="3.8" rx="1.9" fill="#EA580C"/>'+
           '<circle cx="20" cy="5" r="2.6" fill="#EA580C"/>',
      eyes: eyes(20.4), mouth: smile(25.4) }) },

  { id:"astro", bg:"#17161C", art:
      '<path d="M5.5 40c0-8 6.5-11.6 14.5-11.6S34.5 32 34.5 40Z" fill="#E2E8F0"/>'+
      '<rect x="4.6" y="16.4" width="3.4" height="6" rx="1.7" fill="#CBD5E1"/>'+
      '<rect x="32" y="16.4" width="3.4" height="6" rx="1.7" fill="#CBD5E1"/>'+
      '<circle cx="20" cy="19" r="12.4" fill="#F8FAFC"/>'+
      '<circle cx="20" cy="18.4" r="8.8" fill="#1E293B"/>'+
      '<path d="M14.6 15a6.4 6.4 0 0 1 5.2-3" stroke="#93C5FD" stroke-width="1.7" fill="none" stroke-linecap="round"/>' },

  { id:"robot", bg:"#64748B", art:
      '<path d="M5.5 40c0-8 6.5-11.6 14.5-11.6S34.5 32 34.5 40Z" fill="#334155"/>'+
      '<rect x="19.2" y="3.6" width="1.6" height="5.4" rx=".8" fill="#CBD5E1"/>'+
      '<circle cx="20" cy="3" r="2.2" fill="#FFB020"/>'+
      '<rect x="8.6" y="8.6" width="22.8" height="20.4" rx="6.4" fill="#E2E8F0"/>'+
      '<rect x="12.8" y="15" width="5.4" height="5.4" rx="1.7" fill="#0F172A"/>'+
      '<rect x="21.8" y="15" width="5.4" height="5.4" rx="1.7" fill="#0F172A"/>'+
      '<rect x="15.4" y="23.4" width="9.2" height="1.8" rx=".9" fill="#0F172A"/>' },

  { id:"fox", bg:"#F97316", art:
      '<path d="M7 12 11 3 16.5 9.5Z" fill="#C2410C"/><path d="M33 12 29 3 23.5 9.5Z" fill="#C2410C"/>'+
      '<ellipse cx="20" cy="26.5" rx="10" ry="7.5" fill="#FFF1E8"/>'+
      eyes(19) + '<circle cx="20" cy="25" r="2.3" fill="#3A2318"/>' },

  { id:"cat", bg:"#FACC15", art:
      '<path d="M8 13 10.5 4 17 10Z" fill="#CA8A04"/><path d="M32 13 29.5 4 23 10Z" fill="#CA8A04"/>'+
      eyes(20) + '<path d="M20 25 18.4 27h3.2Z" fill="#3A2318"/>'+
      '<path d="M6.5 22h5M6.5 25.5h5M33.5 22h-5M33.5 25.5h-5" stroke="#7C5E06" stroke-width="1.4" stroke-linecap="round"/>' },

  { id:"owl", bg:"#6366F1", art:
      '<path d="M8.5 11 13 4 17.5 10.5Z" fill="#4338CA"/><path d="M31.5 11 27 4 22.5 10.5Z" fill="#4338CA"/>'+
      '<circle cx="14.4" cy="20" r="6.4" fill="#EEF2FF"/><circle cx="25.6" cy="20" r="6.4" fill="#EEF2FF"/>'+
      '<circle cx="14.4" cy="20" r="2.6" fill="#1E1B4B"/><circle cx="25.6" cy="20" r="2.6" fill="#1E1B4B"/>'+
      '<path d="M20 25.5 17.4 29.5h5.2Z" fill="#FFB020"/>' },

  { id:"frog", bg:"#4D7C0F", art:
      '<circle cx="12.5" cy="11" r="6.2" fill="#3F6212"/><circle cx="27.5" cy="11" r="6.2" fill="#3F6212"/>'+
      '<circle cx="12.5" cy="11" r="3.6" fill="#FFFFFF"/><circle cx="27.5" cy="11" r="3.6" fill="#FFFFFF"/>'+
      '<circle cx="12.5" cy="11.4" r="1.8" fill="#14200A"/><circle cx="27.5" cy="11.4" r="1.8" fill="#14200A"/>'+
      '<path d="M11 25q9 7 18 0" stroke="#14200A" stroke-width="2.1" fill="none" stroke-linecap="round"/>' },

  { id:"panda", bg:"#E7E5E4", art:
      '<circle cx="9" cy="9.5" r="5.8" fill="#20202A"/><circle cx="31" cy="9.5" r="5.8" fill="#20202A"/>'+
      '<ellipse cx="13.8" cy="20" rx="5.2" ry="6" fill="#20202A" transform="rotate(-14 13.8 20)"/>'+
      '<ellipse cx="26.2" cy="20" rx="5.2" ry="6" fill="#20202A" transform="rotate(14 26.2 20)"/>'+
      '<circle cx="14.4" cy="20" r="1.9" fill="#FFFFFF"/><circle cx="25.6" cy="20" r="1.9" fill="#FFFFFF"/>'+
      '<ellipse cx="20" cy="27" rx="3" ry="2.2" fill="#20202A"/>' }
];

const FACE_BY_ID = {};
FACES.forEach(f => { FACE_BY_ID[f.id] = f; });
const faceOf = id => FACE_BY_ID[id] || FACES[0];

/* the picker tile and every avatar in the interface */
function faceSvg(id, px){
  const f = faceOf(id), s = px || 34;
  return '<svg class="face" viewBox="0 0 40 40" width="'+s+'" height="'+s+'" aria-hidden="true">'+
         '<circle cx="20" cy="20" r="20" fill="'+f.bg+'"/>'+
         '<g clip-path="url(#lsface)">'+f.art+'</g></svg>';
}
/* the same art as a token on the board, inside the board's own svg */
function faceToken(id, x, y, r){
  const f = faceOf(id), k = r / 20;
  return '<g transform="translate('+(x - r)+','+(y - r)+') scale('+k.toFixed(4)+')">'+
         '<circle cx="20" cy="20" r="20" fill="'+f.bg+'"/>'+
         '<g clip-path="url(#lsface)">'+f.art+'</g></g>'+
         '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="none" stroke="var(--surface)" stroke-width="'+(2.5/k*k).toFixed(2)+'"/>';
}

/* The pin: the shape a token takes on the wall's tilted map. A token lying
   flat on a tipped board is a coin seen edge-on, so it stands up instead —
   the head is the same face at the same size, held above its square, with a
   drop of shadow under it saying which square that is.

   The tail leaves the head where a line from the tip touches it, so the two
   are one silhouette and not a circle with a spike behind it.

   Handed out as a path rather than drawn, because the board also has to put
   initials on one when a player has not picked a face, and it knows how to
   escape a name where this file does not. */
function pinShape(x, y, r){
  const n = v => Math.round(v*10)/10, H = r * 3, cy = y - H;
  const b = Math.acos(Math.max(-1, Math.min(1, r / H)));
  const px = r * Math.sin(b), py = cy + r * Math.cos(b), q = (y - py) * 0.55;
  return { cy, d:'M'+n(x)+' '+n(y)+
    'Q'+n(x - px*0.62)+' '+n(y - q)+' '+n(x - px)+' '+n(py)+
    'A'+n(r)+' '+n(r)+' 0 1 1 '+n(x + px)+' '+n(py)+
    'Q'+n(x + px*0.62)+' '+n(y - q)+' '+n(x)+' '+n(y)+'Z' };
}
/* the drop on the square and the white halo that lifts the pin off whatever
   is behind it — every pin wears both, whatever is printed on its head.

   The drop has to be wider than the halo or the halo rubs it out from the
   inside and the pin goes back to floating, which is the one thing the drop
   is there to stop. */
function pinBase(d, x, y, r){
  const n = v => Math.round(v*10)/10;
  return '<ellipse cx="'+n(x)+'" cy="'+n(y + r*0.08)+'" rx="'+n(r*0.94)+'" ry="'+n(r*0.33)+
    '" fill="var(--ink)" opacity="0.18"/>'+
    '<path d="'+d+'" fill="var(--surface)" stroke="var(--surface)" stroke-width="'+n(r*0.26)+'" stroke-linejoin="round"/>';
}
/* a face on a pin: the tail takes the face's own colour, so a pin still reads
   as whose it is from the far end of the room when the head is half hidden */
function facePin(id, x, y, r){
  const f = faceOf(id), s = pinShape(x, y, r), hr = r * 0.84, k = hr / 20;
  const n = v => Math.round(v*10)/10;
  return pinBase(s.d, x, y, r)+
    '<path d="'+s.d+'" fill="'+f.bg+'"/>'+
    '<g transform="translate('+n(x - hr)+','+n(s.cy - hr)+') scale('+k.toFixed(4)+')">'+
      '<circle cx="20" cy="20" r="20" fill="'+f.bg+'"/>'+
      '<g clip-path="url(#lsface)">'+f.art+'</g></g>';
}

/* ============================================================
   The twenty topics and the seven round twists. Same 40x40 box,
   same disc, so they drop in anywhere a face already goes.
   ============================================================ */
const TOPIC_ART = {
  home: { bg:"#F97316", art:
    '<path d="M4.4 20.6 20 6.6l15.6 14-2.6 2.9L20 12.4 7 23.5Z" fill="#C2410C"/>'+
    '<path d="M8.4 21.2 20 10.8l11.6 10.4V34a1.8 1.8 0 0 1-1.8 1.8H10.2A1.8 1.8 0 0 1 8.4 34Z" fill="#FFF1E8"/>'+
    '<rect x="12" y="19.4" width="7.4" height="7.4" rx="1.4" fill="#FFB020"/>'+
    '<path d="M22.6 35.8V27a1.6 1.6 0 0 1 1.6-1.6h3.2A1.6 1.6 0 0 1 29 27v8.8Z" fill="#C2410C"/>' },

  feel: { bg:"#DB2777", art:
    '<path d="M20 35.4 7.6 23.6a7.7 7.7 0 0 1 .5-11.4 7.7 7.7 0 0 1 10.4.9l1.5 1.6 1.5-1.6a7.7 7.7 0 0 1 10.4-.9 7.7 7.7 0 0 1 .5 11.4Z" fill="#FFFFFF"/>'+
    '<path d="M14.6 19.2a3.9 3.9 0 0 1 .3-5.5" stroke="#F9A8D4" stroke-width="2.6" fill="none" stroke-linecap="round"/>' },

  move: { bg:"#0891B2", art:
    '<path d="M14.6 12.4V9.2a2.8 2.8 0 0 1 2.8-2.8h5.2a2.8 2.8 0 0 1 2.8 2.8v3.2h-3.8V10.2h-3.2v2.2Z" fill="#ECFEFF"/>'+
    '<rect x="5" y="12.4" width="30" height="21.4" rx="3.4" fill="#ECFEFF"/>'+
    '<rect x="5" y="19" width="30" height="4.6" fill="#0E7490"/>'+
    '<rect x="11.6" y="17" width="3.4" height="8.6" rx="1.2" fill="#FFB020"/>'+
    '<rect x="25" y="17" width="3.4" height="8.6" rx="1.2" fill="#FFB020"/>' },

  folk: { bg:"#2C6BFF", art:
    '<path d="M0 36.6c0-5.4 4.4-8.2 9.8-8.2s9.8 2.8 9.8 8.2Z" fill="#93C5FD"/>'+
    '<circle cx="9.8" cy="19.4" r="6.6" fill="#93C5FD"/>'+
    '<path d="M20.4 36.6c0-5.4 4.4-8.2 9.8-8.2s9.8 2.8 9.8 8.2Z" fill="#93C5FD"/>'+
    '<circle cx="30.2" cy="19.4" r="6.6" fill="#93C5FD"/>'+
    '<path d="M6.6 38.4c0-7.6 5.6-11 13.4-11s13.4 3.4 13.4 11Z" fill="#2C6BFF"/>'+
    '<circle cx="20" cy="17.6" r="10" fill="#2C6BFF"/>'+
    '<path d="M8.4 38.4c0-6.2 5-9.2 11.6-9.2s11.6 3 11.6 9.2Z" fill="#FFFFFF"/>'+
    '<circle cx="20" cy="17.6" r="8.2" fill="#FFFFFF"/>' },

  now: { bg:"#7A5AF8", art:
    '<rect x="10.4" y="4.6" width="19.2" height="31" rx="3.6" fill="#FFFFFF"/>'+
    '<rect x="13" y="8.6" width="14" height="21" rx="1.6" fill="#EDE9FE"/>'+
    '<circle cx="20" cy="32.4" r="1.8" fill="#C4B5FD"/>'+
    '<path d="M22.6 1.6h11.8A5.6 5.6 0 0 1 40 7.2v5.2a5.6 5.6 0 0 1-5.6 5.6h-1.2l.8 4-4.4-4h-7a5.6 5.6 0 0 1-5.6-5.6V7.2a5.6 5.6 0 0 1 5.6-5.6Z" fill="#FFB020"/>'+
    '<circle cx="24.6" cy="9.8" r="1.9" fill="#7A5AF8"/><circle cx="30.2" cy="9.8" r="1.9" fill="#7A5AF8"/>'+
    '<circle cx="35.8" cy="9.8" r="1.9" fill="#7A5AF8"/>' },

  says: { bg:"#12B886", art:
    '<path d="M7 6.4h26a4.8 4.8 0 0 1 4.8 4.8v12.6A4.8 4.8 0 0 1 33 28.6H18.4l-8.2 6.6 1.5-6.6H7a4.8 4.8 0 0 1-4.8-4.8V11.2A4.8 4.8 0 0 1 7 6.4Z" fill="#FFFFFF"/>'+
    '<path d="M11.4 21.6c0-4.4 1.6-7 4.8-8l.9 2.4c-1.5.7-2.3 1.7-2.4 3h2.4v5.4h-5.7Zm10 0c0-4.4 1.6-7 4.8-8l.9 2.4c-1.5.7-2.3 1.7-2.4 3h2.4v5.4h-5.7Z" fill="#0D8F69"/>' },

  face: { bg:"#FACC15", art:
    '<rect x="6.6" y="5.4" width="26.8" height="29.2" rx="3.2" fill="#FFFFFF"/>'+
    '<rect x="10" y="8.8" width="20" height="22.4" rx="1.8" fill="#FEF3C7"/>'+
    '<path d="M12.4 31.2c0-4.6 3.4-7 7.6-7s7.6 2.4 7.6 7Z" fill="#CA8A04"/>'+
    '<circle cx="20" cy="17.6" r="5.4" fill="#CA8A04"/>' },

  telly: { bg:"#64748B", art:
    '<rect x="12.4" y="4" width="3.2" height="11.6" rx="1.6" fill="#CBD5E1" transform="rotate(-26 14 9.8)"/>'+
    '<rect x="24.4" y="4" width="3.2" height="11.6" rx="1.6" fill="#CBD5E1" transform="rotate(26 26 9.8)"/>'+
    '<rect x="3.8" y="13" width="32.4" height="22.2" rx="4" fill="#F8FAFC"/>'+
    '<rect x="7" y="16.2" width="21.4" height="15.8" rx="2" fill="#334155"/>'+
    '<circle cx="32.4" cy="21" r="2" fill="#94A3B8"/>'+
    '<rect x="30.8" y="25.4" width="3.2" height="6.6" rx="1.6" fill="#94A3B8"/>' },

  sport: { bg:"#4D7C0F", art:
    '<circle cx="20" cy="21" r="14.6" fill="#FFFFFF"/>'+
    '<path d="M20 14.2 26.5 18.9 24 26.5h-8L13.5 18.9Z" fill="#1A2E05"/>'+
    '<path d="M20 14.2 20 7M26.5 18.9 33.3 16.7M24 26.5 28.2 32.3M16 26.5 11.8 32.3M13.5 18.9 6.7 16.7" '+
      'stroke="#1A2E05" stroke-width="2.6" stroke-linecap="round"/>' },

  music: { bg:"#6366F1", art:
    '<path d="M17 30V9.6l16-3.6v20.4h-3.6V10.4L20.6 12.4V30Z" fill="#FFFFFF"/>'+
    '<ellipse cx="13.4" cy="30.2" rx="5.4" ry="4.4" fill="#FFFFFF" transform="rotate(-14 13.4 30.2)"/>'+
    '<ellipse cx="29.4" cy="26.4" rx="4.6" ry="3.8" fill="#FFFFFF" transform="rotate(-14 29.4 26.4)"/>' },

  world: { bg:"#0D8F69", art:
    '<circle cx="20" cy="20" r="14.6" fill="#A7F3D0"/>'+
    '<path d="M8.4 13.8c2.6-.6 4.6.4 5.6 2.2.9 1.6.2 3-1.2 3.8-1.6 1-1.4 2.8-.2 4 1.4 1.4 1.2 3.4-.4 4.6a14.6 14.6 0 0 1-3.8-14.6Z" fill="#047857"/>'+
    '<path d="M21.6 5.6c3.6.4 6.8 2.4 8.8 5.2-1.6 1.6-4 1.4-5.6 2.8-1.4 1.2-.6 3.2.8 4.2 2 1.4 5 .8 6.6 2.6 1.2 1.4.6 3.6-1 5.4-2 2.2-5.2 1.4-6.2-.8-.8-1.8-.6-4-2.4-5-2-1.2-4.6.4-6-1.4-1.2-1.6-.2-3.8 1.4-5 1.6-1.2 3.8-1.6 3.6-4a3.6 3.6 0 0 0 0-4Z" fill="#047857"/>' },

  lands: { bg:"#FF5A3D", art:
    '<rect x="9.6" y="4" width="3.8" height="32" rx="1.9" fill="#FFFFFF"/>'+
    '<path d="M13.4 6.4c5.6-3 11.2 3 16.8 0v13.4c-5.6 3-11.2-3-16.8 0Z" fill="#FFB020"/>'+
    '<ellipse cx="11.5" cy="35.4" rx="6.6" ry="2.2" fill="#FFFFFF" opacity=".55"/>' },

  food: { bg:"#E11D48", art:
    '<circle cx="20" cy="20.6" r="11.8" fill="#FFFFFF"/>'+
    '<circle cx="20" cy="20.6" r="6.8" fill="#FECDD3"/>'+
    '<rect x="4.2" y="6.2" width="1.9" height="7.4" rx=".95" fill="#FFE4E6"/>'+
    '<rect x="7.05" y="6.2" width="1.9" height="7.4" rx=".95" fill="#FFE4E6"/>'+
    '<rect x="9.9" y="6.2" width="1.9" height="7.4" rx=".95" fill="#FFE4E6"/>'+
    '<path d="M4.2 12.2h7.6v2.8a3.8 3.8 0 0 1-7.6 0Z" fill="#FFE4E6"/>'+
    '<rect x="6.8" y="14.4" width="2.4" height="19.4" rx="1.2" fill="#FFE4E6"/>'+
    '<path d="M31.6 6.2c2.1 0 3.4 2.4 3.4 5.5 0 2.7-1.1 4.5-2.2 5.1v16.8a1.2 1.2 0 0 1-2.4 0V16.8c-1.1-.6-2.2-2.4-2.2-5.1 0-3.1 1.3-5.5 3.4-5.5Z" fill="#FFE4E6"/>' },

  work: { bg:"#475569", art:
    '<rect x="7.6" y="5.4" width="24.8" height="29.2" rx="3.2" fill="#F8FAFC"/>'+
    '<rect x="15.4" y="2.8" width="9.2" height="5.6" rx="2.8" fill="#94A3B8"/>'+
    '<rect x="12.4" y="14" width="15.2" height="2.8" rx="1.4" fill="#CBD5E1"/>'+
    '<rect x="12.4" y="20" width="15.2" height="2.8" rx="1.4" fill="#CBD5E1"/>'+
    '<rect x="12.4" y="26" width="9.4" height="2.8" rx="1.4" fill="#FACC15"/>' },

  beast: { bg:"#A16207", art:
    '<ellipse cx="20" cy="27" rx="9.6" ry="7.8" fill="#FFFFFF"/>'+
    '<circle cx="10.2" cy="17.6" r="4.2" fill="#FFFFFF"/>'+
    '<circle cx="16.8" cy="12.4" r="4.4" fill="#FFFFFF"/>'+
    '<circle cx="24.4" cy="12.4" r="4.4" fill="#FFFFFF"/>'+
    '<circle cx="30.4" cy="18" r="4.2" fill="#FFFFFF"/>' },

  town: { bg:"#0EA5E9", art:
    '<rect x="4.6" y="16" width="10.4" height="19.6" rx="1.8" fill="#E0F2FE"/>'+
    '<rect x="15.8" y="7.4" width="10.4" height="28.2" rx="1.8" fill="#FFFFFF"/>'+
    '<rect x="27" y="20.4" width="8.4" height="15.2" rx="1.8" fill="#E0F2FE"/>'+
    '<rect x="7.4" y="19.4" width="2.8" height="2.8" fill="#0369A1"/>'+
    '<rect x="18.6" y="11.4" width="2.8" height="2.8" fill="#0369A1"/>'+
    '<rect x="18.6" y="17.4" width="2.8" height="2.8" fill="#FFB020"/>'+
    '<rect x="29.4" y="23.8" width="2.8" height="2.8" fill="#0369A1"/>' },

  cash: { bg:"#16A34A", art:
    '<rect x="3.6" y="11.4" width="24.4" height="14.8" rx="2.4" fill="#FFFFFF"/>'+
    '<circle cx="15.8" cy="18.8" r="4" fill="#86EFAC"/>'+
    '<circle cx="27.4" cy="26.6" r="8.6" fill="#FACC15"/>'+
    '<circle cx="27.4" cy="26.6" r="5.6" fill="#CA8A04"/>' },

  film: { bg:"#9333EA", art:
    '<rect x="4.6" y="16.4" width="30.8" height="18.2" rx="2.6" fill="#FFFFFF"/>'+
    '<g transform="rotate(-11 20 11.6)">'+
      '<rect x="4.6" y="7.4" width="30.8" height="7.6" rx="1.6" fill="#F3E8FF"/>'+
      '<path d="M9.4 7.4h4.2l-3.6 7.6H5.8Zm8.8 0h4.2l-3.6 7.6h-4.2Zm8.8 0h4.2l-3.6 7.6h-4.2Z" fill="#7E22CE"/>'+
    '</g>' },

  kids: { bg:"#F59E0B", art:
    '<rect x="5.6" y="21.4" width="12.8" height="12.8" rx="2.2" fill="#FFFFFF"/>'+
    '<rect x="21" y="21.4" width="12.8" height="12.8" rx="2.2" fill="#FEF3C7"/>'+
    '<rect x="13.4" y="7.2" width="12.8" height="12.8" rx="2.2" fill="#FFFFFF"/>'+
    '<circle cx="19.8" cy="13.6" r="2.6" fill="#B45309"/>'+
    '<circle cx="12" cy="27.8" r="2.6" fill="#B45309"/>'+
    '<circle cx="27.4" cy="27.8" r="2.6" fill="#B45309"/>' },

  body: { bg:"#0F766E", art:
    '<rect x="4.4" y="9.4" width="31.2" height="21.2" rx="4" fill="#FFFFFF"/>'+
    '<path d="M8.4 20h4.8l3-6.4 4.4 12.8 3.4-8.4 2.4 2h5.2" stroke="#0F766E" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' }
};

const MOD_ART = {
  S: { bg:"#6B6A78", art: coin(20, 20, 14, false) },
  F: { bg:"#12B886", art:
    '<path d="M23.4 3 9.6 21.6h7.8L15.4 37 31 17.4h-8.4Z" fill="#FFFFFF"/>' },
  O: { bg:"#0D8F69", art:
    '<path d="M7 5.6h26a5 5 0 0 1 5 5v13.2a5 5 0 0 1-5 5H18.6l-8.4 6.8 1.5-6.8H7a5 5 0 0 1-5-5V10.6a5 5 0 0 1 5-5Z" fill="#FFFFFF"/>'+
    '<circle cx="20" cy="17.2" r="4" fill="#0D8F69"/>' },
  M: { bg:"#2C6BFF", art: CARD_ART.mime },
  B: { bg:"#5E3FDB", art: CARD_ART.blindfold },
  D: { bg:"#B77800", art: CARD_ART.double },
  T: { bg:"#2C6BFF", art:
    '<path d="M-1 37c0-6 4.8-9 10.6-9s10.6 3 10.6 9Z" fill="#93C5FD"/>'+
    '<circle cx="9.6" cy="18.2" r="7.4" fill="#93C5FD"/>'+
    '<path d="M15.6 38.6c0-7.4 5.4-11 12.6-11s12.6 3.6 12.6 11Z" fill="#2C6BFF"/>'+
    '<circle cx="28.2" cy="18" r="9.6" fill="#2C6BFF"/>'+
    '<path d="M17.4 38.6c0-6.2 4.8-9.2 10.8-9.2s10.8 3 10.8 9.2Z" fill="#FFFFFF"/>'+
    '<circle cx="28.2" cy="18" r="7.8" fill="#FFFFFF"/>' },

  /* A die, and the only object in the set that comes from outside this game
     -- nothing drawn from a token or a speech bubble says "a bet" at 23px.
     It is tilted because it is mid-throw: this is the one square where the
     throw can go against you. */
  G: { bg:"#D8351C", art:
    '<g transform="rotate(-13 20 20)">'+
      '<rect x="6.8" y="6.8" width="26.4" height="26.4" rx="6.4" fill="#FFFFFF"/>'+
      '<circle cx="13.4" cy="13.4" r="2.8" fill="#17161C"/>'+
      '<circle cx="26.6" cy="13.4" r="2.8" fill="#17161C"/>'+
      '<circle cx="20" cy="20" r="2.8" fill="#17161C"/>'+
      '<circle cx="13.4" cy="26.6" r="2.8" fill="#17161C"/>'+
      '<circle cx="26.6" cy="26.6" r="2.8" fill="#17161C"/>'+
    '</g>' },

  /* The aim, made public. Every round has one and it is a secret; this is
     the square where it is said out loud and nobody else may answer, so the
     target is the drawing. Deliberately NOT two people -- Partners is two
     people, and at 23px a second pair of heads would be the same emblem. */
  U: { bg:"#DB2777", art:
    '<circle cx="20" cy="20" r="16.6" fill="#FFFFFF"/>'+
    '<circle cx="20" cy="20" r="10.6" fill="#DB2777"/>'+
    '<circle cx="20" cy="20" r="4.8" fill="#FFFFFF"/>' },

  /* One sentence, two words: One word's own bubble with two marks in it
     instead of one, so the pair reads as a pair. The marks are thin, low and
     of unequal length on purpose -- two equal ovals halfway up a round white
     shape are a pair of eyes, and the emblem turned into a face at 23px. */
  W: { bg:"#D97706", art:
    '<path d="M7 5.6h26a5 5 0 0 1 5 5v13.2a5 5 0 0 1-5 5H18.6l-8.4 6.8 1.5-6.8H7a5 5 0 0 1-5-5V10.6a5 5 0 0 1 5-5Z" fill="#FFFFFF"/>'+
    '<rect x="8.6" y="16" width="12.6" height="4.4" rx="2.2" fill="#D97706"/>'+
    '<rect x="23.4" y="16" width="8.2" height="4.4" rx="2.2" fill="#D97706"/>' },

  /* Three things and what runs between them, which is the whole round. The
     nodes keep a hole in the middle so three of them stay countable once the
     bars have joined them into one shape. */
  L: { bg:"#0891B2", art:
    '<path d="M20 10 10 29M20 10l10 19M10 29h20" stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="round" fill="none"/>'+
    '<circle cx="20" cy="10" r="6.8" fill="#FFFFFF"/><circle cx="20" cy="10" r="2.6" fill="#0891B2"/>'+
    '<circle cx="10" cy="29" r="6.8" fill="#FFFFFF"/><circle cx="10" cy="29" r="2.6" fill="#0891B2"/>'+
    '<circle cx="30" cy="29" r="6.8" fill="#FFFFFF"/><circle cx="30" cy="29" r="2.6" fill="#0891B2"/>' }
};

const CHOICE_ART = {
  topic: { bg:"#6B6A78", art:
    '<path d="M4.4 9.6a3.4 3.4 0 0 1 3.4-3.4h8.4l3.6 4h12.4a3.4 3.4 0 0 1 3.4 3.4v16.8a3.4 3.4 0 0 1-3.4 3.4H7.8a3.4 3.4 0 0 1-3.4-3.4Z" fill="#FFFFFF"/>'+
    '<rect x="9.4" y="17.4" width="21.2" height="3.2" rx="1.6" fill="#D5D3E0"/>'+
    '<rect x="9.4" y="23.4" width="14" height="3.2" rx="1.6" fill="#D5D3E0"/>' },
  open: { bg:"#2C6BFF", art: CARD_ART.insight },
  cold: { bg:"#0D8F69", art:
    '<circle cx="20" cy="20" r="14.4" fill="#FFFFFF"/>'+
    '<rect x="5.6" y="17.6" width="28.8" height="4.8" rx="2.4" fill="#0D8F69" transform="rotate(-38 20 20)"/>' }
};

/* one drawing, three jobs: a picker tile, a note row, and the ghost behind
   a word card. Everything below is the same call with a different size. */
function emblemSvg(set, key, px){
  const e = set[key];
  if(!e) return "";
  const s = px || 40;
  return '<svg class="em" viewBox="0 0 40 40" width="'+s+'" height="'+s+'" aria-hidden="true">'+
         '<circle cx="20" cy="20" r="20" fill="'+e.bg+'"/>'+
         '<g clip-path="url(#lsface)">'+e.art+'</g></svg>';
}
const topicSvg  = (k, px) => emblemSvg(TOPIC_ART, k, px);
const modSvg    = (k, px) => emblemSvg(MOD_ART, k, px);
const choiceSvg = (k, px) => emblemSvg(CHOICE_ART, k, px);

/* the topic behind a word card. With no topic — an open or cold round — the
   token stands in, because every round still belongs to the game.          */
function watermark(key, px, on){
  const s = px || 88;
  const art = TOPIC_ART[key]
    ? topicSvg(key, s)
    : '<svg viewBox="0 0 40 40" width="'+s+'" height="'+s+'" aria-hidden="true">'+coin(20,20,20,false)+'</svg>';
  return '<span class="wmk'+(on ? " on" : "")+'">'+art+'</span>';
}
