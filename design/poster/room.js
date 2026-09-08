/* The poster with people on it.

   The first poster is a typographic one: a headline, the token, and the one
   rule worth printing. It works on a wall you are already standing at. This
   one has a different job — it has to be recognisable as a game from across a
   room, the way a game on a shelf is: somebody is playing it, and you can see
   what playing it looks like.

   So: a family in a living room, three phones, the screen on the wall showing
   the board they are actually playing, and the sentence one of them just said
   hanging in the air with the token dropping out of it. The rules are not
   printed beside the picture; they ARE the picture, and three short lines
   under it name what you are looking at.

   Nothing here is invented twice. The faces are the game's own cast, lifted
   out of public/art.js — same hair, same eyes, same shirt colour, drawn at
   fifty times the size they appear on a phone. The board on the wall is a
   real engine state drawn by public/boardart.js. The room around them is the
   only thing this file draws from scratch, and it is deliberately unsaturated
   so the only strong colours on the page are the three people and the token. */
"use strict";

module.exports = function build(P) {

const { INK, SECOND, MUTED, AMBER, AMBER_D, AMBER_I, AMBER_S, GOOD, GOOD_D, HOT, HOT_D,
        PAPER, CARD, SAND, RULE, DISPLAY, LOGO, BODY, A4, art, boardSvg,
        n, wordmark, eyebrow, foot } = P;

/* The room's own neutrals. A living room needs colours the interface has no
   token for; they are all warm greys off the same paper, chosen so that the
   three people are the only saturated things above the fold. */
const WALL_LIT = "#F7DDA8";                   /* the wall where the lamp reaches */
const FLOOR = "#DECFAF", RUG = "#CBB68C", RUG_LINE = "#B49C6C";
const SEAT  = "#BFA47C", BACK = "#A88C62", ARMR = "#B3986F", WOOD = "#705A38";
const SCENE = { w: A4.w, h: 470 };
const SOFA  = { top: 170, seat: 300, base: 344, foot: 392, l: 92, r: 702 };

/* ---------------- the cast, drawn large ---------------- */

/* The shirt and the skin are inside the drawing rather than beside it, so
   they are read back off the drawing. A poster that picked its own blue would
   be a poster for a different game. */
function partsOf(id) {
  const a = art.faceOf(id).art;
  const shirt = a.match(/^<path d="M5\.5 40[^"]*" fill="(#[0-9A-Fa-f]{6})"/);
  const skin  = a.match(/<circle cx="20" cy="18\.5" r="11" fill="(#[0-9A-Fa-f]{6})"/);
  if (!shirt || !skin) throw new Error("art.js no longer draws " + id + " as a person");
  return { art: a, shirt: shirt[1], skin: skin[1], disc: art.faceOf(id).bg };
}

/* A phone, held. The screen is the moment that player is actually in — the
   four words, the clock draining, the button — because the question a poster
   like this has to answer from across a room is what is on their phone. Each
   screen is one flat shape and a colour, which is all that survives at 50px. */
function phone(o) {
  const w = o.w, h = w * 1.92, x = -w / 2, y = -h / 2, r = w * 0.14;
  return '<g transform="translate(' + o.x + ',' + o.y + ') rotate(' + o.rot + ')" ' +
      'filter="url(#lift2)">' +
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r +
      '" fill="' + INK + '"/>' +
    '<rect x="' + (x + w * .04) + '" y="' + (y + h * .02) + '" width="' + (w * .3) + '" height="' +
      (h * .96) + '" rx="' + r + '" fill="#FFFFFF" opacity=".07"/>' +
    '<rect x="' + (x + w * .075) + '" y="' + (y + h * .05) + '" width="' + (w * .85) +
      '" height="' + (h * .90) + '" rx="' + (r * .65) + '" fill="' + o.bg + '"/>' +
    o.screen(w, h) + "</g>";
}

/* the giver's: four words, one of them chosen */
function wordsScreen(w, h) {
  let out = "";
  [0, 1, 2, 3].forEach(i => {
    const on = i === 1, y = -h * .28 + i * h * .165;
    out += '<rect x="' + (-w * .31) + '" y="' + y + '" width="' + (w * .62) + '" height="' +
      (h * .115) + '" rx="' + (h * .057) + '" fill="' + (on ? INK : "#FFFFFF") +
      '" opacity="' + (on ? 1 : .92) + '"/>';
  });
  return out;
}

/* the one still thinking: the ring draining */
function clockScreen(w, h) {
  const cy = -h * .08, r = w * .27, c = 2 * Math.PI * r;
  return '<circle cx="0" cy="' + cy + '" r="' + r + '" fill="none" stroke="#EDE7DC" stroke-width="' +
      (w * .13) + '"/>' +
    '<circle cx="0" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + HOT + '" stroke-width="' +
      (w * .13) + '" stroke-linecap="round" stroke-dasharray="' + (c * .2).toFixed(1) + " " +
      (c * .8).toFixed(1) + '" transform="rotate(-90 0 ' + cy + ')"/>' +
    '<rect x="' + (-w * .24) + '" y="' + (h * .24) + '" width="' + (w * .48) + '" height="' +
      (h * .075) + '" rx="' + (h * .04) + '" fill="#DFD8CB"/>';
}

/* the one who got it: the whole screen is the button */
function buzzScreen(w, h) {
  return '<rect x="' + (-w * .30) + '" y="' + (-h * .26) + '" width="' + (w * .60) +
    '" height="' + (h * .38) + '" rx="' + (w * .17) + '" fill="#FFFFFF"/>' +
    '<rect x="' + (-w * .20) + '" y="' + (h * .22) + '" width="' + (w * .40) + '" height="' +
      (h * .07) + '" rx="' + (h * .035) + '" fill="#FFFFFF" opacity=".55"/>';
}

/* One of the cast, seated: a body drawn to the size of the head, then the
   head itself stamped on top out of art.js. The drawing brings its own
   shoulders — the same shirt colour, so they disappear into the body — which
   is what keeps the poster and the phone showing the same person. */
function figure(o) {
  const R = o.r, X = o.x, Y = o.y, p = partsOf(o.face);
  const k = R / 11;                     /* the cast is drawn with a head of r=11 */
  const arm = (sx, sy, ex, ey, cx, cy) =>
    '<path d="M' + sx + " " + sy + "Q" + cx + " " + cy + " " + ex + " " + ey +
    '" stroke="' + p.shirt + '" stroke-width="' + (R * .44).toFixed(1) +
    '" fill="none" stroke-linecap="round"/>';

  const hy = Y + R * 2.06, hx = R * .60;          /* where the hands are */
  const px = X + (o.hand || 0) * R, py = hy - R * .34;

  return '<g>' +
    /* the disc every player is on the board, standing in for the light */
    '<circle cx="' + X + '" cy="' + (Y - R * .1) + '" r="' + (R * 1.62) + '" fill="' +
      p.disc + '" opacity=".13"/>' +
    '<path d="M' + (X - R * 1.52) + " " + SOFA.foot +
      "C" + (X - R * 1.52) + " " + (Y + R * 1.55) + " " + (X - R * .95) + " " + (Y + R * .92) +
        " " + X + " " + (Y + R * .92) +
      "C" + (X + R * .95) + " " + (Y + R * .92) + " " + (X + R * 1.52) + " " + (Y + R * 1.55) +
        " " + (X + R * 1.52) + " " + SOFA.foot +
      'Z" fill="' + p.shirt + '"/>' +
    '<path d="M' + (X - R * 1.52) + " " + SOFA.foot +
      "C" + (X - R * 1.52) + " " + (Y + R * 1.55) + " " + (X - R * .95) + " " + (Y + R * .92) +
        " " + X + " " + (Y + R * .92) +
      "C" + (X + R * .95) + " " + (Y + R * .92) + " " + (X + R * 1.52) + " " + (Y + R * 1.55) +
        " " + (X + R * 1.52) + " " + SOFA.foot +
      'Z" fill="url(#lit)"/>' +
    /* the head goes on before the arms do. art.js draws its own shoulders
       under the face, in the shirt colour — stamped last they land on top of
       the phone, and the phone is the thing this poster is about */
    '<g transform="translate(' + (X - 20 * k).toFixed(1) + " " + (Y - 18.5 * k).toFixed(1) +
      ') scale(' + k.toFixed(4) + ')">' + p.art + "</g>" +
    arm(X - R * 1.30, Y + R * 1.62, X - hx, hy, X - R * 1.46, hy + R * .30) +
    arm(X + R * 1.30, Y + R * 1.62, X + hx, hy, X + R * 1.46, hy + R * .30) +
    /* hands behind the phone, one thumb over it, or it reads as a card held
       up rather than a phone somebody is using */
    '<circle cx="' + (X - hx) + '" cy="' + hy + '" r="' + (R * .23) + '" fill="' + p.skin + '"/>' +
    '<circle cx="' + (X + hx) + '" cy="' + hy + '" r="' + (R * .23) + '" fill="' + p.skin + '"/>' +
    phone({ x: px, y: py, w: R * 1.04, rot: o.tilt, bg: o.bg, screen: o.screen }) +
    '<ellipse cx="' + (px + (o.thumb || 1) * R * .48) + '" cy="' + (py + R * .40) + '" rx="' +
      (R * .19) + '" ry="' + (R * .13) + '" fill="' + p.skin + '" transform="rotate(' + o.tilt +
      " " + px + " " + py + ')"/>' +
    "</g>";
}

/* ---------------- the room ---------------- */

const txt = (x, y, size, weight, fill, anchor, family) =>
  '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || "middle") + '" font-family="' +
  (family || BODY).replace(/'/g, "") + '" font-size="' + size + '" font-weight="' + weight +
  '" fill="' + fill + '">';

const chip = (x, y, text, bg, ink, wide) =>
  '<g transform="translate(' + x + "," + y + ')">' +
    '<rect x="' + (-wide / 2) + '" y="-16" width="' + wide + '" height="32" rx="16" fill="' +
      bg + '"/>' + txt(0, 6, 16, 800, ink) + text + "</text></g>";

/* A nested <svg> with no size fills whatever contains it, so a board that
   quietly stopped matching would cover the entire scene rather than fail. */
function fit(svg, x, y, w, h) {
  const out = svg.replace(/^<svg class="board[^"]*"/,
    '<svg x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"');
  if (out === svg) throw new Error("boardart.js no longer opens with <svg class=\"board\">");
  return out;
}

/* The screen on the wall, showing the room the people under it are in: who is
   giving, how long they have left, and the board they are racing on. It is
   laid out the way the television actually lays it out, and the board inside
   it is a real one — cropped the way the game crops it, because seventeen
   rows at this size is a pattern rather than a board. */
function wall() {
  const x = 104, y = 4, w = 340, h = 154, bar = 26, pad = 8;
  const cw = 158, ch = h - bar - pad * 2, cx = x + w - pad - cw, cy = y + bar + pad;
  const rw = w - cw - pad * 3, rx = x + pad;
  return '<g filter="url(#lift)">' +
    '<rect x="' + (x - 8) + '" y="' + (y - 8) + '" width="' + (w + 16) + '" height="' + (h + 16) +
      '" rx="18" fill="' + INK + '"/>' +
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="9" fill="' +
      CARD + '"/>' +
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + bar + '" fill="' + INK + '"/>' +
    art.coin(x + w - 24, y + 15, 9, false) +
    '<circle cx="' + (x + 18) + '" cy="' + (y + 15) + '" r="4.5" fill="' + GOOD + '"/>' +
    '<text x="' + (x + 62) + '" y="' + (y + 20) + '" text-anchor="middle" direction="ltr" ' +
      'font-family="' + LOGO.replace(/'/g, "") + '" font-size="14" font-weight="800" ' +
      'letter-spacing="2.5" fill="' + PAPER + '">ABCD</text>' +
    /* who is giving, and what is left of their ninety seconds */
    '<rect x="' + rx + '" y="' + cy + '" width="' + rw + '" height="' + ch + '" rx="12" fill="' +
      AMBER + '"/>' +
    '<g transform="translate(' + (rx + rw / 2 - 22) + "," + (cy + 8) + ') scale(1.1)">' +
      '<circle cx="20" cy="20" r="20" fill="' + art.faceOf("grandma").bg + '"/>' +
      '<g clip-path="url(#lsface)">' + art.faceOf("grandma").art + "</g></g>" +
    txt(rx + rw / 2, cy + 100, 42, 400, INK, "middle", DISPLAY) + "0:04</text>" +
    /* the board they are on */
    '<rect x="' + cx + '" y="' + cy + '" width="' + cw + '" height="' + ch + '" rx="12" fill="' +
      PAPER + '" stroke="' + RULE + '" stroke-width="1.5"/>' +
    fit(boardSvg, cx + 5, cy + 5, cw - 10, ch - 10) +
    '<rect x="' + (x + w / 2 - 6) + '" y="' + (y + h + 8) + '" width="12" height="10" fill="' +
      INK + '" opacity=".5"/></g>';
}

function lamp() {
  return '<g>' +
    '<circle cx="58" cy="146" r="150" fill="url(#lampglow)"/>' +
    '<rect x="55.5" y="128" width="5" height="255" fill="' + WOOD + '"/>' +
    '<rect x="34" y="383" width="48" height="9" rx="4.5" fill="' + INK + '"/>' +
    '<path d="M22 128 34 84h48l12 44Z" fill="' + AMBER + '"/>' +
    '<rect x="22" y="122" width="72" height="8" rx="4" fill="' + AMBER_D + '"/></g>';
}

function plant() {
  const leaf = (x, y, rx, ry, rot, fill) =>
    '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill +
    '" transform="rotate(' + rot + " " + x + " " + y + ')"/>';
  return '<g>' +
    '<rect x="726" y="248" width="7" height="96" fill="' + GOOD_D + '"/>' +
    leaf(700, 250, 30, 13, -28, GOOD_D) + leaf(760, 236, 32, 13, 24, GOOD) +
    leaf(706, 206, 27, 12, -52, GOOD) + leaf(752, 194, 26, 12, 46, GOOD_D) +
    leaf(730, 172, 13, 30, 4, GOOD) +
    '<path d="M706 330h48l-6 56a8 8 0 0 1-8 7h-20a8 8 0 0 1-8-7Z" fill="' + HOT + '"/>' +
    '<rect x="702" y="322" width="56" height="14" rx="5" fill="' + HOT_D + '"/></g>';
}

function sofa() {
  const S = SOFA;
  return '<g>' +
    '<rect x="' + S.l + '" y="' + S.top + '" width="' + (S.r - S.l) + '" height="' +
      (S.base - S.top) + '" rx="34" fill="' + BACK + '"/>' +
    '<path d="M300 ' + (S.top + 16) + 'V' + (S.base - 8) + 'M500 ' + (S.top + 16) + 'V' +
      (S.base - 8) + '" stroke="' + SEAT + '" stroke-width="3" stroke-linecap="round" opacity=".8"/>' +
    '<rect x="' + (S.l - 18) + '" y="' + S.seat + '" width="' + (S.r - S.l + 36) + '" height="' +
      (S.base - S.seat + 26) + '" rx="26" fill="' + SEAT + '"/>' +
    '<rect x="' + (S.l - 22) + '" y="' + (S.top + 52) + '" width="60" height="' +
      (S.foot - S.top - 52) + '" rx="26" fill="' + ARMR + '"/>' +
    '<rect x="' + (S.r - 38) + '" y="' + (S.top + 52) + '" width="60" height="' +
      (S.foot - S.top - 52) + '" rx="26" fill="' + ARMR + '"/>' +
    '<rect x="' + (S.l + 34) + '" y="' + (S.top + 62) + '" width="74" height="74" rx="18" fill="' +
      AMBER + '" transform="rotate(-8 ' + (S.l + 71) + " " + (S.top + 99) + ')"/>' +
    /* one pass of the lamp over the whole piece, so the arms and the seat are
       not three flats of the same brown */
    '<rect x="' + (S.l - 22) + '" y="' + S.top + '" width="' + (S.r - S.l + 44) + '" height="' +
      (S.foot - S.top + 14) + '" rx="30" fill="url(#lit)" opacity=".9"/>' +
    '<rect x="' + (S.l + 4) + '" y="' + (S.foot - 6) + '" width="14" height="20" rx="4" fill="' +
      WOOD + '"/>' +
    '<rect x="' + (S.r - 18) + '" y="' + (S.foot - 6) + '" width="14" height="20" rx="4" fill="' +
      WOOD + '"/></g>';
}

/* what one of them just said. One sentence, said once — the whole game is in
   the gap between saying it and somebody getting it, so the token is already
   falling out of the bubble before the reader has finished the line. */
function said() {
  const x = 470, y = 6, w = 306, h = 116;
  const line = (t, dy) => txt(x + w / 2, y + dy, 27, 400, INK, "middle", DISPLAY) + t + "</text>";
  return '<g filter="url(#lift)">' +
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="26" fill="' +
      PAPER + '" stroke="' + INK + '" stroke-width="2.6"/>' +
    '<path d="M596 ' + (y + h - 2) + 'l-2 26 40-24Z" fill="' + PAPER + '" stroke="' + INK +
      '" stroke-width="2.6" stroke-linejoin="round"/>' +
    '<rect x="596" y="' + (y + h - 6) + '" width="34" height="8" fill="' + PAPER + '"/>' +
    line("זה נעלם אצלנו בבית", 52) + line("בדיוק כשצריך אותו.", 88) +
    chip(x + w - 64, y + 18, "משפט אחד", AMBER, INK, 96) + "</g>";
}

/* the token, falling out of the sentence towards the one who is about to get
   it. The name of the game, drawn: נפל האסימון. */
function drop() {
  return '<g>' +
    '<g opacity=".34">' + art.coin(534, 126, 11, false) + "</g>" +
    '<g opacity=".62">' + art.coin(506, 162, 17, false) + "</g>" +
    art.coin(474, 208, 29, true) + "</g>";
}

/* the kid, out loud. A chip laid over his phone said the same thing and read
   as a label on the picture; over his head it is him saying it. */
function shout(x, y, text) {
  const w = 116, h = 40;
  return '<g filter="url(#lift2)"><path d="M' + (x - 9) + " " + (y + h / 2 - 2) + "l3 20 20-19Z\" fill=\"" + GOOD_D + '"/>' +
    '<rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h +
      '" rx="' + (h / 2) + '" fill="' + GOOD_D + '"/>' +
    txt(x, y + 7, 20, 800, "#FFFFFF") + text + "</text></g>";
}

function floorCoins() {
  return '<g>' + '<g opacity=".5">' + art.coin(122, 446, 20, false) + "</g>" +
    art.coin(58, 430, 34, true) + "</g>";
}

function scene() {
  return '<svg viewBox="0 0 ' + SCENE.w + " " + SCENE.h + '" width="' + SCENE.w + '" height="' +
      SCENE.h + '" style="display:block" aria-hidden="true">' +
    /* The room has a lamp in it, so it is lit from the left, and everything in
       it sits on something. Two gradients and a drop shadow, reused by every
       shape: a flat drawing of a room reads as a diagram of a room. */
    '<defs>' +
      '<clipPath id="lsface"><circle cx="20" cy="20" r="20"/></clipPath>' +
      '<radialGradient id="lampglow"><stop offset="0" stop-color="' + AMBER +
        '" stop-opacity=".38"/><stop offset="1" stop-color="' + AMBER + '" stop-opacity="0"/>' +
      "</radialGradient>" +
      '<linearGradient id="lit" x1="0" y1="0" x2="1" y2=".6">' +
        '<stop offset="0" stop-color="#FFFFFF" stop-opacity=".16"/>' +
        '<stop offset=".5" stop-color="#FFFFFF" stop-opacity="0"/>' +
        '<stop offset="1" stop-color="#3A2A12" stop-opacity=".15"/></linearGradient>' +
      '<linearGradient id="wallg" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#FFF6E2"/><stop offset="1" stop-color="' + WALL_LIT +
        '"/></linearGradient>' +
      '<radialGradient id="contact"><stop offset="0" stop-color="#6A5433" stop-opacity=".34"/>' +
        '<stop offset="1" stop-color="#6A5433" stop-opacity="0"/></radialGradient>' +
      '<filter id="lift" x="-25%" y="-25%" width="150%" height="160%">' +
        '<feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#4A3A1C" flood-opacity=".26"/>' +
      "</filter>" +
      '<filter id="lift2" x="-40%" y="-40%" width="180%" height="180%">' +
        '<feDropShadow dx="-2" dy="5" stdDeviation="5" flood-color="#3A2C14" flood-opacity=".3"/>' +
      "</filter>" +
    "</defs>" +
    '<rect x="0" y="0" width="' + SCENE.w + '" height="' + SCENE.h + '" fill="' + CARD + '"/>' +
    '<rect x="0" y="150" width="' + SCENE.w + '" height="242" fill="url(#wallg)"/>' +
    '<rect x="0" y="392" width="' + SCENE.w + '" height="' + (SCENE.h - 392) + '" fill="' +
      FLOOR + '"/>' +
    '<ellipse cx="410" cy="476" rx="352" ry="78" fill="' + RUG + '"/>' +
    '<path d="M120 452h580" stroke="' + RUG_LINE + '" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="400" cy="398" rx="330" ry="26" fill="url(#contact)"/>' +
    '<ellipse cx="58" cy="392" rx="52" ry="12" fill="url(#contact)"/>' +
    '<ellipse cx="730" cy="396" rx="46" ry="12" fill="url(#contact)"/>' +
    lamp() + wall() + plant() + said() + sofa() + drop() +

    figure({ face: "curly",   x: 246, y: 241, r: 52, tilt: -16, hand: -.10, thumb: -1,
             bg: PAPER, screen: clockScreen }) +
    figure({ face: "boy",     x: 428, y: 272, r: 45, tilt: 14, hand: .12, thumb: 1,
             bg: GOOD, screen: buzzScreen }) +
    figure({ face: "grandma", x: 592, y: 232, r: 54, tilt: -6, hand: 0, thumb: -1,
             bg: AMBER, screen: wordsScreen }) +

    floorCoins() +
    shout(386, 196, "קלטתי!") +
    "</svg>";
}

/* ---------------- the sheet ---------------- */

function steps() {
  const one = (i, head, body) =>
    '<div style="display: flex; flex-direction: column; gap: 4px">' +
      '<span style="display: flex; align-items: center; gap: 9px">' +
        '<span style="width: 26px; height: 26px; border-radius: 50%; background: ' + INK +
          '; color: ' + CARD + '; font-family: ' + LOGO + '; font-weight: 800; font-size: 15px; ' +
          'display: flex; align-items: center; justify-content: center; flex: 0 0 auto">' +
          n(i) + "</span>" +
        '<span style="font-size: 19px; font-weight: 800; line-height: 1.2">' + head + "</span>" +
      "</span>" +
      '<span style="font-size: 16px; line-height: 1.4; color: ' + SECOND +
        '; text-wrap: pretty">' + body + "</span>" +
    "</div>";
  return '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); ' +
    'gap: 24px; padding: 14px 54px 16px">' +
    one(1, "הנותן בוחר מילה", "ארבע מילים על המסך שלו, שוות " + n("1") + " עד " + n("4") + " נקודות.") +
    one(2, "משפט אחד. פעם אחת.", "בלי לומר את המילה, בלי לחזור על המשפט.") +
    one(3, "מי שקולט — לוחץ", "צדקתם? צברתם. טעיתם? יורדת נקודה.") +
    "</div>";
}

function poster() {
  return '<div style="width: ' + A4.w + "px; height: " + A4.h + "px; background: " + CARD +
      "; color: " + INK + "; direction: rtl; font-family: " + BODY + "; position: relative; " +
      'overflow: hidden; display: flex; flex-direction: column; box-sizing: border-box">' +

    '<div style="display: flex; align-items: flex-start; justify-content: space-between; ' +
      'gap: 24px; padding: 38px 54px 0">' +
      '<div style="display: flex; flex-direction: column; gap: 2px">' +
        wordmark(38) +
        '<span style="font-size: 16px; font-weight: 700; color: ' + MUTED + '">' +
          "משחק לכל המשפחה · טלפון לכל אחד, או לכל קבוצה</span>" +
      "</div>" +
      '<span style="font-size: 15px; font-weight: 800; letter-spacing: .14em; color: ' + AMBER_I +
        '; border: 2px solid ' + AMBER + '; border-radius: 999px; padding: 7px 16px; ' +
        'flex: 0 0 auto; margin-top: 6px">' + n("3–30") + " שחקנים</span>" +
    "</div>" +

    '<div style="padding: 22px 54px 0">' +
      '<h1 style="margin: 0; font-family: ' + DISPLAY + '; font-size: 66px; line-height: .98; ' +
        'font-weight: 400">שיקלטו אותך.<br><span style="color: ' + AMBER_I +
        '">רק לא מהר.</span></h1>' +
      '<p style="margin: 14px 0 0; font-size: 20px; line-height: 1.45; color: ' + SECOND +
        '; max-width: 640px; text-wrap: pretty">' +
        "משפט אחד על מילה שרק אתה יודע. כל שנייה שלוקח להם — שווה לך יותר." +
      "</p>" +
    "</div>" +

    '<div style="position: relative; flex-grow: 1; min-height: ' + SCENE.h +
      'px; margin-top: 12px; overflow: hidden; background: ' + CARD + '">' +
      '<div style="position: absolute; left: 0; bottom: 0">' + scene() + "</div>" +
    "</div>" +

    steps() + foot({ ground: CARD }) + "</div>";
}

return { html: poster };
};
