/* Stopping, and getting up.

   Two things a table needs that the rules did not have. A break: any phone
   holds the room, the clock stops where it stands, and it starts again by
   itself so a break nobody ends cannot strand everyone. And a seat given up
   mid-game: whoever is left plays on, and the room is put back on a step
   somebody is still there to take.

   node game/leave.test.js                                                   */
"use strict";
const play = require("./play.js");

const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };
const CTX = { armClock(){}, clearClock(){}, armPause(){} };
const FACES = ["boy","girl","fox","owl","panda","beard"];

function room(names, opts){
  const r = { code:"TEST", lang:"en", hostId:"p0", phase:"lobby", lanUrl:"x",
              players: names.map((n, i) => ({ id:"p"+i, name:n, online:true, face:FACES[i % 6] })) };
  play.startGame(r, opts || {});
  r.players.forEach(p => play.applyAction(r, p, { type:"order_ok" }, CTX));
  r.phaseAt = Date.now();
  return r;
}
const P = (r, i) => r.players.find(p => p.id === "p" + i);
/* the phone a person is sitting behind — in groups that is not their own id */
const phoneOf = (r, id) => r.players.find(p => p.id === play.phoneOf(r, id));
const giver = r => r.engine.S.r.giver;
const act = (r, who, a) => play.applyAction(r, who, a, CTX);
const view = (r, pid) => play.viewFor(r, pid);

/* get a room from the giver's screen to the running clock, whichever way
   round the round happens to be */
function toTable(r){
  const S = r.engine.S, R = S.r, g = phoneOf(r, R.giver);
  if(R.mod === "B"){
    const other = r.players.find(p => !play.owns(r, p.id, R.giver));
    act(r, other, { type:"pick", i:0 });
    act(r, other, { type:"ready" });
    return r;
  }
  act(r, g, { type:"challenge", k:"open" });
  act(r, g, { type:"pick", i:0 });
  if(!R.shotPublic){
    const gu = r.engine.unitOf(R.giver);
    const target = S.players.find(p => gu.members.indexOf(p.id) < 0);
    act(r, g, { type:"aim", target:target.id });
  }
  act(r, g, { type:"ready" });
  return r;
}
/* the shortest honest path to the next giver: nobody gets it, and on */
function nextRound(r){
  if(r.phase !== "table") toTable(r);
  const host = r.players.find(p => p.id === r.hostId);
  act(r, host, { type:"nobody" });
  act(r, host, { type:"next" });
  return r;
}

/* ================= the break ================= */

/* ---- 1. any phone holds the room, and the clock holds with it ---- */
{
  const r = toTable(room(["A","B","C"]));
  const notGiver = r.players.find(p => p.id !== giver(r));
  const before = r.engine.remainMs();
  ok(before > 0, "the clock was not running before the break");

  ok(act(r, notGiver, { type:"pause" }).ok, "a phone that is not the giver could not call a break");
  ok(!!r.pause, "the room did not go on a break");
  ok(r.engine.S.r.startedAt === null, "the round clock kept running through a break");

  /* nothing else answers while it is on */
  ok(act(r, phoneOf(r, giver(r)), { type:"nobody" }).error === "paused",
     "the room answered a round action while on a break");
  ok(act(r, notGiver, { type:"buzz" }).error === "paused", "a buzz got through a break");

  /* and every phone is told, including whose break it is */
  const mine = view(r, notGiver.id).paused, theirs = view(r, giver(r)).paused;
  ok(mine && mine.mine === true, "the phone that called the break was not told it is theirs to end");
  ok(mine.ms > 0 && mine.ms <= play.PAUSE_MS, "the break did not come with the time left on it");
  ok(theirs && theirs.name === notGiver.name, "the break did not say who asked for it");
  /* p0 is the host here, and the host may always end one */
  ok(theirs.mine === (giver(r) === "p0"), "the break was offered to the wrong phone to end");
  ok(!view(r, notGiver.id).waiting && !view(r, notGiver.id).blocked,
     "a room on a break still reported somebody it was waiting on");
}

/* ---- 2. another press adds another half minute, up to the ceiling ---- */
{
  const r = toTable(room(["A","B","C"]));
  const me = P(r, 1);
  act(r, me, { type:"pause" });
  r.pause.until = Date.now() + 4000;                 /* nearly out */
  act(r, me, { type:"pause" });
  ok(play.pauseLeft(r) > play.PAUSE_MS - 2000, "pressing again did not add another half minute");
  ok(r.pause.presses === 2, "the room did not count the second press");

  /* the ceiling is measured from when the break started, not from each press */
  r.pause.startedAt = Date.now() - play.PAUSE_MAX_MS + 5000;
  act(r, me, { type:"pause" });
  ok(play.pauseLeft(r) <= 5100, "a break was allowed to stack past its ceiling");
}

