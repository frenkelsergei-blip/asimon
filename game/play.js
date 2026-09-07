/* The round, played across several phones.

   The server owns the state; each phone is sent only what the person holding
   it is allowed to know. The giver's four words go to the giver's device and
   nowhere else — on a blind round it is the exact opposite.                  */
"use strict";
const { createEngine } = require("./engine");

const MIN_PLAYERS = 3;
/* Caps for a room where one phone may carry several people. MIN_PLAYERS is
   still counted in phones, because in groups a phone is exactly one unit. */
const MAX_GROUP  = 5;                 /* people sharing one phone */
const MAX_PEOPLE = 30;                /* people in a room, however they are spread */
const SEATINGS = ["solo", "pairs", "groups"];

/* ---------------- phones and people ----------------
   A phone is not a player. In solo and in pairs a phone carries exactly one
   person and the two share an id, so every helper here is an identity and the
   game behaves as it always has. The split exists so a phone can later carry
   a whole group: the roster the rules run on is the people, while everything
   the server addresses — streams, actions, going offline — stays the phone. */
function roster(room){
  return (room.people && room.people.length) ? room.people
       : room.players.map(p => ({ id:p.id, name:p.name, face:p.face, phoneId:p.id }));
}
function personById(room, id){ return roster(room).find(p => p.id === id) || null; }
function peopleOf(room, phoneId){ return roster(room).filter(p => p.phoneId === phoneId); }
function phoneOf(room, personId){
  const p = personById(room, personId);
  return p ? p.phoneId : personId;      /* an unknown id is its own phone */
}
function owns(room, phoneId, personId){ return phoneOf(room, personId) === phoneId; }
/* the phones behind a set of people, each named once */
function phonesFor(room, personIds){
  const out = [];
  (personIds || []).forEach(id => {
    const ph = phoneOf(room, id);
    if(ph && out.indexOf(ph) < 0) out.push(ph);
  });
  return out;
}
/* the person a phone is acting as. One person today; the group phone will
   have to say which of its people it means, and that is the claim step. */
function actingPerson(room, phoneId){
  const mine = peopleOf(room, phoneId);
  return mine.length ? mine[0].id : phoneId;
}
/* one person joins a phone. The first person on a phone takes the phone's own
   id, so a solo room's people and players are one list under two names. */
function addPerson(room, phoneId, name, face){
  room.people = room.people || [];
  const first = !room.people.some(p => p.phoneId === phoneId);
  const id = first ? phoneId : "n" + Math.random().toString(36).slice(2, 10);
  room.people.push({ id, name, face, phoneId });
  return id;
}

/* The interface strings already exist, written twice, inside the engine. Send
   them to the phones once per language instead of re-translating them here. */
const uiCache = {};
function uiPack(lang){
  if(uiCache[lang]) return uiCache[lang];
  const e = createEngine();
  e.S = e.freshState(); e.S.lang = lang; e.applyLang();
  const p = e.packs();
  uiCache[lang] = {
    ui: p.D,
    mods: Object.keys(p.MODS).reduce((o,k) => (o[k] = { n:p.MODS[k].n, s:p.MODS[k].s, d:p.MODS[k].d }, o), {}),
    topics: Object.keys(p.TOPICS).map(k => ({ k, n:p.TOPICS[k].n })),
    cards: Object.keys(p.CARDS).reduce((o,k) => (o[k] = { n:p.CARDS[k].n, d:p.CARDS[k].d }, o), {})
  };
  return uiCache[lang];
}

/* The board is fixed once a game starts, so the phones are told its shape once
   and draw it themselves; only the tokens and the lit squares change. */
function boardLayout(room){
  const e = room.engine;
  const mapId = e.S.mapId;
  if(room.boardCache && room.boardCache.rows === e.ROWS() && room.boardCache.mapId === mapId) return room.boardCache;
  const rows = e.ROWS(), nodes = [];
  for(let r = 1; r <= rows; r++)
    for(let c = 0; c < 4; c++)
      nodes.push({ r, c, t: e.isCardNode(r,c) ? "CARD" : e.isWildNode(r,c) ? "WILD" : e.nodeTypeAt(r,c) });
  room.boardCache = { rows, cols:4, mapId, themeId: (e.MAPS[mapId] || e.MAPS.classic).themeId, nodes };
  return room.boardCache;
}

/* the ids modes/maps are known by, for validating whatever a phone sends in */
const MODE_IDS = Object.keys(createEngine().MODES);
const MAP_IDS = Object.keys(createEngine().MAPS);
function randomMapId(exclude){
  const pool = exclude ? MAP_IDS.filter(id => id !== exclude) : MAP_IDS;
  const list = pool.length ? pool : MAP_IDS;
  return list[Math.floor(Math.random() * list.length)];
}

/* Groups take the giving seat in turn, so the flat rotation the engine walks
   has to alternate between them. Interleaving the roster does that exactly for
   equal groups and approximately for ragged ones; step three replaces it with
   an explicit group seat, and the bench choosing who speaks on top of that. */
function orderByUnit(e){
  const queues = e.S.units.map(u => u.members.slice());
  const order = [];
  while(queues.some(q => q.length))
    queues.forEach(q => { if(q.length) order.push(q.shift()); });
  e.S.players = order.map(id => e.S.players.find(p => p.id === id)).filter(Boolean);
}

