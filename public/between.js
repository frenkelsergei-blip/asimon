"use strict";

(() => {
  const app = document.getElementById("between");
  const tv = location.pathname.replace(/\/$/, "").endsWith("/tv");
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
  const faces = ["fox", "astro", "grandpa", "grandma", "boy", "girl", "hippy", "beard", "curly", "beanie", "robot", "cat", "owl", "frog", "panda"];
  const tiers = ["צר", "בינוני", "רחב"];
  const scoreByTier = [3, 2, 1];
  const errors = {
    no_room: "החדר לא נמצא. כדאי לבדוק את הקוד.", no_seat: "המקום בחדר פג.",
    room_full: "החדר מלא. אפשר לצפות במשחק במסך המשותף.", already_started: "המשחק כבר התחיל.",
    name_taken: "הכינוי כבר בשימוש בחדר הזה.", already_joined: "החשבון כבר מחובר לחדר הזה.",
    need_2: "צריך לפחות שני שחקנים כדי להתחיל.", host_only: "רק מי שמארח יכול לבצע את הפעולה הזאת.",
    chooser_only: "בחירת הנושא עוברת לפי התור.", wrong_phase: "הסיבוב כבר התקדם.",
    guess_invalid: "מזינים מספר שלם ובוחרים טווח.", profile_invalid: "צריך לבחור כינוי ודמות.",
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

  function home() {
    const account = session.profile
      ? `<div class="account row">${photo(session.profile.face, 31)}<button type="button" id="profile" class="text">${esc(session.profile.name)} · הפרופיל שלי</button></div>`
      : `<div class="account">${googleButton()}${button("guest", "המשך כאורח", "plain")}</div>`;
    return withHeader(`<div class="hello">
      <h1 class="title-card"><img src="/between-title.png" alt="בין לבין"></h1>
      <img class="home-art" src="/between-hero.png" alt="">
      <p class="tagline">מנחשים מספר. בוחרים טווח.</p>
    </div><div class="home-buttons">${button("create", "פתיחת חדר")}${button("join", "הצטרפות לחדר", "light")}</div>
    ${account}<nav class="links"><button type="button" id="leaders" class="text">טבלת המובילים</button>
      <button type="button" id="rules" class="text">איך משחקים?</button><a href="/">אסימון הקלאסי</a></nav>`,
    { header: "plain-head", layout: "home-screen" });
  }

  function facePicker(selected) {
    return `<div class="face-picker" aria-label="בחירת דמות">${faces.map(face =>
      `<button type="button" class="face-choice" data-face="${face}" aria-label="${face}" aria-pressed="${selected === face}">${photo(face, 37)}</button>`
    ).join("")}</div>`;
  }

  function joinForm() {
    const create = screen === "create";
    const account = guest ? null : session.profile;
    return withHeader(`<form id="seat-form">
      <h1>${create ? "פותחים חדר" : "מצטרפים לחדר"}</h1>
      ${create ? "" : `<label for="room-code">קוד חדר</label><input id="room-code" class="code-field" maxlength="4"
        value="${roomCode}" placeholder="ABCD" spellcheck="false" autocomplete="off" autocapitalize="characters" required>`}
      <label for="nickname">איך קוראים לכם?</label>
      <input id="nickname" maxlength="18" value="${esc(draft.name)}" placeholder="כינוי אקראי" autocomplete="nickname">
      <p class="field-label">בחרו דמות</p>${facePicker(draft.face)}
      ${account ? `<p class="form-hint">משחקים בתור ${esc(account.name)}</p>` : '<p class="form-hint">אפשר להשאיר את הכינוי והדמות להגרלה.</p>'}
      <button type="submit" class="button" ${busy ? "disabled" : ""}>${create ? "פותחים" : "מצטרפים"}</button>
    </form>${account ? "" : `<div class="account">${googleButton()}</div>`}`, { back: true });
  }

  function joinURL(code) { return `${session.shareOrigin}/between?room=${code}`; }
  function tvURL(code) { return `${session.shareOrigin}/between/tv?room=${code}`; }

  function joinTicket(state) {
    let qr = "";
    try { qr = QR.svg(joinURL(state.code), { label: "קוד QR להצטרפות" }); } catch { /* the room code still works */ }
    return `<div class="ticket card"><div class="qr-box">${qr}<small>סריקה להצטרפות</small></div>
      <div class="ticket-code"><small>קוד החדר</small>${numberHTML(state.code)}</div></div>`;
  }

  function roster(state, status = false) {
    return `<div class="roster" data-count="${state.players.length}">${state.players.map((player, i) =>
      `<div class="person card" style="--i:${i}">${photo(player.face)}
        <strong>${esc(player.name)}</strong>${status ? `<span class="status ${player.locked ? "ready" : ""}" role="img" aria-label="${player.locked ? "נעלו" : "חושבים"}"></span>` : ""}
      </div>`).join("")}</div>`;
  }

  function lobby(state) {
    const host = state.players.find(player => player.id === state.host);
    return withHeader(`<h1 class="title-tag">החדר של ${esc(host?.name)}</h1>
      ${joinTicket(state)}<p class="pill">${state.players.length === 1 ? "שחקן אחד בחדר" : `${state.players.length} שחקנים בחדר`}</p>${roster(state)}
      <div class="room-links">
        ${button("copy-join", "שיתוף קישור למשחק", "light")}
        <details class="tv-menu"><summary>מסך משותף לטלוויזיה</summary><div class="tv-menu-actions">
          <a class="button" href="/between/tv?room=${state.code}" target="_blank" rel="noopener">פתיחת המסך</a>
          ${button("copy-tv", "העתקת קישור", "light")}
        </div></details>
      </div><p class="share-result" id="share-result" aria-live="polite"></p>`,
      { theme: "yellow", header: "plain-head", layout: "lobby-screen", footer: state.me === state.host
        ? `<button type="button" class="button" id="start" ${state.players.length < 2 ? "disabled" : ""}>${state.players.length < 2 ? "מתחילים כשמצטרף עוד שחקן" : "מתחילים"}</button>${button("leave", "יציאה מהחדר", "plain")}`
        : `<p class="form-hint">מחכים שמארח החדר יתחיל</p>${button("leave", "יציאה מהחדר", "plain")}` });
  }

  function roundHeader(state, topic, clock = true) {
    return `<div class="round-strip"><span>שאלה ${state.round} מתוך ${state.roundCount}</span>${topic ? `<span>${esc(topic)}</span>` : ""}
      ${clock && state.deadline ? '<span class="clock" data-clock dir="ltr"></span>' : ""}</div>`;
  }

  function category(state) {
    const chooser = state.players.find(player => player.id === state.chooser);
    const choosing = state.me === state.chooser && !!state.me;
    return withHeader(`${roundHeader(state)}${choosing ? `<h1>התור שלך לבחור נושא</h1>
      <div class="category-cards">${state.choices.map((choice, i) => `<button type="button" class="card topic"
        style="--i:${i}" data-topic="${esc(choice.key)}" aria-pressed="${draft.topic === choice.key}"><span>${esc(choice.name)}</span>${token("pick-token")}</button>`).join("")}</div>`
      : `<h1>בחירת נושא · ${esc(chooser?.name || "המארח")}</h1><div class="waiting-card card">
      ${photo(chooser?.face || "fox", 128)}<strong>השאלה תופיע כאן</strong></div>`}`,
    { theme: choosing ? "yellow" : "lilac", footer: choosing ? `<button type="button" class="button" id="pick-topic" ${draft.topic ? "" : "disabled"}>בוחרים</button>` : "" });
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
      content = `<div class="guess-control card"><label for="guess-number" class="guess-label">הניחוש שלך</label>
        <button type="button" class="step" id="minus" aria-label="הפחתת אחד מהניחוש">−</button>
        <input id="guess-number" type="text" pattern="[0-9]*" inputmode="numeric" autocomplete="off" value="${esc(draft.guess)}" placeholder="?" maxlength="10" aria-describedby="guess-unit">
        <button type="button" class="step" id="plus" aria-label="הוספת אחד לניחוש">+</button>
        <small id="guess-unit">${esc(question.unit)}</small></div>
        <div class="ranges" aria-label="בחירת רוחב הטווח">${tiers.map((tier, i) =>
          `<button type="button" class="card range-card" style="--i:${i}" data-tier="${i}" aria-pressed="${draft.tier === i}">
          ${token("pick-token")}<strong>${tier}</strong><bdi dir="ltr" class="range-value">${attempt === null ? "—" : prettyRange(range(attempt, question.widths[i]))}</bdi>
          <small>${scoreByTier[i]} נק׳ בפגיעה</small></button>`).join("")}</div>
        <div id="selected-scale">${selectedScale(attempt, draft.tier, question.widths)}</div>`;
    } else if (entry) {
      content = `<div class="card locked" role="status"><span>טווח ${tiers[entry.tier]}</span>
        <strong>${numberHTML(prettyRange(range(entry.number, question.widths[entry.tier])))}</strong>${token("lock-token")}</div>`;
    } else {
      content = '<p class="status-line">הזמן לניחוש הסתיים</p>';
    }
    if (state.phase === "tighten") content = `<p class="hint card"><strong>רמז</strong> ${esc(state.hint)}</p>${content}`;
    if (!editing) content += `${roster(state, true)}<p class="status-line">${canTighten ? "אפשר לצמצם את הטווח בדרגה אחת" : "מחכים לכולם"}</p>`;
    return withHeader(`${roundHeader(state, question.topic)}<h1 class="question">${esc(question.prompt)}</h1>${content}`, {
      header: "plain-head", layout: "guess-screen",
      footer: editing ? `<button type="button" id="lock" class="button" ${attempt === null || draft.tier === null ? "disabled" : ""}>נעלתי</button>`
        : canTighten ? `${button("tighten", `מצמצמים ל־${numberHTML(prettyRange(range(entry.number, question.widths[entry.tier - 1])))}`)}${button("keep", "נשארים עם הטווח", "light")}` : ""
    });
  }

  function answerCard(state, onStage = false) {
    return `<div class="answer-wrap" style="--digits:${String(state.answer).length}">${onStage ? '<img class="reveal-rays" src="/between-rays.png" alt="">' : ""}
      ${token("drop-token")}<div class="answer card">
      <strong>${numberHTML(state.answer)}</strong><span>${esc(state.question.unit)}</span>
    </div></div>`;
  }

  function resultRows(state, big = false) {
    const limits = state.results.reduce(([min, max], row) => row.range
      ? [Math.min(min, row.range[0]), Math.max(max, row.range[1])] : [min, max], [state.answer, state.answer]);
    return `<div class="result-grid ${big ? "stage-results" : ""}" data-count="${state.players.length}">${state.results.flatMap((row, i) => {
      const player = state.players.find(candidate => candidate.id === row.id);
      if (!player) return [];
      return [`<div class="card result ${row.points ? "hit" : "miss"} ${row.bonus ? "bonus" : ""}" style="--i:${i}">
        <div class="result-avatar">${photo(player.face, big ? 118 : 54)}</div>
        <div class="result-copy"><strong>${esc(player.name)}</strong>
          <span class="result-range">${numberHTML(prettyRange(row.range))}</span>
          <span class="earned">${numberHTML(`+${row.points}`)}</span>
          ${row.bonus ? '<small class="bonus-note">+1 על בחירת הנושא</small>' : ""}
        </div>${!big && row.range ? rangeScale(row.range, limits, state.answer) : ""}
      </div>`];
    }).join("")}</div>`;
  }

  function reveal(state) {
    return withHeader(`${roundHeader(state, null, false)}${answerCard(state)}
      ${state.note ? `<p class="fact">${esc(state.note)}</p>` : ""}${resultRows(state)}`,
    { theme: "yellow", header: "plain-head", layout: "reveal-screen", footer: state.me === state.host
      ? button("next", state.round === state.roundCount ? "לסיכום המשחק" : "לסיבוב הבא") : "" });
  }

  function standings(state) {
    const sorted = [...state.players].sort((a, b) => b.score - a.score);
    return `<ol class="standings card">${sorted.map(player => `<li>${photo(player.face, 43)}<strong>${esc(player.name)}</strong>
      <span class="earned">${numberHTML(player.score)}</span></li>`).join("")}</ol>`;
  }

  function endTitle(state) {
    const names = state.players.filter(player => state.winners.includes(player.id)).map(player => player.name);
    if (!names.length) return "סיימנו את המשחק";
    return names.length === 1 ? `הניצחון של ${esc(names[0])}!` : `ניצחון משותף · ${esc(names.join(" + "))}`;
  }

  function podium(state) {
    const winners = state.players.filter(player => state.winners.includes(player.id));
    return withHeader(`<h1 class="title-tag">${endTitle(state)}</h1>
      <div class="winner-card card">${winners.map(player => photo(player.face, 110)).join("")}${token("drop-token")}</div>
      <h2>סיכום המשחק</h2>${standings(state)}`, { footer: `${state.me === state.host ? button("again", "משחק נוסף") : ""}
        ${session.profile ? button("profile", "הפרופיל שלי", "light") : ""}${button("leave", "יציאה מהחדר", "plain")}` });
  }

  function rules() {
    return withHeader(`<h1>איך משחקים?</h1><ol class="rule-list">
      <li>בכל סיבוב שחקן אחר בוחר נושא מתוך שלושה קלפים.</li>
      <li>מקלידים ניחוש ובוחרים כמה מרווח להשאיר סביבו. שני הקצוות כלולים בטווח.</li>
      <li>כשפוגעים, טווח צר שווה 3 נקודות, בינוני 2 ורחב 1. פספוס שווה אפס.</li>
      <li>מי שבחר נושא מקבל עוד נקודה אם ניקוד הטווח שלו הוא הגבוה בסיבוב ויש לו פגיעה, גם בשוויון.</li>
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
    if (!state || state.phase === "lobby") {
      content = `<div class="stage-lobby"><h1>בין לבין</h1>${state ? `${joinTicket(state)}${roster(state)}`
        : `<form id="tv-form"><label for="room-code">קוד החדר</label><input id="room-code" maxlength="4"
          class="code-field" value="${roomCode}" placeholder="ABCD" required><button class="button" type="submit">צפייה במשחק</button></form>`}</div>`;
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
    return `<section class="stage phase-${state?.phase || "lobby"}"><header>${mark()}<span>בין לבין</span></header>
      ${content}${notice()}</section>`;
  }

  function render({ replay = false } = {}) {
    const focus = document.activeElement?.id;
    const tvMenuOpen = app.querySelector(".tv-menu")?.open;
    let markup;
    if (tv) markup = stage(model);
    else if (screen === "home") markup = home();
    else if (screen === "rules") markup = rules();
    else if (screen === "create" || screen === "join") markup = joinForm();
    else if (screen === "profile") markup = profile();
    else if (screen === "edit") markup = editProfile();
    else if (screen === "leaders") markup = leaders();
    else if (!model) markup = withHeader('<p>נכנסים לחדר…</p>');
    else if (model.phase === "lobby") markup = lobby(model);
    else if (model.phase === "topic") markup = category(model);
    else if (model.phase === "guess" || model.phase === "tighten") markup = guessScreen(model);
    else if (model.phase === "reveal") markup = reveal(model);
    else markup = podium(model);
    app.classList.toggle("animated", replay);
    app.innerHTML = markup;
    const tvMenu = app.querySelector(".tv-menu");
    if (tvMenu && tvMenuOpen) tvMenu.open = true;
    if (focus === "guess-number" || focus === "nickname" || focus === "room-code") {
      const input = document.getElementById(focus);
      input?.focus({ preventScroll: true });
      input?.setSelectionRange(input.value.length, input.value.length);
    }
    updateClock();
  }

  function updateClock() {
    const clock = app.querySelector("[data-clock]");
    if (clock && model?.deadline) {
      const left = Math.max(0, Math.ceil((model.deadline - Date.now() - clockOffset) / 1000));
      clock.textContent = left;
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
    const key = `${state.phase}:${state.round}:${!!state.entry}:${state.entry?.tier ?? ""}`;
    if (before?.round !== state.round || before?.phase === "lobby") {
      Object.assign(draft, { guess: "", tier: null, topic: "" });
    }
    if (screen !== "room" && !tv) return;
    const serialized = JSON.stringify({ ...state, now: 0 });
    const justWaiting = before?.phase === "guess" && state.phase === "guess" && before.round === state.round && !state.entry && !tv;
    if (serialized !== version && (!justWaiting || error)) {
      const replay = key !== replayKey;
      if (replay && state.phase === "reveal") window.SFX?.play("land");
      render({ replay });
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
        keepSeat(null); model = null; roomCode = ""; screen = "home"; version = ""; render();
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
      draft.name = guest ? "" : session.profile?.name || "";
      draft.face = guest ? "" : session.profile?.face || "";
    }
    render();
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
    app.querySelectorAll(`[data-${attribute}]`).forEach(button =>
      button.setAttribute("aria-pressed", button.dataset[attribute] === String(value)));
  }

  function refreshGuess() {
    app.querySelectorAll("[data-tier]").forEach(button => {
      const width = model.question.widths[Number(button.dataset.tier)];
      button.querySelector(".range-value").textContent = draft.guess === "" ? "—" : prettyRange(range(Number(draft.guess), width));
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
    } else if (button.dataset.topic) {
      draft.topic = button.dataset.topic; markChoice("topic", draft.topic);
      document.getElementById("pick-topic").disabled = false;
    } else if (button.dataset.tier !== undefined) {
      draft.tier = Number(button.dataset.tier); markChoice("tier", draft.tier); refreshGuess();
    } else if (button.dataset.period) {
      period = button.dataset.period; await openData("leaders");
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
      await copy(id === "copy-join" ? joinURL(roomCode) : tvURL(roomCode));
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
    } else if (["start", "next", "again", "leave"].includes(id)) {
      await action(id);
    }
  });

  app.addEventListener("input", event => {
    if (event.target.id === "room-code") {
      roomCode = codeOf(event.target.value); event.target.value = roomCode;
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
          code: roomCode, name: draft.name, face: draft.face, guest
        });
        keepSeat(acquired); roomCode = acquired.code; screen = "room";
        history.replaceState(null, "", "/between");
        render(); await poll();
      }
    } catch (problem) {
      error = errors[problem.message] || "הפעולה לא הצליחה. נסו שוב.";
      busy = false; render();
    } finally { busy = false; }
  });

  if (seat && (!roomCode || roomCode === seat.code)) { roomCode = seat.code; screen = "room"; }
  else if (seat) keepSeat(null);
  if (tv) document.body.classList.add("theatre");
  render({ replay: true });
  api("/session").then(result => {
    session = { ...session, ...result };
    if (!guest && result.profile && (screen === "join" || screen === "create")) {
      draft.name ||= result.profile.name; draft.face ||= result.profile.face;
    }
    render();
  }).catch(() => {});
  poll();
  setInterval(poll, 950);
  setInterval(updateClock, 200);
})();
