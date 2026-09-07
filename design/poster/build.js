/* The poster, and the sheet that goes beside it.

   A poster is not the manual. It has one job: stop somebody across a room,
   land one idea, and say where to go. So there is one headline, one picture,
   one mechanic — the thing that makes this game different from every other
   guessing game — and one address. Everything else was cut.

   The token and the palette are lifted out of public/, not retyped, so a
   poster cannot quietly disagree with the game it is a poster for.

   Run:  node design/poster/build.js          the artboards
         node design/poster/build.js --print  those, plus print/*.html        */
"use strict";
const fs = require("fs");
const path = require("path");

const P = f => path.join(__dirname, "../../public", f);
const OUT = f => path.join(__dirname, f);

/* ---------------- the parts, lifted ---------------- */

/* art.js is a browser file; give it just enough of one to load */
const win = { matchMedia: () => ({ matches: false }) };
const art = {};
new Function("window", "g", fs.readFileSync(P("art.js"), "utf8") +
  "\ng.coinSvg = coinSvg;")(win, art);

/* the palette, read off the sheet rather than remembered */
const CSS = fs.readFileSync(P("style.css"), "utf8");
const ROOT = CSS.slice(CSS.indexOf(":root{"), CSS.indexOf("\n}", CSS.indexOf(":root{")));
const tok = name => {
  const m = ROOT.match(new RegExp("--" + name + ":\\s*(#[0-9A-Fa-f]{3,8})"));
  if (!m) throw new Error("no --" + name + " in style.css");
  return m[1];
};

const INK    = tok("ink"),     SECOND = tok("second"), MUTED  = tok("muted");
const PAPER  = tok("paper"),   RULE   = tok("rule");
const AMBER  = tok("blind"),   AMBER_D = tok("blind-deep"), AMBER_I = tok("blind-ink");
const GOOD   = tok("good"),    GOOD_D = tok("good-deep");
const HOT    = tok("guilty"),  HOT_D  = tok("guilty-deep");

/* the poster's own ground: the sheet's paper, warmed, so a printed page and a
   lit phone are recognisably the same object without being the same colour */
const CARD  = "#F4F1E7";
const SAND  = "#E9E3D4";

const DISPLAY = "'Suez One', 'Times New Roman', Georgia, serif";
const LOGO    = "'Rubik', system-ui, Arial, sans-serif";
const BODY    = "'Assistant', 'Arial Hebrew', Arial, sans-serif";

const A4 = { w: 794, h: 1123 };          /* 96 px to the inch */

/* ---------------- small pieces ---------------- */

const coin = (px, opts) => art.coinSvg(
  "width:" + px + "px;height:" + px + "px;display:block" + (opts || ""), px >= 40);

const n = s => '<bdi dir="ltr">' + s + "</bdi>";      /* a numeral, kept LTR */

function wordmark(px, on) {
  const ink = on === "ink";
  return '<span style="font-family: ' + LOGO + '; font-weight: 800; font-size: ' + px +
    'px; line-height: 1; letter-spacing: -.01em; color: ' + (ink ? "#FFFCF6" : INK) + '">' +
    "א" + art.coinSvg("width:.78em;height:.78em;display:inline-block;vertical-align:-.05em", false) +
    "ימון</span>";
}

const eyebrow = (text, colour) =>
  '<span style="font-size: 14px; font-weight: 800; letter-spacing: .15em; color: ' +
  (colour || MUTED) + '">' + text + "</span>";

/* The one rule worth printing: you are paid for how LATE they get it. Three
   stops on one track — not three boxes, because it is one continuous idea. */
