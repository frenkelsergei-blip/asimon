/* The banks themselves.

   The words are the game, and everything that can quietly go wrong with them
   goes wrong silently: a word written into two tiers is priced at whichever
   tier `applyLang` walked last, a topic word misspelt against the bank is
   dropped from that topic's deal without a word, a topic with nothing at a
   tier hands the giver three words on a round priced for four, and a topic
   with no emblem shows an empty tile on the phone. None of those throw.

   The bilingual rule is checked here as counts rather than keys — copy.test.js
   guards the interface strings; this guards the content the round deals.

   node game/content.test.js                                                 */
"use strict";
const fs = require("fs");
const path = require("path");

const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };

const engine = require("./engine").createEngine();
/* applyLang() reads the room's own language off S rather than taking one, so a
   pack is asked for the way play.js asks for it: seat the language, then look. */
const packOf = lg => { engine.S = engine.freshState(); engine.S.lang = lg; engine.applyLang(); return engine.packs(); };
const LANGS = ["en", "he"];
const TIERS = [2, 3, 4, 5];

/* ---- 1. a word lives at exactly one tier ---- */
LANGS.forEach(lg => {
  const W = packOf(lg).W, seen = {};
  TIERS.forEach(v => W[v].forEach(w => {
    if(seen[w]) bad.push(lg + ": " + JSON.stringify(w) + " is in tier " + seen[w] + " and tier " + v +
                         ", so it is worth whichever the deal happened to draw");
    seen[w] = v;
  }));
});

/* ---- 2. both languages carry the same counts ---- */
{
  const en = packOf("en"), he = packOf("he");
  TIERS.forEach(v => ok(en.W[v].length === he.W[v].length,
    "tier " + v + " is " + en.W[v].length + " words in English and " + he.W[v].length + " in Hebrew"));
  ok(Object.keys(en.TOPICS).length === Object.keys(he.TOPICS).length, "the two languages carry a different number of topics");
  ok(Object.keys(en.LINKS).length === Object.keys(he.LINKS).length, "the two languages carry a different number of links");
}

/* ---- 3. every topic answers at all four tiers, out of the real bank ---- */
LANGS.forEach(lg => {
  const p = packOf(lg);
  Object.keys(p.TOPICS).forEach(k => {
    const T = p.TOPICS[k], count = {2:0, 3:0, 4:0, 5:0};
    ok(!!T.n, lg + ": topic " + k + " has no name");
    (T.w || []).forEach(w => {
      if(!p.TIER[w]) bad.push(lg + ": topic " + k + " lists " + JSON.stringify(w) +
                              ", which is in no bank — the topic deals without it");
      else count[p.TIER[w]]++;
    });
    if(T.w) ok(T.w.length === new Set(T.w).size, lg + ": topic " + k + " lists the same word twice");
    if(T.own) TIERS.forEach(v => (T.own[v] || []).forEach(() => count[v]++));
    const thin = TIERS.filter(v => count[v] === 0);
    ok(thin.length === 0, lg + ": topic " + k + " has nothing at tier " + thin.join(", ") +
       ", so it deals a short hand");
  });
});

/* ---- 4. every topic has a drawing, and the drawing is the phone's own ---- */
{
  const src = fs.readFileSync(path.join(__dirname, "..", "public", "art.js"), "utf8");
  const i = src.indexOf("const TOPIC_ART");
  ok(i >= 0, "public/art.js has no TOPIC_ART");
  if(i >= 0){
    const ART = eval("(" + src.slice(src.indexOf("{", i), src.indexOf("\n};", i) + 2) + ")");
    LANGS.forEach(lg => Object.keys(packOf(lg).TOPICS).forEach(k =>
      ok(!!ART[k] && !!ART[k].art && !!ART[k].bg, "topic " + k + " has no emblem in TOPIC_ART, so its tile draws empty")));
  }
}

/* ---- 5. a link is a thing and exactly six words ---- */
LANGS.forEach(lg => {
  const L = packOf(lg).LINKS;
  Object.keys(L).forEach(k => {
    ok(!!L[k].n, lg + ": link " + k + " has no thing to guess");
    ok((L[k].w || []).length === 6, lg + ": link " + k + " has " + (L[k].w || []).length + " words, not six");
    ok(new Set(L[k].w || []).size === (L[k].w || []).length, lg + ": link " + k + " repeats a word");
  });
});

const en = packOf("en");
console.log(bad.length ? "FAIL ("+bad.length+"):\n"+bad.join("\n")
  : "content ok — " + TIERS.reduce((n,v) => n + en.W[v].length, 0) + " words a language across four tiers, " +
    Object.keys(en.TOPICS).length + " topics that each answer at every tier and each carry an emblem, " +
    Object.keys(en.LINKS).length + " links of six");
process.exit(bad.length ? 1 : 0);