/* ---------------- starting ---------------- */
function startGame(room, opts){
  const e = createEngine();
  e.S = e.freshState();
  e.S.lang = room.lang;
  /* Three ways to sit. Only "groups" changes what a phone is — solo and pairs
     still put exactly one person behind each. Pairs needs four to split. */
  const asked = (opts && SEATINGS.indexOf(opts.seating) >= 0) ? opts.seating
              : (SEATINGS.indexOf(room.seating) >= 0)         ? room.seating
              : ((opts && opts.mode === "teams") ? "pairs" : "solo");
  e.S.seating = (asked === "pairs" && roster(room).length < 4) ? "solo" : asked;
  room.seating = e.S.seating;
  e.S.mode = e.S.seating === "pairs" ? "teams" : "solo";
  e.S.modeId = (opts && MODE_IDS.indexOf(opts.gameMode) >= 0) ? opts.gameMode : "regular";
  e.S.mapId = (room.mapId && MAP_IDS.indexOf(room.mapId) >= 0) ? room.mapId : "classic";
  room.mode = e.S.modeId;
  room.mapId = e.S.mapId;
  e.applyLang();

  /* Giving the first clue is the hardest seat at the table, and seat order
     alone would hand it to the same person every game. Shuffled once, here,
     it holds for the rest of the game. */
  e.S.players = e.shuffle(roster(room).map(p => ({ id:p.id, name:p.name })));
  if(e.S.seating === "groups"){
    /* one phone, one unit — whoever is on it is the group */
    e.S.units = [];
    room.players.forEach(ph => {
      const members = peopleOf(room, ph.id).map(p => p.id)
                        .filter(id => e.S.players.some(q => q.id === id));
      if(!members.length) return;
      const i = e.S.units.length;
      e.S.units.push({
        id:"u"+i, score:0, cards:[], pos:e.startPos(), members,
        name: ph.groupName || e.playerById(members[0]).name,
        color: e.UNIT_COLORS[i % e.UNIT_COLORS.length]
      });
    });
    orderByUnit(e);
  } else if(e.S.mode === "teams"){
    const shuffled = e.shuffle(e.S.players.map(p => p.id));
    e.S.units = [];
    for(let i = 0; i < shuffled.length; i += 2){
      const members = shuffled.slice(i, i+2);
      if(members.length < 2){ e.S.units[e.S.units.length-1].members.push(members[0]); break; }
      e.S.units.push({
        id:"u"+i, score:0, cards:[], pos:e.startPos(), members,
        name: members.map(id => e.playerById(id).name).join(" + "),
        color: e.UNIT_COLORS[e.S.units.length % e.UNIT_COLORS.length]
      });
    }
  } else {
    e.S.units = e.S.players.map((p,i) => ({
      id:"u"+i, name:p.name, score:0, cards:[], pos:e.startPos(),
      members:[p.id], color:e.UNIT_COLORS[i % e.UNIT_COLORS.length]
    }));
  }
  /* The board is a race between units, so in groups its length comes off the
     number of groups — nine people in three groups should not be handed the
     board nine separate players would get. */
  e.setBoard(e.S.seating === "groups" ? e.S.units.length : e.S.players.length,
             e.S.modeId, e.S.mapId);
  e.S.giverIdx = 0; e.S.round = 0; e.S.used = [];
  dealOpeningCard(e);

  room.engine = e;
  room.movePick = null;
  /* Round 1 is not dealt yet: everyone watches the order come up first and
     taps in. Only then does newRound() run — so no word can leak early. */
  room.accepted = [];
  room.phase = "order";
  return room;
}

/* one player, one card, nobody told — a little swing before the first word */
function dealOpeningCard(e){
  const keys = e.packs().CARDKEYS;
  const u = e.S.units[Math.floor(Math.random() * e.S.units.length)];
  const key = keys[Math.floor(Math.random() * keys.length)];
  u.cards = u.cards || [];
  u.cards.push(key);
  e.S.opening = { unitId:u.id, key };
}

/* everyone has tapped in (or the room skipped past someone): deal round 1 */
function beginFirstRound(room){
  const e = room.engine;
  room.accepted = [];
  e.newRound();
  room.phase = phaseFor(e);
}

/* the engine's own screen names, mapped to what a room is doing */
function phaseFor(e){
  const s = e.S.screen;
  if(s === "blindPick" || s === "blindShow") return "blind";
  if(s === "giverHandoff" || s === "giver")  return "giver";
  return s;                                   // table | judge | reveal | move | over
}

/* ---------------- the clock ---------------- */
function armClock(room, onExpire){
  clearClock(room);
  const e = room.engine;
  if(!e || !e.S.r) return;
  const left = e.remainMs();
  if(left <= 0) return;
  room.clockTimer = setTimeout(() => { room.clockTimer = null; onExpire(); }, left + 30);
}
function clearClock(room){
  if(room.clockTimer){ clearTimeout(room.clockTimer); room.clockTimer = null; }
}

