/* Asimon — the square that saves the typing.

   A room is four letters and an address, and both are read off a screen and
   typed into a phone by somebody who is holding a drink. A QR is the same two
   facts in a shape a camera reads, so the whole of joining becomes: point the
   phone at the wall.

   The encoder is here because the rule of this codebase is no dependencies,
   and a QR is small enough to write: eight-bit mode, versions 1 to 10, one of
   the four error levels, the mask picked by the penalty score the standard
   describes. That covers every address a house ever hands out — a LAN address
   with a room code is under fifty characters, and version 10 at level M holds
   two hundred and thirteen.

   QR.svg(text, opts) -> markup, drawn dark on white because a camera reading a
   wall does not care what theme the room is in.                             */
"use strict";

const QR = (function(){

  /* ---------------- GF(256), the field the check bytes live in ---------------- */
  const EXP = new Array(512), LOG = new Array(256);
  (function(){
    let x = 1;
    for(let i = 0; i < 255; i++){ EXP[i] = x; LOG[x] = i; x <<= 1; if(x & 0x100) x ^= 0x11D; }
    for(let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  const mul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];

  /* the generator polynomial for n check bytes: (x-a^0)(x-a^1)…(x-a^(n-1)) */
  function genPoly(n){
    let p = [1];
    for(let i = 0; i < n; i++){
      const q = new Array(p.length + 1).fill(0);
      for(let j = 0; j < p.length; j++){ q[j] ^= p[j]; q[j + 1] ^= mul(p[j], EXP[i]); }
      p = q;
    }
    return p;
  }
  /* long division by that polynomial, run as the shift register it really is */
  function checkBytes(data, n){
    const gen = genPoly(n), res = new Array(n).fill(0);
    for(let i = 0; i < data.length; i++){
      const factor = data[i] ^ res[0];
      res.shift(); res.push(0);
      if(factor) for(let j = 0; j < n; j++) res[j] ^= mul(gen[j + 1], factor);
    }
    return res;
  }

  /* ---------------- the tables the standard is, versions 1 to 10 ----------------
     Per version and level: check bytes per block, then the blocks as
     [count, data bytes] — two groups, because most versions are cut into
     blocks of two nearby sizes. TOTAL is the whole codeword count, and is
     what these have to add back up to.                                       */
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
  const ECBITS = { L:1, M:0, Q:3, H:2 };   /* what the format field calls them */
  const dataBytes = spec => spec[1].reduce((n, g) => n + g[0] * g[1], 0);

  /* ---------------- the bit stream ---------------- */
  function encode(text, ver, level){
    const bytes = utf8(text), spec = EC[level][ver - 1], want = dataBytes(spec) * 8;
    const bits = [];
    const push = (val, n) => { for(let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); };
    push(4, 4);                                   /* eight-bit mode */
    push(bytes.length, ver < 10 ? 8 : 16);        /* how many bytes follow */
    bytes.forEach(b => push(b, 8));
    for(let i = 0; i < 4 && bits.length < want; i++) bits.push(0);
    while(bits.length % 8) bits.push(0);
    const out = [];
    for(let i = 0; i < bits.length; i += 8){
      let b = 0;
      for(let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      out.push(b);
    }
    /* the two pad bytes the standard alternates, until the version is full */
    const pad = [0xEC, 0x11];
    for(let i = 0; out.length < want / 8; i++) out.push(pad[i % 2]);
    return out;
  }

  function utf8(text){
    const out = [], s = String(text);
    for(let i = 0; i < s.length; i++){
      let c = s.codePointAt(i);
      if(c > 0xFFFF) i++;
      if(c < 0x80) out.push(c);
      else if(c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 63));
      else if(c < 0x10000) out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  /* Blocks are read across, not along: byte one of every block, then byte two
     of every block, so a scratch across the print takes a little from each
     rather than all of one. */
  function interleave(data, ver, level){
    const spec = EC[level][ver - 1], ecLen = spec[0], blocks = [], checks = [];
    let at = 0;
    spec[1].forEach(g => {
      for(let i = 0; i < g[0]; i++){
        const b = data.slice(at, at + g[1]); at += g[1];
        blocks.push(b); checks.push(checkBytes(b, ecLen));
      }
    });
    const out = [], widest = Math.max.apply(null, blocks.map(b => b.length));
    for(let i = 0; i < widest; i++) blocks.forEach(b => { if(i < b.length) out.push(b[i]); });
    for(let i = 0; i < ecLen; i++) checks.forEach(c => out.push(c[i]));
    return out;
  }

  /* ---------------- the grid ---------------- */
  function blank(size){
    const m = [], fixed = [];
    for(let r = 0; r < size; r++){ m.push(new Array(size).fill(0)); fixed.push(new Array(size).fill(false)); }
    return { m, fixed, size };
  }
  const set = (g, r, c, v) => { g.m[r][c] = v ? 1 : 0; g.fixed[r][c] = true; };

  function patterns(g, ver){
    const n = g.size;
    /* the three eyes, each with the quiet ring that separates it */
    [[0,0],[0,n-7],[n-7,0]].forEach(([R,C]) => {
      for(let r = -1; r <= 7; r++) for(let c = -1; c <= 7; c++){
        const y = R + r, x = C + c;
        if(y < 0 || x < 0 || y >= n || x >= n) continue;
        const on = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                   (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                   (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        set(g, y, x, on);
      }
    });
    /* the two dotted lines that tell a camera how wide a module is */
    for(let i = 8; i < n - 8; i++){ set(g, 6, i, i % 2 === 0); set(g, i, 6, i % 2 === 0); }
    /* the smaller squares that keep a large code from drifting */
    const pos = ALIGN[ver - 1];
    pos.forEach(r => pos.forEach(c => {
      if((r === 6 && c === 6) || (r === 6 && c === n - 7) || (r === n - 7 && c === 6)) return;
      for(let dr = -2; dr <= 2; dr++) for(let dc = -2; dc <= 2; dc++)
        set(g, r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }));
    set(g, n - 8, 8, 1);                                   /* the dark module */
    /* reserve the format strip; the bits go in once the mask is chosen */
    for(let i = 0; i < 9; i++){ if(!g.fixed[8][i]) set(g, 8, i, 0); if(!g.fixed[i][8]) set(g, i, 8, 0); }
    for(let i = 0; i < 8; i++){ set(g, 8, n - 1 - i, 0); set(g, n - 1 - i, 8, 0); }
    if(ver >= 7){
      const bits = versionBits(ver);
      for(let i = 0; i < 18; i++){
        const b = (bits >> i) & 1, r = Math.floor(i / 3), c = i % 3;
        set(g, r, n - 11 + c, b); set(g, n - 11 + c, r, b);
      }
    }
  }

  /* the remainder that turns a format or version number into its checked
     field: long division by the polynomial the standard names */
  function bch(value, poly, len){
    let v = value << len;
    while(bitLen(v) >= bitLen(poly)) v ^= poly << (bitLen(v) - bitLen(poly));
    return v;
  }
  const bitLen = v => { let n = 0; while(v){ n++; v >>>= 1; } return n; };

  const formatBits = (level, mask) =>
    (((ECBITS[level] << 3 | mask) << 10) | bch(ECBITS[level] << 3 | mask, 0x537, 10)) ^ 0x5412;
  const versionBits = ver => (ver << 12) | bch(ver, 0x1F25, 12);

  /* The format field is written twice, split around the corners: once beside
     the top-left eye, once across the other two, so losing a corner does not
     lose which mask was used. */
  function placeFormat(g, level, mask){
    const n = g.size, bits = formatBits(level, mask);
    const at = i => (bits >> i) & 1;
    for(let i = 0; i <= 5; i++) set(g, 8, i, at(i));
    set(g, 8, 7, at(6)); set(g, 8, 8, at(7)); set(g, 7, 8, at(8));
    for(let i = 9; i <= 14; i++) set(g, 14 - i, 8, at(i));
    for(let i = 0; i <= 6; i++) set(g, n - 1 - i, 8, at(i));
    for(let i = 7; i <= 14; i++) set(g, 8, n - 15 + i, at(i));
    set(g, n - 8, 8, 1);                                    /* the dark module */
  }

  /* up the right edge and down the next, two columns at a time, stepping over
     the column the vertical timing line sits in */
  function placeData(g, codes){
    const n = g.size;
    let bit = 0, up = true;
    const next = () => {
      const i = bit >> 3, b = 7 - (bit & 7);
      bit++;
      return i < codes.length ? (codes[i] >> b) & 1 : 0;
    };
    for(let right = n - 1; right > 0; right -= 2){
      if(right === 6) right = 5;
      for(let k = 0; k < n; k++){
        const r = up ? n - 1 - k : k;
        for(const c of [right, right - 1]) if(!g.fixed[r][c]) g.m[r][c] = next();
      }
      up = !up;
    }
  }

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

  /* The four penalties the standard scores a mask by: runs of one colour,
     solid two-by-twos, anything that looks like a finder, and a picture that
     has drifted far from half dark. */
  function penalty(m){
    const n = m.length;
    let score = 0;
    const runScore = run => run >= 5 ? 3 + (run - 5) : 0;
    for(let i = 0; i < n; i++){
      let rowRun = 1, colRun = 1;
      for(let j = 1; j < n; j++){
        rowRun = m[i][j] === m[i][j-1] ? rowRun + 1 : (score += runScore(rowRun), 1);
        colRun = m[j][i] === m[j-1][i] ? colRun + 1 : (score += runScore(colRun), 1);
      }
      score += runScore(rowRun) + runScore(colRun);
    }
    for(let i = 0; i < n - 1; i++) for(let j = 0; j < n - 1; j++)
      if(m[i][j] === m[i][j+1] && m[i][j] === m[i+1][j] && m[i][j] === m[i+1][j+1]) score += 3;
    const FIND = [1,0,1,1,1,0,1,0,0,0,0], FIND2 = [0,0,0,0,1,0,1,1,1,0,1];
    const hit = (get, i, j) => {
      let a = true, b = true;
      for(let k = 0; k < 11; k++){ const v = get(i, j + k); if(v !== FIND[k]) a = false; if(v !== FIND2[k]) b = false; }
      return a || b;
    };
    for(let i = 0; i < n; i++) for(let j = 0; j + 11 <= n; j++){
      if(hit((y,x) => m[y][x], i, j)) score += 40;
      if(hit((y,x) => m[x][y], i, j)) score += 40;
    }
    let dark = 0;
    m.forEach(row => row.forEach(v => dark += v));
    score += Math.floor(Math.abs(dark * 100 / (n * n) - 50) / 5) * 10;
    return score;
  }

  /* ---------------- the whole thing ---------------- */
  function matrix(text, level){
    const lv = EC[level] ? level : "M", bytes = utf8(text).length;
    let ver = 0;
    for(let v = 1; v <= 10; v++){
      const cap = dataBytes(EC[lv][v - 1]) - 2 - (v < 10 ? 1 : 2);
      if(bytes <= cap){ ver = v; break; }
    }
    if(!ver) throw new Error("qr: too long for version 10 at level " + lv);
    const codes = interleave(encode(text, ver, lv), ver, lv);
    const size = 17 + 4 * ver;
    let best = null;
    for(let mask = 0; mask < 8; mask++){
      const g = blank(size);
      patterns(g, ver);
      placeData(g, codes);
      for(let r = 0; r < size; r++) for(let c = 0; c < size; c++)
        if(!g.fixed[r][c] && MASKS[mask](r, c)) g.m[r][c] ^= 1;
      placeFormat(g, lv, mask);
      const s = penalty(g.m);
      if(!best || s < best.score) best = { score:s, m:g.m, ver, mask };
    }
    return best;
  }

  /* One <path> for every dark module. A rounded white plate under it, because
     a camera wants the quiet margin and the eye wants an object.            */
  function svg(text, opts){
    const o = opts || {}, quiet = o.quiet === undefined ? 3 : o.quiet;
    const best = matrix(text, o.ec || "M"), m = best.m, n = m.length, w = n + quiet * 2;
    let d = "";
    for(let r = 0; r < n; r++){
      let c = 0;
      while(c < n){
        if(!m[r][c]){ c++; continue; }
        let run = 0;
        while(c + run < n && m[r][c + run]) run++;
        d += "M" + (c + quiet) + " " + (r + quiet) + "h" + run + "v1h-" + run + "z";
        c += run;
      }
    }
    return '<svg class="qr" viewBox="0 0 ' + w + ' ' + w + '" width="100%" ' +
      'shape-rendering="crispEdges" role="img" aria-label="' +
      String(o.label || text).replace(/[&<>"]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" })[ch]) + '">' +
      '<rect width="' + w + '" height="' + w + '" rx="1.5" fill="#fff"/>' +
      '<path d="' + d + '" fill="#17161C"/></svg>';
  }

  return { svg, matrix };
})();
