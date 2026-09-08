/* Asimon — the map as a place.

   The phone draws the board as a diagram, and it should: at 390px, with a
   thumb on it, four lanes of pills is the honest drawing. The screen in the
   room is looked at from the other side of a sofa, and there the same board
   is drawn as somewhere you could stand — a farm, a jungle, a coast in a
   storm, a desert, a volcano: one place for each of the five maps — with the
   racers standing on it and a move as a hop from one square to the next. A
   map laid as roads is the same place with a piece of road per way.

   It is the same board. The rows, the lanes, the card and wildcard squares,
   the ways on from every square — all of it comes in as the state
   boardart.js draws, and is laid out here in the wall's across orientation,
   or running away from the viewer on a tablet stood on its end. The lane
   colours are style.css's own. The figures are the cast out of art.js, stood
   up: a person is the bust the drawing already is, a creature keeps its disc,
   and one sheen over either — light top left, shade bottom right — is what
   makes a flat drawing read as a little model.

   "3D" here is a tilted camera, a thickness under every square, and things
   that stand up in front of things behind them. That is the whole trick, and
   it is the one this game can afford: no dependencies means no WebGL and no
   models, so this is hand-written SVG like every other drawing in Asimon.
   The scenery is alive the way a room is — slowly, and at the edges — and
   it is CSS on SVG, phased off the clock so a redraw does not make a cloud
   jump. Nothing on the board itself moves unless the game moved it. The
   design this was built from is the canvas at design/world/.

   Loaded beside art.js and boardart.js on the screen's page, and nowhere
   else; the phone never sees it.                                            */
"use strict";

