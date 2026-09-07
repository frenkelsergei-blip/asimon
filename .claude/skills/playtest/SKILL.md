---
name: playtest
description: Playtest Asimon — open N phones (and the screen) at /watch.html and hand them over for a hands-on session, and/or run the bot sweep `game/playtest.js` for an audit with an HTML report. Use when asked to playtest, open the phones, set the table, run a sweep/audit, "four phones and the screen", "let me try it myself", watch.html, or to check a rules change over many games.
---

# Playtest

Two ways to play Asimon for real, and this skill runs either or both:

- **Hands-on** — real phones in the browser at `/watch.html`, driven by the user
  (or by you, if asked). Nothing is simulated; this is the game.
- **The sweep** — `node game/playtest.js`, a table of bots playing whole games
  through `applyAction`, ending in a verdict and an HTML report in `reports/`.

## 1. Settle the configuration first

Read it out of what was asked. Never interrogate — pick the defaults below and
say in one line what you chose, so it can be corrected.

| Dial | Default | Comes from |
|---|---|---|
| what to run | hands-on if phones are mentioned, sweep if games/audit/rules are, both if both | the ask |
| phones | 3 | "five phones", "just two" |
| the screen | on | "no screen", "without the board", "screen only" |
| games per cell | 40 (sweep) / 200 (one table size) | "run it 500 times", "how many times to check" |
| table size | the whole sweep, 3–8 | "with 4 players" |
| seed | 20260907 | "a different seed", "seed 7" |
| map / gameMode / seating | all of them | "chaos", "quick", "in pairs", "groups" |

## 2. Hands-on

`/watch.html` reads its rack out of the address — do not edit the file to change
the count:

    /watch.html                        three phones and the screen
    /watch.html?phones=5               five phones and the screen
    /watch.html?phones=2&screen=0      two phones, no screen
    /watch.html?screen=only            the screen on its own
    /watch.html?phones=4&room=QRTZ     the screen opens straight into a room
    /watch.html?phones=6&cols=3&h=740  a rack that fits a shorter window

`phones` 1–12, `cols` 1–6, `h` the phone pane height in px. Each pane keeps its
own seat (`?p=1`), so the same browser holds a whole table.

Steps:

1. `preview_start` with `{name: "asimon"}` (`.claude/launch.json`, port 3000).
2. `navigate` to `http://localhost:3000/watch.html?phones=N&screen=1`.
3. `computer {action:"screenshot"}` so the user sees it is up, and report the URL.
4. Then **hand it over and stay watching**. Do not drive the phones unless asked
   to. While the user plays, keep checking `read_console_messages`,
   `preview_logs` and `read_network_requests` for errors, and say something only
   when there is something to say — an exception, a refused action, a stuck room.
   `read_page` on a pane beats a screenshot for reading state.

If asked to drive it instead, use `computer` clicks per pane and `read_page` to
confirm each step; screenshot at the moments worth seeing.

Leave the server running when the session is hands-on. Only `preview_stop` when
the user says they are done.

## 3. The sweep

    npm run playtest                                   the whole thing, ~5s
    node game/playtest.js --players 3 --games 300      one table size, deeply
    node game/playtest.js --gameMode quick --map chaos one slice
    node game/playtest.js --seating groups --players 4 a phone to a group
    node game/playtest.js --seed 7                     another draw of the dice
    node game/playtest.js --json                       numbers for something else
    node game/playtest.js --solo-only                  skip pairs and groups

Experiment dials that do not touch the engine: `--rows`, `--addRows`, `--cap`,
`--minus`, `--challenge`, `--out <dir>`.

It is fast — a full sweep is about 5 seconds, a slice is instant — so run it in
the foreground. Exit 1 means a **hard** failure (a stuck room, a negative score,
a game that never ended); those are bugs, not opinions, and get fixed before
anything else is discussed.

Every run writes `reports/<stamp>-<slice>.html` + `.json` and refreshes
`reports/index.html`.

### Reporting back

1. Lead with the verdict line and any NEEDS WORK checks, quoting the run's own
   words. Then the WORTH WATCHING ones. Do not re-summarise the healthy checks.
2. `SendUserFile` the written `.html` report with `display: "render"`.
3. If a previous report exists in `reports/`, say what moved against it — the
   `.json` next to each is there to be diffed.

## 4. Both at once

Sweep first (seconds, and it may find the thing worth watching for), then open
the phones and hand over. Say both in one line: the verdict, then the URL.
