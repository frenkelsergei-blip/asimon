/* The map as a place — the canvas.

   The screen in the room draws every board as somewhere you could stand: a
   farm, a jungle, a coast in a storm, a desert, a volcano, one place for each
   painted map, with the racers standing on it and a move as a hop. This is
   the canvas it was designed on, and it is drawn by the very file that ships
   — public/worldart.js, evaluated here with just enough of a browser around
   it — so the canvas and the wall cannot disagree. Everything else on the
   sheets is a real engine state, the game's own words, and the palette out of
   style.css, for the same reason.

   What the canvas adds to the wall's drawing is the still: a hop frozen part
   way along its arc, which a page that plays the hop never needs.

   Run:  node design/world/build.js                                            */
"use strict";
const fs = require("fs");
const path = require("path");
const play = require("../../game/play");

const P = f => path.join(__dirname, "../../public", f);

/* ---------------- the palette, read off the sheet ---------------- */
const CSS = fs.readFileSync(P("style.css"), "utf8");
const ROOT = CSS.slice(CSS.indexOf(":root{"), CSS.indexOf("\n}", CSS.indexOf(":root{")) + 2);
const VARS = {};
ROOT.replace(/--([\w-]+):\s*([^;]+);/g, (m, k, v) => { VARS["--" + k] = v.trim(); return m; });
const tok = name => { const v = VARS["--" + name] || ""; const r = v.match(/^var\(--([\w-]+)\)$/); return r ? tok(r[1]) : v; };
const INK = tok("ink"), AMBER = tok("blind");

/* ---------------- the drawing, lifted whole ----------------
   art.js and worldart.js are browser files. They are given a window that can
   answer the two questions they ask of one — whether motion is wanted, and
   what a custom property is worth — and nothing else. */
const win = { matchMedia: () => ({ matches:false }) };
const doc = { documentElement:{}, addEventListener(){} };
const gcs = () => ({ getPropertyValue: n => VARS[n] || "" });
const art = {};
new Function("window", "document", "getComputedStyle", "g",
  fs.readFileSync(P("art.js"), "utf8") + "\n" +
  fs.readFileSync(P("worldart.js"), "utf8") +
  "\ng.faceSvg = faceSvg; g.world = window.asimonWorld;")(win, doc, gcs, art);
const W = art.world, SCENES = W.SCENES;