/* ---------------- what one phone may see ---------------- */
function viewFor(room, pid){
  const base = {
    code: room.code,
    lanUrl: room.lanUrl,
    phase: room.phase,
    lang: room.lang,
    you: pid,
    isHost: room.hostId === pid,
    players: room.players.map(p => ({ id:p.id, name:p.name, face:p.face, online:p.online, host:p.id === room.hostId })),
    taken: room.players.map(p => p.face).filter(Boolean)
  };
  const e = room.engine;
  if(!e || room.phase === "lobby"){
    /* the map is rolled the moment the room exists, so the lobby can show a
       preview (and offer a reroll) before anybody has pressed start */
    base.mapId = room.mapId || "classic";
    base.gameMode = room.mode || "regular";
    base.seating = SEATINGS.indexOf(room.seating) >= 0 ? room.seating : "solo";
    /* the whole roster, so a phone can draw the table as groups, and its own
       slice of it, which is the only part it may edit */
    base.people = roster(room).map(p => ({ id:p.id, name:p.name, face:p.face, phone:p.phoneId }));
    base.mine = peopleOf(room, pid).map(p => p.id);
    base.groupName = (room.players.find(x => x.id === pid) || {}).groupName || "";
    base.maxGroup = MAX_GROUP;
    base.maxPeople = MAX_PEOPLE;
    return base;
  }

  const S = e.S, R = S.r;
  const MODS = e.packs().MODS;
  const myPeople = peopleOf(room, pid);
  const myUnit = e.unitOf(myPeople.length ? myPeople[0].id : pid);

  base.board   = boardLayout(room);
  base.round   = S.round;
  base.rows    = e.ROWS();
  base.mode    = S.mode;
  base.seating = S.seating || "solo";
  base.gameMode = S.modeId;
  base.mapId    = S.mapId;
  const faceOfPerson = id => (personById(room, id) || {}).face;
  base.units   = S.units.map(u => ({
    id:u.id, name:u.name, score:u.score, pos:u.pos, color:u.color,
    face: faceOfPerson(u.members[0]),
    faces: u.members.map(faceOfPerson).filter(Boolean),
    members:u.members, cards:(u.cards||[]).length, mine:u.id === (myUnit && myUnit.id)
  }));
  base.winner  = (e.winnerUnit() || {}).id || null;

  if(R){
    const isGiver = owns(room, pid, R.giver);
    base.giver     = R.giver;
    base.giverName = e.playerById(R.giver).name;
    base.isGiver   = isGiver;
    base.mod       = { key:R.mod, name:MODS[R.mod].n, desc:MODS[R.mod].d };
    base.challenge = R.challenge;
    base.topic     = R.topic ? e.packs().TOPICS[R.topic].n : null;
    /* the key as well as the name — the phone draws an emblem off it */
    base.topicKey  = R.topic || null;
    base.lockedOut = R.lockedOut.slice();
    /* out only when nobody left on this phone may still shout */
    base.iAmOut    = myPeople.length > 0 &&
                     myPeople.every(p => R.lockedOut.indexOf(p.id) >= 0);
    base.total     = R.total;
    base.remainMs  = e.remainMs();
    base.insight   = R.insight ? (R.insightWords || R.words.map(w => w.text)) : null;

    /* the secret, and who is allowed to hold it */
    const blind = R.mod === "B";
    const maySeeWords = blind ? !isGiver : isGiver;
    if(maySeeWords){
      base.secret = {
        words: R.words.map(w => ({ text:w.text, value:e.wordValue(R, w) })),
        pick: R.pick,
        shot: isGiver ? R.shot : null,
        shotName: (isGiver && R.shot) ? e.playerById(R.shot).name : null
      };
    }
    if(R.shotPublic && R.shot){
      base.partner = { id:R.shot, name:e.playerById(R.shot).name };
    }
    if(room.phase === "judge" && R.judging){
      base.judging = { id:R.judging, name:e.playerById(R.judging).name };
    }
    base.veto     = !!R.veto;
    base.mimeCard = !!R.mimeCard;
    base.swapped  = !!R.swapped;

    /* your own cards, and only yours. Everyone else sees a count. */
    const CARDS = e.packs().CARDS;
    if(myUnit){
      const isGiverUnit = e.unitOf(R.giver).id === myUnit.id;
      base.hand = (myUnit.cards || [])
        .filter(k => k !== "swap" || isGiverUnit)      /* only the giver may switch words */
        .map(k => ({ key:k, n:CARDS[k].n, d:CARDS[k].d }));
      base.canPlay = room.phase === "table" && base.hand.length > 0;
    }
  }

  if(room.phase === "award" && S.awardFor){
    const u = e.unitById(S.awardFor), CARDS = e.packs().CARDS;
    base.award = {
      unitId: u.id, unitName: u.name,
      mine: u.members.some(m => owns(room, pid, m)),
      offers: (S.offers || []).map(k => ({ key:k, n:CARDS[k].n, d:CARDS[k].d }))
    };
  }
  if(room.phase === "swap" && R){
    base.swap = { mine: R.giver === pid, giverName: e.playerById(R.giver).name };
  }

  if(room.phase === "reveal" && S.result){
    const res = S.result;
    base.result = {
      word: res.word.text,
      solvedBy: res.solvedBy,
      solvedName: res.solvedBy ? e.playerById(res.solvedBy).name : null,
      solveMs: res.solveMs,
      total: res.total,
      mod: res.mod,
      rows: res.rows.map(r => ({ id:r.id, name:r.name, pts:r.pts, why:r.why, giver:r.giver }))
    };
    base.steps = S.steps;
  }

  if(room.phase === "move"){
    const order = moveOrder(e);
    const uid = order[S.moveSeat];
    const u = uid ? e.unitById(uid) : null;
    if(u){
      const steps = S.steps[u.id];
      base.move = {
        unitId: u.id, unitName: u.name, steps,
        seat: S.moveSeat + 1, of: order.length,
        mine: u.members.some(m => owns(room, pid, m)),
        spots: e.reachable(e.posOf(u), steps).map(p => ({ r:p.r, c:p.c, d:p.d, type:squareType(e, p) })),
        picked: room.movePick
      };
      base.queue = order.map((id,i) => {
        const q = e.unitById(id);
        return { id, name:q.name, steps:S.steps[id], done:i < S.moveSeat, now:i === S.moveSeat };
      });
    }
  }

  if(room.phase === "order"){
    const accepted = room.accepted || [];
    base.order = {
      seats: S.players.map(p => ({ id:p.id, name:p.name, in:accepted.indexOf(p.id) >= 0 })),
      mineIn: accepted.indexOf(pid) >= 0,
      left: S.players.length - accepted.length
    };
  }

  if(room.phase === "wild" && S.wild){
    const u = e.unitById(S.wild.unitId), CARDS = e.packs().CARDS;
    base.wild = Object.assign({}, S.wild, {
      mine: !!(u && u.members.some(m => owns(room, pid, m))),
      cardName: S.wild.card ? CARDS[S.wild.card].n : null,
      cardDesc: S.wild.card ? CARDS[S.wild.card].d : null
    });
  }

  /* the free card dealt at kickoff — told to its holder alone, and only until
     the first round begins */
  if(room.phase === "order" && S.opening && myUnit && myUnit.id === S.opening.unitId){
    const CARDS = e.packs().CARDS;
    base.opening = { key:S.opening.key, n:CARDS[S.opening.key].n, d:CARDS[S.opening.key].d };
  }

  const blocked = blockedBy(room);
  if(blocked) base.blocked = blocked;
  base.idleMs = IDLE_MS;          /* the phones count the same wait the server does */
  const waiting = waitingOn(room);
  if(waiting){
    /* whoever is being waited for cannot be the one to skip themselves */
    waiting.isYou = awaitedIds(room).indexOf(pid) >= 0;
    base.waiting = waiting;
  }

  if(room.phase === "over"){
    /* The game ends on the win condition, not on the score column — the board
       race is won by crossing the line, and a wrong shout costs score without
       costing ground, so the two disagree about one game in five. Whoever won
       goes at the head of the table, because that is the row the phone crowns. */
    const won = (e.winnerUnit() || {}).id || null;
    base.standings = S.units.slice()
      .sort((a,b) => (b.id === won) - (a.id === won)
                  || ((b.pos||{}).r||0) - ((a.pos||{}).r||0)
                  || b.score - a.score)
      .map(u => ({ id:u.id, name:u.name, score:u.score, row:(u.pos||{}).r||0 }));
  }
  return base;
}

