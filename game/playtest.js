/* A table of bots sits down and plays the whole thing, over and over, through
   exactly the actions a phone sends — challenge, pick, aim, ready, buzz,
   judge, next, move, take, playcard. Nothing reaches in behind `applyAction`
   except the clock, which is wound by hand so a hundred games take a second.

   This is not a unit test. The other six suites ask "is it correct?". This one
   asks "is it any good?" — how long a sitting runs, who wins and by how much,
   how often a player sits a round out with nothing to do, which squares and
   cards a table actually meets, and whether the ending the game announces is
   the ending it played.

     node game/playtest.js                          the broad sweep
     node game/playtest.js --players 3 --games 300  one table size, deeply
     node game/playtest.js --seed 7 --json          numbers for something else

   Failures of the hard kind — a stuck room, a negative score, a game that
   never ends — exit non-zero. Everything else is reported, not judged.      */
"use strict";
const play = require("./play");
const { createEngine } = require("./engine");

/* ---------------- the dice, held still ---------------- */
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
let rnd = Math.random;
const pick = a => a[Math.floor(rnd() * a.length)];
const chance = p => rnd() < p;
/* two uniforms make a passable bell, which is what human timing looks like */
const bell = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;

/* ---------------- how a table behaves ----------------
   Every number here is a claim about people, not about code. They are in one
   place so an argument about the model is an argument about ten lines.      */
const MODEL = {
  /* the chance the word is ever got, by what the word is worth */
  solveByValue: { 2:0.94, 3:0.87, 4:0.75, 5:0.62 },
  /* ...nudged by the square the giver was standing on */
  solveByMod: { S:1, F:0.90, O:0.84, M:0.80, D:1, T:1, B:0.78 },
  /* ...and by how much help the giver asked for */
  solveByChallenge: { topic:1.12, open:1, cold:0.95 },
  /* more heads guessing, more chance one of them lands it */
  perGuesser: 0.05, guesserBase: 0.82,
  /* when it lands: dearer words land later, and the spread is wide */
  whenBase: 0.13, whenPerValue: 0.105, whenSpread: 0.20,
  /* somebody shouts the wrong thing */
  wrongBuzz: 0.11,               /* per guesser, per round */
  /* a held card is thrown this often, per round it is held */
  playCard: 0.42,
  /* the giver's taste in words: greedy takes the dearest, safe the cheapest */
  givers: ["greedy", "greedy", "balanced", "balanced", "safe"],
  /* what a mover does with their steps */
  movers: ["racer", "racer", "seeker", "seeker", "cautious"],
  /* the challenge a giver asks for */
  challenge: { topic:0.34, open:0.46, cold:0.20 }
};

/* seconds a table spends on each part, on top of the clock itself. Rough, but
   the same roughness for every configuration, so the comparison stands. */
const SECONDS = { order:14, giver:26, blindPick:22, judge:6, reveal:14, move:16, award:12, wild:8, swapPick:10 };

const CTX = { armClock(){}, clearClock(){} };

