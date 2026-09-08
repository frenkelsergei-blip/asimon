/* Set the version from the changelog, and write CHANGELOG.md.

   The order is deliberate. You write the lines first — in game/changelog.js,
   with the version they belong to — and this takes the number off the top of
   that file and puts it everywhere else it has to be. Nothing here invents a
   version, so there is no way to bump one without having said what moved.

     node game/release.js            set package.json and CHANGELOG.md from the
                                     top entry of game/changelog.js
     node game/release.js --next patch|minor|major
                                     print the number to put at the top of
                                     game/changelog.js, and stop

   Safe to run twice: it writes only what is out of date, and says so.       */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PKG  = path.join(ROOT, "package.json");
const MD   = path.join(ROOT, "CHANGELOG.md");
const cl   = require("./changelog");

const parse = v => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(v));
  if(!m) throw new Error("not a version: " + v);
  return m.slice(1).map(Number);
};
const cmp = (a, b) => { const x = parse(a), y = parse(b);
  return (x[0]-y[0]) || (x[1]-y[1]) || (x[2]-y[2]); };

const pkgSrc = fs.readFileSync(PKG, "utf8");
const pkg = JSON.parse(pkgSrc);

const CL    = path.join(__dirname, "changelog.js");
const top   = cl.RELEASES[0];
const under = cl.RELEASES[1];

/* --next: the number the lines at the top have already earned, or the one a
   bump you are considering would make */
const nextArg = process.argv.indexOf("--next");
if(nextArg > -1){
  const step = process.argv[nextArg + 1];
  if(step && ["major","minor","patch"].indexOf(step) < 0){
    console.error("usage: node game/release.js --next [patch|minor|major]"); process.exit(1);
  }
  const bump = step || cl.bumpFor(top);
  console.log(cl.applyBump(under ? under.v : top.v, bump) +
              "   (" + bump + (step ? "" : ", from the kinds in the top entry") + ")");
  process.exit(0);
}

/* what the lines at the top say this release has to be called */
const v = under ? cl.applyBump(under.v, cl.bumpFor(top)) : top.v;
parse(v);

if(under && cmp(v, under.v) <= 0){
  console.error("the top entry works out to " + v + ", which is not above the " + under.v +
                " beneath it.\nCheck the order of game/changelog.js.");
  process.exit(1);
}

let wrote = [];

/* Fill the number and the date into the entry at the top. One follows from the
   lines and one from the calendar, so neither is worth anybody remembering —
   and a wrong one is worse than a missing one. This is the only place anything
   writes back into game/changelog.js, and it touches only that entry's header:
   { v:"...", date:"...", lines:[ */
const clSrc   = fs.readFileSync(CL, "utf8");
const listAt  = clSrc.indexOf("const RELEASES = [");
const openAt  = clSrc.indexOf("{", listAt);
const linesAt = clSrc.indexOf("lines:", openAt);
if(listAt < 0 || openAt < 0 || linesAt < 0){
  console.error('the top of game/changelog.js is not shaped as expected — the first\n' +
                'entry should read  { v:"...", date:"...", lines:[');
  process.exit(1);
}
const date = top.date || new Date().toISOString().slice(0, 10);
const head = ' v:"' + v + '", date:"' + date + '", ' +
             (top.bump ? 'bump:"' + top.bump + '", ' : "");
/* the module was loaded before any of this was worked out, so its copy of the
   top entry still carries whatever was written there by hand — or nothing at
   all. CHANGELOG.md is generated from that copy a few lines down, so bring it
   up to what is about to be on disk first, or the markdown ships a version
   behind the file it came from. */
top.v = v; top.date = date;
const nextCl = clSrc.slice(0, openAt + 1) + head + clSrc.slice(linesAt);
if(nextCl !== clSrc){
  fs.writeFileSync(CL, nextCl);
  wrote.push("game/changelog.js  " +
    (top.v && top.v !== v ? top.v + " -> " + v + "   (its lines earn a " + cl.bumpFor(top) + ")"
                          : "set to " + v) +
    (top.date ? "" : ", dated " + date));
}

/* rewrite the one field rather than re-serialising the file, so the hand
   formatting of package.json survives a release */
const nextPkg = pkgSrc.replace(/("version"\s*:\s*)"[^"]*"/, '$1"' + v + '"');
if(nextPkg !== pkgSrc){ fs.writeFileSync(PKG, nextPkg); wrote.push("package.json " + pkg.version + " -> " + v); }

const md = cl.markdown();
const onDisk = fs.existsSync(MD) ? fs.readFileSync(MD, "utf8") : "";
if(md !== onDisk){ fs.writeFileSync(MD, md); wrote.push("CHANGELOG.md"); }

console.log(wrote.length ? "release " + v + "\n  " + wrote.join("\n  ")
                         : "already at " + v + " — nothing to write");
