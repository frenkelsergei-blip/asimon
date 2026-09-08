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
     wall left over: 1200x420, the four lanes laid on their side and the race
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

  /* Which squares a square leads to, and which squares are there at all. A
     lattice answers both by arithmetic — four lanes the whole way up, three
     ways on from each square — and sends nothing, because the phone can work
     it out. A road map sends its own answer with the layout: there the ways
     between squares *are* the board, and a phone drawing the lattice behind
     one would be drawing a rule that board is not playing. */
  function waysOf(b){
    const rows = b.rows, out = {}, row = {};
    b.nodes.forEach(n => (row[n.r] = row[n.r] || []).push(n.c));
    if(b.ways) b.ways.forEach(w => (out[w[0]+","+w[1]] = out[w[0]+","+w[1]] || []).push(w[2]));
    return {
      from: r => (r === 0 ? [1] : (row[r] || [])).map(c => ({ r, c })),
      to: p => {
        if(p.r >= rows) return [{ r:rows+1, c:1 }];
        if(p.r === 0) return (row[1] || [0,1,2,3]).map(c => ({ r:1, c }));
        if(b.ways) return (out[p.r+","+p.c] || []).map(c => ({ r:p.r+1, c }));
        return [p.c-1,p.c,p.c+1].filter(c => c>=0 && c<4).map(c => ({ r:p.r+1, c }));
      }
    };
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

  /* ---------------- the board, tipped back ----------------

     A third way to draw the same seventeen rows, and the only one that is not
     a diagram: the table tipped away from the room, the four lanes running
     back into it, and every token standing up off its square as a pin. Same
     lanes, same squares, same order — what it adds is that you can see the
     board is a thing on a table, which is what a room glances at rather than
     reads.

     What recedes is the lanes, never the race. Tipping it end-on would put
     the finish line at a third the size of the start, and where everybody is
     relative to the finish is the entire question this board answers. So the
     race keeps its full length across the wall and the depth is spent on the
     four lanes, which only ever needed telling apart.

     It gets its own box rather than sharing ACROSS: tipped, the board is a
     shallower thing, and a box with the flat one's headroom would draw it
     small in the middle of a wall for no reason.                            */
  const ISO = { w:1200, h:300, near:88, far:1112, y0:78, depth:166, back:0.75, slab:13 };
  ISO.mid = (ISO.near + ISO.far) / 2;
  /* u runs 0..1 along the race, t runs 0..1 from the far lane to the near one,
     and `back` — how wide the far lane is against the near one — is the only
     dial: a real camera has no second one.

     It is worth having got this right rather than eyeballed. A tipped plane
     seen by an eye is a projective map, and the whole of what that buys is
     that anything straight on the board is straight on the wall: the lanes,
     the table's own four edges, a line between two squares. Faked instead —
     lanes spread apart by one curve and narrowed by another — the numbers can
     be made to look almost the same and the edges of the table quietly bow,
     which reads as a rendering fault rather than as depth.

     So it is one divide. A lane at t sits `z` deep; everything at that depth
     is drawn `back/z` of full size, and how far down the wall it falls is
     that same size again — which is why the gaps between the lanes open up on
     the way forward without anybody choosing by how much.                    */
  function plane(u, t, rtl){
    const z = 1 - (1 - ISO.back) * t;
    const s = ISO.back / z;
    const a = ISO.near + (ISO.far - ISO.near) * (rtl ? 1 - u : u);
    return { x: ISO.mid + (a - ISO.mid) * s, y: ISO.y0 + ISO.depth * t * s, s };
  }
  /* the start line and the finish sit between the middle two lanes, exactly
     where the flat board puts them */
  const midRow = (r, rows) => r === 0 || r > rows;
  function isoAt(r, c, rows, rtl){
    return plane(r / (rows + 1), midRow(r, rows) ? 0.5 : c / 3, rtl);
  }

  function drawTilted(o){
    const b = o.board, rows = b.rows, rtl = !!o.rtl, COLC = lanes(b.themeId);
    const label = o.label || (() => "");
    const at = (r, c) => isoAt(r, c, rows, rtl);
    const n1 = v => Math.round(v * 10) / 10;
    const lit = {};
    (o.spots||[]).forEach(p => lit[p.r+","+p.c] = p);
    const dim = (o.spots||[]).length > 0;
    const faded = s => dim ? '<g opacity="0.28">'+s+'</g>' : s;
    let out = "";

    /* The table the board is printed on. It is a trapezoid because it is
       tipped, and it carries a band of its own edge along the bottom — that
       edge is the whole of what says this is an object and not a drawing.

       Four corners and no more: the plane is a projective map, so its sides
       come out straight on their own. */
    const rim = [[-0.05,-0.22],[1.05,-0.22],[1.05,1.08],[-0.05,1.08]]
      .map(p => plane(p[0], p[1], rtl));
    const quad = pts => 'M'+pts.map(p => n1(p.x)+' '+n1(p.y)).join('L')+'Z';
    out += '<path d="'+quad(rim.map(p => ({ x:p.x, y:p.y + ISO.slab })))+'" fill="var(--rule)"/>'+
           '<path d="'+quad(rim)+'" fill="var(--sunk)" stroke="var(--rule)" stroke-width="1.5"/>';

    /* the four lanes, painted flat on the table — a road map has no lanes to
       paint, only roads, and those are the lines below */
    const way = waysOf(b);
    if(!b.ways) for(let c = 0; c < 4; c++){
      const a = at(1,c), z = at(rows,c), th = 9 * a.s, pad = 15 * a.s;
      const x0 = Math.min(a.x, z.x) - pad, x1 = Math.max(a.x, z.x) + pad;
      out += '<rect x="'+n1(x0)+'" y="'+n1(a.y - th)+'" width="'+n1(x1-x0)+'" height="'+n1(th*2)+
             '" rx="'+n1(th)+'" fill="'+COLC[c]+'" opacity="0.14"/>';
    }
    /* and the ways on and off each square, painted flat as well, so a pin
       always stands above them. On a road map they are drawn heavier: there
       they are the board rather than a reminder of a rule. */
    for(let r = 0; r <= rows; r++) way.from(r).forEach(p => way.to(p).forEach(q => {
      const A = at(p.r,p.c), B = at(q.r,q.c);
      out += '<line x1="'+n1(A.x)+'" y1="'+n1(A.y)+'" x2="'+n1(B.x)+'" y2="'+n1(B.y)+
             '" stroke="'+COLC[Math.min(q.c,3)]+'" stroke-width="'+n1((b.ways?4.5:1.5)*A.s)+
             '" stroke-linecap="round" opacity="'+(b.ways?0.34:0.24)+'"/>';
    }));

    /* From here on the order is the drawing. A pin sticks up, so it can only
       ever cover ground that is further away than the square it stands on —
       lay the far lane down first and everything lands right without anyone
       working out what overlaps what. Squares of a lane, then the pins on
       them, then the next lane. */
    const items = [];
    const depth = (r, c) => midRow(r, rows) ? 1.5 : c;
    const put = (d, s) => items.push({ d, s });

    /* Every square is a tile with a thickness: its own outline drawn twice,
       the lower one in the square's colour under a veil, and the sliver left
       showing between them is what it stands on. */
    const stand = (sil, col, rise) =>
      '<g transform="translate(0,'+n1(rise)+')">'+sil(col)+
        '<g opacity="0.34">'+sil("var(--ink)")+'</g></g>';

    b.nodes.forEach(nd => {
      const p = at(nd.r, nd.c), s = p.s, isLit = !!lit[nd.r+","+nd.c];
      const col = nd.t === "CARD" ? "var(--good)" : nd.t === "WILD" ? "var(--violet)" : COLC[nd.c];
      const short = label(nd) || "";
      const halo = isLit ? '<ellipse cx="'+n1(p.x)+'" cy="'+n1(p.y)+'" rx="'+n1(23*s)+
        '" ry="'+n1(13*s)+'" fill="'+col+'" opacity="0.2"/>' : '';
      let node;
      if(nd.t === "WILD"){
        const sil = f => '<ellipse cx="'+n1(p.x)+'" cy="'+n1(p.y)+'" rx="'+n1(11*s)+'" ry="'+n1(7.4*s)+'" fill="'+f+'"/>';
        node = halo + stand(sil, col, 7*s)+
          '<ellipse cx="'+n1(p.x)+'" cy="'+n1(p.y)+'" rx="'+n1(11*s)+'" ry="'+n1(7.4*s)+'" fill="'+
          (isLit?col:"var(--surface)")+'" stroke="'+col+'" stroke-width="'+n1((isLit?1.9:1.5)*s)+
          '" stroke-dasharray="'+n1(3*s)+' '+n1(2.4*s)+'"/>'+
          '<text x="'+n1(p.x)+'" y="'+n1(p.y + 4*s)+'" text-anchor="middle" font-family="Suez One,Georgia,serif" '+
          'font-size="'+n1(12.5*s)+'" fill="'+(isLit?"#FFFFFF":col)+'">?</text>';
      } else if(short){
        const ink = nd.c === 2 && nd.t !== "CARD" ? "#2A1B00" : "#FFFFFF";
        const sil = f => '<rect x="'+n1(p.x-22*s)+'" y="'+n1(p.y-6.5*s)+'" width="'+n1(44*s)+
          '" height="'+n1(13*s)+'" rx="'+n1(6.5*s)+'" fill="'+f+'"/>';
        node = halo + stand(sil, col, 8*s)+
          '<rect x="'+n1(p.x-22*s)+'" y="'+n1(p.y-6.5*s)+'" width="'+n1(44*s)+'" height="'+n1(13*s)+
          '" rx="'+n1(6.5*s)+'" fill="'+(isLit?col:"var(--surface)")+'" stroke="'+col+
          '" stroke-width="'+n1((isLit?1.8:1.3)*s)+'"/>'+
          '<text x="'+n1(p.x)+'" y="'+n1(p.y + 3.4*s)+'" text-anchor="middle" font-family="Assistant,sans-serif" '+
          'font-size="'+n1(9.6*s)+'" font-weight="800" fill="'+(isLit?ink:col)+'">'+esc(short)+'</text>';
      } else {
        const rx = (isLit ? 9 : 6.4) * s, ry = (isLit ? 6 : 4.2) * s;
        const sil = f => '<ellipse cx="'+n1(p.x)+'" cy="'+n1(p.y)+'" rx="'+n1(rx)+'" ry="'+n1(ry)+'" fill="'+f+'"/>';
        node = halo + stand(sil, isLit ? col : COLC[nd.c], 5.5*s)+
          '<ellipse cx="'+n1(p.x)+'" cy="'+n1(p.y)+'" rx="'+n1(rx)+'" ry="'+n1(ry)+'" fill="'+
          (isLit?col:"var(--rule)")+(isLit?'" stroke="var(--surface)" stroke-width="'+n1(2*s):'')+'"/>';
      }
      put(depth(nd.r, nd.c), (isLit && o.pick)
        ? '<g data-go="'+nd.r+','+nd.c+'" style="cursor:pointer">'+node+
          '<rect x="'+n1(p.x-28*s)+'" y="'+n1(p.y-16*s)+'" width="'+n1(56*s)+'" height="'+n1(32*s)+
          '" fill="transparent"/></g>'
        : faded(node));
    });

    /* the start line: a peg, not a square, because nobody chooses to be on it */
    const s0 = at(0,1);
    put(1.5, stand(f => '<ellipse cx="'+n1(s0.x)+'" cy="'+n1(s0.y)+'" rx="'+n1(8*s0.s)+
        '" ry="'+n1(5.2*s0.s)+'" fill="'+f+'"/>', "var(--faint)", 5.5*s0.s)+
      '<ellipse cx="'+n1(s0.x)+'" cy="'+n1(s0.y)+'" rx="'+n1(8*s0.s)+'" ry="'+n1(5.2*s0.s)+
      '" fill="var(--sunk)" stroke="var(--rule)" stroke-width="'+n1(1.5*s0.s)+'"/>');

    const e0 = at(rows+1,1), es = e0.s, endLit = !!lit[(rows+1)+",1"];
    const endSil = f => '<ellipse cx="'+n1(e0.x)+'" cy="'+n1(e0.y)+'" rx="'+n1(17*es)+
      '" ry="'+n1(11*es)+'" fill="'+f+'"/>';
    const endNode = (endLit ? '<ellipse cx="'+n1(e0.x)+'" cy="'+n1(e0.y)+'" rx="'+n1(25*es)+
        '" ry="'+n1(16*es)+'" fill="var(--good)" opacity="0.2"/>' : '')+
      stand(endSil, endLit ? "var(--good)" : "var(--ink)", 11*es)+
      endSil(endLit ? "var(--good)" : "var(--ink)")+
      '<text x="'+n1(e0.x)+'" y="'+n1(e0.y + 3.6*es)+'" text-anchor="middle" font-family="Assistant,sans-serif" '+
      'font-size="'+n1(10.5*es)+'" font-weight="800" fill="#FFFFFF">'+esc(o.endText || "END")+'</text>';
    put(1.5, (endLit && o.pick)
      ? '<g data-go="'+(rows+1)+',1" style="cursor:pointer">'+endNode+
        '<rect x="'+n1(e0.x-28*es)+'" y="'+n1(e0.y-30*es)+'" width="'+n1(56*es)+'" height="'+n1(56*es)+
        '" fill="transparent"/></g>'
      : faded(endNode));

    /* the pins, half a lane in front of the squares they stand on, so they
       clear the ground behind them and nothing in front of them */
    const byKey = {};
    (o.units||[]).forEach(u => { const k = u.pos.r+","+u.pos.c; (byKey[k] = byKey[k] || []).push(u); });
    Object.keys(byKey).forEach(k => {
      const rc = k.split(",").map(Number), list = byKey[k], p0 = at(rc[0], rc[1]);
      /* a crowded square draws its pins a size down and further apart rather
         than hiding them behind each other */
      const many = list.length > 2;
      const R = 15 * p0.s * (many ? 0.78 : 1);
      list.forEach((u,j) => {
        const x = p0.x + (j - (list.length-1)/2) * (many ? 22 : 26) * p0.s;
        const sh = pinShape(x, p0.y, R);
        const pin = u.face ? facePin(u.face, x, p0.y, R)
          : pinBase(sh.d, x, p0.y, R)+'<path d="'+sh.d+'" fill="'+(u.color||"#2C6BFF")+'"/>'+
            '<text x="'+n1(x)+'" y="'+n1(sh.cy + R*0.34)+'" text-anchor="middle" '+
            'font-family="Assistant,sans-serif" font-size="'+n1(R*0.9)+'" font-weight="800" '+
            'fill="#FFFFFF">'+esc(initials(u.name))+'</text>';
        put(depth(rc[0], rc[1]) + 0.45,
          '<g class="'+((o.moved && o.moved(u)) ? "tok" : "")+'">'+pin+'</g>');
      });
    });

    items.sort((a,z) => a.d - z.d).forEach(it => { out += it.s; });

    if(o.picked){
      const p = at(o.picked.r, o.picked.c), s = p.s;
      out += o.picked.r > rows
        ? '<ellipse cx="'+n1(p.x)+'" cy="'+n1(p.y)+'" rx="'+n1(23*s)+'" ry="'+n1(15*s)+
          '" fill="none" stroke="var(--ink)" stroke-width="'+n1(2.2*s)+'"/>'
        : '<rect x="'+n1(p.x-25*s)+'" y="'+n1(p.y-9.5*s)+'" width="'+n1(50*s)+'" height="'+n1(19*s)+
          '" rx="'+n1(9.5*s)+'" fill="none" stroke="var(--ink)" stroke-width="'+n1(2.2*s)+'"/>';
    }
    return '<svg class="board tipped" viewBox="0 0 '+ISO.w+' '+ISO.h+'" role="img">'+out+'</svg>';
  }

  /* o.board   {rows, nodes, themeId} — the layout, fixed when the game starts
     o.units   the tokens, in the order they should stack on a shared square
     o.label   (node) -> the short word inside a square, "" for a bare dot
     o.endText what the finish line says
     o.spots   the squares to light up, o.picked the one already chosen
     o.moved   (unit) -> true when it should land rather than appear
     o.pick    true when a lit square is something to tap
     o.window  a crop from windowFor, when only part of the board is wanted
     o.tipped  the wall's third shape: the same board, tipped back            */
  function draw(o){
    if(o.tipped) return drawTilted(o);
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
    const way = waysOf(b);
    if(!b.ways) for(let c = 0; c < 4; c++){
      const a = at(1,c), z = at(rows,c);
      out += how.across
        ? '<rect x="'+(Math.min(a.x,z.x)-15)+'" y="'+(a.y-15)+'" width="'+(Math.abs(a.x-z.x)+30)+
          '" height="30" rx="15" fill="'+COLC[c]+'" opacity="0.10"/>'
        : '<rect x="'+(a.x-15)+'" y="'+(z.y-15)+'" width="30" height="'+((a.y-z.y)+30)+
          '" rx="15" fill="'+COLC[c]+'" opacity="0.10"/>';
    }
    for(let r = 0; r <= rows; r++) way.from(r).forEach(p => way.to(p).forEach(q => {
      const A = at(p.r,p.c), B = at(q.r,q.c);
      out += '<line x1="'+A.x+'" y1="'+A.y+'" x2="'+B.x+'" y2="'+B.y+'" stroke="'+
             COLC[Math.min(q.c,3)]+'" stroke-width="'+(b.ways?5:1.6)+
             '" stroke-linecap="round" opacity="'+(b.ways?0.32:0.28)+'"/>';
    }));
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

  return { draw, lanes, nodeXY, windowFor, BOX, ISO };
})();
