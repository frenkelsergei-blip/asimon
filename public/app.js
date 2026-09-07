/* Last Second — the phone.
   The server decides everything; this file only draws what this phone was
   sent and posts back what its owner taps.                                  */
"use strict";
const app = document.getElementById("app");
const AV = ["#2C6BFF","#12B886","#FF5A3D","#D97706","#7A5AF8","#0891B2","#DB2777","#4D7C0F"];
const VAL_TINT = { 1:["var(--accent-soft)","var(--accent)"], 2:["var(--accent-soft)","var(--accent)"],
                   3:["var(--good-soft)","var(--good-ink)"], 4:["#F1EDFE","var(--violet)"],
                   5:["var(--blind-soft)","var(--blind-ink)"] };

/* copy that only exists once you are playing across phones */
const L = {
  he:{ title:"שנייה אחרונה", tag:"משפט אחד · הזדמנות אחת",
    yourname:"איך קוראים לכם?", nameph:"השם שלכם", create:"לפתוח חדר חדש",
    joinbtn:"להצטרף עם קוד", join_k:"קוד החדר", codeph:"ABCD", go:"להצטרף", back:"חזרה",
    lang_k:"שפה", room_k:"קוד החדר", players_k:"מי בפנים", host:"מארח/ת", you:"אתם",
    face_k:"בחרו פרצוף", face_d:"זה מה שכולם יראו לידכם כל המשחק.",
    face_change:"להחליף פרצוף", face_done:"זהו", e_face_taken:"מישהו כבר לקח את הפרצוף הזה.",
    waiting:"מחכים לעוד שחקנים — צריך לפחות 3.", startgame:"מתחילים", leave:"לצאת מהחדר",
    share:"שאר הטלפונים נכנסים לכתובת הזאת, על אותו ה־Wi‑Fi:", hostwait:"המארח/ת מתחיל/ה את המשחק.",
    offline:"מנותק — מנסים להתחבר מחדש…",
    picking:"{0} בוחר/ת מילה", picking_d:"רגע אחד. אל תסתכלו לו/ה בטלפון.",
    lookaway:"{0} — תסתובבו", lookaway_d:"כל השאר בוחרים לכם מילה בטלפון שלהם.",
    yourword:"המילה שלכם", buzznow:"יש לי!", buzzsub:"לוחצים ואומרים בקול",
    youout:"אתם בחוץ בסבב הזה", giverwait:"אתם נותנים את הרמז — אין באזר.",
    someone:"{0} לחץ/ה", judging:"{0} בודק/ת את התשובה…", waitjudge:"מחכים לנותן/ת הרמז.",
    aim_at:"כוונו לאדם אחד", pass_note:"הטלפון נשאר אצלכם — אף אחד אחר לא רואה את המילים.",
    mode_k:"איך משחקים?", mode_solo:"כל אחד לעצמו", mode_teams:"בזוגות",
    winner:"{0} מנצח/ת", wins_p:"{0} מנצחים", playagain:"עוד משחק",
    waitmove:"{0} זז/ה על הלוח.", waitmove_p:"{0} זזים על הלוח.",
    hand_k:"הקלפים שלכם", playcard:"להפעיל קלף", closehand:"סגירה",
    nocards:"אין לכם קלפים.", cardsq:"משבצת קלף", takeone:"{0} — קחו קלף",
    waitcard:"{0} בוחר/ת קלף.", waitcard_p:"{0} בוחרים קלף.",
    swap_wait:"{0} מחליף/ה מילה…", swap_pick:"בחרו מילה אחרת",
    played:"הופעל קלף", played_by:"{0} הפעיל/ה", e_no_such_card:"אין לכם את הקלף הזה.",
    stuck:"{0} מנותק/ת והמשחק מחכה.", slow:"עדיין מחכים ל{0}.",
    skip:"לדלג ולהמשיך", e_not_stuck:"אין על מה לדלג.",
    yourturn:"בטלפון של {0}", waiting_k:"מחכים",
    reconnecting:"חוזרים לחדר…",
    e_no_such_room:"אין חדר עם הקוד הזה.", e_name_required:"צריך שם.", e_name_taken:"השם כבר תפוס.",
    e_room_full:"החדר מלא.", e_already_started:"המשחק כבר התחיל.", e_need_3:"צריך לפחות 3 שחקנים.",
    e_gone:"החדר נסגר.", e_net:"אין חיבור לשרת.", e_not_your_turn:"זה לא התור שלכם.",
    e_you_are_out:"אתם בחוץ בסבב הזה.", e_time_up:"הזמן נגמר.", e_pick_first:"קודם בחרו מילה.",
    e_aim_first:"קודם כוונו לאדם.", e_out_of_range:"רחוק מדי.", e_bad_choice:"בחירה לא תקינה.",
    e_not_now:"לא עכשיו.", e_bad_step:"לא בשלב הזה.", e_no_choice:"אין מה לבחור.",
    e_busy:"השרת עמוס כרגע, נסו שוב עוד רגע.", e_slow_down:"יותר מדי חדרים. חכו קצת.",
    e_host_only:"רק המארח/ת.", e_your_turn:"זה התור שלכם — אי אפשר לדלג על עצמכם.",
    e_not_started:"המשחק לא התחיל." },
  en:{ title:"Last Second", tag:"one sentence · one shot",
    yourname:"What is your name?", nameph:"Your name", create:"Open a new room",
    joinbtn:"Join with a code", join_k:"Room code", codeph:"ABCD", go:"Join", back:"Back",
    lang_k:"Language", room_k:"Room code", players_k:"Who is in", host:"host", you:"you",
    face_k:"Pick your face", face_d:"This is what everyone sees next to you all game.",
    face_change:"Change face", face_done:"Done", e_face_taken:"Somebody already took that face.",
    waiting:"Waiting for more players — you need at least 3.", startgame:"Start the game", leave:"Leave the room",
    share:"The other phones open this address, on the same Wi‑Fi:", hostwait:"The host starts the game.",
    offline:"Disconnected — reconnecting…",
    picking:"{0} is choosing a word", picking_d:"Give them a moment. No peeking at their phone.",
    lookaway:"{0} — look away", lookaway_d:"Everyone else is choosing your word on their own phone.",
    yourword:"Your word", buzznow:"I have it!", buzzsub:"tap, then say it out loud",
    youout:"You are out for this round", giverwait:"You are giving the clue — no buzzer for you.",
    someone:"{0} buzzed", judging:"{0} is checking the answer…", waitjudge:"Waiting for the giver.",
    aim_at:"Aim at one person", pass_note:"The phone stays with you — nobody else can see these.",
    mode_k:"How are you playing?", mode_solo:"Every player for themselves", mode_teams:"In pairs",
    winner:"{0} wins", wins_p:"{0} win", playagain:"Play again",
    waitmove:"{0} is moving on the board.", waitmove_p:"{0} are moving on the board.",
    hand_k:"Your cards", playcard:"Play a card", closehand:"Close",
    nocards:"You have no cards.", cardsq:"Card square", takeone:"{0} — take a card",
    waitcard:"{0} is choosing a card.", waitcard_p:"{0} are choosing a card.",
    swap_wait:"{0} is switching words…", swap_pick:"Pick a different word",
    played:"card played", played_by:"played by {0}", e_no_such_card:"You do not hold that card.",
    stuck:"{0} is offline and the game is waiting.", slow:"Still waiting for {0}.",
    skip:"Skip and carry on", e_not_stuck:"Nothing to skip.",
    yourturn:"on {0}'s phone", waiting_k:"waiting",
    reconnecting:"Getting back into the room…",
    e_no_such_room:"No room with that code.", e_name_required:"A name is needed.", e_name_taken:"That name is taken.",
    e_room_full:"The room is full.", e_already_started:"That game has started.", e_need_3:"You need at least 3 players.",
    e_gone:"The room has closed.", e_net:"Cannot reach the server.", e_not_your_turn:"Not your turn.",
    e_you_are_out:"You are out for this round.", e_time_up:"Time is up.", e_pick_first:"Pick a word first.",
    e_aim_first:"Aim at someone first.", e_out_of_range:"Too far.", e_bad_choice:"Not a valid choice.",
    e_not_now:"Not now.", e_bad_step:"Not at this step.", e_no_choice:"Nothing to choose.",
    e_busy:"The server is full just now — try again in a moment.", e_slow_down:"Too many rooms. Wait a little.",
    e_host_only:"Host only.", e_your_turn:"It is your turn — you cannot skip yourself.",
    e_not_started:"The game has not started." }
};