/* ---------------- one sitting ---------------- */
function playOne(cfg){
  const names = Array.from({ length: cfg.players }, (_, i) => "P" + i);
  const room = {
    code: "SIM", lang: cfg.lang || "en", hostId: "p0", phase: "lobby", lanUrl: "sim",
    mapId: cfg.map,
    players: names.map((n, i) => ({ id: "p" + i, name: n, online: true, face: "f" + i }))
  };
  play.startGame(room, { mode: cfg.mode, gameMode: cfg.gameMode });
  const e = room.engine;

  /* a personality per seat, drawn once and kept for the game */
  const trait = {};
  room.players.forEach(p => { trait[p.id] = { give: pick(MODEL.givers), move: pick(MODEL.movers) }; });

  const g = {
    cfg, rounds: 0, seconds: 0, stuck: null, guardHit: false,
    mods: {}, challenges: {}, topics: {}, cardsDrawn: {}, cardsPlayed: {}, wilds: {},
    unsolved: 0, lockouts: 0, swapDeadlock: 0, insightOnCold: 0,
    stopwatchPlays: 0, stopwatchLateBand: 0, wildHits: 0, giverPts: 0, giverRounds: 0,
    words: [], repeats: 0,
    perUnit: {}, halfLeader: null, boardWinner: null, scoreWinner: null,
    scores: [], rowsNeeded: e.ROWS() + 1, minRounds: null
  };
  e.S.units.forEach(u => { g.perUnit[u.id] = { gave:0, solved:0, wrong:0, cards:0, played:0, dry:0, dryRun:0, maxDry:0, pts:0 }; });
  g.opening = (e.S.opening || {}).key || null;
  const bumpDry = (uid, scored) => {
    const s = g.perUnit[uid];
    if(scored){ s.dryRun = 0; } else { s.dry++; s.dryRun++; s.maxDry = Math.max(s.maxDry, s.dryRun); }
  };

  const P = id => room.players.find(p => p.id === id);
  const act = (pid, body) => {
    const r = play.applyAction(room, P(pid), body, CTX);
    if(r && r.error) g.stuck = g.stuck || (room.phase + ":" + body.type + ":" + r.error);
    return r;
  };
  const count = (o, k) => { o[k] = (o[k] || 0) + 1; };

  let guard = 0;
  while(room.phase !== "over" && guard++ < 400){
    const S = e.S, R = S.r;

    /* ---- the play order is up: every phone taps in before round one ---- */
    if(room.phase === "order"){
      g.seconds += SECONDS.order;
      S.players.forEach(p => act(p.id, { type:"order_ok" }));
      if(room.phase === "order"){ g.stuck = g.stuck || "order:never-began"; break; }
      continue;
    }

    /* ---- the giver's phone ---- */
    if(room.phase === "giver"){
      g.rounds++; g.seconds += SECONDS.giver;
      count(g.mods, R.mod);
      g.perUnit[e.unitOf(R.giver).id].gave++;
      R.words.forEach(w => { if(g.words.indexOf(w.text) >= 0) g.repeats++; else g.words.push(w.text); });

      const roll = rnd();
      const k = cfg.forceChallenge ? cfg.forceChallenge
              : roll < MODEL.challenge.topic ? "topic"
              : roll < MODEL.challenge.topic + MODEL.challenge.open ? "open" : "cold";
      count(g.challenges, k);
      act(R.giver, { type:"challenge", k });
      if(k === "topic"){
        const key = pick(Object.keys(e.packs().TOPICS));
        count(g.topics, key);
        act(R.giver, { type:"topic", k:key });
      }
      if(k !== "cold"){
        const how = trait[R.giver].give;
        const vals = R.words.map(w => w.value);
        const want = how === "greedy" ? Math.max(...vals)
                   : how === "safe"   ? Math.min(...vals)
                   : vals.slice().sort((a,b)=>a-b)[Math.floor(vals.length/2)];
        act(R.giver, { type:"pick", i: R.words.findIndex(w => w.value === want) });
      }
      if(!R.shotPublic) act(R.giver, { type:"aim", target: pick(S.players.filter(p => p.id !== R.giver)).id });
      act(R.giver, { type:"ready" });
      continue;
    }

    /* ---- a blind round: everybody but the giver chooses ---- */
    if(room.phase === "blind"){
      g.rounds++; g.seconds += SECONDS.blindPick;
      count(g.mods, "B"); count(g.challenges, "open");
      g.perUnit[e.unitOf(R.giver).id].gave++;
      R.words.forEach(w => { if(g.words.indexOf(w.text) >= 0) g.repeats++; else g.words.push(w.text); });
      const chooser = pick(S.players.filter(p => p.id !== R.giver)).id;
      act(chooser, { type:"pick", i: Math.floor(rnd() * R.words.length) });
      act(chooser, { type:"ready" });
      continue;
    }

    /* ---- the phone is in the middle and the clock is running ---- */
    if(room.phase === "table"){
      const blind = R.mod === "B";

      /* somebody throws a card in */
      S.units.forEach(u => {
        if(room.phase !== "table") return;
        if(!(u.cards || []).length || !chance(MODEL.playCard)) return;
        const isGiverUnit = u.members.indexOf(R.giver) >= 0;
        const holdable = u.cards.filter(k => k !== "swap" || isGiverUnit);
        if(!holdable.length) return;
        const key = pick(holdable);
        const before = e.remainMs();
        const res = act(u.members[0] === R.giver || !isGiverUnit ? u.members[0] : R.giver, { type:"playcard", key });
        if(res && res.ok){
          count(g.cardsPlayed, key);
          g.perUnit[u.id].played++;
          if(key === "stopwatch" && before > 30000) g.stopwatchPlays++;
          if(key === "insight" && R.words.length === 1) g.insightOnCold++;
        }
      });

      /* Switch sends the room to its own screen, and a one-word round has
         nothing to switch to — the room can only sit there. */
      if(room.phase === "swap"){
        g.seconds += SECONDS.swapPick;
        const alt = R.words.map((_, i) => i).filter(i => i !== R.pick);
        if(!alt.length){
          g.swapDeadlock++;
          /* what a real table would do: wait out the stall, then somebody
             other than the giver taps the rescue */
          room.phaseAt = Date.now() - (play.IDLE_MS + 1000);
          g.seconds += play.IDLE_MS / 1000;
          const rescuer = S.players.find(p => p.id !== R.giver);
          act(rescuer.id, { type:"skip" });
          continue;
        }
        act(R.giver, { type:"swappick", i: pick(alt) });
      }
      if(room.phase !== "table") continue;

      const word = R.words[R.pick] || R.words[0];
      const aliveNow = () => S.players.filter(p => p.id !== R.giver && R.lockedOut.indexOf(p.id) < 0);

      /* a wrong shout, first */
      const early = aliveNow();
      if(!blind && early.length > 1 && chance(1 - Math.pow(1 - MODEL.wrongBuzz, early.length))){
        const who = pick(early).id;
        const at = Math.max(0.02, Math.min(0.9, 0.10 + rnd() * 0.5));
        R.acc = Math.round(at * R.total * 1000); R.startedAt = Date.now();
        if(e.remainMs() > 0){
          act(who, { type:"buzz" });
          if(room.phase === "judge"){
            g.lockouts++; g.perUnit[e.unitOf(who).id].wrong++;
            g.seconds += SECONDS.judge;
            act(R.giver, { type:"judge", yes:false });
          }
        }
      }
      if(room.phase !== "table") continue;

      /* and then the real one, or nobody */
      const alive = aliveNow();
      const guessers = blind ? 1 : alive.length;
      let p = (MODEL.solveByValue[word.value] || 0.8)
            * (MODEL.solveByMod[R.mod] || 1)
            * (MODEL.solveByChallenge[R.challenge] || 1)
            * (blind ? 1 : Math.min(1.25, MODEL.guesserBase + MODEL.perGuesser * guessers));
      if(R.mimeCard) p *= 0.85;
      if(R.veto) p *= 0.92;
      if(R.insight) p *= 1.18;
      p = Math.max(0.04, Math.min(0.97, p));

      const solverAlive = blind ? [P(R.giver)] : alive;
      if(solverAlive.length && chance(p)){
        let f = MODEL.whenBase + MODEL.whenPerValue * (word.value - 2) + bell() * MODEL.whenSpread;
        f = Math.max(0.03, Math.min(0.97, f));
        /* the clock is where the card play left it — a solve cannot happen
           in time that is already gone */
        const gone = e.elapsedMs() / (R.total * 1000);
        f = Math.max(f, Math.min(0.97, gone + 0.02));
        R.acc = Math.round(f * R.total * 1000); R.startedAt = Date.now();
        if(e.remainMs() <= 0){ R.acc = R.total * 1000 - 500; }
        const who = pick(solverAlive).id;
        g.seconds += Math.round(e.elapsedMs() / 1000);
        act(who, { type:"buzz" });
        if(room.phase === "judge"){
          g.seconds += SECONDS.judge;
          const wasStopwatch = R.acc > (R.total * 1000 - 31000) && g.stopwatchPlays > 0;
          act(R.giver, { type:"judge", yes:true });
          if(f > 0.70 && wasStopwatch) g.stopwatchLateBand++;
          g.perUnit[e.unitOf(who).id].solved++;
        }
      } else {
        g.unsolved++;
        g.seconds += R.total;
        R.acc = R.total * 1000; R.startedAt = null;
        act(R.giver, { type:"nobody" });
      }
      continue;
    }

    /* ---- the result, and the board ---- */
    if(room.phase === "reveal"){
      g.seconds += SECONDS.reveal;
      const scored = {};
      (S.result.rows || []).forEach(r => {
        scored[r.id] = r.pts > 0; g.perUnit[r.id].pts += r.pts;
        if(r.giver){ g.giverPts += r.pts; g.giverRounds++; }
      });
      S.units.forEach(u => bumpDry(u.id, !!scored[u.id]));
      if(g.halfLeader === null && g.rounds >= 4){
        g.halfLeader = S.units.slice().sort((a,b) => b.score - a.score)[0].id;
      }
      act(R.giver, { type:"next" });
      continue;
    }

    if(room.phase === "move"){
      const uid = play.moveOrder(e)[S.moveSeat];
      const u = e.unitById(uid);
      const mover = u.members[0];
      const spots = e.reachable(e.posOf(u), S.steps[u.id]);
      if(!spots.length){ g.stuck = g.stuck || "move:no-spots"; break; }
      g.seconds += SECONDS.move;
      const far = Math.max(...spots.map(s => s.d));
      const best = spots.filter(s => s.d === far);
      const typeOf = s => (s.r > e.ROWS() ? "END" : (e.isCardNode(s.r, s.c) ? "CARD" : e.nodeTypeAt(s.r, s.c)));
      let want;
      const how = trait[mover].move;
      if(how === "seeker"){
        const cards = spots.filter(s => typeOf(s) === "CARD");
        want = cards.length ? pick(cards) : pick(best);
      } else if(how === "cautious"){
        const calm = best.filter(s => ["B","M","O"].indexOf(typeOf(s)) < 0);
        want = calm.length ? pick(calm) : pick(best);
      } else {
        want = pick(best);
      }
      act(mover, { type:"movepick", r:want.r, c:want.c });
      act(mover, { type:"moveconfirm" });
      continue;
    }

    if(room.phase === "wild"){
      g.seconds += SECONDS.wild;
      g.wildHits++;
      count(g.wilds, (S.wild || {}).kind || "?");
      const u = e.unitById(S.wild.unitId);
      act(u.members[0], { type:"wildok" });
      continue;
    }

    if(room.phase === "award"){
      g.seconds += SECONDS.award;
      const u = e.unitById(S.awardFor);
      const offers = S.offers || [];
      const key = pick(offers);
      count(g.cardsDrawn, key);
      g.perUnit[u.id].cards++;
      act(u.members[0], { type:"take", key });
      continue;
    }

    g.stuck = g.stuck || ("no handler for phase " + room.phase);
    break;
  }

  if(guard >= 400) g.guardHit = true;

  const S = e.S;
  g.boardWinner = (e.winnerUnit() || {}).id || null;
  const byScore = S.units.slice().sort((a, b) => b.score - a.score);
  g.scoreWinner = byScore[0] ? byScore[0].id : null;
  g.scores = byScore.map(u => ({ id:u.id, name:u.name, score:u.score, row:(u.pos || {}).r || 0 }));
  g.margin = byScore.length > 1 ? byScore[0].score - byScore[1].score : 0;
  g.tiedTop = byScore.length > 1 && byScore[0].score === byScore[1].score;
  g.negativeScore = S.units.some(u => u.score < 0);
  g.minutes = g.seconds / 60;
  return g;
}

