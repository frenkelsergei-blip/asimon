/* Asimon — room server.
   No dependencies: Node's http, Server-Sent Events down, POST up.
   Run:  node server.js
   Phones join at http://<this-mac-lan-ip>:3000                        */
"use strict";
const http = require("http");
const fs   = require("fs");
const path = require("path");
const os   = require("os");
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

/* ---------------- rooms ---------------- */
const rooms = new Map();               // code -> room
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // no I/O/0/1
const ROOM_IDLE_MS = 1000 * 60 * 90;
/* A locked phone drops its stream within a second or two. Wait before saying
   so out loud, or a pocketed phone looks like someone who walked out. */
const OFFLINE_GRACE_MS = Number(process.env.LS_GRACE_MS || 12000);
const MAX_PLAYERS = 8;
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
}
setInterval(() => {
  const now = Date.now();
  for(const [code, room] of rooms)
    if(now - room.touchedAt > ROOM_IDLE_MS){
      play.clearClock(room);
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
}
function broadcast(room){
  /* stamp when the room started waiting on this particular person, so a phone
     nobody is looking at can be moved past without waiting for it to drop */
  const seat = room.engine ? room.engine.S.moveSeat : 0;
  const key  = room.phase + ":" + seat + ":" + (room.engine ? room.engine.S.round : 0);
  if(key !== room._waitKey){ room._waitKey = key; room.phaseAt = Date.now(); }
  for(const p of room.players) push(room, p.id, { type:"state", state: viewFor(room, p.id) });
}

/* ---------------- http ---------------- */
const TYPES = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
                ".css":"text/css; charset=utf-8", ".svg":"image/svg+xml", ".ico":"image/x-icon" };

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

      const beat = setInterval(() => { try{ res.write(": beat\n\n"); }catch(e){} }, 20000);
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

    /* ---- for the host's health check ---- */
    if(p === "/healthz"){
      return sendJSON(res, 200, { ok:true, rooms: rooms.size, up: Math.round(process.uptime()) });
    }

    /* ---- what a room looks like from outside, for the join screen ---- */
    if(p === "/api/room"){
      const room = rooms.get(String(url.searchParams.get("code") || "").toUpperCase());
      if(!room) return sendJSON(res, 404, { error:"no_such_room" });
      return sendJSON(res, 200, {
        code: room.code, phase: room.phase, count: room.players.length,
        taken: room.players.map(x => x.face).filter(Boolean)
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

      if(body.type === "leave"){
        if(me.dropTimer){ clearTimeout(me.dropTimer); me.dropTimer = null; }
        room.players = room.players.filter(x => x.id !== me.id);
        room.people  = (room.people || []).filter(x => x.phoneId !== me.id);
        room.clients.delete(me.id);
        if(room.hostId === me.id) room.hostId = room.players[0] ? room.players[0].id : null;
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
          for(const q of room.players) push(room, q.id, { type:"ui", lang: room.lang, pack: play.uiPack(room.lang) });
          broadcast(room);
        }
        return sendJSON(res, 200, { ok:true });
      }
      if(body.type === "start"){
        if(room.hostId !== me.id) return sendJSON(res, 403, { error:"host_only" });
        if(room.phase !== "lobby") return sendJSON(res, 409, { error:"already_started" });
        if(room.players.length < play.MIN_PLAYERS) return sendJSON(res, 409, { error:"need_3" });
        play.startGame(room, { mode: body.mode, gameMode: body.gameMode });
        broadcast(room);
        return sendJSON(res, 200, { ok:true });
      }

      /* everything else belongs to the round */
      const ctx = {
        armClock: () => play.armClock(room, () => {
          if(play.timeUp(room)) broadcast(room);
        }),
        clearClock: () => play.clearClock(room)
      };
      const out = play.applyAction(room, me, body, ctx);
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
    let file = p === "/" ? "/index.html" : p;
    file = path.normalize(file).replace(/^(\.\.[/\\])+/, "");
    const full = path.join(PUBLIC, file);
    if(!full.startsWith(PUBLIC)){ res.writeHead(403); return res.end("no"); }
    fs.readFile(full, (err, data) => {
      if(err){ res.writeHead(404, {"content-type":"text/plain; charset=utf-8"}); return res.end("not found"); }
      res.writeHead(200, { "content-type": TYPES[path.extname(full)] || "application/octet-stream",
                           "cache-control":"no-store" });
      res.end(data);
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
