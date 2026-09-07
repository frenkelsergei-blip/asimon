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
| `game/engine.js` | the rules and all the content — written by hand |
| `game/build-engine.js` | lifts that engine out of the pass-and-play build |
| `game/play.js` | the round across several phones, and who may see what |
| `public/` | the phone: `index.html`, `app.js`, `art.js`, `style.css` |
| `public/board.html` | the screen in the room &mdash; with `board.js` and `board.css` |
| `public/boardart.js` | the board itself, drawn once for both the phone and the screen |
| `public/sfx.js` | the sounds, synthesised &mdash; no audio files, the way there are no images |
| `public/favicon.svg` | the mark, small cut &mdash; also `icon.svg` for the home screen |
| `public/manifest.webmanifest` | what a phone installs when it adds the game to its home screen |
| `design/logo/` | the logo canvas the mark came out of |
| `design/screen/` | the canvas the screen in the room was drawn on |
| `design/poster/` | the printed sheets, built by `node design/poster/build.js` |

The engine began as a lift out of the pass-and-play build, and `game/build-engine.js`
is the script that did it. It does not run any more: the game modes, the five
boards, the wildcard square and the board's balance were all written into the
engine by hand and are in no `buzz.html`, so regenerating would delete them.
Edit `game/engine.js` directly — `npm test` is the net, and `npm run playtest`
says what a change did to the game.

## Tests

```bash
npm test
```

Eleven suites: the rules over 540 simulated games, the seven cards, a stalled
room, the copy (every key either page asks for answers in both languages), the
shape of a round (a blind verdict belongs to the table; the podium names the
winner), a full round over real HTTP (asserting the giver's words never reach
another phone), phones dropping and reconnecting, a phone carrying a group, a
seat given up mid-round, the screen in the room (no seat, and no word before
the reveal), and the version surface.

## The playtest

`npm test` asks whether the game is correct. This asks whether it is any good:

```bash
npm run playtest
```

A table of bots plays 13,600 whole games — every mode, every board, three to
eight phones, solo, in pairs and in groups — through `game/play.js`, sending the same
actions a phone sends. It prints an audit: how long a sitting runs, which
squares and cards a table actually meets, whether the finishes are close, how
often somebody sits a round out with nothing to do, and a verdict on each of
twenty-nine checks with what to change when one fails.

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

## The screen in the room

A television, a tablet against the fruit bowl, a spare phone propped on a
glass. It watches a room by its code alone:

```
http://<the same address>/board?room=ABCD
```

The lobby prints that address under the one the phones join at, so it can be
read off the table. It holds no seat, counts against nobody, sends nothing
back, and takes a room only as far as eight screens.

**It never shows the four words.** Not before the reveal, not on a blind round
where every phone but the giver's can see them &mdash; because the one person
who must not know is sitting in front of it. `boardView()` in `game/play.js` is
written as a list of what a screen *may* see rather than as `viewFor()` with the
secrets taken back out, so a field added to a round tomorrow is missing from the
wall rather than published on it. `game/screen.test.js` walks an ordinary round
and a blind one and fails on any word, any hand, any aim.

What it does show: the board, whose turn it is, the clock, and where everybody
stands &mdash; one score and one bar each, and a card count only when somebody
is holding one. The moment is the phone's own receipt: amber while a word is in
play, green once it has been said out loud, ink for everything else.

One page, four shapes, decided by the screen it is on. Wide (a television, a
laptop, a tablet on its side) puts the board in a column beside the moment and
the table. Tall folds that into one column with the moment at the top. A phone
also sheds the two header facts it can spare. And **the map on its own** &mdash;
the board over the whole screen with a single quiet line under it &mdash; is one
tap on the board away, remembered, or reachable directly:

```
http://<the same address>/board?room=ABCD&map
```

On a landscape screen that map turns on its side and runs the long way, because
a portrait board on a television is a third of a screen and a lot of leftover
wall. It is the same drawing either way: `public/boardart.js` takes an `across`
flag, and the phone and the screen cannot draw two different boards.

The design canvas it was drawn on is `design/screen/`, built by
`node design/screen/build.js` &mdash; the artboards lift the real faces, the
real board and the real palette out of `public/`, so they cannot drift from the
game.

## A tablet, held either way up

The game is a receipt on a phone: one column, in a hand, at arm's length. A
tablet is not a large phone, so it gets its own two sizes and its own shape.

