/* Three things a round has to get right about who may do what.

   A Blind round turns the table inside out: the giver becomes the guesser and
   is the only person who never sees the word, so the verdict cannot sit on
   their phone. A Duel closes the round down to one name, and everybody else is
   watching rather than locked out — which matters, because being locked out
   costs points. And the game is a race: it ends when somebody crosses the
   line, which is not always whoever tops the score column, so the podium has
   to name the one who actually won.

   node game/round.test.js                                                   */
"use strict";
const play = require("./play");

const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };
const CTX = { armClock(){}, clearClock(){} };

function room(n){
  const r = {
    code:"TEST", lang:"en", hostId:"p0", phase:"lobby", lanUrl:"x", mapId:"classic",
    players: Array.from({ length:n }, (_, i) => ({ id:"p"+i, name:"P"+i, online:true }))
  };
  play.startGame(r, {});
  r.engine.S.players.forEach(p =>
    play.applyAction(r, r.players.find(x => x.id === p.id), { type:"order_ok" }, CTX));
  return r;
}
const P = (r, id) => r.players.find(p => p.id === id);

/* ---- 1. a blind round: the word goes everywhere except the giver ---- */
{
  const r = room(4), e = r.engine;
  /* the Blindfold card's own doing, reached here directly */
  e.S.forceBlind = true; e.newRound(); r.phase = "blind";
  const R = e.S.r, g = R.giver;
  const others = r.players.filter(p => p.id !== g);

  ok(R.mod === "B", "the round did not turn blind: " + R.mod);
  ok(!play.viewFor(r, g).secret, "LEAK: the guesser was sent the word on a blind round");
  ok(others.every(p => !!play.viewFor(r, p.id).secret), "the table could not see the word");

  play.applyAction(r, others[0], { type:"pick", i:2 }, CTX);
  play.applyAction(r, others[0], { type:"ready" }, CTX);
  play.applyAction(r, P(r, g), { type:"buzz" }, CTX);
  ok(r.phase === "judge", "the guess did not reach a verdict, phase=" + r.phase);

  /* the one phone that cannot know is the one phone that may not say */
  ok(play.applyAction(r, P(r, g), { type:"judge", yes:true }, CTX).error === "not_your_turn",
     "the guesser judged their own guess on a blind round");
  ok(play.awaitedIds(r).indexOf(g) < 0, "the room said it was waiting on the guesser");
  ok(others.every(p => play.awaitedIds(r).indexOf(p.id) >= 0),
     "the room did not ask the people who can see the word");
  ok(!play.waitingOn(r), "a blind verdict named one phone to wait for; anybody may answer");

  /* the phone decides who draws the yes/no with this one line, in vJudge —
     kept here so a change on either side of the wire is caught by the other */
  const showsVerdict = v => v.mod.key === "B" ? !v.isGiver : v.isGiver;
  ok(!showsVerdict(play.viewFor(r, g)), "the guesser's phone would still draw the verdict buttons");
  ok(others.every(p => showsVerdict(play.viewFor(r, p.id))),
     "a phone that can see the word would be left on the waiting card");

  const res = play.applyAction(r, others[1], { type:"judge", yes:true }, CTX);
  ok(res.ok === true, "a phone that can see the word was refused the verdict: " + JSON.stringify(res));
  ok(r.phase === "reveal", "the verdict did not end the round, phase=" + r.phase);
  ok(e.S.result.solvedBy === g, "the blind round credited the wrong person");
}

