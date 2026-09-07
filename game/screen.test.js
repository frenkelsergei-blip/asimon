/* The screen in the room.

   A television watching a room is the one device in the game that everybody
   can see at once — including the person who must not know the word. So the
   headline assertion is the same one the phones get, only stricter: the four
   words must not reach the screen in any field, in any phase, on an ordinary
   round or on a blind one, until the reveal makes them everybody's.

   And the other half: a screen must take no seat. It joins by the room code
   alone, cannot act, and does not appear at the table.

   node game/screen.test.js                                                  */
"use strict";
const { spawn } = require("child_process");
const path = require("path");
const play = require("./play");

const PORT = 3997;
const REMOTE = process.env.ASIMON_BASE || "";
const BASE = REMOTE || ("http://127.0.0.1:" + PORT);
const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const CTX = { armClock(){}, clearClock(){}, armPause(){} };

/* ================= part one: the view itself ================= */

function room(n){
  const r = {
    code:"TEST", lang:"en", hostId:"p0", phase:"lobby", lanUrl:"x", mapId:"classic",
    players: Array.from({ length:n }, (_, i) => ({ id:"p"+i, name:"P"+i, face:"boy", online:true }))
  };
  play.startGame(r, {});
  r.engine.S.players.forEach(p =>
    play.applyAction(r, r.players.find(x => x.id === p.id), { type:"order_ok" }, CTX));
  return r;
}
const P = (r, id) => r.players.find(p => p.id === id);

/* Nothing on this list belongs on a wall: they are the fields the server hands
   one phone because of who is holding it. */
const PRIVATE = ["secret", "hand", "canPlay", "isGiver", "iAmOut", "mine", "offers", "shot", "you"];
function screenOf(r){
  const v = play.boardView(r);
  const dump = JSON.stringify(v);
  PRIVATE.forEach(k => ok(dump.indexOf('"' + k + '"') < 0,
    'LEAK: the screen was sent a "' + k + '" field in phase ' + r.phase));
  return { v, dump };
}
function noWords(r, words, where){
  const { dump } = screenOf(r);
  words.forEach(w => ok(dump.indexOf(w) < 0,
    'LEAK: the word "' + w + '" was on the screen in phase ' + r.phase + " (" + where + ")"));
}

/* ---- the lobby: a roster and a code, and nobody's seat ---- */
{
  const r = {
    code:"WXYZ", lang:"en", hostId:"p0", phase:"lobby", lanUrl:"x", mapId:"classic",
    players: [ { id:"p0", name:"Dana", face:"boy", online:true } ],
    people: [ { id:"p0", name:"Dana", face:"boy", phoneId:"p0" } ]
  };
  const v = play.boardView(r);
  ok(v.code === "WXYZ", "the screen was not told which room it is watching");
  ok(v.people.length === 1 && v.people[0].name === "Dana", "the screen cannot draw the lobby");
  ok(v.lanUrl === "x", "the screen cannot show the address the phones join at");
  ok(v.you === undefined && v.isHost === undefined, "the screen was handed somebody's seat");
}

