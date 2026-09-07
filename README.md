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

Six suites: the rules over 540 simulated games, the seven cards, a stalled
room, the copy (every key the phone asks for answers in both languages), a
full round over real HTTP (asserting the giver's words never reach another
phone), and phones dropping and reconnecting.

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