/* an ordinary round still belongs to the giver alone */
{
  const r = room(4), e = r.engine;
  while(e.S.r.mod === "B"){ e.S.giverIdx++; e.newRound(); r.phase = "giver"; }
  const R = e.S.r, g = R.giver;
  const o = r.players.find(p => p.id !== g);
  play.applyAction(r, P(r, g), { type:"challenge", k:"open" }, CTX);
  play.applyAction(r, P(r, g), { type:"pick", i:0 }, CTX);
  if(!R.shotPublic) play.applyAction(r, P(r, g), { type:"aim", target:o.id }, CTX);
  play.applyAction(r, P(r, g), { type:"ready" }, CTX);
  play.applyAction(r, o, { type:"buzz" }, CTX);
  ok(play.applyAction(r, o, { type:"judge", yes:true }, CTX).error === "not_your_turn",
     "a guesser marked their own answer right on an ordinary round");
  const showsVerdict = v => v.mod.key === "B" ? !v.isGiver : v.isGiver;
  ok(showsVerdict(play.viewFor(r, g)), "the giver's phone would not draw the verdict buttons");
  ok(!showsVerdict(play.viewFor(r, o.id)), "a guesser's phone would draw the verdict buttons");
  ok(play.applyAction(r, P(r, g), { type:"judge", yes:true }, CTX).ok === true,
     "the giver could not judge an ordinary round");
}

/* ---- 2. a Duel: one name against another, and the rest watching ---- */
/* Put the giver's unit on a Duel square and deal again, rather than waiting for
   the board to hand us one. classic column 0 is S,U,S,F,T,U — row 2 is a U. */
function duelRound(n){
  const r = room(n), e = r.engine;
  for(let i = 0; i < 40; i++){
    e.S.units.forEach(u => { u.pos = { r:2, c:0 }; });
    e.S.giverIdx = i;
    e.newRound();
    if(e.S.r.mod === "U"){ r.phase = "giver"; return r; }
  }
  return null;
}
{
  const r = duelRound(4);
  ok(!!r, "no Duel round could be dealt from a Duel square");
  if(r){
    const e = r.engine, R = e.S.r, g = R.giver;
    const others = r.players.filter(p => p.id !== g);

    ok(R.shotPublic === true, "a Duel's target is not public");
    ok(R.shotFixed === false, "a Duel's target was drawn instead of named");
    ok(R.shot === null, "a Duel came with a target already chosen");
    ok(play.viewFor(r, others[0].id).shotFixed === false,
       "the phone was told the target is fixed, so the giver could not re-name");

    /* the giver names one, out loud, and may change their mind until ready */
    play.applyAction(r, P(r, g), { type:"challenge", k:"open" }, CTX);
    play.applyAction(r, P(r, g), { type:"pick", i:1 }, CTX);
    ok(play.applyAction(r, P(r, g), { type:"ready" }, CTX).error === "aim_first",
       "a Duel started without anybody named");
    play.applyAction(r, P(r, g), { type:"aim", target:others[0].id }, CTX);
    ok(play.viewFor(r, others[1].id).partner.id === others[0].id,
       "the table was not told who was named");
    ok(!play.applyAction(r, P(r, g), { type:"aim", target:others[1].id }, CTX).error,
       "the giver could not change who they named");
    ok(R.shot === others[1].id, "the second naming did not take");

    play.applyAction(r, P(r, g), { type:"ready" }, CTX);
    const target = others[1], watcher = others[0];
    ok(R.only === target.id, "the round did not close down to the one name");

    /* the buzzer belongs to the named person and to nobody else */
    const wv = play.viewFor(r, watcher.id);
    ok(wv.watching === true, "a watcher was not told they are watching");
    ok(wv.iAmOut !== true, "a watcher was shown as locked out, which costs points they never lost");
    ok((wv.duel || {}).id === target.id, "the watcher was not told who is answering");
    ok(play.viewFor(r, target.id).watching === false, "the named person was told to watch");
    ok(play.viewFor(r, g).watching === false, "the giver was told to watch");

    ok(play.applyAction(r, watcher, { type:"buzz" }, CTX).error === "not_your_turn",
       "somebody who was not named answered a Duel");
    ok(R.lockedOut.length === 0, "watching a Duel put somebody in the locked-out list");

    /* and a wrong shout from the one who was named ends it */
    play.applyAction(r, target, { type:"buzz" }, CTX);
    ok(r.phase === "judge", "the named person could not answer");
    play.applyAction(r, P(r, g), { type:"judge", yes:false }, CTX);
    ok(r.phase === "reveal", "a wrong shout in a Duel left the round running with nobody to answer");
    ok(e.S.result.solvedBy === null, "the round was scored as solved");
    const rows = e.S.result.rows;
    const lost = rows.filter(x => x.pts < 0);
    ok(lost.length === 1 && lost[0].id === e.unitOf(target.id).id,
       "a Duel docked " + lost.length + " units; only the one who shouted should pay");
  }
}

