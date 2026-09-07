"use strict";
const fs = require("fs");
const path = require("path");
const B = require("./build.js");
const { sheet, kicker, face } = B;
const out = f => path.join(__dirname, f);

const card = (n, soft, ink, ttl, body, foot, footInk) => `
  <div style="background:#FFFFFF;border:1px solid #E7E4F0;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:9px;">
    <span style="width:32px;height:32px;border-radius:11px;background:${soft};color:${ink};display:grid;place-items:center;font-size:13px;font-weight:800;">${n}</span>
    <b style="font-size:16px;font-weight:800;">${ttl}</b>
    <span style="font-size:13px;font-weight:600;color:#6B6A78;line-height:1.5;">${body}</span>
    <span style="margin-top:auto;padding-top:9px;border-top:1px solid #F1EFF9;font-size:12.5px;font-weight:700;color:${footInk};">${foot}</span>
  </div>`;

/* ============ F · the huddle, ruled ============ */
fs.writeFileSync(out("HuddleRules.dc.html"), sheet(820, 660, `
  <div style="display:flex;flex-direction:column;gap:5px;">
    <div style="font-family:'Suez One',Georgia,serif;font-size:32px;line-height:1.05;">ההתייעצות</div>
    <div style="font-size:14.5px;color:#6B6A78;line-height:1.45;max-width:660px;">אצל שחקן יחיד זו החלטה שקטה של שתי שניות. בקבוצה זה ויכוח &mdash; והוויכוח הוא החלק הכי טוב, כל עוד הוא לא הופך את שאר השולחן לצופים.</div>
  </div>

  <div style="background:#FFFFFF;border:1px solid #E7E4F0;border-radius:16px;padding:18px;display:flex;gap:22px;align-items:stretch;">
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;">
      <span style="font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#6B6A78;">הכלל הראשון</span>
      <b style="font-size:19px;font-weight:800;line-height:1.25;">45 שניות, על שעון נפרד</b>
      <span style="font-size:13px;font-weight:600;color:#6B6A78;line-height:1.55;">מפתה לגזור את זמן ההתייעצות מתוך שעון הסבב &mdash; אבל אסור. הניקוד של הנותן נמדד כאחוז מהשעון, אז סבב קצר יותר הופך כל קליטה למאוחרת יותר &mdash; ומאוחר יותר שווה יותר. כלומר קבוצה שמתמהמהת הייתה מרוויחה מזה.</span>
    </div>
    <div style="width:1px;background:#F1EFF9;flex:none;"></div>
    <div style="flex:0 0 286px;display:flex;flex-direction:column;gap:9px;">
      <span style="font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#6B6A78;">אותה קליטה, בשנייה ה&#8209;<span style="direction:ltr;display:inline-block;">45</span></span>
      <div style="display:flex;flex-direction:column;gap:7px;">
        <div style="display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:12px;background:#F4F2FA;">
          <span style="flex:1;min-width:0;font-size:13px;font-weight:700;color:#46445A;">שעון מלא, 90 שניות</span>
          <span style="font-size:12.5px;font-weight:800;color:#6B6A78;">כוון היטב</span>
        </div>
        <div style="display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:12px;background:#E6F7F1;">
          <span style="flex:1;min-width:0;font-size:13px;font-weight:700;color:#46445A;">אחרי 30 שניות פטפוט</span>
          <span style="font-size:12.5px;font-weight:800;color:#0D8F69;">כמעט איבד אותם</span>
        </div>
      </div>
      <span style="font-size:12.5px;font-weight:700;color:#D8351C;line-height:1.4;">נקודה שלמה יותר, על פטפוט. שעון נפרד סוגר את הפרצה.</span>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:stretch;">
    ${card(2,"#FFEDE9","#D8351C","נגמר הזמן? המילה היקרה","לא החלטתם בזמן &mdash; המשחק לוקח לכם את המילה היקרה מבין הארבע, בלי נושא ובלי כיוון. עונש שמסיים ויכוחים, ולעולם לא תוקע את החדר.","אף פעם לא &laquo;כלום&raquo;. תמיד משהו קשה.","#D8351C")}
    ${card(3,"#EAF0FF","#1B4FD1","מי שמחזיק אינו מי שמדבר","הטלפון עובר למישהו אחר בקבוצה. זה מונע מאדם דומיננטי אחד לקחת את כל התור, ומשאיר לדובר ידיים פנויות &mdash; קריטי בסבב פנטומימה.","שני תפקידים, שני אנשים, אפס כללים נוספים.","#1B4FD1")}
    ${card(4,"#E6F7F1","#0D8F69","הדובר מתפרסם מיד","ברגע שנבחר, שאר השולחן רואה מי זה &mdash; וההמתנה המתה הופכת לרכילות. המילה, הקושי והכיוון נשארים סוד עד הסוף.","גם מוודא שאף קבוצה לא מרמה את הסיבוב.","#0D8F69")}
  </div>
`));