/* ---- an ordinary round, from the word being chosen to the reveal ---- */
{
  const r = room(4), e = r.engine;
  while(e.S.r.mod === "B"){ e.S.giverIdx++; e.newRound(); r.phase = "giver"; }
  const R = e.S.r, g = R.giver;
  const other = r.players.find(p => p.id !== g);

  play.applyAction(r, P(r, g), { type:"challenge", k:"open" }, CTX);
  const words = e.S.r.words.map(w => w.text);
  ok(words.length >= 1, "the round dealt no words to keep quiet about");
  noWords(r, words, "the giver is still choosing");

  play.applyAction(r, P(r, g), { type:"pick", i:0 }, CTX);
  if(!e.S.r.shotPublic) play.applyAction(r, P(r, g), { type:"aim", target:other.id }, CTX);
  noWords(r, words, "picked and aimed");

  play.applyAction(r, P(r, g), { type:"ready" }, CTX);
  ok(r.phase === "table", "the round did not reach the table, phase=" + r.phase);
  const table = play.boardView(r);
  noWords(r, words, "the clock is running");
  ok(table.remainMs > 0, "the screen cannot count the round down");
  ok(table.giverName === e.playerById(g).name, "the screen does not say who is giving the clue");

  play.applyAction(r, other, { type:"buzz" }, CTX);
  noWords(r, words, "somebody shouted");
  ok(play.boardView(r).judging, "the screen does not say who shouted");

  play.applyAction(r, P(r, g), { type:"judge", yes:true }, CTX);
  ok(r.phase === "reveal", "the round did not reach the reveal, phase=" + r.phase);
  const rev = play.boardView(r);
  /* now that it belongs to everyone, the wall is exactly where it should be */
  ok(rev.result && rev.result.word === e.S.result.word.text,
     "the screen did not carry the word once it was revealed");
  ok(rev.result.rows.length === e.S.units.length, "the screen lost a player from the result");
  screenOf(r);                    /* even at the reveal, no private field rides along */
}

/* ---- a blind round: the table may see the word, the screen may not ----
   This is the one that a viewFor()-minus-the-secrets screen would fail. On a
   blind round every phone but the giver's is shown the word, and the giver is
   sitting in front of the television. */
{
  const r = room(4), e = r.engine;
  e.S.forceBlind = true; e.newRound(); r.phase = "blind";
  const R = e.S.r, g = R.giver;
  const others = r.players.filter(p => p.id !== g);
  const words = R.words.map(w => w.text);

  ok(R.mod === "B", "the round did not turn blind: " + R.mod);
  ok(!!play.viewFor(r, others[0].id).secret, "the table could not see the blind word");
  noWords(r, words, "the table is choosing for the guesser");

  play.applyAction(r, others[0], { type:"pick", i:1 }, CTX);
  play.applyAction(r, others[0], { type:"ready" }, CTX);
  noWords(r, words, "the blind clock is running");

  play.applyAction(r, P(r, g), { type:"buzz" }, CTX);
  noWords(r, words, "the guesser shouted");
  play.applyAction(r, others[1], { type:"judge", yes:true }, CTX);
  ok(r.phase === "reveal", "the blind round did not reach the reveal, phase=" + r.phase);
  ok(play.boardView(r).result.word === e.S.result.word.text,
     "the screen did not carry the blind word once it was revealed");
}

/* ---- the Insight card is a reveal, and belongs on the wall ---- */
{
  const r = room(4), e = r.engine;
  while(e.S.r.mod === "B"){ e.S.giverIdx++; e.newRound(); r.phase = "giver"; }
  const g = e.S.r.giver;
  play.applyAction(r, P(r, g), { type:"challenge", k:"open" }, CTX);
  play.applyAction(r, P(r, g), { type:"pick", i:0 }, CTX);
  e.S.r.insight = true;
  e.S.r.insightWords = e.S.r.words.map(w => w.text);
  const v = play.boardView(r);
  ok(Array.isArray(v.insight) && v.insight.length === e.S.r.insightWords.length,
     "the Insight card puts four words on every phone but not on the screen");
}

/* ---- what the screen is actually for ---- */
{
  const r = room(3), e = r.engine;
  e.S.units[0].score = 5;
  e.S.units[0].cards = ["insight", "veto"];
  e.S.units[1].pos = { r:4, c:2 };
  const v = play.boardView(r);
  const u = v.units.find(x => x.id === e.S.units[0].id);
  ok(u.score === 5, "the screen does not carry the score");
  ok(u.cards === 2, "the screen does not carry how many cards a player holds: " + u.cards);
  ok(typeof u.cards === "number", "the screen was handed the cards themselves, not a count");
  ok(v.units.find(x => x.id === e.S.units[1].id).pos.r === 4, "the screen does not carry the positions");
  ok(v.board && v.board.nodes.length > 0, "the screen has no board to draw");
  ok(v.rows === e.ROWS(), "the screen cannot tell how long the board is");
  ok(v.people.length === 3, "the screen cannot put a face to a name");

  /* the game ends: the podium is the same one the phones are shown */
  e.S.units[0].pos = { r:e.ROWS()+1, c:1 };
  r.phase = "over";
  const over = play.boardView(r);
  ok(over.standings && over.standings[0].id === e.S.units[0].id,
     "the screen crowned the wrong winner");
}

