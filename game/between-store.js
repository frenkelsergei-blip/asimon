"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { questions } = require("./between-questions");

const calendar = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit"
});

function dayKey(timestamp) {
  const parts = Object.fromEntries(calendar.formatToParts(timestamp).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function startDay(period, timestamp) {
  const today = dayKey(timestamp);
  if (period === "day") return today;
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().slice(0, 10);
}

function summarize(rows) {
  return {
    played: rows.length, wins: rows.filter(row => row.won).length,
    recent: rows.slice(0, 10).map(({ score, won, day }) => ({ score, won: !!won, day }))
  };
}

function fileStore(filename) {
  let data;
  function get() {
    if (!data) {
      try { data = JSON.parse(fs.readFileSync(filename, "utf8")); }
      catch (error) {
        if (error.code !== "ENOENT") throw error;
        data = { users: {}, games: {} };
      }
    }
    return data;
  }

  function save(next) {
    fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
    const temp = `${filename}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(next), { mode: 0o600 });
    fs.renameSync(temp, filename);
    data = next;
  }

  return {
    async bank() { return questions; },
    async profile(id) { return Object.hasOwn(get().users, id) ? get().users[id] : null; },
    async saveProfile(profile, newOnly = false) {
      if (newOnly && Object.hasOwn(get().users, profile.id)) return;
      const next = { ...get(), users: { ...get().users, [profile.id]: profile } };
      save(next);
    },
    async game(id, timestamp, entries) {
      if (Object.hasOwn(get().games, id)) return;
      const day = dayKey(timestamp);
      save({ ...get(), games: { ...get().games, [id]: { timestamp, day, entries } } });
    },
    async stats(id) {
      const rows = Object.values(get().games).sort((a, b) => b.timestamp - a.timestamp).flatMap(game =>
        game.entries.filter(entry => entry.user === id).map(entry => ({ ...entry, day: game.day })));
      return summarize(rows);
    },
    async leaders(period, now) {
      const minimum = startDay(period, now);
      const scores = new Map();
      for (const game of Object.values(get().games)) {
        if (game.day < minimum) continue;
        for (const row of game.entries) {
          if (row.won) scores.set(row.user, (scores.get(row.user) || 0) + 1);
        }
      }
      return [...scores.entries()].flatMap(([id, wins]) => {
        const profile = get().users[id];
        return profile ? [{ name: profile.name, face: profile.face, wins }] : [];
      }).sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name, "he")).slice(0, 50);
    }
  };
}

function postgresStore(connectionString) {
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString, max: 4, connectionTimeoutMillis: 5_000 });
  pool.on("error", error => { console.error("Between database connection:", error.code || "disconnected"); });
  let ready;
  let cachedBank;

  async function query(sql, parameters) {
    if (!ready) {
      ready = pool.query(`
        CREATE TABLE IF NOT EXISTS between_profiles (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, face TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS between_results (
          game UUID NOT NULL, player TEXT REFERENCES between_profiles(id), score INTEGER NOT NULL,
          won BOOLEAN NOT NULL, ended BIGINT NOT NULL, day TEXT NOT NULL, PRIMARY KEY (game, player)
        );
        CREATE INDEX IF NOT EXISTS between_by_player ON between_results (player, ended DESC);
        CREATE INDEX IF NOT EXISTS between_by_day ON between_results (day) WHERE won;
        CREATE TABLE IF NOT EXISTS between_questions (
          id TEXT PRIMARY KEY, content JSONB NOT NULL
        );
      `).then(() => pool.query(`
        INSERT INTO between_questions (id, content)
        SELECT question ->> 'id', question
        FROM jsonb_array_elements($1::jsonb) AS question
        ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content
      `, [JSON.stringify(questions)])).catch(error => { ready = null; throw error; });
    }
    await ready;
    return pool.query(sql, parameters);
  }

  return {
    async bank() {
      if (!cachedBank) {
        const { rows } = await query("SELECT content FROM between_questions ORDER BY id");
        cachedBank = rows.map(row => row.content);
      }
      return cachedBank;
    },
    async profile(id) {
      const { rows } = await query("SELECT id, name, face FROM between_profiles WHERE id = $1", [id]);
      return rows[0] || null;
    },
    saveProfile({ id, name, face }, newOnly = false) {
      return query(`INSERT INTO between_profiles (id, name, face) VALUES ($1, $2, $3)
        ON CONFLICT(id) DO UPDATE SET name = excluded.name, face = excluded.face WHERE NOT $4::boolean`, [id, name, face, newOnly]);
    },
    game(id, timestamp, entries) {
      return query(`INSERT INTO between_results (game, player, score, won, ended, day)
        SELECT $1, x."user", x.score, x.won, $2, $3
        FROM jsonb_to_recordset($4::jsonb) AS x("user" TEXT, score INTEGER, won BOOLEAN)
        ON CONFLICT (game, player) DO NOTHING`, [id, timestamp, dayKey(timestamp), JSON.stringify(entries)]);
    },
    async stats(id) {
      const [summary, recent] = await Promise.all([
        query(`SELECT COUNT(*)::int AS played, COUNT(*) FILTER (WHERE won)::int AS wins
          FROM between_results WHERE player = $1`, [id]),
        query(`SELECT score, won, day FROM between_results WHERE player = $1 ORDER BY ended DESC LIMIT 10`, [id])
      ]);
      return { ...summary.rows[0], recent: recent.rows };
    },
    async leaders(period, now) {
      const { rows } = await query(`SELECT p.name, p.face, COUNT(*)::int AS wins
        FROM between_results r JOIN between_profiles p ON p.id = r.player WHERE r.day >= $1 AND r.won
        GROUP BY p.id ORDER BY wins DESC, p.name, p.id LIMIT 50`, [startDay(period, now)]);
      return rows;
    }
  };
}

module.exports = { fileStore, postgresStore, dayKey, startDay };
