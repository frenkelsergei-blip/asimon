/* The seven cards: what each one does, who may play it, and what the other
   phones are allowed to know about a hand.  node game/cards.test.js        */
"use strict";
const play = require("./play");

const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };
const CTX = { armClock(){}, clearClock(){} };

function room(names){
  const r = {
    code:"TEST", lang:"en", hostId:"p0", phase:"lobby", lanUrl:"x",
    players: names.map((n,i) => ({ id:"p"+i, name:n, online:true }))
  };
  play.startGame(r, {});
  return r;
}
const P = (r,i) => r.players[i];
const giverOf = r => r.engine.S.r.giver;
const other = r => r.players.find(p => p.id !== giverOf(r));
const unitOf = (r,pid) => r.engine.unitOf(pid);

/* drive a fresh room to the table, with a chosen word and an aim */
function toTable(names){
  const r = room(names || ["A","B","C","D"]);
  const e = r.engine, R = e.S.r;
  if(R.mod === "B") return null;                 /* blind rounds have no giver pick */
  const g = r.players.find(p => p.id === giverOf(r));
  play.applyAction(r, g, { type:"challenge", k:"open" }, CTX);
  play.applyAction(r, g, { type:"pick", i:0 }, CTX);
  if(!R.shotPublic) play.applyAction(r, g, { type:"aim", target: other(r).id }, CTX);
  play.applyAction(r, g, { type:"ready" }, CTX);
  return r;
}
function give(r, pid, key){
  const u = unitOf(r, pid);
  u.cards = u.cards || [];
  u.cards.push(key);
  return u;
}

/* ---- 1. a hand is private; only its size is public ---- */
{
  const r = toTable();
  const g = r.players.find(p => p.id === giverOf(r));
  const o = other(r);
  give(r, o.id, "veto");
  const mine  = play.viewFor(r, o.id);
  const yours = play.viewFor(r, g.id);
  ok(mine.hand && mine.hand.length === 1, "a player cannot see their own card");
  ok(mine.hand[0].key === "veto", "the hand carries the wrong card");
  ok(JSON.stringify(yours.hand || []).indexOf("veto") < 0, "LEAK: another phone was sent the card in a hand");
  const cnt = yours.units.find(u => u.id === unitOf(r, o.id).id).cards;
  ok(cnt === 1, "the public card count is wrong: " + cnt);
}

/* ---- 2. every card does its job ---- */
{
  /* stopwatch cuts a running clock to thirty seconds */
  const r = toTable();
  const o = other(r);
  give(r, o.id, "stopwatch");
  const before = r.engine.remainMs();
  ok(before > 60000, "the clock did not start full: " + before);
  /* twenty seconds have already gone: the card must still buy a full thirty */
  r.engine.S.r.startedAt = Date.now() - 20000;
  play.applyAction(r, o, { type:"playcard", key:"stopwatch" }, CTX);
  const after = r.engine.remainMs();
  ok(after <= 30100 && after > 29500, "stopwatch left " + (after/1000).toFixed(1) + "s, not 30");
  ok(r.engine.S.r.startedAt !== null, "stopwatch left the clock stopped");
  ok(unitOf(r, o.id).cards.indexOf("stopwatch") < 0, "the card was not spent");
}
{
  /* insight puts all four words in front of everyone */
  const r = toTable();
  const g = r.players.find(p => p.id === giverOf(r));
  const o = other(r);
  const words = play.viewFor(r, g.id).secret.words.map(w => w.text);
  ok(!play.viewFor(r, o.id).insight, "insight was on before it was played");
  give(r, o.id, "insight");
  play.applyAction(r, o, { type:"playcard", key:"insight" }, CTX);
  const v = play.viewFor(r, o.id);
  ok(v.insight && v.insight.length === words.length, "insight did not reveal the words");
  ok(words.every(w => v.insight.indexOf(w) >= 0), "insight revealed the wrong words");
}
{
  /* veto and mime raise a demand on the giver */
  const r = toTable();
  const o = other(r);
  give(r, o.id, "veto"); give(r, o.id, "mime");
  play.applyAction(r, o, { type:"playcard", key:"veto" }, CTX);
  play.applyAction(r, o, { type:"playcard", key:"mime" }, CTX);
  const v = play.viewFor(r, o.id);
  ok(v.veto === true, "veto did not register");
  ok(v.mimeCard === true, "the mime card did not register");
}
{
  /* double doubles that unit's winnings, and nobody else's */
  const a = toTable(["A","B","C","D"]);
  const g = a.players.find(p => p.id === giverOf(a));
  const o = other(a);
  const solver = a.players.find(p => p.id !== g.id);
  a.engine.S.r.solvedBy = solver.id;
  a.engine.S.r.solveMs = a.engine.S.r.total * 1000 * 0.5;
  a.engine.scoreRound();
  const plain = a.engine.S.result.rows.find(x => x.id === unitOf(a, solver.id).id).pts;

  const b = toTable(["A","B","C","D"]);
  const g2 = b.players.find(p => p.id === giverOf(b));
  const solver2 = b.players.find(p => p.id !== g2.id);
  give(b, solver2.id, "double");
  play.applyAction(b, solver2, { type:"playcard", key:"double" }, CTX);
  b.engine.S.r.solvedBy = solver2.id;
  b.engine.S.r.solveMs = b.engine.S.r.total * 1000 * 0.5;
  b.engine.scoreRound();
  const doubled = b.engine.S.result.rows.find(x => x.id === unitOf(b, solver2.id).id).pts;
  ok(doubled === plain * 2, "double paid " + doubled + " where plain paid " + plain);
}
{
  /* blindfold turns the next round around */
  const r = toTable();
  const o = other(r);
  give(r, o.id, "blindfold");
  play.applyAction(r, o, { type:"playcard", key:"blindfold" }, CTX);
  r.engine.S.r.solvedBy = null;
  r.engine.scoreRound();
  r.engine.newRound();
  ok(r.engine.S.r.mod === "B", "blindfold did not make the next round blind: " + r.engine.S.r.mod);
}

