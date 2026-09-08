# Conventions

How to add something here without breaking the parts nobody is looking at.
`CLAUDE.md` at the root is the short version and is the one that is loaded into
every session; this is the same rules with the reasoning left in.

---

## 1. No dependencies, anywhere

Node's standard library on the server. Hand-written JavaScript, CSS and SVG on
the phone. No build step, no bundler, no test framework, no CSS framework, no
icon set, no audio files, no images.

**If something needs a package, it needs a different design.** That is not a
purity exercise — it is what makes `node server.js` the whole of the setup, and
what keeps a phone loading the game over a flaky hotel Wi-Fi.

## 2. `game/engine.js` is written by hand

`game/build-engine.js` records how the engine was first lifted out of the old
pass-and-play build. **It no longer runs and refuses to.** The game modes, the
five maps, the wildcard square and the board's whole balance were written into
the engine by hand and exist in no `buzz.html`. Regenerating would delete about
a third of the game.

Edit `game/engine.js` directly. `npm test` is the net; `npm run playtest` says
what the change did to the game.

## 3. Every commit sets the version

The version is not a thing to remember at release time. It moves with the
commit, or it does not move at all.

### Which digit

You do not pick one. You tag the line, and the number follows — `npm run
release` reads the tags in the top entry and writes the version in. The only
judgement left is never about the diff:

> **Does somebody who already knows Asimon have to be told?**

| the answer | tag the line | and the number |
|---|---|---|
| No — nobody at the table could tell | *write no line* | **nothing moves** |
| Yes, as *"that's new"* | `new` | **minor** `0.4.0 → 0.5.0` |
| Yes, as *"that's not how it worked"* | `rules` | **minor** |
| Yes, but only as *"that's better now"* | `change` or `fix` | **patch** `0.4.0 → 0.4.1` |
| Yes, and they have to relearn the game | + `bump:"major"` | **major** |

`new` and `rules` are the two that cost a minor. `bump` may raise what the tags
earn — that is how 1.0 happens — and can never lower it.

The trigger is **what a player sees**, not which files moved. A refactor inside
`public/` that leaves the screen identical gets no entry and no bump. Nothing is
lost by that: `currentBuild()` hashes the files themselves, so phones still know
new bytes are being served. The version answers the other question, the one a
hash cannot: *what am I missing?*

From this repository's own history:

| | | |
|---|---|---|
| Duel, Two words and The link | `new` | three kinds of round that did not exist |
| Gamble squares | `new` | a new square, and a way to lose points |
| The screen in the room | `new` | a surface that was not there |
| The board deals all seven round kinds instead of mostly one | `rules` | same parts, different game |
| A tablet laid out for a tablet | `change` | the same game, bigger |
| Partners worded the way it is actually played | `change` | it always played that way |
| The move screen opening on the moves | `fix` | it was awkward, now it is not |
| The rack asked for instead of edited into the page | *no line* | nobody at the table can tell |

Two things follow, neither needing doing by hand:

- **An entry takes the highest bump any line in it earns.** One `new` line
  among four fixes makes the whole release a minor.
- **Several commits before a deploy share one entry.** Keep adding lines to the
  top entry while that version is unreleased.

**1.0** is not a size, it is an event: the first time strangers play it without
you in the room. After that a major means a room code, a saved game or a printed
sheet from the version before it stops working.

No `-beta` or `-rc` suffixes. `currentBuild()` already says which exact bytes a
phone is on, and a second answer to a question that has one would only be a
second thing to keep true.

### The steps

1. Open `game/changelog.js`. It is the **source** of the version number, not a
   record of it.
2. Add your line to the top entry if that version has not shipped, or start a
   new entry above it. **A new entry needs no `v` and no `date`** — leave them
   out and they get filled in.

   ```js
   { lines:[
     { kind:"rules",
       en:"A Gamble nobody gets now costs the giver two, not one.",
       he:"הימור שאף אחד לא קולט עולה לנותן שתיים, לא אחת." }
   ]},
   ```

3. Write every line in **both** `en` and `he`, for somebody sitting at the
   table rather than somebody reading the diff. One sentence. **No HTML and no
   entities** — the sheet escapes these, so a `&mdash;` prints as `&mdash;`.
   Use a real em dash.
4. `npm run release`. It works the number out from the tags, writes it and
   today's date into the top entry, sets `package.json`, and regenerates
   `CHANGELOG.md`.
5. `npm test`.

`package.json` and `CHANGELOG.md` are **never edited by hand**. Neither is the
top entry's `v`, unless you are deliberately declaring a `bump`.

`node game/release.js --next` prints what the top entry currently earns without
writing anything.

## 4. Adding a feature — the order that works here

1. **Read the spec that covers it** — [rules.md](rules.md) for a rule,
   [protocol.md](protocol.md) for anything a phone sends,
   [architecture.md](architecture.md) for anything about who may see what.
2. **The rule goes in `game/engine.js`**, with a comment saying *why the number
   is that number*. Content goes in the same file, in both languages.
3. **The sequencing goes in `game/play.js`** — a new phase, a new action, and
   its guard. Every action re-checks who is asking.
4. **If it adds a field to a round, decide what the wall may see.**
   `boardView()` is a list of what a screen *may* see, so a new field is
   invisible to the wall until somebody adds it there deliberately. Keep it
   that way round.
5. **Draw it in `public/app.js`**, and on `public/board.js` if the screen
   should show it. Sizes are multiples of `--k`, or read `kpx()`.
6. **Copy in both languages**, in `EN_UI` / `HE_UI`.
7. `npm test`. Then `npm run playtest` if it touched a rule, and read the
   verdict rather than the exit code.
8. **A line in `game/changelog.js`**, then `npm run release`.
9. **Update the spec here in the same commit** — most of all
   [features.md](features.md), which is meant to be the complete list.

## 5. Voice

The copy is warm, plain and specific, and it is always both Hebrew and English —
`game/copy.test.js` fails on a key that answers in only one.

**Comments explain why a thing is the way it is, not what the next line does.**
Many of the comments in `engine.js` are the record of a playtest sweep that
moved a number, and they are the only place those decisions are written down.
Keep that habit: a number without its reason is a number the next session will
"clean up".

## 6. Design work

Canvases under `design/` lift the real faces, the real board, the real palette
and the real art out of `public/`, rather than retyping them, so a poster or a
rulebook cannot quietly disagree with the game it is about. Built with
`node design/<thing>/build.js`; `--print d` also writes print-ready HTML.

A poster is not the manual: one headline, one picture, the one rule that makes
this game different, one address. The sheet beside it is the one that explains.

Graphics have to earn their place — no icon *and* label on a dense surface, and
the board stays text-only.

## 7. Before committing

```bash
npm test
```

And check the weight of what you added: before making a control louder, look at
whether the server already does it automatically. Nothing non-interactive wears
a button shape.
