/* Groups: one phone, several people.

   Two halves. The first runs the rules in process — that a phone becomes a
   unit, that the board is sized by groups rather than by heads, that the
   giving turn goes round the groups, and that the four words still reach
   exactly one phone. The second drives the lobby over real HTTP, because the
   roster is the server's to keep.

   node game/groups.test.js                                                  */
"use strict";
const { spawn } = require("child_process");
const path = require("path");
const play = require("./play.js");

const PORT = Number(process.env.LS_TEST_PORT || 3997);
const BASE = "http://127.0.0.1:" + PORT;
const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };

/* ---------------- in process: the rules ---------------- */
function tableOfThrees(seating){
  const room = { players:[], people:[], seating, lang:"he", mapId:"classic", phase:"lobby" };
  [["pA","Frogs",["Dana","Yoav","Michal"]],
   ["pB","Squids",["Ron","Shira","Avi"]],
   ["pC","Ants",  ["Tamar","Omer","Noa"]]].forEach(([id, gname, names]) => {
    room.players.push({ id, name:names[0], face:"boy", groupName:gname, online:true });
    names.forEach(n => play.addPerson(room, id, n, "boy"));
  });
  return room;
}

const room = tableOfThrees("groups");
ok(play.roster(room).length === 9, "nine people sit on three phones");
ok(play.peopleOf(room, "pA").length === 3, "a phone knows its own three");
ok(play.roster(room).filter(p => p.id === p.phoneId).length === 3,
   "exactly one person per phone keeps the phone's id");

play.startGame(room, {});
const S = room.engine.S;
ok(S.seating === "groups", "the room starts in groups");
ok(S.units.length === 3, "one unit per phone");
ok(S.units.every(u => u.members.length === 3), "each unit holds its whole group");
ok(S.units.map(u => u.name).join() === "Frogs,Squids,Ants", "units carry the group names");
ok(S.mode === "solo", "the engine stays in solo, so the aim is secret and chosen");

/* the board is a race between units, not between heads */
const solo = tableOfThrees("solo");
solo.people = solo.people.filter(p => p.id === p.phoneId);       /* one each */
play.startGame(solo, {});
ok(room.engine.ROWS() === solo.engine.ROWS(),
   "three groups run the three-unit board, not the nine-player one");

/* the giving turn goes round the groups, not down the roster */
const unitOfPerson = id => S.units.find(u => u.members.indexOf(id) >= 0).name;
const order = S.players.map(p => unitOfPerson(p.id));
ok(order.slice(0,3).join() === "Frogs,Squids,Ants", "the first three turns hit each group once");
ok(order.slice(3,6).join() === "Frogs,Squids,Ants", "and so does the second pass");
ok(new Set(S.players.map(p => p.id)).size === 9, "nobody is dropped from the order");

/* the headline: the words reach the giver's phone and no other */
const ctx = { armClock(){}, clearClock(){} };
["pA","pB","pC"].forEach(id =>
  play.applyAction(room, room.players.find(p => p.id === id), { type:"order_ok" }, ctx));
ok(room.phase !== "order", "round one is dealt once every phone has tapped in");
const giverPhone = play.phoneOf(room, S.r.giver);
["pA","pB","pC"].forEach(id => {
  const v = play.viewFor(room, id);
  if(id === giverPhone){
    ok(!!v.secret && v.isGiver, "the giver's phone is given the words");
    ok(v.secret.words.length >= 1, "and they are really there");
  } else {
    ok(!v.secret && !v.isGiver, "no word reaches " + id);
  }
});
/* the giver's own group-mates share that phone, so they see them too — that is
   the point of the mode, and the reason secrecy is a phone question now */
ok(play.peopleOf(room, giverPhone).length === 3,
   "the giver's two group-mates are on the phone that holds the words");

/* ---------------- over HTTP: the lobby keeps the roster ---------------- */
const post = async (p, body) => {
  const r = await fetch(BASE + p, { method:"POST", headers:{ "content-type":"application/json" },
                                    body: JSON.stringify(body) });
  return { status:r.status, body: await r.json().catch(() => ({})) };
};

(async () => {
  const srv = spawn(process.execPath, [path.join(__dirname, "..", "server.js")],
                    { env:{ ...process.env, PORT:String(PORT) }, stdio:"ignore" });
  const stop = () => { try{ srv.kill(); }catch(e){} };
  try{
    for(let i = 0; i < 60; i++){
      try{ await fetch(BASE + "/healthz"); break; }catch(e){ await new Promise(r => setTimeout(r, 100)); }
    }
    const a = (await post("/api/create", { name:"Dana", lang:"he" })).body;
    const b = (await post("/api/join", { code:a.code, name:"Ron" })).body;
    const c = (await post("/api/join", { code:a.code, name:"Tamar" })).body;
    const act = (who, body) => post("/api/action", { code:a.code, pid:who.pid, ...body });
    const r = await act(b, { type:"seating", seating:"groups" });
    ok(r.status === 409 && r.body.error === "host_only",
       "only the host may choose how the table sits");
    const q = await act(a, { type:"seating", seating:"quartets" });
    ok(q.status === 409 && q.body.error === "bad_choice",
       "and only into a seating that exists");
    ok((await act(a, { type:"seating", seating:"groups" })).status === 200, "the host sets groups");

    ok((await act(a, { type:"people", list:[{name:"Dana"},{name:"Yoav"},{name:"Michal"}],
                       groupName:"Frogs" })).status === 200, "a phone names its three");
    await act(b, { type:"people", list:[{name:"Ron"},{name:"Shira"},{name:"Avi"}], groupName:"Squids" });
    await act(c, { type:"people", list:[{name:"Tamar"},{name:"Omer"},{name:"Noa"}], groupName:"Ants" });

    ok((await act(c, { type:"people", list:[{name:"Yoav"}] })).status === 409,
       "a name already at the table is refused");
    ok((await act(c, { type:"people", list:[{name:"Nur"},{name:"Nur"}] })).status === 409,
       "and so is the same name twice on one phone");
    ok((await act(c, { type:"people",
        list:Array.from({length:9},(_,i)=>({name:"X"+i})) })).body.error === undefined,
       "a list longer than the cap is trimmed, not rejected");

    /* put Ants back the way the rest of the test expects */
    await act(c, { type:"people", list:[{name:"Tamar"},{name:"Omer"},{name:"Noa"}], groupName:"Ants" });
    const seen = (await post("/api/action", { code:a.code, pid:a.pid, type:"seating", seating:"groups" })).status;
    ok(seen === 200, "seating survives a re-send");
  } finally { stop(); }

  if(bad.length){ console.error("FAIL (" + bad.length + "):\n" + bad.join("\n")); process.exit(1); }
  console.log("groups ok — a phone is a group, the board counts groups, the turn goes round them, " +
              "and the words stop at one phone");
})();