/* ---- 3. switching words: the giver's alone, and it pauses the clock ---- */
{
  const r = toTable();
  const g = r.players.find(p => p.id === giverOf(r));
  const o = other(r);

  give(r, o.id, "swap");
  ok((play.viewFor(r, o.id).hand || []).every(c => c.key !== "swap"),
     "a non-giver was shown Switch in their hand");
  ok(play.applyAction(r, o, { type:"playcard", key:"swap" }, CTX).error === "not_your_turn",
     "a non-giver was allowed to switch the word");

  give(r, g.id, "swap");
  ok((play.viewFor(r, g.id).hand || []).some(c => c.key === "swap"), "the giver cannot see Switch");
  play.applyAction(r, g, { type:"playcard", key:"swap" }, CTX);
  ok(r.phase === "swap", "Switch did not open the word list, phase=" + r.phase);
  ok(r.engine.S.r.startedAt === null, "the clock kept running while the word was switched");

  ok(play.applyAction(r, o, { type:"swappick", i:1 }, CTX).error === "not_your_turn",
     "someone else picked the replacement word");
  ok(play.applyAction(r, g, { type:"swappick", i:0 }, CTX).error === "bad_choice",
     "the giver re-picked the same word");
  play.applyAction(r, g, { type:"swappick", i:2 }, CTX);
  ok(r.phase === "table", "after switching we are in " + r.phase);
  ok(r.engine.S.r.pick === 2, "the word did not change");
  ok(r.engine.S.r.swapped === true, "the switch was not recorded");
  ok(r.engine.S.r.startedAt !== null, "the clock did not restart");
}

/* ---- 4. you cannot play what you do not hold ---- */
{
  const r = toTable();
  const o = other(r);
  ok(play.applyAction(r, o, { type:"playcard", key:"veto" }, CTX).error === "no_such_card",
     "a card was played from an empty hand");
  give(r, o.id, "veto");
  ok(play.applyAction(r, o, { type:"playcard", key:"stopwatch" }, CTX).error === "no_such_card",
     "the wrong card was played");
}

/* ---- 5. the card square ---- */
{
  const r = toTable(["A","B","C","D"]);
  const e = r.engine;
  const g = r.players.find(p => p.id === giverOf(r));
  const solver = r.players.find(p => p.id !== g.id);
  e.S.r.solvedBy = solver.id; e.S.r.solveMs = e.S.r.total*1000*0.5;
  e.scoreRound();
  r.phase = "reveal"; e.S.screen = "reveal";
  play.applyAction(r, g, { type:"next" }, CTX);
  ok(r.phase === "move", "next did not reach the move phase");

  /* stand the first mover one step below a card square, so this never
     depends on where the dice of the round happened to leave them */
  const order = play.moveOrder(e);
  const u = e.unitById(order[0]);
  const mover = r.players.find(p => u.members.indexOf(p.id) >= 0);
  u.pos = { r:2, c:1 };
  e.S.steps[u.id] = 1;
  const spots = e.reachable(e.posOf(u), e.S.steps[u.id]);
  const cardSpot = spots.find(p => e.isCardNode(p.r, p.c));
  ok(!!cardSpot, "no card square one step above row 2, column 1");
  if(cardSpot){
    play.applyAction(r, mover, { type:"movepick", r:cardSpot.r, c:cardSpot.c }, CTX);
    play.applyAction(r, mover, { type:"moveconfirm" }, CTX);
    ok(r.phase === "award", "landing on a card square did not offer a card, phase=" + r.phase);
    const view = play.viewFor(r, mover.id);
    ok(view.award && view.award.mine === true, "the mover was not offered the card");
    ok(view.award.offers.length === 3, "offered " + view.award.offers.length + " cards");

    const bystander = r.players.find(p => u.members.indexOf(p.id) < 0);
    ok(play.viewFor(r, bystander.id).award.mine === false, "a bystander was told the card is theirs");
    ok(play.applyAction(r, bystander, { type:"take", key:view.award.offers[0].key }, CTX).error === "not_your_turn",
       "a bystander took someone else's card");
    ok(play.applyAction(r, mover, { type:"take", key:"nonesuch" }, CTX).error === "bad_choice",
       "a card that was not offered could be taken");

    const before = (u.cards || []).length;
    play.applyAction(r, mover, { type:"take", key:view.award.offers[1].key }, CTX);
    ok((u.cards || []).length === before + 1, "the card was not added to the hand");
    ok(r.phase !== "award", "the game stayed on the award screen");
  }
}

console.log(bad.length ? "FAIL (" + bad.length + "):\n" + [...new Set(bad)].join("\n")
                       : "cards ok — seven cards, hands stay private, Switch is the giver's alone");
process.exit(bad.length ? 1 : 0);
