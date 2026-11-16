"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createApi, memoryRooms } = require("./between-api");
const { fileStore, startDay } = require("./between-store");
const { questions } = require("./between-questions");

async function main() {
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
      assert.equal(JSON.stringify(before).includes(host.token), false);

      await Promise.all(seats.slice(1).map((seat, i) => act(seat, "guess", { number: answer, tier: i % 2 ? 2 : 1 })));
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
      assert.deepEqual(after.results.map(row => row.points), [3, number === 5 ? 3 : 2, 1, 2, 1, 2, 1, 2]);
      if (number === 5) assert.equal(after.results[1].bonus, lobby.chooser === after.results[1].id ? 1 : 0);
      const hostRow = after.results.find(row => row.id === hostId);
      assert.equal(hostRow.bonus, lobby.chooser === hostId ? 1 : 0);
      if (number <= 5) firstFive += after.results.reduce((sum, row) => sum + row.points + row.bonus, 0);
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
    console.log("Between: eight seats, private guesses, range scoring, chooser bonus, ten rounds, mock Google OAuth, profiles and standings passed.");
  } finally {
    global.fetch = realFetch;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
