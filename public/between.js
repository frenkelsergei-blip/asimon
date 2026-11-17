"use strict";

(() => {
  const app = document.getElementById("between");
  const path = location.pathname.replace(/\/$/, "");
  const tv = path.endsWith("/tv");
  const landing = path === "/who" ? "who" : path === "/games" ? "games" : "between";
  const gameNames = { between: "בין לבין", who: "מי אני?" };
  const query = new URLSearchParams(location.search);
  const codeOf = value => String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  let roomCode = codeOf(query.get("room"));
  let screen = roomCode ? "join" : "home";
  let session = { google: false, profile: null, shareOrigin: location.origin };
  let model = null;
  let seat = tv ? null : readSeat();
  let draft = { name: "", face: "", guess: "", tier: null, topic: "" };
  let guest = false;
  let busy = false;
  let error = query.get("auth") === "failed" ? "לא הצלחנו להתחבר עם Google. אפשר לנסות שוב." : "";
  let polling = false;
  let epoch = 0;
  let period = "day";
  let data = null;
  let clockOffset = 0;
  let replayKey = "";
  let version = "";
  const tiers = ["צר", "בינוני", "רחב"];
  const scoreByTier = [3, 2, 1];
  const corner = ["narrow", "medium", "wide"];
  const illustratedTopics = new Set(["israel", "food", "nature", "space", "sports", "culture", "inventions", "room"]);
  const errors = {
    no_room: "החדר לא נמצא. כדאי לבדוק את הקוד.", no_seat: "המקום בחדר פג.",
    room_full: "החדר מלא. אפשר לצפות במשחק במסך המשותף.", already_started: "המשחק כבר התחיל.",
    name_taken: "הכינוי כבר בשימוש בחדר הזה.", already_joined: "החשבון כבר מחובר לחדר הזה.",
    need_2: "צריך לפחות שני שחקנים כדי להתחיל.", host_only: "רק מי שמארח יכול לבצע את הפעולה הזאת.",
    chooser_only: "בחירת הנושא עוברת לפי התור.", wrong_phase: "הסיבוב כבר התקדם.",
    guess_invalid: "מזינים מספר שלם ובוחרים טווח.", profile_invalid: "צריך לבחור כינוי ודמות.",
    mode_invalid: "המשחק הזה אינו זמין.",
    slow_down: "אפשר לנסות לפתוח חדר נוסף בעוד כמה דקות.", sign_in: "כדי לפתוח פרופיל, מתחברים עם Google.",
    network: "החיבור נקטע לרגע. מנסים להתחבר שוב."
  };

  function readSeat() {
    try { return JSON.parse(sessionStorage.getItem("between-seat")); }
    catch { return null; }
  }

  function keepSeat(value) {
    seat = value;
    try {
      if (value) sessionStorage.setItem("between-seat", JSON.stringify(value));
      else sessionStorage.removeItem("between-seat");
    } catch { /* the current tab still has the seat in memory */ }
  }

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const numberHTML = value => `<bdi dir="ltr">${esc(value)}</bdi>`;
  const token = (className = "") => `<img class="token ${className}" src="/between-token.png" alt="" aria-hidden="true">`;
  const photo = (id, size = 60) => faceSvg(id, size);
  const mark = () => `<span class="brand" role="img" aria-label="אסימון"><img src="/between-logo.png" alt=""><img class="light-brand" src="/between-logo-light.png" alt=""></span>`;
  const button = (id, text, extra = "") => `<button type="button" id="${id}" class="button ${extra}">${text}</button>`;
  const notice = () => error ? `<p class="notice" role="alert">${esc(error)}</p>` : "";
  const range = (guess, width) => [Math.max(0, guess - width), Number(guess) + width];
  const prettyRange = interval => interval ? interval.join("–") : "—";
  const inkRays = () => '<img class="ink-rays" src="/between-ink-rays.png" alt="">';
  const tierArt = index => `<img class="card-corner ${corner[index]}" src="/between-corner-${corner[index]}.png" alt="">
    <img class="card-spark" src="/between-card-star.png" alt="">`;
  const celebratingFace = player => `<span class="celebrating-face facetile" data-face="${esc(player.face)}">${photo(player.face, 128)}</span>`;
  const confetti = () => `<span class="confetti" aria-hidden="true">${Array.from({ length: 16 }, (_, i) =>
    `<i style="--x:${10 + i * 5};--dx:${(i % 5 - 2) * 17}px;--dy:${26 + (i * 13 % 105)}px;--i:${i}"></i>`).join("")}</span>`;

  function withHeader(content, { theme = "lilac", header = "blue", footer = "", back = false, layout = "" } = {}) {
    return `<section class="phone ${theme} ${layout}">
      <header class="mast ${header}">${back ? '<button type="button" class="back" id="back" aria-label="חזרה">→</button>' : ""}${mark()}</header>
      <div class="pane">${content}${notice()}${footer ? `<div class="actions">${footer}</div>` : ""}</div>
    </section>`;
  }

  function googleButton() {
    const suffix = roomCode ? `?room=${roomCode}` : "";
    const label = '<img src="/between-google.png" alt="">כניסה עם Google';
    return session.google
      ? `<a class="button light google" href="/api/between/auth/google${suffix}">${label}</a>`
      : button("google-unavailable", label, "light google");
  }

  function homeIntro(title, titleArt, heroArt, tagline) {
    return `<div class="hello">
      <h1 class="title-card"><img src="${titleArt}" alt="${title}"></h1>
      <img class="home-art" src="${heroArt}" alt="">
      <p class="tagline">${tagline}</p>
    </div><div class="home-buttons">${button("create", "פתיחת חדר")}${button("join", "הצטרפות לחדר", "light")}</div>`;
  }

  function home() {
    if (landing === "games") return gamesHome();
    if (landing === "who") return withHeader(`${homeIntro("מי אני?", "/who-title.webp", "/who-home-hero.webp", "דקה לנחש מי אתם.")}
    <nav class="links"><button type="button" id="rules" class="text">איך משחקים?</button><a href="/games">כל המשחקים</a></nav>`,
    { header: "plain-head", layout: "home-screen" });
    const account = session.profile
      ? `<div class="account row">${photo(session.profile.face, 31)}<button type="button" id="profile" class="text">${esc(session.profile.name)} · הפרופיל שלי</button></div>`
      : `<div class="account">${googleButton()}${button("guest", "המשך כאורח", "plain")}</div>`;
    return withHeader(`${homeIntro("בין לבין", "/between-title.png", "/between-hero.png", "מנחשים מספר. בוחרים טווח.")}
    ${account}<nav class="links"><button type="button" id="leaders" class="text">טבלת המובילים</button>
      <button type="button" id="rules" class="text">איך משחקים?</button><a href="/games">כל המשחקים</a></nav>`,
    { header: "plain-head", layout: "home-screen" });
  }

  function gamesHome() {
    const games = [
      ["/between", "בין לבין", "/between-hero.png", "מנחשים מספר. בוחרים טווח."],
      ["/who", "מי אני?", "/who-hero.webp", "מגלים מי האדם שבקלף שלכם."]
    ];
    return withHeader(`<h1 class="title-tag">משחקים לכל המשפחה</h1><nav class="games-list" aria-label="משחקים">
      ${games.map(([href, title, image, caption]) => `<a class="card game-cover" href="${href}">
        <img src="${image}" alt=""><strong>${title}</strong><span>${caption}</span></a>`).join("")}</nav>
      <div class="home-buttons">${button("create", "פתיחת חדר")}${button("join", "הצטרפות בקוד", "light")}</div>`,
      { theme: "lilac", layout: "games-screen" });
  }

  function facePicker(selected) {
    return `<div class="face-picker" role="group" aria-labelledby="face-picker-label">${FACES.map(({ id }) =>
      `<button type="button" class="face-choice facetile${selected === id ? " on" : ""}" data-face="${id}" aria-label="${id}" aria-pressed="${selected === id}">${photo(id, 60)}</button>`
    ).join("")}</div>`;
  }

  function codeInput() {
    return `<label for="room-code">קוד חדר</label><div class="code-entry" dir="ltr">
      <div class="code-slots" aria-hidden="true">${Array.from({ length: 4 }, (_, i) =>
        `<span class="code-slot">${roomCode[i] || ""}</span>`).join("")}</div>
      <input id="room-code" class="code-field" minlength="4" maxlength="4" value="${roomCode}"
        spellcheck="false" autocomplete="off" autocapitalize="characters" required>
    </div>`;
  }

  function joinForm() {
    const create = screen === "create";
    const account = guest || landing !== "between" ? null : session.profile;
    return withHeader(`<form id="seat-form">
      <h1>${create ? "פותחים חדר" : "מצטרפים לחדר"}</h1>
      ${create ? "" : codeInput()}
      <label for="nickname">איך קוראים לכם?</label>
      <input id="nickname" maxlength="18" value="${esc(draft.name)}" placeholder="כינוי אקראי" autocomplete="nickname">
      <p class="field-label" id="face-picker-label">בחרו דמות</p>${facePicker(draft.face)}
      ${account ? `<p class="form-hint">משחקים בתור ${esc(account.name)}</p>` : '<p class="form-hint">אפשר להשאיר את הכינוי והדמות להגרלה.</p>'}
      <button type="submit" class="button" ${busy ? "disabled" : ""}>${create ? "פותחים" : "מצטרפים"}</button>
    </form>${account || landing !== "between" ? "" : `<div class="account">${googleButton()}</div>`}`, { back: true });
  }

  function joinURL(code, mode) { return `${session.shareOrigin}/${mode === "who" ? "who" : "between"}?room=${code}`; }
  function tvURL(code) { return `${session.shareOrigin}/between/tv?room=${code}`; }

  function joinTicket(state) {
    let qr = "";
    try { qr = QR.svg(joinURL(state.code, state.mode), { label: "קוד QR להצטרפות" }); } catch { /* the room code still works */ }
    return `<div class="ticket"><img src="/between-ticket.png" class="ticket-paper" alt="">
      <div class="qr-box">${qr}<small>סריקה להצטרפות</small></div>
      <div class="ticket-code" aria-label="קוד החדר">${numberHTML(state.code)}</div></div>`;
  }

  function roster(state, status = false) {
    return `<div class="roster" data-count="${state.players.length}">${state.players.map((player, i) =>
      `<div class="person card" style="--i:${i}">${photo(player.face)}
        <strong>${esc(player.name)}</strong>${status ? `<span class="status ${player.locked ? "ready" : ""}" role="img" aria-label="${player.locked ? "נעלו" : "חושבים"}"></span>` : ""}
      </div>`).join("")}</div>`;
  }

  function lobby(state) {
    const host = state.players.find(player => player.id === state.host);
    const startLabel = state.mode === "who" ? "מתחילים · דקה לתור הראשון" : "מתחילים";
    return withHeader(`<div class="lobby-title">${inkRays()}<h1 class="title-tag">החדר של ${esc(host?.name)}</h1>${inkRays()}</div>
      ${joinTicket(state)}<p class="pill">${state.players.length === 1 ? "שחקן אחד בחדר" : `${state.players.length} שחקנים בחדר`}</p>${roster(state)}
      ${state.me === state.host ? `<section class="lobby-games"><h2>בוחרים משחק</h2><div>
        ${Object.entries(gameNames).map(([key, label]) => `<button type="button" class="card" data-game-mode="${key}"
          aria-pressed="${state.mode === key}">${label}</button>`).join("")}</div></section>` :
        `<p class="pill">המשחק בחדר · ${gameNames[state.mode]}</p>`}
      <div class="room-links">
        ${button("copy-join", "שיתוף קישור למשחק", "light")}
        <details class="tv-menu"><summary>מסך משותף לטלוויזיה</summary><div class="tv-menu-actions">
          <a class="button" href="/between/tv?room=${state.code}" target="_blank" rel="noopener">פתיחת המסך</a>
          ${button("copy-tv", "העתקת קישור", "light")}
        </div></details>
      </div><p class="share-result" id="share-result" aria-live="polite"></p>`,
      { theme: "yellow", header: "plain-head", layout: "lobby-screen", footer: state.me === state.host
        ? `<button type="button" class="button" id="start" ${state.players.length < 2 ? "disabled" : ""}>${state.players.length < 2 ? "מתחילים כשמצטרף עוד שחקן" : startLabel}</button>${button("leave", "יציאה מהחדר", "plain")}`
        : `<p class="form-hint">מחכים שמארח החדר יתחיל</p>${button("leave", "יציאה מהחדר", "plain")}` });
  }

  function whoRules() {
    return withHeader(`<h1>איך משחקים?</h1><ol class="rule-list">
      <li>בתור שלכם יש לכם דקה לשאול בקול שאלות כן או לא ולנחש את השם בקלף שלכם. שאר השחקנים רואים את השם.</li>
      <li>כשמישהו מנחש נכון, אחד השחקנים האחרים לוחץ על ״ניחשו נכון״. אם השעון כבר נגמר, מסמנים אם הניחוש היה בזמן. אישור בשלב הזה נרשם כפתרון ב־60 שניות.</li>
      <li>בסוף הסיבוב מדרגים לפי זמן הפתרון. בשניים רק הראשון מקבל ניקוד. בשלושה שני הראשונים, ומארבעה שחקנים שלושת הראשונים.</li>
      <li>המקומות שווים 3, 2 ו־1 נקודות. רמז פרטי בתור שלכם מוריד נקודה מהניקוד שקיבלתם. בשוויון בזמן, מי שניחש בלי רמז קודם, ואז סדר התורות קובע.</li>
    </ol>`, { back: true });
  }

  const whoTime = elapsed => `${numberHTML((elapsed / 1000).toFixed(1))} שנ׳`;
  const whoTurnResult = turn => turn.elapsed === null ? "לא ניחשו בזמן" : `ניחוש נכון ב־${whoTime(turn.elapsed)}`;

  function whoWinner(state) {
    const winner = state.placements[0];
    if (!winner) return '<h1 class="title-tag">הסיבוב הסתיים</h1>';
    return `<div class="who-celebration card">${confetti()}
      ${celebratingFace(winner)}<div><p>הזמן המהיר בסיבוב · ${whoTime(winner.elapsed)}</p><h1>${esc(winner.name)}</h1>
      ${winner.identity ? `<strong class="who-identity">${esc(winner.identity)}</strong>` : ""}</div></div>`;
  }

  function whoPlacements(state) {
    const results = state.placements.concat(state.missed);
    if (!results.length) return "";
    return `<section class="who-places"><h2>זמני הסיבוב</h2><ol class="card">${results.map(player =>
      `<li>${photo(player.face, 32)}<span><strong>${player.place ? `${player.place}. ` : ""}${esc(player.name)}</strong>
        <small>${player.elapsed === null ? "לא ניחשו בזמן" : whoTime(player.elapsed)}${player.hinted ? " · רמז" : ""}</small>
      </span><b class="earned">${numberHTML(`+${player.points ?? 0}`)} נק׳</b></li>`).join("")}</ol></section>`;
  }

  function whoTurnHeader(state) {
    return `<div class="who-turn-bar"><span class="pill">סיבוב ${numberHTML(state.round)} · תור ${numberHTML(state.turn.number)} מתוך ${numberHTML(state.turn.total)}</span>
      ${state.phase === "who-active" ? '<span class="pill who-clock" data-clock></span>' : ""}</div>`;
  }

  function whoCard(turn, own) {
    if (!turn.identity) {
      return `<div class="who-card who-own"><img class="who-card-paper" src="/who-card-back.webp" alt="">
        <span class="who-own-label">${own ? "הקלף שלך" : `הקלף של ${esc(turn.name)}`}</span></div>`;
    }
    return `<div class="who-card"><img class="who-card-paper" src="/who-card-front.webp" alt="">
      <div class="who-owner">${photo(turn.face, 88)}<strong>${esc(turn.name)}</strong></div>
      <strong class="who-identity${turn.identity.length > 17 ? " who-identity-long" : ""}">${esc(turn.identity)}</strong></div>`;
  }

  function whoScreen(state) {
    const isHost = state.host === state.me;
    if (state.phase === "who-reveal") return withHeader(`<p class="pill">סיבוב ${numberHTML(state.round)}</p>${whoWinner(state)}
      ${whoPlacements(state)}<section class="score-section"><h2>ניקוד מצטבר</h2>${standings(state)}</section>`,
      { theme: "yellow", header: "plain-head", layout: "who-screen", footer: isHost
        ? `${button("who-next", "מחלקים קלפים חדשים")}${button("who-lobby", "חזרה ללובי", "light")}`
        : `<p class="form-hint">מחכים לחלוקה הבאה</p>${button("leave", "יציאה מהחדר", "plain")}` });
    const { turn } = state;
    const own = turn.id === state.me;
    const result = state.phase === "who-turn-result";
    let title = own ? "התור שלך" : `התור של ${esc(turn.name)}`;
    let guidance = "";
    let controls = "";
    if (result) {
      title = whoTurnResult(turn);
      controls = button("who-continue", turn.hasNext ? "לתור הבא" : "לתוצאות הסיבוב");
    } else if (state.phase === "who-verify") {
      title = "הזמן נגמר";
      if (own) guidance = "מחכים ששאר השחקנים יאשרו אם ניחשת בזמן.";
      else {
        guidance = "האם הניחוש היה נכון בזמן?";
        controls = `${button("who-solved", "כן, ניחשו נכון")}${button("who-missed", "לא ניחשו בזמן", "light")}`;
      }
    } else if (state.phase === "who-ready") {
      if (own) controls = button("who-start", "מפעילים את השעון · 60 שניות");
      else guidance = "מחכים לתחילת התור";
    } else if (own) {
      guidance = "שואלים שאלות כן או לא ומנחשים בקול.";
      controls = state.hint ? `<div class="who-hint card"><strong>הרמז שלך · נקודה פחות</strong><p>${esc(state.hint)}</p></div>`
        : button("who-hint", "רמז אישי · נקודה פחות", "light");
    } else {
      guidance = "עונים בקול רק כן או לא.";
      controls = button("who-solved", "ניחשו נכון");
    }
    return withHeader(`${whoTurnHeader(state)}<h1 class="title-tag">${title}</h1>${whoCard(turn, own)}
      ${guidance ? `<p class="who-instruction">${guidance}</p>` : ""}`, {
      header: "plain-head", layout: "who-screen who-turn",
      footer: `${controls}${button("leave", "יציאה מהחדר", "plain")}`
    });
  }

  function roundHeader(state, topic, clock = true) {
    return `<div class="round-strip"><span>שאלה ${state.round} מתוך ${state.roundCount}</span>${topic ? `<span>${esc(topic)}</span>` : ""}
      ${clock && state.deadline ? '<span class="clock" data-clock dir="ltr"></span>' : ""}</div>`;
  }

  function liveStandings(state) {
    return `<div class="live-standings"><button type="button" id="game-standings-toggle" aria-expanded="false"
      aria-controls="game-standings-panel">טבלת המשחק</button>
      <div id="game-standings-panel" hidden>${standings(state)}</div></div>`;
  }

  function category(state) {
    const chooser = state.players.find(player => player.id === state.chooser);
    const choosing = state.me === state.chooser && !!state.me;
    return withHeader(`${roundHeader(state)}${liveStandings(state)}${choosing ? `<div class="topic-heading">${photo(chooser?.face || "fox", 62)}<h1>התור שלך לבחור נושא</h1></div>
      <div class="category-cards">${state.choices.map((choice, i) => `<button type="button" class="card topic"
        style="--i:${i}" data-topic="${esc(choice.key)}" aria-pressed="${draft.topic === choice.key}">${token("pick-token")}
        <span class="topic-art"><img src="/between-topic-${illustratedTopics.has(choice.key) ? choice.key : "room"}.webp" alt=""></span>
        <span class="topic-label">${esc(choice.name)}</span></button>`).join("")}</div>`
      : `<h1>בחירת נושא · ${esc(chooser?.name || "המארח")}</h1><div class="waiting-card">
        <img class="waiting-paper" src="/between-card-stack.png" alt="">
        <div class="waiting-avatar">${photo(chooser?.face || "fox", 128)}</div><strong>השאלה<br>תופיע כאן</strong></div>`}`,
    { theme: choosing ? "yellow" : "lilac", header: choosing ? "blue" : "plain-head",
      layout: choosing ? "category-screen choosing" : "category-screen waiting", footer: choosing
        ? `<button type="button" class="button" id="pick-topic" ${draft.topic ? "" : "disabled"}>בוחרים</button>` : "" });
  }

  function rangeScale(interval, limits, correct) {
    const [min, max] = limits;
    const percent = value => ((value - min) / Math.max(1, max - min) * 100).toFixed(2);
    const hitMark = correct === undefined ? "" : `<i class="answer-marker" style="--at:${percent(correct)}%"></i>`;
    return `<div class="range-scale" dir="ltr" aria-hidden="true">
      <div class="scale-track">${hitMark}<i class="scale-fill" style="--from:${percent(interval[0])}%;--to:${percent(interval[1])}%"></i>
        <i class="scale-end" style="--at:${percent(interval[0])}%"></i><i class="scale-end" style="--at:${percent(interval[1])}%"></i>
      </div><span>${min}</span><span>${max}</span></div>`;
  }

  function selectedScale(guess, tier, widths) {
    if (guess === null || tier === null || guess > 1_000_000_000) return "";
    const interval = range(guess, widths[tier]);
    const padding = Math.max(1, Math.ceil(widths[2] / 3));
    const limits = [Math.max(0, guess - widths[2] - padding), guess + widths[2] + padding];
    return `<div class="selected-scale card"><span>הטווח שלך</span><strong>${numberHTML(prettyRange(interval))}</strong>
      ${rangeScale(interval, limits)}</div>`;
  }

  function guessScreen(state) {
    const question = state.question;
    const entry = state.entry;
    const canTighten = state.phase === "tighten" && entry && entry.tier > 0 && !entry.adjusted;
    const attempt = draft.guess === "" ? null : Number(draft.guess);
    const editing = state.phase === "guess" && !entry;
    let content;
    if (editing) {
      content = `<div class="guess-control card">${inkRays()}<label for="guess-number" class="guess-label">הניחוש שלך</label>
        <button type="button" class="step" id="minus" aria-label="הפחתת אחד מהניחוש">−</button>
        <input id="guess-number" type="text" pattern="[0-9]*" inputmode="numeric" autocomplete="off" value="${esc(draft.guess)}" style="--guess-length:${draft.guess.length || 2}" placeholder="הקלידו מספר" maxlength="10" aria-describedby="guess-unit">
        <button type="button" class="step" id="plus" aria-label="הוספת אחד לניחוש">+</button>
        <small id="guess-unit">${esc(question.unit)}</small></div>
        <div class="ranges" aria-label="בחירת רוחב הטווח">${tiers.map((tier, i) =>
          `<button type="button" class="card range-card" style="--i:${i}" data-tier="${i}" aria-pressed="${draft.tier === i}">
          ${tierArt(i)}${token("pick-token")}<strong>${tier}</strong><bdi dir="ltr" class="range-value" ${attempt === null ? "hidden" : ""}>${attempt === null ? "" : prettyRange(range(attempt, question.widths[i]))}</bdi>
          <small>${scoreByTier[i]} נק׳</small></button>`).join("")}</div>
        <div id="selected-scale">${selectedScale(attempt, draft.tier, question.widths)}</div>`;
    } else if (entry) {
      content = `<div class="locked-stack" role="status"><div class="lock-heading">${inkRays()}<strong>הטווח ננעל</strong>${inkRays()}</div>
        <div class="card locked tier-${entry.tier}">${tierArt(entry.tier)}<span>${tiers[entry.tier]}</span>
          <strong>${numberHTML(prettyRange(range(entry.number, question.widths[entry.tier])))}</strong></div></div>`;
    } else {
      content = '<p class="status-line">הזמן לניחוש הסתיים</p>';
    }
    if (state.phase === "tighten") content = `<p class="hint card"><strong>רמז</strong> ${esc(state.hint)}</p>${content}`;
    if (!editing) content += `${roster(state, true)}<p class="status-line">${canTighten ? "אפשר לצמצם את הטווח בדרגה אחת" : "מחכים לכולם"}</p>`;
    return withHeader(`${roundHeader(state, question.topic)}${liveStandings(state)}<h1 class="question">${esc(question.prompt)}</h1>${content}`, {
      header: "blue", layout: "guess-screen",
      footer: editing ? `<button type="button" id="lock" class="button" ${attempt === null || draft.tier === null ? "disabled" : ""}>נעלתי</button>`
        : canTighten ? `${button("tighten", `מצמצמים ל־${numberHTML(prettyRange(range(entry.number, question.widths[entry.tier - 1])))}`)}${button("keep", "נשארים עם הטווח", "light")}` : ""
    });
  }

  function answerCard(state, onStage = false) {
    return `<div class="answer-wrap" style="--digits:${String(state.answer).length}">${onStage ? '<img class="reveal-rays" src="/between-rays.png" alt="">' : inkRays()}
      ${token("drop-token")}<div class="answer card">
      <strong>${numberHTML(state.answer)}</strong><span>${esc(state.question.unit)}</span>
    </div></div>`;
  }

  function roundWinner(state) {
    const leaders = state.players.filter(player => state.roundWinners?.includes(player.id));
    if (!leaders.length) return '<p class="round-winner nobody">אף אחד לא פגע בסיבוב</p>';
    const label = leaders.length === 1 ? "ניצחון בסיבוב" : "ניצחון משותף בסיבוב";
    return `<div class="round-winner">${confetti()}<div class="winner-faces">${leaders.slice(0, 3).map(celebratingFace).join("")}</div>
      <div><small>${label}</small><strong>${esc(leaders.map(player => player.name).join(" · "))}</strong></div></div>`;
  }

  function resultRows(state, big = false) {
    const rows = big ? state.results : [...state.results].sort((a, b) => b.total - a.total);
    return `<div class="result-grid ${big ? "stage-results" : "round-results card"}" data-count="${state.players.length}">${rows.flatMap((row, i) => {
      const player = state.players.find(candidate => candidate.id === row.id);
      if (!player) return [];
      const wins = state.roundWinners?.includes(player.id);
      const tally = [`${row.points} טווח`, row.exactBonus && "1 בול", row.bonus && "1 בחירת נושא"].filter(Boolean).join(" · ");
      const shownRange = `<span class="result-range">${numberHTML(prettyRange(row.range))}</span>`;
      const pick = row.number == null ? "" : `<small class="result-guess">ניחוש ${numberHTML(row.number)} · ${tiers[row.tier]}</small>`;
      return [`<div class="${big ? "card " : ""}result ${row.points ? "hit" : "miss"} ${wins ? "leader" : ""} points-${row.points}" style="--i:${i}">
        <div class="result-avatar">${wins && big ? celebratingFace(player) : photo(player.face, big ? 118 : 54)}</div>
        <div class="result-copy"><strong>${esc(player.name)}</strong>
          ${big ? "" : `<span class="hit-label">${row.exactBonus ? "בול" : row.points ? "פגיעה" : row.range ? "פספוס" : "לא ננעל"}</span>`}
          ${big ? shownRange : `<div class="result-pick">${shownRange}${pick}</div>`}
          <span class="earned">${numberHTML(`+${row.total}`)}</span>
          ${row.exactBonus || row.bonus ? `<small class="bonus-note">${tally}</small>` : ""}
        </div>
      </div>`];
    }).join("")}</div>`;
  }

  function reveal(state) {
    return withHeader(`${roundHeader(state, null, false)}${answerCard(state)}${roundWinner(state)}
      ${state.note ? `<p class="fact">${esc(state.note)}</p>` : ""}${resultRows(state)}
      <details class="scoring-help"><summary>איך נקבע המנצח?</summary>
        <p>טווח שכולל את התשובה שווה 3 נק׳ בצר, 2 בבינוני ו־1 ברחב. ניחוש בול מוסיף נקודה.</p>
        <p>מי שבחר את הנושא מקבל נקודה אם היה בין המובילים לפני הבונוס. הניקוד הגבוה מנצח. בשוויון חיובי יש ניצחון משותף, גם אם אחד היה קרוב יותר.</p>
      </details>
      <section class="score-section"><h2>טבלה מצטברת</h2>${standings(state)}</section>`,
    { theme: "yellow", header: "plain-head", layout: "reveal-screen", footer: state.me === state.host
      ? button("next", state.round === state.roundCount ? "לסיכום המשחק" : "לסיבוב הבא") : "" });
  }

  function standings(state) {
    const sorted = [...state.players].sort((a, b) => b.score - a.score);
    return `<ol class="standings card">${sorted.map(player => `<li><span class="place">${sorted.findIndex(item => item.score === player.score) + 1}</span>
      ${photo(player.face, 38)}<strong>${esc(player.name)}</strong><b class="earned">${numberHTML(player.score)} נק׳</b></li>`).join("")}</ol>`;
  }

  function endTitle(state) {
    const names = state.players.filter(player => state.winners.includes(player.id)).map(player => player.name);
    if (!names.length) return "סיימנו את המשחק";
    return names.length === 1 ? `הניצחון של ${esc(names[0])}!` : `ניצחון משותף · ${esc(names.join(" + "))}`;
  }

  function podium(state) {
    const winners = state.players.filter(player => state.winners.includes(player.id));
    const single = winners.length === 1;
    return withHeader(`<div class="podium-title">${inkRays()}<h1 class="title-tag">${endTitle(state)}</h1>${inkRays()}</div>
      ${winners.length ? `<div class="winner-card ${single ? "single" : "shared card"}">
        ${winners.slice(0, 5).map(celebratingFace).join("")}${token("drop-token")}${confetti()}
        <strong>${single ? esc(winners[0].name) : `${winners[0].score} נק׳`}</strong></div>` : ""}
      <section class="score-section"><h2>טבלת סיום</h2>${standings(state)}</section>`,
      { theme: "lilac", header: "plain-head", layout: "podium-screen", footer: `${state.me === state.host ? button("again", "משחק נוסף") : ""}
        ${session.profile ? button("profile", "הפרופיל שלי", "light") : ""}${button("leave", "יציאה מהחדר", "plain")}` });
  }

  function rules() {
    return withHeader(`<h1>איך משחקים?</h1><ol class="rule-list">
      <li>בכל סיבוב שחקן אחר בוחר נושא מתוך שלושה קלפים.</li>
      <li>מקלידים ניחוש ובוחרים כמה מרווח להשאיר סביבו. שני הקצוות כלולים בטווח.</li>
      <li>כשפוגעים, טווח צר שווה 3 נקודות, בינוני 2 ורחב 1. פספוס שווה אפס.</li>
      <li>ניחוש בול במספר הנכון מזכה בעוד נקודה.</li>
      <li>מי שבחר נושא מקבל עוד נקודה אם קיבל את הניקוד הגבוה בסיבוב לפני בונוס הנושא, גם בשוויון.</li>
      <li>אחרי עשר שאלות, הניקוד המצטבר הגבוה ביותר מנצח.</li></ol>`, { back: true });
  }

  function profile() {
    if (!data) return withHeader('<h1>הפרופיל שלי</h1><p>רק רגע…</p>', { back: true });
    const { profile: user, stats } = data;
    const winRate = stats.played ? Math.round(stats.wins / stats.played * 100) : 0;
    return withHeader(`<h1>הפרופיל שלי</h1><div class="profile-name">${photo(user.face, 100)}<strong>${esc(user.name)}</strong></div>
      ${button("edit-profile", "עריכת פרופיל", "light")}
      <dl class="stats card"><div><dt>משחקים</dt><dd>${stats.played}</dd></div><div><dt>ניצחונות</dt><dd>${stats.wins}</dd></div>
      <div><dt>אחוז ניצחון</dt><dd>${numberHTML(`${winRate}%`)}</dd></div></dl>
      <h2>משחקים אחרונים</h2>${stats.recent.length ? `<ul class="history card">${stats.recent.map(row =>
        `<li><span>${row.won ? "ניצחון" : "משחק הושלם"} <small>${numberHTML(row.day)}</small></span><b>${row.score} נק׳</b></li>`).join("")}</ul>`
        : '<p class="empty">המשחק הראשון שיושלם יופיע כאן.</p>'}`,
      { back: true, footer: button("logout", "התנתקות", "plain") });
  }

  function editProfile() {
    return withHeader(`<h1>עריכת פרופיל</h1><form id="profile-form">
      <label for="nickname">כינוי</label><input id="nickname" maxlength="18" value="${esc(draft.name)}" required>
      <p class="field-label">דמות</p>${facePicker(draft.face)}
      <button class="button" type="submit">שמירה</button></form>`, { back: true });
  }

  function leaders() {
    return withHeader(`<h1>טבלת המובילים</h1><div class="tabs card" aria-label="תקופת דירוג">
      <button type="button" data-period="day" aria-pressed="${period === "day"}">היום</button>
      <button type="button" data-period="week" aria-pressed="${period === "week"}">השבוע</button></div>
      ${data ? data.leaders.length ? `<ol class="standings card">${data.leaders.map((row, i) => `<li><b class="rank">${i + 1}</b>
        ${photo(row.face, 43)}<strong>${esc(row.name)}</strong><span class="earned">${row.wins} ניצ׳</span></li>`).join("")}</ol>`
        : '<p class="empty">הניצחונות הראשונים יופיעו כאן.</p>' : '<p>טוענים את הטבלה…</p>'}`,
      { back: true, theme: "yellow" });
  }

  function stage(state) {
    let content;
    const title = gameNames[state?.mode] || gameNames.between;
    if (!state || state.phase === "lobby") {
      content = `<div class="stage-lobby"><h1>${title}</h1>${state ? `${joinTicket(state)}${roster(state)}`
        : `<form id="tv-form">${codeInput()}<button class="button" type="submit">צפייה במשחק</button></form>`}</div>`;
    } else if (state.mode === "who") {
      if (state.phase === "who-reveal") {
        content = `<p class="pill">סיבוב ${numberHTML(state.round)}</p>${whoWinner(state)}${whoPlacements(state)}${standings(state)}`;
      } else {
        const { turn } = state;
        const status = {
          "who-ready": "מחכים לתחילת התור",
          "who-active": "שואלים שאלות כן או לא",
          "who-verify": "הזמן נגמר · מחכים לאישור השחקנים"
        }[state.phase] ?? whoTurnResult(turn);
        content = `${whoTurnHeader(state)}<div class="stage-question">${photo(turn.face, 120)}
          <h1>התור של ${esc(turn.name)}</h1><p>${status}</p></div>`;
      }
    } else if (state.phase === "reveal") {
      content = `${roundHeader(state, null, false)}${answerCard(state, true)}${resultRows(state, true)}`;
    } else if (state.phase === "over") {
      content = `<h1 class="stage-title">${endTitle(state)}</h1>${standings(state)}`;
    } else if (state.phase === "topic") {
      const chooser = state.players.find(player => player.id === state.chooser);
      content = `${roundHeader(state)}<div class="stage-question"><h1>בחירת נושא · ${esc(chooser?.name)}</h1>
        <div class="stage-topics">${state.choices.map(choice => `<span class="card">${esc(choice.name)}</span>`).join("")}</div></div>${roster(state)}`;
    } else {
      content = `${roundHeader(state, state.question.topic)}<div class="stage-question"><h1>${esc(state.question.prompt)}</h1>
        ${state.hint ? `<p class="hint card">${esc(state.hint)}</p>` : ""}</div>${roster(state, true)}`;
    }
    return `<section class="stage phase-${state?.phase || "lobby"}"><header>${mark()}<span>${title}</span></header>
      ${content}${notice()}</section>`;
  }

  function render({ replay = false, resetScroll = false } = {}) {
    const focus = document.activeElement?.id;
    const openMenus = Array.from(app.querySelectorAll("details[open]"), menu => menu.className);
    const standingsOpen = !resetScroll && document.getElementById("game-standings-toggle")?.getAttribute("aria-expanded") === "true";
    let markup;
    if (tv) markup = stage(model);
    else if (screen === "home") markup = home();
    else if (screen === "rules") markup = landing === "who" ? whoRules() : rules();
    else if (screen === "create" || screen === "join") markup = joinForm();
    else if (screen === "profile") markup = profile();
    else if (screen === "edit") markup = editProfile();
    else if (screen === "leaders") markup = leaders();
    else if (!model) markup = withHeader('<p>נכנסים לחדר…</p>');
    else if (model.phase === "lobby") markup = lobby(model);
    else if (model.mode === "who") markup = whoScreen(model);
    else if (model.phase === "topic") markup = category(model);
    else if (model.phase === "guess" || model.phase === "tighten") markup = guessScreen(model);
    else if (model.phase === "reveal") markup = reveal(model);
    else markup = podium(model);
    app.classList.toggle("animated", replay);
    app.innerHTML = markup;
    if (!resetScroll) {
      for (const menu of app.querySelectorAll("details")) menu.open = openMenus.includes(menu.className);
    }
    if (standingsOpen) toggleGameStandings();
    if (replay) {
      for (const face of app.querySelectorAll(".celebrating-face")) {
        setTimeout(() => { if (face.isConnected) face.classList.add("on"); }, 390);
      }
    }
    if (focus === "guess-number" || focus === "nickname" || focus === "room-code") {
      const input = document.getElementById(focus);
      input?.focus({ preventScroll: true });
      input?.setSelectionRange(input.value.length, input.value.length);
    }
    if (!resetScroll && focus === "game-standings-toggle") document.getElementById(focus)?.focus({ preventScroll: true });
    if (resetScroll) window.scrollTo(0, 0);
    updateClock();
  }

  function toggleGameStandings() {
    const button = document.getElementById("game-standings-toggle");
    const panel = document.getElementById("game-standings-panel");
    if (!button || !panel) return;
    panel.hidden = !panel.hidden;
    button.setAttribute("aria-expanded", String(!panel.hidden));
  }

  function updateClock() {
    const clock = app.querySelector("[data-clock]");
    if (clock && model?.deadline) {
      const left = Math.max(0, Math.ceil((model.deadline - Date.now() - clockOffset) / 1000));
      clock.textContent = model.mode === "who" ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : left;
      clock.classList.toggle("urgent", left <= 5);
    }
  }

  async function api(path, value, secret) {
    let response;
    try {
      response = await fetch(`/api/between${path}`, {
        method: value === undefined ? "GET" : "POST",
        headers: { ...(value === undefined ? {} : { "content-type": "application/json" }), ...(secret ? { authorization: `Bearer ${secret}` } : {}) },
        body: value === undefined ? undefined : JSON.stringify(value),
        signal: AbortSignal.timeout(9000)
      });
    } catch { throw new Error("network"); }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "server_error");
    return result;
  }

  function accept(state) {
    const before = model;
    model = state;
    clockOffset = (state.now || Date.now()) - Date.now();
    const rosterKey = state.phase === "lobby" ? state.players.map(player => player.id).join(",") : "";
    const key = `${state.phase}:${state.round}:${state.turn?.number ?? ""}:${!!state.entry}:${state.entry?.tier ?? ""}:${rosterKey}`;
    if (before?.round !== state.round || before?.phase === "lobby") {
      Object.assign(draft, { guess: "", tier: null, topic: "" });
    }
    if (screen !== "room" && !tv) return;
    const serialized = JSON.stringify({ ...state, now: 0 });
    const justWaiting = before?.phase === "guess" && state.phase === "guess" && before.round === state.round && !state.entry && !tv;
    if (serialized !== version && (!justWaiting || error)) {
      const replay = key !== replayKey;
      if (replay && before) {
        if (state.phase === "lobby" && state.players.length > before.players.length) window.SFX?.play("join");
        if (state.phase === "topic") window.SFX?.play(before.phase === "lobby" ? "start" : "deal");
        if (state.phase === "guess") window.SFX?.play(state.entry ? "aim" : "go");
        if (state.phase === "reveal") {
          window.SFX?.play("land");
          const sound = state.roundWinners?.length ? "correct" : "nobody";
          setTimeout(() => { if (model?.phase === "reveal" && model.round === state.round) window.SFX?.play(sound); }, 450);
        }
        if (state.phase === "over") window.SFX?.play("win");
        if (state.phase === "who-active") window.SFX?.play("deal");
        if (state.phase === "who-turn-result") window.SFX?.play(state.turn.elapsed === null ? "nobody" : "correct");
        if (state.phase === "who-reveal" && state.placements.length) window.SFX?.play("win");
      }
      const resetScroll = !tv && (before?.phase !== state.phase || before?.round !== state.round ||
        before?.turn?.number !== state.turn?.number || (!before?.entry && !!state.entry));
      render({ replay, resetScroll });
      replayKey = key;
    }
    version = serialized;
    updateClock();
  }

  async function poll() {
    if (!roomCode || (!tv && !seat) || polling) return;
    polling = true;
    const current = epoch;
    try {
      const result = await api(`/rooms/${roomCode}`, undefined, seat?.token);
      if (current !== epoch) return;
      if (error === errors.network) { error = ""; version = ""; }
      accept(result);
    } catch (problem) {
      if (current !== epoch) return;
      if (!tv && ["no_room", "no_seat"].includes(problem.message)) {
        keepSeat(null);
        model = null;
        screen = "join";
      }
      const nextError = errors[problem.message] || "הייתה תקלה. אפשר לנסות שוב.";
      if (error !== nextError) {
        error = nextError;
        render();
      }
    } finally { polling = false; }
  }

  async function action(type, fields = {}) {
    if (busy || !seat) return;
    busy = true;
    error = "";
    epoch++;
    try {
      const result = await api(`/rooms/${roomCode}/action`, { type, ...fields }, seat.token);
      if (type === "leave") {
        keepSeat(null); model = null; roomCode = ""; screen = "home"; version = ""; render({ resetScroll: true });
      } else {
        version = "";
        accept(result);
      }
    } catch (problem) {
      error = errors[problem.message] || "הפעולה לא הצליחה. נסו שוב.";
      render();
    } finally { busy = false; }
  }

  function visit(target) {
    screen = target;
    error = "";
    if (target === "create" || target === "join") {
      const profile = guest || landing !== "between" ? null : session.profile;
      draft.name = profile?.name || "";
      draft.face = profile?.face || "";
    }
    render({ replay: true, resetScroll: true });
  }

  async function openData(target) {
    data = null;
    visit(target);
    const request = target === "leaders" ? `/leaders?period=${period}` : "/profile";
    try {
      const result = await api(request);
      if (screen === target && (target !== "leaders" || result.period === period)) { data = result; render(); }
    } catch (problem) {
      if (screen === target) { error = errors[problem.message] || "הטעינה לא הצליחה."; render(); }
    }
  }

  function markChoice(attribute, value) {
    app.querySelectorAll(`button[data-${attribute}]`).forEach(button => {
      const selected = button.dataset[attribute] === String(value);
      button.setAttribute("aria-pressed", selected);
      if (attribute === "face") {
        if (selected && button.classList.contains("on")) {
          button.classList.remove("on");
          void button.offsetWidth;
        }
        button.classList.toggle("on", selected);
      }
    });
  }

  function refreshGuess() {
    document.getElementById("guess-number").style.setProperty("--guess-length", draft.guess.length || 2);
    app.querySelectorAll("[data-tier]").forEach(button => {
      const width = model.question.widths[Number(button.dataset.tier)];
      const value = button.querySelector(".range-value");
      value.hidden = draft.guess === "";
      value.textContent = value.hidden ? "" : prettyRange(range(Number(draft.guess), width));
    });
    document.getElementById("lock").disabled = draft.guess === "" || draft.tier === null || Number(draft.guess) > 1_000_000_000;
    document.getElementById("selected-scale").innerHTML = selectedScale(
      draft.guess === "" ? null : Number(draft.guess), draft.tier, model.question.widths);
  }

  async function copy(text) {
    const status = document.getElementById("share-result");
    if (!status) return;
    try { await navigator.clipboard.writeText(text); status.textContent = "הקישור הועתק"; }
    catch { status.textContent = text; }
  }

  app.addEventListener("click", async event => {
    const google = event.target.closest("a.google");
    if (google && roomCode.length === 4) google.href = `/api/between/auth/google?room=${roomCode}`;
    const button = event.target.closest("button");
    if (!button) return;
    const id = button.id;
    if (button.dataset.face) {
      draft.face = button.dataset.face; markChoice("face", draft.face);
    } else if (button.dataset.gameMode) {
      await action("mode", { mode: button.dataset.gameMode });
    } else if (button.dataset.topic) {
      draft.topic = button.dataset.topic; markChoice("topic", draft.topic);
      document.getElementById("pick-topic").disabled = false;
    } else if (button.dataset.tier !== undefined) {
      draft.tier = Number(button.dataset.tier); markChoice("tier", draft.tier); refreshGuess();
    } else if (button.dataset.period) {
      period = button.dataset.period; await openData("leaders");
    } else if (id === "game-standings-toggle") {
      toggleGameStandings();
    } else if (id === "guest") {
      guest = true; visit(roomCode ? "join" : "create");
    } else if (["join", "create", "rules"].includes(id)) {
      guest = false; visit(id);
    } else if (id === "google-unavailable") {
      error = "כניסה עם Google עדיין אינה מוגדרת בשרת הזה."; render();
    } else if (id === "back") {
      if (screen === "edit") await openData("profile");
      else { visit(seat ? "room" : "home"); }
    } else if (id === "leaders" || id === "profile") {
      await openData(id);
    } else if (id === "edit-profile") {
      draft.name = data.profile.name; draft.face = data.profile.face; visit("edit");
    } else if (id === "logout") {
      try { await api("/auth/logout", {}); session.profile = null; visit(seat ? "room" : "home"); }
      catch { error = "ההתנתקות לא הצליחה."; render(); }
    } else if (id === "copy-join" || id === "copy-tv") {
      await copy(id === "copy-join" ? joinURL(roomCode, model.mode) : tvURL(roomCode));
    } else if (id === "plus" || id === "minus") {
      const delta = id === "plus" ? 1 : -1;
      draft.guess = String(Math.min(1_000_000_000, Math.max(0, Number(draft.guess) + delta)));
      document.getElementById("guess-number").value = draft.guess;
      refreshGuess();
    } else if (id === "pick-topic") {
      await action("topic", { topic: draft.topic });
    } else if (id === "lock") {
      await action("guess", { number: Number(draft.guess), tier: draft.tier });
    } else if (id === "tighten" || id === "keep") {
      await action("tighten", { shrink: id === "tighten" });
    } else if (["who-start", "who-hint", "who-solved", "who-missed", "who-continue"].includes(id)) {
      await action(id, { round: model.round, turn: model.turn.number });
    } else if (id === "who-next" || id === "who-lobby") {
      await action(id, { round: model.round });
    } else if (["start", "next", "again", "leave"].includes(id)) {
      await action(id);
    }
  });

  app.addEventListener("input", event => {
    if (event.target.id === "room-code") {
      roomCode = codeOf(event.target.value); event.target.value = roomCode;
      app.querySelectorAll(".code-slot").forEach((slot, i) => {
        const value = roomCode[i] || "";
        if (slot.textContent === value) return;
        slot.classList.remove("stamped");
        slot.textContent = value;
        if (value) { void slot.offsetWidth; slot.classList.add("stamped"); }
      });
    } else if (event.target.id === "nickname") {
      draft.name = event.target.value;
    } else if (event.target.id === "guess-number") {
      draft.guess = event.target.value.replace(/\D/g, "").slice(0, 10);
      event.target.value = draft.guess; refreshGuess();
    }
  });

  app.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy) return;
    if (event.target.id === "tv-form") {
      if (roomCode.length === 4) {
        history.replaceState(null, "", `/between/tv?room=${roomCode}`);
        error = ""; await poll();
      }
      return;
    }
    busy = true;
    error = "";
    const submittingPage = screen;
    try {
      if (event.target.id === "profile-form") {
        const result = await api("/profile", { name: draft.name, face: draft.face });
        session.profile = result.profile;
        data = result; visit("profile");
      } else if (event.target.id === "seat-form") {
        const acquired = await api(submittingPage === "create" ? "/create" : "/join", {
          code: roomCode, name: draft.name, face: draft.face,
          guest: guest || landing !== "between", mode: landing === "who" ? "who" : "between"
        });
        keepSeat(acquired); roomCode = acquired.code; screen = "room";
        history.replaceState(null, "", path);
        render(); await poll();
      }
    } catch (problem) {
      error = errors[problem.message] || "הפעולה לא הצליחה. נסו שוב.";
      busy = false; render();
    } finally { busy = false; }
  });

  if (seat && (!roomCode || roomCode === seat.code)) { roomCode = seat.code; screen = "room"; }
  else if (seat) keepSeat(null);
  if (!tv && landing !== "between") document.title = landing === "who" ? "אסימון · מי אני?" : "אסימון · כל המשחקים";
  if (tv) document.body.classList.add("theatre");
  render({ replay: true });
  api("/session").then(result => {
    session = { ...session, ...result };
    if (!guest && landing === "between" && result.profile && (screen === "join" || screen === "create")) {
      draft.name ||= result.profile.name; draft.face ||= result.profile.face;
    }
    render();
  }).catch(() => {});
  poll();
  setInterval(poll, 950);
  setInterval(updateClock, 200);
})();
