# The protocol

Everything is JSON over plain HTTP, plus two server-sent-event streams. No
websockets, no framework, no client library.

---

## Pages

| | |
|---|---|
| `GET /` | the phone (`public/index.html`) |
| `GET /board` | the screen in the room (`public/board.html`) |
| `GET /board?room=ABCD` | that screen, already watching a room |
| `GET /board?room=ABCD&map` | the map alone, over the whole screen |
| `GET /watch.html` | the playtest harness — several phones and the screen in one page |

Every page is served with the version and build stamped into it, and is
**never cached**. Assets asked for under the current build (`?v=<build>`) may
be cached for a year. Everything else is `no-store`.

---

## Joining

### `POST /api/create`

```json
{ "name": "Dana", "face": "curly", "lang": "he" }
```

→ `{ "code": "KRPT", "pid": "p8f3k2ma" }`

The creator becomes the host. `face` and `lang` are optional; a free face is
picked if none is given.

| error | meaning |
|---|---|
| `400 name_required` | no usable name |
| `503 busy` | `MAX_ROOMS` reached |
| `429 slow_down` | more than 20 rooms from this address in 10 minutes |

### `POST /api/join`

```json
{ "code": "KRPT", "name": "Yoni", "face": "beanie" }
```

→ `{ "code": "KRPT", "pid": "p2b9x1qc" }`

| error | meaning |
|---|---|
| `404 no_such_room` | wrong code, or the room has expired |
| `409 room_full` | 8 phones already |
| `409 name_taken` / `409 face_taken` | somebody has it |
| `409 already_started` | the game is past the lobby |

### `GET /api/room?code=KRPT`

What a phone asks *before* it commits, so it can say why it cannot join, and
what a screen asks before it opens a stream.

```json
{ "code":"KRPT", "phase":"lobby", "count":3,
  "taken":["curly","beanie","grandpa"], "screensFull":false }
```

### `GET /api/seat?room=KRPT&pid=p8f3k2ma`

Is this seat still real? Asked after a stream dies for good.
→ `{ "ok":true, "phase":"table" }` or `404 gone`.

---

## The streams

### `GET /api/events?room=KRPT&pid=p8f3k2ma`

`text/event-stream`. One per phone. Whole-state pushes, not deltas.

| message | when |
|---|---|
| `{"type":"ui","lang":"he","pack":{…}}` | on connect, and whenever the host changes the language |
| `{"type":"state","state":{…}}` | every time anything changes — this is `viewFor(room, pid)` |
| `{"type":"event","kind":"card","by":"Dana","card":{…}}` | somebody played a card |
| `{"type":"event","kind":"left","by":"Yoni"}` | somebody got up and left |
| `{"type":"beat"}` | every 20s |

`retry: 2000` is sent first, so the browser reconnects itself. The heartbeat is
**data, not a comment**, so a phone can tell when it has stopped arriving.

Reconnecting is free and idempotent: register, and the current whole state is
pushed immediately. A second tab on the same `pid` shares the seat and holds it
online.

`404 gone` if the room or the seat no longer exists.

### `GET /api/board?room=KRPT`

`text/event-stream`. What a screen on the wall gets — `boardView(room)`. **The
room code is the whole of it.** No pid, no seat, and there is no way to send
anything back. At most 8 screens per room.

It carries the board, the tokens, the scores, whose turn it is, the clock, the
mod in play, and how many cards each unit is holding. It **never** carries the
four words, a hand, or a private aim. See
[architecture.md](architecture.md#who-may-see-what).

---

## `POST /api/action`

Every action is one POST. Body is always at least:

```json
{ "code": "KRPT", "pid": "p8f3k2ma", "type": "<action>", … }
```

→ `200 {"ok":true}`, or `409 {"error":"..."}`, or `404 {"error":"gone"}`.
A refused action changes nothing. Every action re-checks who is asking; a phone
can only do what that phone is entitled to do, whatever it sends.

### Handled by the server — the room, not the round

| type | fields | who | notes |
|---|---|---|---|
| `leave` | — | anyone | gives up the seat, in the lobby or mid-round |
| `people` | `list:[{name,face}]` | anyone, lobby only | who is on this phone, sent whole so the two lists cannot drift. Max `MAX_GROUP` |
| `face` | `face` | anyone, lobby only | |
| `lang` | `lang:"en"\|"he"` | **host** | repacks the UI for every phone and screen |
| `start` | `seating`, `gameMode` | **host**, lobby only | needs 3 phones |

### Handled by the round — `applyAction()` in `game/play.js`

| type | fields | phase | who |
|---|---|---|---|
| `seating` | `seating:"solo"\|"pairs"\|"groups"` | lobby | host |
| `reroll_map` | — | lobby | host |
| `order_ok` | — | order | every phone, once each |
| `challenge` | `k:"topic"\|"open"\|"cold"` | giver | the giver |
| `topic` | `k` — the topic key | giver | the giver |
| `pick` | `i` (and a second for Two words / three for The link) | giver / blind | the giver — or, on Blind, anybody but them |
| `aim` | `target` — a person id, or none | giver | the giver |
| `ready` | — | giver | the giver — starts the clock |
| `buzz` | — | table | anyone not locked out |
| `judge` | `yes`, and `word` on a Two words round | judge | the giver (on Blind, the table) |
| `nobody` | — | table | the giver |
| `playcard` | `key` | table | whoever holds it; `swap` is the giver's alone |
| `swappick` | `i` | swap | the giver |
| `next` | — | reveal | anyone |
| `movepick` | `r`, `c` | move | the unit whose turn it is |
| `moveconfirm` | — | move | that unit |
| `take` | `key` | award | that unit — one of the three offered |
| `wildok` | — | wild | that unit |
| `pause` / `resume` | — | any but `over` | anyone. 2 calls each, 30s a press, 5 min ceiling |
| `skip` | — | when stalled | anyone, after `IDLE_MS` |
| `again` | — | over | host |

### Errors

| | |
|---|---|
| `gone` | no such room, or no such seat |
| `not_started` | there is no game yet |
| `not_now` | wrong phase |
| `not_your_turn` | right phase, wrong person |
| `host_only` | |
| `already_started` | a lobby-only action, past the lobby |
| `bad_choice` | not one of the options offered |
| `out_of_range` | that square is further than the steps you have |
| `pick_first` | confirm without a pick |
| `paused` | the room is on a break and answers nothing else |
| `no_breaks` | both breaks spent |
| `need_3` | fewer than `MIN_PLAYERS` |
| `room_full` / `name_taken` / `face_taken` | |

Set `LS_DEBUG` to have every refusal logged with the phase, the giver and the
asker.

---

## The rest

| | |
|---|---|
| `GET /api/version` | `{version, build}` — what the phone polls |
| `GET /api/changelog?lang=he` | the release list, already in that language, for **What's new** |
| `GET /healthz` | version, build, uptime, open rooms |
