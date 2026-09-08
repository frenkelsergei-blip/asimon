# The rules

Everything here is written in `game/engine.js`, with the multi-phone sequencing
in `game/play.js`. Where a number appears below, the constant it came from is
named beside it. **The engine is hand-maintained** — see
[conventions.md](conventions.md).

---

## 1. The shape of a game

A game is a race up a board. Rounds are dealt one after another; each round
pays points to the units that earned them; **points are steps you spend** on
the board, and the square you choose to stop on decides what kind of round you
play next time you give.

```
lobby → order → [ giver → table → judge → reveal → move (→ award | wild) ]* → over
```

The bracketed part is one round, repeated. `room.phase` in `game/play.js` holds
which step the room is on; `S.screen` in the engine holds the phone's own view
of it. The full list of phases is in [architecture.md](architecture.md#phases).

### Winning

`winnerUnit()` in `game/engine.js`.

- **first** (quick, regular, slow) — the first unit past the finish line wins.
  The finish is row `ROWS()+1`.
- **score** (challenge) — the first unit to **20** points (`scoreTarget`) wins,
  *and* the finish line still stands behind it as a safety net so a stalled
  game cannot run forever.

---

## 2. The board

`COLS = 4`. A position is `{r,c}`. `r = 0` is the start line, `r = ROWS()+1` is
the finish.

On a **lattice** board — five of the six — every square exists and there are
**three ways on** from each: straight up, or one column left, or one column
right (`nextFrom()`). From the start line you may enter any of the four
columns. You re-choose every single round, which is the whole point of the
board — the lane is a running decision, not a starting one.

```
col 0        col 1        col 2        col 3
quiet ────────────────────────────────► awkward
```

### Road boards

Any map can be laid as **Crossroads** instead of lanes — a dial the host turns in
the lobby beside the map (`room.roads`, action `roads`). Laid that way the map is
a network rather than a lattice, and `buildRoads()` lays it out once when the
board is set, from `ROADS` in `game/engine.js`. The map keeps its paint, its card
and wildcard rules and its row nudge. Three things change, and
only inside `nextFrom()` — `reachable()`, the phones, the screen and the bots
all read the board through it:

- **Not every square is there.** `nodeCols(r)` says which columns row `r`
  carries; `nodeExists(r,c)` asks about one. About half a lattice's squares.
- **The ways between them are laid, not assumed.** Between two junctions the
  board carries two or three roads that do not touch, each wandering a column
  either way as it climbs. Most squares therefore have **one** way on: get on
  a road and you are on it until the next junction. A **crossover** — one or
  two per segment, where two roads run within a column of each other — is the
  only place a route changes its mind mid-segment.
- **Every `junction`th row is one square**, which the whole table passes
  through and which fans out to every road of the segment above. It is the
  place to change your mind about the rest of the board, and the start line
  has always worked exactly this way.

The card and the wildcard keep the frequency their map asked for: where the
square a rule names is not on the board, the rule takes the next one up its own
column rather than losing its turn. A wildcard's leap or slip keeps its column,
so on a road board it lands on the nearest square that is actually there
(`landOn()`).

A road board also draws its **repertoire** each game: the plain square, plus
`roads.kinds` of the nine variants, spanned so at least one is gentle and at
least one is harsh, and laid out gentle-left to harsh-right. Two games on it
are two different games, and neither asks the table to hold ten rules at once.
A third of the board is Standard, against a fifth on a lattice — with fewer
squares and no free lane change, somewhere quiet has to be built in rather than
always being one step away. A mode's reweighting still colours the board, but
inside that repertoire (`buildPattern(map, modeId, allowed)`).

Column 0 is the lane you hug when you want a round that cannot punish you. It
carries Partners and Fast and none of Gamble, Mime or Blind — on every map but
**chaos**, which is named for what it is.

### How long the board is

`boardRows(n, modeId, mapId, crowd)` in `game/engine.js`, where `n` is the
number of **units** and `crowd` is the average number of people behind each
one.

| units | base rows |
|---|---|
| 2 or fewer | 20 |
| 3 | 17 |
| 4 – 5 | 16 |
| 6 | 14 |
| 7 – 8 | 12 |

Then `+ round(max(0, crowd − 1) × 1.5)` — a sofa of three has three chances at
every word and gives just as often, so it comes round the board faster and the
board has to be longer to hold the same evening.

Then the two dials. A **lengthening** (`rowsDelta ≥ 0`) is taken whole. A
**shortening** is allowed to take about a third and no more:
`max(10, round(base × 0.7), base + delta)`. Quick on Sprint used to come to
nine rows, which is three good rounds — over before the table had met the board.

### Squares

Every square is one of ten **mods**, read off the map's own pattern:
`nodeTypeAt(r,c) = pattern[c][(r−1) % 6]`.

Two rules overlay that, both per-map:

- **card square** — `isCardNode(r,c)`: `c === cardRule.col && r % cardRule.every === 0`.
  Landing on one offers you three cards; you keep one.
- **wildcard square** — `isWildNode(r,c)`: same shape with `wildRule`, and it
  **never claims a square the card rule already has**. Rarer than a card, and
  always in a different lane.

### Moving

`reachable(from, steps)`. You may spend **up to** the points you scored and
stop anywhere along the way — stopping early is fine and often right, because
where you stop is what you are choosing. Scoring units move one at a time, in
board order (`moveOrder()`), and the phone confirms (`movepick` then
`moveconfirm`).

A landing on a card square opens the **award** phase; on a wildcard, the
**wild** phase. The new position is never re-examined afterwards — a leap onto
another wildcard stops there, so one unlucky roll cannot cascade.

---

## 3. A round

`newRound()` in `game/engine.js`.

1. The giver is `S.players[S.giverIdx % length]` — the seat order, cycling.
2. The **mod** is whatever square that giver's unit is standing on, unless a
   Blindfold card has forced `B`.
3. Four words are dealt, **one from each tier** `[2,3,4,5]` — so there is
   always a cheap one to hide behind. On a **Gamble** it is `[4,4,5,5]`
   instead: no cheap way out. Words already used this game are avoided until
   the bank runs dry.
4. The aim (`shot`) is settled — see [the aim](#the-aim).
5. The clock is set from the game mode: `fast` on Fast and Gamble squares,
   `normal` otherwise.

Then the giver's own screen: they choose a **challenge**, then a **word**, then
(if the round allows it) **who to aim at**, then hand the phone to the middle of
the table and start the clock.

### The three challenges

`CHALLENGES` in `game/engine.js`. Chosen by the giver before they see which
word they will take.

| choice | what it does | value |
|---|---|---|
| **Give them a topic** | four words from one topic, and the table is told the topic | **−1** per word |
| **Take what comes** | four mixed words, nobody helped | **0** |
| **Cold** | one word, dealt to you, no choice and no topic | **+1** |

Blind and The link are always `open` — there is nothing to choose.

### The aim

The giver bets on who will get it. `SHOT_BONUS = 1`, and `shotBonus(R)` adds
one more on a **Duel**, because a Duel is said out loud with no safety net.

- **solo, ordinary round** — a secret guess. `shotPublic = false`.
- **pairs** — the aim is your partner, fixed and public.
- **Partners square (T)** — the game draws you a partner, fixed and public.
- **Duel square (U)** — you name somebody out loud. Public, but still yours to
  choose. `shotFixed = false`.
- **Blind (B)** — no aim at all.

### The table

The clock runs. Anybody may shout (`buzz`); the giver judges (`judge`).

- A **wrong** shout locks that person out of the rest of the round and costs
  them a point — **two** on a Gamble (`wrongCost`).
- A **right** shout ends the round and freezes the clock at `solveMs`.
- If the clock runs out or the giver taps *nobody got it*, the round is scored
  unsolved.

Cards may be played from the table (`playcard`) — see [cards](#5-cards).

---

## 4. Scoring

`scoreRound()` in `game/engine.js`. Two payments go out on a solved round: the
**word** to whoever got it, and the **timing** to the giver.

### What a word is worth

`POINTS = { 2:1, 3:2, 4:3, 5:4 }` — the tier is *not* the price. A round pays
twice and both payments are steps on a board of sixteen or so rows, so the
scale sits a notch below the tiers.

```
value = max(1, POINTS[tier] + (Gamble ? +2 : 0) + (Two words ? −1 : 0) + challengeDelta)
```

A **link** has no tier — it is a thing, not a word off a bank — so it carries
one flat `LINK_VALUE = 3`, pitched at the dearer end because naming it from
three oblique words is the hardest ask in the game.

### The timing bands

`frac = solveMs / (total × 1000)`.

| when it landed | ordinary round | **Mime and Blind** |
|---|---|---|
| first 25% | **1** — *too obvious* | `value + 2` — *read instantly* |
| 25% – 70% | `value` — *well pitched* | `value + 1` — *got there* |
| after 70% | `value + 1` — *almost lost them* | `value` — *only just* |
| nobody | **0** | 0 |

That first row is the whole game. Mime and Blind invert it because on those
squares the giver *wants* to be read quickly, and the square says so on its
own face.

### Everything else that can be paid

| | |
|---|---|
| wrong shout | **−1** to that unit, **−2** on a Gamble |
| the aim came in | **+1** to the giver, **+2** on a Duel |
| Gamble, nobody got it | **−1** to the giver — the only square you can go backwards on |
| Blind, solved | every non-giver unit **+1** (*helped*) |
| Two words, one found | giver **+1** (*half of it*) |
| Two words, both found | giver **+1** on top of the band (*both of them*) |
| Double card | that unit's positive total for the round, **×2** |

Two guards, both deliberate:

- A unit that both gave the clue and got the word is **paid once, the better of
  the two** — never both. That is how a pair whose partner gets it is handled,
  and Two words follows the same rule.
- Scores never go below zero: `u.score = max(0, u.score + pts)`.

### Two words, specifically

`W`. The giver holds two words and gets one sentence for both. Each word is
worth a point less. The round runs until both are found or the clock stops, and
**whoever says one takes it**.

The giver is paid once, on the timing of the *second* word — the one they were
really holding out for. Their band is read off `wordValue(second) + 1`, not off
the discounted value: the discount exists because two payments go out to the
table, and taking it off the giver as well charged them twice for the same
thing.

### Blind, specifically

`B`. Everything turns around. The giver becomes the guesser, everybody else
sees the word and picks it, and each of them says one word in turn until the
giver cracks it. The giver takes the (inverted) band; everybody else takes +1
for helping. Nobody is locked out and nothing is lost.

---

## 5. The squares

`EN_MODS` / `HE_MODS` in `game/engine.js`. Ten of them.

| key | name | short | what it does |
|---|---|---|---|
| `S` | Standard | — | the normal clock. One sentence, said once |
| `F` | Fast | FAST | the short clock. Everything else the same |
| `O` | One word | ONE | the clue must be a single word. Not two |
| `M` | Mime | MIME | no speaking at all — **and the clock flips** |
| `B` | Blind | BLIND | the giver guesses, everybody else sees the word |
| `G` | Gamble | BET | hard words, short clock, **+2** value, **−2** a wrong shout, **−1** to the giver if nobody gets it |
| `T` | Partners | PAIR | the game draws the giver a partner, publicly. Anyone may still answer; the partner getting it pays one more |
| `U` | Duel | DUEL | the giver names one person out loud. Only they may answer. One shout, right or wrong, ends the round |
| `W` | Two words | TWO | two words, one sentence, each worth a point less |
| `L` | The link | LINK | no sentence. The giver puts up three of six words that belong to a thing; everybody guesses at once, out loud, as often as they like |

Nearly a third of Gambles die. It is the only square where a round can leave
the giver worse off than they started.

## 6. The wildcard square

`WILD_ODDS` in `game/engine.js`. Rolled the moment you land, applied on the
spot, out of 100:

| | weight | what happens |
|---|---|---|
| **card** | 35 | a random card, straight into your hand |
| **leap** | 20 | up two rows, same column (capped at the last row) |
| **slip** | 15 | down one row, same column (floor of row 1) |
| **steal** | 10 | take 1 point off the leader, add 1 to yourself |
| **swap** | 10 | trade places with a random unit that is genuinely out on the board — never one still on the start line |
| **jackpot** | 10 | +2 points |

## 7. Cards

`EN_CARDS` / `HE_CARDS`. Seven. A card square offers **three** at random and
you keep **one** (`S.offers`, action `take`). Cards are played from the table
(`playcard`) and each is discarded on use.

| key | name | what it does |
|---|---|---|
| `stopwatch` | Stopwatch | slam the clock down to 30 seconds, right now |
| `insight` | Insight | all four words the giver was offered go up on every screen |
| `veto` | Veto | the giver must say a brand new sentence, reusing not one word |
| `mime` | Mime | the giver delivers the whole thing again, with no words |
| `double` | Double | whatever *you* score this round, doubled |
| `swap` | Switch | **giver only** — change to a different word. Anyone already locked out stays locked out |
| `blindfold` | Blindfold | the **next** round turns Blind |

Which cards a unit holds is private. The screen on the wall is told **how
many**, never which.

## 8. Game modes

`MODES` in `game/engine.js`. Chosen in the lobby.

| mode | clock (normal/fast) | rows | reweigh | how you win |
|---|---|---|---|---|
| **quick** | 60 / 30 | −3 | 0.35 | first past the finish |
| **regular** | 90 / 45 | 0 | **0** | first past the finish |
| **slow** | 120 / 60 | 0 | 0.35 | first past the finish |
| **challenge** | 75 / 35 | 0 | 0.5 | **first to 20 points** |

`reweighChance` is how often a square is redrawn away from the map's own
pattern, using that mode's `modWeights`. **`regular` is deliberately inert on
every one of these knobs** — a game played as `regular` must come out identical
to the game this engine played before modes existed at all. That is the safety
net, and `game/engine.test.js` is what holds it.

Quick and Slow both weight `M`, `B` to zero: a short evening should never ask
anyone to mime or play blind. Challenge weights them to 3.

## 9. The five maps, laid two ways

`MAPS` in `game/engine.js`. Same 4-column shape, six-row repeating pattern per
column, its own card and wildcard rules, its own row nudge, and a `themeId` the
client repaints with. Every one of them can be laid as lanes or as
**Crossroads** — see [Road boards](#road-boards).

### What each board plays

Ten kinds of round is the whole game, but a board that deals all ten has no
taste of its own — five boards playing the same ten in a different order is one
board shuffled five ways. Three of them carry a **repertoire** instead: the
plain square plus five of the nine variants, which is what the line under the
name in the lobby is describing.

| map | rows | card square | wildcard | kinds | its character |
|---|---|---|---|---|---|
| **classic** | 0 | col 1, every 3 | col 3, every 5 | **all ten** | the board that teaches you the game — an even mix of everything |
| **twist** | 0 | col 2, every 4 | col 3, every 5 | Partners, Two words, One word, The link, Blind | the words and how you may say them. Nothing about the clock or about nerve |
| **storm** | +1 | col 1, every 4 | col 2, every 4 | Duel, The link, Gamble, Mime, Blind | the hard five and nothing else. Its quiet lane is quiet because it is nearly empty, not because it is gentle |
| **sprint** | −3 | col 0, every 3 | col 3, every 4 | Fast, Partners, One word, Duel, Gamble | the gentle five, with Gamble alone on the right so a short board still has something to lose. Keeps its promise: never Mime, never Blind |
| **chaos** | 0 | col 3, every 3 | col 1, every 4 | **all ten** | named for playing everything, and the one board where the quiet lane is not quiet |

On every board, at least one of the two treasures — the card square or the
wildcard — sits on the awkward side. That is the only thing pulling anybody
across the board: a lane costs nothing to stay in, since two moves in three can
reach any of them, so a player who is never tempted out of the quiet lane never
leaves it. Chaos does it with cards, which it deals in column 3 every third
row; the rest do it with the wildcard.

Laid as Crossroads, any of them has half its squares and a junction every fifth
row. A board with a repertoire **keeps it** — storm as roads is still the five
hard rounds. The two that play all ten have no taste to keep, so those draw
five of the nine fresh for the night (`kindsOf()`, `drawRepertoire()`).

The host can reroll the map from the lobby (`reroll_map`).

## 10. The content banks

Both languages, always. See [content.md](content.md).

| | English | Hebrew |
|---|---|---|
| tier 2 words | 40 | 40 |
| tier 3 | 40 | 40 |
| tier 4 | 45 | 45 |
| tier 5 | 43 | 43 |
| topics | 12 | 12 |
| links | 45 | 45 |
| cards | 7 | 7 |
| interface strings | 184 | 184 |
