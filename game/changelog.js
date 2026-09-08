/* The changelog — what changed, and which version it landed in.

   This file is the source of the version number, not a record of it. The top
   entry's `v` is what `npm run release` writes into package.json and what
   `npm test` insists the server is serving, so a version cannot move without a
   line saying what moved with it, and a line cannot be written without a
   version to hang it on. CHANGELOG.md at the root is generated from here; it
   is never edited by hand.

   Bilingual, like every other string a player reads. The phone asks
   /api/changelog for the list in whichever language it is showing, and draws
   it in the "What's new" sheet under the version at the foot of the first
   screen — the one surface where somebody is already asking which build they
   are on.

   Newest first. Write for somebody sitting at the table, not for somebody
   reading the diff: what they will notice, in one sentence.

   `kind` does two jobs. It picks the little label beside the line, and it
   decides the version number: a release carrying anything a player did not
   have before (`new`) or that no longer works the way they learned it
   (`rules`) is a minor. A release of nothing but `change` and `fix` is a
   patch — better, but nothing to relearn. So the number falls out of the
   lines rather than out of somebody's judgement at the end of the day, and
   `npm run release` writes it in.

   `v` and `date` on the top entry are filled in by that script if you leave
   them out. `bump:"major"` on a release overrides the derivation upwards,
   which is how 1.0 happens; nothing can override it downwards.            */
"use strict";

const KINDS = ["new", "rules", "change", "fix"];
/* the two that cost a minor */
const MINOR_KINDS = ["new", "rules"];
const RANK = { patch:0, minor:1, major:2 };

