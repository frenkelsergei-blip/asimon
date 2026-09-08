# Testing

```bash
npm test        # twelve suites, no network, about a second
npm run playtest # 13,600 bot games, about five seconds, writes an HTML report
```

Both are plain `node` scripts. There is no test framework, because there are no
dependencies.

---

## The twelve suites

Run in this order by `npm test`. Each one is a claim; the claim is what matters,
not the assertions.

| suite | what it claims |
|---|---|
| `engine.test.js` | the rules hold over 540 simulated games — scoring, bands, the board, the six maps, the four modes. Includes the **`regular` is inert** guarantee: a game played as `regular` comes out identical to the game the engine played before modes existed |
| `cards.test.js` | all seven cards do what their own text says, including the awkward ones — Switch with nothing to switch to, Insight on a one-word round, Blindfold forcing the next round |
| `stall.test.js` | a room waiting on somebody who is not answering can always be put back on a step somebody can take — `skip`, `IDLE_MS`, and breaks |
| `copy.test.js` | **every key either page asks for answers in both languages.** This is what makes bilingual structural |
| `round.test.js` | the shape of a round across phones: a blind verdict belongs to the table, the podium names the winner, the aim pays, the move queue runs in order |
| `server.test.js` | a full round over real HTTP, on a real socket — **asserting the giver's words never reach another phone** |
| `reconnect.test.js` | phones dropping and coming back: the grace window, a second tab sharing a seat, a host who really has gone handing the room on |
| `groups.test.js` | a phone carrying several people — the roster the rules run on stays the people while the server keeps addressing the phone |
| `leave.test.js` | a seat given up mid-round, and the room re-seating around it |
| `screen.test.js` | the screen in the room holds no seat, and **no word before the reveal** — walked over both an ordinary round and a blind one, failing on any word, any hand, any aim |
| `changelog.test.js` | no release carries a number its own lines do not earn, and neither `package.json` nor `CHANGELOG.md` has drifted from `game/changelog.js` |
| `version.test.js` | the server is not serving a version the changelog does not name |

The last two are why the version cannot move without a line saying what moved
with it, and a line cannot be written without a version to hang it on.

---

## The sweep

`npm test` asks *is it correct?*. `npm run playtest` asks *is it any good?*

A table of bots plays **13,600 whole games** — every mode, every board, three to
eight phones, solo, in pairs and in groups — through `game/play.js`, sending the
exact actions a phone sends. Nothing reaches in behind `applyAction()` except
the clock, which is wound by hand so a hundred games take a second.

It ends in a verdict on **29 checks**, in eight areas:

| area | what it watches |
|---|---|
| **Length** | median rounds, median minutes, games decided too fast, games running past 40 minutes |
| **Modes / Boards / Table size / Seating** | that no dial quietly makes a different-length game |
| **The round** | unsolved rate, wrong shouts, solves landing late, no one square taking over, the rarest square still being met |
| **Pacing** | rounds that move six or more |
| **Cards** | cards met per game, games that meet none, every card drawn and played |
| **Wildcard** | games that meet one at all |
| **Drama** | close finishes, whether the halfway leader wins, the longest anybody waits without scoring |
| **Fairness** | giver turns evened out, players finishing on nothing |
| **Content** | words repeating inside a game, every topic getting dealt |
| **Rules** | the three pairs of rules that used to trip over each other |
| **Engine** | hard failures — stuck rooms, negative scores, endless games |

```bash
npm run playtest -- --players 3 --games 300   # one table size, deeply
npm run playtest -- --gameMode quick --map chaos
npm run playtest -- --seed 7 --json           # the numbers, for something else
npm run playtest -- --addRows 4 --cap 6       # try a change before making it
```

It exits **non-zero** on a hard failure only. Everything else is reported, not
judged.

### Arguing with the report

Two lists, both deliberately short and both in one place:

- **`CHECKS`**, near the foot of `game/playtest.js` — every threshold is a claim
  about what a good sitting looks like. Arguing with a verdict means arguing
  with that list.
- **`MODEL`**, at the top — how a table *behaves*: solve rates by word value, by
  square and by challenge, when a word lands, how often somebody shouts the
  wrong thing, how often a held card gets thrown, the giver's taste in words.
  Every number there is a claim about people, not about code.

If a rules change makes a check go red, the honest question is which of the two
lists was wrong. Both answers happen; the comments in `engine.js` are largely
the record of times the answer was *the rules*.

Reports are written to `reports/` as HTML, with an index of every sweep run.

---

## The hands-on playtest

`public/watch.html` opens N phones and the screen in one page, so a change can
be looked at rather than measured. The `/playtest` skill drives it.

---

## What to run when

| you changed | run |
|---|---|
| anything at all | `npm test` |
| a rule, a number, a square, a map, a mode | `npm run playtest` as well, and read the verdict |
| the copy | `npm test` — `copy.test.js` is the one that catches a half-translated key |
| what a screen or a phone is *sent* | `npm test` — `screen.test.js` and `server.test.js` are the privacy net |
| the version or the changelog | `npm run release`, then `npm test` |
