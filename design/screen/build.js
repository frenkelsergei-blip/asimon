/* The screen in the room, drawn with the game's own parts.

   Nothing here is an approximation. The faces come out of public/art.js, the
   board out of public/boardart.js drawing a real engine state, the palette out
   of public/style.css, and the words out of the engine's own dictionary — so
   an artboard cannot quietly disagree with the thing it is a design for.

   Run:  node design/screen/build.js                                          */
"use strict";
const fs = require("fs");
const path = require("path");
const play = require("../../game/play");

const P = f => path.join(__dirname, "../../public", f);

/* art.js and boardart.js are browser files; give them just enough of one */
const win = { matchMedia: () => ({ matches:false }) };
const art = {};
new Function("window", "g",
  fs.readFileSync(P("art.js"), "utf8") + "\n" +
  fs.readFileSync(P("boardart.js"), "utf8") +
  "\ng.faceSvg = faceSvg; g.coinMark = coinMark; g.board = window.asimonBoard;")(win, art);

/* the palette, lifted whole rather than retyped */
const CSS = fs.readFileSync(P("style.css"), "utf8");
const ROOT = CSS.slice(CSS.indexOf(":root{"), CSS.indexOf("\n}", CSS.indexOf(":root{")) + 2);

/* ---------------- a real room, so the board is a real board ---------------- */
const NAMES = { he: ["סבתא","אילן","נועה","דנה"], en: ["Savta","Ilan","Noa","Dana"] };
const FACES = ["grandma","beard","curly","girl"];

function room(lang, mapId){
  const r = {
    code:"NF2S", lang, hostId:"p0", phase:"lobby", mapId,
    lanUrl:"http://192.168.1.80:3000",
    players: NAMES[lang].map((n,i) => ({ id:"p"+i, name:n, face:FACES[i], online:true })),
    people:  NAMES[lang].map((n,i) => ({ id:"p"+i, name:n, face:FACES[i], phoneId:"p"+i }))
  };
  play.startGame(r, { seating:"solo", gameMode:"regular" });
  /* the shuffle is the game's; the artboards want a known order */
  r.engine.S.units.forEach((u,i) => { u.name = NAMES[lang][i]; u.members = ["p"+i]; });
  return r;
}
/* where each unit stands, and what it is holding */
function place(r, rows){
  rows.forEach((row, i) => {
    const u = r.engine.S.units[i];
    u.pos = { r:row.r, c:row.c };
    u.score = row.score;
    u.cards = Array.from({ length: row.cards || 0 }, () => "veto");
  });
}

const PACK = { he: play.uiPack("he"), en: play.uiPack("en") };
const face = (id, px) => art.faceSvg(id, px);
const t = (lang, k, a) => { const v = PACK[lang].ui[k] || k; return a === undefined ? v : String(v).split("{0}").join(a); };

function boardSvg(r, lang, spots){
  const st = play.boardView(r), pk = PACK[lang];
  return art.board.draw({
    board: st.board, units: st.units, spots: spots || [],
    label: n => n.t === "CARD" ? pk.ui.card_node : n.t === "WILD" ? "" : ((pk.mods[n.t] || {}).s || ""),
    endText: lang === "he" ? "סוף" : "END"
  });
}

/* ---------------- the pieces of the screen ---------------- */
const K = "font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;margin:0;";
const CARD = "background:var(--surface);border:1px solid var(--rule);border-radius:14px;";
const esc = s => String(s).replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));

/* the room bar. The code is the biggest thing on it, because it is the only
   thing on this screen anybody in the room has to act on. */
function head(lang, o){
  const fact = (label, value, big) =>
    '<div style="display:flex;flex-direction:column;line-height:1.1;gap:2px">'+
      '<span style="'+K+'color:rgba(255,255,255,.5)">'+label+'</span>'+
      '<b style="'+(big
        ? "font-family:'Suez One',Georgia,serif;font-weight:400;font-size:34px;letter-spacing:.12em;direction:ltr"
        : "font-size:20px;font-weight:800")+'">'+value+'</b></div>';
  return '<div style="display:flex;align-items:center;gap:24px;background:var(--ink);color:#fff;'+
    'border-radius:14px;padding:13px 22px;flex:0 0 auto">'+
    '<span style="display:flex;align-items:center;gap:10px">'+
      '<span style="width:28px;height:28px;display:block">'+art.coinMark(28)+'</span>'+
      '<span style="font-family:\'Rubik\',system-ui,sans-serif;font-weight:800;font-size:23px">'+
      (lang === "he" ? "אסימון" : "ASIMON")+'</span></span>'+
    '<span style="flex:1"></span>'+
    (o.round ? fact(lang === "he" ? "סבב" : "Round", o.round) : "")+
    fact(lang === "he" ? "הלוח" : "Board", o.map)+
    fact(lang === "he" ? "קצב" : "Speed", o.speed)+
    fact(lang === "he" ? "חדר" : "Room", o.code, true)+
    '<span style="width:9px;height:9px;border-radius:50%;background:var(--good);flex:0 0 auto"></span>'+
    '</div>';
}

