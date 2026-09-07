/* The break-and-leave artboards, drawn with the game's own art.

   Same kit as design/groups: the faces come out of public/art.js and every
   value here is lifted from public/style.css, so a board cannot drift from
   what the phone actually draws.
   Run:  node design/pause/build.js                                          */
"use strict";
const fs = require("fs");
const path = require("path");
const K = require("../groups/build.js");
const { kicker, heroPerf, face, DEFS } = K;
const out = f => path.join(__dirname, f);

const HEAD = `<!doctype html>
<html>
<head><meta charset="utf-8"><script src="./support.js"></script></head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&family=Rubik:wght@800&family=Suez+One&display=swap">
  <style>
    body{margin:0;background:#FFFCF6}
    a{color:#2C6BFF}a:hover{color:#1B4FD1}
    .face{display:block}
  </style>
</helmet>
`;
const FOOT = `</x-dc>
</body>
</html>
`;

/* The phone, exactly as public/style.css builds it — except that the wash
   down the first 300px is passed in. A room on a break has no tone: the
   colour drains out of the page and it goes grey, which is the whole point. */
function phone(h, wash, body){
  return HEAD + DEFS + `
<div dir="rtl" style="width:390px;height:${h}px;background:#FFFCF6;font-family:'Assistant',system-ui,sans-serif;color:#17161C;display:flex;flex-direction:column;gap:16px;padding:22px 16px 26px;box-sizing:border-box;overflow:hidden;background-image:linear-gradient(180deg,${wash},rgba(255,252,246,0));background-repeat:no-repeat;background-size:100% 300px;">
${body}
</div>
` + FOOT;
}
const LIVE = "rgba(44,107,255,.12)";
const HELD = "rgba(23,22,28,.07)";

/* ---- the pieces the phone already draws ---- */
const note = txt =>
  `<p style="font-size:13px;color:#6B6A78;line-height:1.5;margin:0;">${txt}</p>`;
const h2 = txt =>
  `<h2 style="font-size:23px;font-weight:800;margin:0;letter-spacing:-.015em;line-height:1.2;">${txt}</h2>`;
const grow = `<div style="flex:1;"></div>`;
/* button, button.ghost, button.red, button.quiet */
const btn = (txt, kind) => {
  const base = "border-radius:13px;padding:16px;text-align:center;font-family:'Assistant',system-ui,sans-serif;";
  if(kind === "ghost") return `<div style="${base}background:transparent;color:#46445A;border:1px solid #E7E4F0;font-size:15px;font-weight:700;">${txt}</div>`;
  if(kind === "red")   return `<div style="${base}background:#FF5A3D;color:#fff;font-size:16px;font-weight:800;box-shadow:0 1px 2px rgba(23,22,28,.05),0 8px 24px -14px rgba(23,22,28,.35);">${txt}</div>`;
  if(kind === "quiet") return `<div style="border-radius:13px;padding:12px;text-align:center;background:transparent;color:#6B6A78;font-size:14.5px;font-weight:700;">${txt}</div>`;
  if(kind === "warn")  return `<div style="border-radius:13px;padding:12px;text-align:center;background:transparent;color:#D8351C;font-size:14.5px;font-weight:700;">${txt}</div>`;
  return `<div style="${base}background:#2C6BFF;color:#fff;font-size:16px;font-weight:800;box-shadow:0 1px 2px rgba(23,22,28,.05),0 8px 24px -14px rgba(23,22,28,.35);">${txt}</div>`;
};
const row = inner => `<div style="display:flex;gap:10px;">${inner}</div>`;
const flex1 = el => el.replace("<div style=\"", "<div style=\"flex:1;");

/* .topbar — round, mode·map, whose clue it is */
const topbar = (round, giverName, giverFace) =>
  `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-inline-end:40px;">` +
  `<p style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6B6A78;margin:0;">סבב ${round}</p>` +
  `<span style="font-size:11px;font-weight:700;color:#6B6A78;background:#F4F2FA;border-radius:999px;padding:5px 11px;white-space:nowrap;">רגיל · קלאסי</span>` +
  `<span style="display:inline-flex;align-items:center;gap:7px;padding:4px 4px 4px 11px;border-radius:999px;background:#F4F2FA;font-size:12.5px;font-weight:700;color:#6B6A78;">` +
  `<span style="width:26px;height:26px;flex:0 0 26px;">${face(giverFace,26)}</span>${giverName}</span></div>`;