function squareType(e, p){
  if(p.r > e.ROWS()) return { key:"END", name:null };
  if(e.isCardNode(p.r, p.c)) return { key:"CARD", name:null };
  if(e.isWildNode(p.r, p.c)) return { key:"WILD", name:null };
  const ty = e.nodeTypeAt(p.r, p.c);
  const MODS = e.packs().MODS;
  return { key:ty, name:MODS[ty].n, desc:MODS[ty].d };
}
/* A room stalls for two reasons: a phone that has gone, and a phone that is
   simply not being looked at. Both leave everyone else with nothing to tap. */
const IDLE_MS = Number(process.env.LS_IDLE_MS || 45000);
/* the phone counts the wait from when its own state arrived, so it can reach
   the threshold a moment before the server does — accept the button it showed */
const IDLE_SLACK_MS = 2500;

/* the phones whose turn it is — nobody else can act until one of them does */
function awaitedPeople(room){
  const e = room.engine;
  if(!e) return [];
  /* the order screen runs before round one exists, so it is answered first */
  if(room.phase === "order")
    return e.S.players.filter(p => (room.accepted || []).indexOf(phoneOf(room, p.id)) < 0).map(p => p.id);
  if(!e.S.r) return [];
  const S = e.S, R = S.r;
  const members = uid => { const u = e.unitById(uid); return u ? u.members.slice() : []; };
  switch(room.phase){
    case "giver": case "swap": return [R.giver];
    case "judge": return R.mod === "B"
                    ? S.players.filter(p => p.id !== R.giver).map(p => p.id)
                    : [R.giver];
    case "move":  return members(moveOrder(e)[S.moveSeat]);
    case "award": return members(S.awardFor);
    case "wild":  return members(S.wild && S.wild.unitId);
    case "blind": return S.players.filter(p => p.id !== R.giver).map(p => p.id);
    default:      return [];
  }
}
/* the phones those people are holding — what a phone tests itself against */
function awaitedIds(room){ return phonesFor(room, awaitedPeople(room)); }