/* ---------------- the sweep ---------------- */
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf("--" + k); return i >= 0 ? argv[i + 1] : d; };
const has = k => argv.indexOf("--" + k) >= 0;

const SEED = Number(arg("seed", 20260907));
rnd = mulberry32(SEED);

const MAPS = play.MAP_IDS, MODES = play.MODE_IDS;
const wantPlayers = arg("players") ? [Number(arg("players"))] : [3,4,5,6,7,8];
const perCell = Number(arg("games", wantPlayers.length === 1 ? 200 : 40));

const runs = [];
for(const n of wantPlayers){
  for(const gameMode of (arg("gameMode") ? [arg("gameMode")] : MODES)){
    for(const map of (arg("map") ? [arg("map")] : MAPS)){
      for(const mode of (n >= 4 && !has("solo-only") ? ["solo","teams"] : ["solo"])){
        for(let i = 0; i < perCell; i++)
          runs.push(playOne({ players:n, gameMode, map, mode, forceChallenge: arg("challenge"),
                              lang: i % 3 === 0 ? "he" : "en" }));
      }
    }
  }
}

/* ---------------- what it all came to ---------------- */
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const avg = (a, f) => a.length ? sum(a, f) / a.length : 0;
const pct = (a, f) => a.length ? 100 * a.filter(f).length / a.length : 0;
const med = (a, f) => { const x = a.map(f).sort((p, q) => p - q); return x.length ? x[Math.floor(x.length / 2)] : 0; };
const n1 = x => (Math.round(x * 10) / 10).toFixed(1);
const merge = (a, f) => { const o = {}; a.forEach(g => { const m = f(g); Object.keys(m).forEach(k => o[k] = (o[k] || 0) + m[k]); }); return o; };
const share = o => { const tot = Object.values(o).reduce((s, v) => s + v, 0) || 1;
  return Object.keys(o).sort((x, y) => o[y] - o[x]).map(k => k + " " + n1(100 * o[k] / tot) + "%"); };

