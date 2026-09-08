# The Asimon specs

`README.md` at the root says how to run the thing and how to ship it.
`CLAUDE.md` says what a commit here owes. **These files say what the game
actually is** — every rule, every screen, every number, and where each of them
is written down in the code.

They exist so that a session which has never seen this repository can pick up
a feature without first reading 6,000 lines to find out whether Gamble pays two
or three, or whether a screen on the wall is allowed to know the word.

| | |
|---|---|
| [overview.md](overview.md) | what Asimon is, who is at the table, and the five surfaces it runs on |
| [rules.md](rules.md) | the game itself — the round, the board, every square, every card, every number |
| [features.md](features.md) | the inventory: every feature that exists, where it lives, what test holds it |
| [architecture.md](architecture.md) | server, engine, round, phone — who owns what state and who may see it |
| [protocol.md](protocol.md) | the HTTP surface, the event stream, and every action a phone can send |
| [content.md](content.md) | the words, topics, links, cards and copy — and the bilingual rule |
| [testing.md](testing.md) | the thirteen suites, the bot sweep, and what each of them is actually claiming |
| [conventions.md](conventions.md) | how to add something here without breaking the parts nobody is looking at |

## These are descriptive, not aspirational

Everything in here is true of the code as it stands at **0.4.0**. Nothing in
here is a plan. When you find a spec and the code disagreeing, the code is what
the table is playing tonight — fix the spec in the same commit, or fix the code
and say so in `game/changelog.js`.

The numbers especially: they are copied from the source and they drift. Every
one of them names the file and the constant it came from, so it can be checked
in a second rather than believed.

## Where the real answer lives

| the question | the file that answers it |
|---|---|
| what does this square do | `game/engine.js` — `EN_MODS`, and `scoreRound()` |
| what may this phone see | `game/play.js` — `viewFor()` |
| what may the wall see | `game/play.js` — `boardView()` |
| what happens when somebody taps that | `game/play.js` — `applyAction()` |
| what does a room cost to hold open | `server.js` — the caps near the top |
| what changed, and what version am I on | `game/changelog.js` |
| is the game any good | `npm run playtest`, and `CHECKS` in `game/playtest.js` |
