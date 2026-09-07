"use strict";
const fs = require("fs");
const path = require("path");
const B = require("./build.js");
const { phone, sheet, kicker, heroPerf, prow, tag, dot, learn, seg, btn, face } = B;
const out = f => path.join(__dirname, f);

/* the table, once, so every board tells the same story */
const FROGS  = [["דנה","girl"],["יואב","boy"],["מיכל","curly"]];
const SQUIDS = [["רון","beard"],["שירה","beanie"],["אבי","grandpa"]];
const ANTS   = [["תמר","hippy"],["עומר","astro"],["נועה","panda"]];

/* ============ A · the lobby ============
   Built on the lobby the phone actually draws: the room-code receipt, the
   list of who is in, the segmented switch. Groups adds one section — the
   roster on this phone — and turns the room list into a list of groups. */
const rosterRow = (nm, fc, trail) =>
  `<div style="display:grid;grid-template-columns:34px 1fr auto;align-items:center;column-gap:12px;padding:11px 13px;background:#FFFFFF;border:1px solid #E7E4F0;border-radius:14px;">` +
  `<span style="width:34px;height:34px;flex:0 0 34px;">${face(fc,34)}</span>` +
  `<span style="font-size:16px;font-weight:800;">${nm}</span><span>${trail}</span></div>`;

fs.writeFileSync(out("Main.dc.html"), phone(1000, "live", `
  <div>
    <div style="position:relative;background:#17161C;color:#fff;border-radius:18px 18px 4px 4px;padding:22px;display:flex;align-items:center;justify-content:space-between;gap:14px;overflow:clip;">
      <div><p style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7);margin:0;">החדר</p>
        <div style="font-family:'Suez One',Georgia,serif;font-weight:400;font-size:40px;line-height:1;letter-spacing:.14em;direction:ltr;">NF2S</div></div>
      <span style="width:44px;height:44px;flex:0 0 44px;border-radius:50%;background:rgba(255,255,255,.16);display:grid;place-items:center;font-size:15px;font-weight:800;">3</span>
    </div>${heroPerf("#17161C")}
  </div>

  ${kicker("איך יושבים?")}
  ${seg([{n:"כל אחד לעצמו"},{n:"בזוגות"},{n:"בקבוצות",on:true}])}

  ${kicker("הקבוצה שלכם")}
  <div style="display:flex;flex-direction:column;gap:8px;">
    <div style="font-size:17px;font-weight:700;padding:15px;border-radius:13px;border:1px solid #2C6BFF;background:#FFFFFF;box-shadow:0 0 0 3px #EAF0FF;">הצפרדעים</div>
    ${rosterRow("דנה","girl", tag("את/ה","you"))}
    ${rosterRow("יואב","boy", '<span style="color:#A3A1B0;font-size:19px;line-height:1;">&times;</span>')}
    ${rosterRow("מיכל","curly", '<span style="color:#A3A1B0;font-size:19px;line-height:1;">&times;</span>')}
    <div style="padding:13px;border-radius:13px;border:1px dashed #E7E4F0;color:#6B6A78;font-weight:700;font-size:14.5px;text-align:center;">+ הוסיפו אדם</div>
  </div>

  ${kicker("בחדר")}
  <div style="display:flex;flex-direction:column;">
    ${prow("girl", 'הצפרדעים '+tag("את/ה","you"), dot(true))}
    ${prow("beard", 'התמנונים '+tag("מארח","host"), dot(true))}
    ${prow("hippy", "הנמלים", dot(true))}
  </div>

  ${learn("משחק בקבוצות", "טלפון אחד לקבוצה. מי מדבר זו החלטה.")}
  <div style="flex:1;"></div>
  ${btn("מתחילים")}
`));