/* the draining ring, art.js's clockRing: r=66, C=414.7 */
const ring = (label, frac, warn) => {
  const C = 414.7, col = warn ? "#FF5A3D" : "#2C6BFF";
  return `<div style="background:#FFFFFF;border:1px solid #E7E4F0;border-radius:16px;padding:20px 18px 16px;">` +
    `<div style="position:relative;width:180px;height:180px;margin:0 auto;display:grid;place-items:center;">` +
    `<svg viewBox="0 0 160 160" style="position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);">` +
    `<circle cx="80" cy="80" r="66" fill="none" stroke-width="11" stroke-linecap="round" stroke="#F4F2FA"/>` +
    `<circle cx="80" cy="80" r="66" fill="none" stroke-width="11" stroke-linecap="round" stroke="${col}" ` +
    `stroke-dasharray="${C}" stroke-dashoffset="${(C * (1 - frac)).toFixed(1)}"/></svg>` +
    `<div style="position:relative;font-size:46px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.03em;line-height:.95;color:${col};direction:ltr;">${label}</div>` +
    `</div></div>`;
};

/* the arcade dome, straight off .buzzwrap/.buzz */
const buzzer = `
  <div style="position:relative;display:grid;place-items:center;padding:20px 0 24px;">
    <div style="position:absolute;top:50%;left:50%;width:260px;height:260px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle at 50% 34%,#F7F0EB 0%,#EEE2DB 100%);box-shadow:inset 0 5px 12px rgba(120,25,10,.13),inset 0 -2px 0 #fff;"></div>
    <div style="position:relative;width:226px;height:226px;border-radius:50%;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;color:#fff;background:radial-gradient(130% 100% at 50% 116%,rgba(120,20,6,.5) 0%,rgba(120,20,6,0) 46%),radial-gradient(92% 82% at 50% -8%,#FF9B7F 0%,#FF6B4C 38%,#F0472A 72%,#D8351C 100%);box-shadow:0 11px 0 #D8351C,0 14px 0 #A82A14,0 30px 34px -18px rgba(120,25,10,.6),inset 0 2px 0 rgba(255,255,255,.45),inset 0 -12px 20px rgba(120,25,10,.32);">
      <span style="position:absolute;left:13%;right:13%;top:6%;height:33%;border-radius:50%;background:linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,0));"></span>
      <span style="position:relative;font-family:'Suez One',Georgia,serif;font-weight:400;font-size:32px;line-height:1;text-shadow:0 2px 0 rgba(120,25,10,.34);">יש לי!</span>
      <span style="position:relative;font-size:13px;font-weight:700;opacity:.92;max-width:76%;text-align:center;text-shadow:0 1px 0 rgba(120,25,10,.22);">לוחצים ואומרים בקול</span>
    </div>
  </div>`;

/* the ink receipt the room code and the revealed word already use */
const receipt = inner =>
  `<div><div style="position:relative;background:#17161C;color:#fff;border-radius:18px 18px 4px 4px;padding:20px 22px 18px;overflow:clip;">${inner}</div>${heroPerf("#17161C")}</div>`;

/* the toast public/style.css calls .banner — ink, dropped from the top */
const toast = (bold, sub) =>
  `<div style="display:flex;justify-content:center;padding:0 12px;">` +
  `<div style="display:flex;align-items:center;gap:11px;background:#17161C;color:#fff;border-radius:14px;padding:11px 15px;box-shadow:0 12px 30px -12px rgba(23,22,28,.55);">` +
  `<span style="font-weight:800;font-size:15px;">${bold}</span>` +
  `<span style="font-size:12.5px;opacity:.75;">${sub}</span></div></div>`;

/* ============ A · where the break lives ============
   The table, mid-round, with the one control that is new: a quiet button at
   the foot of the screen, beside the one the giver already has. Nothing else
   about the round changes. */