/* The moment, as the phone's own receipt: a coloured block with the
   perforated edge under it. Amber while a word is in play, green when it has
   been said out loud, ink for everything procedural. */
const TONES = {
  amber: { bg:"var(--blind)",  ink:"#221700", soft:"rgba(34,23,0,.62)",   sub:"rgba(34,23,0,.72)" },
  green: { bg:"var(--good)",   ink:"#FFFFFF", soft:"rgba(255,255,255,.7)", sub:"rgba(255,255,255,.82)" },
  ink:   { bg:"var(--ink)",    ink:"#FFFFFF", soft:"rgba(255,255,255,.6)", sub:"rgba(255,255,255,.74)" }
};
function receipt(tone, o){
  const c = TONES[tone];
  const perf = 'background:radial-gradient(circle at 5px 0,transparent 3.6px,'+c.bg+' 4.1px) 0 0/10px 10px repeat-x;height:9px;';
  return '<div style="flex:0 0 auto">'+
    '<div style="background:'+c.bg+';color:'+c.ink+';border-radius:18px 18px 4px 4px;padding:20px 24px;'+
      'display:flex;align-items:center;gap:22px">'+
      (o.face ? '<span style="width:68px;height:68px;flex:0 0 68px;border-radius:50%;'+
        'box-shadow:0 0 0 3px rgba(255,255,255,.65)">'+face(o.face, 68)+'</span>' : '')+
      '<div style="flex:1;min-width:0">'+
        (o.kicker ? '<p style="'+K+'color:'+c.soft+'">'+o.kicker+'</p>' : '')+
        '<div style="'+(o.display
          ? "font-family:'Suez One',Georgia,serif;font-weight:400;font-size:56px;line-height:1.04;margin-top:6px"
          : "font-size:42px;font-weight:800;line-height:1.1;letter-spacing:-.015em;margin-top:6px")+
          '">'+o.head+'</div>'+
        (o.sub ? '<p style="font-size:18px;font-weight:600;color:'+c.sub+';margin:7px 0 0">'+o.sub+'</p>' : '')+
      '</div>'+
      (o.clock ? '<div style="font-family:\'Suez One\',Georgia,serif;font-weight:400;font-size:84px;'+
        'line-height:.92;direction:ltr;font-variant-numeric:tabular-nums;flex:0 0 auto">'+o.clock+'</div>' : '')+
      (o.stamp ? '<div style="font-size:22px;font-weight:800;background:rgba(255,255,255,.2);'+
        'border-radius:10px;padding:8px 16px;direction:ltr;flex:0 0 auto">'+o.stamp+'</div>' : '')+
    '</div><div style="'+perf+'"></div></div>';
}

const chip = (text, tone) =>
  '<span style="border-radius:999px;padding:8px 18px;font-size:15px;font-weight:800;'+
  (tone === "tone" ? "background:var(--blind-soft);color:var(--blind-ink)"
   : tone === "good" ? "background:var(--good-soft);color:var(--good-ink)"
   : "background:var(--sunk);color:var(--second)")+'">'+text+'</span>';
const chips = list => list.length
  ? '<div style="display:flex;gap:10px;flex:0 0 auto">'+list.join("")+'</div>' : '';

/* Where everybody stands. One row, one player: the name, how far up the board
   they are, and the score. No column of numbers repeating what the bar and
   the board already say. */