/* ================= part two: over the wire ================= */

class Phone {
  constructor(name){ this.name = name; this.state = null; }
  async create(){ const r = await post("/api/create", { name:this.name, lang:"en" });
                  this.code = r.code; this.pid = r.pid; }
  async join(code){ const r = await post("/api/join", { code, name:this.name });
                    this.code = r.code; this.pid = r.pid; }
  listen(){ this.ctrl = new AbortController(); stream(
    "/api/events?room="+this.code+"&pid="+this.pid, this.ctrl, m => {
      if(m.type === "state") this.state = m.state;
    }); }
  stop(){ if(this.ctrl) this.ctrl.abort(); }
  act(a){ return post("/api/action", Object.assign({}, a, { code:this.code, pid:this.pid })); }
}
/* a television: one stream, no identity, nothing it can send */
class Screen {
  constructor(code){ this.code = code; this.states = []; this.state = null; this.status = 0; }
  async watch(){
    this.ctrl = new AbortController();
    this.done = stream("/api/board?room=" + this.code, this.ctrl, m => {
      if(m.type === "ui") this.pack = m.pack;
      if(m.type === "state"){ this.state = m.state; this.states.push(m.state); }
    }, s => { this.status = s; });
    await wait(200);
  }
  stop(){ if(this.ctrl) this.ctrl.abort(); }
  dumps(){ return this.states.map(s => JSON.stringify(s)); }
}
async function stream(url, ctrl, onMsg, onStatus){
  let res;
  try{ res = await fetch(BASE + url, { signal:ctrl.signal }); }catch(e){ return; }
  if(onStatus) onStatus(res.status);
  if(!res.ok) return;
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = "";
  try{
    for(;;){
      const { value, done } = await reader.read();
      if(done) break;
      buf += dec.decode(value, { stream:true });
      let i;
      while((i = buf.indexOf("\n\n")) >= 0){
        const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
        const line = chunk.split("\n").find(l => l.startsWith("data: "));
        if(line) onMsg(JSON.parse(line.slice(6)));
      }
    }
  }catch(e){ /* aborted */ }
}
async function post(p, body){
  const r = await fetch(BASE + p, { method:"POST", headers:{"content-type":"application/json"},
                                    body:JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if(!r.ok) throw Object.assign(new Error(d.error || ("http " + r.status)), { data:d });
  return d;
}

(async () => {
  const server = REMOTE ? null
    : spawn(process.execPath, [path.join(__dirname, "..", "server.js")],
            { env: Object.assign({}, process.env, { PORT:String(PORT) }),
              stdio:["ignore","ignore","inherit"] });
  const cleanup = () => { try{ if(server) server.kill(); }catch(e){} };
  process.on("exit", cleanup);
  const screens = [];

  try{
    for(let i = 0; i < 60; i++){
      try{ const r = await fetch(BASE + "/"); if(r.ok) break; }catch(e){}
      await wait(REMOTE ? 2000 : 100);
    }

    /* ---- a room with nobody watching it yet ---- */
    const dana = new Phone("Dana"), savta = new Phone("Savta"), ilan = new Phone("Ilan");
    await dana.create();
    await savta.join(dana.code);
    await ilan.join(dana.code);
    dana.listen(); savta.listen(); ilan.listen();
    await wait(300);

    /* ---- a code nobody is playing on ---- */
    const nowhere = await fetch(BASE + "/api/board?room=ZZZZ");
    ok(nowhere.status === 404, "a screen was given a stream on a room that does not exist");

    /* ---- the television ---- */
    const tv = new Screen(dana.code);
    screens.push(tv);
    await tv.watch();
    ok(tv.status === 200, "the screen could not open a stream: " + tv.status);
    ok(tv.pack && tv.pack.mods, "the screen was not sent the words for the board squares");
    ok(tv.state && tv.state.code === dana.code, "the screen never received the room");
    ok(tv.state.phase === "lobby", "the screen does not know the room is still in the lobby");
    ok(tv.state.people.length === 3, "the screen does not see the three people in the room");

    /* it takes no seat: nothing at the table changed by its being there */
    ok(dana.state.players.length === 3, "a screen was counted as a player");
    ok((dana.state.players || []).every(p => p.id !== undefined), "the roster was disturbed");

    /* ---- and it follows along ---- */
    await dana.act({ type:"start" });
    await wait(200);
    ok(tv.state.phase === "order", "the screen did not follow the room into the game");
    ok(tv.state.order && tv.state.order.seats.length === 3, "the screen cannot show the play order");

    await dana.act({ type:"order_ok" });
    await savta.act({ type:"order_ok" });
    await ilan.act({ type:"order_ok" });
    await wait(250);
    ok(["giver","blind"].indexOf(tv.state.phase) >= 0, "the screen is lost: " + tv.state.phase);
    ok(tv.state.board && tv.state.units.length === 3, "the screen has no board and no players on it");

    /* ---- THE SECRET, over the wire ---- */
    const blind = tv.state.mod.key === "B";
    const all = [dana, savta, ilan];
    const holder = blind ? all.find(p => p.pid !== tv.state.giver)
                         : all.find(p => p.pid === tv.state.giver);
    if(!blind){
      await holder.act({ type:"challenge", k:"open" });
      await wait(150);
    }
    ok(holder.state.secret, "nobody on this table was given the words");
    const words = holder.state.secret.words.map(w => w.text);
    tv.dumps().forEach((d, i) => words.forEach(w =>
      ok(d.indexOf(w) < 0, 'LEAK: the word "' + w + '" reached the screen in state ' + i)));
    ok(tv.dumps().every(d => d.indexOf('"secret"') < 0), "LEAK: a secret block reached the screen");

    /* ---- a screen cannot act ---- */
    const pushed = await fetch(BASE + "/api/action", {
      method:"POST", headers:{"content-type":"application/json"},
      body: JSON.stringify({ code: dana.code, pid: "", type:"start" })
    });
    ok(pushed.status === 404, "an action with no seat behind it was accepted: " + pushed.status);

    /* ---- the room only holds so many screens ---- */
    for(let i = 0; i < 7; i++){
      const s = new Screen(dana.code);
      screens.push(s);
      await s.watch();
      ok(s.status === 200, "screen " + (i+2) + " of eight was turned away: " + s.status);
    }
    const ninth = await fetch(BASE + "/api/board?room=" + dana.code);
    ok(ninth.status === 429, "a ninth screen was let onto the room: " + ninth.status);
    const asked = await (await fetch(BASE + "/api/room?code=" + dana.code)).json();
    ok(asked.screensFull === true, "the room does not admit to being full of screens");

    screens.forEach(s => s.stop());
    dana.stop(); savta.stop(); ilan.stop();
    await wait(150);

  }catch(e){
    bad.push("threw: " + (e && e.message));
  } finally {
    screens.forEach(s => { try{ s.stop(); }catch(e){} });
    cleanup();
  }

  console.log(bad.length ? "FAIL (" + bad.length + "):\n" + [...new Set(bad)].join("\n")
    : "screen ok — a screen watches by code alone, takes no seat, and no word reaches it before the reveal");
  process.exit(bad.length ? 1 : 0);
})();
