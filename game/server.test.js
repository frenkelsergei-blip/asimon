/* End-to-end over real HTTP: three phones, one full round.
   The headline assertion is the secret — a non-giver's device must never
   receive the four words, in any field, at any point in the round.

   node game/server.test.js                                                  */
"use strict";
const { spawn } = require("child_process");
const path = require("path");

const PORT = 3999;
/* point it at a deployed server with LS_BASE=https://… — otherwise it starts
   one here and tests that */
const REMOTE = process.env.LS_BASE || "";
const BASE = REMOTE || ("http://127.0.0.1:" + PORT);
const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };

/* ---- a phone: holds its own stream and its last state ---- */
class Phone {
  constructor(name){ this.name = name; this.states = []; this.state = null; }
  async create(lang){
    const r = await post("/api/create", { name:this.name, lang });
    this.code = r.code; this.pid = r.pid; return r;
  }
  async join(code){
    const r = await post("/api/join", { code, name:this.name });
    this.code = r.code; this.pid = r.pid; return r;
  }
  listen(){
    this.ctrl = new AbortController();
    this.done = (async () => {
      const res = await fetch(BASE + "/api/events?room=" + this.code + "&pid=" + this.pid,
                              { signal:this.ctrl.signal });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
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
            if(!line) continue;
            const msg = JSON.parse(line.slice(6));
            if(msg.type === "state"){ this.state = msg.state; this.states.push(msg.state); }
          }
        }
      } catch(e){ /* aborted */ }
    })();
  }
  stop(){ if(this.ctrl) this.ctrl.abort(); }
  async act(a){
    try{ return await post("/api/action", Object.assign({}, a, { code:this.code, pid:this.pid })); }
    catch(e){ e.message = a.type + " by " + this.name + ": " + e.message; throw e; }
  }
}