function standings(lang, rows, o){
  const opts = o || {};
  const tag = (text, kind) =>
    '<em style="font-style:normal;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;'+
    'padding:4px 10px;border-radius:999px;'+
    (kind === "giver" ? "background:var(--blind-soft);color:var(--blind-ink)"
     : kind === "out" ? "background:var(--guilty-soft);color:var(--guilty-ink)"
     : kind === "won" ? "background:var(--good-soft);color:var(--good-ink)"
     : "background:var(--sunk);color:var(--muted)")+'">'+text+'</em>';
  const body = rows.map((r, i) =>
    '<div style="display:grid;grid-template-columns:52px minmax(0,1fr) auto;align-items:center;'+
      'column-gap:18px;padding:'+(opts.tight ? 10 : 15)+'px 0;'+
      (i === rows.length-1 ? "" : "border-bottom:1px solid var(--hair);")+
      (r.out ? "opacity:.5" : "")+'">'+
      '<span style="width:52px;height:52px;display:block">'+face(r.face, 52)+'</span>'+
      '<span style="min-width:0">'+
        '<span style="display:flex;align-items:center;gap:10px;min-width:0">'+
          '<span style="font-size:26px;font-weight:800;overflow:hidden;text-overflow:ellipsis;'+
            'white-space:nowrap">'+esc(r.name)+'</span>'+
          (r.tag ? tag(r.tag[0], r.tag[1]) : "")+
          (r.cards ? tag(r.cards, "") : "")+
        '</span>'+
        '<span style="display:flex;align-items:center;gap:12px;margin-top:8px">'+
          '<span style="flex:1;height:10px;border-radius:999px;background:var(--hair);position:relative;'+
            'overflow:hidden;display:block">'+
            (r.ghost ? '<i style="position:absolute;inset-block:0;inset-inline-start:0;border-radius:999px;'+
              'width:'+Math.round(r.ghost/(opts.rows+1)*100)+'%;background:'+r.color+';opacity:.3"></i>' : "")+
            '<i style="position:absolute;inset-block:0;inset-inline-start:0;border-radius:999px;'+
              'width:'+Math.round(r.row/(opts.rows+1)*100)+'%;background:'+r.color+'"></i></span>'+
          '<span style="font-size:14px;font-weight:800;color:var(--faint);direction:ltr;'+
            'font-variant-numeric:tabular-nums">'+r.row+'/'+(opts.rows+1)+'</span>'+
        '</span>'+
      '</span>'+
      '<span style="display:flex;align-items:baseline;gap:8px;flex:0 0 auto">'+
        (r.gain ? '<span style="font-size:22px;font-weight:800;color:var(--good-ink)">'+r.gain+'</span>' : "")+
        '<span style="font-size:44px;font-weight:800;font-variant-numeric:tabular-nums;direction:ltr;'+
          'line-height:1">'+r.score+'</span>'+
        '<span style="'+K+'font-size:11px;color:var(--faint)">'+(lang === "he" ? "נק׳" : "pts")+'</span>'+
      '</span>'+
    '</div>').join("");
  return '<div style="'+CARD+'padding:4px 22px;flex:1;min-height:0;display:flex;flex-direction:column;'+
    'justify-content:center">'+body+'</div>';
}

function boardPane(r, lang, spots, w){
  const st = play.boardView(r);
  return '<div style="'+CARD+'padding:12px;display:flex;flex-direction:column;align-items:center;gap:8px;'+
    'min-height:0;overflow:hidden">'+
    '<span style="flex:1;min-height:0;display:flex;justify-content:center;width:100%">'+
      boardSvg(r, lang, spots).replace('class="board"',
        'style="width:100%;height:100%" preserveAspectRatio="xMidYMid meet"')+'</span>'+
    '<p style="font-size:13px;font-weight:800;color:var(--muted);margin:0;text-align:center">'+
      esc(mapName(lang, st.mapId))+' · '+t(lang, "board_k", st.rows + 1)+'</p></div>';
}
const MAPS = { he:{classic:"קלאסי",twist:"תפנית",storm:"סופה",sprint:"ספרינט",chaos:"תוהו ובוהו"},
               en:{classic:"Classic",twist:"Twist",storm:"Storm",sprint:"Sprint",chaos:"Chaos"} };
const SPEEDS = { he:{quick:"מהיר",regular:"רגיל",slow:"רגוע",challenge:"אתגר"},
                 en:{quick:"Quick",regular:"Regular",slow:"Slow",challenge:"Challenge"} };
const mapName = (lang, id) => MAPS[lang][id] || id;

/* ---------------- the artboard wrapper ---------------- */
const DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">'+
             '<defs><clipPath id="lsface"><circle cx="20" cy="20" r="20"/></clipPath></defs></svg>';

function artboard(lang, w, h, inner){
  return '<!doctype html>\n<html>\n<head><meta charset="utf-8"><script src="./support.js"></script></head>\n'+
    '<body>\n<x-dc>\n<helmet>\n'+
    '  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&family=Rubik:wght@800&family=Suez+One&display=swap">\n'+
    '  <style>\n' + ROOT + '\n'+
    '    body{margin:0;background:var(--paper)}\n'+
    '    a{color:var(--accent)}a:hover{color:var(--accent-deep)}\n'+
    '    .face{display:block}\n'+
    '  </style>\n</helmet>\n' + DEFS + '\n'+
    '<div dir="'+(lang === "he" ? "rtl" : "ltr")+'" style="width:'+w+'px;height:'+h+'px;'+
      'background:var(--paper);font-family:\'Assistant\',system-ui,sans-serif;color:var(--ink);'+
      'display:flex;flex-direction:column;gap:12px;padding:16px;box-sizing:border-box;overflow:hidden">\n'+
    inner + '\n</div>\n</x-dc>\n</body>\n</html>\n';
}
const body = (cols, left, right) =>
  '<div style="flex:1;min-height:0;display:grid;grid-template-columns:'+cols+';'+
  'grid-template-rows:minmax(0,1fr);gap:12px">'+left+'<div style="display:flex;flex-direction:column;'+
  'gap:12px;min-height:0">'+right+'</div></div>';

/* ================= the artboards ================= */
const OUT = {};
const TV = [1280, 720], COL = "331px minmax(0,1fr)";

