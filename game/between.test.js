"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createApi, memoryRooms } = require("./between-api");
const { fileStore, startDay } = require("./between-store");
const { questions } = require("./between-questions");
const engine = require("./between");
const whoGame = require("./who");
const whoCards = require("./who-cards");

function compareGolfGuesses() {
  const bank = [questions.find(question => question.unit === "גומות")];
  for (const [secondTier, totals] of [[2, [1, 1, 0]], [1, [1, 2, 0]]]) {
    const room = engine.makeRoom("GOLF", 0);
    for (const name of ["ינשוף", "ניצוץ", "מארחת"]) engine.addPlayer(room, { name }, null, 0);
    const [first, second, chooser] = room.players;
    engine.action(room, first, { type: "start" }, bank, 0);
    room.chooser = chooser.id;
    engine.action(room, chooser, { type: "topic", topic: "sports" }, bank, 0);
    engine.action(room, first, { type: "guess", number: 12, tier: 2 }, bank, 0);
    engine.action(room, second, { type: "guess", number: 13, tier: secondTier }, bank, 0);
    assert.equal(engine.view(room, null, 0).results, undefined);
    engine.action(room, chooser, { type: "guess", number: 50, tier: 0 }, bank, 0);
    const reveal = engine.view(room, null, 0);
    assert.equal(reveal.answer, 18);
    assert.deepEqual(reveal.results.map(row => row.total), totals);
    assert.deepEqual(reveal.roundWinners, secondTier === 2 ? [first.id, second.id] : [second.id]);
  }
}

function checkWhoSmallRooms() {
  for (const count of [2, 3, 4]) {
    const room = engine.makeRoom("WHOO", 0, "who");
    for (let i = 0; i < count; i++) engine.addPlayer(room, { name: `שחקן ${i}` }, null, 0);
    const players = room.players;
    const host = players[0];
    engine.action(room, host, { type: "start" }, null, 0);
    for (let i = 0; i < count; i++) {
      const actor = players[i];
      const witness = players[(i + 1) % count];
      const body = { round: 1, turn: i + 1 };
      const now = i * 60_000;
      const act = (player, type, time = now) => engine.action(room, player, { type, ...body }, null, time);
      if (i > 0) {
        assert.equal(room.phase, "who-ready");
        assert.equal(room.deadline, null);
        act(actor, "who-start");
      }
      assert.equal(room.phase, "who-active");
      assert.equal(engine.view(room, actor, now).turn.id, actor.id);
      assert.equal(room.deadline, now + 60_000);
      if (i === count - 1) act(actor, "who-hint");
      if (count === 4 && i === 0) {
        assert.equal(engine.advance(room, null, now + 59_999), false);
        assert.equal(engine.advance(room, null, now + 60_000), true);
        assert.equal(room.phase, "who-verify");
        assert.throws(() => act(witness, "who-continue", now + 60_000), /wrong_phase/);
        act(witness, "who-missed", now + 60_000);
        assert.equal(engine.view(room, actor, now + 60_000).turn.elapsed, null);
        assert.throws(() => act(witness, "who-solved", now + 60_000), /wrong_phase/);
        act(witness, "who-continue", now + 60_000);
      } else {
        const elapsed = 30_000 - i * 5000;
        act(witness, "who-solved", now + elapsed);
        assert.equal(engine.view(room, actor, now + elapsed).turn.elapsed, elapsed);
        act(witness, "who-continue", now + elapsed);
      }
    }
    assert.equal(room.phase, "who-reveal");
    assert.deepEqual(room.who.placements.map(player => player.id), players.slice(count === 4 ? 1 : 0).reverse().map(player => player.id));
    assert.deepEqual(players.map(player => player.score), [0, 1, 2, 2].slice(4 - count).map((score, i) => i === 0 ? 0 : score));
    const previous = Object.values(room.who.cards);
    engine.action(room, host, { type: "who-next", round: 1 }, null, count * 60_000);
    assert.equal(engine.view(room, host, 0).turn.id, players[1].id);
    assert.ok(Object.values(room.who.cards).every(card => !previous.includes(card)));
  }
}