window.asimonWorld = (function(){

  const n1 = v => Math.round(v * 10) / 10;
  const el = (tag, a, inner) => "<" + tag + Object.keys(a).map(k =>
    a[k] === undefined || a[k] === null || a[k] === "" ? "" :
    " " + k + '="' + (typeof a[k] === "number" ? n1(a[k]) : a[k]) + '"').join("") +
    (inner === undefined ? "/>" : ">" + inner + "</" + tag + ">");
  const pts = list => list.map(p => n1(p[0]) + "," + n1(p[1])).join(" ");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const initials = n => String(n || "?").trim().slice(0, 2).toUpperCase();
  /* art.js is loaded beside this file: the cast and the twist badges are its */
  const art = { faceOf: id => faceOf(id), get MOD_ART(){ return MOD_ART; } };

  /* ---------------- the palette, read off the sheet ----------------
     A gradient needs a real colour to mix, not a var(), so the lane colours
     are read off style.css once and followed through any alias. */
  const CSSV = {};
  function tok(name){
    if(CSSV[name]) return CSSV[name];
    let v = "";
    try{ v = getComputedStyle(document.documentElement).getPropertyValue("--" + name).trim(); }catch(e){}
    const r = v.match(/^var\(--([\w-]+)\)$/);
    v = r ? tok(r[1]) : (v || "#888888");
    CSSV[name] = v;
    return v;
  }
  const THEMES = ["classic","twist","storm","sprint","chaos"];
  const lanesOf = id => [0,1,2,3].map(i => tok("map-" + (THEMES.indexOf(id) >= 0 ? id : "classic") + "-" + i));
  const INK = tok("ink") || "#17161C", GOOD = tok("good") || "#12B886", VIOLET = tok("violet") || "#7A5AF8";

  /* colour, the way the cast is coloured: a shade towards the game's ink
     rather than black, so a shadow side stays warm */
  const hex = c => { const s = c.replace("#",""); const m = s.length === 3 ? s.replace(/./g, x => x + x) : s;
    return [0,2,4].map(i => parseInt(m.slice(i, i+2), 16) || 0); };
  const mix = (a, b, t) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t)
    .toString(16).padStart(2, "0")).join("");
  const dark  = (c, t) => mix(c, "#1A1030", t === undefined ? 0.24 : t);
  const light = (c, t) => mix(c, "#FFFFFF", t === undefined ? 0.28 : t);
  const lum = c => { const [r,g,b] = hex(c); return (0.299*r + 0.587*g + 0.114*b) / 255; };

  /* ---------------- the camera ----------------
     A tilted table. u runs along the screen, v runs away from the viewer, h
     is height. Far things sit higher on the page and slightly to the left, so
     a box shows its top and its left side; nothing gets smaller with
     distance, which is what keeps a far tree and a near one the same drawing.

     Two pages. WIDE is a television: the island is a long slab and the race
     runs along it. TALL is a tablet stood on its end: the island is deep
     instead, the race runs away from the viewer, and the scenery moves to
     the sides. Same camera, same drawings, a smaller unit so the tall page
     holds it. */
  const SH = 0.11, FS = 0.68;
  let S = 40, ORG = { x:58, y:222 }, WORLD = { w:28, d:15 }, PAGE = { w:1280, h:720 }, TALL = false;
  function orient(tall){
    TALL = !!tall;
    if(tall){ S = 32; ORG = { x:34, y:250 }; WORLD = { w:20, d:36 }; PAGE = { w:820, h:1180 }; }
    else    { S = 40; ORG = { x:58, y:222 }; WORLD = { w:28, d:15 }; PAGE = { w:1280, h:720 }; }
  }
  const pt = (u, v, h) => ({ x: ORG.x + (u + v * SH) * S, y: ORG.y + v * FS * S - (h || 0) * S });
  /* The board fills the island: four lanes across most of its depth on a
     wall, and most of its width on a tablet, with the scenery pushed to the
     edges. The gap between rows is what shows the road between two squares. */
  const BOARD = { du: 1.5, dv: 2.7, v0: 4.2, dl: 3.0 };

  /* ---------------- the clock ----------------
     Every ambient motion is phased off the moment the drawing was made, so a
     redraw a second later does not send a cloud back to where it started.
     Motion that turns about a point — the windmill, the lighthouse beam, a
     tree in the wind — is SVG's own animateTransform with the centre written
     in, because that works on every television's browser; the rest is CSS in
     board.css. Both stop for anyone who has asked their device for less. */
  let T0 = 0;
  /* how big a square is drawn, against the room it has: 1 on a board that
     keeps its spacing, less on a long one, so the coins never touch */
  let NS = 1;
  let REDUCED = false;
  try{ REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }catch(e){}
  const turn = (cx, cy, dur, o) => REDUCED ? "" :
    el("animateTransform", { attributeName:"transform", type:"rotate",
      from:(o && o.from !== undefined ? o.from : 0) + " " + n1(cx) + " " + n1(cy),
      to:(o && o.to !== undefined ? o.to : 360) + " " + n1(cx) + " " + n1(cy),
      dur:dur + "s", repeatCount:"indefinite", begin:(-(T0 % dur)).toFixed(2) + "s" });
  const sway = (cx, cy, dur, deg, seed) => REDUCED ? "" :
    el("animateTransform", { attributeName:"transform", type:"rotate",
      values:(-deg) + " " + n1(cx) + " " + n1(cy) + ";" + deg + " " + n1(cx) + " " + n1(cy) + ";" + (-deg) + " " + n1(cx) + " " + n1(cy),
      dur:dur + "s", repeatCount:"indefinite", calcMode:"spline", keyTimes:"0;0.5;1", keySplines:"0.4 0 0.6 1;0.4 0 0.6 1",
      begin:(-((T0 + (seed || 0) * 1.7) % dur)).toFixed(2) + "s" });

  /* ---------------- things that stand on the ground ----------------
     Every prop takes a base point (u, v), a size s in units, and returns SVG.
     They are drawn as the cast is: a lit side, a shaded side, and a puddle of
     shadow saying where they touch the ground. Anything that moves carries a
     class the stylesheet animates, and --d, its own offset into that motion. */
  const shadow = (b, rx, ry, o) => el("ellipse", { cx:b.x, cy:b.y, rx, ry, fill:"#1A1030", opacity:o || 0.16 });

  function tree(u, v, s, col){
    const b = pt(u, v), k = s * S, c = col || "#4CAF50";
    return shadow(b, k*0.5, k*0.17) + "<g>" + sway(b.x, b.y, 5.5, 1.6, u + v) +
      el("rect", { x:b.x - k*0.09, y:b.y - k*0.6, width:k*0.18, height:k*0.64, rx:k*0.06, fill:"#7A5233" }) +
      el("circle", { cx:b.x + k*0.06, cy:b.y - k*0.86, r:k*0.46, fill:dark(c) }) +
      el("circle", { cx:b.x - k*0.05, cy:b.y - k*0.96, r:k*0.42, fill:c }) +
      el("circle", { cx:b.x - k*0.2, cy:b.y - k*1.12, r:k*0.15, fill:light(c), opacity:0.75 }) + "</g>";
  }
  function pine(u, v, s, col){
    const b = pt(u, v), k = s * S, c = col || "#2E8B57";
    let out = shadow(b, k*0.5, k*0.17) +
      el("rect", { x:b.x - k*0.07, y:b.y - k*0.35, width:k*0.14, height:k*0.38, fill:"#6B4A2E" });
    [[1.55, 0.95, 0.3], [1.22, 0.6, 0.44], [0.88, 0.25, 0.58]].forEach(t => {
      const ax = b.x, ay = b.y - k*t[0], by = b.y - k*t[1], hw = k*t[2];
      out += el("polygon", { points:pts([[ax, ay], [ax - hw, by], [ax, by]]), fill:c }) +
             el("polygon", { points:pts([[ax, ay], [ax + hw, by], [ax, by]]), fill:dark(c) });
    });
    return out;
  }
  function palm(u, v, s, col){
    const b = pt(u, v), k = s * S, c = col || "#3FA34D", tx = b.x + k*0.22, ty = b.y - k*1.35;
    let out = shadow(b, k*0.5, k*0.17) + "<g>" + sway(b.x, b.y, 4.6, 2.4, u * 2 + v) +
      el("path", { d:"M" + n1(b.x) + " " + n1(b.y) + "Q" + n1(b.x + k*0.05) + " " + n1(b.y - k*0.9) + " " + n1(tx) + " " + n1(ty),
        stroke:"#9C6B3C", "stroke-width":k*0.13, fill:"none", "stroke-linecap":"round" });
    [-160, -125, -85, -45, -10].forEach((a, i) => {
      out += el("ellipse", { cx:tx + k*0.42, cy:ty, rx:k*0.46, ry:k*0.12, fill:i % 2 ? dark(c, 0.18) : c,
        transform:"rotate(" + a + " " + n1(tx) + " " + n1(ty) + ")" });
    });
    return out + el("circle", { cx:tx - k*0.08, cy:ty + k*0.1, r:k*0.07, fill:"#6B4A2E" }) +
      el("circle", { cx:tx + k*0.06, cy:ty + k*0.12, r:k*0.07, fill:"#6B4A2E" }) + "</g>";
  }
  function bush(u, v, s, col){
    const b = pt(u, v), k = s * S, c = col || "#5DBB63";
    return shadow(b, k*0.5, k*0.14, 0.12) +
      el("circle", { cx:b.x + k*0.22, cy:b.y - k*0.22, r:k*0.26, fill:dark(c) }) +
      el("circle", { cx:b.x - k*0.2, cy:b.y - k*0.22, r:k*0.26, fill:c }) +
      el("circle", { cx:b.x, cy:b.y - k*0.34, r:k*0.3, fill:light(c, 0.12) });
  }
  function rock(u, v, s, col){
    const b = pt(u, v), k = s * S, c = col || "#9A9AA6", x = b.x, y = b.y;
    return shadow(b, k*0.55, k*0.16) +
      el("polygon", { points:pts([[x - k*0.5, y], [x - k*0.36, y - k*0.42], [x + k*0.08, y - k*0.58], [x + k*0.5, y - k*0.2], [x + k*0.44, y]]), fill:c }) +
      el("polygon", { points:pts([[x + k*0.08, y - k*0.58], [x + k*0.5, y - k*0.2], [x + k*0.44, y], [x + k*0.04, y]]), fill:dark(c) });
  }
  function pond(u, v, s, col, o){
    const b = pt(u, v), k = s * S, c = col || "#5FB4F0", rim = o && o.rim;
    return (rim ? el("ellipse", { cx:b.x, cy:b.y, rx:k*1.02, ry:k*0.46, fill:rim }) : "") +
      el("ellipse", { cx:b.x, cy:b.y, rx:k*0.95, ry:k*0.4, fill:dark(c, 0.14) }) +
      el("ellipse", { cx:b.x - k*0.06, cy:b.y - k*0.05, rx:k*0.8, ry:k*0.3, fill:c }) +
      el("ellipse", { cx:b.x - k*0.3, cy:b.y - k*0.12, rx:k*0.26, ry:k*0.07, fill:light(c, 0.5), class:"glow", style:"--d:" + n1(-u % 2.4) + "s" });
  }
  /* a box with its lid and its left side, the shape barns and towers start from */
  function box(u, v, w, d, h, col, o){
    const b = pt(u, v), W = w * S, H = h * S, dx = -d * SH * S, dy = -d * FS * S;
    const front = (o && o.front) || col;
    return el("polygon", { points:pts([[b.x, b.y], [b.x, b.y - H], [b.x + dx, b.y - H + dy], [b.x + dx, b.y + dy]]), fill:dark(col) }) +
      el("polygon", { points:pts([[b.x, b.y - H], [b.x + W, b.y - H], [b.x + W + dx, b.y - H + dy], [b.x + dx, b.y - H + dy]]), fill:light(col, 0.22) }) +
      el("rect", { x:b.x, y:b.y - H, width:W, height:H, fill:front });
  }
  function barn(u, v, s){
    const b = pt(u, v), k = s * S, w = 1.4*s, d = 1.1*s, h = 0.8*s, g = 0.45*s;
    const W = w*S, H = h*S, G = g*S, dx = -d*SH*S, dy = -d*FS*S, red = "#D9483B", roof = "#8A3B2E";
    return shadow({ x:b.x + W/2, y:b.y + 2 }, W*0.62, k*0.2) +
      box(u, v, w, d, h, red) +
      el("polygon", { points:pts([[b.x, b.y - H], [b.x + W/2, b.y - H - G], [b.x + W, b.y - H]]), fill:red }) +
      el("polygon", { points:pts([[b.x - W*0.06, b.y - H], [b.x + W/2, b.y - H - G], [b.x + W/2 + dx, b.y - H - G + dy], [b.x - W*0.06 + dx, b.y - H + dy]]), fill:light(roof, 0.18) }) +
      el("polygon", { points:pts([[b.x + W/2, b.y - H - G], [b.x + W*1.06, b.y - H], [b.x + W*1.06 + dx, b.y - H + dy], [b.x + W/2 + dx, b.y - H - G + dy]]), fill:roof }) +
      el("rect", { x:b.x + W*0.36, y:b.y - H*0.62, width:W*0.28, height:H*0.62, rx:W*0.14, fill:"#5C2A22" }) +
      el("path", { d:"M" + n1(b.x + W*0.36) + " " + n1(b.y - H*0.4) + "l" + n1(W*0.28) + " " + n1(H*0.4) + "M" + n1(b.x + W*0.64) + " " + n1(b.y - H*0.4) + "l" + n1(-W*0.28) + " " + n1(H*0.4), stroke:"#F2E2C4", "stroke-width":2, opacity:0.6 });
  }
  function windmill(u, v, s){
    const b = pt(u, v), k = s * S, top = { x:b.x + k*0.3, y:b.y - k*1.5 };
    let out = shadow({ x:b.x + k*0.3, y:b.y }, k*0.4, k*0.14) +
      el("polygon", { points:pts([[b.x, b.y], [b.x + k*0.6, b.y], [b.x + k*0.44, b.y - k*1.45], [b.x + k*0.16, b.y - k*1.45]]), fill:"#EADCC3" }) +
      el("polygon", { points:pts([[b.x + k*0.3, b.y], [b.x + k*0.6, b.y], [b.x + k*0.44, b.y - k*1.45], [b.x + k*0.3, b.y - k*1.45]]), fill:"#C9B592" }) +
      el("polygon", { points:pts([[b.x + k*0.1, b.y - k*1.45], [b.x + k*0.5, b.y - k*1.45], [b.x + k*0.3, b.y - k*1.7]]), fill:"#8A3B2E" });
    out += "<g>" + turn(top.x, top.y, 9);
    [20, 110, 200, 290].forEach(a => {
      out += el("rect", { x:top.x - k*0.05, y:top.y - k*0.75, width:k*0.1, height:k*0.75, rx:k*0.04, fill:"#6B4A2E",
        transform:"rotate(" + a + " " + n1(top.x) + " " + n1(top.y) + ")" }) +
        el("rect", { x:top.x + k*0.05, y:top.y - k*0.72, width:k*0.18, height:k*0.5, rx:k*0.03, fill:"#F7F1E3",
        transform:"rotate(" + a + " " + n1(top.x) + " " + n1(top.y) + ")" });
    });
    return out + "</g>" + el("circle", { cx:top.x, cy:top.y, r:k*0.08, fill:"#3B2A1A" });
  }
  function fence(u, v, s, len){
    let out = ""; const k = s * S, b0 = pt(u, v), b1 = pt(u + len, v);
    for(let i = 0; i <= len * 1.4; i++){
      const x = b0.x + (b1.x - b0.x) * i / (len * 1.4);
      out += el("rect", { x:x - k*0.05, y:b0.y - k*0.5, width:k*0.1, height:k*0.5, fill:"#A07A4E" });
    }
    return out + el("rect", { x:b0.x, y:b0.y - k*0.4, width:b1.x - b0.x, height:k*0.07, fill:"#C39A67" }) +
      el("rect", { x:b0.x, y:b0.y - k*0.22, width:b1.x - b0.x, height:k*0.07, fill:"#C39A67" });
  }
  function cow(u, v, s, flip){
    const b = pt(u, v), k = s * S, f = flip ? -1 : 1, x = b.x, y = b.y;
    return shadow(b, k*0.55, k*0.14) +
      [-0.3, -0.12, 0.14, 0.32].map(dx => el("rect", { x:x + dx*k*f - k*0.05, y:y - k*0.32, width:k*0.1, height:k*0.32, fill:"#EEE6D8" })).join("") +
      el("ellipse", { cx:x, cy:y - k*0.46, rx:k*0.5, ry:k*0.28, fill:"#F7F1E6" }) +
      el("ellipse", { cx:x - k*0.18*f, cy:y - k*0.5, rx:k*0.16, ry:k*0.12, fill:"#2A2118" }) +
      el("ellipse", { cx:x + k*0.2*f, cy:y - k*0.36, rx:k*0.12, ry:k*0.09, fill:"#2A2118" }) +
      el("circle", { cx:x + k*0.5*f, cy:y - k*0.62, r:k*0.18, fill:"#F7F1E6" }) +
      el("ellipse", { cx:x + k*0.56*f, cy:y - k*0.55, rx:k*0.12, ry:k*0.08, fill:"#F2B6B6" }) +
      el("circle", { cx:x + k*0.48*f, cy:y - k*0.68, r:k*0.025, fill:"#2A2118" }) +
      el("path", { d:"M" + n1(x + k*0.4*f) + " " + n1(y - k*0.76) + "l" + n1(-k*0.08*f) + " " + n1(-k*0.1), stroke:"#7A5233", "stroke-width":2.2, "stroke-linecap":"round" });
  }
  function sheep(u, v, s){
    const b = pt(u, v), k = s * S, x = b.x, y = b.y;
    return shadow(b, k*0.42, k*0.12) +
      [-0.2, 0.18].map(dx => el("rect", { x:x + dx*k - k*0.045, y:y - k*0.24, width:k*0.09, height:k*0.24, fill:"#2A2118" })).join("") +
      el("circle", { cx:x - k*0.18, cy:y - k*0.36, r:k*0.2, fill:"#F4EFE6" }) +
      el("circle", { cx:x + k*0.18, cy:y - k*0.36, r:k*0.2, fill:"#F4EFE6" }) +
      el("circle", { cx:x, cy:y - k*0.46, r:k*0.24, fill:"#FFFDF8" }) +
      el("circle", { cx:x + k*0.36, cy:y - k*0.5, r:k*0.13, fill:"#2A2118" }) +
      el("circle", { cx:x + k*0.4, cy:y - k*0.52, r:k*0.025, fill:"#FFFFFF" });
  }
  function chicken(u, v, s){
    const b = pt(u, v), k = s * S, x = b.x, y = b.y;
    return shadow(b, k*0.2, k*0.07, 0.14) +
      el("ellipse", { cx:x, cy:y - k*0.16, rx:k*0.18, ry:k*0.14, fill:"#FFFDF8" }) +
      el("circle", { cx:x + k*0.14, cy:y - k*0.3, r:k*0.09, fill:"#FFFDF8" }) +
      el("polygon", { points:pts([[x + k*0.22, y - k*0.3], [x + k*0.32, y - k*0.27], [x + k*0.22, y - k*0.25]]), fill:"#F2A33A" }) +
      el("circle", { cx:x + k*0.14, cy:y - k*0.4, r:k*0.04, fill:"#E0453A" }) +
      el("circle", { cx:x + k*0.16, cy:y - k*0.32, r:k*0.018, fill:"#2A2118" });
  }
  function monkey(u, v, s){
    const b = pt(u, v), k = s * S, x = b.x, y = b.y, br = "#7A4B2A", tan = "#E6BE95";
    return shadow(b, k*0.3, k*0.1) +
      el("path", { d:"M" + n1(x + k*0.2) + " " + n1(y - k*0.2) + "q" + n1(k*0.45) + " " + n1(-k*0.1) + " " + n1(k*0.25) + " " + n1(-k*0.55), stroke:br, "stroke-width":k*0.07, fill:"none", "stroke-linecap":"round" }) +
      el("ellipse", { cx:x, cy:y - k*0.3, rx:k*0.24, ry:k*0.28, fill:br }) +
      el("ellipse", { cx:x, cy:y - k*0.26, rx:k*0.14, ry:k*0.17, fill:tan }) +
      el("circle", { cx:x - k*0.3, cy:y - k*0.62, r:k*0.08, fill:br }) + el("circle", { cx:x + k*0.3, cy:y - k*0.62, r:k*0.08, fill:br }) +
      el("circle", { cx:x, cy:y - k*0.62, r:k*0.22, fill:br }) +
      el("ellipse", { cx:x, cy:y - k*0.58, rx:k*0.15, ry:k*0.13, fill:tan }) +
      el("circle", { cx:x - k*0.06, cy:y - k*0.62, r:k*0.025, fill:"#2A2118" }) + el("circle", { cx:x + k*0.06, cy:y - k*0.62, r:k*0.025, fill:"#2A2118" }) +
      el("path", { d:"M" + n1(x - k*0.05) + " " + n1(y - k*0.53) + "q" + n1(k*0.05) + " " + n1(k*0.04) + " " + n1(k*0.1) + " 0", stroke:"#2A2118", "stroke-width":1.4, fill:"none", "stroke-linecap":"round" });
  }
  function parrot(u, v, s){
    const b = pt(u, v), k = s * S, x = b.x, y = b.y;
    return '<g class="bob">' + el("ellipse", { cx:x, cy:y - k*0.22, rx:k*0.12, ry:k*0.2, fill:"#E53935" }) +
      el("ellipse", { cx:x + k*0.04, cy:y - k*0.2, rx:k*0.07, ry:k*0.13, fill:"#1E88E5" }) +
      el("path", { d:"M" + n1(x - k*0.04) + " " + n1(y - k*0.05) + "l" + n1(-k*0.1) + " " + n1(k*0.28) + "l" + n1(k*0.12) + " " + n1(-k*0.2), fill:"#43A047" }) +
      el("circle", { cx:x - k*0.02, cy:y - k*0.44, r:k*0.1, fill:"#E53935" }) +
      el("polygon", { points:pts([[x - k*0.12, y - k*0.46], [x - k*0.22, y - k*0.4], [x - k*0.1, y - k*0.38]]), fill:"#FFC107" }) +
      el("circle", { cx:x - k*0.05, cy:y - k*0.47, r:k*0.02, fill:"#2A2118" }) + "</g>";
  }
  function croc(u, v, s){
    const b = pt(u, v), k = s * S, x = b.x, y = b.y, g = "#5B8C3A";
    return el("ellipse", { cx:x, cy:y, rx:k*0.7, ry:k*0.12, fill:g }) +
      [-0.3, -0.05, 0.2].map(dx => el("circle", { cx:x + dx*k, cy:y - k*0.1, r:k*0.06, fill:dark(g, 0.2) })).join("") +
      el("ellipse", { cx:x + k*0.62, cy:y - k*0.02, rx:k*0.22, ry:k*0.08, fill:g }) +
      el("circle", { cx:x + k*0.42, cy:y - k*0.14, r:k*0.07, fill:"#FFFFFF" }) + el("circle", { cx:x + k*0.56, cy:y - k*0.14, r:k*0.07, fill:"#FFFFFF" }) +
      el("circle", { cx:x + k*0.43, cy:y - k*0.14, r:k*0.03, fill:"#2A2118" }) + el("circle", { cx:x + k*0.57, cy:y - k*0.14, r:k*0.03, fill:"#2A2118" });
  }
  function lighthouse(u, v, s){
    const b = pt(u, v), k = s * S, x = b.x, y = b.y, w = k*0.5;
    let out = shadow(b, w*0.9, k*0.16) +
      el("polygon", { points:pts([[x - w, y], [x + w, y], [x + w*0.6, y - k*2.1], [x - w*0.6, y - k*2.1]]), fill:"#F4EFE6" }) +
      el("polygon", { points:pts([[x + w*0.3, y], [x + w, y], [x + w*0.6, y - k*2.1], [x + w*0.2, y - k*2.1]]), fill:"#CFC6B8" });
    [0.35, 1.05, 1.75].forEach(h => {
      const w1 = w - (w - w*0.6) * (h / 2.1), w2 = w - (w - w*0.6) * ((h + 0.28) / 2.1);
      out += el("polygon", { points:pts([[x - w1, y - k*h], [x + w1, y - k*h], [x + w2, y - k*(h + 0.28)], [x - w2, y - k*(h + 0.28)]]), fill:"#D9483B" });
    });
    return out + el("rect", { x:x - w*0.78, y:y - k*2.18, width:w*1.56, height:k*0.1, fill:"#3B3A44" }) +
      el("rect", { x:x - w*0.42, y:y - k*2.58, width:w*0.84, height:k*0.42, fill:"#FFE082" }) +
      el("polygon", { points:pts([[x - w*0.62, y - k*2.58], [x + w*0.62, y - k*2.58], [x, y - k*2.95]]), fill:"#D9483B" }) +
      "<g>" + turn(x, y - k*2.37, 12) +
      el("polygon", { points:pts([[x - w*0.4, y - k*2.5], [x - k*2.8, y - k*3.2], [x - k*2.8, y - k*1.8], [x - w*0.4, y - k*2.24]]), fill:"#FFE082", opacity:0.32 }) + "</g>";
  }
  function boat(u, v, s){
    const b = pt(u, v), k = s * S, x = b.x, y = b.y;
    return el("path", { d:"M" + n1(x - k*0.5) + " " + n1(y - k*0.2) + "h" + n1(k) + "l" + n1(-k*0.15) + " " + n1(k*0.2) + "h" + n1(-k*0.7) + "Z", fill:"#8A3B2E" }) +
      el("rect", { x:x - k*0.02, y:y - k*0.95, width:k*0.04, height:k*0.75, fill:"#3B2A1A" }) +
      el("polygon", { points:pts([[x + k*0.02, y - k*0.92], [x + k*0.42, y - k*0.28], [x + k*0.02, y - k*0.28]]), fill:"#F7F1E3" });
  }
  function waves(u, v, s, len, col){
    let out = '<g class="bob" style="--d:' + n1(-u % 3) + 's">'; const k = s * S, b = pt(u, v), c = col || "#FFFFFF";
    for(let i = 0; i < len; i++){
      const x = b.x + i * k*0.9;
      out += el("path", { d:"M" + n1(x) + " " + n1(b.y) + "q" + n1(k*0.18) + " " + n1(-k*0.16) + " " + n1(k*0.36) + " 0", stroke:c, "stroke-width":2.2, fill:"none", "stroke-linecap":"round", opacity:0.7 });
    }
    return out + "</g>";
  }
  function whale(u, v, s){
    const b = pt(u, v), k = s * S, x = b.x, y = b.y, c = "#2F5D8A";
    return el("path", { d:"M" + n1(x - k*0.6) + " " + n1(y) + "q" + n1(k*0.6) + " " + n1(-k*0.7) + " " + n1(k*1.2) + " 0Z", fill:c }) +
      el("path", { d:"M" + n1(x + k*0.5) + " " + n1(y - k*0.1) + "l" + n1(k*0.25) + " " + n1(-k*0.3) + "l" + n1(k*0.12) + " " + n1(k*0.32) + "Z", fill:c }) +
      el("circle", { cx:x - k*0.3, cy:y - k*0.18, r:k*0.03, fill:"#FFFFFF" }) +
      el("path", { d:"M" + n1(x - k*0.25) + " " + n1(y - k*0.38) + "q" + n1(-k*0.1) + " " + n1(-k*0.25) + " " + n1(-k*0.25) + " " + n1(-k*0.3) + "M" + n1(x - k*0.25) + " " + n1(y - k*0.38) + "q" + n1(k*0.1) + " " + n1(-k*0.25) + " " + n1(k*0.25) + " " + n1(-k*0.3), stroke:"#DDEBF7", "stroke-width":2, fill:"none", "stroke-linecap":"round" });
  }
  function cloud(u, v, s, col, h){
    const b = pt(u, v, h || 0), k = s * S, c = col || "#FFFFFF";
    const g = pt(Math.min(WORLD.w - 2, u + 2.5), TALL ? 3.2 : 2.6);
    return '<g class="drift" style="--d:' + n1(-(u * 1.7) % 11) + 's">' +
      el("ellipse", { cx:g.x, cy:g.y, rx:k*1.1, ry:k*0.36, fill:"#1A1030", opacity:0.1, filter:"url(#soft)" }) +
      el("ellipse", { cx:b.x, cy:b.y, rx:k*0.7, ry:k*0.2, fill:c }) +
      el("circle", { cx:b.x - k*0.25, cy:b.y - k*0.12, r:k*0.26, fill:c }) +
      el("circle", { cx:b.x + k*0.12, cy:b.y - k*0.2, r:k*0.32, fill:c }) +
      el("circle", { cx:b.x + k*0.45, cy:b.y - k*0.08, r:k*0.22, fill:c }) + "</g>";
  }
  function stormcloud(u, v, s, h, bolt){
    const b = pt(u, v, h || 0), k = s * S, c = "#5B5F73";
    let out = cloud(u, v, s, c, h);
    for(let i = 0; i < 5; i++) out += el("line", { x1:b.x - k*0.5 + i*k*0.25, y1:b.y + k*0.15, x2:b.x - k*0.58 + i*k*0.25, y2:b.y + k*0.45, stroke:"#9FB4D6", "stroke-width":2, "stroke-linecap":"round", opacity:0.8 });
    if(bolt) out += el("polygon", { class:"flash", points:pts([[b.x + k*0.1, b.y + k*0.1], [b.x - k*0.08, b.y + k*0.55], [b.x + k*0.06, b.y + k*0.52], [b.x - k*0.1, b.y + k*0.95], [b.x + k*0.22, b.y + k*0.45], [b.x + k*0.06, b.y + k*0.48], [b.x + k*0.24, b.y + k*0.1]]), fill:"#FFD54F" });
    return out;
  }
  function cactus(u, v, s){
    const b = pt(u, v), k = s * S, x = b.x, y = b.y, g = "#3E9B5B";
    return shadow(b, k*0.3, k*0.1) +
      el("rect", { x:x - k*0.13, y:y - k*1.1, width:k*0.26, height:k*1.1, rx:k*0.13, fill:g }) +
      el("rect", { x:x + k*0.02, y:y - k*1.1, width:k*0.11, height:k*1.1, rx:k*0.06, fill:dark(g, 0.2) }) +
      el("path", { d:"M" + n1(x - k*0.13) + " " + n1(y - k*0.6) + "h" + n1(-k*0.22) + "v" + n1(-k*0.35), stroke:g, "stroke-width":k*0.2, fill:"none", "stroke-linecap":"round" }) +
      el("path", { d:"M" + n1(x + k*0.13) + " " + n1(y - k*0.75) + "h" + n1(k*0.22) + "v" + n1(-k*0.3), stroke:g, "stroke-width":k*0.2, fill:"none", "stroke-linecap":"round" }) +
      el("circle", { cx:x, cy:y - k*1.12, r:k*0.07, fill:"#F06292" });
  }
  function camel(u, v, s, flip){
    const b = pt(u, v), k = s * S, f = flip ? -1 : 1, x = b.x, y = b.y, c = "#D2A15A";
    return shadow(b, k*0.55, k*0.13) +
      [-0.3, -0.14, 0.12, 0.3].map(dx => el("rect", { x:x + dx*k*f - k*0.04, y:y - k*0.42, width:k*0.08, height:k*0.42, fill:dark(c, 0.15) })).join("") +
      el("ellipse", { cx:x, cy:y - k*0.55, rx:k*0.46, ry:k*0.22, fill:c }) +
      el("circle", { cx:x - k*0.08*f, cy:y - k*0.75, r:k*0.18, fill:c }) +
      el("path", { d:"M" + n1(x + k*0.36*f) + " " + n1(y - k*0.62) + "q" + n1(k*0.28*f) + " " + n1(-k*0.05) + " " + n1(k*0.3*f) + " " + n1(-k*0.5), stroke:c, "stroke-width":k*0.13, fill:"none", "stroke-linecap":"round" }) +
      el("ellipse", { cx:x + k*0.74*f, cy:y - k*1.12, rx:k*0.14, ry:k*0.09, fill:c }) +
      el("circle", { cx:x + k*0.72*f, cy:y - k*1.15, r:k*0.02, fill:"#2A2118" });
  }
  function tortoise(u, v, s){
    const b = pt(u, v), k = s * S, x = b.x, y = b.y, g = "#6E9E3F";
    return shadow(b, k*0.3, k*0.08, 0.14) +
      el("path", { d:"M" + n1(x - k*0.28) + " " + n1(y - k*0.06) + "a" + n1(k*0.28) + " " + n1(k*0.26) + " 0 0 1 " + n1(k*0.56) + " 0Z", fill:g }) +
      el("path", { d:"M" + n1(x - k*0.1) + " " + n1(y - k*0.06) + "a" + n1(k*0.18) + " " + n1(k*0.18) + " 0 0 1 " + n1(k*0.28) + " 0Z", fill:dark(g, 0.2) }) +
      el("rect", { x:x - k*0.32, y:y - k*0.08, width:k*0.64, height:k*0.08, rx:k*0.04, fill:"#B9C98A" }) +
      el("circle", { cx:x + k*0.34, cy:y - k*0.1, r:k*0.07, fill:"#B9C98A" }) +
      el("circle", { cx:x + k*0.36, cy:y - k*0.12, r:k*0.015, fill:"#2A2118" });
  }
  function dune(u, v, s, col){
    const b = pt(u, v), k = s * S, c = col || "#EDD39A";
    return el("path", { d:"M" + n1(b.x - k*1.4) + " " + n1(b.y) + "q" + n1(k*0.9) + " " + n1(-k*0.9) + " " + n1(k*1.6) + " " + n1(-k*0.5) + "q" + n1(k*0.7) + " " + n1(k*0.32) + " " + n1(k*1.2) + " " + n1(k*0.5) + "Z", fill:c }) +
      el("path", { d:"M" + n1(b.x + k*0.2) + " " + n1(b.y - k*0.5) + "q" + n1(k*0.7) + " " + n1(k*0.32) + " " + n1(k*1.2) + " " + n1(k*0.5) + "h" + n1(-k*1.2) + "Z", fill:dark(c, 0.12) });
  }
  function hill(u, v, s, col){
    const b = pt(u, v), k = s * S, c = col || "#A9D77A";
    return el("ellipse", { cx:b.x, cy:b.y, rx:k*1.5, ry:k*0.7, fill:c }) +
      el("path", { d:"M" + n1(b.x) + " " + n1(b.y - k*0.7) + "a" + n1(k*1.5) + " " + n1(k*0.7) + " 0 0 1 " + n1(k*1.5) + " " + n1(k*0.7) + "h" + n1(-k*1.5) + "Z", fill:dark(c, 0.1) });
  }
  function volcano(u, v, s){
    const b = pt(u, v), k = s * S, x = b.x, y = b.y, c = "#6B4E4E", top = k*0.55;
    return el("polygon", { points:pts([[x - k*1.7, y], [x - top, y - k*1.45], [x + top, y - k*1.45], [x + k*1.7, y]]), fill:c }) +
      el("polygon", { points:pts([[x + k*0.15, y - k*1.45], [x + top, y - k*1.45], [x + k*1.7, y], [x + k*0.6, y]]), fill:dark(c) }) +
      el("ellipse", { cx:x, cy:y - k*1.45, rx:top, ry:k*0.14, fill:"#3B2626" }) +
      el("ellipse", { cx:x, cy:y - k*1.45, rx:top*0.7, ry:k*0.09, fill:"#FF7A1A", class:"glow" }) +
      el("path", { class:"glow", d:"M" + n1(x - k*0.2) + " " + n1(y - k*1.4) + "q" + n1(-k*0.35) + " " + n1(k*0.5) + " " + n1(-k*0.7) + " " + n1(k*1.4) + "h" + n1(k*0.3) + "q" + n1(k*0.25) + " " + n1(-k*0.8) + " " + n1(k*0.4) + " " + n1(-k*1.3) + "Z", fill:"#FF7A1A" }) +
      el("path", { d:"M" + n1(x - k*0.18) + " " + n1(y - k*1.4) + "q" + n1(-k*0.3) + " " + n1(k*0.5) + " " + n1(-k*0.52) + " " + n1(k*1.2), stroke:"#FFD54F", "stroke-width":k*0.07, fill:"none", "stroke-linecap":"round", class:"flow" }) +
      el("path", { class:"glow", d:"M" + n1(x + k*0.25) + " " + n1(y - k*1.42) + "q" + n1(k*0.15) + " " + n1(k*0.4) + " " + n1(k*0.45) + " " + n1(k*0.85), stroke:"#FF7A1A", "stroke-width":k*0.11, fill:"none", "stroke-linecap":"round" }) +
      [[0, 1.7, 0.2, 0], [0.18, 2.0, 0.26, -1.4], [0.45, 2.35, 0.32, -2.8]].map(p => el("circle", { cx:x + p[0]*k, cy:y - p[1]*k, r:p[2]*k, fill:"#8C8592", opacity:0.7, class:"rise", style:"--d:" + p[3] + "s" })).join("");
  }
  function lava(u, v, s){ return '<g class="glow">' + pond(u, v, s, "#FF7A1A", { rim:"#3B2626" }).replace(light("#FF7A1A", 0.5), "#FFD54F") + "</g>"; }
  function dino(u, v, s, flip){
    const b = pt(u, v), k = s * S, f = flip ? -1 : 1, x = b.x, y = b.y, g = "#66A64F";
    return shadow(b, k*0.7, k*0.16) +
      [-0.3, 0.25].map(dx => el("rect", { x:x + dx*k*f - k*0.09, y:y - k*0.45, width:k*0.18, height:k*0.45, rx:k*0.06, fill:dark(g, 0.2) })).join("") +
      el("path", { d:"M" + n1(x - k*0.5*f) + " " + n1(y - k*0.55) + "q" + n1(-k*0.5*f) + " " + n1(k*0.05) + " " + n1(-k*0.85*f) + " " + n1(k*0.35), stroke:g, "stroke-width":k*0.16, fill:"none", "stroke-linecap":"round" }) +
      el("ellipse", { cx:x, cy:y - k*0.6, rx:k*0.6, ry:k*0.32, fill:g }) +
      el("ellipse", { cx:x, cy:y - k*0.5, rx:k*0.4, ry:k*0.16, fill:light(g, 0.35) }) +
      el("path", { d:"M" + n1(x + k*0.45*f) + " " + n1(y - k*0.7) + "q" + n1(k*0.3*f) + " " + n1(-k*0.2) + " " + n1(k*0.35*f) + " " + n1(-k*0.9), stroke:g, "stroke-width":k*0.2, fill:"none", "stroke-linecap":"round" }) +
      el("ellipse", { cx:x + k*0.88*f, cy:y - k*1.62, rx:k*0.2, ry:k*0.13, fill:g }) +
      el("circle", { cx:x + k*0.86*f, cy:y - k*1.66, r:k*0.025, fill:"#2A2118" }) +
      [-0.25, 0, 0.25].map(dx => el("polygon", { points:pts([[x + dx*k - k*0.08, y - k*0.88], [x + dx*k, y - k*1.06], [x + dx*k + k*0.08, y - k*0.88]]), fill:dark(g, 0.2) })).join("");
  }
  function flag(u, v, s){
    const b = pt(u, v), k = s * S, x = b.x, y = b.y;
    let out = el("rect", { x:x - k*0.03, y:y - k*1.15, width:k*0.06, height:k*1.15, fill:INK });
    for(let i = 0; i < 4; i++) for(let j = 0; j < 3; j++)
      out += el("rect", { x:x + k*0.03 + i*k*0.14, y:y - k*1.15 + j*k*0.14, width:k*0.14, height:k*0.14, fill:(i + j) % 2 ? INK : "#FFFFFF" });
    return out;
  }
  function sun(x, y, r, col){ return el("circle", { cx:x, cy:y, r, fill:col || "#FFE082" }) + el("circle", { cx:x, cy:y, r:r*1.35, fill:col || "#FFE082", opacity:0.25, class:"pulse" }); }
  /* two birds, crossing the sky and coming back */
  function birds(u, v, s, h){
    const b = pt(u, v, h || 0), k = s * S;
    const one = (x, y, w) => el("path", { d:"M" + n1(x - w) + " " + n1(y) + "q" + n1(w*0.5) + " " + n1(-w*0.7) + " " + n1(w) + " 0q" + n1(w*0.5) + " " + n1(-w*0.7) + " " + n1(w) + " 0", stroke:INK, "stroke-width":1.8, fill:"none", "stroke-linecap":"round", opacity:0.6 });
    return '<g class="fly" style="--d:' + n1(-(u * 2.3) % 17) + 's">' + one(b.x, b.y, k*0.16) + one(b.x + k*0.5, b.y + k*0.18, k*0.12) + "</g>";
  }

  const PROPS = { birds, tree, pine, palm, bush, rock, pond, barn, windmill, fence, cow, sheep, chicken, monkey, parrot,
    croc, lighthouse, boat, waves, whale, cloud, stormcloud, cactus, camel, tortoise, dune, hill, volcano, lava, dino };


  /* ---------------- the five places ---------------- */
  /* Each map gets a scene. A scene is a sky, a ground, and a list of props with
     where they stand: far (v under 4) is behind the board, near (v over 12) is in
     front of it. The character follows the map's — Storm is the wild board, so it
     gets the weather; Sprint is the short one, so it gets the finish flags. */
  const SCENES = {
    classic:{ he:"חווה", en:"Farm", sky:"#BFE3FF", mist:"#E8F4FF", ground:"#8CCB5A", cliff:"#7A5C3E",
      road:"#E9D49C", dash:"#FBEFD2", roadKind:"path", nodeKind:"log", sunAt:[1150, 90], props:[
        ["hill", 4, 0.2, 2.2, "#A9D77A"], ["hill", 13, 0.4, 2.6, "#9ACF6A"], ["hill", 23, 0.1, 2.4, "#A9D77A"],
        ["cloud", 3, -3.5, 1.1, "#FFFFFF", 0], ["cloud", 18, -4.2, 1.3, "#FFFFFF", 0], ["birds", 7, -3, 1.2, 0], ["birds", 21, -2.2, 1.0, 0],
        ["barn", 2.2, 3.4, 1.05], ["windmill", 6.6, 2.6, 1.1], ["fence", 8.2, 3.7, 0.9, 5],
        ["tree", 14.5, 2.6, 1.15, "#4CAF50"], ["tree", 16.2, 3.4, 0.95, "#43A047"], ["bush", 12.8, 3.6, 0.8],
        ["pond", 21.5, 3.2, 1.4, "#5FB4F0"], ["tree", 25.5, 2.4, 1.2, "#4CAF50"], ["bush", 24.2, 3.7, 0.7],
        ["cow", 9.5, 3.5, 0.9], ["cow", 11.2, 2.9, 0.8, true], ["chicken", 4.9, 3.9, 0.9], ["chicken", 5.5, 3.6, 0.8],
        ["sheep", 19.4, 3.8, 0.85], ["sheep", 20.6, 3.3, 0.75],
        ["tree", 1.4, 13.6, 1.0, "#43A047"], ["bush", 3.4, 13.9, 0.8], ["fence", 5.5, 13.6, 0.9, 6],
        ["cow", 12.4, 13.7, 0.9, true], ["sheep", 15.5, 13.9, 0.85], ["chicken", 17.2, 13.8, 0.9],
        ["bush", 19.5, 13.9, 0.8], ["tree", 22.8, 13.4, 1.0, "#4CAF50"], ["rock", 25.6, 13.9, 0.8, "#A8A29E"], ["bush", 26.8, 13.7, 0.7] ] },
    twist:{ he:"ג׳ונגל", en:"Jungle", sky:"#9ED9C6", mist:"#D4F1E6", ground:"#5FA85A", cliff:"#5C4A3B", road:"#B98A55", dash:"#F2E3C4", roadKind:"stones", nodeKind:"stone",
      sunAt:null, props:[
        ["hill", 5, 0.2, 2.4, "#3F8A4B"], ["hill", 15, 0.5, 2.8, "#4A9A55"], ["hill", 24, 0.1, 2.4, "#3F8A4B"],
        ["palm", 1.6, 3.3, 1.25], ["tree", 3.8, 2.6, 1.3, "#2E7D32"], ["bush", 5.6, 3.7, 0.9, "#43A047"],
        ["pond", 9, 3.2, 1.6, "#3FA0C8"], ["croc", 9.2, 3.3, 1.0],
        ["tree", 13, 2.4, 1.4, "#2E7D32"], ["palm", 15.4, 3.2, 1.2], ["monkey", 14.1, 3.9, 0.9],
        ["rock", 18.2, 3.7, 1.0, "#8D8D95"], ["tree", 20.5, 2.6, 1.3, "#388E3C"], ["parrot", 20.1, 2.3, 1.0],
        ["palm", 23.5, 3.1, 1.3], ["bush", 25.4, 3.8, 0.9, "#43A047"], ["tree", 27, 2.5, 1.1, "#2E7D32"],
        ["bush", 1.5, 13.8, 0.9, "#43A047"], ["palm", 3.6, 13.5, 1.1], ["rock", 6.4, 13.9, 0.8, "#8D8D95"],
        ["monkey", 8.6, 13.9, 0.95], ["bush", 11, 13.9, 0.9, "#43A047"], ["tree", 14, 13.4, 1.0, "#2E7D32"],
        ["parrot", 16.9, 13.8, 1.1], ["bush", 18.6, 13.9, 0.8, "#43A047"], ["palm", 21.6, 13.5, 1.15],
        ["rock", 24.2, 13.9, 0.9, "#8D8D95"], ["bush", 26.4, 13.8, 0.9, "#43A047"] ] },
    storm:{ he:"סופה", en:"Storm", sky:"#6F7B99", mist:"#8A96B3", ground:"#7C8F6A", cliff:"#4B4E5C", sea:"#3B5F8A", road:"#7C818C", dash:"#DDE2EC", roadKind:"cobbles", nodeKind:"pebble",
      sunAt:null, props:[
        ["cloud", 5, -5.5, 1.4, "#8C95AD", 0], ["stormcloud", 12, -5, 1.5, 0, true], ["cloud", 21, -5.8, 1.3, "#8C95AD", 0], ["stormcloud", 25, -4.6, 1.2, 0, false],
        ["waves", 0.5, 1.2, 1.0, 6, "#DDEBF7"], ["whale", 9, 1.4, 1.2], ["boat", 17, 1.5, 1.2], ["waves", 20, 1.0, 1.0, 6, "#DDEBF7"],
        ["lighthouse", 3.2, 3.9, 1.05], ["rock", 5.6, 3.8, 1.0, "#6F7380"], ["pine", 8.4, 3.3, 1.0, "#2F6B4F"],
        ["rock", 12.5, 3.9, 0.8, "#6F7380"], ["pine", 15, 3.2, 1.1, "#2F6B4F"], ["pine", 16.6, 3.6, 0.9, "#2F6B4F"],
        ["rock", 20.3, 3.8, 1.1, "#6F7380"], ["pine", 23.4, 3.1, 1.15, "#2F6B4F"], ["rock", 26, 3.9, 0.9, "#6F7380"],
        ["rock", 1.6, 13.9, 1.0, "#6F7380"], ["pine", 4.2, 13.4, 0.95, "#2F6B4F"], ["bush", 6.8, 13.9, 0.8, "#4C7A5C"],
        ["rock", 10.4, 13.9, 0.8, "#6F7380"], ["pine", 13.6, 13.3, 1.0, "#2F6B4F"], ["rock", 17.2, 13.9, 1.0, "#6F7380"],
        ["bush", 20.2, 13.9, 0.8, "#4C7A5C"], ["pine", 23, 13.4, 0.95, "#2F6B4F"], ["rock", 26.2, 13.9, 0.9, "#6F7380"] ] },
    sprint:{ he:"מדבר", en:"Desert", sky:"#FFD9A0", mist:"#FFEBC8", ground:"#EDD39A", cliff:"#B98A4A", road:"#D9B577", dash:"#FFF6DF", roadKind:"flags", nodeKind:"clay",
      sunAt:[160, 100], props:[
        ["dune", 6, 1.2, 2.2, "#E9C77F"], ["dune", 17, 1.5, 2.6, "#E3BE72"], ["dune", 26, 1.1, 2.0, "#E9C77F"],
        ["birds", 12, -3.4, 1.1, 0], ["cactus", 2.5, 3.6, 1.1], ["rock", 4.6, 3.9, 0.8, "#C9A26B"], ["cactus", 7.8, 3.3, 0.9],
        ["pond", 12.5, 3.2, 1.5, "#4FC3F7", { rim:"#8CC66B" }], ["palm", 11, 3.6, 1.1], ["palm", 14.2, 3.5, 1.0],
        ["camel", 18.5, 3.6, 1.0], ["camel", 20.6, 3.2, 0.85, true], ["cactus", 24, 3.5, 1.0], ["rock", 26.4, 3.9, 0.9, "#C9A26B"],
        ["rock", 1.6, 13.9, 0.9, "#C9A26B"], ["cactus", 4, 13.4, 1.0], ["tortoise", 7, 13.9, 1.0],
        ["cactus", 10.5, 13.5, 0.9], ["rock", 13.8, 13.9, 0.8, "#C9A26B"], ["tortoise", 16.5, 13.9, 0.9],
        ["cactus", 19.6, 13.4, 1.05], ["rock", 23, 13.9, 0.9, "#C9A26B"], ["cactus", 26, 13.6, 0.9] ] },
    chaos:{ he:"הר געש", en:"Volcano", sky:"#2E1F3C", mist:"#7A3E5A", ground:"#5C4A52", cliff:"#2C2130", road:"#3A2E3E", dash:"#D9C4D6", roadKind:"basalt", nodeKind:"obsidian",
      sunAt:[1100, 110, "#FF9F6E"], props:[
        ["volcano", 7, 3.9, 1.9], ["rock", 12, 3.9, 1.1, "#5A4C58"], ["lava", 15.5, 3.3, 1.3],
        ["pine", 18.5, 3.3, 1.0, "#4A3A55"], ["rock", 21, 3.9, 0.9, "#5A4C58"], ["dino", 24.2, 3.6, 1.0, true],
        ["cloud", 2, -4.5, 1.2, "#5E4A66", 0], ["cloud", 20, -5, 1.1, "#5E4A66", 0],
        ["lava", 2.6, 13.6, 1.0], ["rock", 5.2, 13.9, 1.0, "#5A4C58"], ["pine", 8.2, 13.3, 0.9, "#4A3A55"],
        ["rock", 11.6, 13.9, 0.8, "#5A4C58"], ["dino", 15.5, 13.8, 0.9], ["rock", 19.4, 13.9, 1.0, "#5A4C58"],
        ["lava", 22.6, 13.7, 0.9], ["pine", 25.6, 13.4, 0.9, "#4A3A55"] ] }
  };
  /* a scene knows its own name: the coast and the sound are keyed by it */
  Object.keys(SCENES).forEach(k => { SCENES[k].id = k; });



  /* where a square is, in the world: rows run along the screen, lanes run away
     from it, lane 0 the far one — the same order the wall's across board uses */
  function layout(rows, rtl){
    if(TALL){
      /* lanes across the page, lane 0 on the left as the phone has it; rows
         run away from the viewer, the start nearest, the finish at the far end */
      const dl = BOARD.dl, u0 = (WORLD.w - 3 * dl) / 2, far = 5.2, near = WORLD.d - 2.6, dr = (near - far) / (rows + 1);
      NS = Math.max(0.72, Math.min(1, dr * FS * S / 38));
      const vr = r => near - r * dr;
      return {
        u: c => u0 + c * dl, v: r => vr(r),
        at: (r, c) => pt(u0 + (r === 0 || r > rows ? 1.5 : c) * dl, vr(r)),
        depth: (r, c) => vr(r),                       /* what a square sorts by */
        laneDepth: c => far - 0.6,                    /* a road runs the whole way; it goes under everything */
        flag: { u: u0 + 1.5 * dl + 1.15, v: vr(rows + 1) }
      };
    }
    /* The rows share the island's length between them. A short board keeps
       the spacing it likes; a long one — three players is seventeen rows —
       closes up rather than running its start and its flag off the coast.
       The margin is what a start figure and a flag need to stand inside. */
    const EDGE = 2.0, du = Math.min(BOARD.du, (WORLD.w - 2 * EDGE) / (rows + 1));
    NS = Math.max(0.72, Math.min(1, du / BOARD.du));
    const span = (rows + 1) * du, u0 = (WORLD.w - span) / 2;
    const ur = r => rtl ? u0 + (rows + 1 - r) * du : u0 + r * du;
    return {
      u: r => ur(r), v: c => BOARD.v0 + c * BOARD.dv,
      at: (r, c) => pt(ur(r), BOARD.v0 + (r === 0 || r > rows ? 1.5 : c) * BOARD.dv),
      depth: (r, c) => BOARD.v0 + (r === 0 || r > rows ? 1.5 : c) * BOARD.dv,
      laneDepth: c => BOARD.v0 + c * BOARD.dv - 0.6,
      flag: { u: ur(rows + 1) + (rtl ? -0.8 : 0.8), v: BOARD.v0 + 1.5 * BOARD.dv }
    };
  }

  /* The same scenery, moved for a tall page: what stood behind the board stands
     at the far end, what stood in front stands at the near end, and the things
     that can stand anywhere are dealt out along the two sides. Sky things stay
     in the sky. */
  const ANYWHERE = { tree:1, pine:1, palm:1, bush:1, rock:1, cactus:1, cow:1, sheep:1, chicken:1, monkey:1, parrot:1, camel:1, tortoise:1, dino:1 };
  /* the same scenery on a wall, kept out of the board's way now that the
     board reaches nearer the edges: the far band comes forward less, the
     near band stands at the very front, a size down */
  function wideProps(list){
    return list.map(p => {
      const q = p.slice(), v = p[2];
      if(v < 0) return q;
      if(v <= 4.5){ q[2] = v * 0.74; return q; }
      q[2] = 13.75 + (v - 13.3) * 0.7; q[3] = (p[3] || 1) * 0.85; return q;
    });
  }
  function tallProps(list){
    const out = [], sides = [];
    list.forEach(p => {
      const q = p.slice(), u = p[1], v = p[2];
      q[1] = u / 28 * 20;
      if(v < 0){ q[2] = v * 1.1; out.push(q); return; }
      if(v <= 4.5){ q[2] = v * 0.85; out.push(q); if(ANYWHERE[p[0]]) sides.push(p); return; }
      q[2] = WORLD.d - 1.4 + (v - 13.3) * 0.6; q[3] = (p[3] || 1) * 0.9; out.push(q);
      if(ANYWHERE[p[0]]) sides.push(p);
    });
    sides.forEach((p, i) => {
      const q = p.slice(), left = i % 2 === 0, k = Math.floor(i / 2);
      q[1] = left ? 1.6 + (k % 3) * 0.9 : WORLD.w - 1.6 - (k % 3) * 0.9;
      q[2] = 6.5 + k * 2.6 + (left ? 0 : 1.3);
      if(q[2] < WORLD.d - 4.5) out.push(q);
    });
    return out;
  }

  /* A road for each place. Handed its two ends, it draws along them, so it
     lies the same on a wall and on a tablet: a farm track with two ruts, a
     plank walk through the jungle, a cobbled causeway in the storm, a trodden
     line in the sand, and cooled lava with the heat still showing through. */
  function road(sc, A, B, w){
    const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const band = (wid, fill, extra) => el("polygon", Object.assign({ points:pts([
      [A.x + nx*wid/2, A.y + ny*wid/2], [B.x + nx*wid/2, B.y + ny*wid/2], [B.x - nx*wid/2, B.y - ny*wid/2], [A.x - nx*wid/2, A.y - ny*wid/2]]), fill, "stroke-linejoin":"round" }, extra || {}));
    const along = t => ({ x:A.x + ux*t, y:A.y + uy*t });
    const seeded = i => ((i * 9301 + 49297) % 233280) / 233280;
    let out = el("polygon", { points:pts([[A.x + nx*w/2, A.y + ny*w/2 + 4], [B.x + nx*w/2, B.y + ny*w/2 + 4], [B.x - nx*w/2, B.y - ny*w/2 + 4], [A.x - nx*w/2, A.y - ny*w/2 + 4]]), fill:INK, opacity:0.12, filter:"url(#soft)" });
    const kind = sc.roadKind || "path";
    const tuft = (p, c) => el("path", { d:"M" + n1(p.x - 4) + " " + n1(p.y) + "l2 -6M" + n1(p.x) + " " + n1(p.y) + "l0 -7M" + n1(p.x + 4) + " " + n1(p.y) + "l-2 -6", stroke:c, "stroke-width":1.6, "stroke-linecap":"round", fill:"none" });
    if(kind === "path"){
      /* the sandy path of a level map: a dark worn edge, a pale trodden middle,
         pebbles and tufts of grass where the grass gave up */
      out += band(w + 6, dark(sc.road, 0.3), { stroke:dark(sc.road, 0.3), "stroke-width":4 }) + band(w, sc.road, { stroke:sc.road, "stroke-width":2 }) +
        band(w * 0.5, light(sc.road, 0.3), { opacity:0.55, filter:"url(#soft)" });
      for(let t = 12, i = 0; t < len - 8; t += 23, i++){
        const p = along(t), side = i % 2 ? 1 : -1, o = side * (w/2 - 3 + seeded(i) * 4);
        if(i % 3 === 2) out += tuft({ x:p.x + nx*o*1.25, y:p.y + ny*o*1.25 }, dark(sc.ground, 0.25));
        else out += el("ellipse", { cx:p.x + nx*o, cy:p.y + ny*o, rx:2.6 + seeded(i + 3) * 1.6, ry:1.7, fill:dark(sc.road, 0.22) }) +
          el("ellipse", { cx:p.x + nx*o - 0.6, cy:p.y + ny*o - 0.8, rx:1.8 + seeded(i + 3) * 1.2, ry:1.0, fill:light(sc.road, 0.35) });
      }
    } else if(kind === "stones"){
      /* stepping stones through the undergrowth, each one a flat rock with a
         lit top and a little moss, on a strip of worn earth */
      out += band(w - 2, dark(sc.ground, 0.22), { opacity:0.7, filter:"url(#soft)" });
      for(let t = 6, i = 0; t < len - 4; t += 15, i++){
        const p = along(t), o = (seeded(i) - 0.5) * 8, rx = 8.5 + seeded(i + 5) * 3, ry = rx * 0.62, gx = p.x + nx*o, gy = p.y + ny*o;
        const g = i % 3 === 0 ? "#9A9AA6" : i % 3 === 1 ? "#8A8C98" : "#A6A7B0";
        out += el("ellipse", { cx:gx, cy:gy + 2.5, rx, ry, fill:dark(g, 0.4) }) +
          el("ellipse", { cx:gx, cy:gy, rx, ry, fill:g }) +
          el("ellipse", { cx:gx - rx*0.25, cy:gy - ry*0.3, rx:rx*0.5, ry:ry*0.4, fill:light(g, 0.3), opacity:0.7 }) +
          (i % 4 === 1 ? el("ellipse", { cx:gx + rx*0.4, cy:gy - ry*0.5, rx:rx*0.35, ry:ry*0.35, fill:"#5DBB63", opacity:0.85 }) : "");
      }
    } else if(kind === "cobbles"){
      /* a causeway: cobbles set in dark mortar, every stone with a lit top */
      out += band(w + 2, dark(sc.road, 0.42)) + band(w - 2, dark(sc.road, 0.25));
      for(let t = 7, i = 0; t < len - 5; t += 8.5, i++){
        const o = (seeded(i) - 0.5) * (w - 12), p = along(t), c = i % 4 === 0 ? light(sc.road, 0.28) : i % 4 === 1 ? sc.road : i % 4 === 2 ? light(sc.road, 0.12) : dark(sc.road, 0.08);
        out += el("ellipse", { cx:p.x + nx*o, cy:p.y + ny*o + 1.6, rx:4.8, ry:3.4, fill:dark(sc.road, 0.45) }) +
          el("ellipse", { cx:p.x + nx*o, cy:p.y + ny*o, rx:4.6, ry:3.1, fill:c }) +
          el("ellipse", { cx:p.x + nx*o - 1.2, cy:p.y + ny*o - 1, rx:2, ry:1.2, fill:"#FFFFFF", opacity:0.22 });
      }
    } else if(kind === "flags"){
      /* flagstones: slabs of sandstone laid end to end, dark sand in the joints */
      out += band(w + 2, dark(sc.road, 0.35));
      for(let t = 3, i = 0; t < len - 3; t += 17, i++){
        const p0 = along(t), p1 = along(Math.min(len - 3, t + 14.5)), sh = (seeded(i) - 0.5) * 6;
        const c = i % 3 === 0 ? light(sc.road, 0.18) : i % 3 === 1 ? sc.road : light(sc.road, 0.08);
        out += el("polygon", { points:pts([[p0.x + nx*(w/2 - 2 + sh), p0.y + ny*(w/2 - 2 + sh)], [p1.x + nx*(w/2 - 2 - sh), p1.y + ny*(w/2 - 2 - sh)],
          [p1.x - nx*(w/2 - 2 + sh), p1.y - ny*(w/2 - 2 + sh)], [p0.x - nx*(w/2 - 2 - sh), p0.y - ny*(w/2 - 2 - sh)]]), fill:c }) +
          el("line", { x1:p0.x + nx*(w/2 - 5), y1:p0.y + ny*(w/2 - 5) - 1, x2:p1.x + nx*(w/2 - 5), y2:p1.y + ny*(w/2 - 5) - 1, stroke:"#FFFFFF", "stroke-width":1.2, opacity:0.3 });
      }
    } else if(kind === "basalt"){
      /* cooled lava: dark plates with the heat still coming up the cracks */
      out += band(w + 2, "#17121B");
      for(let t = 3, i = 0; t < len - 3; t += 13, i++){
        const p0 = along(t), p1 = along(Math.min(len - 3, t + 11)), c = i % 2 ? sc.road : light(sc.road, 0.08);
        out += el("polygon", { points:pts([[p0.x + nx*(w/2 - 2), p0.y + ny*(w/2 - 2)], [p1.x + nx*(w/2 - 2), p1.y + ny*(w/2 - 2)], [p1.x - nx*(w/2 - 2), p1.y - ny*(w/2 - 2)], [p0.x - nx*(w/2 - 2), p0.y - ny*(w/2 - 2)]]), fill:c });
      }
      let d = "M" + n1(A.x + ux*6) + " " + n1(A.y + uy*6);
      for(let t = 14, i = 0; t < len - 6; t += 12, i++){ const o = (seeded(i) - 0.5) * (w - 10), p = along(t); d += "L" + n1(p.x + nx*o) + " " + n1(p.y + ny*o); }
      out += el("path", { d, stroke:"#FF7A1A", "stroke-width":3.2, fill:"none", "stroke-linejoin":"round", opacity:0.55, filter:"url(#soft)", class:"glow" }) +
        el("path", { d, stroke:"#FF7A1A", "stroke-width":2, fill:"none", "stroke-linejoin":"round", opacity:0.9, class:"glow" }) +
        el("path", { d, stroke:"#FFD54F", "stroke-width":0.9, fill:"none", "stroke-linejoin":"round", opacity:0.85, class:"glow" });
    }
    return out;
  }


  /* Every gradient a coin needs, registered by colour as coins ask for it and
     written into the defs of whichever drawing asked. A coin is lit from the
     top left like everything else here; the gradient is what makes a disc a
     coin and not a circle. */
  const GR = {};
  function gid(c){
    const k = c.replace("#", "");
    if(!GR[k]) GR[k] =
      '<radialGradient id="top' + k + '" cx="0.36" cy="0.3" r="0.85"><stop offset="0" stop-color="' + light(c, 0.86) + '"/><stop offset="0.65" stop-color="' + light(c, 0.66) + '"/><stop offset="1" stop-color="' + light(c, 0.5) + '"/></radialGradient>' +
      '<radialGradient id="topS' + k + '" cx="0.36" cy="0.3" r="0.85"><stop offset="0" stop-color="' + light(c, 0.34) + '"/><stop offset="0.6" stop-color="' + c + '"/><stop offset="1" stop-color="' + dark(c, 0.18) + '"/></radialGradient>' +
      '<linearGradient id="side' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + light(c, 0.42) + '"/><stop offset="1" stop-color="' + dark(c, 0.1) + '"/></linearGradient>' +
      '<linearGradient id="sideS' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + dark(c, 0.12) + '"/><stop offset="1" stop-color="' + dark(c, 0.42) + '"/></linearGradient>';
    return k;
  }
  const gradDefs = () => Object.keys(GR).map(k => GR[k]).join("");

  /* A square is a coin — one for the cast sheet, and the shape every material
     below shares: a footprint of about 45 by 25, a thickness, and three states.
     Pale until somebody stands on it (held), solid in the lane's colour then,
     and lit — one of the squares a mover may choose — raised and glowing. */
  function coin(x, y, col, o){
    o = o || {};
    const RX = 22.5, RY = 12.5, th = o.raise ? 12 : 6, solid = o.lit || o.held, k = gid(col);
    return '<g opacity="' + (o.dimmed ? 0.4 : 1) + '">' + under(x, y, col, o, RX, RY) +
      el("ellipse", { cx:x, cy:y, rx:RX, ry:RY, fill:"url(#side" + (solid ? "S" : "") + k + ")" }) +
      el("rect", { x:x - RX, y:y - th, width:RX*2, height:th, fill:"url(#side" + (solid ? "S" : "") + k + ")" }) +
      el("ellipse", { cx:x, cy:y - th, rx:RX, ry:RY, fill:"url(#top" + (solid ? "S" : "") + k + ")", stroke:solid ? dark(col, 0.2) : col,
        "stroke-width":solid ? 1.2 : 1.8, "stroke-dasharray":o.dash && !solid ? "4 3" : "" }) +
      el("ellipse", { cx:x - 3, cy:y - th - 2, rx:RX*0.66, ry:RY*0.52, fill:"#FFFFFF", opacity:solid ? 0.18 : 0.35 }) +
      (o.inner || "") + "</g>";
  }
  /* what every material has under it: the ground shadow, and the glow when lit */
  function under(x, y, col, o, RX, RY){
    return el("ellipse", { cx:x, cy:y + 5, rx:RX*1.15, ry:RY*1.15, fill:INK, opacity:0.3, filter:"url(#soft)" }) +
      (o.lit ? el("ellipse", { cx:x, cy:y + 2, rx:RX*1.7, ry:RY*1.7, fill:col, opacity:0.32, filter:"url(#soft)" }) : "");
  }
  /* A rounded slab seen from the tilted camera: top face, front face, the
     shape of the jungle's blocks and the desert's tiles */
  function slab(x, y, W, H, th, rx, topFill, sideFill, extra){
    return el("rect", { x:x - W/2, y:y - H/2 - th + th, width:W, height:H, rx, fill:sideFill }) +
      el("rect", { x:x - W/2, y:y - H/2 - th, width:W, height:H + th - 3, rx, fill:sideFill }) +
      el("rect", Object.assign({ x:x - W/2, y:y - H/2 - th, width:W, height:H, rx, fill:topFill }, extra || {}));
  }

  /* the farm: a slice of log, its top painted in the lane's colour, the rings
     still showing through the paint */
  function logNode(x, y, col, o){
    const RX = 23, RY = 13, th = o.raise ? 13 : 7, solid = o.lit || o.held, k = gid(col), bark = "#6B4A2E";
    const paint = solid ? "url(#topS" + k + ")" : "url(#top" + k + ")";
    return under(x, y, col, o, RX, RY) +
      el("ellipse", { cx:x, cy:y, rx:RX, ry:RY, fill:dark(bark, 0.25) }) +
      el("rect", { x:x - RX, y:y - th, width:RX*2, height:th, fill:dark(bark, 0.25) }) +
      el("rect", { x:x - RX + 3, y:y - th, width:5, height:th, fill:bark, opacity:0.6 }) +
      el("rect", { x:x + RX*0.3, y:y - th, width:7, height:th, fill:bark, opacity:0.5 }) +
      el("ellipse", { cx:x, cy:y - th, rx:RX, ry:RY, fill:bark }) +
      el("ellipse", { cx:x, cy:y - th, rx:RX - 3.5, ry:RY - 2.4, fill:paint }) +
      el("ellipse", { cx:x, cy:y - th, rx:RX - 9, ry:RY - 5.5, fill:"none", stroke:dark(col, 0.25), "stroke-width":1, opacity:solid ? 0.3 : 0.45 }) +
      el("ellipse", { cx:x, cy:y - th, rx:RX - 15, ry:RY - 9, fill:"none", stroke:dark(col, 0.25), "stroke-width":1, opacity:solid ? 0.3 : 0.45 }) +
      el("ellipse", { cx:x - 4, cy:y - th - 2.5, rx:RX*0.5, ry:RY*0.36, fill:"#FFFFFF", opacity:solid ? 0.2 : 0.35 });
  }
  /* the jungle: a chunky block of stone with a bevelled edge and moss on the
     corner the sun does not reach */
  function stoneNode(x, y, col, o){
    const W = 46, H = 27, th = o.raise ? 14 : 8, solid = o.lit || o.held, k = gid(col);
    const top = solid ? "url(#topS" + k + ")" : "url(#top" + k + ")";
    return under(x, y, col, o, 23, 13) +
      slab(x, y, W, H, th, 9, top, solid ? dark(col, 0.4) : mix(col, "#5A5566", 0.55)) +
      el("rect", { x:x - W/2 + 3, y:y - H/2 - th + 2.5, width:W - 6, height:H - 6, rx:6.5, fill:"none", stroke:"#FFFFFF", "stroke-width":2, opacity:solid ? 0.22 : 0.4 }) +
      el("rect", { x:x - W/2 + 3, y:y - H/2 - th + 4, width:W - 6, height:H - 6, rx:6.5, fill:"none", stroke:INK, "stroke-width":1.5, opacity:0.12 }) +
      (solid ? "" : el("path", { d:"M" + n1(x - W/2 + 2) + " " + n1(y - H/2 - th + 9) + "q4 -8 12 -6q5 -3 9 1q-6 2 -10 6q-6 3 -11 -1Z", fill:"#5DBB63", opacity:0.9 }) +
        el("circle", { cx:x + W/2 - 8, cy:y + H/2 - th - 4, r:2.6, fill:"#5DBB63", opacity:0.8 }));
  }
  /* the storm: a wet pebble, glossy, sitting in a ring of the water it stands in */
  function pebbleNode(x, y, col, o){
    const RX = 23, RY = 14, th = o.raise ? 9 : 4, solid = o.lit || o.held, k = gid(col);
    const rock = solid ? col : mix(col, "#6F7B8F", 0.62);
    return under(x, y, col, o, RX, RY) +
      el("ellipse", { cx:x, cy:y + 3, rx:RX + 7, ry:RY + 4, fill:"none", stroke:"#DDEBF7", "stroke-width":2, opacity:0.55 }) +
      el("ellipse", { cx:x, cy:y + 3, rx:RX + 2, ry:RY + 1.5, fill:"#DDEBF7", opacity:0.25 }) +
      el("ellipse", { cx:x, cy:y, rx:RX, ry:RY, fill:dark(rock, 0.45) }) +
      el("rect", { x:x - RX, y:y - th, width:RX*2, height:th, fill:dark(rock, 0.45) }) +
      el("ellipse", { cx:x, cy:y - th, rx:RX, ry:RY + 1, fill:solid ? "url(#topS" + k + ")" : rock }) +
      el("ellipse", { cx:x + 4, cy:y - th + 4, rx:RX*0.7, ry:RY*0.45, fill:INK, opacity:0.12 }) +
      el("ellipse", { cx:x - 7, cy:y - th - 5, rx:RX*0.42, ry:RY*0.3, fill:"#FFFFFF", opacity:0.5 }) +
      el("ellipse", { cx:x + 9, cy:y - th - 1, rx:3, ry:1.6, fill:"#FFFFFF", opacity:0.35 });
  }
  /* the desert: a terracotta tile with a glazed centre in the lane's colour */
  function clayNode(x, y, col, o){
    const W = 46, H = 28, th = o.raise ? 13 : 7, solid = o.lit || o.held, k = gid(col), clay = "#C98B5C";
    const glaze = solid ? "url(#topS" + k + ")" : "url(#top" + k + ")";
    return under(x, y, col, o, 23, 13) +
      slab(x, y, W, H, th, 6, solid ? col : light(clay, 0.12), solid ? dark(col, 0.4) : dark(clay, 0.32)) +
      el("ellipse", { cx:x, cy:y - th, rx:W/2 - 6, ry:H/2 - 4, fill:glaze, stroke:solid ? dark(col, 0.3) : dark(clay, 0.2), "stroke-width":1.4 }) +
      el("ellipse", { cx:x - 3, cy:y - th - 2, rx:W*0.28, ry:H*0.2, fill:"#FFFFFF", opacity:solid ? 0.2 : 0.4 }) +
      el("path", { d:"M" + n1(x - W/2 + 2) + " " + n1(y - H/2 - th + 2) + "l5 0M" + n1(x + W/2 - 7) + " " + n1(y + H/2 - th - 2) + "l5 0", stroke:"#FFFFFF", "stroke-width":1.4, opacity:0.4 });
  }
  /* the volcano: a column of obsidian, six-sided, with the lane's colour
     burning in its core */
  function obsidianNode(x, y, col, o){
    const RX = 24, RY = 13.5, th = o.raise ? 15 : 9, solid = o.lit || o.held, k = gid(col);
    const hex = (cy) => pts([[x - RX, cy], [x - RX/2, cy - RY], [x + RX/2, cy - RY], [x + RX, cy], [x + RX/2, cy + RY], [x - RX/2, cy + RY]]);
    return under(x, y, col, o, RX, RY) +
      el("polygon", { points:pts([[x - RX, y], [x - RX/2, y + RY], [x - RX/2, y + RY - th], [x - RX, y - th]]), fill:"#1B1520" }) +
      el("polygon", { points:pts([[x - RX/2, y + RY], [x + RX/2, y + RY], [x + RX/2, y + RY - th], [x - RX/2, y + RY - th]]), fill:"#2A2231" }) +
      el("polygon", { points:pts([[x + RX/2, y + RY], [x + RX, y], [x + RX, y - th], [x + RX/2, y + RY - th]]), fill:"#160F1A" }) +
      el("polygon", { points:hex(y - th), fill:solid ? "url(#topS" + k + ")" : "#3A3142", stroke:solid ? dark(col, 0.35) : "#4E4458", "stroke-width":1.4, "stroke-linejoin":"round" }) +
      (solid ? "" : el("ellipse", { cx:x, cy:y - th, rx:RX*0.62, ry:RY*0.62, fill:col, opacity:0.85, filter:"url(#soft)", class:"glow" }) +
        el("ellipse", { cx:x, cy:y - th, rx:RX*0.42, ry:RY*0.42, fill:light(col, 0.45), opacity:0.9, class:"glow" }) +
        el("path", { d:"M" + n1(x + RX*0.3) + " " + n1(y - th - RY*0.3) + "l6 -3 4 -5M" + n1(x - RX*0.35) + " " + n1(y - th + RY*0.2) + "l-7 3 -3 5", stroke:col, "stroke-width":1.4, fill:"none", "stroke-linecap":"round", opacity:0.9 })) +
      el("polygon", { points:pts([[x - RX + 3, y - th], [x - RX/2 + 1.5, y - th - RY + 2], [x + RX/2 - 1.5, y - th - RY + 2]]), fill:"#FFFFFF", opacity:solid ? 0.16 : 0.1 });
  }
  const NODES = { log:logNode, stone:stoneNode, pebble:pebbleNode, clay:clayNode, obsidian:obsidianNode };
  /* what the word on a square is written in, per material */
  function nodeInk(kind, col, solid){
    if(solid) return lum(col) > 0.62 ? "#2A1B00" : "#FFFFFF";
    if(kind === "pebble" || kind === "obsidian") return "#FFFFFF";
    return dark(col, 0.2);
  }
  function node(sc, x, y, col, o){
    const fn = NODES[sc.nodeKind];
    if(!fn) return coin(x, y, col, o);
    const shrink = NS < 1 ? ' transform="translate(' + n1(x) + ' ' + n1(y) + ') scale(' + NS.toFixed(3) + ') translate(' + n1(-x) + ' ' + n1(-y) + ')"' : "";
    return '<g opacity="' + (o.dimmed ? 0.4 : 1) + '"' + shrink + '>' + fn(x, y, col, o) + (o.inner || "") + "</g>";
  }

  /* the twist's own emblem, held up beside whoever is standing on its square,
     so the rule they are on is still on the map — the same badge the phone
     shows on the round-twist notice */
  function badge(key, x, y, r){
    const e = key === "CARD" ? { bg:GOOD, art:'<rect x="12" y="8" width="16" height="24" rx="3" fill="#FFFFFF"/><rect x="15" y="12" width="10" height="3" rx="1.5" fill="' + GOOD + '"/>' }
            : key === "WILD" ? { bg:VIOLET, art:'<text x="20" y="27" text-anchor="middle" font-family="Suez One,Georgia,serif" font-size="22" fill="#FFFFFF">?</text>' }
            : art.MOD_ART[key];
    if(!e) return "";
    const k = r / 20;
    return el("circle", { cx:x, cy:y, r:r + 2.5, fill:"#FFFFFF" }) +
      '<g transform="translate(' + n1(x - r) + ' ' + n1(y - r) + ') scale(' + k.toFixed(4) + ')">' +
      '<circle cx="20" cy="20" r="20" fill="' + e.bg + '"/><g clip-path="url(#lsface)">' + e.art + '</g>' +
      '<circle cx="20" cy="20" r="20" fill="url(#sheen)"/></g>';
  }


  /* The wildcard's sign. A square that rolls something is the one square
     worth being drawn to, so it does not print its question mark — it flies
     one, a little above the square: a violet glyph with a thickness, a thin
     halo of light on the stone beneath it, two sparks that come and go. Kept
     quiet on purpose; a thing that glows too hard stops being mysterious.
     When somebody is standing on the square the figure and its badge take
     the space and only the halo stays. */
  function wildSign(x, y, o){
    const c = VIOLET, deep = dark(c, 0.5);
    let out = el("ellipse", { cx:x, cy:y + 1, rx:19, ry:8, fill:light(c, 0.3), opacity:o.lit ? 0.5 : 0.3, filter:"url(#soft)", class:"glow" });
    if(o.held) return out;
    const spark = (dx, dy, r, d) => el("path", { d:"M" + n1(x + dx) + " " + n1(y + dy - r) + "q0 " + n1(r) + " " + n1(r) + " " + n1(r) + "q" + n1(-r) + " 0 " + n1(-r) + " " + n1(r) + "q0 " + n1(-r) + " " + n1(-r) + " " + n1(-r) + "q" + n1(r) + " 0 " + n1(r) + " " + n1(-r) + "Z",
      fill:"#FFFFFF", class:"twinkle", style:"--d:" + d + "s" });
    const glyph = (dx, dy, fill, extra) => el("text", Object.assign({ x:x + dx, y:y - 16 + dy, "text-anchor":"middle", "font-family":"Suez One,Georgia,serif", "font-size":32, "font-weight":700, fill }, extra || {}), "?");
    out += '<g class="float" style="--d:' + n1(-(x / 37) % 2.8) + 's">' +
      glyph(2.2, 2.2, deep) + glyph(1.1, 1.1, dark(c, 0.3)) +
      glyph(0, 0, light(c, 0.78), { stroke:dark(c, 0.15), "stroke-width":0.9 }) +
      spark(-17, -30, 3, -0.4) + spark(15, -40, 2.4, -1.5) +
      "</g>";
    return out;
  }

  /* A print lying on a square: the twist's badge, foreshortened the way the
     square's own top is, so it reads as a sticker on a tilted surface and
     not a coin standing on it. */
  function print(key, x, y, r){
    return '<g transform="translate(' + n1(x) + ' ' + n1(y) + ') scale(1 0.58) translate(' + n1(-x) + ' ' + n1(-y) + ')">' + badge(key, x, y, r) + "</g>";
  }

  /* The square a mover has chosen and not yet confirmed: a ring of light in
     the square's own colour, breathing, rather than a line drawn round it */
  function chosen(x, y, col){
    return el("ellipse", { cx:x, cy:y, rx:33, ry:20, fill:"none", stroke:col, "stroke-width":7, opacity:0.55, filter:"url(#soft)", class:"glow" }) +
      el("ellipse", { cx:x, cy:y, rx:30, ry:18, fill:"none", stroke:"#FFFFFF", "stroke-width":2.6, opacity:0.95 }) +
      el("ellipse", { cx:x, cy:y, rx:30, ry:18, fill:col, opacity:0.14, class:"glow" });
  }

  /* ---------------- one of the cast, standing on the map ----------------
     The phone shows a face on a disc; here the same drawing stands up. A
     person is drawn as the bust the art already is — head and shoulders, the
     disc left out — and a creature keeps its disc, because for a fox or a
     panda the disc is the face. A player without a face is a ball with their
     initials on it, as they are a coin with initials on the phone. Over any
     of them goes one sheen. The shadow stays on the ground so the figure can
     hop off it: a figure that has just moved carries where it came from as
     two custom properties, and the stylesheet does the rest. */
  const isBust = f => /^<path d="M5\.5 40/.test(f.art);
  function figure(u, x, y, k, o){
    o = o || {};
    const s = 40 * k, f = u.face ? art.faceOf(u.face) : null, bust = f && isBust(f);
    const body = f
      ? (bust ? "" : '<circle cx="20" cy="20" r="20" fill="' + f.bg + '"/>') +
        '<g clip-path="url(#lsface)">' + f.art + '</g>' +
        (bust ? '<circle cx="20" cy="18.5" r="11" fill="url(#sheen)"/>' +
                '<path d="M5.5 40c0-8 6.5-11.6 14.5-11.6S34.5 32 34.5 40Z" fill="url(#bodysheen)"/>'
              : '<circle cx="20" cy="20" r="20" fill="url(#sheen)"/>')
      : '<circle cx="20" cy="20" r="20" fill="' + (u.color || "#2C6BFF") + '"/>' +
        '<text x="20" y="25" text-anchor="middle" font-family="Assistant,sans-serif" font-size="14" font-weight="800" fill="#FFFFFF">' + esc(initials(u.name)) + '</text>' +
        '<circle cx="20" cy="20" r="20" fill="url(#sheen)"/>';
    const hop = o.from ? ' style="--dx:' + n1(o.from.x - x) + 'px;--dy:' + n1(o.from.y - y) + 'px"' : "";
    return (o.noShadow ? "" : '<g class="' + (o.from ? "hopshadow" : "") + '"' + hop + '>' +
        el("ellipse", { cx:x, cy:y, rx:s*0.4, ry:s*0.17, fill:INK, opacity:0.3, filter:"url(#soft)" }) + '</g>') +
      '<g class="' + (o.from ? "hop" : "") + '"' + hop + '><g class="idle" style="--d:' + n1(-(o.seed || 0) * 0.7) + 's">' +
      '<g transform="translate(' + n1(x) + ' ' + n1(y) + ') translate(' + n1(-s/2) + ' ' + n1(-s + 3) + ') scale(' + k.toFixed(4) + ')">' +
      body + '</g></g></g>';
  }

  /* the defs every drawing carries: the face clip, the soft shadow, the two
     sheens, and whatever gradients the coins have asked for so far */
  const defs = () => '<defs><clipPath id="lsface"><circle cx="20" cy="20" r="20"/></clipPath>' +
    '<filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6"/></filter>' +
    '<radialGradient id="sheen" cx="0.36" cy="0.3" r="0.78"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.5"/><stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#1A1030" stop-opacity="0.3"/></radialGradient>' +
    '<linearGradient id="bodysheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.3"/><stop offset="1" stop-color="#1A1030" stop-opacity="0.3"/></linearGradient>' +
    gradDefs() + '</defs>';

  /* ---------------- the coast ----------------
     The island is a rectangle in the world with an edge that wanders
     outwards from it. Every place wanders differently: the farm's meadow
     rolls, the jungle bulges, the storm's rock is jagged, the desert is a
     mesa with its corners cut, the volcano is angular. The wander is always
     outward, so the board's rectangle is never bitten into. */
  const COASTS = {
    classic:{ amp:0.9, freq:1.1, soft:true },
    twist:{ amp:1.5, freq:1.7, soft:true },
    storm:{ amp:1.0, freq:4.2, soft:false },
    sprint:{ amp:0.3, freq:0.9, soft:false, chamfer:1.8 },
    chaos:{ amp:0.9, freq:1.4, soft:false }
  };
  function coast(sc, dy){
    const C = COASTS[sc.id] || COASTS.classic, W = WORLD.w, D = WORLD.d;
    const in_ = 0.55, base = { u0:in_, u1:W - in_, v0:0.25, v1:D - 0.25 };
    const wob = t => C.amp * (0.5 + 0.5 * (0.62 * Math.sin(C.freq * t * 6.283 + 0.9) + 0.38 * Math.sin(C.freq * 2.7 * t * 6.283 + 2.1)));
    const N = 9, P = [];
    const side = (from, to, nx, nv, t0) => {
      const a = C.chamfer ? C.chamfer / Math.hypot(to[0] - from[0], to[1] - from[1]) : 0;
      for(let i = 0; i <= N; i++){
        const f = a + (1 - 2 * a) * (i / N), t = t0 + f * 0.25, d = wob(t);
        P.push([from[0] + (to[0] - from[0]) * f + nx * d, from[1] + (to[1] - from[1]) * f + nv * d]);
      }
    };
    side([base.u0, base.v0], [base.u1, base.v0], 0, -1, 0);      /* the far edge, wandering into the sky */
    side([base.u1, base.v0], [base.u1, base.v1], 1, 0, 0.25);    /* the right */
    side([base.u1, base.v1], [base.u0, base.v1], 0, 1, 0.5);     /* the near edge */
    side([base.u0, base.v1], [base.u0, base.v0], -1, 0, 0.75);   /* the left */
    const Q = P.map(p => { const q = pt(p[0], p[1]); return [q.x, q.y + dy]; });
    if(!C.soft) return "M" + Q.map(q => n1(q[0]) + " " + n1(q[1])).join("L") + "Z";
    /* soft: a curve through the midpoints, with every sample as a control */
    let d = "";
    for(let i = 0; i < Q.length; i++){
      const a = Q[i], b = Q[(i + 1) % Q.length], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      d += (i ? "Q" + n1(a[0]) + " " + n1(a[1]) + " " : "M") + n1(m[0]) + " " + n1(m[1]);
    }
    return d + "Z";
  }

  /* ---------------- the place, with the board on it ----------------
     o.board   {rows, nodes, themeId} — the layout, as boardart.js takes it
     o.units   the racers; each {id, pos, face, name, color}
     o.label   (node) -> the short word on a square, "" for a bare one
     o.endText what the finish says
     o.spots   the squares to light up, o.picked the one already chosen
     o.from    (unit) -> "r,c" of where it stood at the last draw, so a unit
               that moved hops from there rather than appearing
     o.tall    a tablet stood on its end; o.rtl the race runs right to left  */
  function scene(o){
    orient(o.tall);
    const b = o.board, rows = b.rows, rtl = !!o.rtl;
    const sc = SCENES[b.themeId] || SCENES.classic;
    const L = layout(rows, rtl), COL = lanesOf(b.themeId);
    const label = o.label || (() => "");
    const lit = {}; (o.spots || []).forEach(p => lit[p.r + "," + p.c] = true);
    const dim = (o.spots || []).length > 0;
    const layers = [];
    const put = (v, svg) => layers.push({ v, svg });

    /* the ground: a slab with a thickness, floating on the sky, and each
       place with a coast of its own — the wobble of the edge, and whether it
       is drawn soft or sharp, is the whole of what tells a meadow from a rock */
    const isl = dy => coast(sc, dy);
    let bg = el("rect", { x:0, y:0, width:PAGE.w, height:PAGE.h, fill:sc.sky });
    if(sc.sea) bg += el("rect", { x:0, y:ORG.y - 22, width:PAGE.w, height:PAGE.h, fill:sc.sea });
    else bg += el("rect", { x:0, y:ORG.y - 72, width:PAGE.w, height:90, fill:sc.mist, opacity:0.55 });
    if(sc.sunAt) bg += sun(sc.sunAt[0] * PAGE.w / 1280, sc.sunAt[1], TALL ? 28 : 34, sc.sunAt[2]);
    const nearY = pt(0, WORLD.d).y;
    bg += el("ellipse", { cx:PAGE.w / 2, cy:nearY + 68, rx:PAGE.w * 0.47, ry:26, fill:INK, opacity:0.18 }) +
      el("path", { d:isl(46), fill:sc.cliff }) + el("path", { d:isl(46), fill:INK, opacity:0.18 }) +
      el("path", { d:isl(0), fill:sc.ground }) +
      el("path", { d:isl(0), fill:light(sc.ground, 0.16), transform:"translate(0 -2)", opacity:0.6 });

    /* the scenery */
    (TALL ? tallProps(sc.props) : wideProps(sc.props)).forEach(p => {
      const fn = PROPS[p[0]]; if(!fn) return;
      put(p[2], fn.apply(null, p.slice(1)));
    });

    /* who is standing where, so a square knows whether it is held */
    const byKey = {};
    (o.units || []).forEach((u, i) => { const k = u.pos.r + "," + u.pos.c; (byKey[k] = byKey[k] || []).push({ u, i }); });

    /* The roads. A lattice board has four of them, one per lane, running the
       whole way — and every lane change is a trail of footprints between two
       of them, which on that board is every square to every neighbour and
       comes to a hundred identical paths saying a rule that never varies.

       A road map sends its own ways instead, and each one is a piece of real
       road laid between two squares. There are half as many and every one of
       them is somewhere you can actually go. */
    const ways = b.ways, rowCols = {};
    b.nodes.forEach(n => (rowCols[n.r] = rowCols[n.r] || []).push(n.c));
    if(ways){
      const seen = {};
      const lay = (p, q) => {
        const kk = p.r+","+p.c+">"+q.r+","+q.c; if(seen[kk]) return; seen[kk] = 1;
        const A = L.at(p.r, p.c), B = L.at(q.r, q.c);
        put(Math.min(L.depth(p.r, p.c), L.depth(q.r, q.c)) - 0.6, road(sc, A, B, 26));
      };
      (rowCols[1] || []).forEach(c => lay({ r:0, c:1 }, { r:1, c }));
      ways.forEach(w => lay({ r:w[0], c:w[1] }, { r:w[0] + 1, c:w[2] }));
      (rowCols[rows] || []).forEach(c => lay({ r:rows, c }, { r:rows + 1, c:1 }));
    } else {
      for(let c = 0; c < 4; c++){
        const a = L.at(1, c), z = L.at(rows, c), dx = z.x - a.x, dy = z.y - a.y, len = Math.hypot(dx, dy) || 1, ex = dx / len * 30, ey = dy / len * 30;
        put(L.laneDepth(c), road(sc, { x:a.x - ex, y:a.y - ey }, { x:z.x + ex, y:z.y + ey }, 40));
      }
      for(let rr = 0; rr <= rows; rr++){
        const froms = rr === 0 ? [{ r:0, c:1 }] : [0,1,2,3].map(c => ({ r:rr, c }));
        froms.forEach(p => {
          const nxt = p.r >= rows ? [{ r:rows + 1, c:1 }] : p.r === 0 ? [0,1,2,3].map(c => ({ r:1, c })) :
            [p.c - 1, p.c, p.c + 1].filter(c => c >= 0 && c < 4).map(c => ({ r:p.r + 1, c }));
          nxt.forEach(q => {
            if(p.r >= 1 && p.r <= rows && q.r <= rows && q.c === p.c) return;
            const A = L.at(p.r, p.c), B = L.at(q.r, q.c);
            put(Math.min(L.depth(p.r, p.c), L.depth(q.r, q.c)) - 0.5,
              el("line", { x1:A.x, y1:A.y, x2:B.x, y2:B.y, stroke:sc.dash, "stroke-width":3, "stroke-dasharray":"1 8", "stroke-linecap":"round", opacity:0.5 }));
          });
        });
      }
    }

    /* the squares */
    const thOf = lit2 => lit2 ? (sc.nodeKind === "obsidian" ? 15 : sc.nodeKind === "pebble" ? 9 : 13)
                              : (sc.nodeKind === "obsidian" ? 9 : sc.nodeKind === "pebble" ? 4 : 7);
    b.nodes.forEach(nd => {
      const p = L.at(nd.r, nd.c), key = nd.r + "," + nd.c, isLit = !!lit[key], held = !!byKey[key];
      const col = nd.t === "CARD" ? GOOD : nd.t === "WILD" ? VIOLET : COL[nd.c];
      const short = label(nd) || "", th = thOf(isLit), solid = isLit || held;
      const ink = nodeInk(sc.nodeKind, col, solid);
      /* The square wears its twist's own print rather than the word — the
         badge the phone shows on the round notice, at the size of a coin.
         A plain square wears nothing but a dot, so plain reads as plain. The
         legend on the wall says what each print is. */
      let inner = "";
      if(held || nd.t === "WILD") inner = "";
      else if(nd.t === "CARD" || (short && art.MOD_ART[nd.t])) inner = print(nd.t, p.x, p.y - th, 14);
      else inner = el("circle", { cx:p.x, cy:p.y - th, r:4, fill:col, opacity:0.55 });
      if(o.picked && o.picked.r === nd.r && o.picked.c === nd.c) inner += chosen(p.x, p.y - th, col);
      put(L.depth(nd.r, nd.c), node(sc, p.x, p.y, col, { lit:isLit, raise:isLit, held, inner, dash:nd.t === "WILD", dimmed:dim && !isLit }));
      if(nd.t === "WILD") put(L.depth(nd.r, nd.c) + 0.02,
        '<g opacity="' + (dim && !isLit ? 0.4 : 1) + '">' + wildSign(p.x, p.y - th * NS, { lit:isLit, held }) + "</g>");
    });
    /* the start: a stone; the finish: the place's own square, in ink, with a flag beside it */
    const s0 = L.at(0, 1), e0 = L.at(rows + 1, 1);
    put(L.depth(0, 1) - 0.01, '<g opacity="' + (dim ? 0.4 : 1) + '">' + el("ellipse", { cx:s0.x, cy:s0.y + 3, rx:22, ry:13, fill:INK, opacity:0.16 }) +
      el("ellipse", { cx:s0.x, cy:s0.y + 4, rx:20, ry:11, fill:dark(sc.ground, 0.35) }) +
      el("ellipse", { cx:s0.x, cy:s0.y, rx:20, ry:11, fill:light(sc.ground, 0.45) }) + "</g>");
    const endKey = (rows + 1) + ",1", endLit = !!lit[endKey], endHeld = !!byKey[endKey];
    const endPick = o.picked && o.picked.r > rows;
    put(L.depth(rows + 1, 1), node(sc, e0.x, e0.y, INK, { lit:endLit, raise:endLit, held:true, dimmed:dim && !endLit, inner:
      (endHeld ? "" : el("text", { x:e0.x, y:e0.y - thOf(endLit) + 4, "text-anchor":"middle", "font-family":"Assistant,sans-serif", "font-size":11, "font-weight":800, fill:"#FFFFFF" }, esc(o.endText || "END"))) +
      (endPick ? chosen(e0.x, e0.y - thOf(endLit), GOOD) : "") }) +
      flag(L.flag.u, L.flag.v, 1.0));

    /* the cast: everybody who is standing on a square, and beside the last of
       them the twist's own badge, so the rule they stand on stays on the map */
    Object.keys(byKey).forEach(k => {
      const [rr, cc] = k.split(",").map(Number), list = byKey[k], p0 = L.at(rr, cc), top = thOf(false) + 1;
      list.forEach((e, j) => {
        const x = p0.x + (j - (list.length - 1) / 2) * 26, y = p0.y - top;
        const was = o.from ? o.from(e.u) : null;
        let from = null;
        if(was && was !== k){
          const [fr, fc] = String(was).split(",").map(Number);
          if(fr >= 0 && fr <= rows + 1 && fc >= 0 && fc <= 3){ const q = L.at(fr, fc); from = { x:q.x, y:q.y - top }; }
        }
        const nd = b.nodes.find(q => q.r === rr && q.c === cc);
        /* a still of the hop, for a page that cannot play it: the figure a
           fraction of the way along the arc, its shadow left on the ground */
        const pose = o.pose && o.pose.id === e.u.id && from ? o.pose.t : null;
        if(pose !== null){
          const px = from.x + (x - from.x) * pose, py = from.y + (y - from.y) * pose - Math.sin(pose * Math.PI) * 70;
          put(L.depth(rr, cc) + 4,
            el("ellipse", { cx:px, cy:from.y + (y - from.y) * pose, rx:22 * (1 - 0.45 * Math.sin(pose * Math.PI)), ry:9 * (1 - 0.45 * Math.sin(pose * Math.PI)), fill:INK, opacity:0.3, filter:"url(#soft)" }) +
            figure(e.u, px, py, 1.35, { seed:e.i, noShadow:true }));
          return;
        }
        put(L.depth(rr, cc) + 0.05 + (from ? 4 : 0),
          figure(e.u, x, y, 1.35, { from, seed:e.i }) +
          (nd && j === list.length - 1 ? badge(nd.t, x + 26, y - 44, 11) : ""));
      });
    });

    layers.sort((a, b2) => a.v - b2.v);
    return bg + layers.map(l => l.svg).join("");
  }

  function draw(o){
    /* --t is how far into every ambient motion this drawing is, so a redraw
       a second later does not send the clouds back to where they started */
    T0 = o.still ? 0 : (Date.now() / 1000) % 3600;
    const body = scene(o);
    return '<svg class="board world' + (TALL ? " tall" : "") + '" viewBox="0 0 ' + PAGE.w + ' ' + PAGE.h +
      '" role="img" style="--t:' + (-T0).toFixed(2) + 's">' + defs() + body + "</svg>";
  }

  /* ---------------- what a place sounds like ----------------
     Synthesised, like every sound the phone makes — no recordings, so no
     files. Each place is a bed of filtered noise breathing under a slow
     swell, and a few things that happen now and then. Quiet, looped, and
     only while the screen has been asked for it. */
  let actx = null, master = null, live = [], timers = [], playing = null;
  function actxReady(){
    if(actx){ try{ if(actx.state === "suspended" && actx.resume) actx.resume().catch(() => {}); }catch(e){} return actx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    try{ actx = new AC(); master = actx.createGain(); master.gain.value = 0.7; master.connect(actx.destination); }
    catch(e){ actx = null; }
    return actx;
  }
  let nbuf = null;
  function noiseBuf(){
    if(nbuf) return nbuf;
    nbuf = actx.createBuffer(1, Math.floor(actx.sampleRate * 2), actx.sampleRate);
    const d = nbuf.getChannelData(0);
    for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return nbuf;
  }
  /* a bed: noise through one filter, its level swelling on a slow LFO */
  function bed(o){
    const src = actx.createBufferSource(); src.buffer = noiseBuf(); src.loop = true;
    const f = actx.createBiquadFilter(); f.type = o.type || "lowpass"; f.frequency.value = o.f; f.Q.value = o.q || 0.7;
    const g = actx.createGain(); g.gain.value = o.g;
    const lfo = actx.createOscillator(), lg = actx.createGain();
    lfo.frequency.value = o.lfo || 0.1; lg.gain.value = o.g * (o.depth || 0.5);
    lfo.connect(lg); lg.connect(g.gain);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(); lfo.start();
    live.push(src, lfo);
  }
  function drone(f, g){
    const osc = actx.createOscillator(), gn = actx.createGain();
    osc.type = "sine"; osc.frequency.value = f; gn.gain.value = g;
    osc.connect(gn); gn.connect(master); osc.start(); live.push(osc);
  }
  /* one shaped tone, the phone's own instrument */
  function blip(o){
    const t = actx.currentTime + (o.at || 0.01), a = o.a || 0.01, d = o.d || 0.15;
    const g = actx.createGain(), osc = actx.createOscillator();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(Math.max(20, o.f), t);
    if(o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + a + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.g || 0.05), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + a + d + 0.05);
  }
  /* a burst of noise: thunder, a hiss of steam */
  function burst(o){
    const t = actx.currentTime + (o.at || 0.01), d = o.d || 0.8;
    const s = actx.createBufferSource(); s.buffer = noiseBuf(); s.loop = true;
    const f = actx.createBiquadFilter(); f.type = o.type || "lowpass"; f.frequency.value = o.f; f.Q.value = o.q || 0.7;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.g || 0.08, t + (o.a || 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + d + 0.05);
  }
  function every(lo, hi, fn){
    const go = () => { if(!actx) return; try{ fn(); }catch(e){} timers.push(setTimeout(go, (lo + Math.random() * (hi - lo)) * 1000)); };
    timers.push(setTimeout(go, (lo * 0.5 + Math.random() * lo * 0.5) * 1000));
  }
  const PLACES = {
    classic: () => {
      bed({ type:"lowpass", f:500, g:0.045, lfo:0.12, depth:0.5 });
      every(2.5, 6, () => { const f = 2400 + Math.random() * 800;
        [0, 0.09, 0.19].forEach((at, i) => blip({ f:f * (1 + i * 0.06), to:f * 1.3, d:0.08, g:0.045, at })); });
      every(18, 35, () => { blip({ f:560, type:"square", d:0.35, g:0.028 }); blip({ f:845, type:"square", d:0.25, g:0.018 }); });
    },
    twist: () => {
      bed({ type:"bandpass", f:3800, q:12, g:0.035, lfo:9, depth:0.8 });
      bed({ type:"lowpass", f:300, g:0.03, lfo:0.09, depth:0.5 });
      every(1.5, 4, () => blip({ f:1400, to:700, d:0.18, g:0.045 }));
      every(12, 25, () => [0, 0.16].forEach(at => blip({ f:800, to:1400, type:"sawtooth", d:0.12, g:0.018, at })));
    },
    storm: () => {
      bed({ type:"bandpass", f:320, q:0.6, g:0.09, lfo:0.08, depth:0.7 });
      bed({ type:"lowpass", f:180, g:0.06, lfo:0.11, depth:0.9 });
      every(12, 28, () => { burst({ f:90, g:0.12, a:0.15, d:1.8 }); blip({ f:48, d:1.4, g:0.07, a:0.1 }); });
    },
    sprint: () => {
      bed({ type:"bandpass", f:900, q:0.5, g:0.035, lfo:0.07, depth:0.6 });
      every(9, 16, () => { const N = [392, 440, 523, 587, 659];
        [0, 0.5, 1.0].forEach(at => { const f = N[Math.floor(Math.random() * N.length)]; blip({ f, to:f * 1.01, type:"triangle", d:0.55, g:0.03, a:0.08, at }); }); });
    },
    chaos: () => {
      bed({ type:"lowpass", f:70, g:0.14, lfo:0.05, depth:0.5 });
      drone(38, 0.05);
      every(1.5, 4, () => blip({ f:170, to:85, d:0.09, g:0.05 }));
      every(8, 15, () => burst({ type:"bandpass", f:2500, q:1, g:0.03, a:0.05, d:0.5 }));
    }
  };
  const placeOf = id => SCENES[id] ? id : "classic";
  function ambience(mapId){
    mapId = mapId ? placeOf(mapId) : null;
    if(playing === mapId) return;
    live.forEach(n => { try{ n.stop(); }catch(e){} try{ n.disconnect(); }catch(e){} });
    timers.forEach(clearTimeout);
    live = []; timers = []; playing = null;
    if(!mapId || !PLACES[mapId] || !actxReady()) return;
    PLACES[mapId]();
    playing = mapId;
  }

  /* a browser will not sound until the page has been touched; the switch
     that asks for the place is a touch, but a screen set up with ?sound and
     left alone is not — so the first tap anywhere wakes it */
  try{ document.addEventListener("pointerdown", () => { if(actx && actx.state === "suspended") actx.resume().catch(() => {}); }, { passive:true, capture:true }); }catch(e){}

  return { draw, ambience, SCENES, THEMES, COASTS,
           /* the canvas at design/world/ draws its sheets with these */
           parts:{ figure, node, badge, coin, defs, orient, layout, lanesOf, el, pt } };
})();
