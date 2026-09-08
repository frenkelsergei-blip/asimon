/* Asimon — the board, drawn.

   Two screens draw this map now: the phone, when it is your turn to move, and
   the screen in the room, all game long. They must draw the same board — the
   same lanes, the same lit squares, tokens in the same places — or the table
   is looking at two versions of where everybody stands. So it is drawn once,
   here, and both ask for it.

   One global, and nothing else: this file is loaded beside app.js, which has
   its own `esc` and `initials` at the top level, and two scripts on one page
   share one scope.                                                          */
"use strict";

window.asimonBoard = (function(){

  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const initials = n => String(n||"?").trim().slice(0,2).toUpperCase();

  /* four lane colours per map theme, read off the CSS custom properties so a
     redesign of the palette only ever has to happen in style.css */
  const THEMES = ["classic","twist","storm","sprint","chaos"];
  function lanes(themeId){
    const id = THEMES.indexOf(themeId) >= 0 ? themeId : "classic";
    return [0,1,2,3].map(i => "var(--map-"+id+"-"+i+")");
  }

  /* The board is drawn into a fixed box whatever its length: a short Sprint
     board spaces its rows out, a long Storm board packs them in. Both then
     scale to whatever they are shown in — a phone's column or a wall.

     Two boxes, because two screens are shaped differently. UP is the phone's:
     320x560, the race running up the page. ACROSS is for a television, where
     a portrait board would sit in a third of the screen with the rest of the
     wall left over: 1200x300, the four lanes laid on their side and the race
     running the long way. It is the same board — same lanes, same squares,
     same order — turned to fit the thing it is being read on. In Hebrew it
     runs right to left, because that is the direction the room reads. */
  const BOX = { up:{ w:320, h:560 }, across:{ w:1200, h:420 } };
  function nodeXY(r, c, rows, o){
    o = o || {};
    if(!o.across){
      const top = 34, bottom = 534;
      const y = bottom - (bottom - top) * (r / (rows + 1));
      const x = 44 + c * 77;
      if(r === 0 || r > rows) return { x: 44 + 1.5*77, y };
      return { x, y };
    }
    const near = 48, far = 1152;
    const along = near + (far - near) * (r / (rows + 1));
    const x = o.rtl ? (near + far - along) : along;
    const y = 66 + c * 96;
    if(r === 0 || r > rows) return { x, y: 66 + 1.5*96 };
    return { x, y };
  }

  /* The crop that holds a set of squares, in the coordinates of the box the
     board is drawn into. A whole board is seventeen rows of near-identical
     pills, and the five or six you may actually stand on are somewhere in the
     middle of it; handed only those, the same drawing becomes a strip you can
     read without hunting. It is a crop and not a magnifying glass — the four
     lanes usually span the whole width, so what it buys is the rows you do
     not have to look at, and some size back on a move that stays inside two
     or three lanes.

     It is measured in rows and lanes rather than in pixels, so its edges fall
     in the gaps between squares: a crop that ends halfway down a pill reads
     as a rendering fault, not as a board that carries on.

     And a floor, because two rows blown up to fill a phone stop looking like
     a board at all: five rows is the least it will show.                    */
  const MIN_ROWS = 5, MIN_LANES = 3;
  function windowFor(rows, points, o){
    o = o || {};
    const how = { across:!!o.across, rtl:!!o.rtl };
    const box = BOX[how.across ? "across" : "up"];
    const pts = (points || []).filter(Boolean);
    if(!pts.length) return null;
    const grow = (lo, hi, min, top) => {
      while(hi - lo + 1 < min && (lo > 0 || hi < top)){
        if(lo > 0) lo -= 1;
        if(hi - lo + 1 < min && hi < top) hi += 1;
      }
      return [lo, hi];
    };
    const rs = pts.map(p => p.r);
    const R = grow(Math.min.apply(null, rs), Math.max.apply(null, rs), MIN_ROWS, rows + 1);
    /* the start line and the finish both sit in the middle lane, so a crop
       that reaches either of them is holding every lane anyway */
    const wide = R[0] === 0 || R[1] > rows;
    const cs = pts.filter(p => p.r >= 1 && p.r <= rows).map(p => p.c);
    const C = wide || !cs.length ? [0, 3]
            : grow(Math.min.apply(null, cs), Math.max.apply(null, cs), MIN_LANES, 3);
    /* a row that has lanes, so the lane extremes are read off real squares */
    const rMid = Math.min(Math.max(R[0], 1), rows);
    const lane = c => nodeXY(rMid, c, rows, how);
    const row  = r => nodeXY(Math.min(Math.max(r, 1), rows), 1, rows, how);
    /* half a step past the outermost square, so the cut lands in a gap and
       never halfway down a pill */
    const gapR = Math.abs(row(2).y - row(1).y) || Math.abs(row(2).x - row(1).x);
    const gapC = Math.abs(lane(1).x - lane(0).x) || Math.abs(lane(1).y - lane(0).y);
    const side = (p, q, pad, full) => {
      const w = Math.min(full, Math.abs(p - q) + pad);
      return { at:Math.min(full - w, Math.max(0, (p + q)/2 - w/2)), of:w };
    };
    const rEnds = [nodeXY(R[0], 1, rows, how), nodeXY(R[1], 1, rows, how)];
    const cEnds = [lane(C[0]), lane(C[1])];
    const X = how.across ? side(rEnds[0].x, rEnds[1].x, gapR, box.w)
                         : side(cEnds[0].x, cEnds[1].x, gapC, box.w);
    const Y = how.across ? side(cEnds[0].y, cEnds[1].y, gapC, box.h)
                         : side(rEnds[0].y, rEnds[1].y, gapR, box.h);
    return { x:X.at, y:Y.at, w:X.of, h:Y.of };
  }

  /* o.board   {rows, nodes, themeId} — the layout, fixed when the game starts
     o.units   the tokens, in the order they should stack on a shared square
     o.label   (node) -> the short word inside a square, "" for a bare dot
     o.endText what the finish line says
     o.spots   the squares to light up, o.picked the one already chosen
     o.moved   (unit) -> true when it should land rather than appear
     o.pick    true when a lit square is something to tap
     o.window  a crop from windowFor, when only part of the board is wanted   */
  function draw(o){
    const b = o.board, rows = b.rows, lit = {};
    const COLC = lanes(b.themeId);
    const label = o.label || (() => "");
    const how = { across: !!o.across, rtl: !!o.rtl };
    const at = (r, c) => nodeXY(r, c, rows, how);
    const box = BOX[how.across ? "across" : "up"];
    (o.spots||[]).forEach(p => lit[p.r+","+p.c] = p);
    /* While a move is being chosen the board stops being a map and becomes a
       question: which of these may I stand on? Seventeen rows of identical
       pills do not answer it, so every square that is not one of yours steps
       back and lets the ones that are come forward. The tokens do not fade —
       where everybody is standing is the thing you are choosing against.

       The wall does the same, because it is showing the table the same
       question: any board handed lit squares is a board being chosen from. */
    const dim = (o.spots||[]).length > 0;
    const faded = n => dim ? '<g opacity="0.28">'+n+'</g>' : n;
    let out = "";
    for(let c = 0; c < 4; c++){
      const a = at(1,c), z = at(rows,c);
      out += how.across
        ? '<rect x="'+(Math.min(a.x,z.x)-15)+'" y="'+(a.y-15)+'" width="'+(Math.abs(a.x-z.x)+30)+
          '" height="30" rx="15" fill="'+COLC[c]+'" opacity="0.10"/>'
        : '<rect x="'+(a.x-15)+'" y="'+(z.y-15)+'" width="30" height="'+((a.y-z.y)+30)+
          '" rx="15" fill="'+COLC[c]+'" opacity="0.10"/>';
    }
    for(let r = 0; r <= rows; r++){
      const froms = r === 0 ? [{r:0,c:1}] : [0,1,2,3].map(c => ({r,c}));
      froms.forEach(p => {
        const nxt = p.r >= rows ? [{r:rows+1,c:1}]
                  : p.r === 0 ? [0,1,2,3].map(c => ({r:1,c}))
                  : [p.c-1,p.c,p.c+1].filter(c => c>=0 && c<4).map(c => ({r:p.r+1,c}));
        nxt.forEach(q => {
          const A = at(p.r,p.c), B = at(q.r,q.c);
          out += '<line x1="'+A.x+'" y1="'+A.y+'" x2="'+B.x+'" y2="'+B.y+'" stroke="'+
                 COLC[Math.min(q.c,3)]+'" stroke-width="1.6" opacity="0.28"/>';
        });
      });
    }
    b.nodes.forEach(n => {
      const xy = at(n.r, n.c), key = n.r+","+n.c, isLit = !!lit[key];
      const col = n.t === "CARD" ? "var(--good)" : n.t === "WILD" ? "var(--violet)" : COLC[n.c];
      const short = label(n) || "";
      let node;
      if(n.t === "WILD"){
        /* rare enough to be worth its own mark: a dashed ring with a question in it */
        node = (isLit ? '<circle cx="'+xy.x+'" cy="'+xy.y+'" r="14.5" fill="'+col+'" opacity="0.18"/>' : '')+
          '<circle cx="'+xy.x+'" cy="'+xy.y+'" r="10" fill="'+(isLit?col:"var(--surface)")+'" stroke="'+col+
          '" stroke-width="'+(isLit?1.9:1.5)+'" stroke-dasharray="3 2.4"/>'+
          '<text x="'+xy.x+'" y="'+(xy.y+3.6)+'" text-anchor="middle" font-family="Suez One,Georgia,serif" '+
          'font-size="13" fill="'+(isLit?"#FFFFFF":col)+'">?</text>';
      } else if(short){
        const ink = n.c === 2 && n.t !== "CARD" ? "#2A1B00" : "#FFFFFF";
        node = (isLit ? '<circle cx="'+xy.x+'" cy="'+xy.y+'" r="13.5" fill="'+col+'" opacity="0.18"/>' : '')+
          '<rect x="'+(xy.x-22)+'" y="'+(xy.y-9)+'" width="44" height="18" rx="9" fill="'+
          (isLit?col:"var(--surface)")+'" stroke="'+col+'" stroke-width="'+(isLit?1.8:1.3)+'"/>'+
          '<text x="'+xy.x+'" y="'+(xy.y+3.4)+'" text-anchor="middle" font-family="Assistant,sans-serif" '+
          'font-size="10" font-weight="800" fill="'+(isLit?ink:col)+'">'+esc(short)+'</text>';
      } else {
        node = (isLit ? '<circle cx="'+xy.x+'" cy="'+xy.y+'" r="12.5" fill="'+col+'" opacity="0.18"/>' : '')+
          '<circle cx="'+xy.x+'" cy="'+xy.y+'" r="'+(isLit?8:4.5)+'" fill="'+(isLit?col:"var(--rule)")+'"'+
          (isLit?' stroke="var(--surface)" stroke-width="2"':'')+'/>';
      }
      out += (isLit && o.pick)
        ? '<g data-go="'+key+'" style="cursor:pointer">'+node+
          '<rect x="'+(xy.x-28)+'" y="'+(xy.y-13)+'" width="56" height="26" fill="transparent"/></g>'
        : faded(node);
    });
    const s0 = at(0,1);
    out += '<circle cx="'+s0.x+'" cy="'+s0.y+'" r="7" fill="var(--sunk)" stroke="var(--rule)" stroke-width="1.5"/>';
    const e0 = at(rows+1,1), endLit = !!lit[(rows+1)+",1"];
    const endNode = (endLit ? '<circle cx="'+e0.x+'" cy="'+e0.y+'" r="21" fill="var(--good)" opacity="0.2"/>' : '')+
      '<circle cx="'+e0.x+'" cy="'+e0.y+'" r="14" fill="'+(endLit?"var(--good)":"var(--ink)")+'"/>'+
      '<text x="'+e0.x+'" y="'+(e0.y+3.4)+'" text-anchor="middle" font-family="Assistant,sans-serif" '+
      'font-size="10.5" font-weight="800" fill="#FFFFFF">'+esc(o.endText || "END")+'</text>';
    out += (endLit && o.pick) ? '<g data-go="'+(rows+1)+',1" style="cursor:pointer">'+endNode+
      '<rect x="'+(e0.x-26)+'" y="'+(e0.y-26)+'" width="52" height="52" fill="transparent"/></g>'
      : faded(endNode);

    const byKey = {};
    (o.units||[]).forEach(u => { const k = u.pos.r+","+u.pos.c; (byKey[k] = byKey[k] || []).push(u); });
    Object.keys(byKey).forEach(k => {
      const [r,c] = k.split(",").map(Number), list = byKey[k], p0 = at(r,c);
      list.forEach((u,j) => {
        const x = p0.x + (j - (list.length-1)/2) * 19;
        const landed = o.moved ? o.moved(u) : false;
        out += '<g class="'+(landed?"tok":"")+'">'+ (u.face
          ? faceToken(u.face, x, p0.y, 11.5)
          : '<circle cx="'+x+'" cy="'+p0.y+'" r="11.5" fill="'+(u.color||"#2C6BFF")+'" stroke="var(--surface)" stroke-width="2.5"/>'+
            '<text x="'+x+'" y="'+(p0.y+3.4)+'" text-anchor="middle" font-family="Assistant,sans-serif" '+
            'font-size="9" font-weight="800" fill="#FFFFFF">'+esc(initials(u.name))+'</text>') + '</g>';
      });
    });
    if(o.picked){
      const xy = nodeXY(o.picked.r, o.picked.c, rows);
      out += o.picked.r > rows
        ? '<circle cx="'+xy.x+'" cy="'+xy.y+'" r="20" fill="none" stroke="var(--ink)" stroke-width="2.2"/>'
        : '<rect x="'+(xy.x-22)+'" y="'+(xy.y-13.5)+'" width="44" height="27" rx="13.5" fill="none" stroke="var(--ink)" stroke-width="2.2"/>';
    }
    const win = o.window;
    const vb = win ? [win.x, win.y, win.w, win.h].map(n => Math.round(n*10)/10).join(" ")
                   : "0 0 "+box.w+" "+box.h;
    return '<svg class="board'+(win ? " cropped" : "")+'" viewBox="'+vb+'" role="img">'+out+'</svg>';
  }

  return { draw, lanes, nodeXY, windowFor, BOX };
})();