/* ---- A · the clock ---- */
{
  const lang = "he", r = room(lang, "classic");
  place(r, [{r:5,c:1,score:6,cards:1},{r:4,c:2,score:4},{r:3,c:0,score:3},{r:1,c:2,score:2,cards:2}]);
  const rows = r.engine.ROWS();
  OUT["Main.dc.html"] = artboard(lang, TV[0], TV[1],
    head(lang, { round:"4", map:"קלאסי", speed:"רגיל", code:"NF2S" })+
    body(COL, boardPane(r, lang), [
      receipt("amber", { kicker:t(lang,"table_k",4), face:"grandma",
        head:"סבתא נותנת רמז", sub:"משפט אחד. מי שקולט — צועק.", clock:"1:07" }),
      chips([chip("כפול", "tone"), chip("בית")]),
      standings(lang, [
        { name:"סבתא", face:"grandma", row:5, score:6, color:"#2C6BFF", tag:["נותן/ת","giver"], cards:"קלף אחד" },
        { name:"אילן",  face:"beard",   row:4, score:4, color:"#12B886" },
        { name:"נועה",  face:"curly",   row:3, score:3, color:"#FF5A3D", tag:["פסול","out"], out:true },
        { name:"דנה",   face:"girl",    row:1, score:2, color:"#D97706", cards:"2 קלפים" }
      ], { rows })
    ].join("")));
}

/* ---- B · the word ---- */
{
  const lang = "he", r = room(lang, "classic");
  place(r, [{r:5,c:1,score:6,cards:1},{r:4,c:2,score:6},{r:3,c:0,score:3},{r:1,c:2,score:2,cards:2}]);
  const rows = r.engine.ROWS();
  OUT["Reveal.dc.html"] = artboard(lang, TV[0], TV[1],
    head(lang, { round:"4", map:"קלאסי", speed:"רגיל", code:"NF2S" })+
    body(COL, boardPane(r, lang), [
      receipt("green", { kicker:t(lang,"solved_k",4), face:"beard", display:true,
        head:"כרית", sub:"אילן קלט — ואילן וסבתא זזים", stamp:"0:38" }),
      chips([chip("כפול", "tone"), chip("בית")]),
      standings(lang, [
        { name:"אילן",  face:"beard",   row:4, ghost:6, score:6, gain:"+2", color:"#12B886" },
        { name:"סבתא", face:"grandma", row:5, ghost:6, score:6, gain:"+1", color:"#2C6BFF", tag:["נותן/ת","giver"], cards:"קלף אחד" },
        { name:"נועה",  face:"curly",   row:3, score:3, color:"#FF5A3D" },
        { name:"דנה",   face:"girl",    row:1, score:2, color:"#D97706", cards:"2 קלפים" }
      ], { rows })
    ].join("")));
}

/* ---- C · moving ---- */
{
  const lang = "he", r = room(lang, "twist");
  place(r, [{r:5,c:1,score:6,cards:1},{r:6,c:2,score:6},{r:3,c:0,score:3},{r:1,c:2,score:2,cards:2}]);
  const e = r.engine, rows = e.ROWS();
  const spots = e.reachable(e.posOf(e.S.units[1]), 2).map(p => ({ r:p.r, c:p.c }));
  OUT["Move.dc.html"] = artboard(lang, TV[0], TV[1],
    head(lang, { round:"4", map:"תפנית", speed:"רגיל", code:"NF2S" })+
    body(COL, boardPane(r, lang, spots), [
      receipt("ink", { kicker:"1 מתוך 2", face:"beard",
        head:"אילן זז על הלוח", sub:"שני צעדים — או אחד, ולעצור על משבצת טובה יותר." }),
      chips([]),
      standings(lang, [
        { name:"אילן",  face:"beard",   row:6, ghost:8, score:6, color:"#12B886", tag:["זז עכשיו","won"] },
        { name:"סבתא", face:"grandma", row:5, ghost:6, score:6, color:"#2C6BFF", cards:"קלף אחד" },
        { name:"נועה",  face:"curly",   row:3, score:3, color:"#FF5A3D" },
        { name:"דנה",   face:"girl",    row:1, score:2, color:"#D97706", cards:"2 קלפים" }
      ], { rows })
    ].join("")));
}