/* ---- 3. the break belongs to whoever called it, and to the host ---- */
{
  const r = toTable(room(["A","B","C"]));
  const caller = P(r, 2), other = P(r, 1), host = P(r, 0);
  act(r, caller, { type:"pause" });
  ok(act(r, other, { type:"resume" }).error === "not_your_break",
     "somebody else's break could be cut short by anyone");
  ok(!!r.pause, "the refused resume ended the break anyway");
  ok(act(r, host, { type:"resume" }).ok, "the host could not end a break");
  ok(!r.pause, "the room stayed on a break after it was ended");
  ok(r.engine.S.r.startedAt !== null, "the clock did not start again after the break");

  /* and the caller can end their own */
  act(r, caller, { type:"pause" });
  ok(act(r, caller, { type:"resume" }).ok, "the phone that called a break could not end it");
}

/* ---- 4. the wait is handed back the seconds the break took ---- */
{
  const r = toTable(room(["A","B","C"]));
  r.phaseAt = Date.now() - 50000;                    /* fifty seconds into a wait */
  act(r, P(r, 1), { type:"pause" });
  r.pausedAt = Date.now() - 30000;                   /* half a minute of it a break */
  play.endPause(r, CTX);
  const waited = Date.now() - r.phaseAt;
  ok(waited > 18000 && waited < 23000,
     "the break was counted against the phone the room was waiting on, waited=" + waited);
}

/* ---- 5. it ends by itself ---- */
{
  const r = toTable(room(["A","B","C"]));
  act(r, P(r, 1), { type:"pause" });
  r.pause.until = Date.now() - 1;
  play.endPause(r, CTX);                              /* what the server's timer calls */
  ok(!r.pause, "a break that ran out did not end");
  ok(r.phase === "table" && r.engine.S.r.startedAt !== null,
     "the room did not go back to the round when the break ran out");
}

/* ---- 6. a break cannot be called on a finished game ---- */
{
  const r = toTable(room(["A","B","C"]));
  r.phase = "over";
  ok(act(r, P(r, 1), { type:"pause" }).error === "not_now", "a finished game went on a break");
}

/* ================= getting up ================= */

/* ---- 7. in the lobby, as it always was ---- */
{
  const r = { code:"T", lang:"en", hostId:"p0", phase:"lobby",
              players:[{ id:"p0", name:"A", online:true }, { id:"p1", name:"B", online:true }],
              people:[] };
  play.addPerson(r, "p0", "A", "boy"); play.addPerson(r, "p1", "B", "girl");
  play.leave(r, r.players[1], CTX);
  ok(r.players.length === 1 && r.people.length === 1, "leaving the lobby left something behind");
}

/* ---- 8. the giver walks out mid-clue: the round is dealt again ---- */
{
  const r = toTable(room(["A","B","C","D"]));
  const was = giver(r), round = r.engine.S.round;
  const wasName = r.engine.playerById(was).name;
  play.leave(r, phoneOf(r, was), CTX);
  ok(r.engine.S.players.every(p => p.id !== was), "the seat stayed at the table");
  ok(giver(r) !== was, "the round is still being given by somebody who left");
  ok(r.engine.S.round === round, "the abandoned round was counted, round=" + r.engine.S.round);
  ok(r.phase === "giver" || r.phase === "blind", "the room did not go back to a fresh clue, phase=" + r.phase);
  ok(r.engine.playerById(was).name === wasName,
     "the name of whoever left was not kept for the round that still mentions them");
}

/* ---- 9. a guesser walks out: the round carries on without them ---- */
{
  const r = toTable(room(["A","B","C","D"]));
  const g = giver(r);
  const others = r.engine.S.players.filter(p => p.id !== g).map(p => p.id);
  r.engine.S.r.lockedOut.push(others[0]);            /* one is already out */
  r.engine.S.r.shot = others[1]; r.engine.S.r.shotPublic = true;
  play.leave(r, phoneOf(r, others[1]), CTX);
  ok(r.phase === "table", "one guesser leaving ended the round, phase=" + r.phase);
  ok(giver(r) === g, "the giver changed when somebody else left");
  ok(r.engine.S.r.shot !== others[1], "the round was still aimed at somebody who had gone");
  ok(r.engine.S.r.lockedOut.indexOf(others[0]) >= 0, "an unrelated lock-out was cleared");
}

/* ---- 10. the last one who could shout leaves: the round is scored ---- */
{
  const r = toTable(room(["A","B","C"]));
  const g = giver(r);
  const others = r.engine.S.players.filter(p => p.id !== g).map(p => p.id);
  r.engine.S.r.lockedOut.push(others[0]);
  play.leave(r, phoneOf(r, others[1]), CTX);
  ok(r.phase === "reveal" || r.phase === "over",
     "the round ran on with nobody left to answer it, phase=" + r.phase);
}

