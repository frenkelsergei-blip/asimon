/* The rulebook: ten squares, and who gets what on each of them.

   The poster is not the manual — and the how-to-play sheet beside it is the
   on-ramp, not the rulebook. This is the rulebook: one sheet for what every
   round shares, three for the ten squares grouped by what they actually
   change, one for the board underneath them.

   Nothing here is retyped. The variant names and descriptions come out of
   game/engine.js, the card and wildcard copy out of it and public/app.js, the
   palette off public/style.css. A sheet cannot quietly disagree with the game
   it describes. The one thing written by hand is the payout column — that
   lives in scoreRound() as arithmetic, not as copy — so when scoreRound
   changes, the DELTAS table below is the thing to change with it.

   Run:  node design/rules/build.js          the artboards
         node design/rules/build.js --print  those, plus print/*.html         */
"use strict";
const fs = require("fs");
const path = require("path");

const P = f => path.join(__dirname, "../../public", f);
const OUT = f => path.join(__dirname, f);

/* ---------------- the parts, lifted ---------------- */

/* art.js is a browser file; give it just enough of one to load */
const win = { matchMedia: () => ({ matches: false }) };
const art = {};
new Function("window", "g", fs.readFileSync(P("art.js"), "utf8") +
  "\ng.coinSvg = coinSvg; g.wordmark = wordmark; g.modSvg = modSvg;" +
  "\ng.choiceSvg = choiceSvg; g.cardEmblem = cardEmblem; g.faceSvg = faceSvg;" +
  "\ng.CARD_TONE = CARD_TONE; g.PC = PC;")(win, art);

/* the palette, read off the sheet rather than remembered */
const CSS = fs.readFileSync(P("style.css"), "utf8");
const ROOT = CSS.slice(CSS.indexOf(":root{"), CSS.indexOf("\n}", CSS.indexOf(":root{")));
const tok = name => {
  const m = ROOT.match(new RegExp("--" + name + ":\\s*(#[0-9A-Fa-f]{3,8})"));
  if (!m) throw new Error("no --" + name + " in style.css");
  return m[1];
};

const INK    = tok("ink"),    SECOND = tok("second"), MUTED = tok("muted");
const RULE   = tok("rule");
const AMBER  = tok("blind"),  AMBER_I = tok("blind-ink"), AMBER_S = tok("blind-soft");
const GOOD   = tok("good"),   GOOD_D  = tok("good-deep");
const HOT    = tok("guilty"), HOT_D   = tok("guilty-deep");
const VIOLET = tok("violet");

/* the poster's ground, so the printed rulebook and the printed poster are
   recognisably the same object */
const CARD = "#F4F1E7";
const SHEET = "#FFFCF6";

const DISPLAY = "'Suez One', 'Times New Roman', Georgia, serif";
const LOGO    = "'Rubik', system-ui, Arial, sans-serif";
const BODY    = "'Assistant', 'Arial Hebrew', Arial, sans-serif";

const A4 = { w: 794, h: 1123 };          /* 96 px to the inch */

/* the variant and card copy, straight out of the engine, in both languages */
const { createEngine } = require("../../game/engine.js");
const packOf = lang => {
  const e = createEngine();
  e.S = { lang: lang };
  e.applyLang();
  const p = e.packs();
  return { MODS: p.MODS, CARDS: p.CARDS, D: p.D, MODES: e.MODES };
};
const PACK = { en: packOf("en"), he: packOf("he") };

/* the wildcard and board copy lives on the phone, not in the engine */
const APP = (() => {
  const src = fs.readFileSync(P("app.js"), "utf8");
  const s = src.indexOf("{", src.indexOf("const L = {"));
  let depth = 0, j = s;
  for (; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}" && !--depth) { j++; break; }
  }
  return new Function("return " + src.slice(s, j))();
})();

/* ---------------- the payout column ----------------
   Read off scoreRound(). Each entry is what that square CHANGES about the
   page before it — a square that changes nothing carries one line saying so,
   because "nothing" is the answer to the question and deserves printing. */