fs.writeFileSync(out("Table.dc.html"), phone(1000, LIVE, `
  ${topbar(4, "דנה", "girl")}
  ${ring("0:41", .66)}
  ${h2("תגידו את המשפט. פעם אחת.")}
  ${note("ואז אף מילה נוספת. כל השאר: תצעקו כשיש לכם.")}
  ${buzzer}
  <div style="display:flex;gap:10px;">
    <div style="flex:1;border-radius:13px;padding:12px;text-align:center;background:transparent;color:#6B6A78;font-size:14.5px;font-weight:700;border:1px dashed #E7E4F0;">הפסקה</div>
    <div style="flex:1;border-radius:13px;padding:12px;text-align:center;background:transparent;color:#6B6A78;font-size:14.5px;font-weight:700;">אף אחד לא קלט</div>
  </div>
`));

/* ============ B · asking first ============
   Stopping the room stops it for everyone, so the button asks before it does
   it — the same two taps leaving takes, and for the same reason. */
fs.writeFileSync(out("Confirm.dc.html"), phone(844, LIVE, `
  ${topbar(4, "דנה", "girl")}
  ${grow}
  <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;">
    <svg viewBox="0 0 40 40" width="64" height="64" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#F4F2FA"/>
      <rect x="14" y="12" width="4.4" height="16" rx="2.2" fill="#46445A"/>
      <rect x="21.6" y="12" width="4.4" height="16" rx="2.2" fill="#46445A"/></svg>
    ${h2("להפסיק את המשחק?")}
    ${note("השעון של כולם נעצר במקום, ואף אחד לא יכול לענות. ממשיכים אוטומטית אחרי חצי דקה &mdash; או ברגע שתלחצו ״ממשיכים״.")}
  </div>
  ${grow}
  ${btn("כן, עוצרים")}
  ${btn("לא, ממשיכים", "ghost")}
`));

/* ============ C · the break, for whoever called it ============ */
const breakCard = `
  ${receipt(`
    <p style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7);margin:0;">הפסקה</p>
    <div style="font-size:64px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.03em;line-height:1.06;margin-top:6px;">0:24</div>
    <p style="font-size:12.5px;color:rgba(255,255,255,.7);margin:2px 0 0;">ממשיכים לבד כשזה נגמר</p>
    <div style="height:8px;border-radius:99px;background:rgba(255,255,255,.16);overflow:hidden;margin-top:14px;">
      <div style="height:100%;width:80%;border-radius:99px;background:#FFFFFF;"></div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;padding-top:14px;border-top:1px dashed rgba(255,255,255,.38);">
      <span style="font-size:16px;font-weight:800;flex:1;min-width:0;display:flex;align-items:center;gap:9px;">
        <span style="width:34px;height:34px;flex:0 0 34px;">${face("girl",34)}</span>דנה ביקשה רגע</span>
      <span style="font-size:15px;font-weight:800;background:rgba(255,255,255,.18);padding:5px 11px;border-radius:8px;font-variant-numeric:tabular-nums;direction:ltr;">0:41</span>
    </div>`)}`;

fs.writeFileSync(out("Main.dc.html"), phone(844, HELD, `
  ${topbar(4, "דנה", "girl")}
  ${breakCard}
  ${h2("השולחן עוצר")}
  ${note("שעון הסבב נעצר על 0:41 ואף אחד לא יכול לענות. כל לחיצה נוספת על &rdquo;עוד 30&ldquo; מוסיפה חצי דקה, עד חמש דקות.")}
  ${grow}
  <div style="display:flex;gap:10px;">
    ${flex1(btn("עוד 30 שניות", "ghost"))}
    ${flex1(btn("ממשיכים"))}
  </div>
  ${btn("לפרוש מהמשחק", "warn")}
`));

/* ============ C · the break, for everyone else ============
   The break belongs to whoever called it: nobody can cut short somebody
   else's minute. Everyone can be generous with it. */
