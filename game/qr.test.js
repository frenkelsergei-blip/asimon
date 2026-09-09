/* The square that saves the typing, read back.

   Nobody in this house owns a QR reader that runs in a test, and a code that
   is wrong is wrong silently — it draws a perfectly convincing pattern of
   squares that no camera resolves. So the test is a reader: it takes the
   matrix public/qr.js draws, finds the format field, lifts the mask, walks the
   data back out of the zigzag, checks every block against its own Reed-Solomon
   syndromes, and asks whether the text that comes out is the text that went
   in. The block tables are written again here from the standard rather than
   borrowed, because a wrong table is exactly the mistake this is for.

   node game/qr.test.js                                                      */
"use strict";
const fs = require("fs");
const path = require("path");

const bad = [];
const ok = (c, m) => { if(!c) bad.push(m); };

const src = fs.readFileSync(path.join(__dirname, "..", "public", "qr.js"), "utf8");
const QR = new Function(src + "\nreturn QR;")();

/* ---- the field again, for the syndromes ---- */
const EXP = new Array(512), LOG = new Array(256);
(function(){ let x = 1;
  for(let i = 0; i < 255; i++){ EXP[i] = x; LOG[x] = i; x <<= 1; if(x & 0x100) x ^= 0x11D; }
  for(let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const mul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];

/* ---- the tables, written from the standard a second time ---- */
const TOTAL = [26,44,70,100,134,172,196,242,292,346];
const EC = {
  L:[[7,[[1,19]]],[10,[[1,34]]],[15,[[1,55]]],[20,[[1,80]]],[26,[[1,108]]],
     [18,[[2,68]]],[20,[[2,78]]],[24,[[2,97]]],[30,[[2,116]]],[18,[[2,68],[2,69]]]],
  M:[[10,[[1,16]]],[16,[[1,28]]],[26,[[1,44]]],[18,[[2,32]]],[24,[[2,43]]],
     [16,[[4,27]]],[18,[[4,31]]],[22,[[2,38],[2,39]]],[22,[[3,36],[2,37]]],[26,[[4,43],[1,44]]]],
  Q:[[13,[[1,13]]],[22,[[1,22]]],[18,[[2,17]]],[26,[[2,24]]],[18,[[2,15],[2,16]]],
     [24,[[4,19]]],[18,[[2,14],[4,15]]],[22,[[4,18],[2,19]]],[20,[[4,16],[4,17]]],[24,[[6,19],[2,20]]]],
  H:[[17,[[1,9]]],[28,[[1,16]]],[22,[[2,13]]],[16,[[4,9]]],[22,[[2,11],[2,12]]],
     [28,[[4,15]]],[26,[[4,13],[1,14]]],[26,[[4,14],[2,15]]],[24,[[4,12],[4,13]]],[28,[[6,15],[2,16]]]]
};
const ALIGN = [[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];
const LEVEL_OF = { 1:"L", 0:"M", 3:"Q", 2:"H" };

/* the tables have to close: every block of every version fills the codewords
   that version has room for */
Object.keys(EC).forEach(lv => EC[lv].forEach((spec, i) => {
  const blocks = spec[1].reduce((n, g) => n + g[0], 0);
  const size = spec[1].reduce((n, g) => n + g[0] * g[1], 0) + blocks * spec[0];
  ok(size === TOTAL[i], "version " + (i+1) + lv + " fills " + size + " of " + TOTAL[i] + " codewords");
}));

const MASKS = [
  (r,c) => (r + c) % 2 === 0,
  (r)   => r % 2 === 0,
  (r,c) => c % 3 === 0,
  (r,c) => (r + c) % 3 === 0,
  (r,c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r,c) => (r * c) % 2 + (r * c) % 3 === 0,
  (r,c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
  (r,c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0
];

/* which modules a camera must not read as data */
function fixedMap(n, ver){
  const f = Array.from({ length:n }, () => new Array(n).fill(false));
  const mark = (r, c) => { if(r >= 0 && c >= 0 && r < n && c < n) f[r][c] = true; };
  [[0,0],[0,n-7],[n-7,0]].forEach(([R,C]) => {
    for(let r = -1; r <= 7; r++) for(let c = -1; c <= 7; c++) mark(R + r, C + c);
  });
  for(let i = 0; i < n; i++){ mark(6, i); mark(i, 6); }
  const pos = ALIGN[ver - 1];
  pos.forEach(r => pos.forEach(c => {
    if((r === 6 && c === 6) || (r === 6 && c === n - 7) || (r === n - 7 && c === 6)) return;
    for(let dr = -2; dr <= 2; dr++) for(let dc = -2; dc <= 2; dc++) mark(r + dr, c + dc);
  }));
  for(let i = 0; i < 9; i++){ mark(8, i); mark(i, 8); }
  for(let i = 0; i < 8; i++){ mark(8, n - 1 - i); mark(n - 1 - i, 8); }
  if(ver >= 7) for(let i = 0; i < 18; i++){
    const r = Math.floor(i / 3), c = i % 3;
    mark(r, n - 11 + c); mark(n - 11 + c, r);
  }
  return f;
}

const bitLen = v => { let n = 0; while(v){ n++; v >>>= 1; } return n; };
function bchOk(field, poly){         /* a checked field divides its polynomial */
  let v = field;
  while(bitLen(v) >= bitLen(poly)) v ^= poly << (bitLen(v) - bitLen(poly));
  return v === 0;
}

function readFormat(m){
  const n = m.length;
  const a = [], b = [];
  for(let i = 0; i <= 5; i++) a[i] = m[8][i];
  a[6] = m[8][7]; a[7] = m[8][8]; a[8] = m[7][8];
  for(let i = 9; i <= 14; i++) a[i] = m[14-i][8];
  for(let i = 0; i <= 6; i++) b[i] = m[n-1-i][8];
  for(let i = 7; i <= 14; i++) b[i] = m[8][n-15+i];
  const num = arr => arr.reduce((v, bit, i) => v | (bit << i), 0);
  return { a:num(a), b:num(b) };
}

function readData(m, ver, level){
  const n = m.length, fixed = fixedMap(n, ver);
  const fmt = readFormat(m);
  ok(fmt.a === fmt.b, "the two format copies disagree");
  ok(bchOk(fmt.a ^ 0x5412, 0x537), "the format field does not check out");
  const field = (fmt.a ^ 0x5412) >> 10;
  const mask = field & 7, lv = LEVEL_OF[(field >> 3) & 3];
  ok(lv === level, "the code says level " + lv + ", not " + level);
  const bits = [];
  let up = true;
  for(let right = n - 1; right > 0; right -= 2){
    if(right === 6) right = 5;
    for(let k = 0; k < n; k++){
      const r = up ? n - 1 - k : k;
      for(const c of [right, right - 1])
        if(!fixed[r][c]) bits.push(m[r][c] ^ (MASKS[mask](r, c) ? 1 : 0));
    }
    up = !up;
  }
  const codes = [];
  for(let i = 0; i + 8 <= bits.length; i += 8){
    let v = 0;
    for(let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    codes.push(v);
  }
  ok(codes.length === TOTAL[ver - 1], "version " + ver + " read " + codes.length +
     " codewords, not " + TOTAL[ver - 1]);
  return { codes, mask };
}

/* the blocks back out of the interleave, each checked against its syndromes */
function blocksOf(codes, ver, level){
  const spec = EC[level][ver - 1], ecLen = spec[0], sizes = [];
  spec[1].forEach(g => { for(let i = 0; i < g[0]; i++) sizes.push(g[1]); });
  const data = sizes.map(() => []), checks = sizes.map(() => []);
  let at = 0;
  for(let i = 0; i < Math.max.apply(null, sizes); i++)
    sizes.forEach((s, b) => { if(i < s) data[b].push(codes[at++]); });
  for(let i = 0; i < ecLen; i++) sizes.forEach((s, b) => checks[b].push(codes[at++]));
  data.forEach((d, b) => {
    const whole = d.concat(checks[b]);
    /* the generator's roots are a^0 through a^(n-1), so a clean block
       evaluates to zero at every one of them */
    for(let s = 0; s < ecLen; s++){
      let acc = 0;
      whole.forEach(byte => { acc = mul(acc, EXP[s]) ^ byte; });
      ok(acc === 0, "block " + b + " fails syndrome " + s);
    }
  });
  return data;
}

function textOf(blocks, ver){
  const bytes = [];
  let bit = 0;
  const all = blocks.reduce((a, b) => a.concat(b), []);   /* one long stream */
  const take = n => { let v = 0; for(let i = 0; i < n; i++){ v = (v << 1) | ((all[bit >> 3] >> (7 - (bit & 7))) & 1); bit++; } return v; };
  ok(take(4) === 4, "not eight-bit mode");
  const len = take(ver < 10 ? 8 : 16);
  for(let i = 0; i < len; i++) bytes.push(take(8));
  return Buffer.from(bytes).toString("utf8");
}

/* ---- the round trip ---- */
const CASES = [
  "http://192.168.31.80:3000/?room=FR9H",
  "https://asimon.fly.dev/?room=QW21",
  "http://192.168.31.80:3000/board?room=FR9H",
  "a",
  "אסימון — הצטרפו למשחק",
  "http://a-fairly-long-name.local:3000/?room=ZZZZ&and=some&more=query#anchor"
];
["L","M","Q","H"].forEach(level => CASES.forEach(text => {
  const best = QR.matrix(text, level);
  const n = best.m.length;
  ok(n === 17 + 4 * best.ver, "version " + best.ver + " drew a " + n + " grid");
  /* the eyes, the timing line and the dark module: what a camera looks for first */
  [[0,0],[0,n-7],[n-7,0]].forEach(([R,C]) => {
    ok(best.m[R+3][C+3] === 1 && best.m[R][C] === 1 && best.m[R+1][C+1] === 0,
       "a finder pattern is malformed at " + R + "," + C);
  });
  for(let i = 8; i < n - 8; i++)
    ok(best.m[6][i] === (i % 2 === 0 ? 1 : 0) && best.m[i][6] === (i % 2 === 0 ? 1 : 0),
       "the timing line breaks at " + i);
  ok(best.m[n-8][8] === 1, "the dark module is not dark");
  if(best.ver >= 7){
    let v = 0;
    for(let i = 0; i < 18; i++) v |= best.m[Math.floor(i/3)][n - 11 + (i % 3)] << i;
    ok(bchOk(v, 0x1F25) && (v >> 12) === best.ver, "the version field is wrong");
  }
  const read = readData(best.m, best.ver, level);
  ok(read.mask === best.mask, "the code names mask " + read.mask + ", drew " + best.mask);
  const got = textOf(blocksOf(read.codes, best.ver, level), best.ver);
  ok(got === text, "read back " + JSON.stringify(got) + ", not " + JSON.stringify(text));
}));

/* the smallest version that fits is the one used: a short address must not
   draw a wall-sized grid */
ok(QR.matrix("hi", "M").ver === 1, "a two-letter code is not version 1");
ok(QR.matrix("x".repeat(30), "M").ver === 3, "thirty bytes at M is not version 3");
let threw = false;
try{ QR.matrix("x".repeat(400), "M"); }catch(e){ threw = true; }
ok(threw, "too much text passed silently");

/* the markup: one plate, one path, a quiet margin around the grid */
const markup = QR.svg("http://192.168.31.80:3000/?room=FR9H");
ok(/^<svg class="qr" viewBox="0 0 35 35"/.test(markup), "the svg is not a version 3 grid with its margin");
ok(markup.indexOf("<path") > 0 && markup.indexOf("fill=\"#fff\"") > 0, "the svg is missing its plate or its path");
ok(markup.indexOf("&") < 0 || markup.indexOf("&amp;") > 0, "the label is not escaped");

if(bad.length){
  console.error("qr.test.js — " + bad.length + " problem(s):");
  bad.forEach(b => console.error("  - " + b));
  process.exit(1);
}
console.log("qr.test.js ok — " + (CASES.length * 4) + " codes drawn and read back");