const DELTAS = {
  en: {
    S: [["", "Nothing changes. Every rule on the first sheet, exactly as it stands."]],
    F: [["The clock", "45 seconds instead of 90."]],
    O: [["The clue", "One word. Not a sentence, not two words."]],
    M: [["The clue", "Acted out. No speaking at all."],
        ["The giver&rsquo;s band flips", "At once: the word <b>+2</b> &middot; in the middle: <b>+1</b> &middot; late: the word. Here they want it read fast."]],
    G: [["The words", "Dealt from the top of the bank &mdash; two hard, two harder &mdash; so long as the giver takes what comes. A topic or a Cold re-deals the round out of the whole bank, cheap words and all."],
        ["The clock", "45 seconds."],
        ["The word", "Worth <b>2 more</b>."],
        ["A wrong shout", "<b>&minus;2</b>, not &minus;1."],
        ["Nobody gets it", "The giver loses <b>1</b>. The only square on the board you can go backwards on."]],
    T: [["The aim", "Drawn by the game, shown to the table, and the giver cannot change it."],
        ["Who may answer", "Everybody, as usual. The partner is a target, not a gate."],
        ["If the partner gets it", "The giver takes <b>1 more</b> &mdash; the ordinary aim bonus, on a target they did not choose."]],
    U: [["The aim", "Named out loud, and the giver&rsquo;s own choice."],
        ["Who may answer", "That one person. Everybody else watches."],
        ["One shout ends it", "Right or wrong. A miss locks out the only person who could answer, so the round is over."],
        ["If they get it", "The giver takes <b>2 more</b>, not 1 &mdash; there was no net."]],
    W: [["The words", "The giver holds two, and gets one sentence for both."],
        ["Each word", "Worth <b>1 less</b> &mdash; though no word ever drops below 1."],
        ["Whoever says a word", "Takes that word&rsquo;s value. The round runs until both are found or the clock stops."],
        ["The giver is paid once", "On the <b>second</b> word, off a band read from its value <b>+1</b>."],
        ["Both home", "<b>1 more</b>. Only one home: the giver takes <b>1</b>, flat."]],
    B: [["Everything turns around", "The table picks the word and sees it. The giver never does &mdash; they are the one guessing."],
        ["The clue", "One word each, round the table, until they crack it."],
        ["No aim, no cost", "There is nobody to aim at, and a wrong guess costs nothing and locks nobody out."],
        ["If they crack it", "The giver takes the word <b>+2</b> / <b>+1</b> / the word, by how fast &mdash; and <b>every other player takes 1</b>."]],
    L: [["No sentence at all", "The giver is dealt a thing and six words that belong to it, and puts three of them up."],
        ["Everybody, at once", "Out loud, as often as they like. A wrong guess costs nothing."],
        ["The answer", "Worth a flat <b>3</b>. No tiers, and no price for the giver to set."],
        ["Everything else", "The frame: whoever names it takes 3, the giver takes their band, the secret aim still pays."]]
  },
  he: {
    S: [["", "שום דבר לא משתנה. כל מה שכתוב בדף הראשון, בדיוק כמו שהוא."]],
    F: [["השעון", "45 שניות במקום 90."]],
    O: [["הרמז", "מילה אחת. לא משפט, ולא שתי מילים."]],
    M: [["הרמז", "הנותן ממחיז אותו. בלי לדבר בכלל."],
        ["הרצועה של הנותן מתהפכת", "מיד: המילה <b>+2</b> &middot; באמצע: <b>+1</b> &middot; מאוחר: המילה. כאן רוצים שיקלטו מהר."]],
    G: [["המילים", "מחולקות מראש הבנק &mdash; שתיים קשות ושתיים קשות יותר &mdash; כל עוד הנותן לוקח מה שיוצא. נושא או ״קר״ מחלקים את הסבב מחדש מכל הבנק, כולל המילים הזולות."],
        ["השעון", "45 שניות."],
        ["המילה", "שווה <b>2 יותר</b>."],
        ["צעקה שגויה", "<b>2&minus;</b>, לא 1&minus;."],
        ["אף אחד לא קלט", "הנותן מאבד <b>נקודה</b>. המשבצת היחידה בלוח שאפשר לרדת בה אחורה."]],
    T: [["הכיוון", "מוגרל על ידי המשחק, מוצג לכל השולחן, והנותן לא יכול לשנות אותו."],
        ["מי יכול לענות", "כולם, כרגיל. השותף הוא מטרה, לא שער."],
        ["אם השותף קולט", "הנותן מקבל <b>נקודה נוספת</b> &mdash; בונוס הכיוון הרגיל, על מטרה שהוא לא בחר."]],
    U: [["הכיוון", "נאמר בקול, ובחירה של הנותן עצמו."],
        ["מי יכול לענות", "האדם האחד הזה. כל השאר מסתכלים."],
        ["צעקה אחת מסיימת", "נכונה או לא. פספוס מוציא את האדם היחיד שיכול היה לענות, ולכן הסבב נגמר."],
        ["אם הוא קולט", "הנותן מקבל <b>2 נוספות</b>, לא 1 &mdash; לא הייתה רשת."]],
    W: [["המילים", "הנותן מחזיק שתיים, ומקבל משפט אחד לשתיהן."],
        ["כל מילה", "שווה <b>נקודה פחות</b> &mdash; אבל אף מילה לא יורדת מתחת ל&#8209;1."],
        ["מי שאומר מילה", "לוקח את שוויה. הסבב רץ עד ששתיהן נמצאו או שהשעון נגמר."],
        ["הנותן מקבל תשלום אחד", "על המילה <b>השנייה</b>, לפי רצועה שנקראת משוויה <b>+1</b>."],
        ["שתיהן נחתו", "<b>נקודה נוספת</b>. רק אחת נחתה: הנותן מקבל <b>1</b>, קבוע."]],
    B: [["הכול מתהפך", "השולחן בוחר את המילה ורואה אותה. הנותן לא רואה אותה בכלל &mdash; הוא זה שמנחש."],
        ["הרמז", "מילה אחת מכל אחד, סביב השולחן, עד שהוא קולט."],
        ["בלי כיוון, בלי מחיר", "אין למי לכוון, וניחוש שגוי לא עולה כלום ולא מוציא אף אחד."],
        ["אם הוא קולט", "הנותן לוקח את המילה <b>+2</b> / <b>+1</b> / המילה, לפי כמה מהר &mdash; ו<b>כל שאר השחקנים לוקחים נקודה</b>."]],
    L: [["בלי משפט בכלל", "הנותן מקבל דבר ושש מילים ששייכות אליו, ומעלה שלוש מהן."],
        ["כולם, בו־זמנית", "בקול, כמה פעמים שרוצים. ניחוש שגוי לא עולה כלום."],
        ["התשובה", "שווה <b>3</b> קבוע. בלי דרגות, ובלי מחיר שהנותן קובע."],
        ["כל השאר", "כמו המסגרת: מי שקולט לוקח 3, הנותן לוקח את הרצועה שלו, והכיוון החשאי עדיין משלם."]]
  }
};

/* the wildcard square's own odds, off WILD_ODDS in the engine. The NAMES are
   lifted from the phone; the lines are not, because the phone's are written
   about a thing that just happened to a named person ("One point off Dana")
   and a rulebook has to say what the rule is. Read off applyWild(). */
