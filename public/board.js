/* Asimon — the screen in the room.

   A television, a tablet leaned against the fruit bowl. It watches a room by
   its code, holds no seat, and can send nothing back: there is no button here
   that changes the game. What it shows is what the table already knows out
   loud — the board, the score, whose turn it is, how long is left.

   It never shows the four words. Not before the reveal, not on a blind round,
   not ever: the one person who must not see them is sitting in front of it.
   The server settles that in boardView(); this page simply has nowhere to
   print them.

   It has two shapes. The whole screen — the board beside the moment and the
   table — and the map on its own over the wall, which is a tap on the board
   away and remembered. The design for both is on the canvas at design/screen/. */
"use strict";

const L = {
  he:{ sc_title:"אסימון — המסך",
    sc_ask:"איזה חדר?",
    sc_ask_d:"הקלידו את קוד החדר שמופיע על הטלפונים. המסך רק מראה — הוא לא תופס מקום בשולחן.",
    sc_watch:"להראות", sc_other:"חדר אחר",
    sc_gone:"אין חדר עם הקוד הזה.", sc_toomany:"יותר מדי מסכים על החדר הזה.",
    sc_net:"אין חיבור לשרת.", sc_off:"מנותק — מתחברים מחדש…",
    sc_room_k:"חדר", sc_round_k:"סבב", sc_board_k:"הלוח", sc_speed_k:"קצב",
    sc_join_k:"להצטרף מהטלפון",
    sc_lobby:"מחכים שהמשחק יתחיל", sc_lobby_d:"המארח/ת מתחיל/ה כשכולם בפנים.",
    sc_players_k:"מי בפנים", sc_need:"צריך לפחות {0} טלפונים",
    sc_order_k:"לפני שמתחילים", sc_order:"זה הסדר", sc_order_d:"עוד {0} לאשר",
    sc_order_go:"מתחילים…",
    sc_pick:"{0} בוחר/ת מילה", sc_pick_d:"אל תסתכלו בטלפון.",
    sc_blind:"בוחרים מילה ל{0}", sc_blind_d:"{0} — תסתובבו. כל השאר בוחרים.",
    sc_say:"{0} נותן/ת רמז", sc_say_d:"משפט אחד. מי שקולט — צועק.",
    sc_say_mime:"{0} מציג/ה בלי מילים", sc_say_mime_d:"מי שקולט — צועק.",
    sc_say_blind:"מילה אחת כל אחד, בסבב", sc_say_blind_d:"{0} מנחש/ת מתי שרוצה.",
    sc_shout:"{0} צעק/ה", sc_shout_d:"{0} בודק/ת אם זו המילה.", sc_shout_db:"השולחן מחליט.",
    sc_move:"{0} זז/ה על הלוח",
    sc_steps:"{0} צעדים", sc_step1:"צעד אחד", sc_seat_of:"{0} מתוך {1}",
    sc_award:"{0} לוקח/ת קלף", sc_swap:"{0} מחליף/ה מילה", sc_wild_k:"משבצת הפתעה",
    sc_paused:"הפסקה", sc_paused_d:"{0} ביקש/ה רגע",
    /* the wildcard square, told about the table rather than to it */
    sc_w_card:"קלף חינם", sc_w_card_d:"{0} — ישר ליד.",
    sc_w_leap:"קפיצה קדימה", sc_w_leap_d:"שתי משבצות קדימה, בחינם.",
    sc_w_slip:"מעידה", sc_w_slip_d:"משבצת אחת אחורה.",
    sc_w_steal:"גניבת נקודה", sc_w_steal_d:"נקודה אחת עוברת מ{0}.", sc_w_steal_none:"אין ממי לגנוב עדיין.",
    sc_w_swap:"החלפת מקומות", sc_w_swap_d:"מחליפים משבצת עם {0}.", sc_w_swap_none:"לא נמצא מישהו להחליף איתו.",
    sc_w_jack:"ג׳קפוט", sc_w_jack_d:"שתי נקודות, כאן ועכשיו.",
    sc_host:"מארח/ת",
    sc_maponly:"רק המפה", sc_mapback:"להראות גם את המצב",
    sc_tip:"להטות את הלוח", sc_lay:"לשטח את הלוח",
    sc_over_k:"נגמר", sc_wins:"{0} מנצח/ת", sc_wins_p:"{0} מנצחים", sc_won_tag:"ניצח",
    sc_pts:"נק׳", sc_cards_k:"קלפים", sc_card_k:"קלף", sc_row_k:"שורה", sc_waiting:"מחכים ל{0}",
    /* the five boards and the four speeds, named as the phone names them */
    sc_map_classic:"קלאסי", sc_map_twist:"תפנית", sc_map_storm:"סופה",
    sc_map_sprint:"ספרינט", sc_map_chaos:"תוהו ובוהו",
    sc_gm_quick:"מהיר", sc_gm_regular:"רגיל", sc_gm_slow:"רגוע", sc_gm_challenge:"אתגר",
    sc_seat_solo:"כל אחד לעצמו", sc_seat_pairs:"בזוגות", sc_seat_groups:"בקבוצות"
  },
  en:{ sc_title:"Asimon — the screen",
    sc_ask:"Which room?",
    sc_ask_d:"Type the code showing on the phones. This screen only watches — it takes no seat at the table.",
    sc_watch:"Show it", sc_other:"Another room",
    sc_gone:"No room with that code.", sc_toomany:"Too many screens on that room.",
    sc_net:"No connection to the server.", sc_off:"Off the air — reconnecting…",
    sc_room_k:"Room", sc_round_k:"Round", sc_board_k:"Board", sc_speed_k:"Speed",
    sc_join_k:"Join from a phone",
    sc_lobby:"Waiting for the game to start", sc_lobby_d:"The host starts it once everyone is in.",
    sc_players_k:"Who is in", sc_need:"Needs at least {0} phones",
    sc_order_k:"Before we start", sc_order:"This is the order", sc_order_d:"{0} still to tap in",
    sc_order_go:"Starting…",
    sc_pick:"{0} is choosing a word", sc_pick_d:"Nobody look at that phone.",
    sc_blind:"Choosing a word for {0}", sc_blind_d:"{0} — look away. Everyone else picks.",
    sc_say:"{0} is giving the clue", sc_say_d:"One sentence. Shout when you have it.",
    sc_say_mime:"{0} is acting it out", sc_say_mime_d:"Shout when you have it.",
    sc_say_blind:"One word each, going round", sc_say_blind_d:"{0} can shout a guess at any time.",
    sc_shout:"{0} shouted", sc_shout_d:"{0} is deciding.", sc_shout_db:"The table decides.",
    sc_move:"{0} is moving",
    sc_steps:"{0} steps", sc_step1:"one step", sc_seat_of:"{0} of {1}",
    sc_award:"{0} is taking a card", sc_swap:"{0} is switching the word", sc_wild_k:"Wildcard",
    sc_paused:"On a break", sc_paused_d:"{0} asked for a moment",
    /* the wildcard square, told about the table rather than to it */
    sc_w_card:"A free card", sc_w_card_d:"{0} — straight into the hand.",
    sc_w_leap:"Leap ahead", sc_w_leap_d:"Two squares forward, for nothing.",
    sc_w_slip:"Slipped back", sc_w_slip_d:"One square backwards.",
    sc_w_steal:"Stole a point", sc_w_steal_d:"One point off {0}.", sc_w_steal_none:"Nobody had a point to take yet.",
    sc_w_swap:"Swapped places", sc_w_swap_d:"Traded squares with {0}.", sc_w_swap_none:"There was nobody to swap with.",
    sc_w_jack:"Jackpot", sc_w_jack_d:"Two points, right now.",
    sc_host:"Host",
    sc_maponly:"The map on its own", sc_mapback:"Show the state as well",
    sc_tip:"Tip the board", sc_lay:"Lay it flat",
    sc_over_k:"That is the game", sc_wins:"{0} wins", sc_wins_p:"{0} win", sc_won_tag:"won",
    sc_pts:"pts", sc_cards_k:"cards", sc_card_k:"card", sc_row_k:"row", sc_waiting:"Waiting on {0}",
    /* the five boards and the four speeds, named as the phone names them */
    sc_map_classic:"Classic", sc_map_twist:"Twist", sc_map_storm:"Storm",
    sc_map_sprint:"Sprint", sc_map_chaos:"Chaos",
    sc_gm_quick:"Quick", sc_gm_regular:"Regular", sc_gm_slow:"Slow", sc_gm_challenge:"Challenge",
    sc_seat_solo:"Every player for themselves", sc_seat_pairs:"In pairs", sc_seat_groups:"In groups"
  }
};

