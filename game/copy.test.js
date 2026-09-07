/* The copy. Two things have gone wrong here before and are cheap to guard:
   a key the phone asks for that exists in only one language (it prints as the
   raw key), and a string carrying an HTML entity that reaches the screen
   through textContent (it prints as "&mdash;").
   node game/copy.test.js                                                    */
"use strict";
const fs = require("fs");
const path = require("path");

const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };

const APP = fs.readFileSync(path.join(__dirname, "..", "public", "app.js"), "utf8");

/* ---- the phone's own strings ---- */
const start = APP.indexOf("const L = {");
const L = eval("(" + APP.slice(start + "const L = ".length, APP.indexOf("\n};", start) + 2) + ")");

/* ---- the engine's strings, which the server pushes down and which win ---- */
const engine = require("./engine").createEngine();
const packHas = (lg, k) => { engine.applyLang(lg); return engine.t(k) !== k; };
const resolves = (lg, k) => L[lg][k] !== undefined || packHas(lg, k);

/* Keys the phone asks for by name. Keys built at runtime — t("hw_s"+i) and the
   like — cannot be read off the source, so each family is spelled out. */
/* the closing paren or comma matters: t("hw_s"+i) is a prefix, not a key */
const named = new Set([...APP.matchAll(/\bt\("([a-z0-9_]+)"\s*[,)]/g)].map(m => m[1]));
const built = [];
[1,2,3,4].forEach(i => built.push("hw_s"+i, "hw_s"+i+"d"));
[1,2,3].forEach(i => built.push("hw_b"+i, "hw_b"+i+"d", "hw_p"+i, "hw_p"+i+"d"));
[0,1,2,3].forEach(i => built.push("lg_lane_"+i));
[1,2,3].forEach(i => built.push("quit_"+i));
["dot","card","end"].forEach(k => built.push("lg_"+k, "lg_"+k+"_d"));
["topic","open","cold"].forEach(k => built.push("ch_"+k, "ch_"+k+"_d", "cw_"+k));
["early","mid","late","none"].forEach(k => built.push("band_"+k));
["early","mid","late"].forEach(k => built.push("band_m_"+k));
built.forEach(k => named.add(k));

const missing = [];
[...named].sort().forEach(k => ["he","en"].forEach(lg => {
  if(!resolves(lg, k)) missing.push(lg + "." + k);
}));
ok(missing.length === 0, "keys the phone asks for but cannot answer in one language:\n  " + missing.join("\n  "));

/* ---- entities only survive innerHTML ---- */
const viaText = [...APP.matchAll(/\.textContent\s*=\s*([^;\n]+)/g)].map(m => m[1].trim());
viaText.forEach(expr => {
  ok(!/\bt\(/.test(expr),
     "a translated string is assigned through textContent, so any entity in it "+
     "will print literally: " + expr);
});

console.log(bad.length ? "FAIL ("+bad.length+"):\n"+bad.join("\n")
  : "copy ok — "+named.size+" keys answer in both languages, no entity goes out through textContent");
process.exit(bad.length ? 1 : 0);