function checkWhoLateConfirmation() {
  const room = engine.makeRoom("LATE", 0, "who");
  for (const name of ["מנחש", "שופטת"]) engine.addPlayer(room, { name }, null, 0);
  const [actor, witness] = room.players;
  const act = (player, type, now, turn = 1) => engine.action(room, player, { type, round: 1, turn }, null, now);
  act(actor, "start", 0);
  act(actor, "who-hint", 10_000);
  assert.throws(() => act(witness, "who-missed", 59_999), /wrong_phase/);
  assert.equal(engine.advance(room, null, 60_000), true);
  assert.equal(engine.advance(room, null, 61_000), false);
  assert.equal(engine.view(room, actor, 61_000).turn.identity, undefined);
  assert.equal(engine.view(room, null, 61_000).turn.identity, undefined);
  assert.equal(engine.view(room, witness, 61_000).turn.identity, room.who.cards[actor.id]);
  assert.throws(() => act(actor, "who-solved", 61_000), /wrong_phase/);
  assert.throws(() => act(actor, "who-missed", 61_000), /wrong_phase/);
  assert.throws(() => act(actor, "who-hint", 61_000), /wrong_phase/);
  act(witness, "who-solved", 61_000);
  assert.equal(engine.view(room, actor, 61_000).turn.elapsed, 60_000);
  assert.throws(() => act(witness, "who-missed", 61_000), /wrong_phase/);
  act(witness, "who-continue", 61_000);
  act(witness, "who-start", 62_000, 2);
  assert.throws(() => act(actor, "who-missed", 62_000, 1), /wrong_phase/);
  engine.advance(room, null, 122_000);
  act(actor, "who-missed", 122_000, 2);
  act(actor, "who-continue", 122_000, 2);
  assert.deepEqual(room.who.placements.map(({ elapsed, points }) => ({ elapsed, points })), [{ elapsed: 60_000, points: 2 }]);
  assert.deepEqual(engine.view(room, actor, 122_000).missed.map(({ id }) => id), [witness.id]);
}

function checkHintRotation() {
  assert.ok(Object.keys(whoCards).length >= 50);
  for (const hints of Object.values(whoCards)) assert.equal(new Set(hints).size, 3);
  const player = { id: "seat" };
  const room = { who: { cards: { seat: "אלברט איינשטיין" }, usedHints: {} } };
  const seen = new Set();
  for (let i = 0; i < 3; i++) {
    room.who.usedHints = {};
    whoGame.useHint(room, player, values => [...values]);
    seen.add(room.who.usedHints.seat);
  }
  assert.equal(seen.size, 3);
}