let lang = "he", pack = null, state = null, es = null, me = null;
let screen = "name", error = "", online = false, mode = "solo";
let clockAt = 0, clockMs = 0, ticker = null;
let myFace = null, taken = [], pickingFace = false;
/* what is typed lives here, not only in the DOM — picking a face re-renders,
   and a rebuilt input would otherwise come back empty */
let draftName = "", draftCode = "";
/* ?p=1 gives this window its own saved seat, so several players can be open
   on one machine — used by /watch.html and handy for testing */
const SEAT = (new URLSearchParams(location.search).get("p") || "").replace(/[^a-z0-9]/gi, "").slice(0, 4);
const K_ROOM = "lastsecond.room" + (SEAT ? "." + SEAT : "");
const K_FACE = "lastsecond.face" + (SEAT ? "." + SEAT : "");
let waitAt = 0, waitTimer = null, idleMs = 45000;
const waitedMs = () => Date.now() - waitAt;
let movePickLocal = null, showHand = false;

function t(k, a, b){
  let v = (pack && pack.ui && pack.ui[k] !== undefined) ? pack.ui[k]
        : (L[lang] && L[lang][k] !== undefined ? L[lang][k] : k);
  if(a !== undefined) v = String(v).split("{0}").join(a);
  if(b !== undefined) v = String(v).split("{1}").join(b);
  return v;
}
function applyLang(){
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  document.title = t("title");
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* a seat is one person in solo and two in pairs, and Hebrew needs the verb
   to agree — so pick the form from the seat, not from the sentence */
function tUnit(key, unit, name){
  const many = !!(unit && unit.members && unit.members.length > 1);
  return t(many ? key + "_p" : key, esc(name));
}
/* "you have one step" / "you have 4 steps", for one player or a pair */
function moveHead(unit, name, steps){
  const many = !!(unit && unit.members && unit.members.length > 1);
  return t((steps === 1 ? "move_h1" : "move_h") + (many ? "_p" : ""), esc(name), steps);
}
const initials = n => String(n||"?").trim().slice(0,2).toUpperCase();
const fmt = ms => { const s = Math.max(0, Math.ceil(ms/1000)); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); };

function colorOf(id){
  const list = (state && state.players) || [];
  const i = Math.max(0, list.findIndex(p => p.id === id));
  return AV[i % AV.length];
}
function unitColor(u){ return u.color || AV[0]; }
/* a drawn face where one has been chosen, initials as the fallback */
function av(name, color, cls, face){
  if(face) return '<span class="av'+(cls?" "+cls:"")+' pic">'+faceSvg(face, cls === "sm" ? 26 : 34)+'</span>';
  return '<span class="av'+(cls?" "+cls:"")+'" style="background:'+color+'">'+esc(initials(name))+'</span>';
}
function pav(pid, cls){
  const p = (state.players || []).find(x => x.id === pid) || { name:"?" };
  return av(p.name, colorOf(pid), cls, p.face);
}
const uav = (u, cls) => av(u.name, unitColor(u), cls, u.face);
const nameOf = pid => ((state.players||[]).find(x => x.id === pid) || {name:"?"}).name;

/* ---------------- transport ---------------- */
async function post(path, body){
  let r;
  try{ r = await fetch(path, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body) }); }
  catch(e){ throw { error:"net" }; }
  const data = await r.json().catch(() => ({}));
  if(!r.ok) throw (data && data.error ? data : { error:"net" });
  return data;
}
const errText = e => t("e_" + String((e && e.error) || "net"));

async function act(a){
  error = "";
  try{ await post("/api/action", Object.assign({}, a, { code:me.code, pid:me.pid })); }
  catch(e){
    if(e && e.error === "gone"){ forget(); error = t("e_gone"); }
    else error = errText(e);
    render();
  }
}
function connect(){
  if(!me) return;
  if(es) es.close();
  es = new EventSource("/api/events?room="+encodeURIComponent(me.code)+"&pid="+encodeURIComponent(me.pid));
  es.onopen  = () => { online = true; seatChecks = 0; render(); };
  es.onerror = () => {
    online = false; render();
    /* a 404 closes an EventSource for good; anything else it retries itself */
    if(es && es.readyState === 2) checkSeat();
  };
  es.onmessage = ev => {
    let msg; try{ msg = JSON.parse(ev.data); }catch(e){ return; }
    if(msg.type === "ui"){ pack = msg.pack; lang = msg.lang; applyLang(); render(); return; }
    if(msg.type === "event"){ showBanner(msg); return; }
    if(msg.type !== "state") return;
    const prev = state;
    state = msg.state;
    if(state.lang !== lang){ lang = state.lang; applyLang(); }
    if(!prev || prev.phase !== state.phase || prev.round !== state.round){ movePickLocal = null; showHand = false; }
    if(typeof state.remainMs === "number"){ clockMs = state.remainMs; clockAt = Date.now(); }
    waitAt = Date.now() - ((state.waiting && state.waiting.forMs) || 0);
    if(typeof state.idleMs === "number") idleMs = state.idleMs;
    const mine = (state.players || []).find(p => p.id === state.you);
    if(mine && mine.face) myFace = mine.face;
    screen = state.phase === "lobby" ? "lobby" : "game";
    online = true;
    render();
    armWaitTimer(state);
    notePositions(state);   /* after the draw: the next one compares against these */
  };
}
let seatChecks = 0;
async function checkSeat(){
  if(!me || !me.pid) return;
  if(seatChecks > 6) return;                       /* stop hammering a dead server */
  seatChecks++;
  try{
    const r = await fetch("/api/seat?room="+encodeURIComponent(me.code)+"&pid="+encodeURIComponent(me.pid));
    if(r.status === 404){ forget(); error = t("e_gone"); render(); return; }
    if(r.ok) connect();                            /* the seat is fine, reopen the stream */
  }catch(e){
    setTimeout(checkSeat, 2000);                   /* no network yet; try again shortly */
  }
}
/* phones suspend the page when they lock. Reopen the moment they come back. */
function ensureLive(){
  if(!me || !me.pid) return;
  if(!es || es.readyState === 2 || !online){ seatChecks = 0; checkSeat(); }
}
document.addEventListener("visibilitychange", () => { if(!document.hidden) ensureLive(); });
window.addEventListener("online", ensureLive);
window.addEventListener("pageshow", ensureLive);