const screenEl = document.getElementById("screen");
const K_ROOM = "asimon.screen";

let lang = "he", pack = null, state = null, es = null;
let code = "", problem = "", live = false;
let clockAt = 0, clockMs = 0, ticker = null, pauseAt = 0, pauseMs = 0;
/* the map on its own, over the whole screen. Remembered, because a screen set
   up that way once is meant to be left alone. */
const K_MAP = "asimon.screen.map";
let mapOnly = false;
/* and, once it is on its own, whether the board is tipped back into the room
   or lying flat. Remembered the same way and for the same reason. */
const K_TIP = "asimon.screen.tip";
let tipped = false;
/* remembers where each token was, so only a token that moved animates */
const lastPos = {};

function t(k, a, b){
  let v = (pack && pack.ui && pack.ui[k] !== undefined) ? pack.ui[k]
        : (L[lang] && L[lang][k] !== undefined ? L[lang][k] : k);
  if(a !== undefined) v = String(v).split("{0}").join(a);
  if(b !== undefined) v = String(v).split("{1}").join(b);
  return v;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt = ms => { const s = Math.max(0, Math.ceil(ms/1000)); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); };
const initials = n => String(n||"?").trim().slice(0,2).toUpperCase();
const h = html => { screenEl.innerHTML = html; };
function applyLang(){
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  document.title = t("sc_title");
}
const remain = () => Math.max(0, clockMs - (Date.now() - clockAt));
const pauseLeft = () => Math.max(0, pauseMs - (Date.now() - pauseAt));

