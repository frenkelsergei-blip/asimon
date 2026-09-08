# Architecture

No dependencies, no build step, no database. `node server.js` and the game is
up. Node 18 or later (`engines` in `package.json`).

```
        phone            phone            phone         screen on the wall
          │                │                │                    │
          │ POST /api/action                │                    │  (sends nothing)
          ▼                ▼                ▼                    ▼
    ┌───────────────────────────────────────────────────────────────────┐
    │  server.js — rooms in memory, one SSE stream per phone, the caps   │
    └───────────────────────────────────────────────────────────────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
            game/play.js                    game/engine.js
      the round across phones,         the rules and the content,
      viewFor() and boardView()        one instance per room
```

## The four layers, and why they are separate

| layer | owns | never knows about |
|---|---|---|
| `server.js` | rooms, streams, HTTP, caps, the build hash | the rules |
| `game/play.js` | the round across several phones, phases, **who may see what** | HTTP |
| `game/engine.js` | the rules, the board, the scoring, all the content | that there is more than one device |
| `public/` | drawing it, and the sounds | anything the server did not send |

The engine is one instance per room (`createEngine()`), and every extracted
function closes over that instance's own `S`. Two rooms can never see each
other's state, and there is no shared module-level game state anywhere.

## State ownership

**The server owns all of it.** A phone holds nothing authoritative — it draws
whatever last arrived on its stream and posts intentions back. There is no
optimistic update anywhere, which is why a phone that has been asleep for an
hour is correct the instant its stream reconnects.

- `rooms` — a `Map` of code → room, in memory. **Run exactly one instance.**
- `room.engine.S` — the game state: players, units, board, the current round.
- `room.phase` — which step the room is on, and the only thing actions are
  checked against.
- `room.people` — the roster the rules run on. `room.players` — the phones.

### Phones and people

A phone is not a player. In **solo** and **pairs** a phone carries exactly one
person and the two **share an id**, so every helper is an identity and the game
behaves exactly as it always has. The split exists so a phone can carry a whole
group: `roster()`, `personById()`, `peopleOf()`, `phoneOf()`, `owns()` in
`game/play.js`. Everything the *server* addresses — streams, actions, going
offline — stays the phone.

## Phases

`room.phase`, set in `game/play.js`.

| phase | what is happening | who can act |
|---|---|---|
| `lobby` | names, faces, seating, map, mode | host settles the game; anyone their own name and face |
| `order` | the play order is up on every phone | every phone taps in; the first round is dealt only once they all have |
| `giver` | the giver picks challenge, word, aim | the giver |
| `blind` | everybody but the giver picks their word | anybody but the giver |
| `table` | the clock is running | anybody — buzz, play a card |
| `judge` | was that the word? | the giver (on Blind, the table) |
| `reveal` | the result and what each line was worth | anybody, to move on |
| `move` | scorers spend their steps, one at a time | the unit whose turn it is |
| `award` | landed on a card square — three offered | that unit |
| `wild` | landed on a wildcard — rolled and applied | that unit, to acknowledge |
| `swap` | the Switch card — pick a different word | the giver |
| `over` | somebody won | the host, to play again |

Every action re-checks who is asking (`blockedBy()`, `waitingOn()`,
`awaitedIds()`). A phone can only do the thing that phone is entitled to do,
whatever it sends.

## Who may see what

This is the part that is easiest to break and hardest to notice, so it is built
two different ways on purpose.

- **`viewFor(room, pid)`** — what one phone is sent. The giver's four words go
  to the giver's device and nowhere else. On a Blind round it is the exact
  opposite: every phone but the giver's gets them.
- **`boardView(room)`** — what a screen on the wall is sent. Written as a
  **list of what a screen may see**, rather than as `viewFor()` with the
  secrets taken back out. So a field added to a round tomorrow is *missing*
  from the wall rather than published on it.

The screen never shows the four words. Not before the reveal, not on a Blind
round where every phone but the giver's can see them — because the one person
who must not know is sitting in front of it. `game/screen.test.js` walks an
ordinary round and a blind one and fails on any word, any hand, any aim.

The one deliberate exception is the **Insight** card, which puts the four
candidates up on purpose — that is the whole card, and by then it is already on
every phone in the room.

## The event stream

One `text/event-stream` per phone at `/api/events?room=&pid=`. Whole-state
pushes, not deltas — `broadcast(room)` sends every phone its own `viewFor()`
and every screen the `boardView()`.

- **`retry: 2000`** — the browser reconnects on its own.
- **A heartbeat every 20s** (`BEAT_MS`), sent as `{"type":"beat"}` **data**,
  not as an SSE comment. A comment is enough to stop a proxy closing a quiet
  stream, but `EventSource` throws it away without telling the page — so it
  could not be used as proof the stream was alive. Sent as data, it is the one
  thing a phone can *miss and notice it has missed*.