function forget(){
  if(es){ es.close(); es = null; }
  me = null; state = null; screen = "name";
  try{ localStorage.removeItem(K_ROOM); }catch(e){}
}
const remain = () => Math.max(0, clockMs - (Date.now() - clockAt));

/* remembers where each token was, so only a token that moved animates */
const lastPos = {};
function notePositions(st){
  (st.units || []).forEach(u => { lastPos[u.id] = u.pos.r+","+u.pos.c; });
}

/* ---------------- the face picker ---------------- */
function faceGrid(sel, gone, attr){
  return '<div class="facegrid">'+FACES.map(f => {
    const off = gone.indexOf(f.id) >= 0 && f.id !== sel;
    return '<button class="facetile'+(sel === f.id ? " on" : "")+(off ? " off" : "")+'" '+
      attr+'="'+f.id+'"'+(off ? " disabled" : "")+'>'+faceSvg(f.id, 46)+
      (sel === f.id ? '<span class="tick"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" '+
        'stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">'+
        '<path d="M5 12.5 10 17.5 19 7"/></svg></span>' : '')+'</button>';
  }).join("")+'</div>';
}
function defaultFace(gone){
  const free = FACES.find(f => gone.indexOf(f.id) < 0);
  return (free || FACES[0]).id;
}

/* ---------------- the card-played banner ---------------- */
let bannerTimer = null;
function showBanner(ev){
  const old = document.querySelector(".banner");
  if(old) old.remove();
  if(bannerTimer) clearTimeout(bannerTimer);
  const el = document.createElement("div");
  el.className = "banner";
  el.innerHTML = '<div class="in">'+cardTile(ev.card.key)+
    '<span><span class="bn">'+esc(ev.card.n)+'</span>'+
    '<span class="bw" style="display:block">'+t("played_by", esc(ev.by))+'</span></span></div>';
  document.body.appendChild(el);
  flash(ev.tone);
  bannerTimer = setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 320);
  }, 2400);
}

/* ---------------- shell ---------------- */
function h(html){
  app.innerHTML = html;
  app.classList.remove("enter"); void app.offsetWidth; app.classList.add("enter");
}
const TONE = { giver:"secret", blind:"secret", reveal:"scored", over:"scored" };
function on(id, fn){ const el = document.getElementById(id); if(el) el.onclick = fn; }
function each(sel, fn){ app.querySelectorAll(sel).forEach(fn); }
const errBox = () => error ? '<div class="err">'+esc(error)+'</div>' : '';
function stuckBar(s){
  const w = s.waiting;
  if(!w) return "";
  const gone = !w.online, slow = waitedMs() > idleMs;
  if(!gone && !slow) return "";
  return '<div class="err" style="background:var(--blind-soft);color:var(--blind-ink)">'+
    t(gone ? "stuck" : "slow", esc(w.name))+'</div>'+
    (w.isYou ? '' : '<button class="ghost" id="skip">'+t("skip")+'</button>');
}
/* nothing arrives from the server while a room simply sits there, so nudge
   the screen once the wait becomes worth mentioning */
function armWaitTimer(s){
  if(waitTimer){ clearTimeout(waitTimer); waitTimer = null; }
  if(!s.waiting || !s.waiting.online) return;
  const left = idleMs - waitedMs();
  if(left <= 0) return;
  waitTimer = setTimeout(() => { waitTimer = null; render(); }, left + 250);
}
function wireSkip(){
  on("skip", async () => {
    const b = document.getElementById("skip");
    if(b) b.disabled = true;
    await act({ type:"skip" });
    const b2 = document.getElementById("skip");
    if(b2) b2.disabled = false;
  });
}
const offBox = () => online ? '' : '<div class="err">'+t("offline")+'</div>';

