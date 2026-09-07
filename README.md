# Asimon

A game for the whole family, played across phones. One sentence, said once —
and you want it understood at the last possible moment.

*Asimon* (אסימון) is the old Israeli telephone token. `נפל האסימון` — *the
token dropped* — is what you say when somebody finally gets it.

Bilingual (Hebrew and English), no dependencies, no build step.

```bash
node server.js
```

Then everyone opens the address it prints. On this machine that is the Wi-Fi
address; once it is hosted, it is the public one.

## What is here

| | |
|---|---|
| `server.js` | rooms, the live stream, the HTTP surface. No packages. |
| `game/engine.js` | **generated** — the rules and all the content |
| `game/build-engine.js` | lifts that engine out of the pass-and-play build |
| `game/play.js` | the round across several phones, and who may see what |
| `public/` | the phone: `index.html`, `app.js`, `art.js`, `style.css` |
| `public/sfx.js` | the sounds, synthesised &mdash; no audio files, the way there are no images |
| `public/favicon.svg` | the mark, small cut &mdash; also `icon.svg` for the home screen |
| `design/logo/` | the logo canvas the mark came out of |

The engine is generated, never edited by hand. When the rules or the words
change in the pass-and-play build, regenerate:

```bash
npm run build:engine -- /path/to/buzz.html
```

## Tests

```bash
npm test
```

Eight suites: the rules over 540 simulated games, the seven cards, a stalled
room, the copy (every key the phone asks for answers in both languages), the
shape of a round (a blind verdict belongs to the table; the podium names the
winner), a full round over real HTTP (asserting the giver's words never reach
another phone), phones dropping and reconnecting, and a phone carrying a group.

## The playtest

`npm test` asks whether the game is correct. This asks whether it is any good:

```bash
npm run playtest
```

A table of bots plays 8,800 whole games — every mode, every board, three to
eight players, solo and in pairs — through `game/play.js`, sending the same
actions a phone sends. It prints an audit: how long a sitting runs, which
squares and cards a table actually meets, whether the finishes are close, how
often somebody sits a round out with nothing to do, and a verdict on each of
twenty-seven checks with what to change when one fails.

Every threshold is a claim about what a good sitting looks like, and they are
gathered in `CHECKS` near the foot of `game/playtest.js` — arguing with the
report means arguing with that list. So is the model of how a table behaves:
`MODEL` at the top holds the solve rates, the timing, and the taste in words.

```bash
npm run playtest -- --players 3 --games 300   # one table size, deeply
npm run playtest -- --gameMode quick --map chaos
npm run playtest -- --seed 7 --json           # the numbers, for something else
npm run playtest -- --addRows 4 --cap 6       # try a change before making it
```

It exits non-zero on a hard failure — a stuck room, a negative score, a game
that never ends.

## Hosting it

Rooms live in memory, so **run exactly one instance**. Both configs here
already do. A room is forgotten 90 minutes after its last activity.

### Fly.io

```bash
brew install flyctl
fly auth signup          # or: fly auth login
fly launch --no-deploy   # keeps the fly.toml here; pick a name
fly deploy
```

### Render

Push this folder to a GitHub repo, then New → Blueprint and point it at the
repo. `render.yaml` sets the rest. Free instances sleep when idle, so the
first person in waits a few seconds for it to wake.

### Just for tonight

No account, no deploy — a public link straight to this Mac, for as long as it
stays awake:

```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:3000
```

It prints a `https://….trycloudflare.com` address. The link changes every time
you restart it.

## Notes for a public host

- `PORT` is read from the environment (`8080` in the container).
- `/healthz` reports uptime and how many rooms are open.
- The address shown in the lobby follows how the room was reached, so it is
  the public URL on a host and the Wi-Fi address at home.
- Guards: 8 players a room, 400 rooms, 20 new rooms per address per 10
  minutes, 64 KB per request.
- No accounts and no personal data — a room is a four-letter code, a first
  name and a chosen face, all of it gone when the room expires.