const hard = [];
runs.forEach(g => {
  const tag = g.cfg.players + "p/" + g.cfg.gameMode + "/" + g.cfg.map + "/" + g.cfg.mode;
  if(g.guardHit) hard.push("a game never ended: " + tag);
  if(g.stuck && !/swappick:bad_choice/.test(g.stuck)) hard.push("a phone was refused mid-game (" + tag + "): " + g.stuck);
  if(g.negativeScore) hard.push("a score went negative: " + tag);
  if(!g.boardWinner) hard.push("the game ended with nobody over the line: " + tag);
});

const units = [];
runs.forEach(g => Object.keys(g.perUnit).forEach(k => units.push(Object.assign({ game:g }, g.perUnit[k], { id:k }))));

if(has("json")){
  console.log(JSON.stringify({ seed:SEED, games:runs.length, runs: runs.map(g => ({
    cfg:g.cfg, rounds:g.rounds, minutes:g.minutes, scores:g.scores, margin:g.margin,
    boardWinner:g.boardWinner, scoreWinner:g.scoreWinner, mods:g.mods, unsolved:g.unsolved
  })) }, null, 1));
  process.exit(hard.length ? 1 : 0);
}

const R = [];
const line = s => R.push(s);
const head = s => { R.push(""); R.push(s); R.push("-".repeat(s.length)); };