/* ---------------- lobby-side screens ---------------- */
function vName(){
  h('<div class="stack grow">'+
    '<div><p class="kicker">'+t("tag")+'</p><h1>'+t("title")+'</h1></div>'+
    '<p class="kicker">'+t("lang_k")+'</p>'+
    '<div class="langsw"><button id="lhe" class="'+(lang==="he"?"on":"")+'">עברית</button>'+
    '<button id="len" class="'+(lang==="en"?"on":"")+'">English</button></div>'+
    '<p class="kicker">'+t("face_k")+'</p>'+
    faceGrid(myFace, [], "data-face")+
    '<p class="kicker">'+t("yourname")+'</p>'+
    '<input id="nm" type="text" maxlength="14" placeholder="'+t("nameph")+'">'+
    errBox()+'<div class="grow"></div>'+
    '<button id="create">'+t("create")+'</button>'+
    '<button class="ghost" id="tojoin">'+t("joinbtn")+'</button></div>');
  const nm = document.getElementById("nm");
  nm.value = draftName || (me && me.name) || "";
  nm.addEventListener("input", () => { draftName = nm.value; });
  each("[data-face]", b => b.onclick = () => {
    draftName = nm.value;
    myFace = b.dataset.face;
    try{ localStorage.setItem(K_FACE, myFace); }catch(e){}
    render();
  });
  on("lhe", () => { draftName = nm.value; lang="he"; pack=null; applyLang(); render(); });
  on("len", () => { draftName = nm.value; lang="en"; pack=null; applyLang(); render(); });
  on("create", async () => {
    error = "";
    try{
      const r = await post("/api/create", { name:nm.value, lang, face:myFace });
      draftName = "";
      me = { code:r.code, pid:r.pid, name:nm.value.trim() };
      localStorage.setItem(K_ROOM, JSON.stringify(me));
      connect();
    }catch(e){ error = errText(e); render(); }
  });
  on("tojoin", () => { draftName = nm.value; me = { name:nm.value.trim() }; error=""; screen="join"; render(); });
}
function vJoin(){
  h('<div class="stack grow">'+
    '<p class="kicker">'+t("join_k")+'</p>'+
    '<input id="cd" class="code" type="text" maxlength="4" placeholder="'+t("codeph")+'" autocomplete="off">'+
    '<p class="kicker">'+t("face_k")+'</p>'+
    faceGrid(myFace, taken, "data-face")+
    '<p class="kicker">'+t("yourname")+'</p>'+
    '<input id="nm" type="text" maxlength="14" placeholder="'+t("nameph")+'">'+
    errBox()+'<div class="grow"></div>'+
    '<button id="go">'+t("go")+'</button>'+
    '<button class="quiet" id="back">'+t("back")+'</button></div>');
  const cd = document.getElementById("cd"), nm = document.getElementById("nm");
  cd.value = draftCode;
  nm.value = draftName || (me && me.name) || "";
  if(!draftCode) cd.focus();
  nm.addEventListener("input", () => { draftName = nm.value; });
  each("[data-face]", b => b.onclick = () => {
    draftName = nm.value; draftCode = cd.value;
    myFace = b.dataset.face;
    try{ localStorage.setItem(K_FACE, myFace); }catch(e){}
    render();
  });
  /* four letters in: ask which faces the room has already used */
  cd.addEventListener("input", async () => {
    draftCode = cd.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    if(draftCode.length !== 4) return;
    try{
      const r = await fetch("/api/room?code=" + draftCode);
      if(!r.ok) return;
      const info = await r.json();
      taken = info.taken || [];
      if(taken.indexOf(myFace) >= 0) myFace = defaultFace(taken);
      render();
    }catch(e){}
  });
  on("back", () => { error=""; screen="name"; render(); });
  on("go", async () => {
    error = "";
    try{
      const r = await post("/api/join", { code:cd.value, name:nm.value, face:myFace });
      draftCode = ""; draftName = "";
      me = { code:r.code, pid:r.pid, name:nm.value.trim() };
      localStorage.setItem(K_ROOM, JSON.stringify(me));
      connect();
    }catch(e){ error = errText(e); render(); }
  });
}
function vLobby(){
  const s = state, list = s.players;
  const rows = list.map(p =>
    '<div class="prow">'+av(p.name, colorOf(p.id), "", p.face)+
    '<span class="pname">'+esc(p.name)+
      (p.host ? '<span class="tag host">'+t("host")+'</span>' : '')+
      (p.id === s.you ? '<span class="tag you">'+t("you")+'</span>' : '')+'</span>'+
    '<span class="dot'+(p.online?'':' off')+'"></span></div>').join("");
  h('<div class="stack grow">'+offBox()+
    '<div><div class="hero" style="display:flex;align-items:center;justify-content:space-between;gap:14px">'+
      '<div><p class="kicker">'+t("room_k")+'</p><div class="roomcode">'+esc(s.code)+'</div></div>'+
      '<span class="av" style="background:rgba(255,255,255,.16);width:44px;height:44px;flex:0 0 44px;font-size:15px">'+
      list.length+'</span></div><div class="perf"></div></div>'+
    '<p class="note">'+t("share")+'</p><div class="link">'+esc(s.lanUrl||location.origin)+'</div>'+
    '<p class="kicker">'+t("players_k")+'</p><div class="plist">'+rows+'</div>'+
    (pickingFace
      ? '<p class="kicker">'+t("face_k")+'</p>'+faceGrid(myFace, s.taken || [], "data-reface")+
        '<button class="quiet" id="facedone">'+t("face_done")+'</button>'
      : '<button class="ghost" id="facebtn">'+t("face_change")+'</button>')+
    errBox()+'<div class="grow"></div>'+
    (s.isHost
      ? (list.length < 3 ? '<p class="note">'+t("waiting")+'</p>' : '')+
        '<p class="kicker">'+t("mode_k")+'</p>'+
        '<div class="langsw"><button id="msolo" class="'+(mode==="solo"?"on":"")+'">'+t("mode_solo")+'</button>'+
        '<button id="mteam" class="'+(mode==="teams"?"on":"")+'"'+(list.length<4?" disabled":"")+'>'+t("mode_teams")+'</button></div>'+
        '<div class="langsw"><button id="lhe" class="'+(s.lang==="he"?"on":"")+'">עברית</button>'+
        '<button id="len" class="'+(s.lang==="en"?"on":"")+'">English</button></div>'+
        '<button id="start"'+(list.length<3?" disabled":"")+'>'+t("startgame")+'</button>'
      : '<p class="note">'+t("hostwait")+'</p>')+
    '<button class="quiet" id="leave">'+t("leave")+'</button></div>');
  if(s.isHost){
    on("lhe", () => act({ type:"lang", lang:"he" }));
    on("len", () => act({ type:"lang", lang:"en" }));
    on("msolo", () => { mode="solo"; render(); });
    on("mteam", () => { mode="teams"; render(); });
    on("start", () => act({ type:"start", mode }));
  }
  on("facebtn", () => { pickingFace = true; render(); });
  on("facedone", () => { pickingFace = false; render(); });
  each("[data-reface]", b => b.onclick = () => {
    myFace = b.dataset.reface;
    try{ localStorage.setItem(K_FACE, myFace); }catch(e){}
    act({ type:"face", face:myFace });
  });
  on("leave", async () => { await act({ type:"leave" }); forget(); render(); });
}

/* ---------------- pieces ---------------- */
function modBlock(s){
  if(!s.mod || s.mod.key === "S") return "";
  return '<div class="mod"><span class="sl">'+t("table_k", s.round)+'</span>'+
         '<span class="sw">'+s.mod.name+'</span><span class="sr">'+s.mod.desc+'</span></div>';
}
function notes(s){
  let out = "";
  if(s.topic) out += '<div class="sentence"><span class="sl">'+t("topic_is")+'</span><span class="sw">'+s.topic+'</span></div>';
  if(s.partner) out += '<div class="sentence"><span class="sl">'+t("partner_k")+'</span><span class="sw">'+esc(s.partner.name)+'</span></div>';
  if(s.insight) out += '<div class="sentence"><span class="sl">'+t("insight_k")+'</span><span class="sw" style="font-size:17px">'+s.insight.map(esc).join(" · ")+'</span></div>';
  if(s.veto)     out += '<div class="mod"><span class="sl">'+t("veto_k")+'</span><span class="sr">'+t("veto_d")+'</span></div>';
  if(s.mimeCard) out += '<div class="mod"><span class="sl">'+t("mime_k")+'</span><span class="sr">'+t("mime_d")+'</span></div>';
  return out;
}
function wordCards(s, sel, disabled){
  return '<div class="cardgrid stagger">'+s.secret.words.map((w,i) => {
    const tint = VAL_TINT[Math.min(5, Math.max(1, w.value))] || VAL_TINT[5];
    return '<button class="wordcard'+(sel===i?" on":"")+'" data-w="'+i+'"'+(disabled?" disabled":"")+'>'+
      '<span class="wt">'+esc(w.text)+'</span>'+
      '<span class="wv" style="background:'+tint[0]+';color:'+tint[1]+'">'+w.value+'</span></button>';
  }).join("")+'</div>';
}
function waitCard(title, sub, who){
  return '<div class="panel center grow" style="justify-content:center">'+
    (who ? pav(who) : "")+'<h2>'+title+'</h2><p class="note">'+sub+'</p></div>';
}

