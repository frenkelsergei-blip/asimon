/* The audit, as a page.

   `npm run playtest` writes one of these into reports/ every time it runs, so
   a change to the rules can be read next to the run before it. The colours and
   the two faces are the game's own — the report should look like it came out
   of Asimon and not out of a reporting tool.                                */
"use strict";
const fs = require("fs");
const path = require("path");

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const n1 = x => (Math.round(x * 10) / 10).toFixed(1);
const thou = x => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/* ---------- the page's tokens ----------
   Light is the game's own paper and ink. Dark is chosen rather than flipped:
   the same hues, re-stepped so they still separate on a deep ground. The three
   timing colours are the ones the reveal screen already shows a table, and
   both sets are the ones the palette validator passed. */
const CSS = `
:root{
  --paper:#FFFCF6; --surface:#FFFFFF; --sunk:#F7F5FC; --raised:#FFFFFF;
  --ink:#17161C; --second:#46445A; --muted:#6B6A78; --faint:#A3A1B0;
  --rule:#E7E4F0; --hair:#F1EFF9;
  --accent:#2C6BFF; --accent-soft:#EAF0FF; --accent-ink:#1B4FD1;
  --good:#0D8F69; --good-soft:#E6F7F1;
  --warn:#B77800; --warn-soft:#FFF3DB;
  --bad:#D8351C;  --bad-soft:#FFEDE9;
  --band-early:#D8351C; --band-mid:#D18A08; --band-late:#0D8F69;
  --bar:#2C6BFF; --bar-soft:#DCE6FF;
  --shadow:0 1px 2px rgba(23,22,28,.05),0 10px 30px -22px rgba(23,22,28,.45);
}
:root:not([data-theme="light"]){
  @media (prefers-color-scheme:dark){
    --paper:#14131A; --surface:#1C1B24; --sunk:#191821; --raised:#22212C;
    --ink:#F3F1F8; --second:#C6C3D4; --muted:#9693A6; --faint:#6E6B7E;
    --rule:#2E2C3A; --hair:#26242F;
    --accent:#7A9DFF; --accent-soft:#22283C; --accent-ink:#A8BEFF;
    --good:#15AE82; --good-soft:#122A24;
    --warn:#D89E15; --warn-soft:#2C2513;
    --bad:#E8573C;  --bad-soft:#301C1A;
    --band-early:#E8573C; --band-mid:#D89E15; --band-late:#15AE82;
    --bar:#7A9DFF; --bar-soft:#262C41;
    --shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px -22px rgba(0,0,0,.8);
  }
}
:root[data-theme="dark"]{
  --paper:#14131A; --surface:#1C1B24; --sunk:#191821; --raised:#22212C;
  --ink:#F3F1F8; --second:#C6C3D4; --muted:#9693A6; --faint:#6E6B7E;
  --rule:#2E2C3A; --hair:#26242F;
  --accent:#7A9DFF; --accent-soft:#22283C; --accent-ink:#A8BEFF;
  --good:#15AE82; --good-soft:#122A24;
  --warn:#D89E15; --warn-soft:#2C2513;
  --bad:#E8573C;  --bad-soft:#301C1A;
  --band-early:#E8573C; --band-mid:#D89E15; --band-late:#15AE82;
  --bar:#7A9DFF; --bar-soft:#262C41;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px -22px rgba(0,0,0,.8);
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
  font-family:"Assistant",system-ui,"Segoe UI",Arial,sans-serif;font-size:15px;line-height:1.5;
  -webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
.wrap{max-width:1080px;margin:0 auto;padding:34px 22px 80px;display:flex;flex-direction:column;gap:30px}
h1,h2,h3{margin:0;font-family:"Suez One",Georgia,serif;font-weight:400;text-wrap:balance}
h1{font-size:clamp(30px,5vw,42px);line-height:1.06;letter-spacing:-.005em}
h2{font-size:20px;line-height:1.2}
h3{font-size:15px;font-family:inherit;font-weight:800}
a{color:var(--accent-ink)}
.eyebrow{font-size:11px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);margin:0}
.lede{color:var(--second);max-width:64ch;margin:0}
.small{font-size:13px;color:var(--muted)}

/* masthead */
.mast{display:flex;flex-direction:column;gap:14px;padding-bottom:26px;border-bottom:2px solid var(--ink)}
.figs{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:2px;
  background:var(--rule);border:1px solid var(--rule);border-radius:12px;overflow:hidden}
.fig{background:var(--surface);padding:13px 15px;display:flex;flex-direction:column;gap:2px}
.fig b{font-family:"Suez One",Georgia,serif;font-weight:400;font-size:23px;line-height:1}
.fig span{font-size:11.5px;color:var(--muted);letter-spacing:.03em}
.slice{display:inline-block;padding:5px 11px;border-radius:999px;background:var(--warn-soft);
  color:var(--warn);font-size:12.5px;font-weight:700;align-self:flex-start}

/* verdict */
.tally{display:flex;gap:10px;flex-wrap:wrap}
.pill{display:flex;align-items:baseline;gap:7px;padding:9px 14px;border-radius:999px;
  font-size:13.5px;font-weight:700}
.pill b{font-size:17px}
.pill.ok{background:var(--good-soft);color:var(--good)}
.pill.warn{background:var(--warn-soft);color:var(--warn)}
.pill.bad{background:var(--bad-soft);color:var(--bad)}
.checks{display:flex;flex-direction:column;gap:9px}
.chk{display:grid;grid-template-columns:auto 1fr auto;gap:4px 14px;align-items:baseline;
  padding:13px 16px 13px 15px;border-radius:11px;background:var(--surface);
  border:1px solid var(--rule);border-inline-start:4px solid var(--rule)}
.chk.bad{border-inline-start-color:var(--bad)}
.chk.warn{border-inline-start-color:var(--warn)}
.chk.ok{border-inline-start-color:var(--good);padding:9px 16px 9px 15px}
.chk .mk{font-weight:800;font-size:13px}
.chk.bad .mk{color:var(--bad)} .chk.warn .mk{color:var(--warn)} .chk.ok .mk{color:var(--good)}
.chk .area{font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;
  color:var(--faint);grid-column:2;margin-bottom:-3px}
.chk .what{grid-column:2;font-weight:600}
.chk .val{grid-column:3;grid-row:2;font-weight:800;white-space:nowrap}
.chk .adv{grid-column:2/4;font-size:13px;color:var(--muted);margin-top:3px}
.chk.ok .area{display:none}
.chk.ok .val{grid-row:1}

/* panels */
section{display:flex;flex-direction:column;gap:13px}
.panel{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:18px 20px;
  display:flex;flex-direction:column;gap:14px;box-shadow:var(--shadow)}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;align-items:start}
.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{border-collapse:collapse;width:100%;font-size:13.5px;min-width:520px}
th,td{padding:8px 10px;text-align:right;white-space:nowrap;border-bottom:1px solid var(--hair)}
th:first-child,td:first-child{text-align:left;white-space:normal}
thead th{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;
  color:var(--muted);border-bottom:1px solid var(--rule)}
tbody tr:last-child td{border-bottom:0}
tbody tr:hover td{background:var(--sunk)}
td.key{font-weight:700}
.flag{color:var(--warn);font-weight:700;font-size:12.5px}

/* the readouts that are not tables */
.rows{display:flex;flex-direction:column;gap:0}
.row{display:flex;justify-content:space-between;gap:18px;padding:7px 0;
  border-bottom:1px solid var(--hair);font-size:13.5px}
.row:last-child{border-bottom:0}
.row span{color:var(--second)}
.row b{font-weight:800;white-space:nowrap}
.legend{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12.5px;color:var(--second)}
.legend i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-inline-end:6px}
figcaption{font-size:12.5px;color:var(--muted);margin-top:8px}
figure{margin:0}
footer{border-top:1px solid var(--rule);padding-top:18px;color:var(--muted);font-size:13px;
  display:flex;flex-direction:column;gap:6px}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;
  background:var(--sunk);padding:2px 6px;border-radius:5px}
@media (prefers-reduced-motion:no-preference){ .chk{transition:border-color .15s ease} }
`;