function scale(opts) {
  const o = opts || {};
  const big = o.big !== false;
  const stop = (word, gets, colour, weight) =>
    '<div style="display: flex; flex-direction: column; gap: 3px">' +
      '<span style="font-family: ' + LOGO + '; font-weight: 800; font-size: ' +
        (big ? 27 : 23) + 'px; line-height: 1.15; color: ' + colour + '">' + word + "</span>" +
      '<span style="font-size: ' + (big ? 17 : 15.5) + 'px; font-weight: ' + weight +
        '; color: ' + (weight >= 800 ? GOOD_D : SECOND) + '">' + gets + "</span>" +
    "</div>";

  return '<div style="display: flex; flex-direction: column; gap: 13px">' +
    eyebrow(o.label || "מתי הכי כדאי שיקלטו") +
    '<div style="height: 11px; border-radius: 999px; background: linear-gradient(to left, ' +
      HOT + ', #A9927C 47%, ' + GOOD + ')"></div>' +
    '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px">' +
      stop("מיד", "הנותן לוקח " + n("1"), HOT_D, 700) +
      stop("באמצע", "שווי המילה", SECOND, 700) +
      stop("בשנייה האחרונה", "שווי המילה " + n("+1"), GOOD_D, 800) +
    "</div></div>";
}

/* The token, dropping — the idiom the game is named for, drawn as one diagonal.
   Every coin is anchored to the FLOOR of its band, so the band may grow to
   absorb whatever slack the page has left without the drop sliding out of it. */
function drop() {
  const g = (left, bottom, px, op) =>
    '<div style="position: absolute; left: ' + left + "px; bottom: " + bottom +
    "px; opacity: " + op + '">' + coin(px) + "</div>";
  return '<div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none">' +
    g(356, 188, 54, ".22") +
    g(202, 100, 110, ".42") +
    g(-76, -12, 250, "1") +
    "</div>";
}

/* the notched edge of a token strip, sunk into the foot of the dark block */
function perforation(colour) {
  let dots = "";
  for (let i = 0; i < 42; i++)
    dots += '<span style="width: 13px; height: 13px; border-radius: 50%; background: ' +
      colour + '"></span>';
  return '<div style="position: absolute; left: 0; right: 0; bottom: -6px; height: 13px; ' +
    'display: flex; justify-content: space-between; padding: 0 7px">' + dots + "</div>";
}

/* every sheet ends the same way: where to go, and the four facts that decide
   whether somebody bothers. Four — a fifth is one nobody reads. */
function foot(o) {
  const fact = (t, lit) =>
    '<span style="font-size: 16px; font-weight: ' + (lit ? 800 : 700) + '; color: ' +
      (lit ? INK : "#CFCBD8") + "; background: " + (lit ? AMBER : "transparent") +
      "; border: 1.5px solid " + (lit ? AMBER : "rgba(255,252,246,.17)") +
      '; border-radius: 999px; padding: 6px 15px">' + t + "</span>";

  return '<div style="position: relative; flex-shrink: 0; background: ' + INK +
      "; color: #FFFCF6; padding: " +
      (o.tall ? "32px 54px 30px" : "28px 54px 28px") + '">' +

    '<div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 30px">' +
      '<div style="display: flex; flex-direction: column; gap: 7px">' +
        eyebrow("איך מתחילים", "#8F8CA0") +
        '<p style="margin: 0; font-size: ' + (o.tall ? 18.5 : 17) + 'px; line-height: 1.45; ' +
          'font-weight: 700; max-width: 400px; text-wrap: pretty">' +
          "פותחים את הכתובת בטלפון, מקישים את קוד החדר, ומתחילים. אין מה להתקין." +
        "</p>" +
      "</div>" +
      '<div style="display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 0 0 auto">' +
        eyebrow("קוד החדר", "#8F8CA0") +
        '<span style="font-family: ' + LOGO + '; font-weight: 800; font-size: 46px; ' +
          'line-height: 1; letter-spacing: .1em; color: #FFFCF6">' + n("ABCD") + "</span>" +
      "</div>" +
    "</div>" +

    /* the address and the four facts get a row each. Side by side they wrap at
       an unpredictable place, and an unpredictable place is what "not aligned"
       looks like on a printed page. */
    '<div style="margin: ' + (o.tall ? "20px" : "17px") + ' 0 0; padding: ' +
      (o.tall ? "15px" : "13px") + ' 0 0; border-top: 1px solid rgba(255,252,246,.15); ' +
      'display: flex; flex-direction: column; gap: 12px">' +
      '<a href="https://asimon.onrender.com" style="font-family: ' + LOGO + '; font-weight: 800; ' +
        "font-size: " + (o.tall ? 33 : 29) + 'px; line-height: 1.05; color: ' + AMBER +
        '; text-decoration: none; letter-spacing: -.01em">' + n("asimon.onrender.com") + "</a>" +
      '<div style="display: flex; gap: 8px">' +
        fact(n("3–8") + " שחקנים") + fact("לכל המשפחה") +
        fact("עברית ו־English") + fact("בלי הורדות", true) +
      "</div>" +
    "</div>" +

    perforation(o.ground) + "</div>";
}