/* ---------------- the giver's turn ---------------- */
function vGiver(s){
  if(!s.isGiver){
    h('<div class="stack grow">'+offBox()+topbar(s)+modBlock(s)+notes(s)+stuckBar(s)+errBox()+
      waitCard(t("picking", esc(s.giverName)), t("picking_d"), s.giver)+'</div>');
    wireSkip();
    return;
  }
  /* step 1 — how hard */
  if(s.challenge === null || s.challenge === undefined){
    h('<div class="stack grow">'+topbar(s)+'<h2>'+t("chal_k")+'</h2>'+modBlock(s)+
      '<p class="kicker">'+t("payoff_k")+'</p>'+
      '<div class="payoff">'+
        '<div class="best"><b>'+t(s.mod.key==="M"?"po_m_best":"po_best")+'</b><span>'+t("po_best_d")+'</span></div>'+
        '<div class="meh"><b>'+t(s.mod.key==="M"?"po_m_meh":"po_meh")+'</b><span>'+t(s.mod.key==="M"?"po_m_meh_d":"po_meh_d")+'</span></div>'+
        '<div class="none"><b>'+t("po_none")+'</b><span>'+t("po_none_d")+'</span></div></div>'+
      '<p class="kicker">'+t("chal_pick_k")+'</p>'+
      '<div class="cardgrid stagger">'+["topic","open","cold"].map(k => {
        const col = k==="cold" ? "var(--good-ink)" : (k==="topic" ? "var(--muted)" : "var(--accent-ink)");
        return '<button class="gcard" data-ch="'+k+'"><span class="cw" style="color:'+col+'">'+t("cw_"+k)+'</span>'+
          '<span class="cn">'+t("ch_"+k)+'</span><span class="cd">'+t("ch_"+k+"_d")+'</span></button>';
      }).join("")+'</div>'+errBox()+'</div>');
    each("[data-ch]", b => b.onclick = () => act({ type:"challenge", k:b.dataset.ch }));
    return;
  }
  /* step 2 — which topic */
  if(s.challenge === "topic" && !s.topic){
    h('<div class="stack grow">'+topbar(s)+'<h2>'+t("topic_k")+'</h2>'+
      '<div class="topicgrid stagger">'+(pack.topics||[]).map(x =>
        '<button class="topic" data-tp="'+x.k+'">'+x.n+'</button>').join("")+'</div>'+errBox()+'</div>');
    each("[data-tp]", b => b.onclick = () => act({ type:"topic", k:b.dataset.tp }));
    return;
  }
  /* step 3 — the word, and who it is aimed at */
  const sec = s.secret || { words:[], pick:null };
  const cold = s.challenge === "cold";
  const aimed = sec.shot;
  const canGo = sec.pick !== null && (aimed || s.partner);
  h('<div class="stack grow">'+topbar(s)+
    '<h2>'+(cold ? t("cold_k") : t("pick_word"))+'</h2>'+
    '<p class="note">'+(cold ? t("cold_d") : t("pick_word_d"))+'</p>'+
    modBlock(s)+notes(s)+
    wordCards(s, sec.pick, cold)+
    (s.partner ? '' :
      '<p class="kicker">'+t("shot_k")+'</p><p class="note">'+t("shot_d")+'</p>'+
      '<div class="suslist stagger">'+s.players.filter(p => p.id !== s.you).map(p =>
        '<button class="sus'+(aimed===p.id?" on":"")+'" data-aim="'+p.id+'">'+
        av(p.name, colorOf(p.id), "", p.face)+'<span class="nm">'+esc(p.name)+'</span><span class="dotpick"></span></button>').join("")+'</div>')+
    errBox()+'<div class="grow"></div>'+
    '<p class="note">'+t("pass_note")+'</p>'+
    '<button id="ready"'+(canGo?"":" disabled")+'>'+t("ready")+'</button></div>');
  each("[data-w]", b => b.onclick = () => act({ type:"pick", i:Number(b.dataset.w) }));
  each("[data-aim]", b => b.onclick = () => act({ type:"aim", target:b.dataset.aim }));
  on("ready", () => act({ type:"ready" }));
}

/* ---------------- a blind round ---------------- */
function vBlind(s){
  if(s.isGiver){
    h('<div class="stack grow">'+offBox()+topbar(s)+modBlock(s)+stuckBar(s)+errBox()+
      waitCard(t("lookaway", esc(nameOf(s.you))), t("lookaway_d"))+'</div>');
    wireSkip();
    return;
  }
  const sec = s.secret || { words:[], pick:null };
  h('<div class="stack grow">'+topbar(s)+
    '<h2>'+t("blind_pick_k", esc(s.giverName))+'</h2>'+
    '<p class="note">'+t("blind_pick_d", esc(s.giverName))+'</p>'+
    modBlock(s)+wordCards(s, sec.pick, false)+errBox()+'<div class="grow"></div>'+
    '<button id="ready"'+(sec.pick===null?" disabled":"")+'>'+t("blind_ready")+'</button></div>');
  each("[data-w]", b => b.onclick = () => act({ type:"pick", i:Number(b.dataset.w) }));
  on("ready", () => act({ type:"ready" }));
}