/* ---------------- the stream ----------------
   One GET, no identity. A room that has gone closes the stream for good, and
   the browser will not tell us why — so we ask the room itself. */
function connect(){
  if(es) es.close();
  es = new EventSource("/api/board?room=" + encodeURIComponent(code));
  es.onopen = () => { live = true; problem = ""; render(); };
  es.onerror = () => {
    live = false;
    if(es && es.readyState === 2) checkRoom(); else render();
  };
  es.onmessage = ev => {
    let msg; try{ msg = JSON.parse(ev.data); }catch(e){ return; }
    if(msg.type === "ui"){ pack = msg.pack; lang = msg.lang; applyLang(); render(); return; }
    if(msg.type !== "state") return;
    state = msg.state;
    if(state.lang !== lang){ lang = state.lang; applyLang(); }
    if(typeof state.remainMs === "number"){ clockMs = state.remainMs; clockAt = Date.now(); }
    if(state.paused){ pauseMs = state.paused.ms; pauseAt = Date.now(); }
    live = true; problem = "";
    render();
    notePositions(state);      /* after the draw: the next one compares against these */
  };
}
async function checkRoom(){
  try{
    const r = await fetch("/api/room?code=" + encodeURIComponent(code));
    if(r.status === 404){ forget(t("sc_gone")); return; }
    const room = await r.json().catch(() => ({}));
    /* the room is there and will not have us: say so rather than retrying at
       it forever behind a spinner */
    if(room.screensFull){ forget(t("sc_toomany")); return; }
    setTimeout(connect, 2000);              /* the room is fine; the stream was not */
  }catch(e){
    problem = t("sc_net"); render();
    setTimeout(checkRoom, 3000);
  }
}
function forget(why){
  if(es){ es.close(); es = null; }
  code = ""; state = null; live = false; problem = why || "";
  try{ localStorage.removeItem(K_ROOM); }catch(e){}
  render();
}
function notePositions(st){
  (st.units || []).forEach(u => { lastPos[u.id] = u.pos.r + "," + u.pos.c; });
}

/* A screen is meant to be looked at, not tapped. Ask the tablet not to sleep,
   and ask again every time it comes back — a lock does not survive a lock. */
let wake = null;
async function keepAwake(){
  try{
    if(!navigator.wakeLock || document.hidden || wake) return;
    wake = await navigator.wakeLock.request("screen");
    wake.addEventListener("release", () => { wake = null; });
  }catch(e){ wake = null; }
}
document.addEventListener("visibilitychange", () => {
  if(document.hidden) return;
  keepAwake();
  if(code && (!es || es.readyState === 2)) connect();
});

