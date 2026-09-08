/* Asimon — room server.
   No dependencies: Node's http, Server-Sent Events down, POST up.
   Run:  node server.js
   Phones join at http://<this-mac-lan-ip>:3000                        */
"use strict";
const http = require("http");
const fs   = require("fs");
const path = require("path");
const os   = require("os");
const crypto = require("crypto");
const play = require("./game/play");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, "public");

function lanAddress(){
  for(const list of Object.values(os.networkInterfaces()))
    for(const i of list || [])
      if(i.family === "IPv4" && !i.internal) return i.address;
  return "localhost";
}
/* the address the other phones must type — never localhost, which only
   works on the machine running the server */
const LAN_URL = "http://" + lanAddress() + ":" + PORT;

/* ---------------- the build ----------------
   The phone is a long-lived thing. Added to a home screen it can sit for weeks
   without ever reloading, and there is no address bar to pull down. So the
   server names the build it is serving — a hash of what public/ actually holds,
   not a counter someone has to remember to turn — and every phone can ask
   whether the one it is running is still the one being served.

   Content-addressed on purpose: a restart, a redeploy of the same files, a
   touched mtime — none of those should tell a table mid-game to reload. Only a
   real change to the version or to a file the phone loads does.               */
const VERSION = require("./package.json").version;
const changelog = require("./game/changelog");
const ASSETS = ["index.html","app.js","art.js","boardart.js","sfx.js","style.css","gestures.css",
                "board.html","board.js","board.css"];

let BUILD = "", assetStamp = null;
function currentBuild(){
  /* one stat per file to decide whether to re-read them: cheap enough to do on
     every ask, so an edit during development is picked up without a restart */
  let stamp = VERSION;
  for(const f of ASSETS){
    try{ const st = fs.statSync(path.join(PUBLIC, f)); stamp += "|" + f + ":" + st.size + ":" + st.mtimeMs; }
    catch(e){ stamp += "|" + f + ":none"; }
  }
  if(stamp !== assetStamp){
    assetStamp = stamp;
    const h = crypto.createHash("sha1").update(VERSION);
    for(const f of ASSETS){
      try{ h.update(f).update(fs.readFileSync(path.join(PUBLIC, f))); }
      catch(e){ h.update(f + ":none"); }
    }
    BUILD = h.digest("hex").slice(0, 10);
  }
  return BUILD;
}

/* The page is served with the build stamped into it: the assets carry it as a
   query so a phone never mixes an old script with a new stylesheet, and two
   meta tags let the running page say out loud which build it is. */
function shell(html, build){
  return html
    .replace(/\b(href|src)="(\/[^"]+\.(?:css|js))"/g, (m, a, u) => a + '="' + u + "?v=" + build + '"')
    .replace("<head>",
      '<head>\n<meta name="asimon-version" content="' + VERSION + '">' +
      '\n<meta name="asimon-build" content="' + build + '">');
}

/* ---------------- rooms ---------------- */
const rooms = new Map();               // code -> room
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // no I/O/0/1
const ROOM_IDLE_MS = 1000 * 60 * 90;
/* A locked phone drops its stream within a second or two. Wait before saying
   so out loud, or a pocketed phone looks like someone who walked out. */
const OFFLINE_GRACE_MS = Number(process.env.LS_GRACE_MS || 12000);
/* how often a quiet stream says it is still there, and so how long a phone
   may hear nothing before it should stop believing the stream */
const BEAT_MS = Number(process.env.LS_BEAT_MS || 20000);
const MAX_PLAYERS = 8;
/* screens watching a room. They hold no seat, so they are capped separately —
   a television, a tablet on the sideboard, and room to spare. */
const MAX_SCREENS = 8;
const MAX_ROOMS   = Number(process.env.LS_MAX_ROOMS || 400);
const CREATE_PER_IP = 20;                 /* per window, so one visitor cannot fill the box */
const CREATE_WINDOW_MS = 10 * 60 * 1000;
const creates = new Map();                // ip -> {n, until}

function tooManyCreates(ip){
  const now = Date.now();
  const e = creates.get(ip);
  if(!e || now > e.until){ creates.set(ip, { n:1, until: now + CREATE_WINDOW_MS }); return false; }
  e.n++;
  return e.n > CREATE_PER_IP;
}
setInterval(() => {
  const now = Date.now();
  for(const [ip, e] of creates) if(now > e.until) creates.delete(ip);
}, CREATE_WINDOW_MS).unref();