/* ---------------- the poster ---------------- */

function poster() {
  return '<div style="width: ' + A4.w + "px; height: " + A4.h + "px; background: " + CARD +
      "; color: " + INK + "; direction: rtl; font-family: " + BODY + "; position: relative; " +
      'overflow: hidden; display: flex; flex-direction: column; box-sizing: border-box">' +

    '<div style="position: relative; z-index: 1; flex-grow: 1; display: flex; ' +
      'flex-direction: column; padding: 52px 54px 0">' +

      '<div style="display: flex; flex-direction: column; gap: 3px">' +
        wordmark(40) +
        '<span style="font-size: 16.5px; font-weight: 700; color: ' + MUTED + '">' +
          "משחק לכל המשפחה · טלפון לכל אחד</span>" +
      "</div>" +

      '<div style="display: flex; flex-direction: column; margin-top: 36px">' +
        '<span style="font-family: ' + DISPLAY + '; font-size: 86px; line-height: .99">' +
          "שיקלטו אותך.</span>" +
        '<span style="font-family: ' + DISPLAY + '; font-size: 86px; line-height: .99; color: ' +
          AMBER_I + '">רק לא מהר.</span>' +
      "</div>" +

      '<p style="margin: 18px 0 0; font-size: 21.5px; line-height: 1.48; color: ' + SECOND +
        '; max-width: 545px; text-wrap: pretty">' +
        "מישהו אחד יודע את המילה, ואומר עליה משפט אחד. <b style=\"color: " + INK + "\">פעם אחת.</b> " +
        "השאר צריכים לקלוט מה זה — וכל שנייה שלוקח להם שווה לו יותר." +
      "</p>" +

      /* one flat band of sand, bled to both edges: the ground the token lands
         on, and the line that separates the promise from the mechanic */
      '<div style="position: relative; flex-grow: 1; min-height: 262px; margin: 20px -54px 0; ' +
        "background: " + SAND + '">' + drop() + "</div>" +

      '<div style="padding: 20px 0 24px">' + scale({}) + "</div>" +
    "</div>" +

    foot({ ground: CARD, tall: true }) + "</div>";
}

/* ---------------- the sheet that explains it ---------------- */