/* ---------- little builders ---------- */
const fig = (v, l) => '<div class="fig"><b>' + esc(v) + '</b><span>' + esc(l) + '</span></div>';
const row = (l, v) => '<div class="row"><span>' + esc(l) + '</span><b>' + esc(v) + '</b></div>';
function table(cols, rows){
  return '<div class="scroll"><table><thead><tr>' +
    cols.map(c => '<th>' + esc(c) + '</th>').join("") + '</tr></thead><tbody>' +
    rows.map(r => '<tr>' + r.map((v, i) =>
      '<td' + (i === 0 ? ' class="key"' : '') + '>' + v + '</td>').join("") + '</tr>').join("") +
    '</tbody></table></div>';
}

/* one bar per category, laid out in the flow so nothing can collide */
function bars(items, unit){
  const max = Math.max(...items.map(i => i.v), 0.0001);
  return '<div class="rows">' + items.map(i =>
    '<div class="row" style="align-items:center">' +
      '<span style="flex:0 0 116px">' + esc(i.k) + '</span>' +
      '<span style="flex:1;height:9px;background:var(--bar-soft);border-radius:5px;overflow:hidden">' +
        '<span style="display:block;height:100%;width:' + (100 * i.v / max).toFixed(1) + '%;' +
        'background:' + (i.c || "var(--bar)") + ';border-radius:5px"></span></span>' +
      '<b style="flex:0 0 64px;text-align:end">' + esc(n1(i.v) + (unit || "")) + '</b>' +
      (i.note ? '<span class="flag" style="flex:0 0 auto">' + esc(i.note) + '</span>' : '') +
    '</div>').join("") + '</div>';
}