fs.writeFileSync(out("Waiting.dc.html"), phone(844, HELD, `
  ${topbar(4, "דנה", "girl")}
  ${breakCard}
  ${h2("מחכים לדנה")}
  ${note("אפשר להוסיף לה עוד חצי דקה. לחזור מוקדם יכולים רק דנה או המארח/ת &mdash; ואם אף אחד לא נוגע, המשחק ממשיך לבד.")}
  ${grow}
  ${btn("עוד 30 שניות", "ghost")}
  ${btn("לפרוש מהמשחק", "warn")}
`));

/* ============ D · leaving in the middle ============
   Two taps, and the second one says exactly what it costs. */
fs.writeFileSync(out("Quit.dc.html"), phone(844, HELD, `
  ${topbar(4, "דנה", "girl")}
  <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:26px 0 8px;">
    <span style="width:132px;height:132px;flex:0 0 auto;border-radius:50%;overflow:hidden;box-shadow:0 10px 30px -18px rgba(23,22,28,.55);">${face("girl",132)}</span>
    ${h2("לפרוש מהמשחק?")}
  </div>
  <div style="background:#FFFFFF;border:1px solid #E7E4F0;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:flex-start;gap:11px;">
      <span style="flex:0 0 7px;width:7px;height:7px;border-radius:50%;background:#6B6A78;margin-top:7px;"></span>
      <span style="font-size:14.5px;font-weight:700;line-height:1.45;">האסימון שלכם יורד מהלוח, והניקוד לא נשמר.</span></div>
    <div style="height:1px;background:#F1EFF9;"></div>
    <div style="display:flex;align-items:flex-start;gap:11px;">
      <span style="flex:0 0 7px;width:7px;height:7px;border-radius:50%;background:#6B6A78;margin-top:7px;"></span>
      <span style="font-size:14.5px;font-weight:700;line-height:1.45;">אתם באמצע רמז &mdash; הסבב יחולק מחדש, באותו מספר, לשחקן/ית הבא/ה.</span></div>
    <div style="height:1px;background:#F1EFF9;"></div>
    <div style="display:flex;align-items:flex-start;gap:11px;">
      <span style="flex:0 0 7px;width:7px;height:7px;border-radius:50%;background:#6B6A78;margin-top:7px;"></span>
      <span style="font-size:14.5px;font-weight:700;line-height:1.45;">השאר ממשיכים. נשאר שולחן של אחד? המשחק נגמר.</span></div>
  </div>
  ${note("אפשר לחזור בכל רגע עם קוד החדר &mdash; אבל בתור שחקן/ית חדש/ה, בלי הנקודות.")}
  ${grow}
  ${btn("כן, אני יוצא/ת", "red")}
  ${btn("לא, ממשיכים", "ghost")}
`));

/* ============ E · the room carries on ============
   Somebody left in the middle of their own clue. The table is told once, in
   the ink toast a played card already uses, and the round is dealt again
   under the same number. */
fs.writeFileSync(out("CarryOn.dc.html"), phone(844, LIVE, `
  ${toast("יואב פרש", "הסבב מחולק מחדש")}
  ${topbar(4, "מיכל", "curly")}
  <div style="background:#FFFFFF;border:1px solid #E7E4F0;border-radius:16px;padding:16px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;justify-content:center;flex:1;">
    <span style="width:132px;height:132px;flex:0 0 auto;border-radius:50%;overflow:hidden;box-shadow:0 10px 30px -18px rgba(23,22,28,.55);">${face("curly",132)}</span>
    ${h2("מיכל בוחרת מילה")}
    ${note("רגע אחד. אל תסתכלו לה בטלפון.")}
  </div>
  ${kicker("מי בפנים")}
  <div style="display:flex;flex-direction:column;">
    ${K.prow("girl", "דנה", '<span style="width:9px;height:9px;border-radius:50%;background:#12B886;display:block;"></span>')}
    ${K.prow("curly", "מיכל", K.tag("נותנת רמז", "host"))}
    ${K.prow("beard", "רון", '<span style="width:9px;height:9px;border-radius:50%;background:#12B886;display:block;"></span>')}
  </div>
`));

console.log("wrote Table, Confirm, Main, Waiting, Quit, CarryOn");
