"use strict";

const engine = require("./between");
const { auth } = require("./between-auth");

function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), {
    status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}

async function readObject(request) {
  if (!request.body) return {};
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) {
      await reader.cancel();
      throw new engine.GameError("bad_request", 413);
    }
    text += decoder.decode(value, { stream: true });
  }
  try {
    const parsed = JSON.parse(text + decoder.decode());
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch { /* map malformed JSON to a single client error */ }
  throw new engine.GameError("bad_request", 400);
}

function failure(error) {
  if (error instanceof engine.GameError) return json({ error: error.message }, error.status);
  console.error("Between request failed:", error.message);
  return json({ error: "server_error" }, 500);
}

async function operate(room, operation, store, save) {
  const now = Date.now();
  if (!room || now - room.changedAt >= engine.idleMs) throw new engine.GameError("no_room", 404);
  const { op, data, token, profile } = operation;
  if (op === "join") {
    const seat = engine.addPlayer(room, data, profile, now);
    await save(room);
    return seat;
  }

  const player = engine.sessionPlayer(room, token);
  if ((op === "action" || token) && !player) throw new engine.GameError("no_seat", 404);
  const bank = room.phase !== "lobby" || op === "action" ? await store.bank() : null;
  let dirty = engine.advance(room, bank, now);
  if (player) dirty = engine.refreshPlayer(room, player, now) || dirty;
  const saveResult = async () => {
    if (room.phase !== "over" || room.finalized) return;
    const winners = engine.winners(room);
    const entries = room.players.filter(seat => seat.user).map(seat => ({
      user: seat.user, score: seat.score, won: winners.includes(seat.id)
    }));
    if (entries.length) await store.game(room.gameId, room.finishedAt, entries);
    room.finalized = true;
    await save(room);
  };
  if (dirty) await save(room);
  await saveResult();
  if (op === "action") {
    engine.action(room, player, data, bank, now);
    await save(room.players.length ? room : null);
    await saveResult();
  }
  return op === "action" && data.type === "leave" ? { ok: true } : engine.view(room, player, now);
}

function memoryRooms(store, allowed, maxRooms) {
  const rooms = new Map();
  const pending = new Map();
  const sweep = () => {
    const now = Date.now();
    for (const [code, room] of rooms) if (now - room.changedAt >= engine.idleMs && !pending.has(code)) rooms.delete(code);
  };
  return {
    async create(data, profile, request) {
      if (!allowed(request)) throw new engine.GameError("slow_down", 429);
      sweep();
      if (rooms.size >= maxRooms) throw new engine.GameError("busy", 503);
      let code;
      do { code = engine.makeCode(); } while (rooms.has(code));
      const now = Date.now();
      const room = engine.makeRoom(code, now);
      const seat = engine.addPlayer(room, data, profile, now);
      rooms.set(code, room);
      return seat;
    },
    async call(code, operation) {
      const next = (pending.get(code) || Promise.resolve()).catch(() => {}).then(() =>
        operate(rooms.get(code), operation, store, room => {
          if (room) rooms.set(code, room);
          else rooms.delete(code);
        }));
      pending.set(code, next);
      try { return await next; }
      finally { if (pending.get(code) === next) pending.delete(code); }
    }
  };
}

function createApi(env, store, rooms) {
  const google = auth(env);
  return async function handle(request) {
    const url = new URL(request.url);
    const path = url.pathname.slice("/api/between".length);
    const method = request.method;
    try {
      if (method === "POST" && request.headers.has("origin") && request.headers.get("origin") !== url.origin) {
        throw new engine.GameError("bad_request", 403);
      }
      const user = google.user(request);
      if (path === "/session" && method === "GET") {
        return json({ google: google.enabled, profile: user ? await store.profile(user) : null,
          shareOrigin: request.headers.get("x-asimon-share-origin") || url.origin });
      }
      if (path === "/auth/google" && method === "GET" && google.enabled) return google.start(request);
      if (path === "/auth/callback" && method === "GET" && google.enabled) {
        return google.finish(request, async id => {
          await store.saveProfile({ id, name: `שחקן ${id.slice(-4)}`, face: "fox" }, true);
        });
      }
      if (path === "/auth/logout" && method === "POST") return json({ ok: true }, 200, { "set-cookie": google.logout(request) });
      if (path === "/profile" && (method === "GET" || method === "POST")) {
        if (!user) throw new engine.GameError("sign_in", 401);
        if (method === "POST") {
          const data = await readObject(request);
          const name = engine.nickname(data.name);
          if (!name || !engine.faces.includes(data.face)) throw new engine.GameError("profile_invalid", 400);
          await store.saveProfile({ id: user, name, face: data.face });
        }
        const [profile, stats] = await Promise.all([store.profile(user), store.stats(user)]);
        return json({ profile, stats });
      }
      if (path === "/leaders" && method === "GET") {
        const period = url.searchParams.get("period") === "week" ? "week" : "day";
        return json({ period, leaders: await store.leaders(period, Date.now()) });
      }
      if ((path === "/create" || path === "/join") && method === "POST") {
        const data = await readObject(request);
        const profile = user && !data.guest ? await store.profile(user) : null;
        if (path === "/create") return json(await rooms.create(data, profile, request));
        const code = String(data.code || "").toUpperCase();
        if (!/^[A-Z0-9]{4}$/.test(code)) throw new engine.GameError("no_room", 404);
        return json(await rooms.call(code, { op: "join", data, profile }));
      }
      const match = /^\/rooms\/([A-Z0-9]{4})(\/action)?$/.exec(path);
      if (match && method === (match[2] ? "POST" : "GET")) {
        const token = request.headers.get("authorization")?.match(/^Bearer ([\w-]+)$/)?.[1];
        const operation = match[2] ? { op: "action", token, data: await readObject(request) } : { op: "view", token };
        return json(await rooms.call(match[1], operation));
      }
      return json({ error: "not_found" }, 404);
    } catch (error) { return failure(error); }
  };
}

module.exports = { createApi, memoryRooms, operate, json, failure };
