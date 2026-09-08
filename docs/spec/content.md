# The content

All of it lives in `game/engine.js`, in paired `EN_*` / `HE_*` blocks. There is
no content file, no JSON, no translation service and no build step: the words
are written where the rules that price them are written.

---

## The one rule

**Every key answers in both languages.** `game/copy.test.js` fails on a key
that answers in only one — it walks every string either page asks for and
checks that Hebrew and English both have it. That is what makes bilingual
structural rather than a habit.

At **0.4.0**, both languages carry exactly the same counts:

| | count |
|---|---|
| words, tier 2 | 40 |
| words, tier 3 | 40 |
| words, tier 4 | 45 |
| words, tier 5 | 43 |
| topics | 12 |
| links | 45 |
| cards | 7 |
| squares (mods) | 10 |
| interface strings | 184 |

## The words

`EN_WORDS` / `HE_WORDS`, four banks keyed by tier — 2 up to 5, hardest last.

The tier is a difficulty, **not a price**. `POINTS = {2:1, 3:2, 4:3, 5:4}` is
the price, and it sits a notch below the tiers because a solved round pays
twice and both payments are steps on a board of sixteen rows.

| tier | what belongs there | English | Hebrew |
|---|---|---|---|
| **2** | a thing you can point at | *spoon, penguin, wheelbarrow* | *כפית, פינגווין, מריצה* |
| **3** | a feeling or a small social fact | *jealous, apology, curfew* | *מקנא, התנצלות, שעת עוצר* |
| **4** | a modern idea with a shape | *plot twist, doomscrolling, a read receipt* | *תפנית בעלילה, גלילה אינסופית, אישור קריאה* |
| **5** | an idiom, or something you have to circle | *silver lining, imposter syndrome, left on read* | *ברכה במסווה, תסמונת המתחזה, נקרא ולא נענה* |

The Hebrew is **not a translation of the English**. It is the same tier written
for the same table in the other language — the idioms are Hebrew idioms, and
the tier-4 bank reaches for what an Israeli family actually says. A row that
translates cleanly is a coincidence, not the design.

Words already used in a game are avoided until the bank runs dry (`S.used`).

## The topics

`EN_TOPICS` / `HE_TOPICS`. Twelve: `home`, `feel`, `move`, `folk`, `now`,
`says`, `face`, `telly`, `sport`, `music`, `world`, `lands`.

A topic is a list of words already in the banks, plus an optional `own` block
of words that only appear under that topic. Choosing a topic tells the whole
table what it is, which is why it takes a point off every word.

## The links

`EN_LINKS` / `HE_LINKS`. Forty-five. Each is a **thing** and six words that
belong to it; the giver puts three of them up and the table shouts guesses at
what connects them. There is no tier, so a link carries one flat
`LINK_VALUE = 3` — the dearest single ask in the game.

Writing one: the six words have to *circle* the thing without pointing at it,
and no three of them may name it outright. That is the whole craft of it.

## The cards and the squares

Seven cards and ten squares, each with a name (`n`), a short board label (`s`),
and a description (`d`). Listed in [rules.md](rules.md).

Descriptions may carry `&mdash;`, `&rsquo;`, `<em>` and `<strong>` — they are
rendered as HTML on the phone. **Changelog lines may not**; the sheet escapes
those, so a `&mdash;` there prints literally. Use a real em dash in
`game/changelog.js`.

## The interface strings

`EN_UI` / `HE_UI`, 184 keys, read through `t(key, a, b)` with `{0}` and `{1}`
substitution. They are sent to the phones **once per language** (`uiPack()` in
`game/play.js`, cached) rather than re-translated anywhere, so there is exactly
one place a sentence is written.

## The voice

Warm, plain and specific. Written for somebody sitting at the table, not for
somebody reading the diff.

- One sentence. Say the thing.
- Name the consequence, not the mechanism. *"you take the most"*, not *"a
  multiplier is applied"*.
- The Hebrew is written, not translated. If a line only works in one language,
  write a different line in the other.
- Comments in this codebase explain **why** a thing is the way it is, not what
  the next line does. Many of the comments in `engine.js` are the record of a
  playtest sweep that moved a number — keep that habit; it is the only place
  those decisions are written down.

## No images, anywhere

- Faces and the token are hand-written SVG in `public/art.js` — 40×40 flat
  shapes on a disc.
- Sounds are synthesised in `public/sfx.js` — no audio files.
- The board is drawn in `public/boardart.js`, once, for both the phone and the
  screen.
- The printed sheets and the poster lift the real palette and the real art out
  of `public/`, so a poster cannot quietly disagree with the game it is a
  poster for.

Graphics have to earn their place. Nothing gets an icon *and* a label on a
dense surface; the board stays text-only.