/* ---------------- a real room, so the board is a real board ---------------- */
const NAMES = { he:["סבתא","אילן","נועה","דנה"], en:["Savta","Ilan","Noa","Dana"] };
const CAST = ["grandma","beard","curly","girl"];
function room(lang, mapId, roads){
  const r = { code:"NF2S", lang, hostId:"p0", phase:"lobby", mapId, roads:!!roads, lanUrl:"http://192.168.1.80:3000",
    players: NAMES[lang].map((n, i) => ({ id:"p"+i, name:n, face:CAST[i], online:true })),
    people:  NAMES[lang].map((n, i) => ({ id:"p"+i, name:n, face:CAST[i], phoneId:"p"+i })) };
  play.startGame(r, { seating:"solo", gameMode:"regular" });
  r.engine.S.units.forEach((u, i) => { u.name = NAMES[lang][i]; u.members = ["p"+i]; });
  return r;
}
/* where each unit stands — on a road board, the nearest square that is there */
function place(r, rows){
  const nodes = play.boardView(r).board.nodes;
  rows.forEach((row, i) => {
    const u = r.engine.S.units[i];
    const nd = nodes.find(n => n.r === row.r && n.c === row.c) || nodes.find(n => n.r === row.r) || nodes[i * 3];
    u.pos = { r:nd.r, c:nd.c }; u.score = row.score || 0;
  });
}
const PACK = { he:play.uiPack("he"), en:play.uiPack("en") };
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* o.lang, o.mapId, o.units, o.spots, o.from (unit id -> "r,c"), o.pose {id,t}, o.tall, o.view */
function sceneSvg(o){
  const lang = o.lang || "he", r = room(lang, o.mapId, o.roads); place(r, o.units);
  const st = play.boardView(r), pk = PACK[lang];
  const svg = W.draw({
    board: st.board, units: st.units, spots: o.spots || [], still: true,
    label: n => n.t === "CARD" ? pk.ui.card_node : n.t === "WILD" ? "" : ((pk.mods[n.t] || {}).s || ""),
    endText: lang === "he" ? "סוף" : "END", rtl: lang === "he", tall: !!o.tall,
    from: u => (o.from && o.from[u.id]) || null, pose: o.pose || null
  });
  return { svg: o.view ? svg.replace(/viewBox="[^"]+"/, 'viewBox="' + o.view + '"') : svg, st };
}

/* the single quiet line under the map on the wall */
function foot(lang, o){
  const he = lang === "he";
  const K = "font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.5)";
  return '<div style="position:absolute;left:0;right:0;bottom:0;height:52px;background:' + INK + ';color:#fff;display:flex;align-items:center;gap:28px;padding:0 28px;font-family:Assistant,sans-serif" dir="' + (he ? "rtl" : "ltr") + '">' +
    '<div style="display:flex;align-items:baseline;gap:10px"><span style="' + K + '">' + (he ? "חדר" : "room") + '</span>' +
      '<b style="font-family:\'Suez One\',Georgia,serif;font-weight:400;font-size:24px;letter-spacing:.12em;direction:ltr">NF2S</b></div>' +
    '<div style="display:flex;align-items:baseline;gap:10px"><span style="' + K + '">' + (he ? "להצטרף מהטלפון" : "join from a phone") + '</span>' +
      '<b style="font-size:16px;font-weight:700;direction:ltr">192.168.1.80:3000</b></div>' +
    '<div style="display:flex;align-items:baseline;gap:10px"><span style="' + K + '">' + (he ? "הלוח" : "board") + '</span>' +
      '<b style="font-size:16px;font-weight:800">' + o.map + '</b></div>' +
    '<div style="flex:1"></div>' +
    '<div style="display:flex;align-items:baseline;gap:10px"><span style="' + K + '">' + (he ? "סבב " + o.round : "round " + o.round) + '</span>' +
      '<b style="font-family:\'Suez One\',Georgia,serif;font-weight:400;font-size:26px;direction:ltr">' + o.clock + '</b></div></div>';
}

/* ---------------- the artboards ---------------- */
/* the wall's own motion, so the sheets move the way the wall does */
const BCSS = fs.readFileSync(P("board.css"), "utf8");
const MOTION = BCSS.slice(BCSS.indexOf(".board.world{"), BCSS.indexOf("@keyframes w-hopshadow"));
const HEAD = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&family=Rubik:wght@800&family=Suez+One&display=swap">\n' +
  "  <style>\n" + ROOT + "\n  body{margin:0;background:#F4F1E7;font-family:Assistant,'Arial Hebrew',Arial,sans-serif}\n" +
  "  a{color:" + tok("accent") + "} a:hover{color:" + tok("accent-deep") + "}\n  .board{width:100%;height:100%;display:block}\n" +
  MOTION + "\n  </style>\n";
const dc = (w, h, body) => '<!doctype html>\n<html>\n<head><meta charset="utf-8"><script src="./support.js"></script></head>\n<body>\n<x-dc>\n<helmet>\n  ' + HEAD + '</helmet>\n' +
  '<div style="position:relative;width:' + w + 'px;height:' + h + 'px;overflow:hidden;background:#F4F1E7">' + body + '</div>\n</x-dc>\n</body>\n</html>\n';

const STAND = {
  classic:[{ r:6, c:1, score:6 }, { r:5, c:2, score:4 }, { r:3, c:0, score:3 }, { r:1, c:3, score:2 }],
  twist:  [{ r:9, c:2, score:8 }, { r:7, c:1, score:6 }, { r:7, c:1, score:5 }, { r:4, c:3, score:3 }],
  storm:  [{ r:11, c:3, score:9 }, { r:8, c:0, score:6 }, { r:6, c:2, score:5 }, { r:2, c:1, score:2 }],
  sprint: [{ r:8, c:1, score:7 }, { r:6, c:0, score:5 }, { r:5, c:2, score:4 }, { r:3, c:3, score:3 }],
  chaos:  [{ r:10, c:2, score:8 }, { r:9, c:3, score:7 }, { r:5, c:1, score:4 }, { r:0, c:1, score:0 }],
  crossroads:[{ r:9, c:1, score:7 }, { r:6, c:2, score:5 }, { r:6, c:2, score:5 }, { r:3, c:3, score:3 }]
};
/* the boards are named on the phone, not in the pack; the wall names them the same way */
const MAP_NAMES = { he:{ classic:"קלאסי", twist:"תפנית", storm:"סופה", sprint:"ספרינט", chaos:"תוהו ובוהו" },
                    en:{ classic:"Classic", twist:"Twist", storm:"Storm", sprint:"Sprint", chaos:"Chaos" } };
const mapName = (lang, id) => MAP_NAMES[lang][id] || id;
const OUT = {};

/* A–E: the five places, as the map on the wall shows them */
const ORDER = ["classic","twist","storm","sprint","chaos"];
const FILES = { classic:"Main.dc.html", twist:"Jungle.dc.html", storm:"Storm.dc.html", sprint:"Sprint.dc.html", chaos:"Chaos.dc.html" };
ORDER.forEach((id, i) => {
  const s = sceneSvg({ lang:"he", mapId:id, units:STAND[id] });
  OUT[FILES[id]] = dc(1280, 720, s.svg + foot("he", { map:mapName("he", id), round:4 + i, clock:"1:0" + (7 - i) }));
});
/* F: the same farm, in English, running the other way */
{
  const s = sceneSvg({ lang:"en", mapId:"classic", units:STAND.classic });
  OUT["English.dc.html"] = dc(1280, 720, s.svg + foot("en", { map:mapName("en", "classic"), round:4, clock:"1:07" }));
}
/* L: the volcano laid as Crossroads — the same place, a piece of road per way */
{
  const s = sceneSvg({ lang:"he", mapId:"chaos", roads:true, units:STAND.crossroads });
  OUT["Crossroads.dc.html"] = dc(1280, 720, s.svg + foot("he", { map:mapName("he", "chaos") + " · פרשת דרכים", round:5, clock:"1:02" }));
}

/* G: a move, in four frames. Noa (curly, unit 2) is on 3,0 and goes to 4,1. */
{
  const from = { r:3, c:0 }, to = { r:4, c:1 };
  const before = [{ r:6, c:1, score:6 }, { r:5, c:2, score:4 }, from, { r:1, c:3, score:2 }];
  const after  = [{ r:6, c:1, score:6 }, { r:5, c:2, score:4 }, to, { r:1, c:3, score:2 }];
  const probe = sceneSvg({ lang:"he", mapId:"classic", units:before });
  const NOA = probe.st.units[2].id, was = {}; was[NOA] = from.r + "," + from.c;
  W.parts.orient(false);
  const L = W.parts.layout(probe.st.board.rows, true), A = L.at(from.r, from.c), B = L.at(to.r, to.c);
  const cx = (A.x + B.x) / 2, cy = (A.y + B.y) / 2, view = Math.round(cx - 300) + " " + Math.round(cy - 175) + " 600 300";
  const frames = [
    { he:"המשבצות שאפשר לעמוד עליהן עולות. כל השאר נסוג.", en:"The squares you may stand on rise. Everything else steps back.",
      o:{ units:before, spots:[{ r:4, c:0 }, to] } },
    { he:"נועה בחרה. הדמות מתרוממת מהמשבצת, הצל נשאר.", en:"Noa has chosen. The figure lifts off its square; the shadow stays.",
      o:{ units:after, from:was, pose:{ id:NOA, t:0.12 } } },
    { he:"קפיצה אחת — קשת, לא הופעה במקום אחר.", en:"One hop: an arc, not a token that reappears somewhere else.",
      o:{ units:after, from:was, pose:{ id:NOA, t:0.5 } } },
    { he:"נחיתה. הדמות נמעכת לרגע, הדיסקית מאירה.", en:"Landing. The figure squashes for a beat and the disc lights.",
      o:{ units:after, spots:[to] } }
  ];
  let body = '<div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:24px;padding:24px 24px 0" dir="rtl">';
  frames.forEach((f, i) => {
    const s = sceneSvg(Object.assign({ lang:"he", mapId:"classic", view }, f.o));
    body += '<div style="display:flex;flex-direction:column;gap:10px">' +
      '<div style="border-radius:16px;overflow:hidden;box-shadow:0 10px 24px rgba(23,22,28,.18);aspect-ratio:2/1">' + s.svg + '</div>' +
      '<div style="display:flex;gap:12px;align-items:baseline;padding:0 6px">' +
        '<b style="font-family:\'Suez One\',Georgia,serif;font-weight:400;font-size:22px;color:' + tok("muted") + '">' + (i + 1) + '</b>' +
        '<div><p style="margin:0;font-size:17px;font-weight:700;color:' + INK + '">' + f.he + '</p>' +
        '<p style="margin:2px 0 0;font-size:14px;color:' + tok("muted") + '" dir="ltr">' + f.en + '</p></div></div></div>';
  });
  OUT["Motion.dc.html"] = dc(1280, 800, body + "</div>");
}

/* H: the cast, every face standing on the farm's own square, a twist beside each */
{
  const faces = art.faceSvg ? Object.keys((() => { const o = {}; ["boy","girl","grandpa","grandma","hippy","beard","curly","beanie","astro","robot","fox","cat","owl","frog","panda"].forEach(k => o[k] = 1); return o; })()) : [];
  const MODS = ["S","F","O","M","B","T","U","W","G","L","CARD","WILD","S","F","O"];
  const p = W.parts; p.orient(false);
  const COL = p.lanesOf("classic");
  let coins = "", figs = "";
  faces.forEach((id, i) => {
    const col = i % 8, row = Math.floor(i / 8), x = 90 + col * 150, y = 120 + row * 140, c = COL[i % 4];
    coins += p.node(SCENES.classic, x, y, c, { held:true });
    figs += p.figure({ face:id, name:id }, x, y - 7, 1.7, { seed:i }) + p.badge(MODS[i], x + 32, y - 60, 13);
  });
  OUT["Pins.dc.html"] = dc(1280, 380,
    '<div style="padding:34px 40px 28px"><p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:' + tok("muted") + '">the cast, standing up</p>' +
    '<svg viewBox="0 0 1200 300" width="1200" height="300" style="display:block">' + p.defs() + coins + figs + '</svg></div>');
}

/* I: the whole screen, with the place in the board's column, stood up */
{
  const s = sceneSvg({ lang:"he", mapId:"twist", units:STAND.twist, tall:true });
  const K = "font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;margin:0;";
  const facePx = (id, px) => art.faceSvg(id, px);
  const prow = (name, face, row, score, col, tag) =>
    '<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-top:1px solid ' + tok("rule") + '">' +
      '<span style="width:34px;height:34px;flex:0 0 34px;border-radius:50%;overflow:hidden">' + facePx(face, 34) + '</span>' +
      '<div style="flex:1;min-width:0"><div style="display:flex;align-items:baseline;gap:8px"><b style="font-size:17px">' + name + '</b>' +
        (tag ? '<span style="border-radius:999px;padding:2px 9px;font-size:11px;font-weight:800;background:' + tok("blind-soft") + ';color:' + tok("blind-ink") + '">' + tag + '</span>' : "") + '</div>' +
        '<div style="height:6px;border-radius:99px;background:' + tok("sunk") + ';margin-top:5px;overflow:hidden"><i style="display:block;height:100%;width:' + Math.round(row / 18 * 100) + '%;background:' + col + '"></i></div></div>' +
      '<b style="font-family:\'Suez One\',Georgia,serif;font-weight:400;font-size:26px;direction:ltr">' + score + '</b></div>';
  const body = '<div dir="rtl" style="position:absolute;inset:0;display:flex;flex-direction:column;background:' + tok("paper") + '">' +
    '<div style="background:' + INK + ';color:#fff;display:flex;align-items:center;gap:32px;padding:0 28px;height:64px">' +
      '<div style="display:flex;align-items:baseline;gap:10px"><span style="' + K + 'color:rgba(255,255,255,.5)">חדר</span><b style="font-family:\'Suez One\',Georgia,serif;font-weight:400;font-size:30px;letter-spacing:.12em;direction:ltr">NF2S</b></div>' +
      '<div style="display:flex;align-items:baseline;gap:10px"><span style="' + K + 'color:rgba(255,255,255,.5)">להצטרף מהטלפון</span><b style="font-size:17px;direction:ltr">192.168.1.80:3000</b></div>' +
      '<div style="flex:1"></div><div style="display:flex;align-items:baseline;gap:10px"><span style="' + K + 'color:rgba(255,255,255,.5)">הלוח</span><b style="font-size:17px">' + mapName("he", "twist") + '</b></div></div>' +
    '<div style="flex:1;display:flex;gap:18px;padding:18px;min-height:0">' +
      '<div style="width:420px;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(23,22,28,.16);position:relative;background:' + SCENES.twist.sky + '">' + s.svg + '</div>' +
      '<div style="flex:1;display:flex;flex-direction:column;gap:14px">' +
        '<div style="background:' + AMBER + ';color:#221700;border-radius:16px 16px 4px 4px;padding:16px 18px;display:flex;align-items:center;gap:14px">' +
          '<span style="width:50px;height:50px;flex:0 0 50px;border-radius:50%;box-shadow:0 0 0 3px rgba(255,255,255,.65);overflow:hidden">' + facePx("grandma", 50) + '</span>' +
          '<div style="flex:1;min-width:0"><p style="' + K + 'color:rgba(34,23,0,.62)">סבב 6</p><div style="font-size:22px;font-weight:800;line-height:1.12;margin-top:3px">סבתא נותנת רמז</div>' +
          '<p style="font-size:14px;font-weight:600;color:rgba(34,23,0,.72);margin:4px 0 0">משפט אחד. מי שקולט — צועק.</p></div>' +
          '<div style="font-family:\'Suez One\',Georgia,serif;font-weight:400;font-size:42px;line-height:.92;direction:ltr">1:07</div></div>' +
        '<div style="height:7px;margin-top:-14px;background:radial-gradient(circle at 4px 0,transparent 2.9px,' + AMBER + ' 3.3px) 0 0/8px 8px repeat-x"></div>' +
        '<div style="background:' + tok("surface") + ';border:1px solid ' + tok("rule") + ';border-radius:14px;padding:4px 16px 6px;flex:1">' +
          '<p style="' + K + 'color:' + tok("muted") + ';padding:10px 0 4px">השולחן</p>' +
          prow("סבתא", "grandma", 9, 8, "#2C6BFF", "נותנת") + prow("אילן", "beard", 7, 6, "#12B886") + prow("נועה", "curly", 7, 5, "#FF5A3D") + prow("דנה", "girl", 4, 3, "#D97706") +
        '</div></div></div></div>';
  OUT["Screen.dc.html"] = dc(1280, 720, body);
}

/* J, K: a tablet stood on its end — the race runs away from you */
["classic", "chaos"].forEach((id, i) => {
  const s = sceneSvg({ lang:"he", mapId:id, units:STAND[id], tall:true });
  OUT[(i ? "TallChaos" : "Tall") + ".dc.html"] = dc(820, 1180, s.svg + foot("he", { map:mapName("he", id), round:5, clock:"1:07" }));
});

/* ---------------- the canvas ---------------- */
const canvas = {
  artboards: [
    { file:"Main.dc.html",    x:0,    y:0,    w:1280, h:720, title:"A · קלאסי — חווה" },
    { file:"Jungle.dc.html",  x:1400, y:0,    w:1280, h:720, title:"B · תפנית — ג׳ונגל" },
    { file:"Storm.dc.html",   x:2800, y:0,    w:1280, h:720, title:"C · סופה — חוף בסערה" },
    { file:"Sprint.dc.html",  x:0,    y:860,  w:1280, h:720, title:"D · ספרינט — מדבר" },
    { file:"Chaos.dc.html",   x:1400, y:860,  w:1280, h:720, title:"E · תוהו ובוהו — הר געש" },
    { file:"English.dc.html", x:2800, y:860,  w:1280, h:720, title:"F · The farm, in English" },
    { file:"Motion.dc.html",  x:0,    y:1780, w:1280, h:800, title:"G · A move, in four frames" },
    { file:"Pins.dc.html",    x:1400, y:1780, w:1280, h:380, title:"H · The cast, standing" },
    { file:"Screen.dc.html",  x:1400, y:2300, w:1280, h:720, title:"I · In the whole screen" },
    { file:"Tall.dc.html",    x:2800, y:1780, w:820,  h:1180, title:"J · A tablet, stood up" },
    { file:"TallChaos.dc.html", x:3740, y:1780, w:820, h:1180, title:"K · The volcano, stood up" },
    { file:"Crossroads.dc.html", x:0,  y:3160, w:1280, h:720, title:"L · הר געש — מונח כפרשת דרכים" }
  ],
  annotations: [
    { id:"brief", x:0, y:-560, w:900, text:
      "The map as a place. Today the screen in the room draws the phone's board — four lanes of pills — and from the far end of a sofa it is a chart. This canvas draws the same board as somewhere you could stand: one scene per map, the racers on it as little figures, and a move as a hop from one square to the next.\n\n" +
      "Every sheet here is drawn by the file that ships, public/worldart.js, given a real engine state — the real rows, the real card and wildcard squares of that map, the real ways between squares on a road board — so the canvas and the wall cannot disagree. The lane colours are style.css's own. The figures are the faces out of public/art.js, stood up: a person is the bust the drawing already is, a creature keeps its disc, and one sheen over either is what makes a flat drawing read as a little model. The squares belong to their place — a slice of log on the farm, a bevelled block of stone in the jungle, a wet pebble on the coast, a glazed terracotta tile in the desert, a column of obsidian on the volcano — and each wears its twist's own print, the badge the phone shows on the round notice, rather than the word; a Legend in the wall's corner reads them. So do the roads belong: a sandy path, stepping stones, a cobbled causeway, flagstones, cooled lava with the heat still in the cracks. Each place has a coast of its own: the meadow rolls, the jungle bulges, the storm's rock is jagged, the desert is a mesa with its corners cut, the volcano is angular.\n\n" +
      "\"3D\" here means a tilted camera, a thickness under every square, and things that stand up in front of things behind them. No dependencies means no WebGL and no models, so this is hand-written SVG like every other drawing in Asimon. A move is a CSS transition on the figure's transform — the hop, the shadow shrinking under it, the squash on landing — and it goes still for anyone who has asked their device for less motion." },
    { id:"scenes", x:0, y:-200, w:900, text:
      "Which map is which place. Classic is the farm because it is the homely one. Twist is the jungle. Storm is the wild board, so it gets the weather — sea, a lighthouse, the one cloud with lightning in it. Sprint is short and never asks you to mime, so it is the desert with the flag at the end. Chaos is the volcano. Crossroads is not a place but a way to lay any of them: half the squares, roads laid between them, a junction every fifth row. L is the volcano laid that way — the ways it sends are laid as pieces of basalt road, one per way, and on the farm they would be sandy path, in the jungle stepping stones.\n\n" +
      "The word on a held square: the figure covers it and the twist's emblem stands beside the figure, so nothing shrinks and the rule stays readable. Only the wall draws the place; the phone keeps its flat board, because it is the one you tap." },
    { id:"alive", x:2800, y:3100, w:760, text:
      "The scenes move, slowly and at the edges. The windmill turns and the lighthouse beam sweeps — both on SVG's own animation with the centre written in, so they hold on any television's browser. Trees and palms sway. Clouds drift and drag their shadows across the ground. Birds cross the farm and the desert. The lightning flashes every seven seconds. On the volcano the smoke rises, the lava breathes, the stream runs, and the cracks in the road glow. Ponds shimmer. Waves lift. The figures breathe. Every wildcard square flies a question mark: a glowing sign with a thickness, hovering on a pulse of light with sparks about it — the one square worth being drawn to, and it says nothing about what it does. Nothing on the board itself moves unless the game moved it, and all of it goes still for anyone who has asked their device for less motion.\n\n" +
      "Each place sounds like itself, synthesised the way the phone's sounds are: the farm has a lark and now and then a cowbell; the jungle drips and hums with insects, a parrot squawks; the storm is wind with a far roll of thunder; the desert a dry wind and a hollow flute; the volcano a low rumble with the odd pop of a bubble. Off until somebody in the room asks — the corner switch, or ?sound on a screen set up once." },
    { id:"tall", x:2800, y:3400, w:760, text:
      "J and K are a tablet stood on its end. The race runs away from you, start nearest, finish at the far end under the flag, and the scenery stands along both sides. It is the same island turned deep instead of long, drawn by the same code with a smaller unit, so a tablet and a television show the same place. In the full screen (I) the board's column gets this shape too." },
    { id:"motion", x:0, y:2640, w:620, text:
      "G is one move, frozen four times. In the game these are four moments of one 750ms transition: the lit squares rise the instant the mover's phone shows them; the figure lifts and its shadow shrinks; it travels on an arc, not a line; it lands with a squash and the square under it lights for a beat. Nothing else on the map moves, because nothing else changed.\n\nH is every face in the cast standing on the farm's own square with a twist's emblem beside it, at the size it would be on a 1080p television." }
  ],
  launch: { view:"canvas" }
};

Object.keys(OUT).forEach(f => {
  fs.writeFileSync(path.join(__dirname, f), OUT[f]);
  console.log("  " + f + "  " + OUT[f].length.toLocaleString() + " bytes");
});
fs.writeFileSync(path.join(__dirname, "canvas.json"), JSON.stringify(canvas, null, 2) + "\n");
console.log("\n  " + Object.keys(OUT).length + " artboards, drawn by public/worldart.js\n");
