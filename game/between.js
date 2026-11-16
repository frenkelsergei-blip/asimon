"use strict";

const { randomUUID, randomBytes, randomInt } = require("node:crypto");
const { topics } = require("./between-questions");

const faces = ["fox", "astro", "grandpa", "grandma", "boy", "girl", "hippy", "beard", "curly", "beanie", "robot", "cat", "owl", "frog", "panda"];
const nicknames = ["שועל", "ינשוף", "ניצוץ", "כוכב", "צפרדע", "אסטרו", "גל", "ברק", "פנדה", "שביט"];
const points = [3, 2, 1];
const roundCount = 10;
const idleMs = 90 * 60 * 1000;
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

class GameError extends Error {
  constructor(code, status = 409) {
    super(code);
    this.status = status;
  }
}

function nickname(value) {
  return typeof value === "string"
    ? Array.from(value.replace(/[\p{Cc}\p{Cf}]/gu, "").trim().replace(/\s+/g, " ")).slice(0, 18).join("")
    : "";
}

function makeCode() {
  return Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join("");
}

function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const other = randomInt(i + 1);
    [result[i], result[other]] = [result[other], result[i]];
  }
  return result;
}

function makeRoom(code, now) {
  return {
    code, gameId: randomUUID(), changedAt: now, phase: "lobby", host: null,
    players: [], order: [], chooser: null, round: 0, used: [], history: [],
    choices: [], question: null, deadline: null, finalized: false
  };
}

function addPlayer(room, form, profile, now) {
  if (room.phase !== "lobby") throw new GameError("already_started");
  if (room.players.length >= 8) throw new GameError("room_full");
  if (profile && room.players.some(player => player.user === profile.id)) throw new GameError("already_joined");
  const nameTaken = name => room.players.some(player => player.name.toLowerCase() === name.toLowerCase());
  let name = nickname(form.name) || (profile && profile.name);
  if (name && nameTaken(name)) throw new GameError("name_taken");
  if (!name) name = shuffle(nicknames).find(guest => !nameTaken(guest));
  const free = faces.filter(face => !room.players.some(player => player.face === face));
  const requested = form.face || (profile && profile.face);
  const player = {
    id: randomBytes(7).toString("hex"), token: randomBytes(24).toString("base64url"),
    name, face: free.includes(requested) ? requested : free[randomInt(free.length)],
    user: profile ? profile.id : null, score: 0, lastSeen: now, entry: null
  };
  room.players.push(player);
  room.changedAt = now;
  if (!room.host) room.host = player.id;
  return { code: room.code, token: player.token };
}

function sessionPlayer(room, token) {
  return typeof token === "string" && token ? room.players.find(player => player.token === token) : undefined;
}

function refreshPlayer(room, player, now) {
  let dirty = false;
  if (now - player.lastSeen >= 6_000) {
    player.lastSeen = now;
    room.changedAt = now;
    dirty = true;
  }
  const host = room.players.find(candidate => candidate.id === room.host);
  if (host && now - host.lastSeen > 24_000 && host !== player) {
    room.host = player.id;
    dirty = true;
  }
  return dirty;
}

function offer(room, bank, now) {
  room.round++;
  room.chooser = room.order.shift();
  room.order.push(room.chooser);
  const categories = Object.keys(topics).filter(topic => bank.some(q => q.topic === topic && !room.used.includes(q.id)));
  const varied = categories.filter(topic => topic !== room.question?.topic);
  room.choices = shuffle(varied.length >= 3 ? varied : categories).slice(0, 3);
  if (room.round === 8) room.choices[2] = "room";
  room.question = null;
  room.players.forEach(player => { player.entry = null; });
  room.phase = "topic";
  room.deadline = now + 16_000;
}

function pickQuestion(room, topic, bank, now) {
  if (topic === "room") {
    const answer = room.history.slice(0, 5).reduce((total, row) => total + row.points, 0);
    room.question = {
      id: "room-total", topic, prompt: "כמה נקודות צבר כל החדר יחד בחמש השאלות הראשונות?",
      answer, unit: "נקודות", widths: [2, 5, 12], note: "זה הסכום של ניקוד כל השחקנים בחמש השאלות הראשונות.", hint: ""
    };
  } else {
    const unused = bank.filter(q => q.topic === topic && !room.used.includes(q.id));
    const withHint = room.round === 5 ? unused.filter(q => q.hint) : [];
    const pool = withHint.length ? withHint : unused;
    room.question = pool[randomInt(pool.length)];
  }
  room.used.push(room.question.id);
  room.phase = "guess";
  room.deadline = now + 35_000;
}

function bounds(number, width) {
  return [Math.max(0, number - width), number + width];
}

function reveal(room, now) {
  const { widths, answer } = room.question;
  room.results = room.players.map(player => {
    const entry = player.entry;
    const range = entry ? bounds(entry.number, widths[entry.tier]) : null;
    const hit = range && answer >= range[0] && answer <= range[1];
    return { id: player.id, range, tier: entry?.tier ?? null, points: hit ? points[entry.tier] : 0, bonus: 0 };
  });
  const top = Math.max(0, ...room.results.map(row => row.points));
  const chooser = room.results.find(row => row.id === room.chooser);
  if (top && chooser?.points === top) chooser.bonus = 1;
  for (const row of room.results) {
    room.players.find(player => player.id === row.id).score += row.points + row.bonus;
  }
  room.history.push({ points: room.results.reduce((total, row) => total + row.points + row.bonus, 0) });
  room.phase = "reveal";
  room.deadline = now + 24_000;
}