function howToPlay() {
  const step = (i, head, body) =>
    '<div style="display: grid; grid-template-columns: 46px 1fr; column-gap: 18px; ' +
      'align-items: start; padding: 17px 0; border-bottom: 1px solid ' + RULE + '">' +
      '<span style="font-family: ' + LOGO + '; font-weight: 800; font-size: 30px; ' +
        "line-height: 1; color: " + AMBER_I + '">' + n(i) + "</span>" +
      "<div>" +
        '<h3 style="margin: 0 0 4px; font-size: 21px; font-weight: 800; line-height: 1.2">' +
          head + "</h3>" +
        '<p style="margin: 0; font-size: 17px; line-height: 1.5; color: ' + SECOND +
          '; text-wrap: pretty">' + body + "</p>" +
      "</div></div>";

  return '<div style="width: ' + A4.w + "px; height: " + A4.h + "px; background: " + CARD +
      "; color: " + INK + "; direction: rtl; font-family: " + BODY + "; position: relative; " +
      'overflow: hidden; display: flex; flex-direction: column; box-sizing: border-box">' +

    '<div style="position: relative; z-index: 1; flex-grow: 1; display: flex; ' +
      'flex-direction: column; padding: 52px 54px 0">' +

      '<div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 20px">' +
        '<div style="display: flex; flex-direction: column; gap: 10px">' +
          '<h1 style="margin: 0; font-family: ' + DISPLAY + '; font-size: 66px; line-height: 1">' +
            "איך משחקים</h1>" +
          '<p style="margin: 0; font-size: 19px; line-height: 1.45; color: ' + SECOND +
            '; max-width: 470px; text-wrap: pretty">' +
            "סבב אחד לוקח פחות משתי דקות. אחרי סבב אחד כבר לא צריך את הדף הזה." +
          "</p>" +
        "</div>" +
        wordmark(32) +
      "</div>" +

      '<div style="margin-top: 26px; background: #FFFCF6; border: 1px solid ' + RULE +
        '; border-radius: 18px; padding: 4px 26px">' +
        step(1, "הנותן בוחר מילה", "ארבע מילים על המסך שלו, שוות " + n("1") + " עד " + n("4") +
          " נקודות. ככל שהמילה שווה יותר, ככה היא קשה יותר.") +
        step(2, "ומכוון לאדם אחד", "בשקט, בלי שאף אחד יידע. אם דווקא הוא זה שקולט — " +
          "הנותן מקבל נקודה נוספת.") +
        step(3, "משפט אחד. פעם אחת.", "תשעים שניות. אסור לומר את המילה, ואסור לחזור על המשפט.") +
        step(4, "מי שקולט — לוחץ", "לוחצים ואומרים בקול. צדקתם? צברתם. טעיתם? יורדת נקודה " +
          "ואתם בחוץ עד סוף הסבב.") +
      "</div>" +

      '<div style="margin-top: 28px">' + scale({ big: false }) + "</div>" +

      '<p style="margin: 16px 0 0; font-size: 16.5px; line-height: 1.5; color: ' + MUTED +
        '; text-wrap: pretty">' +
        "אף אחד לא קלט? <b style=\"color: " + INK + '">הנותן לא מקבל כלום.</b> ' +
        "לכן רמז מעורפל מדי מסוכן בדיוק כמו רמז ברור מדי." +
      "</p>" +

      '<div style="flex-grow: 1; display: flex; align-items: flex-end; padding-bottom: 26px">' +
        '<div style="width: 100%; background: #FFFCF6; border: 1px solid ' + RULE +
          '; border-radius: 18px; padding: 20px 26px; display: flex; flex-direction: column; gap: 6px">' +
          eyebrow("והלוח") +
          '<p style="margin: 0; font-size: 17px; line-height: 1.5; color: ' + SECOND +
            '; text-wrap: pretty">' +
            "כל נקודה היא צעד. המשבצת שהנותן עומד עליה קובעת את סוג הסבב — " +
            "<b style=\"color: " + INK + '">עיוור, פנטומימה, דו־קרב</b> ועוד. ' +
            "מי שמתקדם, מתקדם לתוך סבבים קשים יותר. הראשון לסוף מנצח." +
          "</p>" +
        "</div>" +
      "</div>" +
    "</div>" +

    foot({ ground: CARD }) + "</div>";
}

/* ---------------- two other ways the poster could have gone ---------------- */

