/* Headless checks on the extracted engine. node game/engine.test.js */
"use strict";
const { createEngine } = require("./engine");

const bad = [];
const ok = (cond, msg) => { if(!cond) bad.push(msg); };

function seat(e, names, mode, lang){
  e.S = e.freshState();
  e.S.lang = lang || "en";
  e.S.mode = mode || "solo";
  e.applyLang();
  e.S.players = names.map((n,i) => ({ id:"p"+i, name:n }));
  if(e.S.mode === "teams"){
    e.S.units = [];
    for(let i=0; i+1 < names.length; i+=2)
      e.S.units.push({ id:"u"+i, name:names[i]+" + "+names[i+1], score:0, cards:[],
                       pos:e.startPos(), members:["p"+i,"p"+(i+1)], color:e.UNIT_COLORS[i%8] });
  } else {
    e.S.units = e.S.players.map((p,i) => ({ id:"u"+i, name:p.name, score:0, cards:[],
                       pos:e.startPos(), members:[p.id], color:e.UNIT_COLORS[i%8] }));
  }
  e.setBoard(names.length);
  e.S.giverIdx = 0; e.S.round = 0; e.S.used = [];
  e.newRound();
}

/* ---- 1. two engines never share state ---- */
const a = createEngine(), b = createEngine();
seat(a, ["A","B","C"], "solo", "en");
seat(b, ["ד","ה","ו"], "solo", "he");
a.S.round = 99;
ok(b.S.round === 1, "engines share state: b.round became " + b.S.round);
ok(a.packs().D.start !== b.packs().D.start, "two engines resolved the same language pack");
ok(b.packs().D.start === "מתחילים", "hebrew pack did not load in engine b");

/* ---- 2. a full game plays out, both modes, 3..8 players ---- */
let games = 0, rounds = 0, giverZeroes = 0, lateWins = 0;
for(const mode of ["solo","teams"]){
  for(let n = (mode === "teams" ? 4 : 3); n <= 8; n++){
    if(mode === "teams" && n % 2) continue;
    for(let g = 0; g < 60; g++){
      const e = createEngine();
      seat(e, Array.from({length:n}, (_,i) => "P"+i), mode, g % 2 ? "he" : "en");
      let guard = 0;
      while(!e.S.units.some(u => e.atFinish(u)) && guard++ < 90){
        const R = e.S.r;
        rounds++;
        ok(R.words.length >= 1, "round dealt no words");
        ok(!!R.giver && e.S.players.some(p => p.id === R.giver), "round has no valid giver");

        const chs = ["topic","open","cold"];
        R.challenge = R.mod === "B" ? "open" : chs[Math.floor(Math.random()*3)];
        if(R.challenge === "topic"){
          const ks = Object.keys(e.packs().TOPICS);
          e.dealTopic(ks[Math.floor(Math.random()*ks.length)]);
          ok(e.S.r.words.length === 4, "topic deal produced " + e.S.r.words.length + " words");
        }
        R.pick = Math.floor(Math.random()*R.words.length);
        if(!R.shot && R.mod !== "B"){
          const others = e.S.players.filter(p => p.id !== R.giver);
          R.shot = others[Math.floor(Math.random()*others.length)].id;
        }
        const gu = e.unitOf(R.giver).id;
        const solved = Math.random() < 0.78;
        R.solvedBy = solved ? (R.mod === "B" ? R.giver
                     : e.S.players.filter(p => p.id !== R.giver)[0].id) : null;
        R.solveMs = solved ? Math.random()*R.total*1000 : null;
        const frac = solved ? R.solveMs/(R.total*1000) : null;

        e.scoreRound();
        const grow = e.S.result.rows.find(r => r.id === gu);
        if(!solved){
          giverZeroes++;
          ok(grow.pts === 0, "nobody solved yet the giver took " + grow.pts);
        } else if(frac > 0.70 && R.mod !== "B" && R.mod !== "M" && e.unitOf(R.solvedBy).id !== gu){
          lateWins++;
          ok(grow.pts >= 1, "a late solve paid the giver " + grow.pts);
        }
        e.S.result.rows.forEach(r => {
          ok(Number.isFinite(r.pts), "non-finite points");
          r.why.forEach(w => ok(!/undefined|\{0\}/.test(w), "unfilled reason string: " + w));
        });

        Object.keys(e.S.steps).forEach(uid => {
          const u = e.unitById(uid);
          const spots = e.reachable(e.posOf(u), e.S.steps[uid]);
          ok(spots.length > 0, "a scorer had nowhere to move");
          const pick = spots[Math.floor(Math.random()*spots.length)];
          ok(pick.r > e.posOf(u).r, "a move went backwards");
          ok(pick.d >= 1 && pick.d <= e.S.steps[uid], "a move cost more steps than were spent");
          u.pos = { r:pick.r, c:pick.c };
        });
        e.S.units.forEach(u => ok(u.score >= 0, "a score went negative"));
        if(e.S.units.some(u => e.atFinish(u))) break;
        e.newRound();
      }
      ok(guard < 90, "a game never finished (" + mode + "/" + n + ")");
      games++;
    }
  }
}

/* ---- 3. the giver's words are the only secret worth guarding ---- */
const e2 = createEngine();
seat(e2, ["A","B","C","D"], "solo", "en");
ok(Array.isArray(e2.S.r.words) && e2.S.r.words.every(w => w.text && w.value),
   "round words are not well formed");
ok(e2.S.r.pick === null, "a word was pre-picked before the giver chose");

console.log(bad.length
  ? "FAIL (" + bad.length + "):\n" + [...new Set(bad)].slice(0,8).join("\n")
  : "engine ok — " + games + " games, " + rounds + " rounds, "
    + giverZeroes + " unsolved (giver took 0 every time), "
    + lateWins + " late solves (giver paid every time)");
process.exit(bad.length ? 1 : 0);