- **A 12s grace on disconnect** (`OFFLINE_GRACE_MS`) before a seat is marked
  offline — a phone locking its screen or switching tabs is not a player
  leaving. Another tab still holding the stream keeps the seat online.
- **A host who really has gone hands the room on** to the first online player.

The screen's stream is `/api/board?room=` — the room code is the whole of it.
No name, no seat, nothing it can send back, and at most 8 screens per room.

## Room lifetime and the caps

`server.js`, near the top.

| | |
|---|---|
| `MAX_PLAYERS` | 8 phones a room |
| `MAX_SCREENS` | 8 screens a room |
| `MAX_ROOMS` | 400 (`LS_MAX_ROOMS`) |
| `CREATE_PER_IP` | 20 new rooms per address per 10 minutes |
| request body | 64 KB, hard |
| `ROOM_IDLE_MS` | a room is forgotten 90 minutes after its last activity |
| `OFFLINE_GRACE_MS` | 12s (`LS_GRACE_MS`) |
| `BEAT_MS` | 20s (`LS_BEAT_MS`) |
| `IDLE_MS` | 45s (`LS_IDLE_MS`) before the room offers to skip whoever it is waiting on |
| `PAUSE_MS` | 30s a press, `PAUSE_MAX_MS` 5 minutes, `PAUSE_CALLS` 2 breaks each |

Room codes are four characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — no
`I`, `O`, `0` or `1`, because somebody has to read them off a table.

## Stalling, leaving, and breaks

Three separate things, easy to confuse.

- **Stalled** — the room is waiting on somebody who is not answering. After
  `IDLE_MS` the phones are offered a `skip`, which puts the room back on a step
  somebody can take. `game/stall.test.js`.
- **Leaving** — `leave` takes a seat off the board mid-round and re-seats the
  rest. `game/leave.test.js`.
- **A break** — `pause` stops everything for 30 seconds, extendable to 5
  minutes, two calls each. A paused room answers nothing but `pause` and
  `resume`. The ceiling is on *calling* a break, not on lengthening one, so a
  phone that has spent both of its own can still hand somebody else thirty
  seconds.

## Versions and stale phones

The game is installed, not visited: on a home screen it opens as its own
window, and iOS will keep that page alive for weeks. Left alone, that is a
table playing last month's build with nobody in the room able to tell.

`currentBuild()` in `server.js` hashes **the version together with every file a
page loads** and stamps it into every page:

```html
<meta name="asimon-version" content="0.4.0">
<meta name="asimon-build"   content="3c6392986e">
<script src="/app.js?v=3c6392986e"></script>
```

It hashes contents on purpose. A restart, a redeploy of the same files, a
touched mtime — none of those should interrupt a game to announce an update.
Only a real change to a file the phone loads does.

The phone asks `/api/version` when it returns to the foreground, every fifteen
minutes while it is being looked at, and whenever somebody taps the version at
the foot of the first screen. A different build raises an update bar — on the
first screen, in the lobby and on the podium, **never mid-round**.

Caching follows from the same stamp: the page itself is never cached, because
it names everything else. An asset asked for under the current build may be
kept for a year, because those exact bytes will never change under that
address. Everything else is `no-store`.

The hash says *that* you are stale. The version number and the changelog say
*what you are missing* — and they are the same thing here. See
[conventions.md](conventions.md#every-commit-sets-the-version).

## The phone

`public/app.js` (~2,000 lines) draws every screen. `public/art.js` is the
faces and the token, hand-written SVG — 40×40 flat shapes on a disc, no images
anywhere. `public/boardart.js` draws the board **once for both the phone and
the screen**, taking an `across` flag, so the two can never disagree about what
the board looks like. `public/sfx.js` synthesises the sounds — no audio files,
the way there are no images.

`public/style.css` hangs everything off one number, `--k` at the head of the
file. A phone leaves it at 1. A tablet turns it up to 1.2, or 1.34 on a large
one, and every font size, figure, avatar and padding follows, because each is
written as a multiple of it. The few sizes measured in JavaScript read the same
dial through `kpx()`.

A tablet is *the short side of the glass being 600px or more*, asked once per
orientation so it survives being turned over. On its side it is a different
layout — landscape is not a narrower portrait, it is the same width with far
less height. A `.pane` is `display:contents` everywhere but a tablet on its
side, so off that one case the wrappers generate no boxes at all.

## Hosting

Rooms live in memory, so **run exactly one instance**. `fly.toml` and
`render.yaml` both already do. `PORT` comes from the environment. `/healthz`
reports version, build, uptime and how many rooms are open.