/* ---------------- the table ---------------- */
function vTable(s){
  const left = remain(), hot = left > 0 && left <= 15000;
  document.documentElement.dataset.tone = hot ? "burned" : "live";
  const blind = s.mod.key === "B";
  const mimed = s.mod.key === "M" || s.mimeCard;
  const head = blind ? t("blind_table_h")
             : mimed ? t("say_it_mime")
             : s.mod.key === "O" ? t("say_it_one") : t("say_it");
  const sub  = blind ? t("blind_table_d", esc(s.giverName))
             : mimed ? t("say_it_mime_d")
             : s.mod.key === "O" ? t("say_it_one_d") : t("say_it_d");

  const mine = s.secret && s.secret.pick !== null && s.secret.words[s.secret.pick];
  const yourWord = (s.isGiver && mine)
    ? '<div class="sentence"><span class="sl">'+t("yourword")+'</span><span class="sw">'+esc(mine.text)+'</span>'+
      (s.secret.shotName ? '<span class="sr">'+t("shot_k")+': '+esc(s.secret.shotName)+'</span>' : '')+'</div>'
    : "";

  const canBuzz = blind ? s.isGiver : (!s.isGiver && !s.iAmOut && left > 0);
  const buzzLabel = s.isGiver && !blind ? t("giverwait")
                  : s.iAmOut ? t("youout") : t("buzznow");

  h('<div class="stack grow">'+offBox()+topbar(s)+
    '<div class="clockblock"><div class="ring'+(hot?" warn":"")+'" id="ringwrap">'+clockRing(fmt(left))+'</div></div>'+
    '<h2>'+head+'</h2><p class="note">'+sub+'</p>'+
    modBlock(s)+notes(s)+yourWord+
    '<div class="grow"></div>'+errBox()+
    (canBuzz
      ? '<div class="buzzwrap"><button class="buzz" id="bz">'+
        '<span class="bl">'+t("buzznow")+'</span>'+
        '<span class="bs">'+t("buzzsub")+'</span></button></div>'
      : '<div class="standby">'+buzzLabel+'</div>')+
    handBlock(s)+
    ((s.isGiver || s.isHost) ? '<button class="quiet" id="none">'+(left<=0?t("time_up_end"):t("end_round"))+'</button>' : '')+
    '</div>');
  on("bz", () => act({ type:"buzz" }));
  on("none", () => act({ type:"nobody" }));
  on("hand", () => { showHand = !showHand; render(); });
  setRing(left / (s.total * 1000));
  each("[data-card]", b => b.onclick = () => { showHand = false; act({ type:"playcard", key:b.dataset.card }); });
  startTicker(s);
}
function handBlock(s){
  const hand = s.hand || [];
  if(!hand.length) return "";
  if(!showHand) return '<button class="ghost" id="hand">'+t("playcard")+' · '+hand.length+'</button>';
  return '<p class="kicker">'+t("hand_k")+'</p><div class="cardgrid stagger">'+
    hand.map(c => '<button class="gcard card" data-card="'+c.key+'">'+cardTile(c.key)+
      '<span class="ctext"><span class="cn">'+c.n+'</span><span class="cd">'+c.d+'</span></span></button>').join("")+
    '</div><button class="quiet" id="hand">'+t("closehand")+'</button>';
}
function vAward(s){
  const a = s.award;
  if(!a){ h('<div class="stack grow">'+offBox()+waitCard("…","")+'</div>'); return; }
  if(!a.mine){
    h('<div class="stack grow">'+offBox()+
      '<p class="kicker">'+t("cardsq")+'</p>'+stuckBar(s)+errBox()+
      waitCard(tUnit("waitcard", s.units.find(u=>u.id===a.unitId), a.unitName), t("cards_secret"))+'</div>');
    wireSkip();
    return;
  }
  h('<div class="stack grow">'+offBox()+
    '<p class="kicker" style="color:var(--good-ink)">'+t("card_won")+'</p>'+
    '<h2>'+t("takeone", esc(a.unitName))+'</h2>'+
    '<div class="cardgrid stagger">'+a.offers.map(c =>
      '<button class="gcard card" data-take="'+c.key+'">'+cardTile(c.key)+
      '<span class="ctext"><span class="cn">'+c.n+'</span>'+
      '<span class="cd">'+c.d+'</span></span></button>').join("")+'</div>'+
    errBox()+'<div class="grow"></div>'+
    '<p class="note">'+t("cards_secret")+'</p></div>');
  each("[data-take]", b => b.onclick = () => act({ type:"take", key:b.dataset.take }));
}
function vSwap(s){
  if(!s.swap || !s.swap.mine){
    h('<div class="stack grow">'+offBox()+topbar(s)+stuckBar(s)+errBox()+
      waitCard(t("swap_wait", esc(s.giverName)), t("cards_secret"), s.giver)+'</div>');
    wireSkip();
    return;
  }
  const sec = s.secret || { words:[], pick:null };
  h('<div class="stack grow">'+topbar(s)+
    '<p class="kicker">'+t("swap_k")+'</p><h2>'+t("swap_pick")+'</h2>'+
    '<div class="cardgrid">'+sec.words.map((w,i) => {
      const tint = VAL_TINT[Math.min(5, Math.max(1, w.value))] || VAL_TINT[5];
      return '<button class="wordcard'+(sec.pick===i?" dim":"")+'" data-sw="'+i+'"'+(sec.pick===i?" disabled":"")+'>'+
        '<span class="wt">'+esc(w.text)+'</span>'+
        '<span class="wv" style="background:'+tint[0]+';color:'+tint[1]+'">'+w.value+'</span></button>';
    }).join("")+'</div>'+errBox()+'</div>');
  each("[data-sw]", b => b.onclick = () => act({ type:"swappick", i:Number(b.dataset.sw) }));
}
function startTicker(s){
  stopTicker();
  ticker = setInterval(() => {
    const clk = document.getElementById("clk"), wrap = document.getElementById("ringwrap");
    if(!clk){ stopTicker(); return; }
    const left = remain(), hot = left > 0 && left <= 15000;
    clk.textContent = fmt(left);
    clk.classList.toggle("done", left <= 0);
    if(wrap) wrap.classList.toggle("warn", hot);
    setRing(left / (s.total * 1000));
    const bz = document.querySelector(".buzz");
    if(bz && bz.parentElement) bz.parentElement.classList.toggle("hot", hot);
    document.documentElement.dataset.tone = hot ? "burned" : "live";
    if(left <= 0){
      if(bz) bz.disabled = true;
      stopTicker();
    }
  }, 200);
}
function stopTicker(){ if(ticker){ clearInterval(ticker); ticker = null; } }

/* ---------------- judging ---------------- */
function vJudge(s){
  const who = s.judging ? s.judging.name : "?";
  if(!s.isGiver){
    h('<div class="stack grow">'+offBox()+topbar(s)+stuckBar(s)+errBox()+
      waitCard(t("someone", esc(who)), t("waitjudge"), s.judging && s.judging.id)+'</div>');
    wireSkip();
    return;
  }
  h('<div class="stack grow">'+topbar(s)+
    '<div class="panel center grow" style="justify-content:center">'+
    (s.judging ? pav(s.judging.id) : "")+
    '<h2>'+t("judge_q", esc(who))+'</h2></div>'+errBox()+
    '<button class="good" id="yes">'+t("judge_yes")+'</button>'+
    '<button class="quiet" id="no">'+t("judge_no")+'</button></div>');
  on("yes", () => act({ type:"judge", yes:true }));
  on("no",  () => act({ type:"judge", yes:false }));
}

/* ---------------- the result ---------------- */
let burstFor = null;
function vReveal(s){
  const r = s.result, solved = !!r.solvedBy;
  document.documentElement.dataset.tone = solved ? "scored" : "live";
  const frac = solved ? r.solveMs/(r.total*1000) : null;
  const bandIdx = frac === null ? -1 : (frac <= .25 ? 0 : (frac <= .70 ? 1 : 2));
  const flip = r.mod === "M" || r.mod === "B";
  const quality = flip ? ["great","ok","bad"] : ["bad","ok","great"];
  const keys = flip ? ["band_m_early","band_m_mid","band_m_late"] : ["band_early","band_mid","band_late"];
  const winnerUnit = solved ? (s.units.find(u => u.members.indexOf(r.solvedBy) >= 0) || {}).id : null;
  const rows = r.rows.slice().sort((a,b) => b.pts - a.pts);
  const moves = Object.keys(s.steps || {}).length > 0;

  h('<div class="stack grow">'+offBox()+
    '<p class="kicker">'+t("solved_k", s.round)+'</p>'+
    '<div><div class="hero '+(solved?"good":"none")+'"><p class="kicker">'+t("the_word")+'</p>'+
    '<div class="bigword">'+esc(r.word)+'</div>'+
    '<div class="herorow">'+
      (solved
        ? '<span class="hw">'+(function(){ const wu = s.units.find(x => x.id === winnerUnit);
            return wu && wu.face ? '<span class="av sm pic">'+faceSvg(wu.face, 26)+'</span>'
                                 : '<span class="av sm heroav">'+esc(initials(r.solvedName))+'</span>'; })()+
          '<span>'+t("got_it", esc(r.solvedName))+'</span></span><span class="ht">'+fmt(r.solveMs)+'</span>'
        : '<span class="hw">'+t("nobody")+'</span>')+
    '</div></div><div class="perf '+(solved?"good":"none")+'"></div></div>'+
    '<p class="kicker">'+t("band_k")+'</p>'+
    '<div class="band">'+[0,1,2].map(i =>
      '<div class="'+(bandIdx===i?"hit "+quality[i]:"")+'">'+t(keys[i])+'</div>').join("")+'</div>'+
    '<div class="scores">'+rows.map(row => {
      const u = s.units.find(x => x.id === row.id) || {};
      const won = row.id === winnerUnit;
      const role = won ? '<em class="role got">'+t("got_tag")+'</em>'
                 : (row.giver ? '<em class="role gav">'+t("giver_tag")+'</em>' : '');
      return '<div class="resrow'+(row.pts?"":" quiet")+'">'+uav(u)+
        '<span class="who"><span class="nm">'+esc(row.name)+role+'</span>'+
        (row.why.length ? '<span class="dt">'+row.why.join(" · ")+'</span>' : '')+'</span>'+
        '<span class="pt '+(row.pts>0?"":(row.pts<0?"neg":"zero"))+'">'+
        (row.pts>0?"+"+row.pts:String(row.pts))+'</span></div>';
    }).join("")+'</div>'+
    '<p class="kicker">'+(moves ? t("standings_k") : t("board_k", s.rows+1))+'</p>'+
    trackBlock(s, s.steps)+errBox()+'<div class="grow"></div>'+
    ((s.isGiver || s.isHost)
      ? '<button id="next">'+(s.winner ? t("see_won") : (moves ? t("go_move") : t("next_round")))+'</button>'
      : '<p class="note">'+t("waitjudge")+'</p>')+
    '</div>');
  on("next", () => act({ type:"next" }));
  const stamp = s.round + ":" + r.word;
  if(solved && burstFor !== stamp){
    burstFor = stamp;
    setTimeout(() => burst({ y: innerHeight * 0.28 }), 220);
  }
}

