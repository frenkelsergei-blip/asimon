/* The changelog, and the two things that go stale around it.

   One: the version in package.json drifting away from the top of the
   changelog — which is how a release ships under the number of the one before
   it, and how nothing in the game can be trusted to say what it is.

   Two: CHANGELOG.md at the root no longer being what game/changelog.js would
   write — which happens the moment somebody edits the generated file, or adds
   an entry and forgets `npm run release`.

   And the number itself, which is nobody's judgement call: a release carrying
   a `new` or a `rules` line is a minor and the rest are patches, so every
   entry here is checked against what its own lines earn.

   Both fail here rather than in a room full of people.
   node game/changelog.test.js                                               */
"use strict";
const fs = require("fs");
const path = require("path");

const cl  = require("./changelog");
const pkg = require("../package.json");
const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const parse  = v => SEMVER.exec(v).slice(1).map(Number);
const cmp    = (a, b) => { const x = parse(a), y = parse(b);
  return (x[0]-y[0]) || (x[1]-y[1]) || (x[2]-y[2]); };

ok(Array.isArray(cl.RELEASES) && cl.RELEASES.length > 0, "the changelog is empty");

const seen = new Set();
let prev = null;
cl.RELEASES.forEach((r, i) => {
  const at = "release " + (r && r.v ? r.v : "#" + i);

  ok(SEMVER.test(String(r.v)), at + ": not a version number");
  ok(!seen.has(r.v), at + ": listed twice");
  seen.add(r.v);
  /* newest first, and strictly — two entries at the same number, or one out of
     order, and "which version am I on" stops having an answer */
  if(prev) ok(cmp(prev.v, r.v) > 0, at + ": is not older than " + prev.v + " above it");

  /* the number follows from the lines. A release may declare a bigger bump
     than its lines earn — that is how 1.0 happens — but never a smaller one. */
  if(r.bump !== undefined)
    ok(["major","minor","patch"].indexOf(r.bump) >= 0,
       at + ": bump is " + r.bump + ", not major/minor/patch");
  const earned = (r.lines || []).some(l => cl.MINOR_KINDS.indexOf(l.kind) >= 0) ? "minor" : "patch";
  if(r.bump === "patch")
    ok(earned === "patch", at + ': declares bump "patch" but carries a ' +
       (r.lines || []).map(l => l.kind).filter(k => cl.MINOR_KINDS.indexOf(k) >= 0)[0] +
       " line, which is a minor");
  const must = cl.versionFor(i);
  ok(r.v === must, at + ": its lines earn a " + cl.bumpFor(r) + " over " +
     (cl.RELEASES[i+1] ? cl.RELEASES[i+1].v : "nothing") + ", so it must be " + must +
     " — run `npm run release`");

  ok(/^\d{4}-\d{2}-\d{2}$/.test(String(r.date)), at + ": the date is not yyyy-mm-dd");
  const d = new Date(String(r.date) + "T00:00:00Z");
  ok(!isNaN(d.getTime()), at + ": the date is not a date");
  ok(d.getTime() <= Date.now() + 86400000, at + ": is dated in the future");
  if(prev) ok(String(prev.date) >= String(r.date), at + ": is dated after " + prev.v + " above it");

  ok(Array.isArray(r.lines) && r.lines.length > 0, at + ": has no lines — a version nobody can be told about");
  (r.lines || []).forEach((l, j) => {
    const where = at + " line " + (j + 1);
    ok(cl.KINDS.indexOf(l.kind) >= 0, where + ": kind is " + l.kind + ", not one of " + cl.KINDS.join("/"));
    ["en","he"].forEach(lg => {
      const s = l[lg];
      ok(typeof s === "string" && s.trim().length > 0, where + ": no " + lg);
      if(typeof s !== "string") return;
      /* the sheet escapes these lines, so an entity or a tag would be printed
         at the table exactly as written — unlike the engine's copy, which is
         put on the page as HTML */
      ok(!/&[a-z]+;|&#\d+;/i.test(s), where + " (" + lg + "): carries an HTML entity, which will print raw");
      ok(!/<[a-z/]/i.test(s), where + " (" + lg + "): carries a tag, which will print raw");
      ok(s.length <= 260, where + " (" + lg + "): " + s.length + " characters — too long to read in the sheet");
    });
  });
  prev = r;
});

/* ---- the two that drift ---- */
ok(pkg.version === cl.latest().v,
   "package.json says " + pkg.version + " and the changelog says " + cl.latest().v +
   " — run `npm run release`");

const MD = path.join(__dirname, "..", "CHANGELOG.md");
const onDisk = fs.existsSync(MD) ? fs.readFileSync(MD, "utf8") : null;
ok(onDisk !== null, "there is no CHANGELOG.md — run `npm run release`");
ok(onDisk === cl.markdown(),
   "CHANGELOG.md is not what game/changelog.js would write — run `npm run release` " +
   "(and edit game/changelog.js, never CHANGELOG.md)");

/* ---- what the phone is actually handed ---- */
["he","en"].forEach(lg => {
  const out = cl.forLang(lg, 2);
  ok(out.length === Math.min(2, cl.RELEASES.length), lg + ": forLang did not honour the limit");
  out.forEach(r => r.lines.forEach(l =>
    ok(typeof l.text === "string" && l.text.length > 0, lg + ": a line came back without text")));
  /* new, then changed, then fixed — a release always reads the same way round */
  out.forEach(r => {
    const order = r.lines.map(l => cl.KINDS.indexOf(l.kind));
    ok(order.every((k, i) => i === 0 || k >= order[i-1]), lg + ": " + r.v + " is not sorted new/changed/fixed");
  });
});
ok(cl.forLang("he", 1)[0].lines[0].text === cl.RELEASES[0].lines
     .slice().sort((a,b) => cl.KINDS.indexOf(a.kind) - cl.KINDS.indexOf(b.kind))[0].he,
   "forLang('he') did not hand back the Hebrew");
/* anything that is not Hebrew is served English, rather than served nothing */
ok(cl.forLang("fr", 1)[0].lines.every(l => l.text), "an unknown language got no text at all");

console.log(bad.length ? "FAIL (" + bad.length + "):\n" + [...new Set(bad)].join("\n")
  : "changelog ok — " + cl.RELEASES.length + " releases, every number the one its own " +
    "lines earn, newest " + cl.latest().v + ", package.json and CHANGELOG.md agree with it");
process.exit(bad.length ? 1 : 0);