/* ============ G · the bench, ruled ============ */
const cyc = (label, labelInk, who, note, style) => `
  <div style="background:${style==="next"?"#FFF3DB":"#FFFFFF"};border:1px solid ${style==="now"?"#2C6BFF":style==="next"?"#E7E4F0":"#E7E4F0"};border-radius:14px;padding:13px 14px;display:flex;flex-direction:column;gap:7px;${style==="spent"?"opacity:.62;":""}${style==="now"?"box-shadow:0 1px 2px rgba(23,22,28,.05),0 8px 24px -14px rgba(23,22,28,.35);":""}">
    <span style="font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:${labelInk};">${label}</span>
    <span style="display:flex;align-items:center;gap:8px;font-size:18px;font-weight:800;">${who}</span>
    <span style="font-size:12.5px;font-weight:600;color:${style==="next"?"#8A6410":"#6B6A78"};">${note}</span>
  </div>`;
const mini = (id) => `<span style="width:22px;height:22px;flex:0 0 22px;display:block;">${face(id,22)}</span>`;

fs.writeFileSync(out("Bench.dc.html"), sheet(820, 690, `
  <div style="display:flex;flex-direction:column;gap:5px;">
    <div style="font-family:'Suez One',Georgia,serif;font-size:32px;line-height:1.05;">הספסל</div>
    <div style="font-size:14.5px;color:#6B6A78;line-height:1.45;max-width:640px;">התור עובר בין קבוצות, לא בין אנשים. בתוך הקבוצה, אתם בוחרים מי מדבר &mdash; וזו ההחלטה החוזרת של המצב הזה. בלי כלל, הקבוצה תשלח את אותו אחד כל סבב, והשניים האחרים רק יצפו.</div>
  </div>

  <div style="display:flex;flex-direction:column;gap:9px;">
    ${kicker("הכלל &middot; כולם מדברים לפני שמישהו מדבר פעמיים")}
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 52px 1fr;gap:10px;align-items:stretch;">
      ${cyc("סבב 1","#6B6A78", mini("curly")+"מיכל","דיברה. יוצאת מהסגל.","spent")}
      ${cyc("סבב 4 &middot; עכשיו","#1B4FD1", mini("girl")+mini("boy")+"דנה או יואב","בחירה אמיתית. הסבב הזה פנטומימה.","now")}
      ${cyc("סבב 7","#6B6A78","מי שנשאר","אין מה לבחור. זה בכוונה.","")}
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#B77800;">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B77800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.3-6.4L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-15.3 6.4L3 16"></path><path d="M3 21v-5h5"></path></svg>
        <span style="font-size:10.5px;font-weight:800;letter-spacing:.06em;text-align:center;line-height:1.2;">מתאפס</span>
      </div>
      ${cyc("סבב 10","#B77800", mini("girl")+mini("boy")+mini("curly")+"שלושתם","הסגל מלא, והבחירה חוזרת.","next")}
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:stretch;">
    ${card(1,"#EAF0FF","#1B4FD1","סגל מול לוח זמנים","הטוויסט של הסבב ידוע לפני שבוחרים. לשרוף את הממחיז הכי טוב על סבב פנטומימה, או לשמור אותו לסבב הכפול שמגיע אחריו? זו כל המכניקה.","מסך ההתייעצות מראה את שניהם, זה ליד זה.","#1B4FD1")}
    ${card(2,"#FFF3DB","#B77800","ויתור אחד למשחק","מישהו לא רוצה &mdash; ילד ביישן, אורח, סבתא. ויתור מדלג עליו בסיבוב הזה, והסבב יורד ל&laquo;מה שיוצא&raquo;: בלי נושא, בלי בונוס.","זול, אבל לא חינם. ואי אפשר לבנות על זה.","#B77800")}
    ${card(3,"#E6F7F1","#0D8F69","קבוצות לא שוות &mdash; זה בסדר","בקבוצה של ארבעה הסיבוב ארוך יותר, אז הנותן החזק שלה עולה לתור לעיתים רחוקות יותר. זה מאזן את עצמו &mdash; אין צורך לחלק שווה בשווה.","שניים עד חמישה בקבוצה, בלי כלל נוסף.","#0D8F69")}
  </div>
`));
console.log("wrote HuddleRules, Bench");
