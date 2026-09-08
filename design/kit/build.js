/* The kit: every colour and every drawing the game uses, on three sheets.

   The logo, the cards and the faces each have a canvas of their own, and those
   are design canvases — they argue about how a thing should look. This one
   does not argue. It is the index: what exists, what it is called in the code,
   and what colour it actually is, so that a question like "which amber is the
   giver's amber" has one place to be answered.

   Everything is read out of public/ at build time. A swatch that disagreed
   with the stylesheet would be worse than no swatch at all.

   Run:  node design/kit/build.js                                            */
"use strict";
const fs = require("fs");
const path = require("path");
const play = require("../../game/play.js");

const P = f => path.join(__dirname, "../../public", f);
const OUT = f => path.join(__dirname, f);

const win = { matchMedia: () => ({ matches: false }) };
const art = {};
new Function("window", "g", fs.readFileSync(P("art.js"), "utf8") +
  "\ng.faceSvg = faceSvg; g.faceOf = faceOf; g.FACES = FACES; g.coinMark = coinMark;" +
  "\ng.cardEmblem = cardEmblem; g.topicSvg = topicSvg; g.modSvg = modSvg;" +
  "\ng.choiceSvg = choiceSvg; g.CARD_ART = CARD_ART; window.MOD_ART = MOD_ART;")(win, art);

/* ---------------- the palette, read rather than remembered ---------------- */