/* ---------------- the board ---------------- */
function nodeXY(r, c, rows){
  const top = 34, bottom = 534;
  const y = bottom - (bottom - top) * (r / (rows + 1));
  const x = 44 + c * 77;
  if(r === 0 || r > rows) return { x: 44 + 1.5*77, y };
  return { x, y };
}
const COLC = ["var(--accent)","var(--good)","var(--blind)","var(--guilty)"];
function boardSVG(s, spots, picked){
  const rows = s.board.rows, lit = {};
  (spots||[]).forEach(p => lit[p.r+","+p.c] = p);
  let out = "";
  for(let c = 0; c < 4; c++){
    const a = nodeXY(1,c,rows), b = nodeXY(rows,c,rows);
    out += '<rect x="'+(a.x-15)+'" y="'+(b.y-15)+'" width="30" height="'+((a.y-b.y)+30)+
           '" rx="15" fill="'+COLC[c]+'" opacity="0.10"/>';
  }
  for(let r = 0; r <= rows; r++){
    const froms = r === 0 ? [{r:0,c:1}] : [0,1,2,3].map(c => ({r,c}));
    froms.forEach(p => {
      const nxt = p.r >= rows ? [{r:rows+1,c:1}]
                : p.r === 0 ? [0,1,2,3].map(c => ({r:1,c}))
                : [p.c-1,p.c,p.c+1].filter(c => c>=0 && c<4).map(c => ({r:p.r+1,c}));
      nxt.forEach(q => {
        const A = nodeXY(p.r,p.c,rows), B = nodeXY(q.r,q.c,rows);
        out += '<line x1="'+A.x+'" y1="'+A.y+'" x2="'+B.x+'" y2="'+B.y+'" stroke="'+
               COLC[Math.min(q.c,3)]+'" stroke-width="1.6" opacity="0.28"/>';
      });
    });
  }
  s.board.nodes.forEach(n => {
    const xy = nodeXY(n.r, n.c, rows), key = n.r+","+n.c, isLit = !!lit[key];
    const col = n.t === "CARD" ? "var(--good)" : COLC[n.c];
    const short = n.t === "CARD" ? t("card_node") : ((pack.mods[n.t]||{}).s || "");
    let node;
    if(short){
      const ink = n.c === 2 && n.t !== "CARD" ? "#2A1B00" : "#FFFFFF";
      node = (isLit ? '<circle cx="'+xy.x+'" cy="'+xy.y+'" r="13.5" fill="'+col+'" opacity="0.18"/>' : '')+
        '<rect x="'+(xy.x-17)+'" y="'+(xy.y-8.5)+'" width="34" height="17" rx="8.5" fill="'+
        (isLit?col:"var(--surface)")+'" stroke="'+col+'" stroke-width="'+(isLit?1.8:1.3)+'"/>'+
        '<text x="'+xy.x+'" y="'+(xy.y+2.8)+'" text-anchor="middle" font-family="Assistant,sans-serif" '+
        'font-size="7.5" font-weight="800" fill="'+(isLit?ink:col)+'">'+esc(short)+'</text>';
    } else {
      node = (isLit ? '<circle cx="'+xy.x+'" cy="'+xy.y+'" r="12.5" fill="'+col+'" opacity="0.18"/>' : '')+
        '<circle cx="'+xy.x+'" cy="'+xy.y+'" r="'+(isLit?8:4.5)+'" fill="'+(isLit?col:"var(--rule)")+'"'+
        (isLit?' stroke="var(--surface)" stroke-width="2"':'')+'/>';
    }
    out += isLit
      ? '<g data-go="'+key+'" style="cursor:pointer">'+node+
        '<rect x="'+(xy.x-24)+'" y="'+(xy.y-13)+'" width="48" height="26" fill="transparent"/></g>'
      : node;
  });
  const s0 = nodeXY(0,1,rows);
  out += '<circle cx="'+s0.x+'" cy="'+s0.y+'" r="7" fill="var(--sunk)" stroke="var(--rule)" stroke-width="1.5"/>';
  const e0 = nodeXY(rows+1,1,rows), endLit = !!lit[(rows+1)+",1"];
  const endNode = (endLit ? '<circle cx="'+e0.x+'" cy="'+e0.y+'" r="21" fill="var(--good)" opacity="0.2"/>' : '')+
    '<circle cx="'+e0.x+'" cy="'+e0.y+'" r="14" fill="'+(endLit?"var(--good)":"var(--ink)")+'"/>'+
    '<text x="'+e0.x+'" y="'+(e0.y+3.4)+'" text-anchor="middle" font-family="Assistant,sans-serif" '+
    'font-size="9" font-weight="800" fill="#FFFFFF">'+(lang==="he"?"סוף":"END")+'</text>';
  out += endLit ? '<g data-go="'+(rows+1)+',1" style="cursor:pointer">'+endNode+
    '<rect x="'+(e0.x-26)+'" y="'+(e0.y-26)+'" width="52" height="52" fill="transparent"/></g>' : endNode;

  const byKey = {};
  s.units.forEach(u => { const k = u.pos.r+","+u.pos.c; (byKey[k] = byKey[k] || []).push(u); });
  Object.keys(byKey).forEach(k => {
    const [r,c] = k.split(",").map(Number), list = byKey[k], p0 = nodeXY(r,c,rows);
    list.forEach((u,j) => {
      const x = p0.x + (j - (list.length-1)/2) * 19;
      const justLanded = lastPos[u.id] && (lastPos[u.id] !== u.pos.r+","+u.pos.c);
      out += '<g class="'+(justLanded?"tok":"")+'">'+ (u.face
        ? faceToken(u.face, x, p0.y, 11.5)
        : '<circle cx="'+x+'" cy="'+p0.y+'" r="11.5" fill="'+unitColor(u)+'" stroke="var(--surface)" stroke-width="2.5"/>'+
          '<text x="'+x+'" y="'+(p0.y+3.4)+'" text-anchor="middle" font-family="Assistant,sans-serif" '+
          'font-size="9" font-weight="800" fill="#FFFFFF">'+esc(initials(u.name))+'</text>') + '</g>';
    });
  });
  if(picked){
    const xy = nodeXY(picked.r, picked.c, rows);
    out += picked.r > rows
      ? '<circle cx="'+xy.x+'" cy="'+xy.y+'" r="20" fill="none" stroke="var(--ink)" stroke-width="2.2"/>'
      : '<rect x="'+(xy.x-22)+'" y="'+(xy.y-13.5)+'" width="44" height="27" rx="13.5" fill="none" stroke="var(--ink)" stroke-width="2.2"/>';
  }
  return '<svg class="board" viewBox="0 0 320 560" role="img">'+out+'</svg>';
}
function trackBlock(s, pending){
  const rows = s.rows;
  const sorted = s.units.slice().sort((a,b) => b.pos.r - a.pos.r || b.score - a.score);
  return '<div class="track">'+sorted.map(u => {
    const pend = (pending || {})[u.id] || 0, cur = u.pos.r, pot = Math.min(rows+1, cur + pend);
    return '<div class="trow">'+uav(u, "sm")+
      '<div><div class="tname"><span class="tn">'+esc(u.name)+'</span>'+
      (pend ? '<span class="stepchip">+'+pend+'</span>' : '')+'</div>'+
      '<div class="tbar">'+
        (pend ? '<span class="tghost" style="width:'+(pot/(rows+1)*100)+'%;background:'+unitColor(u)+'"></span>' : '')+
        '<span class="tfill" style="width:'+Math.min(100, cur/(rows+1)*100)+'%;background:'+unitColor(u)+'"></span>'+
      '</div></div><span class="tnum">'+cur+'</span></div>';
  }).join("")+'</div>';
}
function vMove(s){
  document.documentElement.dataset.tone = "live";
  const mv = s.move;
  if(!mv){ h('<div class="stack grow">'+offBox()+waitCard("…","")+'</div>'); return; }
  const picked = mv.mine ? (movePickLocal || mv.picked) : mv.picked;
  const sel = picked && mv.spots.find(p => p.r === picked.r && p.c === picked.c);
  const queue = mv.of < 2 ? "" :
    '<p class="kicker">'+t("move_queue_k", mv.of)+'</p><div class="qbar">'+
    (s.queue||[]).map(q => '<span class="qchip'+(q.done?" done":(q.now?" now":""))+'">'+
      uav(s.units.find(u=>u.id===q.id)||{name:q.name}, "sm")+esc(q.name)+
      ' <i>'+(q.done?"✓":q.steps)+'</i></span>').join("")+'</div>';
  const readout = sel
    ? '<div class="sentence"><span class="sl">'+t("move_sel_k")+'</span>'+
      '<span class="sw">'+(sel.type.key === "END" ? t("the_end")
        : sel.type.key === "CARD" ? t("card_node_d") : sel.type.name)+'</span>'+
      '<span class="sr">'+t("move_cost", sel.type.key==="END" ? t("the_end") : t("row_n", sel.r), sel.d+"/"+mv.steps)+
      (sel.type.desc ? ' · '+sel.type.desc : '')+'</span></div>'
    : '<p class="note">'+t("move_tap", mv.spots.length)+'</p>';

  h('<div class="stack grow">'+offBox()+
    '<div class="topbar"><p class="kicker">'+t("move_k", mv.seat+"/"+mv.of)+'</p></div>'+
    (mv.mine
      ? '<h2 style="color:'+unitColor(s.units.find(u=>u.id===mv.unitId)||{})+'">'+
        moveHead(s.units.find(u=>u.id===mv.unitId), mv.unitName, mv.steps)+'</h2><p class="note">'+t("move_d", mv.steps)+'</p>'
      : '<div class="waitrow">'+uav(s.units.find(u=>u.id===mv.unitId)||{name:mv.unitName})+
        '<span><span class="wt">'+tUnit("waitmove", s.units.find(u=>u.id===mv.unitId), mv.unitName)+'</span>'+
        '<span class="ws">'+t("yourturn", esc(mv.unitName))+'</span></span></div>')+
    queue+stuckBar(s)+
    '<div class="boardwrap">'+boardSVG(s, mv.mine ? mv.spots : [], picked)+'</div>'+
    (mv.mine ? readout : "")+errBox()+
    (mv.mine ? '<button id="go"'+(sel?"":" disabled")+'>'+(sel?t("move_confirm"):t("move_pick"))+'</button>' : '')+
    '</div>');
  wireSkip();
  if(mv.mine){
    each("[data-go]", g => g.addEventListener("click", () => {
      const [r,c] = g.dataset.go.split(",").map(Number);
      movePickLocal = { r, c };
      act({ type:"movepick", r, c });
    }));
    on("go", () => { movePickLocal = null; act({ type:"moveconfirm" }); });
  }
}
function vOver(s){
  document.documentElement.dataset.tone = "scored";
  h('<div class="stack grow">'+offBox()+
    '<p class="kicker">'+t("after_rounds", s.round)+'</p>'+
    '<h1>'+tUnit("wins", s.units.find(u=>u.id===(s.standings[0]||{}).id), (s.standings[0]||{}).name)+'</h1>'+
    '<div class="scores">'+s.standings.map((u,i) =>
      '<div class="resrow">'+uav(s.units.find(x=>x.id===u.id)||{name:u.name})+
      '<span class="who"><span class="nm">'+(i+1)+'. '+esc(u.name)+'</span></span>'+
      '<span class="pt">'+u.score+'</span></div>').join("")+'</div>'+
    errBox()+'<div class="grow"></div>'+
    (s.isHost ? '<button id="again">'+t("playagain")+'</button>' : '')+
    '<button class="quiet" id="leave">'+t("leave")+'</button></div>');
  on("again", () => act({ type:"again" }));
  on("leave", async () => { await act({ type:"leave" }); forget(); render(); });
}