/* ============ B · the huddle ============ */
const benchRow = (nm, fc, state) => {
  const on   = state === "on", spent = state === "spent";
  return `<div style="display:flex;align-items:center;gap:12px;padding:10px 13px;border-radius:13px;${
    on ? "background:#2C6BFF;border:1px solid #1B4FD1;color:#fff;"
       : spent ? "background:#F4F2FA;border:1px solid #E7E4F0;opacity:.62;"
               : "background:#FFFFFF;border:1px solid #E7E4F0;"}">` +
    `<span style="width:34px;height:34px;flex:0 0 34px;">${face(fc,34)}</span>` +
    `<span style="flex:1;min-width:0;font-size:17px;font-weight:${spent?700:800};${spent?"color:#6B6A78;":""}">${nm}</span>` +
    (spent ? tag("כבר דיברה")
           : `<span style="width:11px;height:11px;flex:0 0 11px;border-radius:50%;background:${on?"#fff":"#E7E4F0"};"></span>`) +
  `</div>`;
};
const twist = (right) => `
  <div style="background:#FFEDE9;border:1px solid #F7CDC3;border-radius:14px;padding:11px 14px 12px;display:flex;align-items:center;gap:12px;">
    <span style="min-width:0;flex:1;display:flex;flex-direction:column;gap:3px;">
      <span style="font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#D8351C;">הסבב הזה</span>
      <span style="font-family:'Suez One',Georgia,serif;font-weight:400;font-size:19px;line-height:1.3;color:#17161C;">פנטומימה</span>
    </span>
    <span style="font-size:12.5px;font-weight:700;color:#8E4231;text-align:end;line-height:1.35;max-width:150px;">${right}</span>
  </div>`;
const step = (n, title, sub, on) => `
  <div style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:14px;background:#FFFFFF;border:1px solid #E7E4F0;${on?"":"opacity:.5;"}">
    <span style="flex:0 0 30px;width:30px;height:30px;border-radius:10px;${on?"background:#2C6BFF;color:#fff;":"background:#F4F2FA;color:#6B6A78;"}display:grid;place-items:center;font-size:13px;font-weight:800;">${n}</span>
    <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;"><b style="font-size:15.5px;font-weight:800;">${title}</b>${
      sub ? `<span style="font-size:12.5px;font-weight:600;color:#6B6A78;">${sub}</span>` : ""}</span>
  </div>`;

fs.writeFileSync(out("Huddle.dc.html"), phone(844, "secret", `
  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
    <span style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6B6A78;">סבב 4 &middot; אתם נותנים</span>
    ${tag("סוד","host")}
  </div>

  <div style="background:#FFFFFF;border:1px solid #E7E4F0;border-radius:16px;padding:18px 18px 15px;display:flex;flex-direction:column;gap:11px;">
    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;">
      <span style="font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#6B6A78;">התייעצות</span>
      <span style="font-size:12.5px;font-weight:700;color:#6B6A78;">מתוך 45 שניות</span>
    </div>
    <div style="font-size:54px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.03em;line-height:.95;text-align:center;color:#2C6BFF;direction:ltr;">0:38</div>
    <div style="height:8px;border-radius:99px;background:#F4F2FA;overflow:hidden;"><div style="height:100%;width:84%;border-radius:99px;background:linear-gradient(90deg,#2C6BFF,#7A5AF8);"></div></div>
  </div>

  ${twist("בלי מילים.<br>כאן רוצים שיקלטו מהר.")}

  <div style="display:flex;flex-direction:column;gap:8px;">
    ${kicker("שלוש החלטות, בסדר הזה")}
    <div style="background:#FFFFFF;border:1px solid #2C6BFF;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:11px;box-shadow:0 1px 2px rgba(23,22,28,.05),0 8px 24px -14px rgba(23,22,28,.35);">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="flex:0 0 30px;width:30px;height:30px;border-radius:10px;background:#2C6BFF;color:#fff;display:grid;place-items:center;font-size:13px;font-weight:800;">1</span>
        <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;"><b style="font-size:16px;font-weight:800;">מי מדבר?</b>
          <span style="font-size:12.5px;font-weight:600;color:#6B6A78;">נשארו שניים בסיבוב. השולחן יידע מיד.</span></span>
      </div>
      <div style="display:flex;flex-direction:column;gap:7px;">
        ${benchRow("דנה","girl","on")}${benchRow("יואב","boy","")}${benchRow("מיכל","curly","spent")}
      </div>
    </div>
    ${step(2,"המילה והקושי","",false)}
    ${step(3,"למי מכוונים","",false)}
  </div>

  <div style="flex:1;"></div>
  <div style="font-size:13px;color:#6B6A78;line-height:1.5;background:#F4F2FA;border-radius:10px;padding:11px 14px;">נגמר השעון? מקבלים את המילה היקרה, בלי נושא ובלי כיוון.</div>
`));
console.log("wrote Main, Huddle");
require("./boards2.js");