const CSS = fs.readFileSync(P("style.css"), "utf8");
const ROOT = CSS.slice(CSS.indexOf(":root{"), CSS.indexOf("\n}", CSS.indexOf(":root{")));
const VARS = {};
ROOT.replace(/--([\w-]+):\s*([^;\n}]+)/g, (_, k, v) => { VARS[k] = v.trim(); return ""; });
const hex = name => {
  let v = VARS[name];
  if (v === undefined) throw new Error("no --" + name + " in style.css");
  for (let i = 0; i < 6 && /var\(/.test(v); i++)
    v = v.replace(/var\(--([\w-]+)\)/g, (_, k) => VARS[k] || "#000");
  return v;
};

const INK = hex("ink"), SECOND = hex("second"), MUTED = hex("muted"), RULE = hex("rule");
const PAPER = hex("paper"), CARD = "#F4F1E7";
const DISPLAY = "'Suez One', Georgia, serif";
const LOGO = "'Rubik', system-ui, Arial, sans-serif";
const BODY = "'Assistant', 'Arial Hebrew', Arial, sans-serif";
const A4 = { w: 794, h: 1123 };

/* ---------------- pieces ---------------- */

const wordmark = px =>
  '<span style="font-family: ' + LOGO + '; font-weight: 800; font-size: ' + px + 'px; ' +
  'line-height: 1; color: ' + INK + '">א' +
  '<svg viewBox="0 0 100 100" style="width:.78em;height:.78em;display:inline-block;' +
  'vertical-align:-.05em"><circle cx="50" cy="50" r="50" fill="#D18A08"/>' +
  '<circle cx="50" cy="50" r="43" fill="#FFB020"/>' +
  '<rect x="26" y="41" width="48" height="18" rx="9" fill="#17161C" transform="rotate(-30 50 50)"/>' +
  "</svg>ימון</span>";

const sheet = (title, sub, body) =>
  '<div style="width: ' + A4.w + "px; height: " + A4.h + "px; background: " + CARD +
    "; color: " + INK + "; direction: rtl; font-family: " + BODY + "; position: relative; " +
    'overflow: hidden; display: flex; flex-direction: column; box-sizing: border-box">' +
    '<div style="display: flex; align-items: flex-start; justify-content: space-between; ' +
      'gap: 20px; padding: 42px 48px 0">' +
      "<div>" +
        '<h1 style="margin: 0; font-family: ' + DISPLAY + '; font-size: 44px; line-height: 1; ' +
          'font-weight: 400">' + title + "</h1>" +
        '<p style="margin: 9px 0 0; font-size: 16px; line-height: 1.45; color: ' + MUTED +
          '; max-width: 500px; text-wrap: pretty">' + sub + "</p>" +
      "</div>" + wordmark(24) +
    "</div>" + body + "</div>";

const kicker = t =>
  '<p style="margin: 0 0 11px; font-size: 12px; font-weight: 800; letter-spacing: .15em; ' +
  'color: ' + MUTED + '">' + t + "</p>";

/* a colour, with the name the code calls it and the value it actually is */
function swatch(name, o) {
  const v = hex(name), opts = o || {};
  return '<div style="display: flex; flex-direction: column; gap: 6px">' +
    '<div style="height: ' + (opts.tall || 54) + "px; border-radius: 10px; background: " + v +
      (opts.ring ? "; box-shadow: inset 0 0 0 1px " + RULE : "") + '"></div>' +
    '<div style="display: flex; flex-direction: column; gap: 1px">' +
      '<span style="font-size: 12.5px; font-weight: 800; direction: ltr; text-align: right">--' +
        name + "</span>" +
      '<span style="font-size: 11.5px; font-weight: 700; color: ' + MUTED +
        '; direction: ltr; text-align: right; text-transform: uppercase">' + v + "</span>" +
    "</div></div>";
}

const grid = (cols, gap, kids) =>
  '<div style="display: grid; grid-template-columns: repeat(' + cols +
  ', minmax(0, 1fr)); gap: ' + gap + 'px">' + kids.join("") + "</div>";

/* ---------------- A · the colours ---------------- */

/* Every tone is one colour cut four ways, and the cuts are not decoration:
   the flat one fills, -deep sits on it as text, -soft is the same tone as a
   ground, -ink is the tone dark enough to read on paper. Shown as a row so
   the four cuts of one tone are impossible to mix up with another tone's. */
function tone(name, label, use) {
  const cuts = [name, name + "-deep", name + "-soft", name + "-ink"];
  return '<div style="display: grid; grid-template-columns: 132px minmax(0, 1fr); ' +
      'column-gap: 18px; align-items: center; padding: 8px 0; border-top: 1px solid ' + RULE + '">' +
    "<div>" +
      '<div style="font-size: 17px; font-weight: 800">' + label + "</div>" +
      '<div style="font-size: 13px; line-height: 1.35; color: ' + MUTED +
        '; text-wrap: pretty">' + use + "</div>" +
    "</div>" +
    '<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px">' +
      /* not every tone was cut all four ways — violet has no -deep, because
         nothing ever puts text on violet. An empty slot says that; a slot
         quietly filled with a neighbour's colour would be a lie. */
      cuts.map(c => VARS[c] === undefined
        ? '<div style="display: flex; flex-direction: column; gap: 4px">' +
            '<div style="height: 40px; border-radius: 9px; border: 1.5px dashed ' + RULE +
              '"></div><span style="font-size: 11px; font-weight: 700; color: ' + MUTED +
            '">אין</span></div>'
        : '<div style="display: flex; flex-direction: column; gap: 4px">' +
            '<div style="height: 40px; border-radius: 9px; background: ' + hex(c) +
              "; box-shadow: inset 0 0 0 1px rgba(23,22,28,.07)" + '"></div>' +
            '<span style="font-size: 11px; font-weight: 700; color: ' + MUTED +
              '; direction: ltr; text-align: right; text-transform: uppercase">' + hex(c) +
            "</span></div>").join("") +
    "</div></div>";
}

/* the four lanes of a board, per map. These are the only colours in the game
   that exist as a set rather than one at a time. */
function lanes(id, label) {
  return '<div style="display: grid; grid-template-columns: 96px minmax(0, 1fr); ' +
      'column-gap: 16px; align-items: center; padding: 6px 0">' +
    '<span style="font-size: 15px; font-weight: 800">' + label + "</span>" +
    '<div style="display: flex; gap: 8px">' +
      [0, 1, 2, 3].map(i => '<span style="flex: 1; height: 26px; border-radius: 999px; ' +
        "background: " + hex("map-" + id + "-" + i) + '"></span>').join("") +
    "</div></div>";
}

function colours() {
  return sheet("הצבעים", "כל צבע במשחק יושב ב־<b style=\"color:" + INK + '">public/style.css</b>' +
      " ומגיע משם לכל מקום — הטלפון, המסך בחדר, הפוסטר והקלפים. השמות כאן הם השמות בקוד.",
    '<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 14px; ' +
      'padding: 18px 48px 16px">' +

      "<div>" + kicker("הדף") +
        grid(5, 14, [swatch("paper", { ring: true, tall: 46 }), swatch("surface", { ring: true, tall: 46 }),
                     swatch("sunk", { ring: true, tall: 46 }), swatch("rule", { ring: true, tall: 46 }),
                     swatch("hair", { ring: true, tall: 46 })]) +
      "</div>" +

      "<div>" + kicker("הדיו") +
        grid(5, 14, [swatch("ink", { tall: 46 }), swatch("second", { tall: 46 }),
                     swatch("muted", { tall: 46 }), swatch("faint", { tall: 46 }),
                     swatch("zero", { tall: 46 })]) +
      "</div>" +

      "<div>" + kicker("הטונים · כל אחד חתוך ארבע פעמים") +
        '<div style="font-size: 12px; font-weight: 700; color: ' + MUTED +
          '; display: grid; grid-template-columns: 132px minmax(0, 1fr); column-gap: 18px">' +
          "<span></span>" +
          '<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px">' +
            ["מילוי", "deep · טקסט עליו", "soft · רקע", "ink · על נייר"].map(t =>
              "<span>" + t + "</span>").join("") + "</div></div>" +
        tone("accent", "כחול", "ברירת המחדל. כפתורים, קישורים, מה שאפשר ללחוץ.") +
        tone("good", "ירוק", "צדקת. נקודה שנכנסה, מילה שנקלטה.") +
        tone("blind", "ענבר", "סוד. המילה שרק הנותן רואה, והאסימון עצמו.") +
        tone("guilty", "אדום", "טעית, או שהזמן אוזל.") +
        tone("violet", "סגול", "משבצת ההפתעה בלוח.") +
        '<p style="margin: 9px 0 0; font-size: 12.5px; line-height: 1.45; color: ' + MUTED +
          '; text-wrap: pretty">כשה־deep וה־ink יוצאים אותו צבע, זה לא כפילות: ' +
          "האחד יושב על לבן והשני על נייר. לסגול אין deep — שום טקסט לא יושב על סגול.</p>" +
      "</div>" +

      "<div>" + kicker("חמשת הלוחות · ארבעה מסלולים לכל אחד") +
        lanes("classic", "קלאסי") + lanes("twist", "פיתולים") + lanes("storm", "סערה") +
        lanes("sprint", "ספרינט") + lanes("chaos", "כאוס") +
      "</div>" +
    "</div>");
}

/* ---------------- B · the cast ---------------- */

function faces() {
  const one = f => '<div style="display: flex; flex-direction: column; align-items: center; ' +
      'gap: 7px">' +
    '<span style="width: 138px; height: 138px; display: block">' + art.faceSvg(f.id, 138) + "</span>" +
    '<span style="font-size: 13.5px; font-weight: 800; direction: ltr">' + f.id + "</span>" +
    '<span style="font-size: 11.5px; font-weight: 700; color: ' + MUTED +
      '; direction: ltr; text-transform: uppercase">' + f.bg + "</span>" +
  "</div>";

  return sheet("הדמויות", "חמש־עשרה. כל אחת מצוירת בריבוע של 40 על 40 על עיגול בצבע שלה, " +
      "ולכן אותו ציור משמש אסימון של 23 פיקסלים על הלוח ותמונה של 116 כאן.",
    '<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 26px; ' +
      'padding: 30px 48px 40px">' +
      '<div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); ' +
        'row-gap: 30px; column-gap: 10px">' + art.FACES.map(one).join("") + "</div>" +
      '<div style="margin-top: auto; background: ' + PAPER + "; border: 1px solid " + RULE +
        '; border-radius: 14px; padding: 13px 18px; display: flex; align-items: center; gap: 20px">' +
        '<span style="display: flex; gap: 10px; align-items: flex-end; flex: 0 0 auto">' +
          ["girl", "beard", "panda"].map((id, i) =>
            '<span style="width: ' + [23, 34, 46][i] + "px; height: " + [23, 34, 46][i] +
            'px; display: block">' + art.faceSvg(id, [23, 34, 46][i]) + "</span>").join("") +
        "</span>" +
        '<p style="margin: 0; font-size: 15px; line-height: 1.5; color: ' + SECOND +
          '; text-wrap: pretty">אותו ציור בשלושת הגדלים שהוא באמת מופיע בהם: ' +
          "אסימון על הלוח, שורה ברשימה, ובחירת פרצוף. אין גרסה קטנה נפרדת — " +
          "צורות שטוחות בלי קווי שיער שורדות את ההקטנה.</p>" +
      "</div>" +
    "</div>");
}

/* ---------------- C · every other drawing ---------------- */

const PACK = play.uiPack("he");

/* art.js draws one round kind more than the game has. No board pattern deals
   D and no copy pack names it, so nothing can ever put it on a screen — it is
   a leftover of a round that was renamed. An index that quietly skipped it
   would be how it stays there for another year. */
function orphans() {
  const spare = Object.keys(win.MOD_ART || {}).filter(k => !PACK.mods[k]);
  if (!spare.length) return "";
  return '<div style="display: flex; align-items: center; gap: 16px; background: ' + PAPER +
    "; border: 1px dashed " + hex("guilty") + '; border-radius: 14px; padding: 13px 18px">' +
    spare.map(k => '<span style="width:44px;height:44px;display:block;flex:0 0 auto">' +
      art.modSvg(k, 44) + "</span>").join("") +
    '<p style="margin: 0; font-size: 13.5px; line-height: 1.45; color: ' + SECOND +
      '; text-wrap: pretty"><b style="color: ' + INK + '">' + spare.join(", ") +
      "</b> — ציור שקיים ב־art.js ואף סבב לא משתמש בו. אף לוח לא מחלק אותו ואין לו שם " +
      "בעברית או באנגלית, כך שהוא נשלח לכל טלפון ולא יוצג לעולם.</p></div>";
}

function marks() {
  const cell = (svg, label, px) =>
    '<div style="display: flex; flex-direction: column; align-items: center; gap: 6px">' +
      '<span style="width: ' + px + "px; height: " + px + 'px; display: block">' + svg + "</span>" +
      '<span style="font-size: 12.5px; font-weight: 800; line-height: 1.2; text-align: center">' +
        label + "</span>" +
    "</div>";

  const cards = Object.keys(art.CARD_ART).map(k =>
    cell(art.cardEmblem(k, 74), (PACK.cards[k] || {}).n || k, 74));
  const topics = PACK.topics.map(t => cell(art.topicSvg(t.k, 58), t.n, 58));
  const mods = Object.keys(PACK.mods).filter(k => k !== "S").map(k =>
    cell(art.modSvg(k, 58), PACK.mods[k].n, 58));
  const choices = [["topic", "נושא"], ["open", "פתוח"], ["cold", "קרה"]].map(([k, n]) =>
    cell(art.choiceSvg(k, 58), n, 58));

  const block = (title, note, kids, cols) =>
    "<div>" + kicker(title) +
      (note ? '<p style="margin: -6px 0 12px; font-size: 13px; color: ' + MUTED + '">' + note +
        "</p>" : "") +
      grid(cols, 14, kids) + "</div>";

  return sheet("הציורים", "שבעה קלפים, שנים־עשר נושאים, תשעה סוגי סבב ושלוש בחירות — " +
      "כולם באותו ריבוע של 40 על 40 על עיגול, בדיוק כמו הדמויות, ולכן כל אחד מהם " +
      "יכול לשבת בכל מקום שפרצוף יושב בו.",
    '<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 12px; ' +
      'padding: 20px 48px 22px">' +
      block("הקלפים", "מה שאפשר להטיל על סבב", cards, 7) +
      block("הנושאים", "מאיפה באות המילים", topics, 6) +
      block("סוגי הסבב", "מה שהמשבצת בלוח קובעת", mods, 6) +
      block("הבחירות", "איך נבחר הנושא", choices, 6) +
      orphans() +
      '<div style="display: flex; align-items: center; gap: 22px; background: ' +
        PAPER + "; border: 1px solid " + RULE + '; border-radius: 14px; padding: 13px 18px">' +
        '<span style="display: flex; align-items: flex-end; gap: 14px; flex: 0 0 auto">' +
          '<span style="width:50px;height:50px;display:block">' + art.coinMark(50) + "</span>" +
          '<span style="width:28px;height:28px;display:block">' + art.coinMark(28) + "</span>" +
          '<span style="width:17px;height:17px;display:block">' + art.coinMark(17) + "</span>" +
        "</span>" +
        '<p style="margin: 0; font-size: 15px; line-height: 1.5; color: ' + SECOND +
          '; text-wrap: pretty">האסימון, בשני חיתוכים. מעל 40 פיקסלים יש לו שוליים ' +
          "מחורצים; מתחת לזה החריצים נסגרים לטבעת אחת, ולכן הם פשוט יורדים.</p>" +
      "</div>" +
    "</div>");
}

/* ---------------- writing it out ---------------- */

const FONTS = "https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800" +
  "&family=Rubik:wght@500;700;800&family=Suez+One&display=swap";
const DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
  '<defs><clipPath id="lsface"><circle cx="20" cy="20" r="20"/></clipPath></defs></svg>';

const dc = body => '<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n' +
  '  <script src="./support.js"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n' +
  '  <link rel="stylesheet" href="' + FONTS + '">\n  <style>\n    body { margin: 0; }\n' +
  "    a { color: " + hex("blind-ink") + "; }\n    .face, .em { display: block }\n" +
  "  </style>\n</helmet>\n" + DEFS + "\n\n" + body + "\n</x-dc>\n</body>\n</html>\n";

const print = body => '<!doctype html>\n<html lang="he" dir="rtl">\n<head>\n' +
  '<meta charset="utf-8">\n<link rel="stylesheet" href="' + FONTS + '">\n<style>\n' +
  "  @page { size: " + A4.w + "px " + A4.h + "px; margin: 0 }\n" +
  "  html, body { margin: 0; padding: 0; background: #fff }\n" +
  "  * { -webkit-print-color-adjust: exact; print-color-adjust: exact }\n" +
  "  .face, .em { display: block }\n</style>\n</head>\n<body>\n" + DEFS + "\n" + body +
  "\n</body>\n</html>\n";

const SHEETS = [
  { file: "Main.dc.html",   title: "א · הצבעים",   html: colours },
  { file: "Faces.dc.html",  title: "ב · הדמויות",  html: faces },
  { file: "Marks.dc.html",  title: "ג · הציורים",  html: marks }
];

const canvas = {
  artboards: SHEETS.map((s, i) => ({
    file: s.file, x: i * 914, y: 0, w: A4.w, h: A4.h, title: s.title, print: "fixed"
  })),
  annotations: [
    { id: "what", x: 0, y: -150, w: 560,
      text: "הערכה: מה קיים ואיך קוראים לו בקוד.\n" +
            "הכול נקרא מ־public/style.css ומ־public/art.js בזמן הבנייה, כך ששינוי בקוד " +
            "משנה את הדף הזה ולא להפך." }
  ],
  launch: { view: "canvas" }
};

const wantPrint = process.argv.includes("--print");
const printDir = path.join(__dirname, "print");
for (const s of SHEETS) {
  const body = s.html();
  fs.writeFileSync(OUT(s.file), dc(body));
  if (wantPrint) {
    fs.mkdirSync(printDir, { recursive: true });
    fs.writeFileSync(path.join(printDir, s.file.replace(".dc.html", ".html")), print(body));
  }
}
fs.writeFileSync(OUT("canvas.json"), JSON.stringify(canvas, null, 2) + "\n");
console.log(SHEETS.map(s => s.file).join(", "));