/* B — the token alone, on ink. Almost no words: it is a picture of the name. */
function altCoin() {
  return '<div style="width: ' + A4.w + "px; height: " + A4.h + "px; background: " + INK +
      "; color: #FFFCF6; direction: rtl; font-family: " + BODY + "; position: relative; " +
      'overflow: hidden; display: flex; flex-direction: column; box-sizing: border-box">' +

    /* the token, cropped by the page rather than fitted into it. Flat: no
       gradient over it, because nothing else in this game is lit from anywhere */
    '<div style="position: absolute; left: -228px; top: -168px">' + coin(816) + "</div>" +

    '<div style="position: relative; z-index: 1; padding: 54px 54px 0">' + wordmark(40, "ink") + "</div>" +

    '<div style="position: relative; z-index: 1; margin-top: auto; padding: 0 54px 46px">' +
      '<span style="font-family: ' + DISPLAY + '; font-size: 80px; line-height: 1.02; display: block">' +
        "נפל</span>" +
      '<span style="font-family: ' + DISPLAY + '; font-size: 80px; line-height: 1.02; display: block; ' +
        "color: " + AMBER + '">האסימון.</span>' +
      '<p style="margin: 20px 0 0; font-size: 20px; line-height: 1.5; color: #CFCBD8; ' +
        'max-width: 520px; text-wrap: pretty">' +
        "משפט אחד, נאמר פעם אחת. הרגע שבו הם קולטים הוא כל המשחק — " +
        "ואתה רוצה אותו בשנייה האחרונה." +
      "</p>" +
      '<div style="margin-top: 26px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap">' +
        '<a href="https://asimon.onrender.com" style="font-family: ' + LOGO + '; font-weight: 800; ' +
          "font-size: 30px; color: " + INK + "; background: " + AMBER + '; border-radius: 999px; ' +
          'padding: 12px 28px; text-decoration: none">' + n("asimon.onrender.com") + "</a>" +
        '<span style="font-size: 17px; font-weight: 700; color: #8F8CA0">' +
          n("3–8") + " שחקנים · לכל המשפחה · בלי הורדות</span>" +
      "</div>" +
    "</div></div>";
}

/* C — the clock. The tension stated as a number instead of an idiom. */
function altClock() {
  const R = 150, C = 2 * Math.PI * R;
  return '<div style="width: ' + A4.w + "px; height: " + A4.h + "px; background: " + CARD +
      "; color: " + INK + "; direction: rtl; font-family: " + BODY + "; position: relative; " +
      'overflow: hidden; display: flex; flex-direction: column; box-sizing: border-box">' +

    '<div style="padding: 52px 54px 0; display: flex; align-items: flex-start; ' +
      'justify-content: space-between; gap: 20px">' + wordmark(40) +
      '<span style="font-size: 16.5px; font-weight: 700; color: ' + MUTED + '; text-align: left">' +
        "משחק לכל המשפחה<br>טלפון לכל אחד</span>" + "</div>" +

    '<div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; ' +
      'justify-content: center; gap: 34px; padding: 0 54px">' +
      '<div style="position: relative; width: 340px; height: 340px">' +
        '<svg viewBox="0 0 340 340" style="width: 340px; height: 340px; display: block; ' +
          'transform: rotate(-90deg)" aria-hidden="true">' +
          '<circle cx="170" cy="170" r="' + R + '" fill="none" stroke="' + SAND + '" stroke-width="20"/>' +
          '<circle cx="170" cy="170" r="' + R + '" fill="none" stroke="' + GOOD + '" stroke-width="20" ' +
            'stroke-linecap="round" stroke-dasharray="' + (C * 0.055).toFixed(1) + " " + C.toFixed(1) + '"/>' +
        "</svg>" +
        '<div style="position: absolute; inset: 0; display: flex; flex-direction: column; ' +
          'align-items: center; justify-content: center; gap: 2px">' +
          '<span style="font-family: ' + LOGO + '; font-weight: 800; font-size: 96px; ' +
            "line-height: 1; color: " + GOOD_D + '">' + n("0:03") + "</span>" +
          '<span style="font-size: 18px; font-weight: 800; color: ' + GOOD_D + '">' +
            "השניות היקרות ביותר</span>" +
        "</div>" +
      "</div>" +
      '<div style="text-align: center">' +
        '<span style="font-family: ' + DISPLAY + '; font-size: 62px; line-height: 1.04; display: block">' +
          "אל תיתן להם</span>" +
        '<span style="font-family: ' + DISPLAY + '; font-size: 62px; line-height: 1.04; display: block; ' +
          "color: " + AMBER_I + '">לקלוט מהר.</span>' +
        '<p style="margin: 18px auto 0; font-size: 20px; line-height: 1.5; color: ' + SECOND +
          '; max-width: 520px; text-wrap: pretty">' +
          "הנותן צובר לפי <b style=\"color: " + INK + '">מתי</b> קלטו אותו, לא לפי אם קלטו. ' +
          "וזה הופך כל רמז להחלטה." +
        "</p>" +
      "</div>" +
    "</div>" +

    '<div style="padding: 0 54px 30px">' + scale({ label: "כמה זה שווה" }) + "</div>" +
    foot({ ground: CARD }) + "</div>";
}