/* the three timing windows, as one bar the width of the panel */
function bandBar(b){
  const tot = (b.early + b.mid + b.late) || 1;
  const seg = [
    { k:"too obvious", v:b.early, c:"var(--band-early)", d:"the giver takes 1" },
    { k:"well pitched", v:b.mid,  c:"var(--band-mid)",   d:"the giver takes the word" },
    { k:"almost lost them", v:b.late, c:"var(--band-late)", d:"the word, plus one" }
  ];
  return '<figure>' +
    '<div style="display:flex;gap:2px;height:34px;border-radius:8px;overflow:hidden">' +
    seg.map(s => '<div style="width:' + (100 * s.v / tot).toFixed(2) + '%;background:' + s.c + '"></div>').join("") +
    '</div>' +
    '<div class="rows" style="margin-top:10px">' +
    seg.map(s => '<div class="row"><span><i style="display:inline-block;width:9px;height:9px;' +
      'border-radius:3px;margin-inline-end:8px;background:' + s.c + '"></i>' + esc(s.k) +
      ' · <span class="small">' + esc(s.d) + '</span></span><b>' +
      n1(100 * s.v / tot) + '%</b></div>').join("") + '</div>' +
    '<figcaption>The whole game is aimed at the last of these — the giver wants it to land ' +
    'as late as it can without nobody getting it at all.</figcaption></figure>';
}

/* what a round is worth in ground, as columns */
function histogram(hist){
  const max = Math.max(...hist.map(h => h.pct), 0.0001);
  return '<figure><div style="display:flex;align-items:flex-end;gap:6px;height:120px">' +
    hist.map(h => '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;' +
      'justify-content:flex-end;height:100%">' +
      '<span style="font-size:11px;font-weight:800;color:var(--second)">' + n1(h.pct) + '%</span>' +
      '<span style="width:100%;height:' + Math.max(2, 100 * h.pct / max).toFixed(1) + '%;' +
      'background:' + (h.k >= 6 ? "var(--band-mid)" : "var(--bar)") + ';border-radius:4px 4px 0 0"></span>' +
      '<span style="font-size:12px;color:var(--muted)">' + h.k + '</span></div>').join("") +
    '</div><figcaption>Steps spent in one round. The amber columns are the rounds that move six ' +
    'or more — those are what end a game early.</figcaption></figure>';
}