const RELEASES = [

  { v:"0.10.0", date:"2026-09-08", lines:[
    { kind:"rules",
      en:"On Twist the wildcard square has moved to the far lane, beside Blind and The link, so the quiet lane is no longer the richest one as well as the safest.",
      he:"בתפנית משבצת ההפתעה עברה לנתיב הרחוק, ליד עיוור והקישור, כך שהנתיב השקט כבר לא גם הבטוח וגם העשיר ביותר." }
  ]},

  { v:"0.9.0", date:"2026-09-08", lines:[
    { kind:"change",
      en:"On the screen the fox, the cat, the owl, the frog and the panda stand up like everybody else — a head with ears on a pair of shoulders, not a badge on a stick.",
      he:"על המסך השועל, החתול, הינשוף, הצפרדע והפנדה עומדים כמו כולם — ראש עם אוזניים על זוג כתפיים, לא תג על מקל." },
    { kind:"new",
      en:"Every figure on the screen moves in its own way — the frog springs, the owl turns its head, the robot jitters — while it waits and when it hops.",
      he:"כל דמות על המסך זזה בדרך שלה — הצפרדע מזנקת, הינשוף מסובב את הראש, הרובוט רוטט — גם כשהיא מחכה וגם כשהיא קופצת." },
    { kind:"new",
      en:"With the screen's sound on, a hop is heard: each figure jumps in its own voice and lands with a thump.",
      he:"כשהצליל של המסך דלוק, קפיצה נשמעת: כל דמות קופצת בקול שלה ונוחתת בחבטה." },
    { kind:"change",
      en:"The finish square on the screen wears a chequered print instead of the word, like every other square, and the Legend reads it.",
      he:"משבצת הסוף על המסך עונדת סימן משבצות במקום המילה, כמו כל משבצת אחרת, והמקרא קורא אותו." }
  ]},

  { v:"0.8.2", date:"2026-09-08", lines:[
    { kind:"fix",
      en:"The screen kept drawing the place while a mover was choosing a square — a ring it meant to draw round the chosen square had gone missing and stopped the whole map.",
      he:"המסך ממשיך לצייר את המקום בזמן שמישהו בוחר משבצת — טבעת שהיה אמור לצייר סביב המשבצת שנבחרה נעלמה ועצרה את כל המפה." }
  ]},

  { v:"0.8.1", date:"2026-09-08", lines:[
    { kind:"fix",
      en:"What is this board? now describes the board you are actually on — its own colours, the kinds of round it deals, and on Crossroads how a step down a road really works — instead of the classic four lanes every time.",
      he:"«מה זה הלוח?» מתאר עכשיו את הלוח שאתם באמת עליו — הצבעים שלו, סוגי הסבבים שהוא מחלק, ובפרשת דרכים גם איך צעד בדרך באמת עובד — במקום ארבעת המסלולים הקלאסיים בכל פעם." },
    { kind:"fix",
      en:"A square you may move to is readable on every board: on four of the five maps one whole lane was writing its words in dark brown on a dark colour.",
      he:"משבצת שאפשר לזוז אליה קריאה בכל לוח: בארבע מתוך חמש המפות מסלול שלם כתב את המילים שלו בחום כהה על צבע כהה." },
    { kind:"change",
      en:"The desert's four lanes are four colours now — green, blue, rose and gold — instead of two greens and two blues nobody could tell apart.",
      he:"לארבעת המסלולים של המדבר יש עכשיו ארבעה צבעים — ירוק, כחול, ורוד וזהב — במקום שני ירוקים ושני כחולים שאי אפשר היה להבחין ביניהם." }
  ]},

  { v:"0.8.0", date:"2026-09-08", lines:[
    { kind:"new",
      en:"The token drops. When somebody gets the word, the token falls into the reveal, lands with a bounce, and only then does the confetti go.",
      he:"האסימון נופל. כשמישהו קולט את המילה, האסימון נופל לתוך מסך התוצאה, נוחת עם קפיצה, ורק אז יוצא הקונפטי." },
    { kind:"change",
      en:"On the screen every square wears its twist's own print instead of the word, and a Legend button in the corner says what each print is.",
      he:"על המסך כל משבצת עונדת את הסימן של הסוג שלה במקום המילה, וכפתור מקרא בפינה אומר מה כל סימן." },
    { kind:"fix",
      en:"A square you have chosen but not yet confirmed lights up in its own colour, on the phone and on the screen, instead of being ringed in black.",
      he:"משבצת שבחרתם ועוד לא אישרתם נדלקת בצבע שלה, בטלפון ועל המסך, במקום להיות מוקפת בשחור." },
    { kind:"change",
      en:"The wildcard square on the screen flies a question mark now — a glowing sign hovering over the square with sparks about it, so the one square that rolls something is the one you want to reach.",
      he:"משבצת ההפתעה על המסך מניפה עכשיו סימן שאלה — שלט זוהר מרחף מעל המשבצת עם ניצוצות סביבו, כך שהמשבצת האחת שמגרילה משהו היא זו שרוצים להגיע אליה." },
    { kind:"fix",
      en:"A long board — three players is eighteen rows — closes its squares up a little instead of running its start and its flag off the coast.",
      he:"לוח ארוך — שלושה שחקנים זה שמונה־עשרה שורות — מצופף קצת את המשבצות במקום להריץ את ההתחלה והדגל אל מחוץ לחוף." },
    { kind:"rules",
      en:"Each board now has a taste of its own: Twist plays the word rounds, Storm the five hard ones, Sprint the gentle ones with a single Gamble lane, while Classic and Chaos still deal all ten kinds.",
      he:"\u05dc\u05db\u05dc \u05dc\u05d5\u05d7 \u05d9\u05e9 \u05e2\u05db\u05e9\u05d9\u05d5 \u05d0\u05d5\u05e4\u05d9 \u05de\u05e9\u05dc\u05d5: \u05ea\u05e4\u05e0\u05d9\u05ea \u05de\u05e9\u05d7\u05e7\u05ea \u05d0\u05ea \u05e1\u05d1\u05d1\u05d9 \u05d4\u05de\u05d9\u05dc\u05d9\u05dd, \u05e1\u05d5\u05e4\u05d4 \u05d0\u05ea \u05d7\u05de\u05e9\u05ea \u05d4\u05e7\u05e9\u05d9\u05dd, \u05e1\u05e4\u05e8\u05d9\u05e0\u05d8 \u05d0\u05ea \u05d4\u05e0\u05d5\u05d7\u05d9\u05dd \u05e2\u05dd \u05de\u05e1\u05dc\u05d5\u05dc \u05d4\u05d9\u05de\u05d5\u05e8 \u05d4\u05d9\u05d7\u05d9\u05d3, \u05d5\u05e7\u05dc\u05d0\u05e1\u05d9 \u05d5\u05ea\u05d5\u05d4\u05d5 \u05d5\u05d1\u05d5\u05d4\u05d5 \u05de\u05d7\u05dc\u05e7\u05d9\u05dd \u05e2\u05d3\u05d9\u05d9\u05df \u05d0\u05ea \u05db\u05dc \u05e2\u05e9\u05e8\u05ea \u05d4\u05e1\u05d5\u05d2\u05d9\u05dd." }
  ]},

  { v:"0.7.0", date:"2026-09-08", lines:[
    { kind:"rules",
      en:"Crossroads is not a board of its own any more but a way to lay any of the five: pick it in the lobby beside the board, and the farm, the jungle, the storm, the desert and the volcano can each be roads and junctions.",
      he:"פרשת דרכים כבר לא לוח משלה אלא דרך להניח כל אחד מהחמישה: בוחרים אותה בלובי ליד הלוח, והחווה, הג׳ונגל, הסערה, המדבר והר הגעש יכולים כל אחד להיות דרכים וצמתים." },
    { kind:"change",
      en:"Each place on the screen has a coast of its own now — the meadow rolls, the jungle bulges, the storm's rock is jagged, the desert is a mesa, the volcano is angular — and the board fills more of it, with the road showing between the squares.",
      he:"לכל מקום על המסך יש עכשיו חוף משלו — האחו מתגלגל, הג׳ונגל מתנפח, סלע הסערה משונן, המדבר הוא מישור גבוה, הר הגעש זוויתי — והלוח ממלא יותר ממנו, עם הדרך נראית בין המשבצות." },
    { kind:"change",
      en:"The screen's scenes move more: trees sway, the lighthouse beam sweeps, clouds drag their shadows over the ground, ponds shimmer.",
      he:"הנופים על המסך זזים יותר: עצים מתנדנדים, אלומת המגדלור סורקת, עננים גוררים צל על הקרקע, אגמים מנצנצים." },
    { kind:"fix",
      en:"The windmill turns on every television, and the place can be heard on Crossroads too — it sounds like the jungle it is played in.",
      he:"טחנת הרוח מסתובבת בכל טלוויזיה, ואת המקום אפשר לשמוע גם בפרשת דרכים — הוא נשמע כמו הג׳ונגל שבו משחקים אותו." }
  ]},

  { v:"0.6.0", date:"2026-09-08", lines:[
    { kind:"new",
      en:"A sixth board, Crossroads \u2014 roads and junctions instead of four open lanes, half as many squares, and five of the ten kinds of round drawn fresh for each game.",
      he:"\u05dc\u05d5\u05d7 \u05e9\u05d9\u05e9\u05d9, \u05e4\u05e8\u05e9\u05ea \u05d3\u05e8\u05db\u05d9\u05dd \u2014 \u05d3\u05e8\u05db\u05d9\u05dd \u05d5\u05e6\u05de\u05ea\u05d9\u05dd \u05d1\u05de\u05e7\u05d5\u05dd \u05d0\u05e8\u05d1\u05e2\u05d4 \u05de\u05e1\u05dc\u05d5\u05dc\u05d9\u05dd \u05e4\u05ea\u05d5\u05d7\u05d9\u05dd, \u05d7\u05e6\u05d9 \u05de\u05d4\u05de\u05e9\u05d1\u05e6\u05d5\u05ea, \u05d5\u05d7\u05de\u05d9\u05e9\u05d4 \u05de\u05ea\u05d5\u05da \u05e2\u05e9\u05e8\u05ea \u05e1\u05d5\u05d2\u05d9 \u05d4\u05e1\u05d1\u05d1\u05d9\u05dd \u05e0\u05e9\u05dc\u05e4\u05d9\u05dd \u05de\u05d7\u05d3\u05e9 \u05dc\u05db\u05dc \u05de\u05e9\u05d7\u05e7." }
  ]},

  { v:"0.5.0", date:"2026-09-08", lines:[
    { kind:"new",
      en:"The screen in the room draws each board as a place — a farm, a jungle, a coast in a storm, a desert, a volcano — with the players standing on it, hopping from square to square, and the place can be heard as well as seen.",
      he:"המסך בחדר מצייר כל לוח כמקום — חווה, ג׳ונגל, חוף בסערה, מדבר, הר געש — עם השחקנים עומדים עליו, קופצים ממשבצת למשבצת, ואפשר גם לשמוע את המקום." }
  ]},

  { v:"0.4.0", date:"2026-09-08", lines:[
    { kind:"new",
      en:"What's new. The version at the foot of the first screen opens the list of everything that has changed, and which version it arrived in.",
      he:"מה חדש. הגרסה בתחתית המסך הראשון פותחת את רשימת כל מה שהשתנה, ובאיזו גרסה זה נכנס." },
    { kind:"change",
      en:"Partners now reads the way it is actually played: the whole table sees who the partner is, anyone may still answer, and the giver takes an extra point only if the partner is the one who gets it.",
      he:"שותפים מנוסח סוף־סוף כמו שהוא באמת משוחק: כל השולחן רואה מי השותף, כולם עדיין יכולים לענות, והנותן מקבל נקודה נוספת רק אם דווקא השותף הוא זה שקולט." },
    { kind:"fix",
      en:"Gamble, Duel, Two words and The link have a drawing of their own at the top of the round, like every other kind does. They were the four with a blank where the picture goes.",
      he:"להימור, לדו־קרב, לשתי מילים ולקישור יש ציור משלהם בראש הסבב, כמו לכל שאר הסוגים. הם היו הארבעה עם מקום ריק במקום התמונה." }
  ]},

  { v:"0.3.0", date:"2026-09-08", lines:[
    { kind:"new",
      en:"Three new kinds of round. Duel — the giver names one person and only they may answer. Two words — one sentence for both of them. The link — no sentence at all, three words, and one thing behind them.",
      he:"שלושה סוגי סבב חדשים. דו־קרב — הנותן בוחר אדם אחד ורק הוא עונה. שתי מילים — משפט אחד לשתיהן. הקישור — בלי משפט בכלל, שלוש מילים, ודבר אחד שמחבר ביניהן." },
    { kind:"new",
      en:"Gamble squares. The hard words, the short clock, and two points more if it lands — but a wrong shout costs two, and if nobody gets it the giver goes backwards.",
      he:"משבצות הימור. המילים הקשות, השעון הקצר, ושתי נקודות יותר אם זה נופל — אבל באזה שגוי עולה שתיים, ואם אף אחד לא קולט הנותן יורד אחורה." },
    { kind:"new",
      en:"A screen for the room. Open the same address on a television or a spare tablet and the whole table watches the board, the score and the clock together.",
      he:"מסך לחדר. פותחים את אותה כתובת בטלוויזיה או בטאבלט פנוי, וכל השולחן רואה יחד את הלוח, הניקוד והשעון." },
    { kind:"change",
      en:"A tablet is laid out for a tablet — bigger type, more room, and the board reads held either way up.",
      he:"טאבלט מסודר כמו טאבלט — טקסט גדול יותר, יותר מקום, והלוח נקרא לשני הכיוונים." },
    { kind:"rules",
      en:"The board deals all seven kinds of round instead of mostly dealing one.",
      he:"הלוח מחלק את כל שבעת סוגי הסבב, במקום לחלק בעיקר אחד." },
    { kind:"fix",
      en:"The move screen opens on the moves, and shows what each square you could reach is worth.",
      he:"מסך התזוזה נפתח על התזוזות עצמן, ומראה כמה שווה כל משבצת שאפשר להגיע אליה." }
  ]},

  { v:"0.2.0", date:"2026-09-07", lines:[
    { kind:"new",
      en:"The table can stop. Anyone can call a break, everybody's clock stops where it is, and the game carries on by itself if nobody comes back.",
      he:"אפשר לעצור. כל אחד יכול לבקש הפסקה, השעון של כולם נעצר במקום, ואם אף אחד לא חוזר המשחק ממשיך לבד." },
    { kind:"new",
      en:"Anyone can get up and go mid-game without ending it for everybody else.",
      he:"אפשר לקום וללכת באמצע משחק בלי לסיים אותו לכל השאר." },
    { kind:"change",
      en:"Every build has a name now, so a phone living on a home screen can tell it is running an old one — and get off it in a tap.",
      he:"לכל גרסה יש עכשיו שם, כך שטלפון שיושב על מסך הבית יודע להגיד שהוא על גרסה ישנה — ולרדת ממנה בלחיצה." },
    { kind:"fix",
      en:"A phone holding a group keeps exactly the people it signed up with in the lobby.",
      he:"טלפון שמחזיק קבוצה שומר בדיוק על האנשים שנרשמו איתו בחדר ההמתנה." }
  ]},

  { v:"0.1.0", date:"2026-09-07", lines:[
    { kind:"new",
      en:"Asimon — a party game played across phones on one Wi-Fi. One sentence, one chance.",
      he:"אסימון — משחק חברה שמשוחק על כמה טלפונים באותו Wi‑Fi. משפט אחד, הזדמנות אחת." },
    { kind:"new",
      en:"Hebrew and English, all the way through — the words, the rules and the board.",
      he:"עברית ואנגלית לכל האורך — המילים, הכללים והלוח." },
    { kind:"new",
      en:"Seven cards, four ways to play, five boards, and a wildcard square that rolls something.",
      he:"שבעה קלפים, ארבעה קצבי משחק, חמישה לוחות, ומשבצת ג'וקר שמגרילה משהו." },
    { kind:"new",
      en:"Groups: several people around one phone, scoring together, and the game still remembers who did what.",
      he:"קבוצות: כמה אנשים סביב טלפון אחד, עם ניקוד משותף — והמשחק עדיין זוכר מי עשה מה." },
    { kind:"new",
      en:"Sound, synthesised on the phone itself. Nothing to download.",
      he:"צליל, מסונתז על הטלפון עצמו. אין מה להוריד." },
    { kind:"new",
      en:"How to play on the way in, and a legend for the board on the way to it.",
      he:"הסבר איך משחקים בכניסה, ומקרא ללוח בדרך אליו." }
  ]}

];