function finishGuess(room, now) {
  if (room.round === 5 && room.question.hint && room.players.some(player => player.entry?.tier > 0)) {
    room.phase = "tighten";
    room.deadline = now + 10_000;
  } else {
    reveal(room, now);
  }
}

function nextRound(room, bank, now) {
  if (room.round < roundCount && room.players.length) {
    offer(room, bank, now);
  } else {
    room.phase = "over";
    room.deadline = null;
    room.finishedAt = now;
  }
}

function advance(room, bank, now) {
  if (!room.deadline || now < room.deadline) return false;
  if (room.phase === "topic") pickQuestion(room, room.choices[0], bank, now);
  else if (room.phase === "guess") finishGuess(room, now);
  else if (room.phase === "tighten") reveal(room, now);
  else if (room.phase === "reveal") nextRound(room, bank, now);
  room.changedAt = now;
  return true;
}

function winners(room) {
  const high = Math.max(0, ...room.players.map(player => player.score));
  return high ? room.players.filter(player => player.score === high).map(player => player.id) : [];
}

function action(room, player, body, bank, now) {
  const host = room.host === player.id;
  if (body.type !== "leave" && (body.type === "start" || body.type === "again") && !host) {
    throw new GameError("host_only", 403);
  }
  if (body.type === "leave") {
    room.players = room.players.filter(candidate => candidate !== player);
    room.order = room.order.filter(id => id !== player.id);
    if (host) room.host = room.players[0]?.id ?? null;
    if (room.phase === "topic" && room.chooser === player.id && room.players.length) {
      room.chooser = room.order.shift();
      room.order.push(room.chooser);
    }
    if (room.phase === "guess" && room.players.length && room.players.every(candidate => candidate.entry)) finishGuess(room, now);
    if (room.phase === "tighten" && room.players.length && room.players.every(candidate => !candidate.entry || candidate.entry.tier === 0 || candidate.entry.adjusted)) reveal(room, now);
  } else if (body.type === "start" && room.phase === "lobby") {
    if (room.players.length < 2) throw new GameError("need_2");
    room.order = shuffle(room.players.map(candidate => candidate.id));
    offer(room, bank, now);
  } else if (body.type === "topic" && room.phase === "topic") {
    if (room.chooser !== player.id) throw new GameError("chooser_only", 403);
    if (!room.choices.includes(body.topic)) throw new GameError("topic_invalid", 400);
    pickQuestion(room, body.topic, bank, now);
  } else if (body.type === "guess" && room.phase === "guess") {
    if (player.entry) throw new GameError("locked");
    if (!Number.isSafeInteger(body.number) || body.number < 0 || body.number > 1_000_000_000 || ![0, 1, 2].includes(body.tier)) {
      throw new GameError("guess_invalid", 400);
    }
    player.entry = { number: body.number, tier: body.tier };
    if (room.players.every(candidate => candidate.entry)) finishGuess(room, now);
  } else if (body.type === "tighten" && room.phase === "tighten") {
    if (!player.entry || player.entry.tier === 0 || player.entry.adjusted) throw new GameError("locked");
    if (body.shrink === true) player.entry.tier--;
    player.entry.adjusted = true;
    if (room.players.every(candidate => !candidate.entry || candidate.entry.tier === 0 || candidate.entry.adjusted)) reveal(room, now);
  } else if (body.type === "next" && room.phase === "reveal" && host) {
    nextRound(room, bank, now);
  } else if (body.type === "again" && room.phase === "over") {
    Object.assign(room, makeRoom(room.code, now), { players: room.players, host: room.host });
    room.players.forEach(candidate => { candidate.score = 0; candidate.entry = null; });
  } else {
    throw new GameError("wrong_phase");
  }
  room.changedAt = now;
}

function view(room, player, now) {
  const showResults = room.phase === "reveal" || room.phase === "over";
  const state = {
    code: room.code, phase: room.phase, round: room.round, roundCount, now, deadline: room.deadline,
    host: room.host, chooser: room.chooser, me: player?.id ?? null,
    players: room.players.map(candidate => ({
      id: candidate.id, name: candidate.name, face: candidate.face, score: candidate.score, locked: !!candidate.entry
    }))
  };
  if (room.phase === "topic") state.choices = room.choices.map(key => ({ key, name: topics[key] || "החדר שלנו" }));
  if (room.question) {
    const { prompt, unit, widths, topic, answer, note, hint } = room.question;
    state.question = { prompt, unit, widths, topic: topics[topic] || "החדר שלנו" };
    if (room.phase === "tighten") state.hint = hint;
    if (showResults) {
      state.answer = answer;
      state.note = note;
      state.results = room.results;
    }
  }
  if (player?.entry) state.entry = player.entry;
  if (room.phase === "over") state.winners = winners(room);
  return state;
}

module.exports = {
  GameError, faces, idleMs, nickname, makeCode, makeRoom, addPlayer, sessionPlayer,
  refreshPlayer, advance, action, view, winners, bounds, roundCount
};