/* ---- D · before anyone starts ---- */
{
  const lang = "he";
  const seat = (name, faceId, tag) =>
    '<div style="display:grid;grid-template-columns:52px minmax(0,1fr) auto;align-items:center;'+
      'column-gap:18px;padding:16px 0;border-bottom:1px solid var(--hair)">'+
      '<span style="width:52px;height:52px;display:block">'+face(faceId, 52)+'</span>'+
      '<span style="font-size:26px;font-weight:800;display:flex;align-items:center;gap:10px">'+name+
        (tag ? '<em style="font-style:normal;font-size:12px;font-weight:800;letter-spacing:.08em;'+
          'text-transform:uppercase;padding:4px 10px;border-radius:999px;background:var(--blind-soft);'+
          'color:var(--blind-ink)">'+tag+'</em>' : "")+'</span>'+
      '<span style="width:10px;height:10px;border-radius:50%;background:var(--good)"></span></div>';
  OUT["Lobby.dc.html"] = artboard(lang, TV[0], TV[1],
    head(lang, { map:"קלאסי", speed:"רגיל", code:"NF2S" })+
    '<div style="flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);'+
      'grid-template-rows:minmax(0,1fr);gap:12px">'+
      '<div style="background:var(--ink);color:#fff;border-radius:14px;padding:36px 40px;display:flex;'+
        'flex-direction:column;justify-content:center;gap:14px">'+
        '<p style="'+K+'color:rgba(255,255,255,.6)">חדר</p>'+
        '<div style="font-family:\'Suez One\',Georgia,serif;font-weight:400;font-size:104px;line-height:.94;'+
          'letter-spacing:.1em;direction:ltr">NF2S</div>'+
        '<p style="'+K+'color:rgba(255,255,255,.6);margin-top:18px">להצטרף מהטלפון</p>'+
        '<div style="font-size:24px;font-weight:700;direction:ltr;background:rgba(255,255,255,.12);'+
          'border-radius:10px;padding:14px 18px">http://192.168.1.80:3000</div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:12px;min-height:0">'+
        receipt("ink", { kicker:"מי בפנים", head:"מחכים שהמשחק יתחיל",
                         sub:"המארח/ת מתחיל/ה כשכולם בפנים." })+
        chips([chip("קלאסי"), chip("רגיל"), chip("כל אחד לעצמו")])+
        '<div style="'+CARD+'padding:4px 22px;flex:1;min-height:0;display:flex;flex-direction:column;'+
          'justify-content:center">'+
          seat("סבתא", "grandma", "מארח/ת")+seat("אילן", "beard")+
          seat("נועה", "curly")+seat("דנה", "girl").replace("border-bottom:1px solid var(--hair)", "")+
        '</div>'+
      '</div></div>');
}

/* ---- E · the end ---- */
{
  const lang = "he", r = room(lang, "classic");
  const rows = r.engine.ROWS();
  place(r, [{r:9,c:1,score:9,cards:1},{r:rows+1,c:1,score:11},{r:7,c:0,score:8},{r:6,c:2,score:5,cards:2}]);
  OUT["Podium.dc.html"] = artboard(lang, TV[0], TV[1],
    head(lang, { round:"11", map:"קלאסי", speed:"רגיל", code:"NF2S" })+
    body(COL, boardPane(r, lang), [
      receipt("green", { kicker:"נגמר", face:"beard", head:"אילן מנצח",
                         sub:"הראשון שהגיע לסוף הלוח, אחרי אחד עשר סבבים." })+
      chips([]),
      standings(lang, [
        { name:"אילן",  face:"beard",   row:rows+1, score:11, color:"#12B886", tag:["ניצח","won"] },
        { name:"סבתא", face:"grandma", row:9, score:9,  color:"#2C6BFF", cards:"קלף אחד" },
        { name:"נועה",  face:"curly",   row:7, score:8,  color:"#FF5A3D" },
        { name:"דנה",   face:"girl",    row:6, score:5,  color:"#D97706", cards:"2 קלפים" }
      ], { rows })
    ].join("")));
}

/* ---- F · the same screen in English ---- */
{
  const lang = "en", r = room(lang, "storm");
  place(r, [{r:5,c:1,score:6,cards:1},{r:4,c:2,score:4},{r:3,c:0,score:3},{r:1,c:2,score:2,cards:2}]);
  const rows = r.engine.ROWS();
  OUT["English.dc.html"] = artboard(lang, TV[0], TV[1],
    head(lang, { round:"4", map:"Storm", speed:"Regular", code:"NF2S" })+
    body(COL, boardPane(r, lang), [
      receipt("amber", { kicker:t(lang,"table_k",4), face:"grandma",
        head:"Savta is giving the clue", sub:"One sentence. Shout when you have it.", clock:"1:07" }),
      chips([chip("Double", "tone"), chip("Home")]),
      standings(lang, [
        { name:"Savta", face:"grandma", row:5, score:6, color:"#2C6BFF", tag:["giver","giver"], cards:"1 card" },
        { name:"Ilan",  face:"beard",   row:4, score:4, color:"#12B886" },
        { name:"Noa",   face:"curly",   row:3, score:3, color:"#FF5A3D", tag:["out","out"], out:true },
        { name:"Dana",  face:"girl",    row:1, score:2, color:"#D97706", cards:"2 cards" }
      ], { rows })
    ].join("")));
}