/* newest first is how the file is written and how it is read; nothing sorts it
   at runtime, so a mis-ordered file is a test failure rather than a surprise */
const latest = () => RELEASES[0];

/* What a release's own lines say its number has to be. A declared `bump` may
   raise this — 1.0 is an event, not a line count — but never lower it: a
   `new` line cannot be shipped as a patch just because somebody would rather
   it were one. */
function bumpFor(release){
  const earned = (release.lines || []).some(l => MINOR_KINDS.indexOf(l.kind) >= 0)
    ? "minor" : "patch";
  const said = release.bump;
  return (said && RANK[said] > RANK[earned]) ? said : earned;
}
function applyBump(v, bump){
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(v));
  if(!m) throw new Error("not a version: " + v);
  const [maj, min, pat] = m.slice(1).map(Number);
  return bump === "major" ? [maj + 1, 0, 0].join(".")
       : bump === "minor" ? [maj, min + 1, 0].join(".")
       :                    [maj, min, pat + 1].join(".");
}
/* the number the entry at index i must carry, given the one below it. The
   oldest entry has nothing under it and so answers for itself. */
function versionFor(i){
  const r = RELEASES[i], under = RELEASES[i + 1];
  return under ? applyBump(under.v, bumpFor(r)) : r.v;
}

/* what one phone gets: its own language, the kinds in a fixed order so a
   release always reads new, then changed, then fixed */