/* the giver takes more for calling a Duel than for a secret aim */
{
  const r = duelRound(4);
  if(r){
    const e = r.engine, R = e.S.r, g = R.giver;
    const target = r.players.find(p => p.id !== g);
    play.applyAction(r, P(r, g), { type:"challenge", k:"open" }, CTX);
    play.applyAction(r, P(r, g), { type:"pick", i:3 }, CTX);
    play.applyAction(r, P(r, g), { type:"aim", target:target.id }, CTX);
    play.applyAction(r, P(r, g), { type:"ready" }, CTX);
    R.acc = Math.round(R.total * 1000 * 0.5); R.startedAt = Date.now();
    play.applyAction(r, target, { type:"buzz" }, CTX);
    play.applyAction(r, P(r, g), { type:"judge", yes:true }, CTX);
    const giverRow = e.S.result.rows.find(x => x.giver);
    const val = e.S.result.val;
    ok(giverRow.pts === val + 2,
       "calling a Duel paid the giver " + giverRow.pts + " on a word worth " + val +
       "; the band plus two was expected");
    ok(giverRow.why.some(w => /2/.test(w)), "the reason given does not name the raised bonus");
  }
}

/* ---- 3. the podium names whoever won, not whoever counted highest ---- */
/* Points are steps you spend, but a wrong shout costs points without costing
   ground — so the score column and the finish line disagree about one game in
   five, and the phone crowns the head of that list. */
{
  const r = room(3), e = r.engine, S = e.S;
  const crossed = S.units[0], richer = S.units[1];
  crossed.score = 4;  crossed.pos = { r:e.ROWS()+1, c:1 };
  richer.score = 30;  richer.pos = { r:3, c:1 };
  r.phase = "over";

  const v = play.viewFor(r, "p0");
  ok(v.winner === crossed.id, "the game did not end on the unit that crossed the line");
  ok(v.standings[0].id === crossed.id,
     "the podium was led by " + v.standings[0].name + " on " + v.standings[0].score +
     ", not by " + crossed.name + " who actually won");
  ok(v.standings.length === S.units.length, "the podium lost a player");
  ok(v.standings.some(x => x.id === richer.id), "the score leader fell off the podium");
  ok(v.standings[0].row > v.standings[1].row || v.standings[1].id === richer.id,
     "the rest of the podium is not in any order");
}

/* Challenge mode wins on the score instead, and the podium has to follow the
   rule the game was actually playing. */
{
  const r = {
    code:"TEST", lang:"en", hostId:"p0", phase:"lobby", lanUrl:"x", mapId:"classic",
    players: Array.from({ length:3 }, (_, i) => ({ id:"p"+i, name:"P"+i, online:true }))
  };
  play.startGame(r, { gameMode:"challenge" });
  const e = r.engine, S = e.S;
  S.units[1].score = 22;                  /* past the target of 20 */
  S.units[0].score = 9; S.units[0].pos = { r:5, c:1 };
  r.phase = "over";
  const v = play.viewFor(r, "p0");
  ok(v.winner === S.units[1].id, "challenge mode did not end on the score target");
  ok(v.standings[0].id === S.units[1].id, "the challenge podium named the wrong winner");
}

console.log(bad.length ? "FAIL (" + bad.length + "):\n" + [...new Set(bad)].join("\n")
  : "round ok — a blind verdict belongs to the table, a Duel belongs to one name, "+
    "and the podium names the winner");
process.exit(bad.length ? 1 : 0);