async function post(p, body){
  const r = await fetch(BASE + p, { method:"POST", headers:{"content-type":"application/json"},
                                    body:JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if(!r.ok) throw Object.assign(new Error(data.error || "http " + r.status), { data });
  return data;
}
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const server = REMOTE ? null
    : spawn(process.execPath, [path.join(__dirname, "..", "server.js")],
            { env: Object.assign({}, process.env, { PORT:String(PORT) }),
              stdio:["ignore","ignore","inherit"] });
  const cleanup = () => { try{ if(server) server.kill(); }catch(e){} };
  process.on("exit", cleanup);

  try {
    for(let i = 0; i < 60; i++){
      try{ const r = await fetch(BASE + "/"); if(r.ok) break; }catch(e){}
      await wait(REMOTE ? 2000 : 100);          /* a sleeping host takes a while */
    }

    const dana  = new Phone("Dana");
    const savta = new Phone("Savta");
    const ilan  = new Phone("Ilan");

    await dana.create("en");
    await savta.join(dana.code);
    await ilan.join(dana.code);
    dana.listen(); savta.listen(); ilan.listen();
    await wait(300);

    ok(dana.state && dana.state.players.length === 3, "the host does not see three players");
    ok(savta.state && savta.state.isHost === false, "a guest was marked host");

    /* ---- host starts ---- */
    await dana.act({ type:"start" });
    await wait(200);
    const phase = dana.state.phase;
    ok(phase === "giver" || phase === "blind", "unexpected opening phase: " + phase);

    const giverPid = dana.state.giver;
    const all = [dana, savta, ilan];
    const giver = all.find(p => p.pid === giverPid);
    const others = all.filter(p => p.pid !== giverPid);
    ok(!!giver, "the round has no giver among the three phones");

    const isBlind = dana.state.mod.key === "B";
    if(process.env.LS_DEBUG) console.error("[test] pids",
      JSON.stringify({dana:dana.pid, savta:savta.pid, ilan:ilan.pid,
                      giverPid, giverName:giver && giver.name,
                      others:others.map(o=>o.name+":"+o.pid), mod:dana.state.mod.key}));

    /* ---- the giver chooses, privately ---- */
    if(!isBlind){
      await giver.act({ type:"challenge", k:"topic" });
      await wait(120);
      ok(giver.state.secret, "the giver was not given the round secret");
      const topicKey = "home";
      await giver.act({ type:"topic", k:topicKey });
      await wait(120);
      ok(giver.state.secret.words.length === 4, "the giver did not get four words");

      /* a non-giver must not be able to pick, even asking directly */
      let refused = false;
      try{ await others[0].act({ type:"pick", i:0 }); }catch(e){ refused = true; }
      ok(refused, "a non-giver was allowed to pick the word");

      await giver.act({ type:"pick", i:3 });
      await giver.act({ type:"aim", target: others[0].pid });
      await wait(120);
    } else {
      /* blind: the others choose, the giver must not see */
      await others[0].act({ type:"pick", i:2 });
      await wait(120);
      ok(others[0].state.secret, "the table was not shown the blind word");
      ok(!giver.state.secret, "the giver was shown the blind word");
    }

    /* ---- THE SECRET ---- */
    const words = (isBlind ? others[0] : giver).state.secret.words.map(w => w.text);
    ok(words.length >= 1, "no words to check");
    const blindSide = isBlind ? [giver] : others;
    for(const p of blindSide){
      for(const st of p.states){
        const dump = JSON.stringify(st);
        for(const w of words)
          ok(dump.indexOf(w) < 0,
             "LEAK: " + p.name + " received the word \"" + w + "\" in phase " + st.phase);
        ok(!st.secret, "LEAK: " + p.name + " received a secret block in phase " + st.phase);
      }
    }

    /* the aim is the giver's alone */
    if(!isBlind){
      for(const p of others)
        for(const st of p.states)
          ok(!(st.secret && st.secret.shot), "LEAK: the secret aim reached another phone");
    }

    /* ---- run the clock, buzz, judge ---- */
    await (isBlind ? others[0] : giver).act({ type:"ready" });
    await wait(150);
    ok(dana.state.phase === "table", "did not reach the table, got " + dana.state.phase);
    ok(dana.state.remainMs > 0, "the clock did not start");

    const buzzer = isBlind ? giver : others[0];
    let giverRefused = false;
    if(!isBlind){
      try{ await giver.act({ type:"buzz" }); }catch(e){ giverRefused = true; }
      ok(giverRefused, "the giver was allowed to buzz on their own word");
    }
    await buzzer.act({ type:"buzz" });
    await wait(150);
    ok(dana.state.phase === "judge", "a buzz did not open the judgement, got " + dana.state.phase);
    ok(dana.state.judging && dana.state.judging.id === buzzer.pid, "the wrong phone is being judged");

    let othersJudge = false;
    try{ await others[others.length-1].act({ type:"judge", yes:true }); }
    catch(e){ othersJudge = true; }
    ok(othersJudge || isBlind, "someone other than the giver judged the answer");

    await giver.act({ type:"judge", yes:true });
    await wait(150);
    ok(dana.state.phase === "reveal", "did not reach the reveal, got " + dana.state.phase);
    ok(dana.state.result && dana.state.result.word, "the reveal carries no word");
    ok(savta.state.result.word === dana.state.result.word, "phones disagree about the word");
    ok(dana.state.result.rows.length === dana.state.units.length, "a unit is missing from the result");

    /* now that it is over, everyone may see it */
    ok(JSON.stringify(others[0].state).indexOf(dana.state.result.word) >= 0,
       "the reveal did not reach the other phones");

    /* ---- move ---- */
    await giver.act({ type:"next" });
    await wait(150);
    if(dana.state.phase === "move"){
      const mv = dana.state.move;
      ok(mv && mv.spots.length > 0, "the mover has nowhere to go");
      const mover = all.find(p => (p.state.move || {}).mine);
      ok(!!mover, "no phone was told the move is theirs");
      const notMover = all.find(p => !(p.state.move || {}).mine);
      let moveRefused = false;
      try{ await notMover.act({ type:"movepick", r:mv.spots[0].r, c:mv.spots[0].c }); }
      catch(e){ moveRefused = true; }
      ok(moveRefused, "a bystander moved someone else's token");

      await mover.act({ type:"movepick", r:mv.spots[0].r, c:mv.spots[0].c });
      await wait(120);
      ok(dana.state.move.picked, "the pick was not shared with the table");
      await mover.act({ type:"moveconfirm" });
      await wait(150);
      ok(["move","giver","blind","over"].indexOf(dana.state.phase) >= 0,
         "after moving we landed in " + dana.state.phase);
    }

    dana.stop(); savta.stop(); ilan.stop();
    await wait(100);

  } catch(e){
    bad.push("threw: " + (e && e.message));
  } finally {
    cleanup();
  }

  const where = REMOTE || "a local server";
  console.log(bad.length ? "FAIL (" + bad.length + "):\n" + [...new Set(bad)].join("\n")
                         : "server ok — full round against " + where + ", no word reached the wrong phone");
  process.exit(bad.length ? 1 : 0);
})();