const WILD = [["card", 35], ["leap", 20], ["slip", 15], ["steal", 10], ["swap", 10], ["jackpot", 10]];
const WILD_RULE = {
  en: {
    card:    "One of the seven, drawn at random, straight into your hand.",
    leap:    "Two rows forward, for nothing &mdash; never past the last row.",
    slip:    "One row backwards, and never off the board.",
    steal:   "One point off the highest-scoring other unit and onto you &mdash; nothing, if no other unit has one yet.",
    swap:    "You trade squares with somebody genuinely out on the board &mdash; not one on the start line, not one already home.",
    jackpot: "Two points, on the spot."
  },
  he: {
    card:    "אחד משבעת הקלפים, בהגרלה, ישר ליד.",
    leap:    "שתי שורות קדימה, בחינם &mdash; אף פעם לא מעבר לשורה האחרונה.",
    slip:    "שורה אחת אחורה, ואף פעם לא מחוץ ללוח.",
    steal:   "נקודה אחת עוברת מהיחידה האחרת עם הניקוד הגבוה ביותר אליכם &mdash; ולא כלום, אם לאף יחידה אחרת אין עדיין.",
    swap:    "מחליפים משבצת עם מישהו שנמצא באמת על הלוח &mdash; לא בקו הזינוק, ולא כזה שכבר סיים.",
    jackpot: "שתי נקודות, במקום."
  }
};

/* ---------------- copy that is this sheet's own ----------------
   Everything a phone or a poster already says is lifted above. What is left
   is what only a rulebook says: the frame in five lines, the payout table,
   and the board's arithmetic. */

