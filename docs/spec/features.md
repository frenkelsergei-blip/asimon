# The feature inventory

Everything the game currently does, where it is written, and what holds it up.
If a feature is not on this list it does not exist yet — and if you add one, it
belongs here in the same commit.

---

## Play

| feature | where | held by |
|---|---|---|
| The round: four words, one sentence, said once | `engine.js` `newRound()` | `engine.test.js`, `round.test.js` |
| Timing bands — landing late pays most | `engine.js` `scoreRound()` | `engine.test.js` |
| Three challenges: topic / open / cold | `engine.js` `CHALLENGES`, `dealTopic()` | `engine.test.js` |
| The aim — a secret bet on who gets it | `engine.js` `shotBonus()` | `round.test.js` |
| Buzzing, judging, and being locked out | `play.js` `buzz`, `judge` | `round.test.js` |
| Nobody got it | `play.js` `nobody`, clock expiry | `round.test.js` |
| Ten square types (mods) | `engine.js` `EN_MODS` / `HE_MODS` | `engine.test.js`, playtest sweep |
| Duel — named out loud, one shout ends it | `engine.js` mod `U` | `round.test.js` |
| Two words — two words, one sentence | `engine.js` mod `W`, `scoreRound()` | `round.test.js` |
| The link — three of six, guessed at once | `engine.js` mod `L`, `dealLink()` | `round.test.js` |
| Blind — the giver guesses | `engine.js` mod `B`, `play.js` `blindShow` | `screen.test.js`, `round.test.js` |
| Gamble — the only square you can lose on | `engine.js` mod `G` | `engine.test.js` |
| Partners — a drawn, public partner | `engine.js` mod `T` | `round.test.js` |

## The board

| feature | where | held by |
|---|---|---|
| Four columns, three ways on from any square | `engine.js` `nextFrom()`, `reachable()` | `engine.test.js` |
| Points as steps you spend, stopping early allowed | `play.js` `movepick`, `moveconfirm` | `round.test.js` |
| Board length by unit count and crowd | `engine.js` `boardRows()` | playtest sweep |
| Five maps, each with its own pattern | `engine.js` `MAPS` | `engine.test.js` |
| Three of the five play a repertoire of five round kinds rather than all ten, so a board has a taste of its own; classic and chaos play all ten | `engine.js` `MAPS`, `kindsOf()` | `playtest.js` |
| Crossroads: any map laid as roads and junctions rather than four open lanes, with half the squares and a repertoire of five round kinds drawn each game — a lobby dial beside the map | `engine.js` `buildRoads()`, `drawRepertoire()`, `play.js` action `roads` | `engine.test.js`, `playtest.js` |
| Rerolling the map from the lobby | `play.js` `reroll_map` | `server.test.js` |
| Card squares — three offered, one kept | `engine.js` `isCardNode()`, `play.js` `take` | `cards.test.js` |
| The wildcard square — six outcomes | `engine.js` `isWildNode()`, `WILD_ODDS` | `engine.test.js` |
| Seven cards | `engine.js` `EN_CARDS`, `play.js` `playcard` | `cards.test.js` |
| Four game modes, incl. Challenge's score target | `engine.js` `MODES`, `winnerUnit()` | `engine.test.js` |

## The table

| feature | where | held by |
|---|---|---|
| 3–8 phones in a room | `play.js` `MIN_PLAYERS`, `server.js` `MAX_PLAYERS` | `server.test.js` |
| Solo, pairs, groups | `play.js` `SEATINGS`, `startGame()` | `groups.test.js` |
| Up to 5 people on one phone, 30 in a room | `play.js` `MAX_GROUP`, `MAX_PEOPLE` | `groups.test.js` |
| A play order everybody taps into before round one | `play.js` `order_ok` | `round.test.js` |
| Faces — 15 hand-drawn, one each | `server.js` `FACE_POOL`, `public/art.js` | `server.test.js` |
| Host: language, mode, seating, map, play again | `server.js`, `play.js` | `server.test.js` |
| Taking a break — 30s a press, 2 each, 5 min ceiling | `play.js` `pause`/`resume` | `stall.test.js` |
| Getting up mid-round | `play.js` `leave()` | `leave.test.js` |
| Skipping whoever the room is stuck on | `play.js` `skip`, `IDLE_MS` | `stall.test.js` |
| Dropping and coming back | `server.js` `OFFLINE_GRACE_MS`, the stream | `reconnect.test.js` |
| Joining by scanning a square — the lobby's two addresses each open one, and a scanned link lands on the join screen with the code already in it | `public/qr.js`, `app.js` `scanBtn()`, `qrBody()`, `?room=` at boot | `qr.test.js` |
| A host who leaves hands the room on | `server.js` | `reconnect.test.js` |

## The screen in the room

