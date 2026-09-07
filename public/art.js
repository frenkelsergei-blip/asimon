/* Asimon — the drawn bits.
   Card faces, the draining clock ring, and the burst when someone lands it.
   Everything here checks prefers-reduced-motion before it moves.            */
"use strict";

const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- the mark ---------------- */
/* The asimon: a struck token, milled edge, groove inset so it stays a channel
   and not a prohibition sign. Two cuts of the same coin — the milling closes
   into a solid ring below about 40px, so small sizes drop it and keep the rim,
   which is the part that gives an amber disc an edge on paper.               */
const COIN_FACE = "#FFB020", COIN_RIM = "#D18A08", COIN_INK = "#17161C";

function coinSvg(css, milled){
  return '<svg viewBox="0 0 100 100" style="'+css+'" aria-hidden="true">'+
    '<circle cx="50" cy="50" r="50" fill="'+COIN_RIM+'"/>'+
    (milled ? '<circle cx="50" cy="50" r="47" fill="none" stroke="'+COIN_INK+'" stroke-width="6" '+
              'stroke-dasharray="3 6.2285" stroke-linecap="butt" opacity=".85"/>' : '')+
    '<circle cx="50" cy="50" r="'+(milled ? 42 : 43)+'" fill="'+COIN_FACE+'"/>'+
    '<rect x="26" y="41" width="48" height="18" rx="9" fill="'+COIN_INK+'" '+
      'transform="rotate(-30 50 50)"/></svg>';
}

/* the token on its own, at a pixel size */
function coinMark(px){
  return coinSvg("width:"+px+"px;height:"+px+"px;display:block", px >= 40);
}

/* the wordmark: the round letter — ס in Hebrew, O in English — is the token.
   Set in the logo face; the h1 around it keeps its own size.                 */
function wordmark(lg){
  const he = lg === "he";
  const tok = coinSvg("width:.78em;height:.78em;display:inline-block;vertical-align:"+
                      (he ? "-.05" : "-.06")+"em", false);
  return he ? '<span class="wm">א'+tok+'ימון</span>'
            : '<span class="wm en">ASIM'+tok+'N</span>';
}

/* ---------------- card faces ---------------- */
const ICONS = {
  stopwatch:'<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2"/><path d="M9.5 2h5"/>'+
            '<path d="M12 2v3"/><path d="M19.4 6.6L21 5"/>',
  insight:  '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  veto:     '<path d="M21 11.5a8.5 8.5 0 0 1-12 7.7L3 21l1.8-6A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.5 8.5l7 7"/>',
  mime:     '<path d="M4.5 14.5c2.3 1.8 5 2.7 7.5 2.7s5.2-.9 7.5-2.7"/><circle cx="8.5" cy="9" r="1.1"/>'+
            '<circle cx="15.5" cy="9" r="1.1"/><path d="M3 3l18 18"/>',
  double:   '<path d="M5 7l7 10M12 7L5 17"/><path d="M15.5 8.5a2.6 2.6 0 1 1 4.4 1.9L15.5 16h5"/>',
  swap:     '<path d="M3.5 8.5h13l-3.6-3.6"/><path d="M20.5 15.5h-13l3.6 3.6"/>',
  blindfold:'<path d="M9.9 5.2A9.9 9.9 0 0 1 12 5c6 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4"/>'+
            '<path d="M6.5 6.6A17.6 17.6 0 0 0 2 12s4 7 10 7c1.5 0 2.9-.3 4.1-.8"/><path d="M3 3l18 18"/>'
};
const CARD_TONE = {
  stopwatch:"guilty", insight:"violet", veto:"blind", mime:"accent",
  double:"good", swap:"ink", blindfold:"violet"
};
function cardIcon(key, size){
  const d = ICONS[key] || ICONS.insight;
  return '<svg class="cicon" viewBox="0 0 24 24" width="'+(size||26)+'" height="'+(size||26)+'" '+
         'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" '+
         'stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
}
function cardTile(key, size){
  return '<span class="ctile t-'+(CARD_TONE[key]||"accent")+'">'+cardIcon(key, size)+'</span>';
}