const COPY = {
  en: {
    dir: "ltr", lang: "en",
    sheets: ["Every round", "The clue changes", "The stakes change", "Who answers changes",
             "The round changes shape", "The board", "Cards and wildcards"],
    subs: [
      "Ten kinds of round sit on the board. This page is what they all share &mdash; the six after it say only what changes.",
      "Four squares that go after the sentence &mdash; what the giver may say, and how long they have to say it.",
      "Two squares that change what a word is worth before anybody has said a thing.",
      "Two squares that put a name on the round &mdash; one as a target, one as the only person allowed to answer.",
      "Two squares that give up the one-sentence-one-guesser shape altogether.",
      "Points are steps. The square you stop on is the round you will give next.",
      "What sits on top of the squares: three cards to choose between, or one roll you do not choose at all."
    ],
    beats_k: "The round, in five lines",
    beats: [
      "Four words on the giver&rsquo;s phone, worth <b>1</b> to <b>4</b>. The dearer the word, the harder it is.",
      "The giver sets the price first &mdash; the three below.",
      "The giver aims at one person. Silently, before the clock starts, and they must aim to start.",
      "One sentence, said once. <b>Ninety seconds</b> on the regular clock &mdash; Quick, Slow and Challenge each run their own.",
      "Whoever thinks they have it buzzes and says it out loud. The giver judges."
    ],
    price_k: "The price the giver sets",
    pays_k: "Who gets what",
    pays: [
      ["Whoever gets it", "the word&rsquo;s value", null],
      ["The giver, if it landed <b>at once</b> &mdash; the first quarter of the clock", "1", HOT_D],
      ["&hellip; <b>in the middle</b>", "the word&rsquo;s value", null],
      ["&hellip; <b>late</b> &mdash; the last 30%", "the word&rsquo;s value +1", GOOD_D],
      ["The giver, if the person they aimed at is the one who got it", "1 more", GOOD_D],
      ["A wrong shout", "&minus;1, and that phone is out for the rest of the round", HOT_D],
      ["Nobody gets it", "the giver takes nothing", null]
    ],
    foot: "Scoring is what moves you: the points a round pays are the rows you then walk, and a round pays twice &mdash; the word to whoever got it, the timing to whoever gave it. Points picked up on a wildcard square are score alone and move nobody. A score never drops below zero.",
    diag_k: "How a move works",
    d_card: "CARD", d_end: "END",
    d_here: "you, three points in hand",
    d_fan: "stop on any of these",
    steps_k: "Points are steps",
    steps: [
      "Every point a unit scored this round is one step: one row forward, drifting at most one lane left or right per row. The first step off the start line is the exception &mdash; it may land in any of the four lanes.",
      "You may stop on any square you can reach &mdash; you need not spend every step. You do have to spend one: a unit that scored always moves.",
      "Every square&rsquo;s name is on your phone before you commit, which is what makes the move the real decision in this game."
    ],
    start_k: "Before you have scored",
    start: "A unit that has not scored waits on the start line, which is not a square. It rotates by round number &mdash; <b>Standard, Partners, Fast</b> &mdash; so the whole table is standing on the same one. Past the finish it is always Standard.",
    cards_k: "Card squares",
    cards_d: "Three cards offered, one kept, played later while the clock runs. Every board keeps them in one lane at a fixed interval &mdash; on the classic board, the second lane every third row &mdash; so you can see one coming and steer for it.",
    wild_k: "Wildcard squares",
    wild_d: "The same idea, rarer on four boards of the five, and never in the card squares&rsquo; lane. One roll, applied where you stand and never re-examined &mdash; a leap onto another wildcard stops there.",
    seven_k: "The seven cards",
    win_k: "Winning",
    win: "First unit past the last row takes it. The board is <b>20</b> rows for two racing, <b>17</b> for three, <b>16</b> for four or five, <b>14</b> for six, <b>12</b> for seven or more &mdash; a crowd sharing one phone lengthens it, and the mode and the map move it again. In Challenge <b>20 points</b> takes it as well, whichever arrives first."
  },
  he: {
    dir: "rtl", lang: "he",
    sheets: ["כל סבב", "הרמז משתנה", "המחיר משתנה", "מי עונה משתנה",
             "הסבב מחליף צורה", "הלוח", "קלפים וג׳וקרים"],
    subs: [
      "עשרה סוגי סבב יושבים על הלוח. הדף הזה הוא מה שמשותף לכולם &mdash; ששת הבאים אומרים רק מה משתנה.",
      "ארבע משבצות שהולכות על המשפט &mdash; מה מותר לנותן להגיד, וכמה זמן יש לו להגיד את זה.",
      "שתי משבצות שמשנות כמה מילה שווה עוד לפני שמישהו אמר משהו.",
      "שתי משבצות ששמות שם על הסבב &mdash; אחת כמטרה, ואחת כאדם היחיד שרשאי לענות.",
      "שתי משבצות שנוטשות לגמרי את הצורה של משפט אחד ומנחש אחד.",
      "נקודות הן צעדים. המשבצת שעליה עוצרים היא הסבב שתיתנו בתור הבא.",
      "מה שיושב מעל המשבצות: שלושה קלפים לבחור מהם, או הגרלה אחת שלא בוחרים בה בכלל."
    ],
    beats_k: "הסבב, בחמש שורות",
    beats: [
      "ארבע מילים על הטלפון של הנותן, שוות <b>1</b> עד <b>4</b>. ככל שהמילה שווה יותר, ככה היא קשה יותר.",
      "הנותן קובע קודם את המחיר &mdash; שלושת אלה למטה.",
      "הנותן מכוון לאדם אחד. בשקט, לפני שהשעון מתחיל, וחייבים לכוון כדי להתחיל.",
      "משפט אחד, נאמר פעם אחת. <b>תשעים שניות</b> בשעון הרגיל &mdash; מהיר, איטי ואתגר מריצים כל אחד את שלו.",
      "מי שחושב שהוא קלט לוחץ ואומר בקול. הנותן פוסק."
    ],
    price_k: "המחיר שהנותן קובע",
    pays_k: "מי מקבל מה",
    pays: [
      ["מי שקלט", "שווי המילה", null],
      ["הנותן, אם זה נחת <b>מיד</b> &mdash; ברבע הראשון של השעון", "1", HOT_D],
      ["&hellip; <b>באמצע</b>", "שווי המילה", null],
      ["&hellip; <b>מאוחר</b> &mdash; ב&#8209;30% האחרונים", "שווי המילה 1+", GOOD_D],
      ["הנותן, אם מי שהוא כיוון אליו הוא זה שקלט", "נקודה נוספת", GOOD_D],
      ["צעקה שגויה", "1&minus;, והטלפון הזה בחוץ עד סוף הסבב", HOT_D],
      ["אף אחד לא קלט", "הנותן לא מקבל כלום", null]
    ],
    foot: "מי שצובר, זז: הנקודות שסבב משלם הן השורות שהולכים אחר כך, וסבב שנפתר משלם פעמיים &mdash; המילה למי שקלט, והתזמון למי שנתן. נקודות שמגיעות ממשבצת ג׳וקר הן ניקוד בלבד ולא מזיזות אף אחד. ניקוד לא יורד מתחת לאפס.",
    diag_k: "איך מהלך עובד",
    d_card: "קלף", d_end: "סוף",
    d_here: "אתם, עם 3 נקודות ביד",
    d_fan: "אפשר לעצור בכל אחת מאלה",
    steps_k: "נקודות הן צעדים",
    steps: [
      "כל נקודה שיחידה צברה בסבב היא צעד אחד: שורה אחת קדימה, עם סטייה של נתיב אחד ימינה או שמאלה לכל היותר. הצעד הראשון מקו הזינוק הוא היוצא מן הכלל &mdash; הוא יכול לנחות בכל אחד מארבעת הנתיבים.",
      "אפשר לעצור על כל משבצת שאפשר להגיע אליה &mdash; לא חייבים לנצל את כל הצעדים. צעד אחד כן חייבים: יחידה שצברה תמיד זזה.",
      "השם של כל משבצת מופיע על הטלפון לפני שמאשרים, וזה מה שהופך את המהלך להחלטה האמיתית במשחק הזה."
    ],
    start_k: "לפני שצברתם",
    start: "יחידה שעוד לא צברה ממתינה בקו הזינוק, שהוא לא משבצת. הוא מתחלף לפי מספר הסבב &mdash; <b>רגיל, שותפים, מהיר</b> &mdash; כך שכל השולחן עומד על אותו אחד. אחרי הסיום זה תמיד רגיל.",
    cards_k: "משבצות קלף",
    cards_d: "שלושה קלפים מוצעים, אחד נשמר, ומשוחק אחר כך בזמן שהשעון רץ. כל לוח מחזיק אותם בנתיב אחד ובמרווח קבוע &mdash; בלוח הקלאסי, הנתיב השני בכל שורה שלישית &mdash; כך שאפשר לראות אחד מתקרב ולכוון אליו.",
    wild_k: "משבצות ג׳וקר",
    wild_d: "אותו רעיון, נדיר יותר בארבעה לוחות מתוך חמישה, ולעולם לא בנתיב של משבצות הקלף. הגרלה אחת, מיושמת במקום שבו אתם עומדים ולא נבדקת שוב &mdash; קפיצה על ג׳וקר אחר נעצרת שם.",
    seven_k: "שבעת הקלפים",
    win_k: "ניצחון",
    win: "היחידה הראשונה שעוברת את השורה האחרונה לוקחת. הלוח הוא <b>20</b> שורות לשניים שמתחרים, <b>17</b> לשלושה, <b>16</b> לארבעה או חמישה, <b>14</b> לשישה, <b>12</b> לשבעה ומעלה &mdash; חבורה שחולקת טלפון אחד מאריכה אותו, והמצב והמפה מזיזים אותו שוב. באתגר גם <b>20 נקודות</b> לוקחות, לפי מה שמגיע קודם."
  }
};