| feature | where | held by |
|---|---|---|
| Watching a room by its code alone, no seat | `server.js` `/api/board` | `screen.test.js` |
| Never shows the four words, ever | `play.js` `boardView()` | `screen.test.js` |
| Four layouts: wide, tall, phone, map-only | `public/board.css`, `board.js` | — |
| The board drawn as a place — one scene per map, with the players standing on it | `public/worldart.js` `draw()` | — |
| Five places: farm, jungle, storm coast, desert, volcano — each with its own squares, roads and coast | `worldart.js` `SCENES`, `NODES`, `road()`, `coast()` | — |
| Original scene backgrounds with fixed surface details outside the routes that stay put on redraw | `worldart.js` `landscape()` | — |
| Scenery kept clear of the lanes, visible lane-change trails even during moves, outlined player pieces with coloured bases, and start spaces in the map's own material with larger finish flags | `worldart.js` `wideProps()`, `tallProps()`, `scene()`, `figure()` | — |
| Players sharing a square spread into rows of up to four, keeping crowded starts within the map | `worldart.js` `scene()` | — |
| A map laid as roads drawn in its own place, one piece of road per way it sends | `worldart.js` `scene()` on `board.ways` | — |
| A move is a hop from square to square; the scenery moves on its own | `worldart.js` `figure()`, `board.css` `w-hop` | — |
| Every figure stands as a bust — a person as drawn, a creature's disc made a head with its ears on shoulders | `worldart.js` `figure()`, `CREATURES` | — |
| Each kind of figure waits and hops in its own way, on a class the figure carries | `board.css` `w-idle-*`, `w-fl-*` | — |
| The place stood up for a tablet, laid long for a wall | `worldart.js` `orient()` | — |
| The place heard as well as seen, once asked (`?sound`, the corner switch) | `worldart.js` `ambience()` | — |
| A hop heard in the figure's own voice — leaving and landing — once the screen's sound is on | `worldart.js` `hop()`, `board.js` on a state message | — |
| Every square wears its twist's print, the finish a chequered one; a Legend sheet on the wall reads them | `worldart.js` `badge()`, `FINISH`, `board.js` `showLegend()` | — |
| The flat board, drawn once for the phone and as the screen's fallback | `public/boardart.js` | — |
| A lit square's word written in the ink its own lane colour asks for, per map | `style.css` `--map-*-ink`, `boardart.js` `inks()` | — |
| The room code as a square beside the room code in letters, so a phone joins by camera | `board.js` `scanPanel()`, `public/qr.js` | `qr.test.js` |
| Up to 8 screens per room | `server.js` `MAX_SCREENS` | `server.test.js` |

## The phone

| feature | where | held by |
|---|---|---|
| Every screen of the game | `public/app.js` | — |
| Faces and the token, hand-written SVG | `public/art.js` | — |
| A fanned card hand with corner symbols and a tapped card that animates upward, straightens and enlarges for reading; awards fit narrow phones | `art.js` `cardFace()`, `app.js` `handBlock()` / `vAward()` / `h()`, `style.css` | — |
| Round results separate points and available steps from current board positions, with larger scoring explanations | `app.js` `vReveal()`, `style.css` | — |
| Sounds, synthesised — no audio files | `public/sfx.js` | — |
| QR codes, drawn here — eight-bit mode, versions 1–10, the mask scored the way the standard says | `public/qr.js` | `qr.test.js` |
| One scale dial, `--k`, driving every size | `public/style.css`, `kpx()` | — |
| A tablet laid out for a tablet, either way up | `public/style.css` `.pane` | — |
| Installable to a home screen | `public/manifest.webmanifest`, `icon.svg` | — |
| The update bar, never mid-round | `public/app.js`, `/api/version` | `version.test.js` |
| **What's new** at the foot of the first screen | `/api/changelog` | `changelog.test.js` |
| **Reading the board** — the legend named off the board actually in play: its lanes, its colours, the round kinds it deals, and a road board's own way of stepping | `app.js` `legendBody()`, `boardLanes()`, `stepDiagram()` | `copy.test.js` |
| Bilingual, Hebrew and English, everywhere | `engine.js` `EN_*`/`HE_*`, `uiPack()` | `copy.test.js` |

## The content

| feature | where | held by |
|---|---|---|
| 1,200 words a language, 300 at each of four tiers | `engine.js` `EN_WORDS` / `HE_WORDS` | `content.test.js` |
| Twenty topics, each answering at all four tiers | `engine.js` `EN_TOPICS` / `HE_TOPICS`, `dealTopic()` | `content.test.js` |
| A hand-drawn emblem for every topic | `public/art.js` `TOPIC_ART` | `content.test.js` |
| Ninety-five links, each a thing and six words | `engine.js` `EN_LINKS` / `HE_LINKS`, `dealLink()` | `content.test.js`, `round.test.js` |
| Words already used in a game are not dealt again | `engine.js` `S.used` | `engine.test.js` |

## Around the game

| feature | where | held by |
|---|---|---|
| The version falls out of the changelog | `game/changelog.js`, `release.js` | `changelog.test.js`, `version.test.js` |
| The build hash — a phone knows it is stale | `server.js` `currentBuild()` | `version.test.js` |
| Caps and guards for a public host | `server.js` | `server.test.js` |
| `/healthz` | `server.js` | — |
| The bot sweep and its report | `game/playtest.js`, `playtest-report.js` | `npm run playtest` |
| The playtest harness page | `public/watch.html`, the `/playtest` skill | — |
| The rulebook, both languages, print-ready | `design/rules/build.js` | — |
| The poster and the how-to-play sheet | `design/poster/build.js` | — |
| The painted poster that actually ships | `design/kit/export/poster_asimon.jpg` | — |
| The logo, the screen and the card canvases | `design/logo/`, `design/screen/`, `design/cards/` | — |
| The map-as-a-place canvas, drawn by the shipped `worldart.js` so canvas and wall cannot drift | `design/world/build.js` | — |
| The public site, trailer and PDFs | `docs/index.html`, `docs/assets/` | — |

---

## Not built

Written down so a session does not have to rediscover that they are absent.

- No accounts, no persistence, no database. A room is gone 90 minutes after the
  last tap and that is deliberate.
- No spectator chat, no reactions, no emoji.
- No sound on the screen in the room until somebody asks for it — the game's
  sounds are the phone's; the screen has only the ambience of its place, off
  by default.
- No reconnect across a server restart. Rooms are in memory; a redeploy ends
  every game in progress.
- No horizontal scaling. **Run exactly one instance.**
- No third language. The bilingual rule is structural — `copy.test.js` fails on
  a key that answers in only one — and a third would be a real piece of work,
  not a file of strings.