/* ---- G · a tablet, stood up ---- */
{
  const lang = "he", r = room(lang, "classic");
  place(r, [{r:5,c:1,score:6,cards:1},{r:4,c:2,score:4},{r:3,c:0,score:3},{r:1,c:2,score:2,cards:2}]);
  const rows = r.engine.ROWS();
  OUT["Tablet.dc.html"] = artboard(lang, 820, 1180,
    head(lang, { round:"4", map:"קלאסי", speed:"רגיל", code:"NF2S" })+
    receipt("amber", { kicker:t(lang,"table_k",4), face:"grandma",
      head:"סבתא נותנת רמז", sub:"משפט אחד. מי שקולט — צועק.", clock:"1:07" })+
    chips([chip("כפול", "tone"), chip("בית")])+
    '<div style="flex:1;min-height:0;display:grid;grid-template-rows:minmax(0,1fr) auto;gap:12px">'+
      boardPane(r, lang)+
      standings(lang, [
        { name:"סבתא", face:"grandma", row:5, score:6, color:"#2C6BFF", tag:["נותן/ת","giver"], cards:"קלף אחד" },
        { name:"אילן",  face:"beard",   row:4, score:4, color:"#12B886" },
        { name:"נועה",  face:"curly",   row:3, score:3, color:"#FF5A3D", tag:["פסול","out"], out:true },
        { name:"דנה",   face:"girl",    row:1, score:2, color:"#D97706", cards:"2 קלפים" }
      ], { rows, tight:true })+
    '</div>');
}

/* ---- H · the other direction: the board turned to fit the wall ----
   The board is portrait because a phone is. A television is not, so the same
   map turned on its side is two and a half times bigger for nothing — the
   race runs the way the room reads, right to left in Hebrew. The cost is that
   the wall and the phone no longer draw the same picture: on the phone the
   board still runs up the page, and somebody looking from one to the other has
   to turn it round in their head. That is the whole argument. */
{
  const lang = "he", r = room(lang, "classic");
  place(r, [{r:5,c:1,score:6,cards:1},{r:4,c:2,score:4},{r:3,c:0,score:3},{r:1,c:2,score:2,cards:2}]);
  const st = play.boardView(r), pk = PACK[lang], rows = r.engine.ROWS();
  const wide = art.board.draw({
    board: st.board, units: st.units, across: true, rtl: lang === "he",
    label: n => n.t === "CARD" ? pk.ui.card_node : n.t === "WILD" ? "" : ((pk.mods[n.t] || {}).s || ""),
    endText: "סוף"
  }).replace('class="board"', 'style="width:100%;height:100%;display:block" preserveAspectRatio="xMidYMid meet"');
  const slim = (name, faceId, score, color, row, tag) =>
    '<div style="display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;'+
      'column-gap:14px;padding:9px 0;border-bottom:1px solid var(--hair)">'+
      '<span style="width:44px;height:44px;display:block">'+face(faceId, 44)+'</span>'+
      '<span style="min-width:0">'+
        '<span style="display:flex;align-items:center;gap:8px"><span style="font-size:22px;font-weight:800">'+
          name+'</span>'+(tag ? '<em style="font-style:normal;font-size:11px;font-weight:800;'+
          'letter-spacing:.08em;padding:3px 9px;border-radius:999px;background:var(--blind-soft);'+
          'color:var(--blind-ink)">'+tag+'</em>' : "")+'</span>'+
        '<span style="display:block;height:8px;border-radius:999px;background:var(--hair);margin-top:6px;'+
          'position:relative;overflow:hidden"><i style="position:absolute;inset-block:0;'+
          'inset-inline-start:0;width:'+Math.round(row/(rows+1)*100)+'%;background:'+color+';'+
          'border-radius:999px"></i></span></span>'+
      '<span style="font-size:30px;font-weight:800;direction:ltr">'+score+'</span></div>';
  OUT["AltWide.dc.html"] = artboard(lang, TV[0], TV[1],
    head(lang, { round:"4", map:"קלאסי", speed:"רגיל", code:"NF2S" })+
    '<div style="'+CARD+'padding:12px 14px;flex:0 0 auto;height:336px;box-sizing:border-box">'+wide+'</div>'+
    '<div style="flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 470px;'+
      'grid-template-rows:minmax(0,1fr);gap:12px">'+
      '<div style="background:var(--blind);color:#221700;border-radius:18px;padding:26px 30px;'+
        'display:flex;align-items:center;gap:24px;min-height:0">'+
        '<span style="width:84px;height:84px;flex:0 0 84px;display:block;border-radius:50%;'+
          'box-shadow:0 0 0 3px rgba(255,255,255,.65)">'+face("grandma", 84)+'</span>'+
        '<div style="flex:1;min-width:0">'+
          '<p style="'+K+'color:rgba(34,23,0,.6)">'+t(lang,"table_k",4)+' · כפול · בית</p>'+
          '<div style="font-size:46px;font-weight:800;line-height:1.08;margin-top:6px">סבתא נותנת רמז</div>'+
          '<p style="font-size:19px;font-weight:600;color:rgba(34,23,0,.72);margin:6px 0 0">'+
            'משפט אחד. מי שקולט — צועק.</p></div>'+
        '<div style="font-family:\'Suez One\',Georgia,serif;font-weight:400;font-size:96px;line-height:.92;'+
          'direction:ltr;flex:0 0 auto">1:07</div></div>'+
      '<div style="'+CARD+'padding:2px 18px;min-height:0;display:flex;flex-direction:column;'+
        'justify-content:center">'+
        slim("סבתא", "grandma", 6, "#2C6BFF", 5, "נותן/ת")+slim("אילן", "beard", 4, "#12B886", 4)+
        slim("נועה", "curly", 3, "#FF5A3D", 3)+
        slim("דנה", "girl", 2, "#D97706", 1).replace("border-bottom:1px solid var(--hair)", "")+
      '</div></div>');
}