/* the three prices, lifted from the engine's own UI pack */
const PRICES = lang => {
  const D = PACK[lang].D;
  return [[D.ch_topic, D.cw_topic], [D.ch_open, D.cw_open], [D.ch_cold, D.cw_cold]];
};

/* which squares go on which sheet, and in what order */
const GROUPS = [["S", "F", "O", "M"], ["G", "W"], ["T", "U"], ["B", "L"]];

/* ---------------- small pieces ---------------- */

/* Every emblem art.js draws is clipped to its own disc, and the clip lives
   in the page rather than the drawing. index.html carries one; a printed
   sheet has to carry its own or every emblem spills past its circle. */
const DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
  '<defs><clipPath id="lsface"><circle cx="20" cy="20" r="20"/></clipPath></defs></svg>';

const n = s => '<bdi dir="ltr">' + s + "</bdi>";

const wordmark = (px, lang) =>
  '<span style="font-family: ' + LOGO + '; font-weight: 800; font-size: ' + px +
  "px; line-height: 1; letter-spacing: " + (lang === "he" ? "0" : ".05em") +
  "; white-space: nowrap; color: " + INK + '; flex: 0 0 auto">' +
  art.wordmark(lang).replace(/<span class="wm[^"]*">/, "").replace(/<\/span>$/, "") + "</span>";

const eyebrow = (text, colour) =>
  '<span style="font-size: 13px; font-weight: 800; letter-spacing: .15em; color: ' +
  (colour || MUTED) + '">' + text + "</span>";

const panel = (inner, style) =>
  '<div style="background: ' + SHEET + "; border: 1px solid " + RULE +
  '; border-radius: 18px; padding: 20px 24px' + (style ? ";" + style : "") + '">' + inner + "</div>";

/* an emblem, boxed so a 46px disc and a 46px gap always agree */
const disc = (svg, px) =>
  '<span style="width: ' + px + "px; height: " + px + "px; flex: 0 0 " + px +
  'px; display: block; line-height: 0">' + svg + "</span>";

/* a sheet's head: the title, one line under it, and the mark */
function head(C, i) {
  return '<div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 24px">' +
    '<div style="display: flex; flex-direction: column; gap: 9px">' +
      '<h1 style="margin: 0; font-family: ' + DISPLAY + '; font-size: 50px; line-height: 1">' +
        C.sheets[i] + "</h1>" +
      '<p style="margin: 0; font-size: 17px; line-height: 1.45; color: ' + SECOND +
        '; max-width: 520px; text-wrap: pretty">' + C.subs[i] + "</p>" +
    "</div>" + wordmark(26, C.lang) + "</div>";
}

const section = (label, inner, gap) =>
  '<div style="display: flex; flex-direction: column; gap: ' + (gap || 13) + 'px">' +
    eyebrow(label) + inner + "</div>";

/* One square. The emblem is the one the phone puts at the top of the round,
   so a player who has seen the notice recognises the page without reading
   it -- which is the whole reason it is here and not on the board. */
function square(key, lang) {
  const M = PACK[lang].MODS[key];
  const rows = DELTAS[lang][key];
  const badge = M.s
    ? '<span style="font-family: ' + LOGO + "; font-weight: 800; font-size: 12px; letter-spacing: .08em; " +
      "line-height: 1; color: " + AMBER_I + "; background: " + AMBER_S +
      '; border-radius: 999px; padding: 6px 10px; flex: 0 0 auto">' + M.s + "</span>"
    : "";

  const row = ([k, v]) =>
    '<div style="display: grid; grid-template-columns: ' + (k ? "158px 1fr" : "1fr") +
      '; column-gap: 16px; align-items: baseline; padding: 9px 0; border-top: 1px solid ' + RULE + '">' +
      (k ? '<span style="font-size: 15px; font-weight: 800; color: ' + INK + '; text-wrap: pretty">' + k + "</span>" : "") +
      '<span style="font-size: 16px; line-height: 1.45; color: ' + SECOND + '; text-wrap: pretty">' + v + "</span>" +
    "</div>";

  return panel(
    '<div style="display: flex; align-items: flex-start; gap: 15px">' +
      disc(art.modSvg(key, 46), 46) +
      '<div style="flex: 1; min-width: 0">' +
        '<div style="display: flex; align-items: center; gap: 11px; margin-bottom: 5px">' +
          '<h2 style="margin: 0; font-family: ' + DISPLAY + '; font-weight: 400; font-size: 26px; line-height: 1.1">' +
            M.n + "</h2>" + badge + "</div>" +
        '<p style="margin: 0; font-size: 16px; line-height: 1.45; color: ' + SECOND +
          '; text-wrap: pretty">' + M.d + "</p>" +
      "</div></div>" +
    '<div style="margin-top: 11px">' + rows.map(row).join("") + "</div>");
}

/* ---------------- the board, drawn ----------------
   The phone's legend draws this same idea in a 220x104 box: a token, and the
   squares a step could reach. In print there is room to show the thing the
   small one cannot -- four lanes, several rows, and the fact that the fan
   widens by one lane a row, which is what makes the move a choice. Node
   shapes and colours are the phone's: a plain dot, a green CARD pill, a
   dashed violet ?, and the dark END. */