/* ---------- the page ---------- */
function render(a, opts){
  const o = opts || {};
  const bad = a.checks.filter(c => c.level === "bad");
  const warn = a.checks.filter(c => c.level === "warn");
  const ok = a.checks.filter(c => c.level === "ok");
  const chk = c => '<div class="chk ' + c.level + '">' +
    '<span class="mk">' + (c.level === "bad" ? "✗" : c.level === "warn" ? "!" : "✓") + '</span>' +
    (c.level === "ok" ? "" : '<span class="area">' + esc(c.area) + '</span>') +
    '<span class="what">' + esc(c.what) + '</span>' +
    '<span class="val">' + esc(c.show) + '</span>' +
    (c.level === "ok" ? "" : '<span class="adv">' + esc(c.advice) + '</span>') + '</div>';

  const sliceRows = list => list.map(s => [esc(s.name), thou(s.games), n1(s.rounds), n1(s.min),
    n1(s.med), n1(s.p90), n1(s.short) + "%", n1(s.unsolved) + "%", n1(s.margin), n1(s.close) + "%"]);
  const SLICE_COLS = ["", "games", "rounds", "min", "median", "p90", "≤4 rnd", "unsolved", "margin", "close"];

  const body =
'<div class="wrap">' +

/* masthead */
'<header class="mast">' +
  '<p class="eyebrow">Playtest audit</p>' +
  '<h1>' + thou(a.meta.games) + ' games of Asimon, played by nobody</h1>' +
  '<p class="lede">A table of bots sat down ' + thou(a.meta.games) + ' times and played the whole thing ' +
  'through <code>game/play.js</code> — the same actions a phone sends, nothing reaching in behind them. ' +
  'This is what came back.</p>' +
  (a.meta.slice ? '<span class="slice">' + esc(a.meta.slice) + '</span>' : '') +
  '<div class="figs">' +
    fig(thou(a.meta.games), "games played") +
    fig(thou(a.meta.rounds), "rounds") +
    fig(thou(Math.round(a.meta.hours)), "hours at the table") +
    fig(n1(a.sitting.rounds.avg), "rounds a game") +
    fig(n1(a.sitting.minutes.med) + "m", "median sitting") +
    fig(a.meta.secs + "s", "to run") +
  '</div>' +
  '<p class="small">seed ' + esc(a.meta.seed) + ' · ' + esc(a.meta.when) + '</p>' +
'</header>' +

/* verdict */
'<section>' +
  '<h2>The verdict</h2>' +
  '<div class="tally">' +
    '<span class="pill ok"><b>' + ok.length + '</b> healthy</span>' +
    '<span class="pill warn"><b>' + warn.length + '</b> worth watching</span>' +
    '<span class="pill bad"><b>' + bad.length + '</b> needs work</span>' +
  '</div>' +
  (bad.length ? '<div class="checks">' + bad.map(chk).join("") + '</div>' : "") +
  (warn.length ? '<div class="checks">' + warn.map(chk).join("") + '</div>' : "") +
  '<h3 style="margin-top:8px">Healthy</h3>' +
  '<div class="checks">' + ok.map(chk).join("") + '</div>' +
'</section>' +

/* the sitting */
'<section><h2>How long a game runs</h2><div class="panel">' +
  table(["", "average", "median", "p90", "shortest", "longest"], [
    ["rounds", n1(a.sitting.rounds.avg), String(a.sitting.rounds.med), String(a.sitting.rounds.p90),
     String(a.sitting.rounds.min), String(a.sitting.rounds.max)],
    ["minutes at the table", n1(a.sitting.minutes.avg), n1(a.sitting.minutes.med),
     n1(a.sitting.minutes.p90), n1(a.sitting.minutes.min), n1(a.sitting.minutes.max)]
  ]) +
  '<div class="rows">' +
    row("over before it started — four rounds or fewer", n1(a.sitting.shortPct) + "% of games") +
    row("outstayed its welcome — past forty minutes", n1(a.sitting.longPct) + "% of games") +
    row("a round costs the table about", n1(a.sitting.minPerRound) + " minutes") +
  '</div>' +
'</div></section>' +

/* the cross-tabs */
'<section><h2>The four ways to play</h2><div class="panel">' +
  table(SLICE_COLS, sliceRows(a.slices.mode)) +
'</div></section>' +

'<section><h2>The five boards</h2><div class="panel">' +
  table(SLICE_COLS, sliceRows(a.slices.map)) +
  '<div><h3>What each board deals out</h3>' +
  table([""].concat(a.modNames), a.squaresByMap.map(m =>
    [esc(m.name)].concat(a.modKeys.map(k => n1(m.dist[k] || 0) + "%")))) + '</div>' +
'</div></section>' +

'<section><h2>Three to eight players</h2><div class="panel">' +
  table(SLICE_COLS, sliceRows(a.slices.size)) +
  (a.slices.seat.length > 1
    ? '<div><h3>Every player for themselves, and in pairs</h3>' +
      table(SLICE_COLS, sliceRows(a.slices.seat)) + '</div>' : "") +
'</div></section>' +

/* the round */
'<section><h2>The round</h2>' +
'<div class="grid2">' +
  '<div class="panel"><h3>Where a solve landed on the clock</h3>' + bandBar(a.round.bands) + '</div>' +
  '<div class="panel"><h3>What happened between the phones</h3><div class="rows">' +
    row("rounds played", thou(a.round.rounds)) +
    row("somebody got it", n1(a.round.solvedPct) + "%") +
    row("nobody got it — the giver takes nothing", n1(a.round.unsolvedPct) + "%") +
    row("shouts, right and wrong", thou(a.round.buzzes)) +
    row("of those, wrong", n1(a.round.wrongPct) + "%") +
    row("wrong shouts a game", n1(a.round.wrongPer)) +
    row("a giving round paid the giver", n1(a.round.giverPay) + " points") +
    row("the difficulty givers asked for", a.round.challengeLine) +
  '</div></div>' +
'</div>' +
'<div class="panel"><h3>The squares a table lands on</h3>' +
  bars(a.round.squares, "%") +
'</div></section>' +

/* ground */
'<section><h2>What a round is worth in ground</h2><div class="panel">' +
  histogram(a.ground.hist) +
  '<div class="rows">' +
    row("steps a scorer spends", n1(a.ground.avg) + " on average") +
    row("the most one round ever moved", String(a.ground.max) + " steps") +
    row("a board is", a.ground.boardMin + "–" + a.ground.boardMax + " rows") +
    row("so an ordinary round moves", n1(a.ground.sharePct) + "% of it") +
  '</div>' +
'</div></section>' +

/* cards and the wildcard */
'<section><h2>The seven cards, and the wildcard</h2>' +
'<div class="panel">' +
  table(["card", "drawn", "share", "played", "of those drawn", ""],
    a.cards.map(c => [esc(c.key), thou(c.drawn), n1(c.share) + "%", thou(c.played),
      n1(c.rate) + "%", c.note ? '<span class="flag">' + esc(c.note) + '</span>' : ""])) +
  '<div class="rows">' +
    row("cards a table meets in a game", n1(a.cardStats.perGame)) +
    row("where they came from", a.cardStats.sourceLine) +
    row("games where nobody reached a card square", n1(a.cardStats.nonePct) + "%") +
    row("games where somebody never did", n1(a.cardStats.somePct) + "%") +
  '</div>' +
'</div>' +
'<div class="panel"><h3>The wildcard square</h3><div class="rows">' +
    row("landed on", n1(a.wild.perGame) + " times a game") +
    row("games that met one at all", n1(a.wild.metPct) + "%") +
    row("what it rolled", a.wild.kindLine) +
'</div></div></section>' +

/* drama */
'<section><h2>Fairness, and whether it is a game or a procession</h2><div class="panel"><div class="rows">' +
  row("final margin", "average " + n1(a.drama.marginAvg) + ", median " + n1(a.drama.marginMed)) +
  row("finished within two points", n1(a.drama.closePct) + "% of games") +
  row("the leader at round four went on to win", n1(a.drama.leadHolds) + "%") +
  row("rounds a player scored nothing", n1(a.drama.dryPct) + "% of all seat-rounds") +
  row("longest scoreless run, per player", n1(a.drama.longDry) + " rounds") +
  row("players who went four rounds or more dry", n1(a.drama.dry4Pct) + "%") +
  row("giver turns, most minus fewest", n1(a.drama.giverGap)) +
  row("a player finished on nothing at all", n1(a.drama.zeroPct) + "% of games") +
'</div></div></section>' +

/* content and rules */
'<section><h2>The content a table actually sees</h2><div class="grid2">' +
  '<div class="panel"><div class="rows">' +
    row("distinct words in one game", n1(a.content.distinct)) +
    row("a word came round twice", n1(a.content.repeats) + " times a game") +
    row("topics dealt", a.content.topicsSeen + " of " + a.content.topicsAll) +
    (a.content.unseen.length ? row("never dealt", a.content.unseen.join(", ")) : "") +
  '</div></div>' +
  '<div class="panel"><h3>Rules that used to trip over each other</h3><div class="rows">' +
    row("Switch with nothing to switch to", a.rules.swapStalls + " stalled rooms") +
    row("Insight on a one-word round, padded to four", a.rules.insightPadded + " times") +
    row("Stopwatch landing the round in the giver's top band",
        a.rules.swLate + " of " + a.rules.swPlays + " plays") +
    row("hard failures — stuck rooms, negative scores, endless games", String(a.hard.length)) +
  '</div></div>' +
'</div></section>' +

'<footer>' +
  '<p>' + (bad.length
    ? "Start with the " + bad.length + " marked <strong>needs work</strong> — each names what to change."
    : (warn.length ? "Nothing broken. The " + warn.length + " marked <strong>worth watching</strong> are where the next gain is."
                   : "Every check healthy across " + thou(a.meta.games) + " games.")) + '</p>' +
  '<p>Every threshold here is a claim about what a good sitting looks like, and they are all in ' +
  '<code>CHECKS</code> at the foot of <code>game/playtest.js</code>. So is the model of how a table ' +
  'behaves — <code>MODEL</code>, at the top.</p>' +
  '<p>Run it again: <code>npm run playtest</code></p>' +
'</footer>' +
'</div>';

  const title = o.title || ("Asimon playtest · " + a.meta.when);
  const headTags = '<title>' + esc(title) + '</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' +
      'family=Assistant:wght@400;600;700;800&family=Suez+One&display=swap">' +
    '<style>' + CSS + '</style>';

  if(o.fragment) return headTags + body;
  return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    headTags + '\n</head>\n<body>\n' + body + '\n</body>\n</html>\n';
}

