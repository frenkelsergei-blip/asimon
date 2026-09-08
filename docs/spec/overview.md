# Overview

## The game in one paragraph

One player is the **giver**. The game deals them four words and they choose
one. They say **a single sentence, once**, and then not another word. Everybody
else shouts the moment they think they have it. The giver does not want it
understood immediately — a word that lands in the first quarter of the clock is
worth exactly one point, however hard it was. They want it landing **late**,
just before the clock runs out, because that is when it pays the most. So the
whole game is a person trying to be understood at the last possible moment, and
a table trying to beat them to it.

*Asimon* (אסימון) is the old Israeli telephone token. `נפל האסימון` — *the
token dropped* — is what you say when somebody finally gets it.

## What makes it different from every other guessing game

Landing instantly is a failure. That single inversion is what the poster
carries, what the sheet explains first, and what every scoring band in
`scoreRound()` is built around. Two squares deliberately turn it back the other
way — **Mime** and **Blind** — and both of them say so on their own face, because
a rule that flips has to be visible on the square you are standing on.

## Who is at the table

- **3 to 8 phones** in a room (`MIN_PLAYERS` in `game/play.js`, `MAX_PLAYERS`
  in `server.js`).
- Up to **5 people on one phone**, up to **30 people in a room** (`MAX_GROUP`,
  `MAX_PEOPLE`).
- Three ways to sit, chosen in the lobby (`SEATINGS`):
  - **solo** — every phone is one person, racing for themselves.
  - **pairs** — phones are paired; a pair is one racer on the board. Needs 4+.
  - **groups** — a phone carries a sofa. The people are the roster the rules
    run on; the phone stays the thing the server talks to.
- No accounts, no personal data. A room is a four-letter code, a first name and
  a chosen face, and all of it is gone 90 minutes after the last tap.

## The five surfaces

| surface | address | what it is |
|---|---|---|
| **the phone** | `/` | the game. `public/index.html`, `app.js`, `art.js`, `style.css` |
| **the screen in the room** | `/board?room=ABCD` | a television or spare tablet. Holds no seat, sends nothing, and **never shows the words** |
| **the map on the wall** | `/board?room=ABCD&map` | the board alone, turned sideways on a landscape screen |
| **the printed sheets** | `design/rules/`, `design/poster/` | the rulebook and the poster, built from the game's own palette and art |
| **the site** | `docs/index.html` | the page a stranger lands on, with the trailer and the PDFs |

A phone is *installed*, not visited: added to a home screen it runs as its own
window, which is why the build hash and the update bar exist at all. See
[architecture.md](architecture.md#versions-and-stale-phones).

## What is on disk

| | |
|---|---|
| `server.js` | rooms, the event stream, the HTTP surface, the caps. No packages. |
| `game/engine.js` | **the rules and all the content**, written by hand |
| `game/play.js` | the round across several phones, and who may see what |
| `game/changelog.js` | the source of the version number |
| `game/release.js` | works the number out from the tags and writes it |
| `game/playtest.js` | a table of bots playing 13,600 games, and 29 checks on the result |
| `game/*.test.js` | twelve suites, no network |
| `public/` | the phone and the screen |
| `design/` | the canvases the logo, the screen, the rulebook and the poster came off |
| `docs/` | the public site, its assets, and these specs |

## Two rules that outrank everything else

1. **No dependencies, anywhere.** Node's standard library on the server,
   hand-written JavaScript, CSS and SVG on the phone. No build step. If a thing
   needs a package, it needs a different design.
2. **`game/engine.js` is hand-maintained.** `game/build-engine.js` records how
   it was first lifted out of the old pass-and-play build and *refuses to run*.
   Regenerating it would delete the game modes, the five maps, the wildcard
   square and the board's whole balance, none of which were ever in that build.

## Glossary

| word | what it means here |
|---|---|
| **giver** | the player whose turn it is to say the sentence |
| **unit** | what actually races on the board — one person in solo, a pair, or a whole sofa |
| **phone** | a device holding a seat. In groups, one phone carries several people |
| **person** | an entry in the roster the rules run on. Has a name and a face |
| **square / node** | one cell of the board. Its column and row decide the next round's mod |
| **mod** | what a square does to the round — Standard, Fast, Mime, Blind, Gamble… |
| **band** | how much the timing was worth: too obvious, well pitched, almost lost them |
| **the shot / aim** | the one person the giver secretly bets will get it |
| **wildcard** | the square that rolls a random event instead of a mod |
| **map** | one of the five boards. Same shape, different pattern of squares |
| **game mode** | quick / regular / slow / challenge — clock, length and how you win |
| **build** | the hash of every file a page loads. Tells a phone it is stale |