/* who the game cannot proceed without, present or not */
function waitingOn(room){
  const e = room.engine;
  if(!e) return null;
  const who = id => {
    const person = personById(room, id) || {};
    const p = room.players.find(x => x.id === phoneOf(room, id)) || {};
    return { id, name:person.name || p.name || "?", face:person.face || p.face, online:!!p.online,
             forMs: Math.max(0, Date.now() - (room.phaseAt || Date.now())) };
  };
  if(room.phase === "order"){
    const late = awaitedPeople(room);
    return late.length ? who(late[0]) : null;
  }
  if(!e.S.r) return null;
  const S = e.S, R = S.r;
  const firstOf = uid => {
    const u = e.unitById(uid);
    if(!u) return null;
    const live = u.members.find(m => (room.players.find(x => x.id === phoneOf(room, m)) || {}).online);
    return who(live || u.members[0]);
  };
  switch(room.phase){
    case "giver": case "swap": return who(R.giver);
    case "judge":  return R.mod === "B" ? null : who(R.giver);
    case "blind":  return null;                  /* anyone but the giver may act */
    case "move":   return firstOf(moveOrder(e)[S.moveSeat]);
    case "award":  return firstOf(S.awardFor);
    case "wild":   return firstOf(S.wild && S.wild.unitId);
    default:       return null;
  }
}

function blockedBy(room){
  const e = room.engine;
  if(!e) return null;
  const on = id => { const p = room.players.find(x => x.id === phoneOf(room, id)); return !!(p && p.online); };
  const who = id => { const p = personById(room, id) || room.players.find(x => x.id === id) || {};
                      return { id, name:p.name || "?" }; };
  const stalled = () => (Date.now() - (room.phaseAt || Date.now())) > (IDLE_MS - IDLE_SLACK_MS);
  if(room.phase === "order"){
    const late = awaitedPeople(room);
    if(!late.length) return null;
    const gone = late.find(id => !on(id));
    return gone ? who(gone) : (stalled() ? who(late[0]) : null);
  }
  if(!e.S.r) return null;
  const S = e.S, R = S.r;
  const unitBlocked = uid => {
    const u = e.unitById(uid);
    return (u && !u.members.some(on)) ? who(u.members[0]) : null;
  };
  switch(room.phase){
    case "giver": case "swap":
      return (!on(R.giver) || stalled()) ? who(R.giver) : null;
    case "judge":
      return R.mod === "B"
        ? ((!S.players.some(p => p.id !== R.giver && on(p.id)) || stalled()) ? who(R.giver) : null)
        : ((!on(R.giver) || stalled()) ? who(R.giver) : null);
    case "blind":
      return (!S.players.some(p => p.id !== R.giver && on(p.id)) || stalled()) ? who(R.giver) : null;
    case "move":  return unitBlocked(moveOrder(e)[S.moveSeat]) || (stalled() ? waitingOn(room) : null);
    case "award": return unitBlocked(S.awardFor)               || (stalled() ? waitingOn(room) : null);
    case "wild":  return unitBlocked(S.wild && S.wild.unitId)  || (stalled() ? waitingOn(room) : null);
    default:      return null;          /* the host can always move these on */
  }
}

function moveOrder(e){
  return e.S.units.filter(u => (e.S.steps || {})[u.id] > 0).map(u => u.id);
}

/* ---------------- actions ---------------- */
/* Every one of these re-checks who is asking. A phone can only do the thing
   that phone is entitled to do, whatever it sends.                          */
