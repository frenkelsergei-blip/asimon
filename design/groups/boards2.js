"use strict";
const fs = require("fs");
const path = require("path");
const B = require("./build.js");
const { phone, sheet, kicker, heroPerf, tag, dot, learn, seg, btn, face } = B;
const out = f => path.join(__dirname, f);

/* ============ C · what everyone else sees ============ */
const trackRow = (fc, nm, pct, col, score) => `
  <div style="display:grid;grid-template-columns:26px 1fr auto;align-items:center;column-gap:10px;">
    <span style="width:26px;height:26px;flex:0 0 26px;">${face(fc,26)}</span>
    <span style="min-width:0;display:flex;flex-direction:column;gap:4px;">
      <span style="font-size:13.5px;font-weight:700;">${nm}</span>
      <span style="height:8px;border-radius:99px;background:#F1EFF9;position:relative;overflow:hidden;display:block;"><span style="position:absolute;top:0;bottom:0;inset-inline-start:0;width:${pct}%;border-radius:99px;background:${col};"></span></span>
    </span>
    <span style="font-size:14px;font-weight:800;direction:ltr;font-variant-numeric:tabular-nums;">${score}</span>
  </div>`;

fs.writeFileSync(out("Meanwhile.dc.html"), phone(844, "live", `
  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
    <span style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6B6A78;">סבב 4</span>
    <span style="font-size:12.5px;font-weight:700;color:#46445A;background:#FFFFFF;border:1px solid #E7E4F0;border-radius:99px;padding:6px 13px;">אתם מנחשים</span>
  </div>

  <div style="display:flex;flex-direction:column;gap:5px;">
    <div style="font-family:'Suez One',Georgia,serif;font-size:32px;line-height:1.05;">הצפרדעים מתייעצים</div>
    <div style="font-size:14.5px;color:#6B6A78;line-height:1.45;">יש להם 45 שניות להחליט. המילה והמטרה יישארו סוד &mdash; אבל את מי הם שולחים תדעו עכשיו.</div>
  </div>

  <div style="background:#FFFFFF;border:1px solid #E7E4F0;border-radius:16px;padding:14px 16px 13px;display:flex;align-items:center;gap:14px;">
    <span style="font-size:30px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.03em;line-height:1;color:#2C6BFF;direction:ltr;flex:none;">0:38</span>
    <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:7px;">
      <span style="font-size:12.5px;font-weight:700;color:#6B6A78;">ההתייעצות שלהם</span>
      <span style="height:8px;border-radius:99px;background:#F4F2FA;overflow:hidden;display:block;"><span style="display:block;height:100%;width:84%;border-radius:99px;background:linear-gradient(90deg,#2C6BFF,#7A5AF8);"></span></span>
    </span>
  </div>

  <div>
    <div style="position:relative;background:#17161C;color:#fff;border-radius:18px 18px 4px 4px;padding:22px;overflow:clip;">
      <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7);">הם שולחים את</div>
      <div style="font-family:'Suez One',Georgia,serif;font-weight:400;font-size:42px;line-height:1.06;margin-top:8px;">דנה</div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;padding-top:14px;border-top:1px dashed rgba(255,255,255,.38);">
        <span style="font-size:16px;font-weight:800;flex:1;min-width:0;display:flex;align-items:center;gap:9px;"><span style="width:26px;height:26px;flex:0 0 26px;">${face("girl",26)}</span>הצפרדעים</span>
        <span style="font-size:15px;font-weight:800;background:rgba(255,255,255,.18);padding:5px 11px;border-radius:8px;">שנייה מתוך שלוש</span>
      </div>
    </div>${heroPerf("#17161C")}
  </div>

  <div style="flex:1;"></div>
  <div style="background:#FFFFFF;border:1px solid #E7E4F0;border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:11px;">
    ${kicker("על הלוח")}
    ${trackRow("beard","התמנונים",58,"#12B886",14)}
    ${trackRow("girl","הצפרדעים",46,"#2C6BFF",11)}
    ${trackRow("hippy","הנמלים",38,"#FF5A3D",9)}
  </div>
`));

/* ============ D · who said it ============ */
const sus = (nm, fc, outNow) => `
  <div style="display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:13px;background:${outNow?"#F4F2FA":"#FFFFFF"};border:1px solid #E7E4F0;${outNow?"opacity:.6;":""}">
    <span style="width:34px;height:34px;flex:0 0 34px;">${face(fc,34)}</span>
    <span style="flex:1;min-width:0;font-size:17px;font-weight:${outNow?700:800};${outNow?"color:#6B6A78;":""}">${nm}</span>
    ${outNow ? '<span style="font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:#FFEDE9;color:#D8351C;">בחוץ &middot; <span style="direction:ltr;display:inline-block;">1&minus;</span></span>'
             : '<span style="width:11px;height:11px;flex:0 0 11px;border-radius:50%;background:#E7E4F0;"></span>'}
  </div>`;
const why = (n, ttl, txt, soft, ink) => `
  <div style="display:flex;align-items:flex-start;gap:12px;">
    <span style="flex:0 0 30px;width:30px;height:30px;border-radius:10px;background:${soft};color:${ink};display:grid;place-items:center;font-size:13px;font-weight:800;">${n}</span>
    <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;"><b style="font-size:15px;font-weight:800;">${ttl}</b>
      <span style="font-size:13px;font-weight:600;color:#6B6A78;line-height:1.45;">${txt}</span></span>
  </div>`;

