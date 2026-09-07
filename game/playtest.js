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
  /* the chance the word is ever got, by what the word is worth. The scale is
     1 up to 4 — the bank's four tiers, priced a notch below their tier. */
  solveByValue: { 1:0.94, 2:0.87, 3:0.75, 4:0.62 },
  /* ...nudged by the square the giver was standing on */
  solveByMod: { S:1, F:0.90, O:0.84, M:0.80, G:1, T:1, U:0.95, W:0.88, B:0.78, L:0.82 },
  /* ...and by how much help the giver asked for */
  solveByChallenge: { topic:1.12, open:1, cold:0.95 },
  /* more heads guessing, more chance one of them lands it */
  perGuesser: 0.05, guesserBase: 0.82,
  /* When it lands. Not a hump in the middle: a table gets an easy word almost
     at once and chews a hard one right up to the buzzer, so the shape is a
     floor that rises with the word, and a long tail out to the end of the
     clock. `whenSkew` above 1 pulls the mass earlier, below 1 pushes it late. */
  whenFloor: 0.04, whenFloorPerValue: 0.055, whenSkew: 1.55, cheapestWord: 1,
  /* Somebody shouts the wrong thing. A Double round says so on the buzzer
     screen — "a wrong buzz costs 2" — and a table that reads it waits for
     more before shouting: the confidence a shout needs goes from about one
     in five to one in four when the cost doubles and the word is only half
     again as dear. Not a halving, but not nothing. */
  wrongBuzz: 0.11,               /* per guesser, per round */
  wrongBuzzOnGamble: 0.75,       /* how much of that a doubled penalty leaves */
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
  const room = {
    code: "SIM", lang: cfg.lang || "en", hostId: "p0", phase: "lobby", lanUrl: "sim",
    mapId: cfg.map, seating: cfg.seating || "solo",
    players: [], people: []
  };
  /* Solo and pairs put one person behind each phone, so the two rosters are
     the same list under two names. Groups hands a phone two to four people —
     the sofa, the kids, whoever is sharing — and then a phone is a unit. */
  if(cfg.seating === "groups"){
    let n = 0;
    for(let ph = 0; ph < cfg.phones; ph++){
      const id = "p" + ph;
      room.players.push({ id, name:"Sofa " + ph, online:true, face:"f" + ph, groupName:"Sofa " + ph });
      const size = cfg.groupSize || (2 + Math.floor(rnd() * 3));
      for(let k = 0; k < size; k++, n++)
        play.addPerson(room, id, "P" + n, "f" + (n % 15));
    }
  } else {
    for(let i = 0; i < cfg.players; i++){
      const id = "p" + i;
      room.players.push({ id, name:"P" + i, online:true, face:"f" + i });
      play.addPerson(room, id, "P" + i, "f" + i);
    }
  }
  play.startGame(room, { seating: cfg.seating, mode: cfg.mode, gameMode: cfg.gameMode });
  const e = room.engine;
  /* experiment dials: try a board length or a per-round ceiling without
     committing either to the engine first */
  if(cfg.rows) e.S.rows = Number(cfg.rows);
  if(cfg.addRows) e.S.rows = e.S.rows + Number(cfg.addRows);

  /* a personality per seat, drawn once and kept for the game */
  const trait = {};
  room.players.forEach(p => { trait[p.id] = { give: pick(MODEL.givers), move: pick(MODEL.movers) }; });
  /* the rules name people; the actions come from the phone holding them */
  const phoneOf = personId => play.phoneOf(room, personId);

  const g = {
    cfg, rounds: 0, seconds: 0, stuck: null, guardHit: false,
    mods: {}, challenges: {}, topics: {}, cardsDrawn: {}, cardsPlayed: {}, wilds: {},
    unsolved: 0, lockouts: 0, swapDeadlock: 0, insightOnCold: 0,
    stopwatchPlays: 0, stopwatchLateBand: 0, wildHits: 0, giverPts: 0, giverRounds: 0,
    stepHist: {}, bigRound: 0, leaderRows: [], bands: {}, solved: 0, buzzes: 0,
    byMod: {},          /* per round type: dealt, landed, the giver's pay, seconds */
    seats: 0, seatRounds2: 0, unitCount: 0,
    words: [], repeats: 0,
    perUnit: {}, halfLeader: null, boardWinner: null, scoreWinner: null,
    scores: [], rowsNeeded: e.ROWS() + 1, minRounds: null
  };
  e.S.units.forEach(u => { g.perUnit[u.id] = { gave:0, solved:0, wrong:0, cards:0, played:0, dry:0, dryRun:0, maxDry:0, pts:0 }; });
  g.opening = (e.S.opening || {}).key || null;
  g.units = e.S.units.length;
  g.people = e.S.players.length;
  g.cardSource = {};
  if(g.opening){ g.cardsDrawn[g.opening] = 1; g.cardSource.opening = 1; }
  const bumpDry = (uid, scored) => {
    const s = g.perUnit[uid];
    if(scored){ s.dryRun = 0; } else { s.dry++; s.dryRun++; s.maxDry = Math.max(s.maxDry, s.dryRun); }
  };

  const P = id => room.players.find(p => p.id === id);
  const act = (personId, body) => {
    const r = play.applyAction(room, P(phoneOf(personId)), body, CTX);
    /* The harness owns the clock: R.acc is the whole of the elapsed time and
       a running startedAt would fold real milliseconds in behind it. Left
       running, those few milliseconds decide which side of a boundary a round
       falls on, and a seeded run stops repeating. */
    if(e.S.r && e.S.r.startedAt) e.S.r.startedAt = null;
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
      /* one tap a phone, not one a person — a sofa of three taps once */
      room.players.forEach(ph => { if(room.phase === "order") act(ph.id, { type:"order_ok" }); });
      if(room.phase === "order"){ g.stuck = g.stuck || "order:never-began"; break; }
      continue;
    }

    /* ---- the giver's phone ---- */
    if(room.phase === "giver"){
      g.rounds++; g.seconds += SECONDS.giver;
      g.spent = 0;                 /* seconds of this round's clock already counted */
      count(g.mods, R.mod);
      g.thisMod = R.mod;
      (g.byMod[R.mod] = g.byMod[R.mod] || { dealt:0, landed:0, pay:0, secs:0, won:0, lost:0 }).dealt++;
      g.perUnit[e.unitOf(R.giver).id].gave++;
      R.words.forEach(w => { if(g.words.indexOf(w.text) >= 0) g.repeats++; else g.words.push(w.text); });

      if(R.mod === "L"){
        /* three out of the six, and the round is already dealt */
        [0, 1, 2].forEach(i => act(R.giver, { type:"pick", i }));
        count(g.challenges, "open");
        if(!R.shotFixed){
          const mine = e.unitOf(R.giver).members;
          const targets = S.players.filter(p => p.id !== R.giver &&
            !(S.seating === "groups" && mine.indexOf(p.id) >= 0));
          if(targets.length) act(R.giver, { type:"aim", target: pick(targets).id });
        }
        act(R.giver, { type:"ready" });
        continue;
      }
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
        const how = trait[phoneOf(R.giver)].give;
        const vals = R.words.map(w => w.value);
        const want = how === "greedy" ? Math.max(...vals)
                   : how === "safe"   ? Math.min(...vals)
                   : vals.slice().sort((a,b)=>a-b)[Math.floor(vals.length/2)];
        act(R.giver, { type:"pick", i: R.words.findIndex(w => w.value === want) });
        if(R.mod === "W"){
          /* a second word, whichever the first one was not */
          const other = R.words.findIndex((w, i) => i !== R.pick);
          if(other >= 0) act(R.giver, { type:"pick", i: other });
        }
      }
      if(!R.shotFixed){
        const mine = e.unitOf(R.giver).members;
        const targets = S.players.filter(p => p.id !== R.giver &&
          !(S.seating === "groups" && mine.indexOf(p.id) >= 0));
        if(targets.length) act(R.giver, { type:"aim", target: pick(targets).id });
      }
      act(R.giver, { type:"ready" });
      continue;
    }

    /* ---- a blind round: everybody but the giver chooses ---- */
    if(room.phase === "blind"){
      g.rounds++; g.seconds += SECONDS.blindPick;
      count(g.mods, "B"); count(g.challenges, "open");
      g.thisMod = "B";
      (g.byMod.B = g.byMod.B || { dealt:0, landed:0, pay:0, secs:0, won:0, lost:0 }).dealt++;
      g.perUnit[e.unitOf(R.giver).id].gave++;
      R.words.forEach(w => { if(g.words.indexOf(w.text) >= 0) g.repeats++; else g.words.push(w.text); });
      const gp = phoneOf(R.giver);
      const chooser = pick(S.players.filter(p => phoneOf(p.id) !== gp)).id;
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
        /* the same hand the phone would show: Switch is the giver's alone, and
           a Link round has nothing for it to switch to */
        const holdable = u.cards.filter(k =>
          (k !== "swap" || (isGiverUnit && R.mod !== "L")) &&
          !((k === "veto" || k === "mime") && (R.mod === "L" || R.mod === "B")));
        if(!holdable.length) return;
        const key = pick(holdable);
        const before = e.remainMs();
        const fracBefore = e.elapsedMs() / (R.total * 1000);
        const res = act(u.members[0] === R.giver || !isGiverUnit ? u.members[0] : R.giver, { type:"playcard", key });
        if(res && res.ok){
          count(g.cardsPlayed, key);
          g.perUnit[u.id].played++;
          if(key === "stopwatch" && before > 30000){
            g.stopwatchPlays++;
            /* What is measured is the card's own doing: whether playing it
               PUSHED the round into the giver's top band. A round already
               past that line when the card came down was not put there by
               the card, and the card now declines to act on one. */
            if(e.elapsedMs() / (R.total * 1000) > 0.70 && fracBefore <= 0.70)
              g.stopwatchLateBand++;
          }
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
      /* whoever is holding the giver's phone is reading the word over their
         shoulder — in groups that is the whole sofa, not just the giver */
      const giverPhone = phoneOf(R.giver);
      const barred = {};
      R.lockedOut.forEach(id => { barred[phoneOf(id)] = true; });
      /* a Duel names one answerer and everybody else watches */
      const aliveNow = () => S.players.filter(p =>
        phoneOf(p.id) !== giverPhone && !barred[phoneOf(p.id)]
        && (!R.only || p.id === R.only));

      /* a wrong shout, first */
      const early = aliveNow();
      const rash = MODEL.wrongBuzz * (R.mod === "G" ? MODEL.wrongBuzzOnGamble : 1);
      if(!blind && early.length > 1 && chance(1 - Math.pow(1 - rash, early.length))){
        const who = pick(early).id;
        const at = Math.max(0.02, Math.min(0.9, 0.10 + rnd() * 0.5));
        /* the clock is wound by hand and then stopped, so elapsed is exactly
           what was set — a running startedAt adds a few real milliseconds and
           those are enough to change which side of a boundary a round falls
           on, which is what made a seeded run unrepeatable */
        R.acc = Math.round(at * R.total * 1000); R.startedAt = null;
        if(e.remainMs() > 0){
          act(who, { type:"buzz" });
          if(room.phase === "judge"){
            g.lockouts++; g.buzzes++; g.perUnit[e.unitOf(who).id].wrong++;
            /* the server records the lockout against the phone's first person,
               so the whole phone is barred whoever on it actually shouted */
            barred[phoneOf(who)] = true;
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

      /* on a blind round the giver is the one guessing — a person in the
         roster, which in groups is not the same list as the phones */
      const solverAlive = blind ? S.players.filter(p => p.id === R.giver) : alive;
      if(solverAlive.length && chance(p)){
        const floor = MODEL.whenFloor + MODEL.whenFloorPerValue * (word.value - MODEL.cheapestWord);
        let f = floor + (0.97 - floor) * Math.pow(rnd(), MODEL.whenSkew);
        f = Math.max(0.03, Math.min(0.97, f));
        /* the clock is where the card play left it — a solve cannot happen
           in time that is already gone */
        const gone = e.elapsedMs() / (R.total * 1000);
        f = Math.max(f, Math.min(0.97, gone + 0.02));
        R.acc = Math.round(f * R.total * 1000); R.startedAt = null;
        if(e.remainMs() <= 0){ R.acc = R.total * 1000 - 500; }
        const who = pick(solverAlive).id;
        /* Two words comes back to the table for the second one, and it is the
           same clock — only the part of it that had not been counted yet. */
        const spentNow = e.elapsedMs() / 1000;
        g.seconds += Math.round(Math.max(0, spentNow - (g.spent || 0)));
        g.spent = spentNow;
        act(who, { type:"buzz" });
        if(room.phase === "judge"){
          g.seconds += SECONDS.judge;
          /* blind puts the verdict on a phone that can see the word */
          const verdict = blind
            ? pick(S.players.filter(p => phoneOf(p.id) !== giverPhone)).id : R.giver;
          if(R.mod === "W"){
            /* name whichever of the two is still out there */
            const out = [R.pick, R.pick2].filter(i =>
              i !== null && !R.found.some(f => f.pick === i));
            act(verdict, { type:"judge", word: out.length ? out[0] : -1 });
          } else {
            act(verdict, { type:"judge", yes:true });
          }
          g.perUnit[e.unitOf(who).id].solved++;
          g.buzzes++;
          if(room.phase === "reveal"){
            g.solved++;
            count(g.bands, f <= 0.25 ? "early" : f <= 0.70 ? "mid" : "late");
          }
        }
      } else {
        g.unsolved++;
        g.seconds += Math.max(0, R.total - (g.spent || 0));
        R.acc = R.total * 1000; R.startedAt = null;
        act(R.giver, { type:"nobody" });
      }
      continue;
    }

    /* ---- the result, and the board ---- */
    if(room.phase === "reveal"){
      if(cfg.cap || cfg.minus) Object.keys(S.steps).forEach(uid => {
        let v = S.steps[uid];
        if(cfg.minus) v = Math.max(0, v - Number(cfg.minus));
        if(cfg.cap)   v = Math.min(v, Number(cfg.cap));
        if(v > 0) S.steps[uid] = v; else delete S.steps[uid];
      });
      g.seconds += SECONDS.reveal;
      /* what the round just finished was worth, filed under its kind */
      if(g.thisMod && g.byMod[g.thisMod]){
        const bm = g.byMod[g.thisMod];
        const gr = (S.result.rows || []).find(r => r.giver);
        if(gr && gr.pts > 0){ bm.landed++; bm.won += gr.pts; }
        else bm.lost += gr ? gr.pts : 0;
        bm.pay  += gr ? gr.pts : 0;
        bm.secs += g.spent || 0;
      }
      const scored = {};
      (S.result.rows || []).forEach(r => {
        scored[r.id] = r.pts > 0; g.perUnit[r.id].pts += r.pts;
        if(r.giver){ g.giverPts += r.pts; g.giverRounds++; }
      });
      /* how many of the units at the table got anything out of the round. An
         ordinary solved round pays two — whoever got it and whoever gave it.
         Nobody getting it pays none. Blind pays everybody. */
      g.seats += (S.result.rows || []).filter(r => r.pts > 0).length;
      g.seatRounds2 += 1;
      g.unitCount = S.units.length;
      /* what one round is worth in ground, which is what sets the length */
      Object.keys(S.steps).forEach(uid => {
        const n = S.steps[uid];
        g.stepHist[n] = (g.stepHist[n] || 0) + 1;
        if(n > g.bigRound) g.bigRound = n;
      });
      g.leaderRows.push(Math.max(...S.units.map(u => (u.pos||{}).r || 0)));
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
      const how = trait[phoneOf(mover)].move;
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
      if(S.wild && S.wild.card){
        count(g.cardsDrawn, S.wild.card);
        g.cardSource.wild = (g.cardSource.wild || 0) + 1;
        g.perUnit[S.wild.unitId].cards++;
      }
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
      g.cardSource.square = (g.cardSource.square || 0) + 1;
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
  g.crossed = S.units.filter(u => e.atFinish(u)).length;
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
/* The engine reaches for Math.random directly — for the words a round deals,
   the shuffles, the wildcard roll, the board's own re-rolling. Seeding only
   the bot's choices left all of that loose, so two runs of the same seed
   never agreed. One stream, seeded once, and a run repeats. */
Math.random = mulberry32(SEED ^ 0x5f3759df);

const MAPS = play.MAP_IDS, MODES = play.MODE_IDS;
const wantPlayers = arg("players") ? [Number(arg("players"))] : [3,4,5,6,7,8];
const perCell = Number(arg("games", wantPlayers.length === 1 ? 200 : 40));

const RUN_STARTED = Date.now();
const runs = [];
for(const n of wantPlayers){
  for(const gameMode of (arg("gameMode") ? [arg("gameMode")] : MODES)){
    for(const map of (arg("map") ? [arg("map")] : MAPS)){
      /* Three ways to sit. Solo and pairs are one person a phone, so the
         table size is the head count. Groups is phones — three sofas of three
         is nine people racing as three, so it is swept by phone count. */
      const want = arg("seating");
      let seatings = has("solo-only") ? ["solo"] : n >= 4 ? ["solo", "pairs"] : ["solo"];
      if(n >= 3 && !has("solo-only")) seatings.push("groups");
      if(want) seatings = seatings.filter(x => x === want);
      for(const seating of seatings){
        for(let i = 0; i < perCell; i++)
          runs.push(playOne({ players:n, phones:n, seating,
                              mode: seating === "pairs" ? "teams" : "solo",
                              gameMode, map, forceChallenge: arg("challenge"),
                              rows: arg("rows"), addRows: arg("addRows"), cap: arg("cap"), minus: arg("minus"),
                              lang: i % 3 === 0 ? "he" : "en" }));
      }
    }
  }
}

/* the run's own clock, and one engine kept aside to read the content off */
const T0 = RUN_STARTED;
const SAMPLE = (function(){ const e = createEngine(); e.S = e.freshState(); e.applyLang(); return e; })();

/* ================= the audit =================
   The numbers first, then a verdict on each of them. Every threshold below is
   a claim about what a good sitting looks like, and they are all gathered in
   CHECKS so that arguing with the report is arguing with that one list.    */
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const avg = (a, f) => a.length ? sum(a, f) / a.length : 0;
const pct = (a, f) => a.length ? 100 * a.filter(f).length / a.length : 0;
const nums = (a, f) => a.map(f).sort((p, q) => p - q);
const med = (a, f) => { const x = nums(a, f); return x.length ? x[Math.floor(x.length / 2)] : 0; };
const p90 = (a, f) => { const x = nums(a, f); return x.length ? x[Math.floor(x.length * 0.9)] : 0; };
const n1 = x => (Math.round(x * 10) / 10).toFixed(1);
const n0 = x => String(Math.round(x));
const thou = x => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const merge = (a, f) => { const o = {}; a.forEach(g => { const m = f(g); Object.keys(m).forEach(k => o[k] = (o[k] || 0) + m[k]); }); return o; };
const shareOf = (o, k) => { const tot = Object.values(o).reduce((s, v) => s + v, 0) || 1; return 100 * (o[k] || 0) / tot; };
const share = o => Object.keys(o).sort((x, y) => o[y] - o[x]).map(k => k + " " + n1(shareOf(o, k)) + "%");

const units = [];
runs.forEach(g => Object.keys(g.perUnit).forEach(k => units.push(Object.assign({ game:g }, g.perUnit[k], { id:k }))));

const hard = [];
runs.forEach(g => {
  const tag = g.cfg.players + "p/" + g.cfg.gameMode + "/" + g.cfg.map + "/" + (g.cfg.seating || g.cfg.mode);
  if(g.guardHit) hard.push("a game never ended: " + tag);
  if(g.stuck) hard.push("a phone was refused mid-game (" + tag + "): " + g.stuck);
  if(g.negativeScore) hard.push("a score went negative: " + tag);
  if(!g.boardWinner) hard.push("the game ended with nobody over the line: " + tag);
});

/* ---- the totals every other number hangs off ---- */
const TOT = {
  games: runs.length,
  rounds: sum(runs, g => g.rounds),
  seatRounds: sum(units, u => u.game.rounds),
  solved: sum(runs, g => g.solved),
  unsolved: sum(runs, g => g.unsolved),
  buzzes: sum(runs, g => g.buzzes),
  wrong: sum(runs, g => g.lockouts),
  cards: sum(runs, g => Object.values(g.cardsDrawn).reduce((s, v) => s + v, 0)),
  played: sum(runs, g => Object.values(g.cardsPlayed).reduce((s, v) => s + v, 0)),
  wilds: sum(runs, g => g.wildHits),
  hours: sum(runs, g => g.minutes) / 60,
  secs: (Date.now() - T0) / 1000
};

const modsAll = merge(runs, g => g.mods);
const cardsDrawn = merge(runs, g => g.cardsDrawn);
const cardsPlayed = merge(runs, g => g.cardsPlayed);
const bandsAll = merge(runs, g => g.bands);
const stepHist = merge(runs, g => g.stepHist);
const topicsSeen = merge(runs, g => g.topics);
const ALL_TOPICS = Object.keys(SAMPLE.packs().TOPICS);
const ALL_CARDS = Object.keys(SAMPLE.packs().CARDS);
const ALL_MODS = ["S","F","O","M","B","G","T","U","W","L"];
const MOD_NAME = { S:"Standard", F:"Fast", O:"One word", M:"Mime", B:"Blind",
                   G:"Gamble", T:"Partners", U:"Duel", W:"Two words", L:"The link" };

/* ---- json for anything downstream ---- */
if(has("json")){
  console.log(JSON.stringify({ seed:SEED, totals:TOT, runs: runs.map(g => ({
    cfg:g.cfg, rounds:g.rounds, minutes:g.minutes, scores:g.scores, margin:g.margin,
    boardWinner:g.boardWinner, scoreWinner:g.scoreWinner, mods:g.mods, unsolved:g.unsolved
  })) }, null, 1));
  process.exit(hard.length ? 1 : 0);
}

/* ---- laying it out ---- */
const R = [];
const line = s => R.push(s === undefined ? "" : String(s).replace(/\s+$/, ""));
const rule = (c) => line((c || "─").repeat(74));
let sectionNo = 0;
const head = s => { sectionNo++; line(); line(sectionNo + " · " + s.toUpperCase()); rule("─"); };
const pad = (s, w, right) => { s = String(s); return s.length >= w ? s
  : (right ? " ".repeat(w - s.length) + s : s + " ".repeat(w - s.length)); };
function table(cols, rows){
  line(cols.map(c => pad(c.h, c.w, c.r)).join(" "));
  line(cols.map(c => "─".repeat(c.w)).join(" "));
  rows.forEach(r => line(r.map((v, i) => pad(v, cols[i].w, cols[i].r)).join(" ")));
}

/* ---- one row of the cross-tabs, for any slice of the games ---- */
function slice(name, a){
  if(!a.length) return null;
  return [name, thou(a.length), n1(avg(a, g => g.rounds)), n1(avg(a, g => g.minutes)),
    n1(med(a, g => g.minutes)), n1(p90(a, g => g.minutes)),
    n1(pct(a, g => g.rounds <= 4)) + "%",
    n1(100 * sum(a, g => g.unsolved) / Math.max(1, sum(a, g => g.rounds))) + "%",
    n1(avg(a, g => g.margin)), n1(pct(a, g => g.margin <= 2)) + "%"];
}
const SLICE_COLS = [
  { h:"", w:16 }, { h:"games", w:7, r:1 }, { h:"rounds", w:7, r:1 },
  { h:"min", w:6, r:1 }, { h:"med", w:6, r:1 }, { h:"p90", w:6, r:1 },
  { h:"≤4 rnd", w:7, r:1 }, { h:"unsolv", w:7, r:1 },
  { h:"margin", w:7, r:1 }, { h:"close", w:6, r:1 }
];

/* ---- the verdict engine ---- */
const CHECKS = [];
function check(area, what, value, show, good, watch, advice){
  const inRange = (v, r) => v >= r[0] && v <= r[1];
  const level = inRange(value, good) ? "ok" : (watch && inRange(value, watch) ? "warn" : "bad");
  CHECKS.push({ area, what, show, level, target:"target " + good[0] + "–" + good[1], advice });
  return level;
}
function checkMax(area, what, value, show, goodMax, watchMax, advice){
  return check(area, what, value, show, [-1e9, goodMax], [-1e9, watchMax], advice);
}
function checkMin(area, what, value, show, goodMin, watchMin, advice){
  return check(area, what, value, show, [goodMin, 1e9], [watchMin, 1e9], advice);
}

/* ═══════════════════════ the report ═══════════════════════ */
rule("═");
line("ASIMON · PLAYTEST AUDIT");
line(thou(TOT.games) + " games · " + thou(TOT.rounds) + " rounds · " +
     thou(Math.round(TOT.hours)) + " hours of simulated table time");
line("seed " + SEED + " · " + new Date().toISOString().slice(0, 16).replace("T", " ") +
     " · ran in " + n1(TOT.secs) + "s");
line("bots play through play.js — the same actions a phone sends, nothing behind them");
{
  const only = [];
  if(new Set(runs.map(g => g.cfg.players)).size === 1) only.push(runs[0].cfg.players + " players");
  if(new Set(runs.map(g => g.cfg.gameMode)).size === 1) only.push(runs[0].cfg.gameMode);
  if(new Set(runs.map(g => g.cfg.map)).size === 1) only.push(runs[0].cfg.map);
  if(only.length) line("a slice, not the whole sweep: " + only.join(" · ") +
                       "  —  run bare for all modes, boards and table sizes");
}
rule("═");

/* ---------- 1. the sitting ---------- */
head("the sitting — how long a game runs");
const medRounds = med(runs, g => g.rounds);
const shortGames = pct(runs, g => g.rounds <= 4);
const longGames = pct(runs, g => g.minutes > 40);
const medMin = med(runs, g => g.minutes);
table([{ h:"", w:26 }, { h:"avg", w:8, r:1 }, { h:"median", w:8, r:1 },
       { h:"p90", w:8, r:1 }, { h:"shortest", w:9, r:1 }, { h:"longest", w:9, r:1 }], [
  ["rounds", n1(avg(runs, g => g.rounds)), n0(medRounds), n0(p90(runs, g => g.rounds)),
   n0(Math.min(...runs.map(g => g.rounds))), n0(Math.max(...runs.map(g => g.rounds)))],
  ["minutes at the table", n1(avg(runs, g => g.minutes)), n1(medMin), n1(p90(runs, g => g.minutes)),
   n1(Math.min(...runs.map(g => g.minutes))), n1(Math.max(...runs.map(g => g.minutes)))]
]);
line();
line("  over before it started (≤4 rounds)   " + n1(shortGames) + "% of games");
line("  outstayed its welcome (over 40 min)  " + n1(longGames) + "% of games");
line("  a round costs the table about        " + n1(avg(runs, g => g.minutes) / Math.max(1, avg(runs, g => g.rounds))) + " minutes");
check("Length", "median rounds a game runs", medRounds, n0(medRounds) + " rounds",
      [8, 14], [7, 16], "shorten or lengthen the board: baseRowsForN, or a mode's rowsDelta");
checkMax("Length", "games decided in 4 rounds or fewer", shortGames, n1(shortGames) + "%",
      5, 9, "a round pays too much for the board it moves on — look at POINTS and the flat bonuses");
checkMax("Length", "games running past 40 minutes", longGames, n1(longGames) + "%",
      8, 14, "trim the longest boards: slow's rowsDelta, or storm's");
check("Length", "median minutes at the table", medMin, n1(medMin) + " min",
      [12, 30], [10, 36], "the clock per round times the rounds — adjust either");

/* ---------- 2. modes ---------- */
head("by game mode — four ways to play");
table(SLICE_COLS, MODES.map(m => slice(m, runs.filter(g => g.cfg.gameMode === m))).filter(Boolean));
line();
MODES.forEach(m => {
  const a = runs.filter(g => g.cfg.gameMode === m);
  if(!a.length) return;
  const mods = merge(a, g => g.mods);
  line("  " + pad(m, 10) + "squares: " + share(mods).slice(0, 4).join("  "));
});
/* in minutes, not rounds: the clock is most of what separates the modes, and
   minutes are what a table sitting down for the evening actually feels */
const modeSpread = (function(){
  const r = MODES.map(m => avg(runs.filter(g => g.cfg.gameMode === m), g => g.minutes)).filter(x => x > 0);
  return r.length > 1 ? Math.max(...r) - Math.min(...r) : 0;
})();
if(new Set(runs.map(g => g.cfg.gameMode)).size > 1)
checkMin("Modes", "quick and slow actually differ in length", modeSpread,
      n1(modeSpread) + " minutes apart", 8, 5,
      "the four modes are meant to feel different — widen the timer or rowsDelta gap");

/* ---------- 3. boards ---------- */
head("by board — five maps");
table(SLICE_COLS, MAPS.map(m => slice(m, runs.filter(g => g.cfg.map === m))).filter(Boolean));
line();
line("  what each board actually deals out:");
MAPS.forEach(m => {
  const a = runs.filter(g => g.cfg.map === m);
  if(!a.length) return;
  const mods = merge(a, g => g.mods);
  line("  " + pad(m, 10) + ALL_MODS.map(k => k + " " + n0(shareOf(mods, k)) + "%").join("  "));
});
const boardSpread = (function(){
  const r = MAPS.map(m => avg(runs.filter(g => g.cfg.map === m), g => g.rounds)).filter(x => x > 0);
  return r.length > 1 ? Math.max(...r) - Math.min(...r) : 0;
})();
if(new Set(runs.map(g => g.cfg.map)).size > 1)
checkMax("Boards", "no board is wildly out of step with the rest", boardSpread,
      n1(boardSpread) + " rounds apart", 3.5, 5,
      "one map is much longer or shorter than its siblings — check its rowsDelta");

/* ---------- 4. table sizes ---------- */
head("by table size — three to eight players");
table(SLICE_COLS, wantPlayers.map(n =>
  slice(n + " players", runs.filter(g => g.cfg.players === n))).filter(Boolean));
line();
line("  rows to cross, and how often nobody gets the word:");
wantPlayers.forEach(n => {
  const a = runs.filter(g => g.cfg.players === n);
  if(!a.length) return;
  line("  " + pad(n + " players", 12) +
       pad(Math.min(...a.map(g => g.rowsNeeded)) + "–" + Math.max(...a.map(g => g.rowsNeeded)) + " rows", 12) +
       "unsolved " + n1(100 * sum(a, g => g.unsolved) / sum(a, g => g.rounds)) + "%   " +
       "cards seen " + n1(avg(a, g => Object.values(g.cardsDrawn).reduce((s,v)=>s+v,0))));
});
const sizeSpread = (function(){
  const r = wantPlayers.map(n => avg(runs.filter(g => g.cfg.players === n), g => g.rounds)).filter(x => x > 0);
  return r.length > 1 ? Math.max(...r) - Math.min(...r) : 0;
})();
if(new Set(runs.map(g => g.cfg.players)).size > 1)
checkMax("Table size", "a game runs about as long at any table size", sizeSpread,
      n1(sizeSpread) + " rounds apart", 2.5, 4,
      "baseRowsForN is meant to even this out — retune it");

/* ---------- 5. solo and pairs ---------- */
const seatOf = g => g.cfg.seating || (g.cfg.mode === "teams" ? "pairs" : "solo");
const soloRuns  = runs.filter(g => seatOf(g) === "solo");
const teamRuns  = runs.filter(g => seatOf(g) === "pairs");
const groupRuns = runs.filter(g => seatOf(g) === "groups");
if(teamRuns.length || groupRuns.length){
  head("three ways to sit");
  table(SLICE_COLS, [slice("every player alone", soloRuns), slice("in pairs", teamRuns),
                     slice("a phone to a group", groupRuns)].filter(Boolean));
  if(groupRuns.length){
    line();
    line("  a group phone carries " + n1(avg(groupRuns, g => g.people / g.units)) +
         " people on average, and the board is a race between " +
         n1(avg(groupRuns, g => g.units)) + " of them");
  }
  const spread = (function(){
    const r = [soloRuns, teamRuns, groupRuns].filter(a => a.length).map(a => avg(a, g => g.rounds));
    return r.length > 1 ? Math.max(...r) - Math.min(...r) : 0;
  })();
  checkMax("Seating", "solo, pairs and groups run about as long as each other", spread,
        n1(spread) + " rounds apart", 2, 3.5,
        "the board is a race between units — check baseRowsForN at the unit counts each seating produces");
}

/* ---------- 6. the round ---------- */
head("the round — what happens between the phones");
const unsolvedPct = 100 * TOT.unsolved / Math.max(1, TOT.rounds);
const wrongPer = TOT.wrong / Math.max(1, TOT.games);
line("  rounds played            " + thou(TOT.rounds));
line("  somebody got it          " + n1(100 * TOT.solved / Math.max(1, TOT.rounds)) + "%");
line("  nobody got it            " + n1(unsolvedPct) + "%   (the giver takes nothing)");
line("  shouts, right and wrong  " + thou(TOT.buzzes) + "   of which wrong " +
     n1(100 * TOT.wrong / Math.max(1, TOT.buzzes)) + "%");
line("  wrong shouts per game    " + n1(wrongPer));
line();
line("  where a solve landed on the clock — the whole game is aimed at the last of these:");
table([{ h:"", w:26 }, { h:"share", w:8, r:1 }, { h:"the giver takes", w:18 }], [
  ["too obvious (0–25%)", n1(shareOf(bandsAll, "early")) + "%", "1, flat"],
  ["well pitched (25–70%)", n1(shareOf(bandsAll, "mid")) + "%", "the word"],
  ["almost lost them (70%+)", n1(shareOf(bandsAll, "late")) + "%", "the word, plus one"]
]);
line();
line("  the difficulty givers asked for:  " + share(merge(runs, g => g.challenges)).join("   "));
line("  a giving round paid the giver     " + n1(sum(runs, g => g.giverPts) / Math.max(1, sum(runs, g => g.giverRounds))) + " points on average");
line();
line("  the squares a table lands on:");
table([{ h:"square", w:12 }, { h:"share", w:8, r:1 }, { h:"", w:44 }],
  ALL_MODS.map(k => [MOD_NAME[k], n1(shareOf(modsAll, k)) + "%",
    shareOf(modsAll, k) < 2 ? "◂ barely ever met" : ""]));
check("The round", "rounds where nobody gets the word", unsolvedPct, n1(unsolvedPct) + "%",
      [12, 32], [8, 40], "too high and the giver never scores; too low and there is no tension");
check("The round", "wrong shouts per game", wrongPer, n1(wrongPer) + " a game",
      [1, 7], [0.4, 10], "the penalty for a wrong shout is what makes people wait");
checkMin("The round", "solves landing in the late window", shareOf(bandsAll, "late"),
      n1(shareOf(bandsAll, "late")) + "%", 20, 12,
      "the late landing is what the game is about — if it never happens the bands are mistuned");
const commonestMod = ALL_MODS.map(k => ({ k, v:shareOf(modsAll, k) })).sort((a, b) => b.v - a.v)[0];
checkMax("The round", "no one kind of round takes over the game", commonestMod.v,
      MOD_NAME[commonestMod.k] + " " + n1(commonestMod.v) + "%", 40, 48,
      "a board that deals mostly one square is a board with one round on it — reweight the map patterns");
const rarestMod = ALL_MODS.map(k => ({ k, v:shareOf(modsAll, k) })).sort((a, b) => a.v - b.v)[0];
checkMin("The round", "the rarest square is still met", rarestMod.v,
      MOD_NAME[rarestMod.k] + " " + n1(rarestMod.v) + "%", 2, 1,
      "a square nobody lands on is a rule nobody meets — reweight the map patterns");

/* ---------- 7. what a round moves ---------- */
head("each kind of round, and how it plays");
const BY_MOD = {};
{
  const bm = BY_MOD;
  runs.forEach(g => Object.keys(g.byMod).forEach(k => {
    const a = bm[k] = bm[k] || { dealt:0, landed:0, pay:0, secs:0, won:0, lost:0 };
    ["dealt","landed","pay","secs","won","lost"].forEach(f => a[f] += (g.byMod[k][f] || 0));
  }));
  table([{ h:"round", w:11 }, { h:"share", w:7, r:1 }, { h:"dealt", w:9, r:1 },
         { h:"lands", w:7, r:1 }, { h:"when it does", w:13, r:1 },
         { h:"when it does not", w:17, r:1 }, { h:"on average", w:11, r:1 },
         { h:"clock", w:7, r:1 }],
    ALL_MODS.filter(k => bm[k]).map(k => {
      const a = bm[k], died = a.dealt - a.landed;
      return [MOD_NAME[k], n1(shareOf(modsAll, k)) + "%", thou(a.dealt),
              n1(100 * a.landed / Math.max(1, a.dealt)) + "%",
              "+" + n1(a.won / Math.max(1, a.landed)),
              n1(a.lost / Math.max(1, died)),
              n1(a.pay / Math.max(1, a.dealt)),
              n1(a.secs / Math.max(1, a.dealt)) + "s"];
    }));
  line();
  line("  What the giver takes when the round lands, what it costs them when it does not,");
  line("  and the two together. A square worth standing on is one where the first number");
  line("  is worth the second — and a square with no second number is not a bet at all.");
}

head("what a round is worth in ground");
const stepKeys = Object.keys(stepHist).map(Number).sort((a, b) => a - b);
const stepTot = stepKeys.reduce((t, k) => t + stepHist[k], 0) || 1;
const stepAvg = stepKeys.reduce((t, k) => t + k * stepHist[k], 0) / stepTot;
const bigShare = 100 * stepKeys.filter(k => k >= 6).reduce((t, k) => t + stepHist[k], 0) / stepTot;
line("  steps a scorer spends    avg " + n1(stepAvg) + "   most in one round " +
     Math.max(...runs.map(g => g.bigRound)));
line("  " + stepKeys.slice(0, 10).map(k => k + ": " + n1(100 * stepHist[k] / stepTot) + "%").join("  "));
line("  a board is " + Math.min(...runs.map(g => g.rowsNeeded)) + "–" +
     Math.max(...runs.map(g => g.rowsNeeded)) + " rows, so an ordinary round moves about " +
     n1(100 * stepAvg / avg(runs, g => g.rowsNeeded)) + "% of it");
checkMax("Pacing", "rounds that move six or more", bigShare, n1(bigShare) + "%", 8, 15,
      "the big rounds are what end a game early — they come from Cold, the Double square and the Double card stacking");

/* ---------- 8. the cards ---------- */
head("the seven cards");
table([{ h:"card", w:12 }, { h:"drawn", w:8, r:1 }, { h:"share", w:7, r:1 },
       { h:"played", w:8, r:1 }, { h:"of those drawn", w:16, r:1 }, { h:"", w:16 }],
  ALL_CARDS.map(k => {
    const d = cardsDrawn[k] || 0, p = cardsPlayed[k] || 0;
    return [k, thou(d), n1(shareOf(cardsDrawn, k)) + "%", thou(p),
      n1(d ? 100 * p / d : 0) + "%", d === 0 ? "◂ never drawn" : (p === 0 ? "◂ never played" : "")];
  }));
line();
const cardsPerGame = TOT.cards / Math.max(1, TOT.games);
const noCardGames = pct(runs, g => Object.values(g.perUnit).every(u => u.cards === 0));
const someoneNoCard = pct(runs, g => Object.values(g.perUnit).some(u => u.cards === 0));
line("  cards a table meets in a game        " + n1(cardsPerGame));
line("  where they came from                 " +
     share(merge(runs, g => g.cardSource)).join("   "));
line("  games where nobody reached a card    " + n1(noCardGames) + "%");
line("  games where somebody never did       " + n1(someoneNoCard) + "%");
checkMin("Cards", "cards a table meets in a game", cardsPerGame, n1(cardsPerGame) + " a game",
      3, 2, "card squares are too rare — loosen the maps' cardRule");
checkMax("Cards", "games where nobody reaches a card square", noCardGames, n1(noCardGames) + "%",
      10, 18, "a whole system the table never meets");
const deadCard = ALL_CARDS.find(k => !(cardsDrawn[k] > 0) || !(cardsPlayed[k] > 0));
check("Cards", "every card gets drawn and played", deadCard ? 0 : 1,
      deadCard ? deadCard + " never came out" : "all seven seen", [1, 1], null,
      "a card that never appears is content nobody reads");

/* ---------- 9. the wildcard ---------- */
head("the wildcard square");
const wildMet = 100 - pct(runs, g => g.wildHits === 0);
line("  landed on               " + n1(avg(runs, g => g.wildHits)) + " times a game");
line("  games that met one      " + n1(wildMet) + "%");
line("  what it rolled          " + share(merge(runs, g => g.wilds)).join("  "));
checkMin("Wildcard", "games that meet a wildcard at all", wildMet, n1(wildMet) + "%",
      35, 20, "the rarest square on the board — most tables never see it. Loosen wildRule");

/* ---------- 10. fairness and drama ---------- */
head("fairness and drama");
const closeGames = pct(runs, g => g.margin <= 2);
const leadHolds = pct(runs.filter(g => g.halfLeader), g => g.halfLeader === g.boardWinner);
const dryShare = 100 * sum(units, u => u.dry) / Math.max(1, TOT.seatRounds);
/* A round pays two seats — whoever got the word and whoever gave it — so at a
   table of U units, U−2 of them cannot score however well the game is tuned,
   and a round nobody gets pays nobody at all. That floor is 75% at eight
   players and no threshold can argue with it. What design can move is the
   distance below it, which is what Blind rounds and Partners squares buy. */
const floorDry = 100 * sum(runs, g => g.solved * Math.max(0, g.unitCount - 2) + g.unsolved * g.unitCount)
                     / Math.max(1, sum(runs, g => g.rounds * g.unitCount));
const relief = floorDry - dryShare;
const seatsPerRound = sum(runs, g => g.seats) / Math.max(1, sum(runs, g => g.seatRounds2));
const longDry = avg(units, u => u.maxDry);
const giverGap = avg(runs, g => Math.max(...Object.values(g.perUnit).map(u => u.gave)) -
                                Math.min(...Object.values(g.perUnit).map(u => u.gave)));
const zeroFinish = pct(runs, g => g.scores.some(s => s.score === 0));
line("  final margin                       avg " + n1(avg(runs, g => g.margin)) +
     "   median " + n0(med(runs, g => g.margin)));
line("  finished within two points         " + n1(closeGames) + "% of games");
line("  the leader at round 4 went on to win " + n1(leadHolds) + "%");
line("  seats a round actually pays        " + n1(seatsPerRound) + " of the units at the table");
line("  rounds a player scored nothing     " + n1(dryShare) + "% of all seat-rounds");
line("    of which unavoidable              " + n1(floorDry) + "%   (two seats a round, and none when nobody gets it)");
line("    relieved by Blind and Partners    " + n1(relief) + " points below that floor");
line("  longest scoreless run, per player  " + n1(longDry) + " rounds");
line("  players who went 4+ rounds dry     " + n1(pct(units, u => u.maxDry >= 4)) + "%");
line("  giver turns, most minus fewest     " + n1(giverGap));
line("  a player finished on nothing       " + n1(zeroFinish) + "% of games");
/* Two units can cross in the same round: the move queue runs in unit order,
   so the lower-numbered one gets there first and wins the race even when the
   other is ahead on points. Every surface has to agree about that — the
   phone's podium, the screen's table and the headline over both. */
line("  two or more over the line at the end " + n1(pct(runs, g => g.crossed > 1)) + "% of games");
line("  the winner was not the top scorer   " +
     n1(pct(runs, g => g.boardWinner && g.scoreWinner && g.boardWinner !== g.scoreWinner)) +
     "% — the race and the score column disagree this often");
checkMin("Drama", "games that finish within two points", closeGames, n1(closeGames) + "%",
      22, 14, "a runaway is not a game — look at the size of the biggest rounds");
check("Drama", "the halfway leader goes on to win", leadHolds, n1(leadHolds) + "%",
      [45, 75], [38, 82], "below is a coin toss, above is a procession");
/* Not the raw share: at eight players U−2 of the table cannot score whatever
   the rules say, so a flat threshold would only be measuring the guest list. */
checkMin("Drama", "dead rounds relieved below what the seats allow", relief,
      n1(relief) + " points below the " + n1(floorDry) + "% floor", 1, 0,
      "Blind pays the whole table and Partners pays two — a board with too few of either leaves everyone waiting");
checkMax("Drama", "the longest a player waits without scoring", longDry,
      n1(longDry) + " rounds", 5, 6,
      "a run of nothing is what a player actually feels — more Partners and Blind squares shorten it");
checkMax("Fairness", "giver turns, most minus fewest", giverGap, n1(giverGap) + " turns",
      1.5, 2.5, "the game ends mid-rotation; ending on a completed round would even it");
checkMax("Fairness", "players finishing on nothing at all", zeroFinish, n1(zeroFinish) + "%",
      10, 18, "somebody sat through the whole game and never scored");

/* ---------- 11. the content ---------- */
head("the content a table actually sees");
const unseenTopics = ALL_TOPICS.filter(k => !topicsSeen[k]);
const repeats = avg(runs, g => g.repeats);
line("  distinct words in one game   " + n1(avg(runs, g => g.words.length)));
line("  a word came round twice      " + n1(repeats) + " times a game");
line("  topics dealt                 " + (ALL_TOPICS.length - unseenTopics.length) + " of " + ALL_TOPICS.length +
     (unseenTopics.length ? "   never dealt: " + unseenTopics.join(", ") : ""));
checkMax("Content", "a word repeating inside one game", repeats, n1(repeats) + " a game",
      0.2, 1, "S.used is meant to hold words back until the bank is exhausted");
check("Content", "every topic gets dealt", unseenTopics.length ? 0 : 1,
      unseenTopics.length ? unseenTopics.length + " never dealt" : "all " + ALL_TOPICS.length + " seen",
      [1, 1], null, "a topic nobody is offered is content nobody reads");

/* ---------- 12. rules that used to trip ---------- */
head("rules that used to trip over each other");
const swapStalls = sum(runs, g => g.swapDeadlock);
const swLate = sum(runs, g => g.stopwatchLateBand), swPlays = sum(runs, g => g.stopwatchPlays);
line("  Switch with nothing to switch to (a stalled room)  " + swapStalls + " in " + thou(TOT.games) + " games");
line("  Insight on a one-word round (padded to four)       " + sum(runs, g => g.insightOnCold) + " times");
line("  Stopwatch landing the round in the giver's top band " + swLate + " of " + swPlays + " plays");
checkMax("Rules", "Switch stranding a room", swapStalls, swapStalls + " rooms", 0, 0,
      "playcard must deal an alternative before it spends the card");
checkMax("Rules", "Stopwatch pre-paying the giver its top band", swLate, swLate + " of " + swPlays, 0, 0,
      "the card should shorten the round, not push the elapsed clock forward");
checkMax("Engine", "hard failures — stuck rooms, negative scores, endless games",
      hard.length, hard.length + " in " + thou(TOT.games) + " games", 0, 0,
      "these are bugs, not balance");

/* ---------- the verdict ---------- */
const bad = CHECKS.filter(c => c.level === "bad");
const warn = CHECKS.filter(c => c.level === "warn");
const good = CHECKS.filter(c => c.level === "ok");
line();
rule("═");
line("VERDICT · " + good.length + " healthy · " + warn.length + " worth watching · " +
     bad.length + " needs work        (" + CHECKS.length + " checks)");
rule("═");
const show = (c, mark) => {
  line("  " + mark + " " + pad(c.area, 11) + pad(c.what, 46) + " " + c.show);
  if(mark !== "✓") line("      → " + c.advice);
};
if(bad.length){ line(); line("NEEDS WORK"); bad.forEach(c => show(c, "✗")); }
if(warn.length){ line(); line("WORTH WATCHING"); warn.forEach(c => show(c, "!")); }
line(); line("HEALTHY");
good.forEach(c => show(c, "✓"));

if(hard.length){
  line(); line("HARD FAILURES");
  [...new Set(hard)].slice(0, 10).forEach(x => line("  " + x));
}

line();
rule("─");
line(bad.length
  ? "Start with the " + bad.length + " marked NEEDS WORK above — each names what to change."
  : (warn.length ? "Nothing broken. The " + warn.length + " marked WORTH WATCHING are where the next gain is."
                 : "Every check healthy across " + thou(TOT.games) + " games."));
line("Re-run after any change: npm run playtest   (--players 3, --gameMode quick, --map chaos, --json)");
rule("─");

/* ---------------- the same audit, as a page ----------------
   Everything above is already computed; this only gathers it into one object
   so game/playtest-report.js can lay it out. The folder is ignored by git —
   the reports are a record of runs, not of the repo. */
const sliceObj = (name, a) => {
  if(!a.length) return null;
  return { name, games:a.length, rounds:avg(a, g => g.rounds), min:avg(a, g => g.minutes),
    med:med(a, g => g.minutes), p90:p90(a, g => g.minutes),
    short:pct(a, g => g.rounds <= 4),
    unsolved:100 * sum(a, g => g.unsolved) / Math.max(1, sum(a, g => g.rounds)),
    margin:avg(a, g => g.margin), close:pct(a, g => g.margin <= 2) };
};
const sliceNote = (function(){
  const only = [];
  if(new Set(runs.map(g => g.cfg.players)).size === 1) only.push(runs[0].cfg.players + " players");
  if(new Set(runs.map(g => g.cfg.gameMode)).size === 1) only.push(runs[0].cfg.gameMode);
  if(new Set(runs.map(g => g.cfg.map)).size === 1) only.push(runs[0].cfg.map);
  return only.length ? "a slice, not the whole sweep — " + only.join(" · ") : null;
})();

const AUDIT = {
  meta: { seed:SEED, when:new Date().toISOString().slice(0, 16).replace("T", " "),
          games:TOT.games, rounds:TOT.rounds, hours:TOT.hours, secs:n1(TOT.secs), slice:sliceNote },
  sitting: {
    rounds:{ avg:avg(runs, g => g.rounds), med:med(runs, g => g.rounds), p90:p90(runs, g => g.rounds),
             min:Math.min(...runs.map(g => g.rounds)), max:Math.max(...runs.map(g => g.rounds)) },
    minutes:{ avg:avg(runs, g => g.minutes), med:med(runs, g => g.minutes), p90:p90(runs, g => g.minutes),
              min:Math.min(...runs.map(g => g.minutes)), max:Math.max(...runs.map(g => g.minutes)) },
    shortPct:shortGames, longPct:longGames,
    minPerRound:avg(runs, g => g.minutes) / Math.max(1, avg(runs, g => g.rounds))
  },
  slices: {
    mode: MODES.map(m => sliceObj(m, runs.filter(g => g.cfg.gameMode === m))).filter(Boolean),
    map:  MAPS.map(m => sliceObj(m, runs.filter(g => g.cfg.map === m))).filter(Boolean),
    size: wantPlayers.map(n => sliceObj(n + " players", runs.filter(g => g.cfg.players === n))).filter(Boolean),
    seat: [sliceObj("every player alone", soloRuns), sliceObj("in pairs", teamRuns),
           sliceObj("a phone to a group", groupRuns)].filter(Boolean)
  },
  modKeys: ALL_MODS,
  modNames: ALL_MODS.map(k => MOD_NAME[k]),
  rounds: ALL_MODS.filter(k => BY_MOD[k]).map(k => {
    const b = BY_MOD[k];
    const died = b.dealt - b.landed;
    return { name:MOD_NAME[k], share:shareOf(modsAll, k), dealt:b.dealt,
             landed:100 * b.landed / Math.max(1, b.dealt),
             won:b.won / Math.max(1, b.landed),
             lost:b.lost / Math.max(1, died),
             pay:b.pay / Math.max(1, b.dealt),
             secs:b.secs / Math.max(1, b.dealt) };
  }),
  squaresByMap: MAPS.map(m => {
    const a = runs.filter(g => g.cfg.map === m);
    if(!a.length) return null;
    const d = merge(a, g => g.mods), o = {};
    ALL_MODS.forEach(k => o[k] = shareOf(d, k));
    return { name:m, dist:o };
  }).filter(Boolean),
  round: {
    rounds:TOT.rounds, solvedPct:100 * TOT.solved / Math.max(1, TOT.rounds), unsolvedPct,
    buzzes:TOT.buzzes, wrongPct:100 * TOT.wrong / Math.max(1, TOT.buzzes), wrongPer,
    bands:{ early:bandsAll.early || 0, mid:bandsAll.mid || 0, late:bandsAll.late || 0 },
    challengeLine: share(merge(runs, g => g.challenges)).join("  ·  "),
    giverPay: sum(runs, g => g.giverPts) / Math.max(1, sum(runs, g => g.giverRounds)),
    squares: ALL_MODS.map(k => ({ k:MOD_NAME[k], v:shareOf(modsAll, k),
      note: shareOf(modsAll, k) < 2 ? "barely ever met" : "" })).sort((x, y) => y.v - x.v)
  },
  ground: {
    avg:stepAvg, max:Math.max(...runs.map(g => g.bigRound)),
    hist: stepKeys.filter(k => k <= 9).map(k => ({ k, pct:100 * stepHist[k] / stepTot })),
    boardMin:Math.min(...runs.map(g => g.rowsNeeded)), boardMax:Math.max(...runs.map(g => g.rowsNeeded)),
    sharePct:100 * stepAvg / avg(runs, g => g.rowsNeeded)
  },
  cards: ALL_CARDS.map(k => {
    const d = cardsDrawn[k] || 0, pl = cardsPlayed[k] || 0;
    return { key:k, drawn:d, share:shareOf(cardsDrawn, k), played:pl, rate:d ? 100 * pl / d : 0,
             note: d === 0 ? "never drawn" : (pl === 0 ? "never played" : "") };
  }),
  cardStats: { perGame:cardsPerGame, nonePct:noCardGames, somePct:someoneNoCard,
               sourceLine: share(merge(runs, g => g.cardSource)).join("  ·  ") },
  wild: { perGame:avg(runs, g => g.wildHits), metPct:wildMet,
          kindLine: share(merge(runs, g => g.wilds)).join("  ·  ") },
  drama: { marginAvg:avg(runs, g => g.margin), marginMed:med(runs, g => g.margin),
           closePct:closeGames, leadHolds, dryPct:dryShare, longDry,
           dry4Pct:pct(units, u => u.maxDry >= 4), giverGap, zeroPct:zeroFinish },
  content: { distinct:avg(runs, g => g.words.length), repeats,
             topicsSeen:ALL_TOPICS.length - unseenTopics.length, topicsAll:ALL_TOPICS.length,
             unseen:unseenTopics },
  rules: { swapStalls, insightPadded:sum(runs, g => g.insightOnCold), swLate, swPlays },
  checks: CHECKS,
  hard: [...new Set(hard)].slice(0, 20)
};

let wrote = null;
if(!has("no-report")){
  const fs = require("fs"), pathmod = require("path");
  const report = require("./playtest-report");
  const dir = arg("out", pathmod.join(__dirname, "..", "reports"));
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
  const tag = sliceNote ? "-" + sliceNote.split("— ")[1].replace(/[^a-z0-9]+/gi, "-") : "-sweep";
  const base = stamp + tag;
  fs.writeFileSync(pathmod.join(dir, base + ".html"),
    report.render(AUDIT, { title: "Asimon playtest · " + AUDIT.meta.when }));
  fs.writeFileSync(pathmod.join(dir, base + ".json"), JSON.stringify(AUDIT, null, 1));
  const n = report.writeIndex(dir);
  wrote = { file: pathmod.join(dir, base + ".html"), index: pathmod.join(dir, "index.html"), n };
}

console.log(R.join("\n"));
if(wrote){
  console.log("");
  console.log("Report written · " + wrote.file);
  console.log("All " + wrote.n + " reports · " + wrote.index);
}
process.exit(hard.length ? 1 : 0);