/* ---------- the shelf ----------
   Every run leaves a page and its numbers behind. The index is rebuilt from
   whatever is in the folder, so deleting a report is all it takes to forget it. */
function writeIndex(dir){
  const files = fs.readdirSync(dir).filter(f => /\.json$/.test(f)).sort().reverse();
  const runs = files.map(f => {
    try{
      const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      return { html: f.replace(/\.json$/, ".html"), meta: j.meta,
               ok: j.checks.filter(c => c.level === "ok").length,
               warn: j.checks.filter(c => c.level === "warn").length,
               bad: j.checks.filter(c => c.level === "bad").length };
    }catch(e){ return null; }
  }).filter(Boolean);

  const cards = runs.map(r =>
    '<a class="run" href="' + esc(r.html) + '">' +
      '<span class="when">' + esc(r.meta.when) + '</span>' +
      '<span class="what">' + thou(r.meta.games) + ' games · ' + thou(r.meta.rounds) + ' rounds' +
        (r.meta.slice ? ' · ' + esc(r.meta.slice) : ' · the whole sweep') + '</span>' +
      '<span class="tally">' +
        '<span class="pill ok"><b>' + r.ok + '</b> healthy</span>' +
        '<span class="pill warn"><b>' + r.warn + '</b> watching</span>' +
        '<span class="pill bad"><b>' + r.bad + '</b> needs work</span>' +
      '</span>' +
    '</a>').join("");

  const html = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<title>Asimon playtest reports</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' +
      'family=Assistant:wght@400;600;700;800&family=Suez+One&display=swap">' +
    '<style>' + CSS +
    '.run{display:grid;gap:5px;padding:16px 18px;border:1px solid var(--rule);border-radius:13px;' +
      'background:var(--surface);text-decoration:none;color:inherit;box-shadow:var(--shadow)}' +
    '.run:hover{border-color:var(--accent)}' +
    '.run .when{font-family:"Suez One",Georgia,serif;font-size:19px}' +
    '.run .what{font-size:13.5px;color:var(--muted)}' +
    '.run .tally{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}' +
    '.run .pill{font-size:12px;padding:5px 10px}' +
    '.shelf{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}' +
    '</style>\n</head>\n<body>\n<div class="wrap">' +
    '<header class="mast"><p class="eyebrow">Asimon</p>' +
    '<h1>Playtest reports</h1>' +
    '<p class="lede">Every run of <code>npm run playtest</code> leaves a page here, newest first. ' +
    'Each one is a few thousand games of Asimon played end to end, and a verdict on what the rules ' +
    'are doing.</p></header>' +
    (runs.length ? '<div class="shelf">' + cards + '</div>'
                 : '<p class="lede">Nothing here yet. Run <code>npm run playtest</code>.</p>') +
    '</div>\n</body>\n</html>\n';
  fs.writeFileSync(path.join(dir, "index.html"), html);
  return runs.length;
}

module.exports = { render, writeIndex, CSS };