fs.writeFileSync(out("WhoSaidIt.dc.html"), phone(844, "live", `
  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
    <span style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6B6A78;">סבב 5 &middot; צעקתם</span>
    <span style="font-size:12.5px;font-weight:700;color:#46445A;background:#FFFFFF;border:1px solid #E7E4F0;border-radius:99px;padding:6px 13px;">השעון עוצר &middot; <span style="direction:ltr;display:inline-block;">0:52</span></span>
  </div>

  <div style="display:flex;flex-direction:column;gap:5px;">
    <div style="font-family:'Suez One',Georgia,serif;font-size:34px;line-height:1.05;">מי אמר?</div>
    <div style="font-size:14.5px;color:#6B6A78;line-height:1.45;">זה נשאר אצלכם. הנותן שומע רק את המילה &mdash; ואז אומר אם היא נכונה.</div>
  </div>

  <div style="display:flex;flex-direction:column;gap:8px;">
    ${sus("דנה","girl",false)}${sus("יואב","boy",false)}${sus("מיכל","curly",true)}
  </div>

  <div style="background:#FFFFFF;border:1px solid #E7E4F0;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px;">
    ${kicker("למה שואלים")}
    ${why(1,"טעות מוציאה אדם, לא קבוצה","מיכל צעקה מילה שגויה, אז מיכל בחוץ עד סוף הסבב. אתם עדיין יכולים לצעוק דרך דנה או יואב.","#FFEDE9","#D8351C")}
    <div style="height:1px;background:#F1EFF9;"></div>
    ${why(2,"הכיוון מחפש אדם","הנותן כיוון בסתר לאחד מהיושבים סביב השולחן. בלי השם הזה, אין למה להשוות.","#EAF0FF","#1B4FD1")}
  </div>

  <div style="flex:1;"></div>
  <div style="display:flex;flex-direction:column;gap:9px;">
    <div style="background:#F4F2FA;border-radius:10px;padding:11px 14px;font-size:13px;color:#6B6A78;line-height:1.5;">שלושה בקבוצה, שלוש צעקות שגויות לפני שאתם שותקים. בדיוק כמו אדם אחד לבד.</div>
    ${btn("אמרנו &mdash; תשפטו")}
  </div>
`));

/* ============ E · two scoreboards, one panel ============ */
const grp = (fc, nm, score, ink, members, last) => `
  <div style="padding:14px 0 ${last?13:12}px;${last?"":"border-bottom:1px solid #F1EFF9;"}display:flex;flex-direction:column;gap:9px;">
    <div style="display:grid;grid-template-columns:34px 1fr auto;align-items:center;column-gap:12px;">
      <span style="width:34px;height:34px;flex:0 0 34px;">${face(fc,34)}</span>
      <span style="font-size:16px;font-weight:800;">${nm}</span>
      <span style="font-size:26px;font-weight:800;color:${ink};direction:ltr;font-variant-numeric:tabular-nums;">${score}</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:5px;padding-inline-start:46px;">
      ${members.map(([n,v]) => `<div style="display:flex;justify-content:space-between;gap:10px;font-size:13px;"><span style="font-weight:700;color:#46445A;">${n}</span><span style="color:#6B6A78;direction:ltr;font-variant-numeric:tabular-nums;">${v}</span></div>`).join("")}
    </div>
  </div>`;

fs.writeFileSync(out("Standings.dc.html"), phone(844, "scored", `
  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
    <span style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6B6A78;">אחרי שנים־עשר סבבים</span>
    <span style="font-size:12.5px;font-weight:700;color:#46445A;background:#FFFFFF;border:1px solid #E7E4F0;border-radius:99px;padding:6px 13px;">9 שחקנים</span>
  </div>

  <div style="display:flex;flex-direction:column;gap:5px;">
    <div style="font-family:'Suez One',Georgia,serif;font-size:34px;line-height:1.05;">התמנונים הגיעו לסוף</div>
    <div style="font-size:14.5px;color:#6B6A78;line-height:1.45;">הקבוצה זזה על הלוח. מתחת לה, המשחק סופר כל אחד בנפרד.</div>
  </div>

  <div style="background:#FFFFFF;border:1px solid #E7E4F0;border-radius:16px;padding:6px 16px;display:flex;flex-direction:column;">
    ${grp("beard","התמנונים",24,"#0D8F69",[["רון",11],["שירה",9],["אבי",4]],false)}
    ${grp("girl","הצפרדעים",21,"#46445A",[["דנה",12],["יואב",7],["מיכל",2]],false)}
    ${grp("hippy","הנמלים",18,"#46445A",[["תמר",8],["עומר",7],["נועה",3]],true)}
  </div>

  <div style="flex:1;"></div>
  <div>
    <div style="position:relative;background:#12B886;color:#fff;border-radius:18px 18px 4px 4px;padding:20px 22px;overflow:clip;">
      <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.72);">הרמז שנחת הכי מאוחר</div>
      <div style="font-family:'Suez One',Georgia,serif;font-weight:400;font-size:32px;line-height:1.06;margin-top:8px;">דנה, בשנייה ה&#8209;<span style="direction:ltr;display:inline-block;">86</span></div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;padding-top:13px;border-top:1px dashed rgba(255,255,255,.38);">
        <span style="font-size:15px;font-weight:800;">&laquo;אסימון&raquo;</span>
        <span style="font-size:15px;font-weight:800;background:rgba(255,255,255,.18);padding:5px 11px;border-radius:8px;direction:ltr;">+6</span>
      </div>
    </div>${heroPerf("#12B886")}
  </div>
`));
console.log("wrote Meanwhile, WhoSaidIt, Standings");
require("./boards3.js");