/* ---------------- asking which room ---------------- */
function vAsk(){
  h('<div class="ask">'+
    '<span class="mark">'+coinMark(64)+'</span>'+
    '<h1>'+t("sc_ask")+'</h1>'+
    '<p>'+t("sc_ask_d")+'</p>'+
    (problem ? '<p class="err">'+esc(problem)+'</p>' : '')+
    '<form id="ask"><input class="code" id="cd" maxlength="4" autocomplete="off" '+
      'autocapitalize="characters" spellcheck="false" placeholder="ABCD" value="">'+
    '<button type="submit">'+t("sc_watch")+'</button></form></div>');
  const cd = document.getElementById("cd");
  if(cd) cd.focus();
  document.getElementById("ask").addEventListener("submit", e => {
    e.preventDefault();
    const v = String(cd.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    if(v.length !== 4) return;
    watch(v);
  });
}
async function watch(v){
  problem = "";
  try{
    const r = await fetch("/api/room?code=" + encodeURIComponent(v));
    if(r.status === 404){ problem = t("sc_gone"); render(); return; }
  }catch(e){ problem = t("sc_net"); render(); return; }
  code = v;
  try{ localStorage.setItem(K_ROOM, code); }catch(e){}
  keepAwake();
  connect();
  render();
}

/* ---------------- the head ---------------- */
const fact = (label, value, cls) =>
  '<div class="sfact"><span>'+label+'</span><b class="'+(cls||"")+'">'+value+'</b></div>';
const mapName  = id => t("sc_map_" + (id || "classic"));
const modeName = id => t("sc_gm_" + (id || "regular"));

function shead(s){
  const bits = [];
  if(s.round) bits.push(fact(t("sc_round_k"), String(s.round), "num"));
  /* which board and which speed are worth a wall's room and not a phone's,
     so they travel together and the stylesheet drops them when it is tight */
  bits.push('<span class="sextra">'+fact(t("sc_board_k"), esc(mapName(s.mapId)))+
            fact(t("sc_speed_k"), esc(modeName(s.gameMode)))+'</span>');
  return '<div class="shead">'+
    '<span class="mark"><span class="coin">'+coinMark(30)+'</span>'+
    '<span>'+(lang === "he" ? "אסימון" : "ASIMON")+'</span></span>'+
    '<span class="spacer"></span>'+ bits.join("")+
    fact(t("sc_room_k"), esc(s.code), "code")+
    '<span class="slive'+(live?"":" off")+'" title="'+(live?"":esc(t("sc_off")))+'"></span>'+
    '</div>';
}

/* ---------------- the board ---------------- */
/* Turned on its side when it has a wall to fill: the same board, the long way
   round, because a portrait map on a television leaves two thirds of the
   screen over. In Hebrew the race then runs right to left. */
const wideScreen = () => window.matchMedia("(min-aspect-ratio: 5/4)").matches;
function drawBoard(s, opts){
  return asimonBoard.draw(Object.assign({
    board: s.board, units: s.units,
    spots: (s.phase === "move" && s.move) ? s.move.spots : [],
    picked: (s.phase === "move" && s.move) ? s.move.picked : null,
    label: n => n.t === "CARD" ? t("card_node") : n.t === "WILD" ? "" : ((pack.mods[n.t]||{}).s || ""),
    endText: lang === "he" ? "סוף" : "END",
    moved: u => !!(lastPos[u.id] && (lastPos[u.id] !== u.pos.r+","+u.pos.c))
  }, opts || {}));
}

/* ---------------- before the game ---------------- */
function vLobby(s){
  const people = s.people && s.people.length ? s.people
               : (s.players || []).map(p => ({ id:p.id, name:p.name, face:p.face, phone:p.id }));
  const online = id => { const ph = (s.players || []).find(p => p.id === id); return !ph || ph.online; };
  const rows = people.map(p =>
    '<div class="srow"><span class="sface">'+faceMark(p.face, p.name)+'</span>'+
    '<span class="sname"><span class="nm">'+esc(p.name)+'</span>'+
    (((s.players||[]).find(x => x.id === p.phone) || {}).host ? '<em class="tag">'+t("sc_host")+'</em>' : '')+
    '</span><span class="dot'+(online(p.phone)?"":" off")+'"></span></div>').join("");
  const need = Math.max(0, (s.minPlayers || 3) - (s.players || []).length);
  h(shead(s)+
    '<div class="lobbypane">'+
      '<div class="joinbox">'+
        '<p class="kicker">'+t("sc_room_k")+'</p>'+
        '<div class="bigcode">'+esc(s.code)+'</div>'+
        '<p class="kicker">'+t("sc_join_k")+'</p>'+
        '<div class="where">'+esc(s.lanUrl || location.origin)+'</div>'+
      '</div>'+
      '<div class="side">'+
        receipt({ tone:"ink", kick:t("sc_players_k"), head:t("sc_lobby"),
                  sub: need ? t("sc_need", (s.minPlayers || 3)) : t("sc_lobby_d") })+
        '<div class="chips">'+
          '<span class="chip">'+esc(mapName(s.mapId))+'</span>'+
          '<span class="chip">'+esc(modeName(s.gameMode))+'</span>'+
          '<span class="chip">'+t("sc_seat_" + (s.seating || "solo"))+'</span>'+
        '</div>'+
        '<div class="standings">'+rows+'</div>'+
      '</div>'+
    '</div>'+ corner());
}

/* ---------------- the game ---------------- */
function faceMark(face, name, color){
  return face ? faceSvg(face, 40)
    : '<span class="init" style="background:'+(color || "#2C6BFF")+'">'+esc(initials(name))+'</span>';
}
const personOf = (s, id) => (s.people || []).find(p => p.id === id) || {};

/* The moment, as the phone's own receipt: a coloured block with the perforated
   edge under it. Amber while a word is in play, green once it has been said
   out loud, ink for everything procedural. */
const TONES = {
  amber: "--rc:var(--blind);--ri:#221700;--rs:rgba(34,23,0,.62);--rb:rgba(34,23,0,.72)",
  green: "--rc:var(--good);--ri:#FFFFFF;--rs:rgba(255,255,255,.7);--rb:rgba(255,255,255,.82)",
  ink:   "--rc:var(--ink);--ri:#FFFFFF;--rs:rgba(255,255,255,.6);--rb:rgba(255,255,255,.74)"
};
function receipt(m){
  return '<div class="receipt"><div class="rbox" style="'+(TONES[m.tone] || TONES.ink)+'">'+
    (m.face ? '<span class="mface">'+faceSvg(m.face, 60)+'</span>' : '')+
    '<div class="mtext">'+
      (m.kick ? '<p class="kicker">'+m.kick+'</p>' : '')+
      '<h2'+(m.word ? ' class="word"' : '')+'>'+m.head+'</h2>'+
      (m.sub ? '<p class="msub">'+m.sub+'</p>' : '')+
    '</div>'+
    (m.clock ? '<div class="clock num" id="clk">'+fmt(m.clock())+'</div>' : '')+
    (m.stamp ? '<div class="stamp">'+m.stamp+'</div>' : '')+
    '</div><div class="perf"></div></div>';
}

/* what the room is doing this second */
function moment(s){
  const g = s.giverName ? esc(s.giverName) : "";
  const gFace = s.giver ? personOf(s, s.giver).face : null;
  const blind = s.mod && s.mod.key === "B";
  const M = o => o;

  if(s.paused) return M({ tone:"ink", kick:t("sc_paused"),
                          head:t("sc_paused_d", esc(s.paused.name || "")), clock:pauseLeft });
  if(s.phase === "order"){
    const left = (s.order || {}).left || 0;
    return M({ tone:"ink", kick:t("sc_order_k"), head:t("sc_order"),
               sub: left ? t("sc_order_d", left) : t("sc_order_go") });
  }
  if(s.phase === "giver" || s.phase === "blind"){
    const kick = t("table_k", s.round);
    return blind || s.phase === "blind"
      ? M({ tone:"amber", kick, face:gFace, head:t("sc_blind", g), sub:t("sc_blind_d", g) })
      : M({ tone:"amber", kick, face:gFace, head:t("sc_pick", g), sub:t("sc_pick_d") });
  }
  if(s.phase === "table"){
    const kick = t("table_k", s.round), clock = remain;
    if(blind) return M({ tone:"amber", kick, face:gFace, clock,
                         head:t("sc_say_blind"), sub:t("sc_say_blind_d", g) });
    return s.mimeCard
      ? M({ tone:"amber", kick, face:gFace, clock, head:t("sc_say_mime", g), sub:t("sc_say_mime_d") })
      : M({ tone:"amber", kick, face:gFace, clock, head:t("sc_say", g), sub:t("sc_say_d") });
  }
  if(s.phase === "judge"){
    const who = s.judging ? esc(s.judging.name) : "";
    return M({ tone:"amber", kick:t("table_k", s.round),
               face: s.judging ? personOf(s, s.judging.id).face : gFace,
               head:t("sc_shout", who), sub: blind ? t("sc_shout_db") : t("sc_shout_d", g) });
  }
  if(s.phase === "swap")
    return M({ tone:"amber", kick:t("table_k", s.round), face:gFace,
               head:t("sc_swap", esc(s.swap ? s.swap.giverName : g)) });
  if(s.phase === "reveal"){
    const r = s.result;
    /* the one screen where the word belongs on the wall: it has just been
       said out loud, so it is nobody's secret any more */
    return M({ tone: r.solvedBy ? "green" : "ink", kick:t("solved_k", s.round), word:true,
               head: esc(r.word), face: r.solvedBy ? personOf(s, r.solvedBy).face : null,
               sub: r.solvedBy ? t("got_it", esc(r.solvedName)) : t("nobody"),
               stamp: r.solvedBy ? fmt(r.solveMs) : null });
  }
  if(s.phase === "move" && s.move){
    const st = s.move.steps;
    return M({ tone:"ink", kick:t("sc_seat_of", s.move.seat, s.move.of),
               face:unitFace(s, s.move.unitId), head:t("sc_move", esc(s.move.unitName)),
               sub: st === 1 ? t("sc_step1") : t("sc_steps", st) });
  }
  if(s.phase === "award" && s.award)
    return M({ tone:"ink", kick:t("card_node"), face:unitFace(s, s.award.unitId),
               head:t("sc_award", esc(s.award.unitName)) });
  if(s.phase === "wild" && s.wild)
    return M({ tone:"ink", kick:t("sc_wild_k"), face:unitFace(s, s.wild.unitId),
               head:wildHead(s.wild), sub:wildSub(s.wild) });
  if(s.phase === "over"){
    const won = (s.units || []).find(u => u.id === s.winner) || (s.standings || [])[0] || {};
    return M({ tone:"green", kick:t("sc_over_k"), face:unitFace(s, won.id),
               /* a pair or a group is several people, and takes the plural */
               head: (won.members && won.members.length > 1)
                 ? t("sc_wins_p", esc(won.name || ""))
                 : t("sc_wins",   esc(won.name || "")) });
  }
  return M({ tone:"ink", head:t("sc_lobby") });
}
const unitFace = (s, uid) => ((s.units || []).find(u => u.id === uid) || {}).face;
function wildHead(w){
  return t({ card:"sc_w_card", leap:"sc_w_leap", slip:"sc_w_slip",
             steal:"sc_w_steal", swap:"sc_w_swap" }[w.kind] || "sc_w_jack");
}
function wildSub(w){
  if(w.kind === "card")  return t("sc_w_card_d", esc(w.cardName || ""));
  if(w.kind === "steal") return w.from ? t("sc_w_steal_d", esc(w.from)) : t("sc_w_steal_none");
  if(w.kind === "swap")  return w.with ? t("sc_w_swap_d", esc(w.with)) : t("sc_w_swap_none");
  return t({ leap:"sc_w_leap_d", slip:"sc_w_slip_d" }[w.kind] || "sc_w_jack_d");
}

/* the round's own facts: the twist, the topic, what has been played on it */
function chips(s){
  const out = [];
  if(s.mod) out.push('<span class="chip tone">'+esc(s.mod.name)+'</span>');
  if(s.topic) out.push('<span class="chip">'+esc(s.topic)+'</span>');
  if(s.partner) out.push('<span class="chip">'+esc(t("partner_k"))+' · '+esc(s.partner.name)+'</span>');
  if(s.veto) out.push('<span class="chip">'+esc(t("veto_k"))+'</span>');
  if(s.swapped) out.push('<span class="chip">'+esc(t("swap_k"))+'</span>');
  if(s.blocked) out.push('<span class="chip">'+t("sc_waiting", esc(s.blocked.name))+'</span>');
  /* the Insight card puts the four candidates up on purpose — this is the card */
  if(s.insight) out.push('<span class="chip">'+esc(t("insight_k"))+": "+s.insight.map(esc).join(" · ")+'</span>');
  return out.length ? '<div class="chips">'+out.join("")+'</div>' : '';
}

/* Where everybody stands. One row, one player: how far up the board they are,
   and the score. No column of numbers repeating what the bar already says. */
function standings(s){
  const rows = s.rows || 1, steps = s.steps || {}, pts = {};
  if(s.phase === "reveal" && s.result) s.result.rows.forEach(r => { pts[r.id] = r.pts; });
  const list = (s.units || []).slice()
    /* Whoever won leads, then by how far up the board, then by score. Two
       units can cross in the same round, and the one with more points is not
       always the one that got there — sorted on score alone the screen put
       the winner second and the headline disagreed with the list. */
    .sort((a,b) => (b.id === s.winner) - (a.id === s.winner)
                || b.pos.r - a.pos.r || b.score - a.score)
    .map(u => {
      const col = u.color || "#2C6BFF";
      const isGiver = s.giver && u.members && u.members.indexOf(s.giver) >= 0;
      const isOut = (s.lockedOut || []).length && u.members &&
                    u.members.every(m => (s.lockedOut || []).indexOf(m) >= 0);
      const pend = steps[u.id] || 0, got = pts[u.id];
      const pct = r => Math.min(100, r/(rows+1)*100);
      return '<div class="srow'+(isOut?" out":"")+'">'+
        '<span class="sface">'+faceMark(u.face, u.name, col)+'</span>'+
        '<span><span class="sname"><span class="nm">'+esc(u.name)+'</span>'+
          (u.id === s.winner ? '<em class="tag won">'+t("sc_won_tag")+'</em>' : '')+
          (isGiver ? '<em class="tag giver">'+t("giver_tag")+'</em>' : '')+
          (isOut ? '<em class="tag out">'+t("locked")+'</em>' : '')+
          (u.cards ? '<em class="tag">'+u.cards+' '+
             (u.cards === 1 ? t("sc_card_k") : t("sc_cards_k"))+'</em>' : '')+
        '</span>'+
        '<span class="slane"><span class="sbar">'+
          (pend ? '<i class="ghost" style="width:'+pct(u.pos.r+pend)+'%;background:'+col+'"></i>' : '')+
          '<i style="width:'+pct(u.pos.r)+'%;background:'+col+'"></i></span>'+
          '<span class="srun">'+u.pos.r+'/'+(rows+1)+'</span></span>'+
        '</span>'+
        '<span class="snums">'+
          (got ? '<span class="sgain">'+(got > 0 ? "+"+got : String(got))+'</span>' : '')+
          '<span class="sscore">'+u.score+'</span>'+
          '<span class="spts">'+t("sc_pts")+'</span></span>'+
        '</div>';
    });
  /* the pane scales its rows to fit, and cannot count them itself */
  return '<div class="standings" style="--n:'+Math.max(1, list.length)+'">'+list.join("")+'</div>';
}

/* the whole screen: the board, the moment, the table */
function vGame(s){
  const m = moment(s);
  h(shead(s)+
    '<div class="sbody">'+
      '<div class="boardpane" id="mapzone" title="'+esc(t("sc_maponly"))+'">'+
        '<div class="boardfit">'+drawBoard(s)+'</div>'+
        '<p class="cap">'+esc(mapName(s.mapId))+' · '+t("board_k", s.rows + 1)+'</p>'+
      '</div>'+
      '<div class="side">'+ receipt(m) + chips(s) + standings(s) +'</div>'+
    '</div>'+ corner());
  tick(s, m);
}

/* the other shape: the map over the wall, and one quiet line under it */
function vMap(s){
  const m = moment(s);
  const across = wideScreen();
  h('<div class="mapfull" id="mapzone" title="'+esc(t("sc_mapback"))+'">'+
      drawBoard(s, { across, rtl: across && lang === "he", tipped: across && tipped })+'</div>'+
    '<div class="mapline">'+
      '<span class="mcode">'+esc(s.code)+'</span>'+
      '<span class="mnow">'+m.head+'</span>'+
      (m.clock ? '<span class="mclock num" id="clk">'+fmt(m.clock())+'</span>' : '')+
    '</div>'+ corner());
  tick(s, m);
}
/* The two things a screen can be asked, kept out of the way in a corner:
   which shape it is in, and which room it is watching. */
function corner(o){
  const opts = o || {};
  /* Tipping is offered only where there is a wall to tip into. The board
     tipped back is a wide, shallow thing; asked to fill a screen stood on its
     end it would draw itself a strip across the middle and leave the rest,
     which is the very thing the map on its own exists to stop. */
  const canTip = opts.map !== false && mapOnly && wideScreen();
  return '<div class="corner">'+
    (canTip ? '<button id="tipbtn">'+t(tipped ? "sc_lay" : "sc_tip")+'</button>' : '')+
    (opts.map === false ? '' :
      '<button id="mapbtn">'+t(mapOnly ? "sc_mapback" : "sc_maponly")+'</button>')+
    '<button id="swap">'+t("sc_other")+'</button></div>';
}

/* the one number on this page that moves on its own */
function tick(s, m){
  stopTick();
  if(!m || !m.clock) return;
  ticker = setInterval(() => {
    const el = document.getElementById("clk");
    if(!el){ stopTick(); return; }
    const ms = m.clock();
    el.textContent = fmt(ms);
    el.classList.toggle("low", !s.paused && ms < 10000);
  }, 250);
}
function stopTick(){ if(ticker){ clearInterval(ticker); ticker = null; } }

/* ---------------- painting ---------------- */
function setMap(on){
  mapOnly = !!on;
  try{ localStorage.setItem(K_MAP, mapOnly ? "1" : ""); }catch(e){}
  render();
}
function setTip(on){
  tipped = !!on;
  try{ localStorage.setItem(K_TIP, tipped ? "1" : ""); }catch(e){}
  render();
}
function render(){
  applyLang();
  screenEl.className = mapOnly ? "maponly" : "";
  if(!code){ stopTick(); vAsk(); return; }
  if(!state || !pack){
    stopTick();
    h('<div class="ask"><span class="coin">'+coinMark(64)+'</span>'+
      '<p>'+(problem ? esc(problem) : (live ? "…" : t("sc_off")))+'</p>'+
      corner({ map:false })+'</div>');
  } else if(state.phase === "lobby"){
    stopTick();
    document.documentElement.dataset.tone = "live";
    /* there is no board to show yet, so the map shape has nothing to be */
    screenEl.className = "";
    vLobby(state);
  } else {
    document.documentElement.dataset.tone =
      { giver:"secret", blind:"secret", reveal:"scored", over:"scored" }[state.phase] ||
      (state.paused ? "held" : "live");
    if(mapOnly) vMap(state); else vGame(state);
  }
  const sw = document.getElementById("swap");
  if(sw) sw.onclick = () => forget("");
  const flip = () => setMap(!mapOnly);
  const btn = document.getElementById("mapbtn");
  if(btn) btn.onclick = flip;
  const tip = document.getElementById("tipbtn");
  if(tip) tip.onclick = e => { e.stopPropagation(); setTip(!tipped); };
  const zone = document.getElementById("mapzone");
  if(zone) zone.onclick = flip;
}
/* turning a tablet sideways changes which way the map is drawn */
let turnTimer = null;
window.addEventListener("resize", () => {
  if(!mapOnly || !state) return;
  /* turning it back up takes the tip button away with the shape it belongs to */
  clearTimeout(turnTimer);
  turnTimer = setTimeout(render, 150);
});

/* ---------------- the build ----------------
   Nobody is holding this screen, so it does not ask anyone to reload: when the
   server is serving a different build it reloads itself, at a moment that is
   not in the middle of somebody's sentence. */
const metaTag = n => { const m = document.querySelector('meta[name="'+n+'"]'); return m ? m.content : ""; };
const BUILD = metaTag("asimon-build");
async function checkUpdate(){
  if(!BUILD || document.hidden) return;
  if(state && (state.phase === "table" || state.phase === "judge")) return;
  try{
    const r = await fetch("/api/version", { cache:"no-store" });
    const v = await r.json();
    if(v && v.build && v.build !== BUILD) location.reload();
  }catch(e){}
}
setInterval(checkUpdate, 15 * 60 * 1000);

/* ---------------- boot ----------------
   ?room=ABCD for a screen that is set up once and never touched again; the
   last room it watched for one that is picked up and put down. */
const q = new URLSearchParams(location.search);
const asked = (q.get("room") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
/* ?map opens straight into the map on its own, for a screen that is set up
   once and never touched again; otherwise it comes back as it was left */
if(q.has("map")) mapOnly = q.get("map") !== "0";
else try{ mapOnly = localStorage.getItem(K_MAP) === "1"; }catch(e){}
if(q.has("tip")) tipped = q.get("tip") !== "0";
else try{ tipped = localStorage.getItem(K_TIP) === "1"; }catch(e){}
let saved = "";
try{ saved = localStorage.getItem(K_ROOM) || ""; }catch(e){}
if(asked.length === 4){ watch(asked); }
else if(saved.length === 4){ code = saved; keepAwake(); connect(); render(); }
else render();