Everything on the sheet is a multiple of one number, `--k` at the head of
`public/style.css`. A phone leaves it at 1 and is untouched by all of this.
A tablet turns it up &mdash; 1.2, and 1.34 on a large one &mdash; and every
font size, figure, avatar and padding in the file follows, because each one is
written as a multiple of it rather than as a number of its own. The handful of
sizes measured in javascript instead (the cards in a hand, the podium, the
tokens in the play order) read the same dial through `kpx()`.

A tablet is *the short side of the glass being 600px or more*, asked once per
orientation so it survives being turned over: a phone on its side is 393px on
the short side and is left alone; an iPad is 744 to 1024 whichever way up.

**Upright** it is the phone's own screen, larger: one column down the middle of
the page, with the app filling the device rather than sitting on it as a
phone-shaped card.

**On its side** it is a different layout, because landscape is not a narrower
portrait &mdash; it is the same width with far less height. An iPad lying down
has 820px to spend where a phone standing up has 844, and half its width empty.
So the screens built around one figure put the figure down one side at the full
height it wants and everything that talks about it down the other: the board
and whose turn it is, the buzzer and the clock, the receipt and the scores, the
fifteen faces and the name being typed. The screens that are two lists rather
than a figure name their halves in the markup &mdash; the lobby is the room and
the settings, the giver's turn is a word and somebody to aim it at &mdash; and
those halves become the columns.

A `.pane` is `display:contents` everywhere but a tablet on its side, so off
that one case it generates no boxes at all: deleting both wrappers from a phone
moves nothing and changes the page height by nothing. That is the test to run
when adding one.

Four screens are deliberately left as one centred piece: the play order, the
wildcard, the swap, and every screen that is only waiting on somebody else.
Each is a single ceremony the whole table looks at &mdash; a shuffle, a card
turning over, a face &mdash; with no second half to set beside it. The play
order in particular animates across a full row and would wrap and break in half
the width.

## The poster, and the sheet beside it

A poster is not the manual. It has one job &mdash; stop somebody across a
room, land one idea, say where to go &mdash; so it carries one headline, one
picture, the one rule that makes this game different from every other guessing
game, and one address. The sheet next to it is the one that explains.

```bash
node design/poster/build.js            # the artboards
node design/poster/build.js --print d  # those, plus print-ready HTML in d/
```

The token and the palette are lifted out of `public/art.js` and
`public/style.css` rather than retyped, so a poster cannot quietly disagree
with the game it is a poster for. `design/poster/canvas.json` keeps the two
printed sheets on one page and two other poster directions on a second.

The PDFs under `docs/assets/` are those print files rendered at A4:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --no-pdf-header-footer --virtual-time-budget=6000 \
  --print-to-pdf=docs/assets/asimon-poster-A4.pdf d/Main.html
```

## Versions, and getting a phone off an old one

The game is installed, not visited. Added to a home screen it opens as its own
window &mdash; no address bar, nothing to pull down &mdash; and iOS will keep
that page alive for weeks. Left alone, that is a table playing last month's
build and nobody in the room able to tell.

So the build has a name. `currentBuild()` in `server.js` hashes the version in
`package.json` together with every file a page loads, and every page is served
with that hash stamped into it:

```html
<meta name="asimon-version" content="0.2.0">
<meta name="asimon-build" content="3c6392986e">
<script src="/app.js?v=3c6392986e"></script>
```

It is a hash of the contents on purpose. A restart, a redeploy of the same
files, a touched mtime &mdash; none of those should interrupt a game to
announce an update. Only a real change to a file the phone loads does.

From there the phone does the rest. It asks `/api/version` when it comes back
to the foreground, every fifteen minutes while it is being looked at, and
whenever somebody taps the version at the foot of the first screen. If the
answer names a different build, an update bar appears &mdash; on the first
screen, in the lobby, and on the podium, but never mid-round, which is not the
moment to ask anyone to reload. Tapping it drops any service worker and cache
the phone may be holding, then comes back on an address it has never seen.

Bump `version` in `package.json` for a release anyone should notice. Nothing
depends on remembering to: the hash moves on its own the moment a file does.

The caching follows from the same stamp. The page is never cached &mdash; it
is the one thing that must be fresh, because it names everything else. An asset
asked for under the current build may be kept for a year, because those exact
bytes will never change under that address. Anything else is `no-store`.

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
- `/healthz` reports the version, the build, uptime, and how many rooms are open.
- The address shown in the lobby follows how the room was reached, so it is
  the public URL on a host and the Wi-Fi address at home.
- Guards: 8 players a room, 400 rooms, 20 new rooms per address per 10
  minutes, 64 KB per request.
- No accounts and no personal data — a room is a four-letter code, a first
  name and a chosen face, all of it gone when the room expires.