function forLang(lang, limit){
  const lg = lang === "he" ? "he" : "en";
  return RELEASES.slice(0, limit || RELEASES.length).map(r => ({
    v: r.v, date: r.date,
    lines: r.lines.slice()
      .sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind))
      .map(l => ({ kind: l.kind, text: l[lg] || l.en }))
  }));
}

/* CHANGELOG.md, for whoever is reading the repository rather than playing.
   Generated — game/release.js writes it and game/changelog.test.js checks that
   what is on disk is still what this produces. */
const MD_KIND = { new:"Added", rules:"Rules", change:"Changed", fix:"Fixed" };
function markdown(){
  const out = [
    "# Changelog",
    "",
    "What changed in Asimon, and which version it landed in. The same list the",
    "game itself shows under the version at the foot of the first screen.",
    "",
    "Generated from `game/changelog.js` by `npm run release` — edit that file, not this one.",
    ""
  ];
  RELEASES.forEach(r => {
    out.push("## " + r.v + " — " + r.date, "");
    KINDS.forEach(k => {
      const lines = r.lines.filter(l => l.kind === k);
      if(!lines.length) return;
      out.push("### " + MD_KIND[k], "");
      lines.forEach(l => out.push("- " + l.en.replace(/&mdash;/g, "—")));
      out.push("");
    });
  });
  return out.join("\n");
}

module.exports = { RELEASES, KINDS, MINOR_KINDS, latest, bumpFor, applyBump,
                   versionFor, forLang, markdown };