/* ---------------- the clock, as a draining ring ---------------- */
const RING_R = 66, RING_C = 2 * Math.PI * RING_R;
function clockRing(label){
  return '<div class="ring">'+
    '<svg viewBox="0 0 160 160" aria-hidden="true">'+
      '<circle class="ring-bg" cx="80" cy="80" r="'+RING_R+'"/>'+
      '<circle class="ring-fg" id="ring" cx="80" cy="80" r="'+RING_R+'" '+
        'stroke-dasharray="'+RING_C.toFixed(1)+'" stroke-dashoffset="0"/>'+
    '</svg>'+
    '<div class="bigclock" id="clk">'+label+'</div></div>';
}
function setRing(frac){
  const el = document.getElementById("ring");
  if(!el) return;
  const f = Math.max(0, Math.min(1, frac));
  el.setAttribute("stroke-dashoffset", (RING_C * (1 - f)).toFixed(1));
}

/* ---------------- the burst when it lands ---------------- */
let burstCanvas = null;
function burst(opts){
  if(REDUCED) return;
  const o = opts || {};
  if(!burstCanvas){
    burstCanvas = document.createElement("canvas");
    burstCanvas.className = "burst";
    document.body.appendChild(burstCanvas);
  }
  const cv = burstCanvas, ctx = cv.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = cv.width  = innerWidth  * dpr;
  const h = cv.height = innerHeight * dpr;
  cv.style.width = innerWidth + "px";
  cv.style.height = innerHeight + "px";

  const colors = o.colors || ["#12B886","#2C6BFF","#FFB020","#FF5A3D","#7A5AF8"];
  const cx = (o.x !== undefined ? o.x : innerWidth / 2) * dpr;
  const cy = (o.y !== undefined ? o.y : innerHeight * 0.34) * dpr;
  const n = o.count || 90;
  const bits = [];
  for(let i = 0; i < n; i++){
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const speed = (4 + Math.random() * 9) * dpr;
    bits.push({
      x:cx, y:cy,
      vx:Math.cos(a) * speed * (0.6 + Math.random() * 0.8),
      vy:Math.sin(a) * speed - 5 * dpr,
      w:(4 + Math.random() * 5) * dpr,
      h:(7 + Math.random() * 7) * dpr,
      rot:Math.random() * Math.PI,
      spin:(Math.random() - 0.5) * 0.35,
      col:colors[(Math.random() * colors.length) | 0],
      life:0
    });
  }
  const TTL = 95;
  let frame = 0, raf = 0;
  function step(){
    ctx.clearRect(0, 0, w, h);
    frame++;
    let alive = 0;
    for(const b of bits){
      b.life++;
      if(b.life > TTL) continue;
      alive++;
      b.vy += 0.42 * dpr;
      b.vx *= 0.99;
      b.x += b.vx; b.y += b.vy; b.rot += b.spin;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - b.life / TTL);
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.col;
      ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h);
      ctx.restore();
    }
    if(alive && frame < TTL + 10) raf = requestAnimationFrame(step);
    else { ctx.clearRect(0, 0, w, h); cancelAnimationFrame(raf); }
  }
  step();
}