/* ---- I · the map, and nothing else ----
   The second shape of the same screen: the board over the whole wall with one
   quiet line under it, so the room can still be joined and the clock read.
   Landscape, so the board is the one turned on its side. */
{
  const lang = "he", r = room(lang, "classic");
  place(r, [{r:5,c:1,score:6,cards:1},{r:4,c:2,score:4},{r:3,c:0,score:3},{r:1,c:2,score:2,cards:2}]);
  const st = play.boardView(r), pk = PACK[lang];
  const wide = art.board.draw({
    board: st.board, units: st.units, across: true, rtl: true,
    label: n => n.t === "CARD" ? pk.ui.card_node : n.t === "WILD" ? "" : ((pk.mods[n.t] || {}).s || ""),
    endText: "סוף"
  }).replace('class="board"', 'style="width:100%;height:100%;display:block" preserveAspectRatio="xMidYMid meet"');
  OUT["MapWall.dc.html"] = artboard(lang, TV[0], TV[1],
    '<div style="'+CARD+'padding:.75em;flex:1;min-height:0;display:flex;align-items:center;'+
      'justify-content:center">'+wide+'</div>'+
    '<div style="display:flex;align-items:center;gap:1em;padding:0 .5em;flex:0 0 auto;'+
      'color:var(--muted);font-weight:700">'+
      '<span style="font-family:\'Suez One\',Georgia,serif;font-weight:400;font-size:26px;'+
        'letter-spacing:.1em;direction:ltr;color:var(--ink)">NF2S</span>'+
      '<span style="flex:1;min-width:0;font-size:19px;font-weight:800;color:var(--second);'+
        'overflow:hidden;text-overflow:ellipsis;white-space:nowrap">סבתא נותנת רמז</span>'+
      '<span style="font-family:\'Suez One\',Georgia,serif;font-weight:400;font-size:32px;'+
        'direction:ltr;color:var(--ink)">1:07</span></div>');
}