function applyAction(room, me, body, ctx){
  const e = room.engine;
  const type = body.type;

  /* rerolling the map is a lobby-only affair — there is no engine yet to
     hang the "not_started" check off, so it is handled before that check */
  /* Seating, like the map, is settled before there is an engine to hang the
     "not_started" check off — so it is answered ahead of it. */
  if(type === "seating"){
    if(room.phase !== "lobby") return { error:"already_started" };
    if(room.hostId !== me.id) return { error:"host_only" };
    if(SEATINGS.indexOf(body.seating) < 0) return { error:"bad_choice" };
    room.seating = body.seating;
    return { ok:true };
  }

  if(type === "reroll_map"){
    if(room.phase !== "lobby") return { error:"already_started" };
    if(room.hostId !== me.id) return { error:"host_only" };
    room.mapId = randomMapId(room.mapId);
    return { ok:true };
  }

  if(!e) return { error:"not_started" };
  const S = e.S, R = S.r;
  const isGiver = !!(R && owns(room, me.id, R.giver));

  switch(type){

  case "challenge": {
    if(room.phase !== "giver" || !isGiver) return { error:"not_your_turn" };
    const k = String(body.k || "");
    if(!(k in e.CHALLENGES)) return { error:"bad_choice" };
    R.challenge = k;
    if(k === "cold"){
      const v = [2,3,4,5][Math.floor(Math.random()*4)];
      const bank = e.packs().W[v];
      R.words = [{ text: bank[Math.floor(Math.random()*bank.length)], value:e.wordPoints(v) }];
      R.pick = 0;
    }
    return { ok:true };
  }

  case "topic": {
    if(room.phase !== "giver" || !isGiver) return { error:"not_your_turn" };
    if(R.challenge !== "topic" || R.topic) return { error:"bad_step" };
    if(!e.packs().TOPICS[body.k]) return { error:"bad_choice" };
    e.dealTopic(body.k);
    return { ok:true };
  }

  case "pick": {
    const blind = R.mod === "B";
    if(blind){
      if(room.phase !== "blind" || isGiver) return { error:"not_your_turn" };
    } else {
      if(room.phase !== "giver" || !isGiver) return { error:"not_your_turn" };
      if(R.challenge === null) return { error:"bad_step" };
      if(R.challenge === "cold") return { error:"no_choice" };
    }
    const i = Number(body.i);
    if(!(i >= 0 && i < R.words.length)) return { error:"bad_choice" };
    R.pick = i;
    if(blind){ S.screen = "blindShow"; room.phase = "blind"; }
    return { ok:true };
  }

  case "aim": {
    if(room.phase !== "giver" || !isGiver) return { error:"not_your_turn" };
    if(R.shotPublic) return { error:"bad_step" };
    /* `pid` always means the phone that is asking — the target needs its own
       field, or an aim would rewrite who the request came from. */
    const target = body.target;
    if(target === R.giver || !S.players.some(p => p.id === target)) return { error:"bad_choice" };
    R.shot = target;
    return { ok:true };
  }

  case "ready": {
    const blind = R.mod === "B";
    if(blind){
      if(room.phase !== "blind" || isGiver) return { error:"not_your_turn" };
      if(R.pick === null) return { error:"pick_first" };
    } else {
      if(room.phase !== "giver" || !isGiver) return { error:"not_your_turn" };
      if(R.pick === null) return { error:"pick_first" };
      if(!R.shot && !R.shotPublic) return { error:"aim_first" };
    }
    R.acc = 0; R.startedAt = Date.now();
    S.screen = "table"; room.phase = "table";
    ctx.armClock();
    return { ok:true };
  }

  case "buzz": {
    if(room.phase !== "table") return { error:"not_now" };
    if(e.remainMs() <= 0) return { error:"time_up" };
    const blind = R.mod === "B";
    if(blind){ if(!isGiver) return { error:"not_your_turn" }; }
    else {
      if(isGiver) return { error:"not_your_turn" };
      if(R.lockedOut.indexOf(actingPerson(room, me.id)) >= 0) return { error:"you_are_out" };
    }
    /* first tap wins, and the server is the only clock that counts */
    e.pauseClock();
    R.judging = actingPerson(room, me.id);
    R.solveMs = e.elapsedMs();
    S.screen = "judge"; room.phase = "judge";
    ctx.clearClock();
    return { ok:true };
  }

  case "judge": {
    if(room.phase !== "judge") return { error:"not_now" };
    /* Blind turns the round inside out: the giver is the one guessing, and
       is the only person at the table who never saw the word. The verdict
       belongs to anybody who did. */
    if(R.mod === "B" ? isGiver : !isGiver) return { error:"not_your_turn" };
    const pid = R.judging;
    if(!pid) return { error:"bad_step" };
    if(body.yes){
      R.solvedBy = pid;
      e.scoreRound();
      S.screen = "reveal"; room.phase = "reveal";
      return { ok:true };
    }
    if(R.mod === "B"){
      R.judging = null;
      if(e.remainMs() <= 0){ R.solvedBy = null; e.scoreRound(); S.screen="reveal"; room.phase="reveal"; }
      else { S.screen = "table"; room.phase = "table"; e.resumeClock(); ctx.armClock(); }
      return { ok:true };
    }
    R.lockedOut.push(pid);
    R.judging = null;
    const alive = S.players.filter(p => p.id !== R.giver && R.lockedOut.indexOf(p.id) < 0);
    if(!alive.length || e.remainMs() <= 0){
      R.solvedBy = null; e.scoreRound();
      S.screen = "reveal"; room.phase = "reveal";
    } else {
      S.screen = "table"; room.phase = "table";
      e.resumeClock(); ctx.armClock();
    }
    return { ok:true };
  }

  case "nobody": {
    if(room.phase !== "table") return { error:"not_now" };
    if(!isGiver && room.hostId !== me.id) return { error:"not_your_turn" };
    e.pauseClock(); ctx.clearClock();
    R.solvedBy = null; R.solveMs = null;
    e.scoreRound();
    S.screen = "reveal"; room.phase = "reveal";
    return { ok:true };
  }

  case "next": {
    if(room.phase !== "reveal") return { error:"not_now" };
    if(!isGiver && room.hostId !== me.id) return { error:"not_your_turn" };
    if(e.isGameOver()){ S.screen = "over"; room.phase = "over"; return { ok:true }; }
    S.moveSeat = 0; room.movePick = null;
    if(!moveOrder(e).length){ e.newRound(); room.phase = phaseFor(e); return { ok:true }; }
    S.awardFor = null; S.offers = null;
    S.screen = "move"; room.phase = "move";
    return { ok:true };
  }

  case "movepick": {
    if(room.phase !== "move") return { error:"not_now" };
    const uid = moveOrder(e)[S.moveSeat];
    const u = uid && e.unitById(uid);
    if(!u || !u.members.some(m => owns(room, me.id, m))) return { error:"not_your_turn" };
    const spots = e.reachable(e.posOf(u), S.steps[u.id]);
    const hit = spots.find(p => p.r === Number(body.r) && p.c === Number(body.c));
    if(!hit) return { error:"out_of_range" };
    room.movePick = { r:hit.r, c:hit.c, d:hit.d };
    return { ok:true };
  }

  case "moveconfirm": {
    if(room.phase !== "move") return { error:"not_now" };
    const uid = moveOrder(e)[S.moveSeat];
    const u = uid && e.unitById(uid);
    if(!u || !u.members.some(m => owns(room, me.id, m))) return { error:"not_your_turn" };
    const mp = room.movePick;
    if(!mp) return { error:"pick_first" };
    const spots = e.reachable(e.posOf(u), S.steps[u.id]);
    if(!spots.some(p => p.r === mp.r && p.c === mp.c)) return { error:"out_of_range" };
    u.pos = { r:mp.r, c:mp.c };
    room.movePick = null;
    if(e.isCardNode(u.pos.r, u.pos.c) && !e.atFinish(u)){
      S.awardFor = u.id;
      S.offers = e.shuffle(Object.keys(e.packs().CARDS)).slice(0, 3);
      room.phase = "award";
      return { ok:true };
    }
    if(e.isWildNode(u.pos.r, u.pos.c) && !e.atFinish(u)){
      S.wild = e.rollWild(u);
      room.phase = "wild";
      return { ok:true };
    }
    advanceMove(room);
    return { ok:true };
  }

  /* the wildcard square: rolled and applied already, this is the phone that
     landed on it saying it has read what happened */
  case "wildok": {
    if(room.phase !== "wild" || !S.wild) return { error:"not_now" };
    const u = e.unitById(S.wild.unitId);
    if(!u || !u.members.some(m => owns(room, me.id, m))) return { error:"not_your_turn" };
    S.wild = null;
    advanceMove(room);
    return { ok:true };
  }

  /* the play order is up on every phone: each one taps in, and the first
     round is dealt only once they all have */
  case "order_ok": {
    if(room.phase !== "order") return { error:"not_now" };
    if(!S.players.some(p => owns(room, me.id, p.id))) return { error:"not_your_turn" };
    if((room.accepted || []).indexOf(me.id) < 0) (room.accepted = room.accepted || []).push(me.id);
    if(S.players.every(p => room.accepted.indexOf(phoneOf(room, p.id)) >= 0)) beginFirstRound(room);
    return { ok:true };
  }

  /* the card square: three offered, one kept */
  case "take": {
    if(room.phase !== "award") return { error:"not_now" };
    const u = e.unitById(S.awardFor);
    if(!u || !u.members.some(m => owns(room, me.id, m))) return { error:"not_your_turn" };
    const key = String(body.key || "");
    if((S.offers || []).indexOf(key) < 0) return { error:"bad_choice" };
    u.cards = u.cards || [];
    u.cards.push(key);
    S.awardFor = null; S.offers = null;
    advanceMove(room);
    return { ok:true };
  }

  /* a card can be thrown in while the clock runs — that is the point of it */
  case "playcard": {
    if(room.phase !== "table") return { error:"not_now" };
    const u = e.unitOf(actingPerson(room, me.id));
    const key = String(body.key || "");
    const at = (u.cards || []).indexOf(key);
    if(at < 0) return { error:"no_such_card" };
    if(key === "swap" && !isGiver) return { error:"not_your_turn" };
    /* Cold deals one word and one only, so there is nothing on that round to
       switch to and the giver would land on a screen with nothing to tap.
       The card says a different word, so this is where the different word is
       dealt — same hat, same worth. Only then is the card spent. */
    if(key === "swap" && R.words.length < 2 && !dealAlternative(e, R))
      return { error:"nothing_to_swap" };

    u.cards.splice(at, 1);
    switch(key){
      case "stopwatch": {
        /* Thirty seconds left — and the round becomes a thirty-second round.
           Pushing the elapsed time forward instead would leave every second
           that remains sitting inside the giver's late-landing band, so the
           card meant to squeeze the table would be paying the giver its top
           rate. Shortening the whole clock keeps all three bands in play. */
        e.pauseClock();
        if(e.remainMs() > 30000) R.total = Math.ceil((e.elapsedMs() + 30000) / 1000);
        e.resumeClock();
        ctx.armClock();
        break;
      }
      case "insight":
        R.insight = true;
        /* The card promises four words and says it is one of them. A Cold
           round dealt exactly one, so four words there would be the answer
           and nothing else — these are the other three, drawn from the same
           banks and settled now, not reshuffled on every poll. */
        R.insightWords = R.words.length >= 4
          ? R.words.map(w => w.text)
          : e.shuffle(R.words.map(w => w.text).concat(decoys(e, R, 4 - R.words.length)));
        break;
      case "veto":      R.veto     = true; break;
      case "mime":      R.mimeCard = true; break;
      case "double":    if(R.doubles.indexOf(u.id) < 0) R.doubles.push(u.id); break;
      case "blindfold": S.forceBlind = true; break;
      case "swap":
        e.pauseClock(); ctx.clearClock();
        S.screen = "swapPick"; room.phase = "swap";
        break;
    }
    return { ok:true, played:key };
  }

  /* switching the word: the clock waits, and anyone already out stays out */
  case "swappick": {
    if(room.phase !== "swap" || !isGiver) return { error:"not_your_turn" };
    const i = Number(body.i);
    if(!(i >= 0 && i < R.words.length)) return { error:"bad_choice" };
    if(i === R.pick) return { error:"bad_choice" };
    R.pick = i; R.swapped = true;
    S.screen = "table"; room.phase = "table";
    e.resumeClock(); ctx.armClock();
    return { ok:true };
  }

  /* the host's rescue: only offered while the room is genuinely stranded */
  case "skip": {
    const stuck = blockedBy(room);
    if(!stuck) return { error:"not_stuck" };
    /* anyone still holding a phone may carry on — except the person the room
       is waiting for, who would otherwise skip their own turn */
    if(awaitedIds(room).indexOf(me.id) >= 0) return { error:"your_turn" };
    if(room.phase === "order"){ beginFirstRound(room); return { ok:true }; }
    if(room.phase === "move"){ advanceMove(room); return { ok:true }; }
    if(room.phase === "award"){ S.awardFor = null; S.offers = null; advanceMove(room); return { ok:true }; }
    if(room.phase === "wild"){ S.wild = null; advanceMove(room); return { ok:true }; }
    e.pauseClock(); ctx.clearClock();
    R.solvedBy = null; R.solveMs = null; R.judging = null;
    /* the round can be abandoned before a word was ever chosen, and the
       scoring needs one to name in the result */
    if(R.pick === null || !R.words[R.pick]) R.pick = 0;
    e.scoreRound();
    S.screen = "reveal"; room.phase = "reveal";
    return { ok:true };
  }

  case "again": {
    if(room.phase !== "over" || room.hostId !== me.id) return { error:"not_your_turn" };
    S.units.forEach(u => { u.score = 0; u.cards = []; u.pos = e.startPos(); });
    S.round = 0; S.giverIdx = 0; S.used = []; S.moveSeat = 0; S.wild = null; room.movePick = null;
    /* a fresh game earns a fresh order and a fresh opening card, and the
       table gets the same reveal it got the first time */
    S.players = e.shuffle(S.players);
    if(S.seating === "groups") orderByUnit(e);
    dealOpeningCard(e);
    room.accepted = [];
    room.phase = "order";
    return { ok:true };
  }

  }
  return { error:"unknown_action" };
}

