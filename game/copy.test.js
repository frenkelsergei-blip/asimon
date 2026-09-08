/* The copy. Two things have gone wrong here before and are cheap to guard:
   a key a page asks for that exists in only one language (it prints as the
   raw key), and a string carrying an HTML entity that reaches the screen
   through textContent (it prints as "&mdash;").

   Two pages ask now — the phone and the screen in the room — and each carries
   its own dictionary, so each is checked against its own.
   node game/copy.test.js                                                    */
"use strict";
const fs = require("fs");
const path = require("path");

const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };

const read = f => fs.readFileSync(path.join(__dirname, "..", "public", f), "utf8");

/* ---- the engine's strings, which the server pushes down and which win ---- */
const engine = require("./engine").createEngine();
const packHas = (lg, k) => { engine.applyLang(lg); return engine.t(k) !== k; };

/* Keys built at runtime — t("hw_s"+i) and the like — cannot be read off the
   source, so each family is spelled out beside the page that builds it. */
const PAGES = [
  { file:"app.js", built: (function(){
      const b = [];
      [1,2,3,4].forEach(i => b.push("hw_s"+i, "hw_s"+i+"d"));
      [1,2,3].forEach(i => b.push("hw_b"+i, "hw_b"+i+"d", "hw_p"+i, "hw_p"+i+"d"));
      /* the lanes are named off the board now, not out of the copy pack */
      /* the changelog labels each line by kind: t("cl_" + l.kind) */
      ["new","rules","change","fix"].forEach(k => b.push("cl_"+k));
      [1,2,3].forEach(i => b.push("quit_"+i));
      ["dot","card","end"].forEach(k => b.push("lg_"+k, "lg_"+k+"_d"));
      ["topic","open","cold"].forEach(k => b.push("ch_"+k, "ch_"+k+"_d", "cw_"+k));
      ["early","mid","late","none"].forEach(k => b.push("band_"+k));
      ["early","mid","late"].forEach(k => b.push("band_m_"+k));
      return b;
    })() },
  { file:"board.js", built: (function(){
      const b = [];
      ["classic","twist","storm","sprint","chaos"].forEach(k => b.push("sc_map_"+k));
      ["quick","regular","slow","challenge"].forEach(k => b.push("sc_gm_"+k));
      ["solo","pairs","groups"].forEach(k => b.push("sc_seat_"+k));
      /* the six wildcard outcomes, each with the line under it */
      ["card","leap","slip","steal","swap","jack"].forEach(k => b.push("sc_w_"+k, "sc_w_"+k+"_d"));
      b.push("sc_w_steal_none", "sc_w_swap_none");
      return b;
    })() }
];

const missing = [];
PAGES.forEach(page => {
  const src = read(page.file);
  const start = src.indexOf("const L = {");
  ok(start >= 0, page.file + " has no dictionary of its own");
  if(start < 0) return;
  const L = eval("(" + src.slice(start + "const L = ".length, src.indexOf("\n};", start) + 2) + ")");
  const resolves = (lg, k) => L[lg][k] !== undefined || packHas(lg, k);

  /* the closing paren or comma matters: t("hw_s"+i) is a prefix, not a key */
  const named = new Set([...src.matchAll(/\bt\("([a-z0-9_]+)"\s*[,)]/g)].map(m => m[1]));
  page.built.forEach(k => named.add(k));
  page.asked = named.size;
  [...named].sort().forEach(k => ["he","en"].forEach(lg => {
    if(!resolves(lg, k)) missing.push(page.file + " " + lg + "." + k);
  }));

  /* ---- entities only survive innerHTML ---- */
  [...src.matchAll(/\.textContent\s*=\s*([^;\n]+)/g)].map(m => m[1].trim()).forEach(expr => {
    ok(!/\bt\(/.test(expr),
       page.file + ": a translated string is assigned through textContent, so any entity in it "+
       "will print literally: " + expr);
  });
});
ok(missing.length === 0, "keys a page asks for but cannot answer in one language:\n  " + missing.join("\n  "));

console.log(bad.length ? "FAIL ("+bad.length+"):\n"+bad.join("\n")
  : "copy ok — " + PAGES.map(p => p.asked + " keys on " + p.file).join(", ") +
    ", all answering in both languages, no entity out through textContent");
process.exit(bad.length ? 1 : 0);
