/* The groups-mode artboards, drawn with the game's own art.

   The faces and the wordmark are lifted straight out of public/art.js rather
   than approximated, so a board can never drift from what the phone draws.
   Run:  node design/groups/build.js                                          */
"use strict";
const fs = require("fs");
const path = require("path");

/* art.js is a browser file; give it just enough of one to load */
global.window = { matchMedia: () => ({ matches:false }) };
global.document = { getElementById: () => null, querySelector: () => null };
const art = {};
new Function("g", fs.readFileSync(path.join(__dirname, "../../public/art.js"), "utf8") +
  "\ng.faceSvg=faceSvg; g.wordmark=wordmark; g.FACES=FACES;")(art);

const face = (id, px) => art.faceSvg(id, px || 34);
const wm   = () => art.wordmark("he");

/* the clip the faces are drawn against — index.html carries it once, so each
   artboard has to carry its own */
const DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
             '<defs><clipPath id="lsface"><circle cx="20" cy="20" r="20"/></clipPath></defs></svg>';

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
    .wm{font-family:'Rubik',system-ui,sans-serif;font-weight:800;letter-spacing:0;white-space:nowrap}
    .face{display:block}
  </style>
</helmet>
`;
const FOOT = `</x-dc>
</body>
</html>
`;

/* the phone frame, exactly as public/style.css builds it: 12% of the tone
   washed down the first 300px, the body font, the paper underneath */
function phone(h, tone, body){
  const washes = { live:"44,107,255", secret:"255,176,32", scored:"18,184,134", burned:"255,90,61" };
  return HEAD + DEFS + `
<div dir="rtl" style="width:390px;height:${h}px;background:#FFFCF6;font-family:'Assistant',system-ui,sans-serif;color:#17161C;display:flex;flex-direction:column;gap:16px;padding:22px 16px 26px;box-sizing:border-box;overflow:hidden;background-image:linear-gradient(180deg,rgba(${washes[tone]},.12),rgba(255,252,246,0));background-repeat:no-repeat;background-size:100% 300px;">
${body}
</div>
` + FOOT;
}
function sheet(w, h, body){
  return HEAD + DEFS + `
<div dir="rtl" style="width:${w}px;height:${h}px;background:#FFFCF6;font-family:'Assistant',system-ui,sans-serif;color:#17161C;box-sizing:border-box;padding:28px;display:flex;flex-direction:column;gap:20px;overflow:hidden;">
${body}
</div>
` + FOOT;
}

/* ---- the small pieces the phone already draws ---- */
const kicker = txt =>
  `<p style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6B6A78;margin:0;display:flex;align-items:center;gap:10px;">${txt}<span style="flex:1;height:1px;background:#E7E4F0;"></span></p>`;
const heroPerf = bg =>
  `<div style="height:9px;background:radial-gradient(circle at 5px 0,transparent 3.6px,${bg} 4.1px) 0 0/10px 10px repeat-x;"></div>`;
/* .prow — 34px avatar, name, trailing slot */
const prow = (faceId, name, trail, dim) =>
  `<div style="display:grid;grid-template-columns:34px 1fr auto;align-items:center;column-gap:12px;padding:13px 2px;border-bottom:1px solid #F1EFF9;${dim?"opacity:.55;":""}">` +
  `<span style="width:34px;height:34px;flex:0 0 34px;">${face(faceId,34)}</span>` +
  `<span style="font-size:16px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>` +
  `<span>${trail}</span></div>`;
const tag = (txt, kind) => {
  const c = kind === "host" ? "background:#FFF3DB;color:#B77800;"
          : kind === "you"  ? "background:#EAF0FF;color:#1B4FD1;"
          :                   "background:#F4F2FA;color:#6B6A78;";
  return `<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;${c}display:inline-block;">${txt}</span>`;
};
const dot = on => `<span style="width:9px;height:9px;border-radius:50%;background:${on?"#12B886":"#E7E4F0"};display:block;"></span>`;
/* .learn — the ? row that opens an explainer sheet */
const learn = (label, teaser) =>
  `<div style="display:flex;align-items:center;gap:12px;width:100%;text-align:start;background:#FFFFFF;border:1px solid #E7E4F0;border-radius:14px;padding:11px 13px;">` +
  `<span style="flex:0 0 34px;width:34px;height:34px;border-radius:11px;background:#EAF0FF;color:#1B4FD1;display:grid;place-items:center;font-weight:800;">?</span>` +
  `<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;"><b style="font-size:15.5px;font-weight:800;">${label}</b>` +
  `<span style="font-size:12.5px;font-weight:600;color:#6B6A78;">${teaser}</span></span>` +
  `<span style="color:#A3A1B0;font-size:21px;line-height:1;transform:scaleX(-1);">&rsaquo;</span></div>`;
/* .modesw — the segmented row the lobby already uses for game modes */
const seg = opts =>
  `<div style="display:grid;grid-template-columns:repeat(${opts.length},1fr);gap:4px;padding:4px;border-radius:12px;background:#FFFFFF;border:1px solid #E7E4F0;">` +
  opts.map(o => `<div style="border-radius:9px;${o.on?"background:#2C6BFF;color:#FFFFFF;":"background:transparent;color:#6B6A78;"}font-weight:700;font-size:12.5px;padding:11px 4px;text-align:center;">${o.n}</div>`).join("") +
  `</div>`;
const btn = (txt, kind) =>
  kind === "ghost"
  ? `<div style="background:transparent;color:#46445A;border:1px solid #E7E4F0;font-size:15px;font-weight:700;border-radius:13px;padding:16px;text-align:center;">${txt}</div>`
  : `<div style="background:#2C6BFF;color:#fff;font-size:16px;font-weight:800;border-radius:13px;padding:16px;text-align:center;box-shadow:0 1px 2px rgba(23,22,28,.05),0 8px 24px -14px rgba(23,22,28,.35);">${txt}</div>`;

module.exports = { phone, sheet, kicker, heroPerf, prow, tag, dot, learn, seg, btn, face, wm, DEFS };
if(require.main === module) require("./boards.js");