/* The address to hand the other phones. On a host that is the public URL the
   room was opened from; on this Mac it is the Wi-Fi address, because
   localhost only works on the machine running the server. */
function originOf(req){
  const host  = String(req.headers["x-forwarded-host"] || req.headers.host || "");
  const proto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() ||
                (host.endsWith(":443") ? "https" : "http");
  if(!host || /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)) return null;
  return proto + "://" + host;
}

function newCode(){
  let c;
  do { c = Array.from({length:4}, () => CODE_ALPHABET[Math.floor(Math.random()*CODE_ALPHABET.length)]).join(""); }
  while(rooms.has(c));
  return c;
}
function makeRoom(){
  const code = newCode();
  const room = {
    code,
    createdAt: Date.now(),
    touchedAt: Date.now(),
    hostId: null,
    players: [],                        // the phones: {id, name, face, joinedAt, online}
    people: [],                         // the roster the rules run on: {id, name, face, phoneId}
    seating: "solo",                    // solo | pairs | groups — chosen in the lobby
    clients: new Map(),                 // pid -> Set(res)
    screens: new Set(),                 // the streams of screens watching, holding no seat
    phase: "lobby",
    lang: "he",
    lanUrl: LAN_URL,          /* replaced by the public address when there is one */
    engine: null,                       // the rules, once the game starts
    mode: "regular",                    // quick | regular | slow | challenge — chosen at start
    mapId: play.randomMapId(),          // rolled the moment the room exists; rerollable pre-game
    movePick: null,
    clockTimer: null
  };
  rooms.set(code, room);
  return room;
}
function touch(room){ room.touchedAt = Date.now(); }
function closeRoom(room){
  for(const set of room.clients.values()) for(const res of set){ try{ res.end(); }catch(e){} }
  for(const res of room.screens){ try{ res.end(); }catch(e){} }
}
setInterval(() => {
  const now = Date.now();
  for(const [code, room] of rooms)
    if(now - room.touchedAt > ROOM_IDLE_MS){
      play.clearClock(room);
      play.clearPause(room);
      room.players.forEach(x => { if(x.dropTimer) clearTimeout(x.dropTimer); });
      closeRoom(room); rooms.delete(code);
    }
}, 60000).unref();

/* ---------------- what each player is allowed to see ----------------
   The whole point of playing on separate phones: the giver's words go
   only to the giver. No other device ever receives them.               */
function viewFor(room, pid){
  return play.viewFor(room, pid);
}
function push(room, pid, payload){
  const set = room.clients.get(pid);
  if(!set) return;
  const line = "data: " + JSON.stringify(payload) + "\n\n";
  for(const res of set){ try{ res.write(line); }catch(e){} }
}
/* a moment everyone should see, separate from the state they should hold */
function announce(room, payload){
  for(const q of room.players) push(room, q.id, payload);
  toScreens(room, payload);
}
/* The screens in the room: one stream each, all of them holding the same
   thing, because a screen is not anybody in particular. */
function toScreens(room, payload){
  if(!room.screens.size) return;
  const line = "data: " + JSON.stringify(payload) + "\n\n";
  for(const res of room.screens){ try{ res.write(line); }catch(e){} }
}
function broadcast(room){
  /* stamp when the room started waiting on this particular person, so a phone
     nobody is looking at can be moved past without waiting for it to drop */
  const seat = room.engine ? room.engine.S.moveSeat : 0;
  const key  = room.phase + ":" + seat + ":" + (room.engine ? room.engine.S.round : 0);
  if(key !== room._waitKey){ room._waitKey = key; room.phaseAt = Date.now(); }
  for(const p of room.players) push(room, p.id, { type:"state", state: viewFor(room, p.id) });
  if(room.screens.size) toScreens(room, { type:"state", state: play.boardView(room) });
}

/* The two timers the rules side owns but cannot fire on its own: the round
   clock running out, and a break ending by itself. Both end in a broadcast,
   which only the server knows how to do. */
function ctxFor(room){
  return {
    armClock:   () => play.armClock(room, () => { if(play.timeUp(room)) broadcast(room); }),
    clearClock: () => play.clearClock(room),
    armPause:   () => play.armPause(room, () => { play.endPause(room, ctxFor(room)); broadcast(room); })
  };
}