line("Asimon playtest — " + runs.length + " full games, seed " + SEED);
line("bots play through play.js: the same actions a phone sends, nothing behind them");

head("A sitting");
line("rounds        avg " + n1(avg(runs, g => g.rounds)) + "   median " + med(runs, g => g.rounds) +
     "   range " + Math.min(...runs.map(g => g.rounds)) + "–" + Math.max(...runs.map(g => g.rounds)));
line("minutes       avg " + n1(avg(runs, g => g.minutes)) + "   median " + n1(med(runs, g => g.minutes)) +
     "   range " + n1(Math.min(...runs.map(g => g.minutes))) + "–" + n1(Math.max(...runs.map(g => g.minutes))));
line("over 40 min   " + n1(pct(runs, g => g.minutes > 40)) + "% of games");
line("under 10 min  " + n1(pct(runs, g => g.minutes < 10)) + "% of games");
line("decided in 4 rounds or fewer  " + n1(pct(runs, g => g.rounds <= 4)) +
     "% — a table that has barely met the board");

head("By table size");
wantPlayers.forEach(n => {
  const a = runs.filter(g => g.cfg.players === n);
  if(!a.length) return;
  line(n + " players   rounds " + n1(avg(a, g => g.rounds)) + "   minutes " + n1(avg(a, g => g.minutes)) +
       "   rows to cross " + Math.min(...a.map(g => g.rowsNeeded)) + "–" + Math.max(...a.map(g => g.rowsNeeded)) +
       "   unsolved " + n1(100 * sum(a, g => g.unsolved) / sum(a, g => g.rounds)) + "%");
});

head("By game mode");
MODES.forEach(m => {
  const a = runs.filter(g => g.cfg.gameMode === m);
  if(!a.length) return;
  line(m.padEnd(10) + " rounds " + n1(avg(a, g => g.rounds)) + "   minutes " + n1(avg(a, g => g.minutes)) +
       "   margin " + n1(avg(a, g => g.margin)));
});

head("By board");
MAPS.forEach(m => {
  const a = runs.filter(g => g.cfg.map === m);
  if(!a.length) return;
  const mods = merge(a, g => g.mods);
  line(m.padEnd(8) + " rounds " + n1(avg(a, g => g.rounds)) + "   squares met: " + share(mods).join("  "));
});

head("The squares a table actually lands on");
line(share(merge(runs, g => g.mods)).join("   "));
line("(S standard, F fast, O one-word, M mime, B blind, D double, T partners)");