/* ---- J · a phone ----
   The same screen on something the size of a hand: one column, the moment at
   the top where it is read first, the board keeping the middle, and the page
   allowed to scroll rather than squeeze. Every figure is the stylesheet's
   phone block — 15px to the em. */
{
  const lang = "he", r = room(lang, "classic");
  place(r, [{r:5,c:1,score:6,cards:1},{r:4,c:2,score:4},{r:3,c:0,score:3},{r:1,c:2,score:2,cards:2}]);
  const rows = r.engine.ROWS();
  const ptag = (text, kind) =>
    '<em style="font-style:normal;font-size:10px;font-weight:800;letter-spacing:.08em;'+
    'text-transform:uppercase;padding:3px 8px;border-radius:999px;'+
    (kind === "giver" ? "background:var(--blind-soft);color:var(--blind-ink)"
     : kind === "out" ? "background:var(--guilty-soft);color:var(--guilty-ink)"
     : "background:var(--sunk);color:var(--muted)")+'">'+text+'</em>';
  const prow = (o, last) =>
    '<div style="display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;'+
      'column-gap:11px;padding:9px 0;'+(last ? "" : "border-bottom:1px solid var(--hair);")+
      (o.out ? "opacity:.5" : "")+'">'+
      '<span style="width:38px;height:38px;display:block">'+face(o.face, 38)+'</span>'+
      '<span style="min-width:0">'+
        '<span style="display:flex;align-items:center;gap:7px;min-width:0">'+
          '<span style="font-size:18px;font-weight:800">'+o.name+'</span>'+
          (o.tag ? ptag(o.tag[0], o.tag[1]) : "")+(o.cards ? ptag(o.cards) : "")+'</span>'+
        '<span style="display:flex;align-items:center;gap:8px;margin-top:5px">'+
          '<span style="flex:1;height:7px;border-radius:999px;background:var(--hair);position:relative;'+
            'overflow:hidden;display:block"><i style="position:absolute;inset-block:0;'+
            'inset-inline-start:0;width:'+Math.round(o.row/(rows+1)*100)+'%;background:'+o.color+';'+
            'border-radius:999px"></i></span>'+
          '<span style="font-size:11px;font-weight:800;color:var(--faint);direction:ltr">'+
            o.row+'/'+(rows+1)+'</span></span></span>'+
      '<span style="display:flex;align-items:baseline;gap:5px">'+
        '<span style="font-size:28px;font-weight:800;direction:ltr;line-height:1">'+o.score+'</span>'+
        '<span style="font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--faint)">נק׳</span>'+
      '</span></div>';
  const board = boardSvg(r, lang).replace('class="board"',
    'style="width:100%;height:380px;display:block" preserveAspectRatio="xMidYMid meet"');
  OUT["Phone.dc.html"] = artboard(lang, 375, 900,
    '<div style="display:flex;align-items:center;gap:11px;background:var(--ink);color:#fff;'+
      'border-radius:10px;padding:10px 13px;flex:0 0 auto">'+
      '<span style="display:flex;align-items:center;gap:7px;font-family:\'Rubik\',system-ui,sans-serif;'+
        'font-weight:800;font-size:17px"><span style="width:20px;height:20px;display:block">'+
        art.coinMark(20)+'</span><span>אסימון</span></span>'+
      '<span style="flex:1"></span>'+
      '<div style="display:flex;flex-direction:column;line-height:1.1;gap:2px">'+
        '<span style="'+K+'font-size:9px;color:rgba(255,255,255,.5)">סבב</span>'+
        '<b style="font-size:15px;font-weight:800">4</b></div>'+
      '<div style="display:flex;flex-direction:column;line-height:1.1;gap:2px">'+
        '<span style="'+K+'font-size:9px;color:rgba(255,255,255,.5)">חדר</span>'+
        '<b style="font-family:\'Suez One\',Georgia,serif;font-weight:400;font-size:25px;'+
          'letter-spacing:.12em;direction:ltr">NF2S</b></div>'+
      '<span style="width:7px;height:7px;border-radius:50%;background:var(--good)"></span></div>'+
    '<div style="flex:0 0 auto"><div style="background:var(--blind);color:#221700;'+
      'border-radius:14px 14px 4px 4px;padding:13px 15px;display:flex;align-items:center;gap:12px">'+
      '<span style="width:45px;height:45px;flex:0 0 45px;border-radius:50%;'+
        'box-shadow:0 0 0 3px rgba(255,255,255,.65)">'+face("grandma", 45)+'</span>'+
      '<div style="flex:1;min-width:0">'+
        '<p style="'+K+'font-size:10px;color:rgba(34,23,0,.62)">סבב 4</p>'+
        '<div style="font-size:22px;font-weight:800;line-height:1.12;margin-top:3px">סבתא נותנת רמז</div>'+
        '<p style="font-size:14px;font-weight:600;color:rgba(34,23,0,.72);margin:4px 0 0">'+
          'משפט אחד. מי שקולט — צועק.</p></div>'+
      '<div style="font-family:\'Suez One\',Georgia,serif;font-weight:400;font-size:39px;line-height:.92;'+
        'direction:ltr">1:07</div></div>'+
      '<div style="height:7px;background:radial-gradient(circle at 4px 0,transparent 2.9px,'+
        'var(--blind) 3.3px) 0 0/8px 8px repeat-x"></div></div>'+
    '<div style="display:flex;gap:7px;flex:0 0 auto">'+
      '<span style="border-radius:999px;padding:5px 12px;font-size:12px;font-weight:800;'+
        'background:var(--blind-soft);color:var(--blind-ink)">כפול</span>'+
      '<span style="border-radius:999px;padding:5px 12px;font-size:12px;font-weight:800;'+
        'background:var(--sunk);color:var(--second)">בית</span></div>'+
    '<div style="'+CARD+'padding:2px 13px;flex:0 0 auto">'+
      prow({ name:"סבתא", face:"grandma", row:5, score:6, color:"#2C6BFF", tag:["נותן/ת","giver"], cards:"קלף אחד" })+
      prow({ name:"אילן", face:"beard", row:4, score:4, color:"#12B886" })+
      prow({ name:"נועה", face:"curly", row:3, score:3, color:"#FF5A3D", tag:["פסול","out"], out:true })+
      prow({ name:"דנה", face:"girl", row:1, score:2, color:"#D97706", cards:"2 קלפים" }, true)+
    '</div>'+
    '<div style="'+CARD+'padding:8px;flex:1;min-height:0;display:flex;flex-direction:column;'+
      'align-items:center;gap:6px;overflow:hidden">'+board+
      '<p style="font-size:11px;font-weight:800;color:var(--muted);margin:0">'+
        'קלאסי · '+t(lang, "board_k", rows + 1)+'</p></div>');
}

/* ---------------- write them out ---------------- */
Object.keys(OUT).forEach(f => {
  fs.writeFileSync(path.join(__dirname, f), OUT[f]);
  console.log("  " + f + "  " + OUT[f].length.toLocaleString() + " bytes");
});
console.log("\n  " + Object.keys(OUT).length + " artboards drawn with the game's own art\n");