/* ---------------- http ---------------- */
const TYPES = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
                ".css":"text/css; charset=utf-8", ".svg":"image/svg+xml", ".ico":"image/x-icon",
                ".webmanifest":"application/manifest+json; charset=utf-8", ".json":"application/json; charset=utf-8" };

function sendJSON(res, code, obj){
  res.writeHead(code, { "content-type":"application/json; charset=utf-8", "cache-control":"no-store" });
  res.end(JSON.stringify(obj));
}
function readBody(req){
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on("data", c => {
      n += c.length;
      if(n > 64*1024){ reject(new Error("too big")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); }
      catch(e){ reject(e); }
    });
    req.on("error", reject);
  });
}
/* A face is only ever used as a lookup key on the phones, so it needs no
   escaping — just a sane shape, and no two people wearing the same one. */
function cleanFace(x){
  const f = String(x == null ? "" : x);
  return /^[a-z]{2,12}$/.test(f) ? f : "";
}
const FACE_POOL = ["boy","girl","grandpa","grandma","hippy","beard","curly","beanie",
                   "astro","robot","fox","cat","owl","frog","panda"];
/* A face marks a person, not a phone — in groups three of them share one. */
function faceTaken(room, face, exceptId){
  return play.roster(room).some(p => p.face === face && p.id !== exceptId);
}
function freeFace(room){ return FACE_POOL.find(f => !faceTaken(room, f)) || "boy"; }
function freeFaceFrom(taken){ return FACE_POOL.find(f => taken.indexOf(f) < 0) || "boy"; }