/* a quick coloured flash behind the whole screen — used when a card lands */
function flash(tone){
  if(REDUCED) return;
  const el = document.createElement("div");
  el.className = "flash t-" + (tone || "accent");
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

/* ============================================================
   The cast. Fifteen faces: people first, then a few creatures.
   Each is drawn in a 40x40 box on its own coloured disc, so the
   same art serves a 46px picker tile and a 23px board token.
   ============================================================ */
const SKIN = { light:"#F2C79E", tan:"#D99A6C", deep:"#8D5524", old:"#EFCBAA" };
const LINE = "#2A2118";
function eyes(y, c){
  const f = c || LINE;
  return '<circle cx="16" cy="'+y+'" r="1.6" fill="'+f+'"/><circle cx="24" cy="'+y+'" r="1.6" fill="'+f+'"/>';
}
function smile(y){
  return '<path d="M16.4 '+y+'q3.6 3 7.2 0" stroke="'+LINE+'" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
}
/* shoulders, head, then whatever makes this one a person */
function person(o){
  return '<path d="M5.5 40c0-8 6.5-11.6 14.5-11.6S34.5 32 34.5 40Z" fill="'+o.shirt+'"/>'+
         '<circle cx="20" cy="18.5" r="11" fill="'+(o.skin || SKIN.light)+'"/>'+
         (o.hair || "") + (o.eyes || eyes(18)) + (o.mouth || smile(23.4)) + (o.extra || "");
}

const FACES = [
  { id:"boy", bg:"#2C6BFF", art: person({
      shirt:"#1B4FD1",
      hair:'<ellipse cx="20" cy="11.4" rx="11" ry="6.2" fill="#3B2A1A"/>' }) },

  { id:"girl", bg:"#DB2777", art: person({
      shirt:"#A81A5B",
      hair:'<rect x="8.2" y="13" width="4" height="16" rx="2" fill="#4A2C17"/>'+
           '<rect x="27.8" y="13" width="4" height="16" rx="2" fill="#4A2C17"/>'+
           '<ellipse cx="20" cy="12" rx="11.8" ry="7" fill="#4A2C17"/>' }) },

  { id:"grandpa", bg:"#78716C", art: person({
      shirt:"#57534E", skin:SKIN.old,
      hair:'<ellipse cx="10.4" cy="16.5" rx="2.7" ry="4.6" fill="#D6D3D1"/>'+
           '<ellipse cx="29.6" cy="16.5" rx="2.7" ry="4.6" fill="#D6D3D1"/>'+
           '<ellipse cx="20" cy="9.6" rx="7.6" ry="2.4" fill="#D6D3D1"/>',
      extra:'<ellipse cx="20" cy="25.4" rx="5.4" ry="2.1" fill="#D6D3D1"/>'+
            '<circle cx="15.4" cy="17.8" r="3.6" fill="none" stroke="#3F3A36" stroke-width="1.1"/>'+
            '<circle cx="24.6" cy="17.8" r="3.6" fill="none" stroke="#3F3A36" stroke-width="1.1"/>'+
            '<path d="M19 17.8h2M11.8 17.2l-2.4-.6M28.2 17.2l2.4-.6" stroke="#3F3A36" stroke-width="1.1" stroke-linecap="round"/>',
      eyes: eyes(17.8),
      mouth:'<path d="M17.4 28.4h5.2" stroke="'+LINE+'" stroke-width="1.3" stroke-linecap="round"/>' }) },

  { id:"grandma", bg:"#7A5AF8", art: person({
      shirt:"#5E3FDB", skin:SKIN.old,
      hair:'<circle cx="20" cy="5.4" r="4.4" fill="#E7E5E4"/>'+
           '<ellipse cx="20" cy="11.6" rx="11.2" ry="6.6" fill="#E7E5E4"/>',
      extra:'<circle cx="15.4" cy="17.8" r="3.6" fill="none" stroke="#3B2E6B" stroke-width="1.1"/>'+
            '<circle cx="24.6" cy="17.8" r="3.6" fill="none" stroke="#3B2E6B" stroke-width="1.1"/>'+
            '<path d="M19 17.8h2M11.8 17.2l-2.4-.6M28.2 17.2l2.4-.6" stroke="#3B2E6B" stroke-width="1.1" stroke-linecap="round"/>',
      eyes: eyes(17.8) }) },

  { id:"hippy", bg:"#12B886", art: person({
      shirt:"#0D8F69",
      hair:'<rect x="7.4" y="12" width="4.4" height="18" rx="2.2" fill="#7C4A21"/>'+
           '<rect x="28.2" y="12" width="4.4" height="18" rx="2.2" fill="#7C4A21"/>'+
           '<ellipse cx="20" cy="12" rx="12.2" ry="7.4" fill="#7C4A21"/>'+
           '<rect x="8" y="12.4" width="24" height="3.4" rx="1.7" fill="#FF5A3D"/>',
      eyes:'<circle cx="15.2" cy="19.4" r="3.7" fill="#3A2405" opacity=".82"/>'+
           '<circle cx="24.8" cy="19.4" r="3.7" fill="#3A2405" opacity=".82"/>'+
           '<path d="M18.9 19.4h2.2" stroke="#3A2405" stroke-width="1.1"/>',
      mouth: smile(25) }) },

  { id:"beard", bg:"#B45309", art: person({
      shirt:"#92400E", skin:SKIN.tan,
      /* forehead and cheeks stay bare — the dark sits only on the jaw */
      hair:'<ellipse cx="20" cy="10.4" rx="11" ry="5.6" fill="#2F241A"/>'+
           '<ellipse cx="20" cy="27.4" rx="9.4" ry="6.4" fill="#2F241A"/>'+
           '<ellipse cx="20" cy="22.6" rx="4.8" ry="1.8" fill="#2F241A"/>',
      eyes: eyes(17.4),
      mouth:'' }) },

  { id:"curly", bg:"#FF5A3D", art: person({
      shirt:"#C2410C", skin:SKIN.deep,
      hair:'<circle cx="11.8" cy="13.6" r="4.6" fill="#1E1712"/><circle cx="28.2" cy="13.6" r="4.6" fill="#1E1712"/>'+
           '<circle cx="15.6" cy="9.8" r="4.4" fill="#1E1712"/><circle cx="24.4" cy="9.8" r="4.4" fill="#1E1712"/>'+
           '<circle cx="20" cy="8.6" r="4.8" fill="#1E1712"/>',
      eyes: eyes(18.4, "#1E1712"),
      mouth: smile(23.8) }) },

  { id:"beanie", bg:"#0891B2", art: person({
      shirt:"#0E7490",
      hair:'<ellipse cx="20" cy="12.4" rx="11.2" ry="6.6" fill="#F97316"/>'+
           '<rect x="7.8" y="13.2" width="24.4" height="3.8" rx="1.9" fill="#EA580C"/>'+
           '<circle cx="20" cy="5" r="2.6" fill="#EA580C"/>',
      eyes: eyes(20.4), mouth: smile(25.4) }) },

  { id:"astro", bg:"#17161C", art:
      '<path d="M5.5 40c0-8 6.5-11.6 14.5-11.6S34.5 32 34.5 40Z" fill="#E2E8F0"/>'+
      '<rect x="4.6" y="16.4" width="3.4" height="6" rx="1.7" fill="#CBD5E1"/>'+
      '<rect x="32" y="16.4" width="3.4" height="6" rx="1.7" fill="#CBD5E1"/>'+
      '<circle cx="20" cy="19" r="12.4" fill="#F8FAFC"/>'+
      '<circle cx="20" cy="18.4" r="8.8" fill="#1E293B"/>'+
      '<path d="M14.6 15a6.4 6.4 0 0 1 5.2-3" stroke="#93C5FD" stroke-width="1.7" fill="none" stroke-linecap="round"/>' },

  { id:"robot", bg:"#64748B", art:
      '<path d="M5.5 40c0-8 6.5-11.6 14.5-11.6S34.5 32 34.5 40Z" fill="#334155"/>'+
      '<rect x="19.2" y="3.6" width="1.6" height="5.4" rx=".8" fill="#CBD5E1"/>'+
      '<circle cx="20" cy="3" r="2.2" fill="#FFB020"/>'+
      '<rect x="8.6" y="8.6" width="22.8" height="20.4" rx="6.4" fill="#E2E8F0"/>'+
      '<rect x="12.8" y="15" width="5.4" height="5.4" rx="1.7" fill="#0F172A"/>'+
      '<rect x="21.8" y="15" width="5.4" height="5.4" rx="1.7" fill="#0F172A"/>'+
      '<rect x="15.4" y="23.4" width="9.2" height="1.8" rx=".9" fill="#0F172A"/>' },

  { id:"fox", bg:"#F97316", art:
      '<path d="M7 12 11 3 16.5 9.5Z" fill="#C2410C"/><path d="M33 12 29 3 23.5 9.5Z" fill="#C2410C"/>'+
      '<ellipse cx="20" cy="26.5" rx="10" ry="7.5" fill="#FFF1E8"/>'+
      eyes(19) + '<circle cx="20" cy="25" r="2.3" fill="#3A2318"/>' },

  { id:"cat", bg:"#FACC15", art:
      '<path d="M8 13 10.5 4 17 10Z" fill="#CA8A04"/><path d="M32 13 29.5 4 23 10Z" fill="#CA8A04"/>'+
      eyes(20) + '<path d="M20 25 18.4 27h3.2Z" fill="#3A2318"/>'+
      '<path d="M6.5 22h5M6.5 25.5h5M33.5 22h-5M33.5 25.5h-5" stroke="#7C5E06" stroke-width="1.4" stroke-linecap="round"/>' },

  { id:"owl", bg:"#6366F1", art:
      '<path d="M8.5 11 13 4 17.5 10.5Z" fill="#4338CA"/><path d="M31.5 11 27 4 22.5 10.5Z" fill="#4338CA"/>'+
      '<circle cx="14.4" cy="20" r="6.4" fill="#EEF2FF"/><circle cx="25.6" cy="20" r="6.4" fill="#EEF2FF"/>'+
      '<circle cx="14.4" cy="20" r="2.6" fill="#1E1B4B"/><circle cx="25.6" cy="20" r="2.6" fill="#1E1B4B"/>'+
      '<path d="M20 25.5 17.4 29.5h5.2Z" fill="#FFB020"/>' },

  { id:"frog", bg:"#4D7C0F", art:
      '<circle cx="12.5" cy="11" r="6.2" fill="#3F6212"/><circle cx="27.5" cy="11" r="6.2" fill="#3F6212"/>'+
      '<circle cx="12.5" cy="11" r="3.6" fill="#FFFFFF"/><circle cx="27.5" cy="11" r="3.6" fill="#FFFFFF"/>'+
      '<circle cx="12.5" cy="11.4" r="1.8" fill="#14200A"/><circle cx="27.5" cy="11.4" r="1.8" fill="#14200A"/>'+
      '<path d="M11 25q9 7 18 0" stroke="#14200A" stroke-width="2.1" fill="none" stroke-linecap="round"/>' },

  { id:"panda", bg:"#E7E5E4", art:
      '<circle cx="9" cy="9.5" r="5.8" fill="#20202A"/><circle cx="31" cy="9.5" r="5.8" fill="#20202A"/>'+
      '<ellipse cx="13.8" cy="20" rx="5.2" ry="6" fill="#20202A" transform="rotate(-14 13.8 20)"/>'+
      '<ellipse cx="26.2" cy="20" rx="5.2" ry="6" fill="#20202A" transform="rotate(14 26.2 20)"/>'+
      '<circle cx="14.4" cy="20" r="1.9" fill="#FFFFFF"/><circle cx="25.6" cy="20" r="1.9" fill="#FFFFFF"/>'+
      '<ellipse cx="20" cy="27" rx="3" ry="2.2" fill="#20202A"/>' }
];

const FACE_BY_ID = {};
FACES.forEach(f => { FACE_BY_ID[f.id] = f; });
const faceOf = id => FACE_BY_ID[id] || FACES[0];

/* the picker tile and every avatar in the interface */
function faceSvg(id, px){
  const f = faceOf(id), s = px || 34;
  return '<svg class="face" viewBox="0 0 40 40" width="'+s+'" height="'+s+'" aria-hidden="true">'+
         '<circle cx="20" cy="20" r="20" fill="'+f.bg+'"/>'+
         '<g clip-path="url(#lsface)">'+f.art+'</g></svg>';
}
/* the same art as a token on the board, inside the board's own svg */
function faceToken(id, x, y, r){
  const f = faceOf(id), k = r / 20;
  return '<g transform="translate('+(x - r)+','+(y - r)+') scale('+k.toFixed(4)+')">'+
         '<circle cx="20" cy="20" r="20" fill="'+f.bg+'"/>'+
         '<g clip-path="url(#lsface)">'+f.art+'</g></g>'+
         '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="none" stroke="var(--surface)" stroke-width="'+(2.5/k*k).toFixed(2)+'"/>';
}
