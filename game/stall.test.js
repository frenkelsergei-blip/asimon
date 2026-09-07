/* A room can stall on somebody who is present but not looking at their phone.
   The host must be able to carry on — but not before it is genuinely stuck.
   node game/stall.test.js                                                   */
"use strict";
const play = require("./play");

const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };
const CTX = { armClock(){}, clearClock(){} };

function room(names){
  const r = { code:"TEST", lang:"en", hostId:"p0", phase:"lobby", lanUrl:"x",
              players: names.map((n,i) => ({ id:"p"+i, name:n, online:true,
                                             face:["boy","girl","fox","owl"][i % 4] })) };
  play.startGame(r, {});
  r.phaseAt = Date.now();
  return r;
}
const giverOf = r => r.engine.S.r.giver;
const P = (r,i) => r.players[i];
const view = (r,pid) => play.viewFor(r, pid);
/* pretend the room has been sitting on this step for a while */
const ageBy = (r,ms) => { r.phaseAt = Date.now() - ms; };

/* ---- 1. everyone present and it has only just started: nothing to skip ---- */
{
  const r = room(["A","B","C"]);
  const host = P(r,0), giver = r.players.find(p => p.id === giverOf(r));
  const w = view(r, host.id).waiting;
  ok(w && w.id === giverOf(r), "the room does not report who it is waiting on");
  ok(w.online === true, "a present player was reported as away");
  ok(!view(r, host.id).blocked, "a fresh wait already offered a skip");
  ok(play.applyAction(r, host, { type:"skip" }, CTX).error === "not_stuck",
     "the host skipped a room that had barely started waiting");
}

/* ---- 2. present, but nobody has touched it for a while ---- */
{
  const r = room(["A","B","C"]);
  const host = P(r,0);
  ageBy(r, play.IDLE_MS + 1000);
  const v = view(r, host.id);
  ok(v.blocked && v.blocked.id === giverOf(r), "a long wait did not offer a way past");
  ok(v.waiting.online === true, "the idle player was wrongly marked offline");
  /* the person being waited for cannot skip their own turn */
  const stuckPlayer = r.players.find(p => p.id === giverOf(r));
  ok(play.applyAction(r, stuckPlayer, { type:"skip" }, CTX).error === "your_turn",
     "the awaited player was allowed to skip themselves");
  ok(view(r, stuckPlayer.id).waiting.isYou === true, "the awaited phone was not told it is their turn");
  /* anyone else still holding a phone may carry on — including a non-host */
  const guest = r.players.find(p => p.id !== r.hostId && p.id !== giverOf(r));
  ok(view(r, guest.id).waiting.isYou === false, "a bystander was told it is their turn");
  ok(play.applyAction(r, guest, { type:"skip" }, CTX).ok, "a bystander could not carry the room on");
  ok(r.phase === "reveal", "skipping an idle giver did not end the round, phase=" + r.phase);
}

/* ---- 3. the same, one mover into a two-mover queue ---- */
{
  const r = room(["A","B","C","D"]);
  const e = r.engine;
  const giver = r.players.find(p => p.id === giverOf(r));
  const solver = r.players.find(p => p.id !== giver.id);
  e.S.r.challenge = "open"; e.S.r.pick = 0;
  e.S.r.solvedBy = solver.id; e.S.r.solveMs = e.S.r.total*1000*0.5;
  e.scoreRound();
  r.phase = "reveal"; e.S.screen = "reveal";
  play.applyAction(r, giver, { type:"next" }, CTX);
  ok(r.phase === "move", "did not reach the move phase");

  const order = play.moveOrder(e);
  ok(order.length >= 2, "needed two movers for this check, got " + order.length);

  /* the first mover goes; the second never picks up their phone */
  const firstUnit = e.unitById(order[0]);
  const firstPhone = r.players.find(p => firstUnit.members.indexOf(p.id) >= 0);
  const spots = e.reachable(e.posOf(firstUnit), e.S.steps[firstUnit.id]);
  play.applyAction(r, firstPhone, { type:"movepick", r:spots[0].r, c:spots[0].c }, CTX);
  play.applyAction(r, firstPhone, { type:"moveconfirm" }, CTX);
  if(r.phase === "award"){                       /* landed on a card square */
    const v = view(r, firstPhone.id);
    play.applyAction(r, firstPhone, { type:"take", key:v.award.offers[0].key }, CTX);
  }
  ok(r.phase === "move" && e.S.moveSeat === 1, "the queue did not advance to the second mover");

  const secondUnit = e.unitById(play.moveOrder(e)[1]);
  const watcher = r.players.find(p => secondUnit.members.indexOf(p.id) < 0);
  ok(view(r, watcher.id).move.mine === false, "a watcher was told the move is theirs");

  r.phaseAt = Date.now();                        /* the seat change resets the wait */
  ok(!view(r, watcher.id).blocked, "the second mover was written off immediately");

  ageBy(r, play.IDLE_MS + 1000);
  ok(view(r, watcher.id).blocked, "a stalled second mover offered no way past");
  const stalled = r.players.find(p => secondUnit.members.indexOf(p.id) >= 0);
  ok(play.applyAction(r, stalled, { type:"skip" }, CTX).error === "your_turn",
     "the stalled mover could skip their own move");
  const before = e.S.moveSeat;
  ok(play.applyAction(r, watcher, { type:"skip" }, CTX).ok, "a watcher could not skip the stalled mover");
  ok(e.S.moveSeat > before || r.phase !== "move",
     "skipping the stalled mover left the queue where it was");
}

/* ---- 4. the room can be rescued when the HOST is the one holding it up ---- */
{
  const r = room(["A","B","C"]);
  /* make the host the giver, which is the case that stranded a real game */
  r.hostId = giverOf(r);
  ageBy(r, play.IDLE_MS + 1000);
  const host = r.players.find(p => p.id === r.hostId);
  const other = r.players.find(p => p.id !== r.hostId);
  ok(view(r, host.id).waiting.isYou === true, "the blocking host was not told it is their turn");
  ok(view(r, other.id).waiting.isYou === false, "a bystander was told it is their turn");
  ok(play.applyAction(r, host, { type:"skip" }, CTX).error === "your_turn",
     "the blocking host skipped their own turn");
  ok(play.applyAction(r, other, { type:"skip" }, CTX).ok,
     "nobody could rescue a room stuck on the host");
}

/* ---- 5. a watcher is told whose phone it is on ---- */
{
  const r = room(["A","B","C"]);
  const giver = r.players.find(p => p.id === giverOf(r));
  const watcher = r.players.find(p => p.id !== giver.id);
  const v = view(r, watcher.id);
  ok(v.waiting && v.waiting.name === giver.name, "the watcher is not told who to wait for");
  ok(v.waiting.face !== undefined, "the waiting player carries no face for the screen");
  ok(v.isGiver === false, "the watcher was told they are the giver");
}

console.log(bad.length ? "FAIL ("+bad.length+"):\n"+[...new Set(bad)].join("\n")
                       : "stall ok — a room waits patiently, then anyone but the blocker can carry on");
process.exit(bad.length ? 1 : 0);