/* ---- 11. the queue moves on without the unit that left ---- */
{
  const r = toTable(room(["A","B","C","D"]));
  const S = r.engine.S;
  S.steps = {}; S.units.forEach(u => { S.steps[u.id] = 2; });
  S.moveSeat = 0; r.phase = "move"; S.screen = "move";
  const moving = play.moveOrder(r.engine)[0];
  const whoMoves = r.engine.unitById(moving).members[0];
  play.leave(r, phoneOf(r, whoMoves), CTX);
  ok(play.moveOrder(r.engine).indexOf(moving) < 0, "the unit that left is still in the queue");
  ok(r.phase === "move", "the board stopped when the mover left, phase=" + r.phase);
  const now = play.moveOrder(r.engine)[S.moveSeat];
  ok(now && now !== moving, "the queue did not move on to somebody who is still here");
}

/* ---- 12. down to one, and the game is called ---- */
{
  const r = toTable(room(["A","B","C"]));
  play.leave(r, P(r, 1), CTX);
  play.leave(r, P(r, 2), CTX);
  ok(r.phase === "over", "a table of one carried on playing, phase=" + r.phase);
  ok(view(r, "p0").standings.length >= 1, "the last screen has no standings on it");
}

/* ---- 13. pairs: a unit lives on with whoever is left in it ---- */
{
  const r = toTable(room(["A","B","C","D"], { seating:"pairs" }));
  const S = r.engine.S;
  ok(S.units.length === 2 && S.units.every(u => u.members.length === 2), "the room did not sit in pairs");
  const pair = S.units[0], goes = pair.members[1];
  const scoreWas = pair.score;
  play.leave(r, phoneOf(r, goes), CTX);
  ok(S.units.length === 2, "a pair was dissolved when one of the two left");
  ok(pair.members.length === 1 && pair.members[0] !== goes, "the pair kept the person who left");
  ok(pair.score === scoreWas, "the pair lost its score when its partner left");
}

/* ---- 14. groups: the phone is the group, so the group goes with it ---- */
{
  const r = { players:[], people:[], seating:"groups", lang:"en", mapId:"classic",
              phase:"lobby", hostId:"pA" };
  [["pA","Frogs",["Dana","Yoav"]], ["pB","Squids",["Ron","Shira"]],
   ["pC","Ants",["Tamar","Omer"]]].forEach(([id, groupName, names]) => {
    r.players.push({ id, name:names[0], face:"boy", groupName, online:true });
    names.forEach(n => play.addPerson(r, id, n, "boy"));
  });
  play.startGame(r, {});
  r.players.forEach(p => play.applyAction(r, p, { type:"order_ok" }, CTX));
  r.phaseAt = Date.now();
  const S = r.engine.S;
  ok(S.units.length === 3, "three phones did not make three groups");

  play.leave(r, r.players.find(p => p.id === "pB"), CTX);
  ok(S.units.length === 2, "the group came off the board when its phone left");
  ok(S.players.every(p => ["Ron","Shira"].indexOf(p.name) < 0), "the group's people stayed in the order");
  ok(play.roster(r).length === 4, "the roster kept people whose phone had gone");
  /* the turn still goes round the groups that are left */
  const seen = {};
  for(let i = 0; i < 4; i++){
    const g = r.engine.unitOf(giver(r));
    ok(!!g && g.members.length > 0, "the turn landed on a group with nobody in it");
    seen[g.id] = true;
    nextRound(r);
  }
  ok(Object.keys(seen).length === 2, "the giving turn stopped visiting one of the groups left");
}

/* ---- 15. the rotation does not skip when a seat before it goes ---- */
{
  const r = toTable(room(["A","B","C","D"]));
  const S = r.engine.S;
  const order = S.players.map(p => p.id);
  const next = order[(S.giverIdx + 1) % order.length];   /* who should give next */
  const before = order[0] === giver(r) ? order[1] : order[0];
  if(before !== next && before !== giver(r)){
    play.leave(r, phoneOf(r, before), CTX);
    r.engine.scoreRound();                               /* ends the round, moves the pointer */
    r.engine.newRound();
    ok(giver(r) === next, "the turn skipped a person when a seat before it was given up");
  }
}

/* ---- 16. a break called by somebody who then leaves ends with them ---- */
{
  const r = toTable(room(["A","B","C","D"]));
  const caller = r.players.find(p => p.id !== giver(r));
  act(r, caller, { type:"pause" });
  play.leave(r, caller, CTX);
  ok(!r.pause, "a break outlived the phone that called it");
}

console.log(bad.length ? "FAIL ("+bad.length+"):\n"+bad.join("\n")
  : "leave ok — a break holds the room and ends by itself, and a seat can be "+
    "given up mid-round without stranding the table");
process.exit(bad.length ? 1 : 0);