function topbar(s){
  return '<div class="topbar"><p class="kicker">'+t("table_k", s.round)+'</p>'+
         '<span class="qchip">'+pav(s.giver, "sm")+esc(s.giverName)+'</span></div>';
}

/* ---------------- dispatch ---------------- */
function render(){
  applyLang();
  if(screen !== "game") stopTicker();
  if(screen === "join"){ vJoin(); return; }
  if(!me || !me.pid){ vName(); return; }
  if(!state){ h('<div class="stack"><h1>'+t("title")+'</h1><p class="sub">…</p></div>'); return; }
  if(state.phase === "lobby"){ document.documentElement.dataset.tone = "live"; vLobby(); return; }
  if(!pack){ h('<div class="stack"><h1>'+t("title")+'</h1><p class="sub">…</p></div>'); return; }
  document.documentElement.dataset.tone = TONE[state.phase] || "live";
  const f = { giver:vGiver, blind:vBlind, table:vTable, judge:vJudge,
              reveal:vReveal, move:vMove, award:vAward, swap:vSwap, over:vOver }[state.phase];
  if(f) f(state); else vLobby();
}

/* ---------------- boot ---------------- */
try{ me = JSON.parse(localStorage.getItem(K_ROOM) || "null"); }catch(e){ me = null; }
try{ myFace = localStorage.getItem(K_FACE) || null; }catch(e){}
if(!myFace) myFace = FACES[Math.floor(Math.random() * FACES.length)].id;
if(me && me.pid && me.code){ connect(); render(); }
else { if(me && me.name) me = { name:me.name }; render(); }
