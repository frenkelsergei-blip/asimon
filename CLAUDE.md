# Working on Asimon

**Read [`docs/spec/`](docs/spec/) before changing anything.** `docs/spec/rules.md`
is every rule and every number; `docs/spec/features.md` is the complete list of
what exists; `docs/spec/architecture.md` says who may see what. When you add a
feature, update those in the same commit — `features.md` especially, which is
meant to be exhaustive.

No dependencies, anywhere. Node's standard library on the server, hand-written
JavaScript, CSS and SVG on the phone. If something needs a package, it needs a
different design.

`game/engine.js` is written by hand and must stay that way — `game/build-engine.js`
records how it was first lifted out of the pass-and-play build and no longer
runs. Regenerating it deletes the game modes, the five boards, the wildcard
square and the board's balance.

## Every commit sets the version

The version is not a thing to remember at release time. It moves with the
commit, or it does not move at all — which is how it sat on `0.3.0` through
twenty-one commits and three new kinds of round.

### Which digit

You do not pick one. You tag the line, and the number follows — `npm run
release` reads the tags in the top entry and writes the version in. So the only
judgement left is the one that was always the real question, and it is never
about the diff:

> **Does somebody who already knows Asimon have to be told?**

| the answer | tag the line | and the number |
|---|---|---|
| No — nobody at the table could tell | *write no line* | **nothing moves** |
| Yes, as *"that's new"* | `new` | **minor** `0.4.0 → 0.5.0` |
| Yes, as *"that's not how it worked"* | `rules` | **minor** |
| Yes, but only as *"that's better now"* | `change` or `fix` | **patch** `0.4.0 → 0.4.1` |
| Yes, and they have to relearn the game | + `bump:"major"` on the entry | **major** |

`new` and `rules` are the two that cost a minor. `bump` may raise what the tags
earn — that is how 1.0 happens — and can never lower it: a `new` line cannot
ship as a patch because somebody would rather it did.

Notice the first row. The trigger is what a player sees, not which files moved
— a refactor inside `public/` that leaves the screen identical gets no entry
and no bump. Nothing is lost by that: `currentBuild()` hashes the files
themselves, so phones still know new bytes are being served. The version answers
the other question, the one a hash cannot: *what am I missing?*

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

Two things that follow, and neither needs doing by hand:

- **The entry takes the highest bump any line in it earns.** One `new` line
  among four fixes makes the whole release a minor.
- **Several commits before a deploy share one entry.** Keep adding lines to the
  top entry while that version is unreleased. If a `rules` line lands in what
  was a patch, the next `npm run release` raises the number itself and says so.

**1.0** is not a size, it is an event: the first time strangers play it without
you in the room. After that, a major means a room code, a saved game or a
printed sheet from the version before it stops working.

No `-beta` or `-rc` suffixes. `currentBuild()` already says which exact bytes a
phone is on, and a second answer to a question that has one would only be a
second thing to keep true.

### The steps

1. Open [`game/changelog.js`](game/changelog.js). It is the source of the
   version number, not a record of it.
2. Add your line to the top entry if that version has not shipped yet, or start
   a new entry above it. **A new entry needs no `v` and no `date`** — leave them
   out and they get filled in:

   ```js
   { lines:[
     { kind:"rules",
       en:"A Gamble nobody gets now costs the giver two, not one.",
       he:"הימור שאף אחד לא קולט עולה לנותן שתיים, לא אחת." }
   ]},
   ```

3. Write every line in **both** `en` and `he`, for somebody sitting at the table
   rather than somebody reading the diff. One sentence. No HTML and no entities
   — the sheet escapes these, so a `&mdash;` prints as `&mdash;`. Use a real em
   dash.
4. Run `npm run release`. It works the number out from the tags, writes it and
   today's date into the top entry, sets `package.json`, and regenerates
   `CHANGELOG.md`. It says what it chose:

   ```
   release 0.5.0
     game/changelog.js  0.4.1 -> 0.5.0   (its lines earn a minor)
     package.json 0.4.1 -> 0.5.0
     CHANGELOG.md
   ```

   `package.json` and `CHANGELOG.md` are never edited by hand. Neither is the
   top entry's `v`, unless you are deliberately declaring a `bump`.
5. Run `npm test`. `game/changelog.test.js` fails if any release carries a
   number its own lines do not earn, or if `package.json` or `CHANGELOG.md` has
   drifted from `game/changelog.js`. `game/version.test.js` fails if the server
   is serving a version the changelog does not name.

`node game/release.js --next` prints what the top entry currently earns, without
writing anything, if you want to look before you run it.

The phone reads the same list from `/api/changelog`, in whichever language it
is showing, under **What's new** at the foot of the first screen — beside the
version and the update check, which is the one place somebody is already asking
which build they are on.

The build hash is separate and takes care of itself: `currentBuild()` in
`server.js` hashes the version together with every file a page loads, so a
phone knows it is stale whether or not the version moved. The version is what
tells the person holding it *what they are missing*.

## Before committing

```bash
npm test
```

Twelve suites and no network. `npm run playtest` runs the bot sweep and writes
a report when a rules change needs to be looked at over many games.

## Voice

The copy is warm, plain and specific, and it is always both Hebrew and English
— `game/copy.test.js` fails on a key that answers in only one. Comments in this
codebase explain why a thing is the way it is, not what the next line does.