head("The seven cards");
const drawn = merge(runs, g => g.cardsDrawn), played = merge(runs, g => g.cardsPlayed);
line("drawn   " + share(drawn).join("  "));
line("played  " + share(played).join("  "));
line("cards per game  " + n1(avg(runs, g => Object.values(g.cardsDrawn).reduce((s,v)=>s+v,0))));
line("games where somebody never saw a card square  " +
     n1(pct(runs, g => Object.values(g.perUnit).some(u => u.cards === 0))) + "%");
line("games where NOBODY landed on a card square    " +
     n1(pct(runs, g => Object.values(g.perUnit).every(u => u.cards === 0))) + "%");
line("(one card is dealt at the start regardless — that is the opening card)");

head("The wildcard square");
line("landed on          " + n1(avg(runs, g => g.wildHits)) + " times a game");
line("games that never met one at all   " + n1(pct(runs, g => g.wildHits === 0)) + "%");
line("what it rolled     " + share(merge(runs, g => g.wilds)).join("  "));

head("Difficulty the givers asked for");
line(share(merge(runs, g => g.challenges)).join("   "));
line("what a giving round paid the giver  " +
     n1(sum(runs, g => g.giverPts) / Math.max(1, sum(runs, g => g.giverRounds))) + " points on average");
line("rounds nobody got  " + n1(100 * sum(runs, g => g.unsolved) / sum(runs, g => g.rounds)) + "%");
line("wrong shouts       " + n1(sum(runs, g => g.lockouts) / runs.length) + " per game");

head("Is it a game, or a procession?");
line("final margin       avg " + n1(avg(runs, g => g.margin)) + "   median " + med(runs, g => g.margin));
line("margin of 1 or 0   " + n1(pct(runs, g => g.margin <= 1)) + "% of games");
line("leader at round 4 went on to win   " + n1(pct(runs.filter(g => g.halfLeader), g => g.halfLeader === g.boardWinner)) + "%");
line("a unit finished on 0 points        " + n1(pct(runs, g => g.scores.some(s => s.score === 0))) + "%");

head("Sitting on your hands");
line("rounds a unit scored nothing       " + n1(100 * sum(units, u => u.dry) / Math.max(1, sum(units, u => u.game.rounds))) + "% of all seat-rounds");
line("longest dry run, avg per unit      " + n1(avg(units, u => u.maxDry)) + " rounds");
line("units that went 4+ rounds scoreless " + n1(pct(units, u => u.maxDry >= 4)) + "%");
line("giver turns, most vs fewest in a game  " +
     n1(avg(runs, g => Math.max(...Object.values(g.perUnit).map(u => u.gave)))) + " vs " +
     n1(avg(runs, g => Math.min(...Object.values(g.perUnit).map(u => u.gave)))));

head("The ending the game announces");
const mism = runs.filter(g => g.boardWinner && g.scoreWinner && g.boardWinner !== g.scoreWinner);
line("board winner is not top of the score table   " + n1(100 * mism.length / runs.length) + "% of games");
line("  the phone crowns whoever tops the score table (app.js standings[0]),");
line("  but the game ends the moment somebody crosses the line.");
line("top of the score table is a tie              " + n1(pct(runs, g => g.tiedTop)) + "%");

head("Words");
line("distinct words seen in a game  " + n1(avg(runs, g => g.words.length)) +
     "   repeats within a game " + n1(avg(runs, g => g.repeats)));

head("Rules that trip over each other");
line("Switch played on a one-word round (nothing to switch to, room stalls)  " +
     sum(runs, g => g.swapDeadlock) + " times in " + runs.length + " games");
line("Insight played on a Cold round (the four words are one word — the answer) " +
     sum(runs, g => g.insightOnCold) + " times");
line("Stopwatch handing the giver the late-landing band                        " +
     sum(runs, g => g.stopwatchLateBand) + " of " + sum(runs, g => g.stopwatchPlays) + " plays");

if(hard.length){
  head("Hard failures");
  [...new Set(hard)].slice(0, 12).forEach(x => line("  " + x));
}

console.log(R.join("\n"));
console.log(hard.length ? "\nFAIL — " + hard.length + " hard failures" : "\nno hard failures across " + runs.length + " games");
process.exit(hard.length ? 1 : 0);