/* Another word out of the hat Cold drew the first one from — same four tiers,
   same odds, never a word already on the round. Returns false only if the hat
   somehow had nothing left, in which case the card is not spent. */
function dealAlternative(e, R){
  const W = e.packs().W, tiers = [2,3,4,5];
  const spare = [];
  tiers.forEach(v => W[v].forEach(text => {
    if(!R.words.some(w => w.text === text)) spare.push({ text, value:e.wordPoints(v) });
  }));
  if(!spare.length) return false;
  R.words.push(spare[Math.floor(Math.random() * spare.length)]);
  return true;
}

/* words that were never on the round, for an Insight that would otherwise be
   holding up the answer on its own */
function decoys(e, R, howMany){
  const W = e.packs().W, out = [];
  const taken = R.words.map(w => w.text);
  const pool = [2,3,4,5].reduce((a,v) => a.concat(W[v]), []).filter(x => taken.indexOf(x) < 0);
  const bag = e.shuffle(pool);
  while(out.length < howMany && bag.length) out.push(bag.pop());
  return out;
}

/* a move is finished: next mover, or the next round, or the end */
function advanceMove(room){
  const e = room.engine, S = e.S;
  S.moveSeat += 1;
  room.movePick = null;
  if(S.moveSeat >= moveOrder(e).length){
    if(e.isGameOver()){ S.screen = "over"; room.phase = "over"; }
    else { e.newRound(); room.phase = phaseFor(e); }
  } else {
    S.screen = "move"; room.phase = "move";
  }
}

/* the clock ran out with nobody in: end the round where it stands */
function timeUp(room){
  const e = room.engine;
  if(!e || room.phase !== "table") return false;
  if(e.remainMs() > 0) return false;
  e.pauseClock();
  e.S.r.solvedBy = null; e.S.r.solveMs = null;
  e.scoreRound();
  e.S.screen = "reveal"; room.phase = "reveal";
  return true;
}

/* the name of a card in the room's language, for the banner everyone sees */
function cardFace(lang, key){
  const c = uiPack(lang).cards[key] || {};
  return { key, n: c.n || key };
}

module.exports = { startGame, applyAction, viewFor, timeUp, armClock, clearClock,
                   moveOrder, blockedBy, waitingOn, awaitedIds, uiPack, cardFace, IDLE_MS, MIN_PLAYERS,
                   randomMapId, MODE_IDS, MAP_IDS,
                   /* the phone-and-person layer, for the server to keep the roster with */
                   roster, addPerson, personById, peopleOf, phoneOf, owns,
                   MAX_GROUP, MAX_PEOPLE, SEATINGS };