function boardDiagram(C) {
  const LANE = [tok("accent"), tok("good"), tok("blind"), tok("guilty")];
  const W = 694, H = 206;
  const rtl = C.dir === "rtl";
  /* rows 1 to 5, then the finish past the last one. Row 0 is deliberately not
     drawn: the start line is not a square, and drawing it as one would be the
     first thing on the sheet to contradict the sheet. */
  const X = r => rtl ? (W - 46 - (r - 1) * 118) : (46 + (r - 1) * 118);
  const Y = c => 28 + c * 48;
  const FINISH = rtl ? W - 46 - 4.8 * 118 : 46 + 4.8 * 118;

  /* three steps out of (1,1), by the engine's own rule: one row on, and at
     most one lane either side -- so the fan widens by a lane a row until the
     edge of the board stops it */
  const FAN = { 2:[0, 1, 2], 3:[0, 1, 2, 3], 4:[0, 1, 2, 3] };
  /* where the classic board actually puts them: cards in lane 1 every third
     row, wildcards in lane 3 every fifth. Scattering them for the picture
     would teach the one thing about this board worth knowing -- that a card
     square is somewhere you can steer FOR -- exactly backwards. */
  const CARDSQ = [3, 1], WILDSQ = [5, 3], HERE = [1, 1];
  const inFan = (r, c) => FAN[r] && FAN[r].indexOf(c) >= 0;

  let out = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" aria-hidden="true" style="display: block">';

  /* four faint tracks, so the lanes are visible as lanes */
  const trackX = rtl ? W - 34 - 4.4 * 118 : 34;
  for (let c = 0; c < 4; c++)
    out += '<rect x="' + trackX + '" y="' + (Y(c) - 11) + '" width="' + (4.4 * 118) +
      '" height="22" rx="11" fill="' + LANE[c] + '" opacity=".1"/>';

  /* one step, drawn: the token to each square a single point could reach */
  FAN[2].forEach(c =>
    out += '<line x1="' + X(HERE[0]) + '" y1="' + Y(HERE[1]) + '" x2="' + X(2) + '" y2="' + Y(c) +
      '" stroke="' + LANE[c] + '" stroke-width="2" opacity=".45" stroke-linecap="round"/>');

  /* every square three steps can still stop on */
  Object.keys(FAN).forEach(r => FAN[r].forEach(c => {
    if (+r === CARDSQ[0] && c === CARDSQ[1]) return;
    out += '<circle cx="' + X(+r) + '" cy="' + Y(c) + '" r="12.5" fill="' + CARD + '"/>' +
      '<circle cx="' + X(+r) + '" cy="' + Y(c) + '" r="12.5" fill="' + LANE[c] + '" opacity=".16"/>' +
      '<circle cx="' + X(+r) + '" cy="' + Y(c) + '" r="12.5" fill="none" stroke="' + LANE[c] +
      '" stroke-width="2"/>';
  }));

  /* the plain squares behind it all */
  for (let r = 1; r <= 5; r++) for (let c = 0; c < 4; c++) {
    if (inFan(r, c) || (r === HERE[0] && c === HERE[1])) continue;
    if (r === CARDSQ[0] && c === CARDSQ[1]) continue;
    if (r === WILDSQ[0] && c === WILDSQ[1]) continue;
    out += '<circle cx="' + X(r) + '" cy="' + Y(c) + '" r="5" fill="' + RULE + '"/>';
  }

  const text = (x, y, str, size, weight, colour, face, anchor) =>
    '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || "middle") + '" font-family="' +
    (face || BODY).replace(/'/g, "") + '" font-size="' + size + '" font-weight="' + weight +
    '" fill="' + colour + '">' + str + "</text>";

  /* a card square and a wildcard square, drawn the way the phone draws them */
  out += '<rect x="' + (X(CARDSQ[0]) - 26) + '" y="' + (Y(CARDSQ[1]) - 12.5) +
    '" width="52" height="25" rx="12.5" fill="' + GOOD + '" stroke="' + LANE[CARDSQ[1]] +
    '" stroke-width="2"/>' +
    text(X(CARDSQ[0]), Y(CARDSQ[1]) + 4, C.d_card, 10.5, 800, "#FFFFFF");
  out += '<circle cx="' + X(WILDSQ[0]) + '" cy="' + Y(WILDSQ[1]) + '" r="12.5" fill="' + SHEET +
    '" stroke="' + VIOLET + '" stroke-width="2.2" stroke-dasharray="4 3.2"/>' +
    text(X(WILDSQ[0]), Y(WILDSQ[1]) + 5.4, "?", 16, 400, VIOLET, DISPLAY);

  /* where the unit is standing: a face, because that is what a unit is */
  out += '<g transform="translate(' + (X(HERE[0]) - 18) + "," + (Y(HERE[1]) - 18) + ') scale(.9)">' +
    art.faceSvg("boy", 40).replace(' class="face"', "") + "</g>" +
    '<circle cx="' + X(HERE[0]) + '" cy="' + Y(HERE[1]) + '" r="18.6" fill="none" stroke="' +
    CARD + '" stroke-width="3"/>';

  /* the finish, past the last row */
  out += '<rect x="' + (FINISH - 28) + '" y="' + (Y(1.5) - 14) +
    '" width="56" height="28" rx="14" fill="' + INK + '"/>' +
    text(FINISH, Y(1.5) + 4.8, C.d_end, 11.5, 800, "#FFFFFF");

  /* two labels, under the board so nothing sits on a lane */
  out += text(X(HERE[0]) + (rtl ? 22 : -22), H - 12, C.d_here, 12.5, 700, INK, null, "start");
  out += text(X(3), H - 12, C.d_fan, 12.5, 700, SECOND);

  return out + "</svg>";
}

/* the four kinds of square, drawn once each beside what the phone calls
   them. The shapes are the phone legend's: a plain dot, a green CARD pill, a
   dashed violet ?, and the dark END. */
function nodeKey(C, lang) {
  const A = APP[lang];
  const box = inner =>
    '<svg viewBox="0 0 54 26" width="54" height="26" aria-hidden="true" style="display: block; flex: 0 0 54px">' +
    inner + "</svg>";
  const mid = (str, size, colour, face, weight) =>
    '<text x="27" y="' + (size > 12 ? 18.4 : 17) + '" text-anchor="middle" font-family="' +
    (face || BODY).replace(/'/g, "") + '" font-size="' + size + '" font-weight="' + (weight || 800) +
    '" fill="' + colour + '">' + str + "</text>";

  const items = [
    ["dot",  box('<circle cx="27" cy="13" r="5.4" fill="' + RULE + '"/>'), A.lg_dot],
    ["card", box('<rect x="2" y="1.5" width="50" height="23" rx="11.5" fill="' + GOOD + '"/>' +
                 mid(C.d_card, 10.5, "#FFFFFF")), A.lg_card],
    ["wild", box('<circle cx="27" cy="13" r="12" fill="' + SHEET + '" stroke="' + VIOLET +
                 '" stroke-width="2.2" stroke-dasharray="4 3.2"/>' +
                 mid("?", 15, VIOLET, DISPLAY, 400)), A.lg_wild],
    ["end",  box('<rect x="0" y="0" width="54" height="26" rx="13" fill="' + INK + '"/>' +
                 mid(C.d_end, 11, "#FFFFFF")), A.lg_end]
  ];

  return '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); ' +
    'column-gap: 26px; row-gap: 9px">' +
    items.map(([, svg, label]) =>
      '<div style="display: flex; align-items: center; gap: 13px">' + svg +
      '<span style="font-size: 15.5px; color: ' + SECOND + '">' + label + "</span></div>").join("") +
    "</div>";
}

/* ---------------- the sheets ---------------- */

function frame(lang) {
  const C = COPY[lang];

  const beats = panel(C.beats.map((b, i) =>
    '<div style="display: grid; grid-template-columns: 30px 1fr; column-gap: 15px; align-items: baseline; ' +
      "padding: 8px 0" + (i ? "; border-top: 1px solid " + RULE : "") + '">' +
      '<span style="font-family: ' + LOGO + '; font-weight: 800; font-size: 22px; line-height: 1; color: ' +
        AMBER_I + '">' + n(i + 1) + "</span>" +
      '<span style="font-size: 16.5px; line-height: 1.45; color: ' + SECOND +
        '; text-wrap: pretty">' + b + "</span></div>").join(""));

  /* the same three emblems the giver taps to set the price */
  const price = '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px">' +
    PRICES(lang).map(([k, v], i) =>
      '<div style="background: ' + SHEET + "; border: 1px solid " + RULE +
        '; border-radius: 14px; padding: 12px 14px; display: flex; align-items: flex-start; gap: 10px">' +
        disc(art.choiceSvg(["topic", "open", "cold"][i], 30), 30) +
        '<div style="min-width: 0; display: flex; flex-direction: column; gap: 4px">' +
          '<span style="font-family: ' + DISPLAY + '; font-size: 18px; line-height: 1.15">' + k + "</span>" +
          '<span style="font-size: 14.5px; line-height: 1.4; color: ' + SECOND + '">' + v + "</span>" +
        "</div></div>").join("") + "</div>";

  const pays = panel(C.pays.map(([k, v, colour], i) =>
    '<div style="display: grid; grid-template-columns: 1fr auto; column-gap: 20px; align-items: baseline; ' +
      "padding: 8px 0" + (i ? "; border-top: 1px solid " + RULE : "") + '">' +
      '<span style="font-size: 16px; line-height: 1.4; color: ' + SECOND + '; text-wrap: pretty">' + k + "</span>" +
      '<span style="font-family: ' + LOGO + '; font-weight: 800; font-size: 16px; line-height: 1.3; text-align: ' +
        (C.dir === "rtl" ? "left" : "right") + "; color: " + (colour || INK) + '">' + v + "</span></div>").join(""));

  return sheet(C, 0,
    section(C.beats_k, beats) +
    section(C.price_k, price) +
    section(C.pays_k, pays) +
    '<div style="flex-grow: 1; display: flex; align-items: flex-end">' +
      '<p style="margin: 0; font-size: 15.5px; line-height: 1.5; color: ' + MUTED +
        '; text-wrap: pretty">' + C.foot + "</p></div>");
}

const squares = (lang, g) =>
  sheet(COPY[lang], g + 1, GROUPS[g].map(k => square(k, lang)).join(""));

function board(lang) {
  const C = COPY[lang];

  const prose = str => '<p style="margin: 0; font-size: 16px; line-height: 1.5; color: ' + SECOND +
    '; text-wrap: pretty">' + str + "</p>";

  const steps = panel(C.steps.map((s, i) =>
    '<div style="margin-top: ' + (i ? "10px" : "0") + '">' + prose(s) + "</div>").join(""));
  const start = panel(prose(C.start));
  const win = panel(prose(C.win));

  return sheet(C, 5,
    section(C.diag_k, panel(boardDiagram(C) +
      '<div style="margin-top: 10px; padding-top: 13px; border-top: 1px solid ' + RULE + '">' +
      nodeKey(C, lang) + "</div>", "padding: 14px 18px 14px")) +
    section(C.steps_k, steps) +
    section(C.start_k, start) +
    section(C.win_k, win));
}

function extras(lang) {
  const C = COPY[lang], A = APP[lang], K = PACK[lang].CARDS;

  const heads = panel('<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); ' +
    'column-gap: 26px">' +
    [[C.cards_k, C.cards_d], [C.wild_k, C.wild_d]].map(([k, d]) =>
      '<div style="display: flex; flex-direction: column; gap: 4px">' +
        '<span style="font-family: ' + DISPLAY + '; font-size: 19px">' + k + "</span>" +
        '<span style="font-size: 15.5px; line-height: 1.45; color: ' + SECOND + '; text-wrap: pretty">' +
          d + "</span></div>").join("") + "</div>", "padding: 14px 22px");

  const wild = panel(WILD.map(([k, w], i) =>
    '<div style="display: grid; grid-template-columns: 40px 124px 1fr; column-gap: 14px; align-items: baseline; ' +
      "padding: 4px 0" + (i ? "; border-top: 1px solid " + RULE : "") + '">' +
      '<span style="font-family: ' + LOGO + '; font-weight: 800; font-size: 15px; color: ' + AMBER_I + '">' +
        n(w + "%") + "</span>" +
      '<span style="font-size: 16px; font-weight: 800">' + A["wild_" + k] + "</span>" +
      '<span style="font-size: 16px; line-height: 1.45; color: ' + SECOND + '; text-wrap: pretty">' +
        WILD_RULE[lang][k] + "</span></div>").join(""));

  /* the emblem beside each card is the tile the phone shows in your hand and
     in the banner when somebody plays one -- the picture is how you find the
     rule for the card you are holding */
  const seven = panel(Object.keys(K).map((k, i) =>
    '<div style="display: flex; align-items: center; gap: 14px; ' +
      "padding: 4px 0" + (i ? "; border-top: 1px solid " + RULE : "") + '">' +
      disc(art.cardEmblem(k, 32), 32) +
      '<span style="font-size: 16px; font-weight: 800; flex: 0 0 106px">' + K[k].n + "</span>" +
      '<span style="font-size: 16px; line-height: 1.45; color: ' + SECOND + '; text-wrap: pretty">' +
        K[k].d + "</span></div>").join(""));

  return sheet(C, 6, heads + wild + section(C.seven_k, seven));
}

/* the page every sheet is printed on */
const sheet = (C, i, inner) =>
  '<div style="width: ' + A4.w + "px; height: " + A4.h + "px; background: " + CARD + "; color: " + INK +
  "; direction: " + C.dir + "; font-family: " + BODY + '; position: relative; overflow: hidden; ' +
  'display: flex; flex-direction: column; gap: 16px; padding: 40px 50px; box-sizing: border-box">' +
  DEFS + head(C, i) + inner + "</div>";

/* ---------------- writing it out ---------------- */

const FONTS = "https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800" +
  "&family=Rubik:wght@500;700;800&family=Suez+One&display=swap";

const SHEETS = [];
["en", "he"].forEach(lang => {
  const pre = lang === "en" ? "" : "He";
  SHEETS.push({ file: (lang === "en" ? "Main" : "HeMain") + ".dc.html", lang, i: 0, html: () => frame(lang) });
  GROUPS.forEach((_, g) =>
    SHEETS.push({ file: pre + "Squares" + (g + 1) + ".dc.html", lang, i: g + 1, html: () => squares(lang, g) }));
  SHEETS.push({ file: pre + "Board.dc.html",  lang, i: 5, html: () => board(lang) });
  SHEETS.push({ file: pre + "Extras.dc.html", lang, i: 6, html: () => extras(lang) });
});

const dc = body => '<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n' +
  '  <script src="./support.js"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n' +
  '  <link rel="stylesheet" href="' + FONTS + '">\n  <style>\n' +
  "    body { margin: 0; }\n    a { color: " + AMBER_I + "; } a:hover { color: " + INK + "; }\n" +
  "  </style>\n</helmet>\n\n" + body + "\n</x-dc>\n</body>\n</html>\n";

const print = (body, C) => '<!doctype html>\n<html lang="' + C.lang + '" dir="' + C.dir + '">\n<head>\n' +
  '<meta charset="utf-8">\n<link rel="stylesheet" href="' + FONTS + '">\n<style>\n' +
  "  @page { size: " + A4.w + "px " + A4.h + "px; margin: 0 }\n" +
  "  html, body { margin: 0; padding: 0; background: #fff }\n" +
  "  * { -webkit-print-color-adjust: exact; print-color-adjust: exact }\n" +
  "</style>\n</head>\n<body>\n" + body + "\n</body>\n</html>\n";

const canvas = {
  pages: [{ id: "page-en", name: "English" }, { id: "page-he", name: "עברית" }],
  artboards: SHEETS.map(s => ({
    file: s.file,
    x: (s.i % 4) * (A4.w + 120), y: Math.floor(s.i / 4) * (A4.h + 170), w: A4.w, h: A4.h,
    title: COPY[s.lang].sheets[s.i],
    print: "fixed",
    page: s.lang === "en" ? "page-en" : "page-he"
  })),
  annotations: [
    { id: "en-brief", x: 0, y: -150, w: 620, page: "page-en",
      text: "The rulebook. Sheet one is the frame every round shares; the next three are the ten squares,\ngrouped by what they actually change; the last is the board underneath them.\n\nGenerated by design/rules/build.js — the names, descriptions and card copy are read out of\ngame/engine.js and public/app.js, so this cannot drift from the game. The payout rows are\nhand-written off scoreRound()." },
    { id: "he-brief", x: 0, y: -150, w: 620, page: "page-he",
      text: "אותם חמישה דפים, בעברית." }
  ],
  launch: { view: "canvas", page: "page-en" }
};

const wantPrint = process.argv.includes("--print");
const printDir = process.argv[process.argv.indexOf("--print") + 1] || path.join(__dirname, "print");

for (const s of SHEETS) {
  const body = s.html();
  fs.writeFileSync(OUT(s.file), dc(body));
  if (wantPrint) {
    fs.mkdirSync(printDir, { recursive: true });
    fs.writeFileSync(path.join(printDir, s.file.replace(".dc.html", ".html")), print(body, COPY[s.lang]));
  }
}
fs.writeFileSync(OUT("canvas.json"), JSON.stringify(canvas, null, 2) + "\n");

console.log(SHEETS.map(s => s.file).join(", ") + (wantPrint ? "  → " + printDir : ""));
