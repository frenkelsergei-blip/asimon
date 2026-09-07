/* A phone locks its screen mid-round, then comes back.
   node game/reconnect.test.js                                              */
"use strict";
const { spawn } = require("child_process");
const path = require("path");
const play = require("./play");

const PORT = 3998;
const BASE = "http://127.0.0.1:" + PORT;
const GRACE = 1200;                      /* the server is started with a short one */
const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };
const wait = ms => new Promise(r => setTimeout(r, ms));

class Phone {
  constructor(name){ this.name = name; this.states = []; this.state = null; this.drops = 0; }
  async create(){ const r = await post("/api/create", { name:this.name, lang:"en" });
                  this.code = r.code; this.pid = r.pid; }
  async join(code){ const r = await post("/api/join", { code, name:this.name });
                    this.code = r.code; this.pid = r.pid; }
  listen(){
    this.ctrl = new AbortController();
    this.done = (async () => {
      let res;
      try{ res = await fetch(BASE+"/api/events?room="+this.code+"&pid="+this.pid, { signal:this.ctrl.signal }); }
      catch(e){ return; }
      if(!res.ok){ this.dead = res.status; return; }
      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = "";
      try{
        for(;;){
          const { value, done } = await reader.read();
          if(done) break;
          buf += dec.decode(value, { stream:true });
          let i;
          while((i = buf.indexOf("\n\n")) >= 0){
            const chunk = buf.slice(0, i); buf = buf.slice(i+2);
            const line = chunk.split("\n").find(l => l.startsWith("data: "));
            if(!line) continue;
            const msg = JSON.parse(line.slice(6));
            if(msg.type === "state"){ this.state = msg.state; this.states.push(msg.state); }
          }
        }
      }catch(e){}
    })();
  }
  lock(){ this.drops++; if(this.ctrl) this.ctrl.abort(); this.ctrl = null; }   /* screen off */
  unlock(){ this.listen(); }                                                   /* screen on  */
  act(a){ return post("/api/action", Object.assign({}, a, { code:this.code, pid:this.pid })); }
  sees(pid){ return (this.state.players.find(p => p.id === pid) || {}); }
}
async function post(p, body){
  const r = await fetch(BASE+p, { method:"POST", headers:{"content-type":"application/json"},
                                  body:JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if(!r.ok) throw Object.assign(new Error(d.error || ("http "+r.status)), { data:d });
  return d;
}

(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, "..", "server.js")],
    { env: Object.assign({}, process.env, { PORT:String(PORT), LS_GRACE_MS:String(GRACE) }),
      stdio:["ignore","ignore","inherit"] });
  const cleanup = () => { try{ server.kill(); }catch(e){} };
  process.on("exit", cleanup);

  try{
    for(let i = 0; i < 60; i++){ try{ await fetch(BASE+"/"); break; }catch(e){ await wait(100); } }

    const a = new Phone("Dana"), b = new Phone("Savta"), c = new Phone("Ilan");
    await a.create(); await b.join(a.code); await c.join(a.code);
    a.listen(); b.listen(); c.listen();
    await wait(300);
    ok(a.state.players.every(p => p.online), "not everyone came online");

    /* ---- 1. a short blip must not mark anyone offline ---- */
    b.lock();
    await wait(GRACE * 0.35);
    ok(a.sees(b.pid).online === true, "a blip marked a player offline before the grace ran out");
    b.unlock();
    await wait(400);
    ok(a.sees(b.pid).online === true, "the player did not come back online");
    ok(b.state && b.state.players.length === 3, "the returning phone got no state");

    /* ---- 2. a real absence is reported, then healed ---- */
    c.lock();
    await wait(GRACE + 500);
    ok(a.sees(c.pid).online === false, "a phone that really left still shows online");
    c.unlock();
    await wait(500);
    ok(a.sees(c.pid).online === true, "the phone did not recover after a real drop");

    /* ---- 3. the seat survives; the room is rejoinable mid-game ---- */
    await a.act({ type:"start" });
    await wait(250);
    const giverPid = a.state.giver;
    const giverPhone = [a,b,c].find(p => p.pid === giverPid);
    const others = [a,b,c].filter(p => p.pid !== giverPid);

    giverPhone.lock();
    await wait(200);
    const seat = await fetch(BASE+"/api/seat?room="+a.code+"&pid="+giverPid);
    ok(seat.status === 200, "the seat vanished while the phone was away");
    const gone = await fetch(BASE+"/api/seat?room="+a.code+"&pid=nobody");
    ok(gone.status === 404, "an unknown seat was accepted");

    /* the room notices it is waiting on the giver, and offers the host a way out */
    await wait(GRACE + 400);
    const watcher = others.find(p => p.state);
    ok(watcher.state.blocked && watcher.state.blocked.id === giverPid,
       "the room did not report that it is stranded on the giver");

    /* If the absent giver was also the host, the room has already handed the
       role on — so read who the host is now from a phone that is present. */
    const hostPid = watcher.state.players.find(p => p.host).id;
    ok(hostPid !== giverPid, "the room kept the absent giver as host");
    const host = [a,b,c].find(p => p.pid === hostPid);
    const guest = [a,b,c].find(p => p.pid !== hostPid && p.pid !== giverPid);
    /* the stranded player cannot skip their own turn; anyone else can */
    let refused = false;
    try{ await giverPhone.act({ type:"skip" }); }catch(e){ refused = (e.data||{}).error === "your_turn"; }
    ok(refused, "the stranded player was allowed to skip themselves");

    await guest.act({ type:"skip" });
    await wait(300);
    ok(guest.state.phase === "reveal", "skip did not move the game on, phase=" + guest.state.phase);
    ok(guest.state.result && guest.state.result.solvedBy === null,
       "the skipped round was not scored as unsolved");

    giverPhone.unlock();
    await wait(500);
    ok(giverPhone.state && giverPhone.state.phase === "reveal",
       "the returning giver did not catch up with the room");
    ok(host.sees(giverPid).online === true, "the returning giver still shows offline");

    /* ---- 4. nothing may be skipped while everyone is present ---- */
    let notStuck = false;
    try{ await guest.act({ type:"skip" }); }catch(e){ notStuck = (e.data||{}).error === "not_stuck"; }
    ok(notStuck, "a room that was not stuck could still be skipped");

    /* ---- 5. a host who leaves for good hands the room on ---- */
    host.lock();
    await wait(GRACE + 500);
    const stillHere = [a,b,c].find(p => p.pid !== hostPid && p.ctrl && p.state);
    ok(stillHere.state.players.find(p => p.id === hostPid).online === false, "the departed host shows online");
    const newHost = stillHere.state.players.find(p => p.host);
    ok(newHost && newHost.id !== hostPid, "the room kept a host who had gone");
    ok(newHost && newHost.online, "the room handed the host role to another absent phone");

    [a,b,c].forEach(p => p.lock());
    await wait(200);
  }catch(e){
    bad.push("threw: " + (e && e.message));
  }finally{ cleanup(); }

  console.log(bad.length ? "FAIL ("+bad.length+"):\n"+[...new Set(bad)].join("\n")
                         : "reconnect ok — blips ignored, real drops reported, seats survive, "
                           + "a stranded room can be rescued and the host role passes on");
  process.exit(bad.length ? 1 : 0);
})();