/* strip control characters, collapse whitespace, cap the length */
function cleanName(s){
  return String(s == null ? "" : s)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 14);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  const p = url.pathname;

  try {
    /* ---- create a room ---- */
    if(p === "/api/create" && req.method === "POST"){
      const body = await readBody(req);
      const name = cleanName(body.name);
      if(!name) return sendJSON(res, 400, { error:"name_required" });
      if(rooms.size >= MAX_ROOMS) return sendJSON(res, 503, { error:"busy" });
      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
                 (req.socket && req.socket.remoteAddress) || "?";
      if(tooManyCreates(ip)) return sendJSON(res, 429, { error:"slow_down" });
      const room = makeRoom();
      room.lanUrl = originOf(req) || LAN_URL;
      const pid = "p" + Math.random().toString(36).slice(2, 10);
      const face = cleanFace(body.face) || freeFace(room);
      room.players.push({ id:pid, name, face, joinedAt:Date.now(), online:false });
      play.addPerson(room, pid, name, face);
      room.hostId = pid;
      if(body.lang === "en" || body.lang === "he") room.lang = body.lang;
      touch(room);
      return sendJSON(res, 200, { code: room.code, pid });
    }

    /* ---- join an existing room ---- */
    if(p === "/api/join" && req.method === "POST"){
      const body = await readBody(req);
      const code = String(body.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
      const name = cleanName(body.name);
      const room = rooms.get(code);
      if(!room) return sendJSON(res, 404, { error:"no_such_room" });
      if(!name) return sendJSON(res, 400, { error:"name_required" });
      if(room.phase !== "lobby") return sendJSON(res, 409, { error:"already_started" });
      if(room.players.length >= MAX_PLAYERS) return sendJSON(res, 409, { error:"room_full" });
      if(room.players.some(x => x.name.toLowerCase() === name.toLowerCase()))
        return sendJSON(res, 409, { error:"name_taken" });
      let face = cleanFace(body.face);
      if(face && faceTaken(room, face)) return sendJSON(res, 409, { error:"face_taken" });
      if(!face) face = freeFace(room);
      const pid = "p" + Math.random().toString(36).slice(2, 10);
      room.players.push({ id:pid, name, face, joinedAt:Date.now(), online:false });
      play.addPerson(room, pid, name, face);
      touch(room); broadcast(room);
      return sendJSON(res, 200, { code: room.code, pid });
    }

    /* ---- the live stream ---- */
    if(p === "/api/events"){
      const code = String(url.searchParams.get("room") || "").toUpperCase();
      const pid  = String(url.searchParams.get("pid")  || "");
      const room = rooms.get(code);
      const me   = room && room.players.find(x => x.id === pid);
      if(!room || !me){ res.writeHead(404, {"content-type":"text/plain"}); return res.end("gone"); }

      res.writeHead(200, {
        "content-type":"text/event-stream; charset=utf-8",
        "cache-control":"no-store, no-transform",
        "connection":"keep-alive",
        "x-accel-buffering":"no"
      });
      res.write("retry: 2000\n\n");

      /* register first — push() writes to registered clients, so anything sent
         before this line goes nowhere */
      if(!room.clients.has(pid)) room.clients.set(pid, new Set());
      room.clients.get(pid).add(res);
      if(me.dropTimer){ clearTimeout(me.dropTimer); me.dropTimer = null; }
      const wasOffline = !me.online;
      me.online = true;
      touch(room);
      push(room, pid, { type:"ui", lang: room.lang, pack: play.uiPack(room.lang) });
      if(wasOffline) broadcast(room);
      else push(room, pid, { type:"state", state: viewFor(room, pid) });

      /* The heartbeat, as a message rather than an SSE comment. A comment is
         enough to stop a proxy closing a quiet stream, but EventSource throws
         it away without telling the page, so it could not be used as proof
         the stream was still alive — and a phone whose socket died while it
         was asleep had no way to find that out. Sent as data, it is the one
         thing a phone can miss and notice it has missed. */
      const beat = setInterval(() => {
        try{ res.write('data: {"type":"beat"}\n\n'); }catch(e){}
      }, BEAT_MS);
      req.on("close", () => {
        clearInterval(beat);
        const set = room.clients.get(pid);
        if(set){ set.delete(res); if(!set.size) room.clients.delete(pid); }
        if(room.clients.has(pid)) return;                 /* another tab still holds it */
        if(me.dropTimer) clearTimeout(me.dropTimer);
        me.dropTimer = setTimeout(() => {
          me.dropTimer = null;
          if(room.clients.has(pid)) return;               /* came back in time */
          me.online = false;
          /* a host who has really gone hands the room on */
          if(room.hostId === pid){
            const heir = room.players.find(x => x.id !== pid && x.online);
            if(heir) room.hostId = heir.id;
          }
          broadcast(room);
        }, OFFLINE_GRACE_MS);
        if(me.dropTimer.unref) me.dropTimer.unref();
      });
      return;
    }

    /* ---- the stream a screen watches on ----
       The room code is the whole of it: no name, no seat, nothing it can send
       back. What comes down is boardView() — the table's own state, which
       holds no words until the reveal, because whoever must not see them is
       sitting in front of this screen. */
    if(p === "/api/board"){
      const code = String(url.searchParams.get("room") || "").toUpperCase();
      const room = rooms.get(code);
      if(!room){ res.writeHead(404, {"content-type":"text/plain"}); return res.end("gone"); }
      if(room.screens.size >= MAX_SCREENS){
        res.writeHead(429, {"content-type":"text/plain"}); return res.end("too many screens");
      }

      res.writeHead(200, {
        "content-type":"text/event-stream; charset=utf-8",
        "cache-control":"no-store, no-transform",
        "connection":"keep-alive",
        "x-accel-buffering":"no"
      });
      res.write("retry: 2000\n\n");
      room.screens.add(res);
      /* deliberately no touch(): a screen left on overnight should not keep a
         room nobody is playing in from being forgotten */
      res.write("data: " + JSON.stringify({ type:"ui", lang: room.lang, pack: play.uiPack(room.lang) }) + "\n\n");
      res.write("data: " + JSON.stringify({ type:"state", state: play.boardView(room) }) + "\n\n");

      const beat = setInterval(() => { try{ res.write(": beat\n\n"); }catch(e){} }, 20000);
      req.on("close", () => { clearInterval(beat); room.screens.delete(res); });
      return;
    }

    /* ---- for the host's health check ---- */
    if(p === "/healthz"){
      return sendJSON(res, 200, { ok:true, version: VERSION, build: currentBuild(),
                                  rooms: rooms.size, up: Math.round(process.uptime()) });
    }

    /* ---- which build is being served? asked by a phone that may be stale ---- */
    if(p === "/api/version"){
      return sendJSON(res, 200, { version: VERSION, build: currentBuild() });
    }

    /* ---- what changed, and when. Asked only when somebody opens the sheet,
       so it is never on the path of a round. The phone sends the language it
       is drawing in; the list comes back already in it. ---- */
    if(p === "/api/changelog"){
      const lang = String(url.searchParams.get("lang") || "en");
      return sendJSON(res, 200, { version: VERSION,
                                  releases: changelog.forLang(lang, 20) });
    }

    /* ---- what a room looks like from outside, for the join screen ---- */
    if(p === "/api/room"){
      const room = rooms.get(String(url.searchParams.get("code") || "").toUpperCase());
      if(!room) return sendJSON(res, 404, { error:"no_such_room" });
      return sendJSON(res, 200, {
        code: room.code, phase: room.phase, count: room.players.length,
        taken: room.players.map(x => x.face).filter(Boolean),
        /* a screen asks this before it opens a stream, so it can say why */
        screensFull: room.screens.size >= MAX_SCREENS
      });
    }

    /* ---- is this seat still real? asked after a stream dies for good ---- */
    if(p === "/api/seat"){
      const room = rooms.get(String(url.searchParams.get("room") || "").toUpperCase());
      const pid  = String(url.searchParams.get("pid") || "");
      const seat = room && room.players.find(x => x.id === pid);
      if(!room || !seat) return sendJSON(res, 404, { error:"gone" });
      return sendJSON(res, 200, { ok:true, phase:room.phase });
    }

    /* ---- actions ---- */
    if(p === "/api/action" && req.method === "POST"){
      const body = await readBody(req);
      const room = rooms.get(String(body.code || "").toUpperCase());
      const me   = room && room.players.find(x => x.id === body.pid);
      if(!room || !me) return sendJSON(res, 404, { error:"gone" });
      touch(room);

      /* Getting up and going, in the lobby or in the middle of a round. The
         rules side takes the seat off the board and puts the room back on a
         step somebody can take; the rest of this is the phone's own affairs. */
      if(body.type === "leave"){
        if(me.dropTimer){ clearTimeout(me.dropTimer); me.dropTimer = null; }
        play.leave(room, me, ctxFor(room));
        room.clients.delete(me.id);
        if(room.hostId === me.id)
          room.hostId = (room.players.find(x => x.online) || room.players[0] || {}).id || null;
        /* the table hears it once, the way it hears a card being played */
        if(room.players.length) announce(room, { type:"event", kind:"left", by: me.name });
        broadcast(room);
        return sendJSON(res, 200, { ok:true });
      }
      /* Who is on this phone. Sent whole rather than one name at a time, so
         the phone's list and the room's roster cannot drift apart. */
      if(body.type === "people"){
        if(room.phase !== "lobby") return sendJSON(res, 409, { error:"already_started" });
        const raw = Array.isArray(body.list) ? body.list.slice(0, play.MAX_GROUP) : [];
        const wanted = raw.map(x => ({ name: cleanName(x && x.name), face: cleanFace(x && x.face) }))
                          .filter(x => x.name);
        if(!wanted.length) return sendJSON(res, 400, { error:"name_required" });
        const elsewhere = (room.people || []).filter(p => p.phoneId !== me.id);
        if(elsewhere.length + wanted.length > play.MAX_PEOPLE)
          return sendJSON(res, 409, { error:"room_full" });
        /* a name may repeat inside one group; across the table it may not */
        const seen = [];
        for(const w of wanted){
          const low = w.name.toLowerCase();
          if(seen.indexOf(low) >= 0) return sendJSON(res, 409, { error:"name_taken" });
          seen.push(low);
          if(elsewhere.some(p => p.name.toLowerCase() === low))
            return sendJSON(res, 409, { error:"name_taken" });
        }
        /* Rebuild this phone's slice of the roster. The first person keeps the
           phone's own id, so the one-person-per-phone case stays an identity. */
        const taken = elsewhere.map(p => p.face).filter(Boolean);
        room.people = elsewhere;
        wanted.forEach((w, i) => {
          let face = w.face;
          if(!face || taken.indexOf(face) >= 0) face = freeFaceFrom(taken);
          taken.push(face);
          room.people.push({
            id: i === 0 ? me.id : ("n" + Math.random().toString(36).slice(2, 10)),
            name: w.name, face, phoneId: me.id
          });
        });
        /* the phone's own name and face follow whoever is first on it */
        me.name = wanted[0].name;
        me.face = room.people.find(p => p.id === me.id).face;
        if(body.groupName !== undefined) me.groupName = cleanName(body.groupName);
        broadcast(room);
        return sendJSON(res, 200, { ok:true });
      }

      if(body.type === "face"){
        if(room.phase !== "lobby") return sendJSON(res, 409, { error:"already_started" });
        const face = cleanFace(body.face);
        if(!face) return sendJSON(res, 400, { error:"bad_choice" });
        if(faceTaken(room, face, me.id)) return sendJSON(res, 409, { error:"face_taken" });
        me.face = face;
        /* the avatar the table sees comes off the person, not the phone */
        const mine = (room.people || []).filter(x => x.phoneId === me.id);
        if(mine.length === 1) mine[0].face = face;
        broadcast(room);
        return sendJSON(res, 200, { ok:true });
      }
      if(body.type === "lang"){
        if(room.hostId !== me.id) return sendJSON(res, 403, { error:"host_only" });
        if(body.lang === "en" || body.lang === "he"){
          room.lang = body.lang;
          const ui = { type:"ui", lang: room.lang, pack: play.uiPack(room.lang) };
          for(const q of room.players) push(room, q.id, ui);
          toScreens(room, ui);
          broadcast(room);
        }
        return sendJSON(res, 200, { ok:true });
      }
      if(body.type === "start"){
        if(room.hostId !== me.id) return sendJSON(res, 403, { error:"host_only" });
        if(room.phase !== "lobby") return sendJSON(res, 409, { error:"already_started" });
        if(room.players.length < play.MIN_PLAYERS) return sendJSON(res, 409, { error:"need_3" });
        play.startGame(room, { seating: body.seating, mode: body.mode, gameMode: body.gameMode });
        broadcast(room);
        return sendJSON(res, 200, { ok:true });
      }

      /* everything else belongs to the round */
      const out = play.applyAction(room, me, body, ctxFor(room));
      if(out && out.played){
        announce(room, { type:"event", kind:"card", by: me.name,
                         card: play.cardFace(room.lang, out.played) });
      }
      if(out && out.error){
        if(process.env.LS_DEBUG) console.error("[refused]", body.type, "by", me.name,
          "-> " + out.error, "| phase=" + room.phase,
          "giver=" + (room.engine && room.engine.S.r ? room.engine.S.r.giver : "-"),
          "me=" + me.id);
        return sendJSON(res, 409, out);
      }
      broadcast(room);
      return sendJSON(res, 200, { ok:true });
    }

    /* ---- static ---- */
    /* two pages, two addresses somebody has to be able to type: the root for a
       phone, /board for whatever is going to stand on the sideboard */
    let file = p === "/" ? "/index.html"
             : (p === "/board" || p === "/board/") ? "/board.html"
             : p;
    file = path.normalize(file).replace(/^(\.\.[/\\])+/, "");
    const full = path.join(PUBLIC, file);
    if(!full.startsWith(PUBLIC)){ res.writeHead(403); return res.end("no"); }
    const ext = path.extname(full);
    fs.readFile(full, (err, data) => {
      if(err){ res.writeHead(404, {"content-type":"text/plain; charset=utf-8"}); return res.end("not found"); }
      let body = data;
      /* the page itself is never cached — it is the one thing that must be
         fresh, because it is what names the build everything else comes from */
      let cache = "no-store";
      if(ext === ".html"){
        body = Buffer.from(shell(data.toString("utf8"), currentBuild()), "utf8");
      } else if(url.searchParams.get("v") && url.searchParams.get("v") === currentBuild()){
        /* asked for by build: that exact bytes will never change under that
           address, so a phone on a thin connection may keep it */
        cache = "public, max-age=31536000, immutable";
      }
      res.writeHead(200, { "content-type": TYPES[ext] || "application/octet-stream",
                           "cache-control": cache });
      res.end(body);
    });
  } catch(e){
    sendJSON(res, 400, { error:"bad_request" });
  }
});

server.listen(PORT, () => {
  const ip = lanAddress();
  console.log("");
  console.log("  Asimon — room server");
  console.log("");
  console.log("  On this Mac:      http://localhost:" + PORT);
  console.log("  On other phones:  http://" + ip + ":" + PORT + "   (same Wi-Fi)");
  console.log("");
});