async function main() {
  compareGolfGuesses();
  checkWhoSmallRooms();
  checkWhoLateConfirmation();
  checkHintRotation();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "asimon-between-"));
  const realFetch = global.fetch;
  const url = "https://asimon.test/api/between";
  const filename = path.join(tmp, "stats.json");
  const store = fileStore(filename);
  const api = createApi({
    GOOGLE_CLIENT_ID: "test-client", GOOGLE_CLIENT_SECRET: "test-secret",
    SESSION_SECRET: "test-only-key-at-least-thirty-two-characters", PUBLIC_ORIGIN: "https://asimon.test"
  }, store, memoryRooms(store, () => true, 15));
  let cookie;

  async function call(route, data, { seat, auth = false, status = 200, origin } = {}) {
    const response = await api(new Request(`${url}${route}`, {
      method: data === undefined ? "GET" : "POST", body: data === undefined ? undefined : JSON.stringify(data),
      headers: {
        ...(seat ? { authorization: `Bearer ${seat.token}` } : {}),
        ...(auth ? { cookie } : {}),
        ...(origin ? { origin } : {})
      }
    }));
    const result = await response.json();
    assert.equal(response.status, status, JSON.stringify(result));
    return result;
  }

  try {
    const duo = await call("/create", { guest: true });
    const duoRoute = `/rooms/${duo.code}/action`;
    assert.equal((await call(duoRoute, { type: "start" }, { seat: duo, status: 409 })).error, "need_2");
    const second = await call("/join", { code: duo.code, guest: true });
    const duel = await call(duoRoute, { type: "start" }, { seat: duo });
    assert.equal(duel.phase, "topic");
    assert.equal(duel.players.length, 2);
    await call(duoRoute, { type: "leave" }, { seat: second });
    await call(duoRoute, { type: "leave" }, { seat: duo });

    const whoHost = await call("/create", { mode: "who", name: "מארח א" });
    const whoRoom = `/rooms/${whoHost.code}`;
    const whoAction = (seat, type, fields = {}, status = 200) =>
      call(`${whoRoom}/action`, { type, ...fields }, { seat, status });
    await whoAction(whoHost, "start", {}, 409);
    const whoSeats = [whoHost];
    for (let i = 1; i < 8; i++) {
      whoSeats.push(await call("/join", { code: whoHost.code, name: `אורח ${i}` }));
    }
    await whoAction(whoSeats[1], "mode", { mode: "between" }, 403);
    let whoState = await whoAction(whoHost, "start");
    assert.equal(whoState.mode, "who");
    const dealing = new Set();
    for (let i = 0; i < whoSeats.length; i++) {
      const actor = whoSeats[i];
      const witness = whoSeats[(i + 1) % whoSeats.length];
      const fields = { round: 1, turn: i + 1 };
      assert.equal(whoState.turn.identity, undefined);
      assert.equal(whoState.turn.number, i + 1);
      await whoAction(witness, "who-start", fields, 409);
      if (i > 0) assert.equal(whoState.phase, "who-ready");
      const active = i === 0 ? whoState : await whoAction(actor, "who-start", fields);
      assert.equal(active.phase, "who-active");
      assert.equal(active.turn.id, active.me);
      assert.equal(active.turn.identity, undefined);
      assert.equal(active.deadline - active.now, 60_000);
      if (i === 0) await whoAction(actor, "who-start", fields, 409);
      const seeCard = await call(whoRoom, undefined, { seat: witness });
      assert.equal(seeCard.phase, "who-active");
      assert.equal(seeCard.deadline, active.deadline);
      assert.ok(seeCard.turn.identity);
      assert.equal(seeCard.cards, undefined);
      dealing.add(seeCard.turn.identity);
      assert.equal((await call(whoRoom)).turn.identity, undefined);
      await whoAction(witness, "who-hint", fields, 409);
      await whoAction(actor, "who-solved", fields, 409);
      if (i === 0) {
        const hint = await whoAction(actor, "who-hint", fields);
        assert.ok(hint.hint);
        assert.equal((await whoAction(actor, "who-hint", fields)).hint, hint.hint);
        assert.equal((await call(whoRoom, undefined, { seat: witness })).hint, undefined);
      }
      const solved = await whoAction(witness, "who-solved", fields);
      assert.equal(solved.phase, "who-turn-result");
      assert.equal(solved.turn.identity, seeCard.turn.identity);
      assert.equal(typeof solved.turn.elapsed, "number");
      await whoAction(witness, "who-solved", fields, 409);
      whoState = await whoAction(witness, "who-continue", fields);
    }
    assert.equal(dealing.size, 8);
    assert.equal(whoState.phase, "who-reveal");
    assert.equal(whoState.places, 3);
    assert.equal(whoState.placements.length, 8);
    assert.deepEqual(whoState.placements.map(row => row.points),
      whoState.placements.map(({ place, hinted }) => Math.max(0, 4 - place - Number(hinted))));
    assert.equal((await call(whoRoom)).placements[0].identity, undefined);
    const switchLobby = await whoAction(whoHost, "who-lobby", { round: 1 });
    assert.equal(switchLobby.code, whoHost.code);
    assert.equal(switchLobby.players.length, 8);
    assert.equal(switchLobby.phase, "lobby");
    await whoAction(whoHost, "mode", { mode: "between" });
    assert.equal((await whoAction(whoHost, "start")).phase, "topic");

    const start = await api(new Request(`${url}/auth/google`));
    const target = new URL(start.headers.get("location"));
    assert.equal(start.status, 303);
    assert.equal(target.origin, "https://accounts.google.com");
    assert.equal(target.searchParams.get("code_challenge_method"), "S256");
    const stateCookie = start.headers.get("set-cookie").split(";")[0];
    const state = target.searchParams.get("state");
    const bad = await api(new Request(`${url}/auth/callback?code=test&state=wrong`, { headers: { cookie: stateCookie } }));
    assert.equal(bad.headers.get("location"), "/between?auth=failed");
    global.fetch = async (location, options) => {
      if (location === "https://oauth2.googleapis.com/token") {
        assert.ok(options.body.get("code_verifier"), "PKCE verifier accompanies the exchange");
        return Response.json({ access_token: "test-token" });
      }
      assert.equal(location, "https://openidconnect.googleapis.com/v1/userinfo");
      assert.equal(options.headers.authorization, "Bearer test-token");
      return Response.json({ sub: "1234" });
    };
    const callback = await api(new Request(`${url}/auth/callback?code=test&state=${state}`, { headers: { cookie: stateCookie } }));
    assert.equal(callback.headers.get("location"), "/between");
    cookie = callback.headers.get("set-cookie").match(/asimon_between=[^;]+/)[0];
    global.fetch = realFetch;
    await call("/profile", { name: "נועה", face: "fox" }, { auth: true });
    assert.equal((await call("/session", undefined, { auth: true })).profile.name, "נועה");
    await call("/profile", { name: "בוט", face: "fox" }, { auth: true, origin: "https://other.test", status: 403 });

    const host = await call("/create", { name: "נועה" }, { auth: true });
    const route = `/rooms/${host.code}`;
    const act = (seat, type, fields, status = 200) => call(`${route}/action`, { type, ...fields }, { seat, status });
    await act(host, "start", {}, 409);
    const seats = [host];
    for (let i = 1; i <= 7; i++) seats.push(await call("/join", { code: host.code, name: `חבר ${i}` }));
    await call("/join", { code: host.code, name: "חבר נוסף" }, { status: 409 });
    const ids = new Map();
    for (const seat of seats) ids.set((await call(route, undefined, { seat })).me, seat);
    const hostId = [...ids.keys()][0];
    await act(seats[1], "start", {}, 403);
    let lobby = await act(host, "start");
    assert.equal(lobby.phase, "topic");
    const choosers = [];
    let firstFive = 0;

    for (let number = 1; number <= 10; number++) {
      assert.equal(lobby.round, number);
      choosers.push(lobby.chooser);
      const chooser = ids.get(lobby.chooser);
      await act(seats.find(seat => seat !== chooser), "topic", { topic: lobby.choices[0].key }, 403);
      const topic = lobby.choices.find(item => item.key === "room") || lobby.choices[0];
      const status = await act(chooser, "topic", { topic: topic.key });
      const item = questions.find(question => question.prompt === status.question.prompt);
      const answer = topic.key === "room" ? firstFive : item.answer;
      assert.equal(status.answer, undefined);
      await act(host, "guess", { number: -1, tier: 0 }, 400);
      const submitted = await act(host, "guess", { number: answer, tier: 0 });
      assert.deepEqual(submitted.entry, { number: answer, tier: 0 });
      await act(host, "guess", { number: answer, tier: 0 }, 409);
      const before = await call(route);
      assert.equal(before.entry, undefined);
      assert.equal(before.answer, undefined);
      assert.equal(before.results, undefined);
      assert.equal(before.roundWinners, undefined);
      assert.equal(JSON.stringify(before).includes(host.token), false);

      await Promise.all(seats.slice(1).map((seat, i) => act(seat, "guess", { number: answer + Number(i === 1), tier: i % 2 ? 2 : 1 })));
      let after = await call(route);
      if (number === 5) {
        assert.equal(after.phase, "tighten");
        assert.ok(after.hint);
        assert.equal(after.answer, undefined);
        await Promise.all(seats.slice(1).map((seat, i) => act(seat, "tighten", { shrink: i === 0 })));
        after = await call(route);
      }
      assert.equal(after.phase, "reveal");
      assert.equal(after.answer, answer);
      assert.equal(after.results.length, 8);
      assert.deepEqual(after.results.map(row => row.number), [answer, answer, answer + 1, answer, answer, answer, answer, answer]);
      assert.deepEqual(after.results.map(row => row.points), [3, number === 5 ? 3 : 2, 1, 2, 1, 2, 1, 2]);
      assert.deepEqual(after.results.map(row => row.exactBonus), [1, 1, 0, 1, 1, 1, 1, 1]);
      for (const row of after.results) assert.equal(row.total, row.points + row.exactBonus + row.bonus);
      if (number === 5) assert.equal(after.results[1].bonus, lobby.chooser === after.results[1].id ? 1 : 0);
      const hostRow = after.results.find(row => row.id === hostId);
      assert.equal(hostRow.bonus, lobby.chooser === hostId ? 1 : 0);
      const expectedWinners = number !== 5 || hostRow.bonus ? [hostId]
        : after.results[1].bonus ? [after.results[1].id] : [hostId, after.results[1].id];
      assert.deepEqual(after.roundWinners, expectedWinners);
      if (number <= 5) firstFive += after.results.reduce((sum, row) => sum + row.total, 0);
      lobby = await act(host, "next");
    }
    assert.equal(new Set(choosers.slice(0, 8)).size, 8);
    assert.equal(lobby.phase, "over");
    assert.deepEqual(lobby.winners, [hostId]);
    assert.equal((await call("/profile", undefined, { auth: true })).stats.wins, 1);
    await Promise.all([call(route), call(route), call(route)]);
    assert.equal((await call("/profile", undefined, { auth: true })).stats.played, 1);
    assert.deepEqual((await call("/leaders?period=week")).leaders, [{ name: "נועה", face: "fox", wins: 1 }]);
    assert.equal(Object.keys(JSON.parse(fs.readFileSync(filename, "utf8")).games).length, 1);
    assert.equal((await fileStore(filename).stats("1234")).wins, 1);
    assert.equal((await act(host, "again")).phase, "lobby");
    const logout = await api(new Request(`${url}/auth/logout`, { method: "POST", headers: { cookie } }));
    assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
    assert.equal(startDay("day", Date.parse("2026-11-14T22:30:00Z")), "2026-11-15");
    assert.equal(startDay("week", Date.parse("2026-11-14T21:30:00Z")), "2026-11-08");
    console.log("Asimon rooms: Between scoring, Who Am I? card privacy and redeal, eight seats, mode switching, mock Google OAuth, profiles and standings passed.");
  } finally {
    global.fetch = realFetch;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