/* ---------------- writing it out ---------------- */

const FONTS = "https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800" +
  "&family=Rubik:wght@500;700;800&family=Suez+One&display=swap";

const SHEETS = [
  { file: "Main.dc.html",      title: "פוסטר",        html: poster },
  { file: "HowToPlay.dc.html", title: "איך משחקים",   html: howToPlay },
  { file: "AltCoin.dc.html",   title: "כיוון ב — האסימון", html: altCoin },
  { file: "AltClock.dc.html",  title: "כיוון ג — השעון",   html: altClock }
];

const dc = body => '<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n' +
  '  <script src="./support.js"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n' +
  '  <link rel="stylesheet" href="' + FONTS + '">\n  <style>\n' +
  "    body { margin: 0; }\n    a { color: " + AMBER_I + "; } a:hover { color: " + INK + ";" +
  " }\n  </style>\n</helmet>\n\n" + body + "\n</x-dc>\n</body>\n</html>\n";

const print = body => '<!doctype html>\n<html lang="he" dir="rtl">\n<head>\n' +
  '<meta charset="utf-8">\n<link rel="stylesheet" href="' + FONTS + '">\n<style>\n' +
  "  @page { size: " + A4.w + "px " + A4.h + "px; margin: 0 }\n" +
  "  html, body { margin: 0; padding: 0; background: #fff }\n" +
  "  * { -webkit-print-color-adjust: exact; print-color-adjust: exact }\n" +
  "</style>\n</head>\n<body>\n" + body + "\n</body>\n</html>\n";

const canvas = {
  pages: [
    { id: "page-1", name: "להדפסה" },
    { id: "page-2", name: "כיוונים" }
  ],
  artboards: [
    { file: "Main.dc.html",      x: 0,    y: 0, w: A4.w, h: A4.h, title: "פוסטר",      print: "fixed", page: "page-1" },
    { file: "HowToPlay.dc.html", x: 914,  y: 0, w: A4.w, h: A4.h, title: "איך משחקים", print: "fixed", page: "page-1" },
    { file: "AltCoin.dc.html",   x: 0,    y: 0, w: A4.w, h: A4.h, title: "כיוון ב — האסימון", print: "fixed", page: "page-2" },
    { file: "AltClock.dc.html",  x: 914,  y: 0, w: A4.w, h: A4.h, title: "כיוון ג — השעון",   print: "fixed", page: "page-2" }
  ],
  annotations: [
    { id: "brief", x: 0, y: -168, w: 520, page: "page-1",
      text: "הפוסטר וגיליון הכללים.\nרעיון אחד לפוסטר: לא רוצים שיקלטו מהר. כל השאר ירד." },
    { id: "alts", x: 0, y: -168, w: 520, page: "page-2",
      text: "שני כיוונים אחרים לאותו פוסטר — האסימון על רקע כהה, והשעון." }
  ],
  launch: { view: "canvas", page: "page-1" }
};

const wantPrint = process.argv.includes("--print");
const printDir = process.argv[process.argv.indexOf("--print") + 1] || path.join(__dirname, "print");

for (const s of SHEETS) {
  const body = s.html();
  fs.writeFileSync(OUT(s.file), dc(body));
  if (wantPrint) {
    fs.mkdirSync(printDir, { recursive: true });
    fs.writeFileSync(path.join(printDir, s.file.replace(".dc.html", ".html")), print(body));
  }
}
fs.writeFileSync(OUT("canvas.json"), JSON.stringify(canvas, null, 2) + "\n");

console.log(SHEETS.map(s => s.file).join(", ") + (wantPrint ? "  → " + printDir : ""));
