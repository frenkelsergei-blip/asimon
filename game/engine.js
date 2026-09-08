/* The rules, and all the content.

   This file was generated once, out of the pass-and-play build, and it is not
   generated any more: the game modes, the six maps, the wildcard square and
   the board's own balance were all written here by hand and were never in that
   build. Regenerating would delete them. game/build-engine.js is kept only as
   a record of where the file came from, and refuses to run.

   Edit this file directly. `npm test` is the net, and `npm run playtest` says
   what a change did to the game.                                            */
"use strict";

/* One engine per room. Every extracted function closes over this instance's
   own `S`, so two rooms can never see each other's state. */
function createEngine(){
  /* ============ language ============ */
  let W, UI, CARDS, MODS, TOPICS, LINKS, TIER, CARDKEYS, D;
  function applyLang(){
    const P = (S && S.lang === "he") ? HE : EN;
    W = P.words; CARDS = P.cards; MODS = P.mods; TOPICS = P.topics; LINKS = P.links; D = P.ui;
    TIER = {}; [2,3,4,5].forEach(v => W[v].forEach(x => { TIER[x] = v; }));
    CARDKEYS = Object.keys(CARDS);
  }
  function t(k,a,b){ let v=(D&&D[k]!==undefined)?D[k]:k;
    if(a!==undefined) v=v.split("{0}").join(a);
    if(b!==undefined) v=v.split("{1}").join(b); return v; }

  /* ============ words: four tiers, four values ============ */
  const EN_WORDS = {
   2:["couch","spoon","elephant","socks","pizza","umbrella","mirror","ladder","pillow","kettle",
      "balloon","hammer","candle","blanket","bucket","guitar","tractor","sandwich","bicycle","chicken",
      "toaster","suitcase","penguin","scissors","pencil","carrot","curtain","wallet","shoelace","doorbell","mattress","snail","whistle","jigsaw","raincoat","teapot","marble","sponge","magnet","wheelbarrow"],
   3:["jealous","whisper","stubborn","neighbour","rescue","promise","gossip","holiday","shortcut","argument",
      "apology","souvenir","rumour","favour","patience","revenge","chore","routine","borrow","deadline",
      "nervous","generous","complain","celebrate","forgive","exhausted","curious","disappointed","grateful","impatient","embarrassed","relieved","tradition","superstition","nickname","curfew","allowance","reunion","tantrum","homework"],
   4:["Tuesday","awkward","leftovers","expired","overrated","coincidence","reputation","hypocrite","small talk","plot twist",
      "group chat","autopilot","jet lag","cold feet","backup plan","side effect","blind spot","false alarm","running joke","red tape",
      "eavesdrop","procrastinate","nostalgia","overshare","spoiler","cliffhanger","micromanage","ghosting","doomscrolling","icebreaker","buzzword","loophole","scapegoat","understatement","double standard","pet peeve","comfort food","small print","rain check","the last word",
      "screen time","a dead battery","airplane mode","a read receipt","a group chat you cannot leave"],
   5:["homesick","bittersweet","deja vu","inside joke","comfort zone","silver lining","wake-up call","second wind","growing pains","empty nest",
      "culture shock","last resort","open secret","gut feeling","safety net","white lie","guilt trip","midlife crisis","learning curve","slippery slope",
      "cabin fever","catch-22","cold shoulder","devil’s advocate","foot in the door","ivory tower","olive branch","paper trail","second nature","storm in a teacup","tip of the iceberg","chip on your shoulder","blessing in disguise","needle in a haystack","elephant in the room",
      "imposter syndrome","the algorithm","left on read","a red flag","main character energy","FOMO","burnout","a soft launch"]
  };
  const HE_WORDS = {
   2:["ספה","כפית","פיל","גרביים","פיצה","מטרייה","מראה","סולם","כרית","קומקום",
      "בלון","פטיש","נר","שמיכה","דלי","גיטרה","טרקטור","כריך","אופניים","תרנגולת",
      "מצנם","מזוודה","פינגווין","מספריים","עיפרון","גזר","וילון","ארנק","שרוך","פעמון דלת","מזרן","חילזון","משרוקית","פאזל","מעיל גשם","קנקן","גולה","ספוג","מגנט","מריצה"],
   3:["מקנא","ללחוש","עקשן","שכן","להציל","הבטחה","רכילות","חופשה","קיצור דרך","ויכוח",
      "התנצלות","מזכרת","שמועה","טובה","סבלנות","נקמה","מטלה","שגרה","לשאול","דדליין",
      "לחוץ","נדיב","להתלונן","לחגוג","לסלוח","מותש","סקרן","מאוכזב","אסיר תודה","חסר סבלנות","נבוך","הוקל לו","מסורת","אמונה טפלה","כינוי","שעת עוצר","דמי כיס","מפגש מחזור","התקף זעם","שיעורי בית"],
   4:["יום שלישי","מביך","שאריות","פג תוקף","צירוף מקרים","מוניטין","צבוע","שיחת חולין","תפנית בעלילה","קבוצת ווטסאפ",
      "טייס אוטומטי","ג׳ט לג","רגליים קרות","תוכנית גיבוי","תופעת לוואי","נקודה עיוורת","אזעקת שווא","בדיחה חוזרת","בירוקרטיה","מוערך יתר על המידה",
      "לצותת","לדחות למחר","נוסטלגיה","לשתף יותר מדי","ספוילר","סוף פתוח","ניהול זעיר","היעלמות פתאומית","גלילה אינסופית","שובר קרח","מילת באזז","פרצה בחוק","שעיר לעזאזל","לשון המעטה","איפה ואיפה","מה שמעצבן אותי","אוכל מנחם","האותיות הקטנות","לדחות לפעם אחרת","המילה האחרונה",
      "זמן מסך","סוללה שנגמרה","מצב טיסה","אישור קריאה","קבוצה שאי אפשר לצאת ממנה"],
   5:["געגועים הביתה","מתוק־מר","דז׳ה וו","בדיחה פנימית","אזור הנוחות","צד חיובי","קריאת השכמה","רוח שנייה","כאבי גדילה","קן ריק",
      "הלם תרבותי","מוצא אחרון","סוד גלוי","תחושת בטן","רשת ביטחון","שקר לבן","חוכמה שבדיעבד","משבר אמצע החיים","עקומת למידה","מדרון חלקלק",
      "לטפס על הקירות","מלכוד 22","פרקליט השטן","רגל בדלת","מגדל שן","ענף זית","טבע שני","סערה בכוס מים","קצה הקרחון","ברכה במסווה","מחט בערימת שחת","חרב פיפיות","קו אדום","שלום בית","הפיל שבחדר",
      "תסמונת המתחזה","האלגוריתם","נקרא ולא נענה","דגל אדום","אנרגיה של דמות ראשית","פומו","שחיקה","השקה רכה"]
  };

  /* ============ cards ============ */
  const EN_CARDS = {
   stopwatch:{n:"Stopwatch",  d:"Slam the clock down to 30 seconds, right now."},
   insight:  {n:"Insight",    d:"All four words the giver was offered go up on the screen. It is one of these."},
   veto:     {n:"Veto",       d:"The giver must say a brand new sentence, and may not reuse a single word from the first."},
   mime:     {n:"Mime",       d:"The giver must deliver the whole thing again with no words at all."},
   double:   {n:"Double",     d:"Whatever you score this round, double it."},
   swap:     {n:"Switch",     d:"Only the giver may play this. Change to a different word. Anyone already locked out stays locked out."},
   blindfold:{n:"Blindfold",  d:"The next round turns Blind. Whoever gives next has to guess instead, while everybody else sees the word."}
  };
  const HE_CARDS = {
   stopwatch:{n:"סטופר",   d:"מורידים את השעון ל־30 שניות, עכשיו."},
   insight:  {n:"הצצה",    d:"כל ארבע המילים שהוצעו לרמז עולות למסך. זו אחת מהן."},
   veto:     {n:"וטו",     d:"הרמז חייב להגיד משפט חדש לגמרי, בלי להשתמש אפילו במילה אחת מהראשון."},
   mime:     {n:"פנטומימה",d:"הרמז חייב להעביר את זה שוב, בלי מילים בכלל."},
   double:   {n:"כפול",    d:"כל מה שתצברו בסבב הזה — כפול."},
   swap:     {n:"החלפה",   d:"רק הרמז יכול להפעיל. מחליפים למילה אחרת. מי שכבר נפסל נשאר פסול."},
   blindfold:{n:"כיסוי עיניים", d:"הסבב הבא הופך לעיוור. מי שאמור לתת רמז יצטרך לנחש במקום, וכל השאר יראו את המילה."}
  };

  /* ============ board modifiers ============ */
  const EN_MODS = {
   S:{n:"Standard", s:"", d:"Ninety seconds. One sentence, said once."},
   F:{n:"Fast",     s:"FAST", d:"Forty-five seconds. Everything else the same."},
   O:{n:"One word", s:"ONE", d:"The giver&rsquo;s clue must be a single word. Not two."},
   M:{n:"Mime",     s:"MIME", d:"No speaking at all &mdash; the giver acts it out. And the clock flips: here the giver wants it read <em>fast</em>, not late."},
   B:{n:"Blind",    s:"BLIND", d:"Everything turns around. The giver becomes the guesser, everybody else sees the word, and you each give one word until they crack it."},
   G:{n:"Gamble",   s:"BET", d:"A real bet. The board deals the hard words and starts the short clock &mdash; so the word is worth <strong>two</strong> more, a wrong shout costs two, and if nobody gets it at all the giver loses one. Nearly a third of them die. The only square you can go backwards on."},
   T:{n:"Partners", s:"PAIR", d:"The game draws the giver a partner, and the whole table sees who. Anyone may still answer &mdash; but if that partner is the one who gets it, the giver takes a point more."},
   U:{n:"Duel",     s:"DUEL", d:"The giver names one person out loud, and only that person may answer. Everybody else watches. One shout, right or wrong, and the round is over."},
   W:{n:"Two words", s:"TWO", d:"The giver holds two words and gets one sentence for both. Each is worth a point less, and the round runs until both are found or the clock stops. Whoever says one takes it."},
   L:{n:"The link",  s:"LINK", d:"No sentence at all. The giver is given a thing and six words that belong to it, and puts three of them up. Everybody guesses at once, out loud, as often as they like &mdash; what connects them?"}
  };
  const HE_MODS = {
   S:{n:"רגיל",     s:"", d:"תשעים שניות. משפט אחד, נאמר פעם אחת."},
   F:{n:"מהיר",     s:"מהיר", d:"ארבעים וחמש שניות. כל השאר אותו דבר."},
   O:{n:"מילה אחת", s:"מילה", d:"הרמז של הנותן חייב להיות מילה אחת. לא שתיים."},
   M:{n:"פנטומימה", s:"מחזה", d:"בלי לדבר בכלל &mdash; הנותן ממחיז. והשעון מתהפך: כאן הנותן רוצה שיקלטו <em>מהר</em>, לא מאוחר."},
   B:{n:"עיוור",    s:"עיוור", d:"הכול מתהפך. הנותן הופך למנחש, כל השאר רואים את המילה, וכל אחד אומר מילה אחת עד שהוא קולט."},
   G:{n:"הימור",    s:"הימור", d:"הימור אמיתי. הלוח מחלק את המילים הקשות ומפעיל את השעון הקצר &mdash; ולכן המילה שווה <strong>שתי</strong> נקודות יותר, באזה שגוי עולה 2, ואם אף אחד לא קולט בכלל הנותן מאבד נקודה. כמעט שליש מהם מתים. המשבצת היחידה שאפשר לרדת בה אחורה."},
   T:{n:"שותפים",   s:"זוג", d:"המשחק מגריל לנותן שותף, וכל השולחן רואה מי. כולם עדיין יכולים לענות &mdash; אבל אם דווקא השותף הוא זה שקולט, הנותן מקבל נקודה נוספת."},
   U:{n:"דו־קרב",   s:"קרב", d:"הנותן בוחר אדם אחד בקול, ורק הוא יכול לענות. כל השאר מסתכלים. צעקה אחת, נכונה או לא, והסבב נגמר."},
   W:{n:"שתי מילים", s:"שתיים", d:"הנותן מחזיק שתי מילים ומקבל משפט אחד לשתיהן. כל אחת שווה נקודה פחות, והסבב רץ עד ששתיהן נמצאו או שהשעון נגמר. מי שאומר מילה לוקח אותה."},
   L:{n:"הקישור",   s:"קישור", d:"בלי משפט בכלל. הנותן מקבל דבר ושש מילים ששייכות אליו, ומעלה שלוש מהן. כולם מנחשים בו־זמנית, בקול, כמה פעמים שרוצים &mdash; מה מחבר ביניהן?"}
  };

  /* ============ game modes ============
     Every game is played inside a mode: how long the clock runs, how many
     rows the board carries, how the four column-mods get skewed away from
     the map's own baseline pattern, and how the game decides its winner.
     "regular" is deliberately inert on every one of these knobs — a game
     played with modeId "regular" must come out identical to the game this
     engine played before modes existed at all. That is the safety net. */
  const MODES = {
   quick:    { id:"quick",     timer:{ normal:60,  fast:30 }, rowsDelta:-3,
               reweighChance:0.35, modWeights:{ S:6, F:3, O:1, G:1, T:1, U:2, W:2, M:0, B:0, L:0 }, win:"first" },
   regular:  { id:"regular",   timer:{ normal:90,  fast:45 }, rowsDelta:0,
               reweighChance:0,    modWeights:null, win:"first" },
   /* Slow is the long clock and nothing else. Two minutes a round is already
      a longer evening, and every extra row on top of it ran a quarter of those
      games past forty minutes — first at four rows, then again at one once
      Duel started leaving more rounds unanswered. */
   slow:     { id:"slow",      timer:{ normal:120, fast:60 }, rowsDelta:0,
               reweighChance:0.35, modWeights:{ S:6, F:1, O:1, G:1, T:1, U:2, W:2, M:0, B:0, L:1 }, win:"first" },
   challenge:{ id:"challenge", timer:{ normal:75,  fast:35 }, rowsDelta:0,
               reweighChance:0.5,  modWeights:{ S:1, F:1, O:3, M:3, B:3, G:2, T:1, U:2, W:2, L:3 }, win:"score", scoreTarget:20 }
  };

  /* ============ interface strings ============ */
  const EN_UI = {
   lang_k:"Language", kick:"One sentence &middot; one shot", tagline:"Pick a word. Aim a single sentence at one person. Land it as late as you can.",
   whos:"Who&rsquo;s playing?", add:"+ Add player", player_ph:"Player {0}",
   mode_k:"How are you playing?", mode_solo:"Every player for themselves", mode_teams:"In pairs",
   mode_solo_d:"You secretly aim at one person each round.", mode_teams_d:"You aim at your partner &mdash; and the other side can steal it.",
   start:"Start the game", need3:"Need at least 3 players", need4:"Pairs need at least 4 players",
   target_note:"First to the end of the board wins &mdash; {0} rows, about ten rounds, 25 minutes.",
   setup_note:"The phone goes to the giver, then into the middle of the table.",
   howto:"How to play", start_over:"Start over", back:"Back", close:"Close",
   pass_to:"Pass the phone to", giver_k:"Round {0} &middot; the giver", look_away:"Everybody else: look away.",
   im:"I&rsquo;m {0}", hold:"Press and hold<br>to see your four words", hold_again:"Hold again to re-read",
   release:"Let go and they hide again.", hold_note:"Only you may see these. Hold the panel to read them.",
   pick_word:"Pick your word", pick_word_d:"Harder words pay more. But if nobody gets it, you score nothing.",
   chal_k:"How hard do you want it?", per_word:"per word", topic_k:"Pick a topic", topic_is:"Topic",
   payoff_k:"You only score if somebody gets it", chal_pick_k:"Pick your difficulty",
   po_best:"Lands late", po_best_d:"you take the most",
   po_meh:"Lands instantly", po_meh_d:"you take just 1",
   po_m_best:"Read instantly", po_m_meh:"Read slowly", po_m_meh_d:"you take less",
   po_none:"Nobody gets it", po_none_d:"you take nothing",
   cw_topic:"every word worth 1 less", cw_open:"words worth what they say", cw_cold:"every word worth 1 more",
   ch_topic:"Give them a topic", ch_topic_d:"Four words from one topic &mdash; and the whole table is told what the topic is. Much easier to land, so a point comes off the word.",
   ch_open:"Take what comes", ch_open_d:"Four mixed words, no topic, nobody helped. The word is worth exactly what it says.",
   ch_cold:"Cold", ch_cold_d:"One word, dealt to you. No choice, no topic, no way out. A point on top.",
   cold_k:"Your word &mdash; no choice", cold_d:"You are stuck with it. Make it land.",
   shot_k:"Aim at one person", shot_d:"Secretly. If they are the one who gets it, you take one more.",
   duel_k:"Name your opponent", duel_d:"Out loud, and the whole table hears it. Only they may answer &mdash; and one shout, right or wrong, ends the round.",
   duel_is:"Answering alone",
   two_k:"Pick two words", two_d:"One sentence for both of them, and each is worth a point less. Tap two &mdash; tap again to change your mind.",
   link_k:"Put three of them up", link_d:"All six belong to it. Choose the three that circle it without pointing at it &mdash; you still want it landing late.",
   link_is:"The link", link_table_h:"What connects these three?",
   link_table_d:"Everybody at once, out loud, as often as you like. A wrong guess costs nothing.",
   link_shown:"On the table",
   two_left:"One still out there", two_got:"{0} said {1}",
   judge_which:"Which one did {0} say?", judge_neither:"Neither of them",
   partner_k:"Your partner this round", partner_d:"If they get it, you both score. The other side can still steal it.",
   ready:"Ready &mdash; put the phone in the middle",
   table_k:"Round {0}", say_it:"Say your sentence. Once.",
   say_it_mime:"Act it out. Once.", say_it_mime_d:"Not a word, not a sound. Everyone else &mdash; shout when you have it.",
   say_it_one:"One word. That is all.", say_it_one_d:"A single word, said once. Everyone else &mdash; shout when you have it.",
   time_up_end:"Time is up &mdash; end the round",
   say_it_d:"Then not another word. Everyone else: shout when you have it.",
   who_buzzed:"Who shouted first?", locked:"out", giver_tag:"giver",
   judge_q:"Did {0} say the right word?", judge_yes:"Yes &mdash; they got it", judge_no:"No",
   time_up:"Time", nobody:"Nobody got it", end_round:"Nobody got it &mdash; end the round",
   play_card:"Play a card", whose_card:"Whose card?", no_cards:"{0} has no card to play.",
   insight_k:"The four words were", veto_k:"Veto", veto_d:"New sentence. No word from the first one.",
   mime_k:"Mime", mime_d:"Again, with no words at all.",
   swap_k:"Switch", swap_d:"Pass the phone back to {0}.", swap_pick:"Pick a different word",
   solved_k:"Round {0} &middot; result", got_it:"{0} got it", the_word:"The word was",
   band_k:"What the timing was worth", got_tag:"got it", standings_k:"On the board &middot; then you move",
   band_early:"Too obvious", band_mid:"Well pitched", band_late:"Almost lost them", band_none:"Nobody",
   band_m_early:"Read instantly", band_m_mid:"Got there", band_m_late:"Only just",
   blind_pick_k:"Everyone except {0} &mdash; pick their word", blind_pick_d:"{0}, look away now. The rest of you choose what they have to guess.",
   blind_look:"{0} &mdash; keep looking away", blind_word:"The word", blind_ready:"Everyone has seen it &mdash; start the clock",
   blind_table_h:"One word each, going round.", blind_table_d:"Each of you says a single word. {0} can shout a guess at any time, as often as they like.",
   blind_got:"{0} got it",
   w_word:"the word +{0}", w_wrong:"wrong shout &minus;{0}", w_early:"solved too fast +1",
   w_mid:"landed well +{0}", w_late:"landed late +{0}", w_helped:"helped +1", w_half:"half of it +1", w_both:"both of them +1", w_shot:"called the shot +{0}", w_partner:"partner got it +{0}", w_double:"doubled to {0}",
   w_fast:"read instantly +{0}", w_ok:"got through +{0}", w_slow:"only just +{0}", w_none:"nobody got it", w_none_x2:"nobody got it &minus;1",
   board_k:"The board &mdash; {0} rows to the end",
   col_0:"Plain", col_1:"Cards", col_2:"Mixed", col_3:"Wild",
   card_node:"CARD", card_node_d:"a card", plain_square:"nothing special", the_end:"the finish", row_n:"Row {0}",
   move_k:"Move &middot; {0}",
   move_h:"{0} &mdash; you have {1} steps", move_h_p:"{0} &mdash; you have {1} steps",
   move_h1:"{0} &mdash; you have one step", move_h1_p:"{0} &mdash; you have one step",
   move_d:"Up to {0} steps &mdash; stopping early is fine. Each step goes straight up, or one column across. Where you stop decides your next round.",
   move_d1:"One step &mdash; straight up, or one column across. Where you stop decides your next round.",
   move_tap:"Tap any lit square &mdash; {0} are in range.",
   move_sel_k:"You would land on", move_cost:"{0} &middot; {1} steps",
   move_queue_k:"{0} scorers move, one at a time",
   move_confirm:"Move here", move_pick:"Tap a square on the board",
   go_move:"Move on the board", card_won:"Card square",  next_round:"Next round", see_won:"See who won", end_game:"End game",
   hands_k:"Cards in hand", evidence_k:"Cards won", evidence_d:"{0} may take a card.",
   take_one:"{0} &mdash; take one", cards_secret:"Cards are secret. Play them whenever you like.",
   board_note:"Points are steps you spend. Every step you may go straight up or one column across, so where you finish is your choice &mdash; and the square you stand on sets your round.",
   after_rounds:"After {0} rounds", wins:"{0} wins", again:"Play again", newp:"New players",
   recovered_k:"Something went wrong", recovered:"We had to start a fresh game",
   recovered_d:"A game saved by an older version could not be continued, so it has been cleared.",
   ht_got:"Got it &mdash; let&rsquo;s play",
   ht_html:'<p class="kicker">How to play</p><h2>Land it at the last second</h2>'+
    '<p class="sub">One player is the <strong>giver</strong>. Everybody else is trying to shout the word first.</p>'+
    '<div class="hstep"><span class="sn">01</span><div><h3>The giver picks a word</h3>'+
      '<p>First they choose how hard they want it: <strong>give the table a topic</strong> (easier, a point off each word), <strong>take what comes</strong>, or go <strong>Cold</strong> &mdash; one word, no choice, no topic, a point on top. Then the words appear on their phone, privately, each worth different points.</p></div></div>'+
    '<div class="hstep"><span class="sn">02</span><div><h3>They secretly aim at one person</h3>'+
      '<p>If that person is the one who gets it, the giver takes 2 extra. Nobody else knows who was picked.</p></div></div>'+
    '<div class="hstep"><span class="sn">03</span><div><h3>One sentence. Said once. Then silence.</h3>'+
      '<p>No follow-ups, no warmer-or-colder, no gestures. Then the phone goes into the middle of the table and the clock runs.</p></div></div>'+
    '<div class="hstep"><span class="sn">04</span><div><h3>Shout when you have it</h3>'+
      '<p>First voice wins. Somebody taps your name and you say the word out loud. <strong>Wrong, and you are out for the rest of the round and lose a point.</strong> Right, and the round ends.</p></div></div>'+
    '<div class="hstep"><span class="sn">05</span><div><h3>The giver wants it to land late</h3>'+
      '<p>Guessed in the first few seconds and the giver only takes 1 &mdash; too obvious. Nobody gets it and the giver takes nothing. The sweet spot is somebody getting it right near the end.</p></div></div>'+
    '<hr class="hr"><p class="kicker">One round, from the outside</p>'+
    '<div class="dlg">'+
      '<div class="row"><span class="w">Dana</span><span class="s">She takes <strong>homesick</strong>, worth 4, and secretly aims at Savta.</span></div>'+
      '<div class="row"><span class="w">Dana</span><span class="s">&ldquo;It is what I felt every Friday in the army.&rdquo;</span></div>'+
      '<div class="row lie"><span class="w">Ilan 0:12</span><span class="s">Shouts &mdash; says &ldquo;lonely&rdquo;. Wrong. He is out, and loses 1.</span></div>'+
      '<div class="row"><span class="w">Savta 0:51</span><span class="s">Shouts &mdash; says &ldquo;homesick&rdquo;. Right.</span></div>'+
    '</div>'+
    '<p class="note">Savta takes 4. Dana takes 4 for landing in the good window, plus 1 because Savta was exactly who she aimed at. Ilan went too early on a hunch and paid for it &mdash; that is the whole game.</p>'+
    '<hr class="hr"><p class="kicker">Two more things</p>'+
    '<div class="opening"><span class="ol">Cards</span><span class="orl">Score well and you take one. Slam the clock to 30 seconds, reveal all four words, force a mime, or &mdash; if you are the giver &mdash; switch words when you feel them getting close.</span></div>'+
    '<div class="opening"><span class="ol">The board</span><span class="orl">Points are <strong>steps you spend</strong>. Each step goes straight up or one column across, and you land wherever you choose &mdash; so the route is yours, every single round. The square you stop on sets your next round: Fast, One word, Gamble, Partners, <strong>Duel</strong> &mdash; where you name one person and only they may answer &mdash; <strong>Two words</strong>, Mime, a card, <strong>The link</strong> &mdash; three words and no sentence at all &mdash; or <strong>Blind</strong>, where it all turns around and you become the guesser. The left column is the gentle one; the right is where the awkward rounds live.</span></div>'
  };
  const HE_UI = {
   lang_k:"שפה", kick:"משפט אחד &middot; הזדמנות אחת", tagline:"בוחרים מילה. מכוונים משפט אחד לאדם אחד. וגורמים לזה לנחות כמה שיותר מאוחר.",
   whos:"מי משחק?", add:"+ הוסיפו שחקן", player_ph:"שחקן {0}",
   mode_k:"איך אתם משחקים?", mode_solo:"כל אחד לעצמו", mode_teams:"בזוגות",
   mode_solo_d:"בכל סבב אתם מכוונים בסתר לאדם אחד.", mode_teams_d:"אתם מכוונים לשותף &mdash; והצד השני יכול לגנוב.",
   start:"מתחילים", need3:"צריך לפחות 3 שחקנים", need4:"לזוגות צריך לפחות 4 שחקנים",
   target_note:"הראשון שמגיע לסוף הלוח מנצח &mdash; {0} שורות, בערך עשרה סבבים, 25 דקות.",
   setup_note:"הטלפון עובר לנותן הרמז, ואז לאמצע השולחן.",
   howto:"איך משחקים", start_over:"להתחיל מחדש", back:"חזרה", close:"סגירה",
   pass_to:"העבירו את הטלפון ל", giver_k:"סבב {0} &middot; נותן הרמז", look_away:"כל השאר: תסתובבו.",
   im:"אני {0}", hold:"לחצו והחזיקו<br>כדי לראות את ארבע המילים", hold_again:"החזיקו שוב כדי לראות",
   release:"שחררו והן נעלמות.", hold_note:"רק אתם רואים אותן. החזיקו על הפאנל כדי לקרוא.",
   pick_word:"בחרו את המילה", pick_word_d:"מילים קשות שוות יותר. אבל אם אף אחד לא יקלוט, לא תקבלו כלום.",
   chal_k:"כמה קשה אתם רוצים?", per_word:"למילה", topic_k:"בחרו נושא", topic_is:"נושא",
   payoff_k:"אתם צוברים רק אם מישהו קולט", chal_pick_k:"בחרו את רמת הקושי",
   po_best:"נוחת מאוחר", po_best_d:"לוקחים הכי הרבה",
   po_meh:"נוחת מיד", po_meh_d:"לוקחים 1 בלבד",
   po_m_best:"נקלט מיד", po_m_meh:"נקלט לאט", po_m_meh_d:"לוקחים פחות",
   po_none:"אף אחד לא קולט", po_none_d:"לא לוקחים כלום",
   cw_topic:"כל מילה שווה 1 פחות", cw_open:"המילים שוות כמו שכתוב", cw_cold:"כל מילה שווה 1 יותר",
   ch_topic:"לתת להם נושא", ch_topic_d:"ארבע מילים מנושא אחד &mdash; וכל השולחן יידע מה הנושא. הרבה יותר קל לקלוט, ולכן יורדת נקודה מהמילה.",
   ch_open:"מה שיוצא", ch_open_d:"ארבע מילים מעורבות, בלי נושא, בלי עזרה. המילה שווה בדיוק מה שכתוב.",
   ch_cold:"קר", ch_cold_d:"מילה אחת, מחולקת לכם. בלי בחירה, בלי נושא, בלי מוצא. נקודה נוספת.",
   cold_k:"המילה שלכם &mdash; בלי בחירה", cold_d:"אתם תקועים איתה. תגרמו לזה לנחות.",
   shot_k:"כוונו לאדם אחד", shot_d:"בסתר. אם דווקא הם יקלטו, אתם לוקחים נקודה נוספת.",
   duel_k:"בחרו יריב", duel_d:"בקול, וכל השולחן שומע. רק הוא יכול לענות &mdash; וצעקה אחת, נכונה או לא, מסיימת את הסבב.",
   duel_is:"עונה לבד",
   two_k:"בחרו שתי מילים", two_d:"משפט אחד לשתיהן, וכל אחת שווה נקודה פחות. הקישו על שתיים &mdash; והקישו שוב כדי לשנות.",
   link_k:"העלו שלוש מהן", link_d:"כל השש שייכות אליו. בחרו את השלוש שמקיפות אותו בלי להצביע עליו &mdash; אתם עדיין רוצים שזה ינחת מאוחר.",
   link_is:"הקישור", link_table_h:"מה מחבר בין השלוש?",
   link_table_d:"כולם ביחד, בקול, כמה פעמים שרוצים. ניחוש שגוי לא עולה כלום.",
   link_shown:"על השולחן",
   two_left:"אחת עוד בחוץ", two_got:"{0} אמר/ה {1}",
   judge_which:"איזו מהן {0} אמר/ה?", judge_neither:"אף אחת מהן",
   partner_k:"השותף/ה שלכם בסבב הזה", partner_d:"אם הם יקלטו, שניכם מקבלים. הצד השני עדיין יכול לגנוב.",
   ready:"מוכן &mdash; שימו את הטלפון באמצע",
   table_k:"סבב {0}", say_it:"תגידו את המשפט. פעם אחת.",
   say_it_mime:"תמחיזו. פעם אחת.", say_it_mime_d:"בלי מילה, בלי קול. כל השאר: תצעקו כשיש לכם.",
   say_it_one:"מילה אחת. זהו.", say_it_one_d:"מילה אחת בלבד, נאמרת פעם אחת. כל השאר: תצעקו כשיש לכם.",
   time_up_end:"הזמן נגמר &mdash; לסיים את הסבב",
   say_it_d:"ואז אף מילה נוספת. כל השאר: תצעקו כשיש לכם.",
   who_buzzed:"מי צעק/ה ראשון?", locked:"פסול", giver_tag:"נותן/ת",
   judge_q:"{0} אמר/ה את המילה הנכונה?", judge_yes:"כן &mdash; קלט/ה", judge_no:"לא",
   time_up:"נגמר", nobody:"אף אחד לא קלט", end_round:"אף אחד לא קלט &mdash; לסיים את הסבב",
   play_card:"להפעיל קלף", whose_card:"של מי הקלף?", no_cards:"אין ל{0} קלף להפעיל.",
   insight_k:"ארבע המילים היו", veto_k:"וטו", veto_d:"משפט חדש. בלי אף מילה מהראשון.",
   mime_k:"פנטומימה", mime_d:"שוב, בלי מילים בכלל.",
   swap_k:"החלפה", swap_d:"החזירו את הטלפון ל{0}.", swap_pick:"בחרו מילה אחרת",
   solved_k:"סבב {0} &middot; תוצאה", got_it:"{0} קלט/ה", the_word:"המילה הייתה",
   band_k:"כמה התזמון היה שווה", got_tag:"קלט/ה", standings_k:"על הלוח &middot; ואז זזים",
   band_early:"ברור מדי", band_mid:"כוון היטב", band_late:"כמעט איבד אותם", band_none:"אף אחד",
   band_m_early:"נקרא מיד", band_m_mid:"הגיע", band_m_late:"בקושי",
   blind_pick_k:"כולם חוץ מ{0} &mdash; בחרו לו/ה מילה", blind_pick_d:"{0}, תסתובבו עכשיו. כל השאר בוחרים מה צריך לנחש.",
   blind_look:"{0} &mdash; תמשיכו להסתכל הצידה", blind_word:"המילה", blind_ready:"כולם ראו &mdash; מתחילים את השעון",
   blind_table_h:"מילה אחת מכל אחד, סביב השולחן.", blind_table_d:"כל אחד אומר מילה אחת. {0} יכול/ה לצעוק ניחוש מתי שרוצים, כמה פעמים שרוצים.",
   blind_got:"{0} קלט/ה",
   w_word:"המילה {0}+", w_wrong:"צעקה שגויה {0}&minus;", w_early:"נפתר מהר מדי 1+",
   w_mid:"נחת יפה {0}+", w_late:"נחת מאוחר {0}+", w_helped:"עזרו 1+", w_half:"חצי מזה 1+", w_both:"שתיהן נחתו 1+", w_shot:"כיוון נכון {0}+", w_partner:"השותף/ה קלט/ה {0}+", w_double:"הוכפל ל&#8209;{0}",
   w_fast:"נקרא מיד {0}+", w_ok:"עבר {0}+", w_slow:"בקושי {0}+", w_none:"אף אחד לא קלט", w_none_x2:"אף אחד לא קלט 1&minus;",
   board_k:"הלוח &mdash; {0} שורות לסוף",
   col_0:"רגיל", col_1:"קלפים", col_2:"מעורב", col_3:"פרוע",
   card_node:"קלף", card_node_d:"קלף", plain_square:"שום דבר מיוחד", the_end:"הסוף", row_n:"שורה {0}",
   move_k:"תזוזה &middot; {0}",
   move_h:"{0} &mdash; יש לך {1} צעדים", move_h_p:"{0} &mdash; יש לכם {1} צעדים",
   move_h1:"{0} &mdash; יש לך צעד אחד", move_h1_p:"{0} &mdash; יש לכם צעד אחד",
   move_d:"עד {0} צעדים &mdash; מותר גם לעצור מוקדם. כל צעד הוא ישר למעלה או עמודה אחת הצידה. איפה שתעצרו קובע את הסבב הבא שלכם.",
   move_d1:"צעד אחד &mdash; ישר למעלה או עמודה אחת הצידה. איפה שתעצרו קובע את הסבב הבא שלכם.",
   move_tap:"הקישו על כל משבצת מוארת &mdash; {0} בטווח.",
   move_sel_k:"תנחתו על", move_cost:"{0} &middot; {1} צעדים",
   move_queue_k:"{0} שחקנים שצברו זזים, אחד אחרי השני",
   move_confirm:"לזוז לכאן", move_pick:"בחרו משבצת על הלוח",
   go_move:"לזוז על הלוח", card_won:"משבצת קלף",  next_round:"הסבב הבא", see_won:"מי ניצח", end_game:"לסיים את המשחק",
   hands_k:"קלפים ביד", evidence_k:"קלפים שנצברו", evidence_d:"{0} יכול/ה לקחת קלף.",
   take_one:"{0} &mdash; קחו אחד", cards_secret:"הקלפים סודיים. מפעילים מתי שרוצים.",
   board_note:"נקודות הן צעדים שאתם מוציאים. בכל צעד אפשר ישר למעלה או עמודה אחת הצידה, אז איפה שתעצרו זו הבחירה שלכם.",
   after_rounds:"אחרי {0} סבבים", wins:"{0} מנצח/ת", again:"עוד משחק", newp:"שחקנים חדשים",
   recovered_k:"משהו השתבש", recovered:"היינו צריכים להתחיל משחק חדש",
   recovered_d:"משחק שנשמר בגרסה ישנה לא הצליח להימשך, אז הוא נמחק.",
   ht_got:"הבנתי &mdash; בואו נשחק",
   ht_html:'<p class="kicker">איך משחקים</p><h2>לגרום לזה לנחות בשנייה האחרונה</h2>'+
    '<p class="sub">שחקן אחד הוא <strong>נותן הרמז</strong>. כל השאר מנסים לצעוק את המילה ראשונים.</p>'+
    '<div class="hstep"><span class="sn">01</span><div><h3>הנותן בוחר מילה</h3>'+
      '<p>קודם הוא בוחר כמה קשה הוא רוצה: <strong>לתת לשולחן נושא</strong> (קל יותר, נקודה פחות לכל מילה), <strong>מה שיוצא</strong>, או <strong>קר</strong> &mdash; מילה אחת, בלי בחירה ובלי נושא, נקודה נוספת. ואז המילים מופיעות אצלו בטלפון, בסתר, כל אחת שווה ניקוד אחר.</p></div></div>'+
    '<div class="hstep"><span class="sn">02</span><div><h3>הוא מכוון בסתר לאדם אחד</h3>'+
      '<p>אם דווקא האדם הזה יקלוט, הנותן לוקח נקודה נוספת. אף אחד לא יודע במי הוא בחר.</p></div></div>'+
    '<div class="hstep"><span class="sn">03</span><div><h3>משפט אחד. נאמר פעם אחת. ואז שקט.</h3>'+
      '<p>בלי הבהרות, בלי חם־קר, בלי תנועות ידיים. ואז הטלפון עובר לאמצע השולחן והשעון רץ.</p></div></div>'+
    '<div class="hstep"><span class="sn">04</span><div><h3>צועקים כשיש לכם</h3>'+
      '<p>הקול הראשון זוכה. מישהו לוחץ על השם שלכם ואתם אומרים את המילה בקול. <strong>טעיתם — אתם פסולים עד סוף הסבב ומאבדים נקודה.</strong> צדקתם — הסבב נגמר.</p></div></div>'+
    '<div class="hstep"><span class="sn">05</span><div><h3>הנותן רוצה שזה ינחת מאוחר</h3>'+
      '<p>קלטו בשניות הראשונות והנותן מקבל רק 1 &mdash; ברור מדי. אף אחד לא קלט והנותן לא מקבל כלום. הנקודה המתוקה היא שמישהו יקלוט ממש לקראת הסוף.</p></div></div>'+
    '<hr class="hr"><p class="kicker">סבב אחד, מבחוץ</p>'+
    '<div class="dlg">'+
      '<div class="row"><span class="w">דנה</span><span class="s">לוקחת <strong>געגועים הביתה</strong>, שווה 4, ומכוונת בסתר לסבתא.</span></div>'+
      '<div class="row"><span class="w">דנה</span><span class="s">&ldquo;זה מה שהרגשתי כל יום שישי בצבא.&rdquo;</span></div>'+
      '<div class="row lie"><span class="w">אילן 0:12</span><span class="s">צועק &mdash; אומר &ldquo;בדידות&rdquo;. טעות. הוא פסול, ומאבד 1.</span></div>'+
      '<div class="row"><span class="w">סבתא 0:51</span><span class="s">צועקת &mdash; אומרת &ldquo;געגועים הביתה&rdquo;. נכון.</span></div>'+
    '</div>'+
    '<p class="note">סבתא לוקחת 4. דנה לוקחת 4 על נחיתה בחלון הטוב, ועוד 1 כי סבתא הייתה בדיוק מי שהיא כיוונה אליה. אילן הלך מוקדם מדי על תחושה ושילם על זה &mdash; וזה כל המשחק.</p>'+
    '<hr class="hr"><p class="kicker">עוד שני דברים</p>'+
    '<div class="opening"><span class="ol">קלפים</span><span class="orl">מי שצובר יפה לוקח קלף. להוריד את השעון ל־30 שניות, לחשוף את כל ארבע המילים, לכפות פנטומימה, או &mdash; אם אתם הנותן &mdash; להחליף מילה כשאתם מרגישים שהם מתקרבים.</span></div>'+
    '<div class="opening"><span class="ol">הלוח</span><span class="orl">נקודות הן <strong>צעדים שאתם מוציאים</strong>. כל צעד הוא ישר למעלה או עמודה אחת הצידה, ואתם נוחתים איפה שתבחרו &mdash; אז המסלול שלכם, בכל סבב מחדש. המשבצת שתעצרו עליה קובעת את הסבב הבא שלכם: מהיר, מילה אחת, הימור, שותפים, <strong>דו־קרב</strong> &mdash; שבו בוחרים אדם אחד ורק הוא עונה &mdash; <strong>שתי מילים</strong>, פנטומימה, קלף, <strong>הקישור</strong> &mdash; שלוש מילים ובלי משפט בכלל &mdash; או <strong>עיוור</strong> שבו הכול מתהפך ואתם הופכים למנחשים. העמודה השמאלית היא העדינה, הימנית היא המקום שבו יושבים הסבבים המסובכים.</span></div>'
  };

  /* Topics are curated slices of the same word bank, so the values still stand. */
  const EN_TOPICS = {
   home:{n:"At home", w:["couch","pillow","blanket","curtain","kettle","toaster","mattress","doorbell","sponge","teapot","chore","routine","homework","leftovers","comfort food","empty nest"]},
   feel:{n:"Feelings", w:["jealous","nervous","generous","curious","grateful","impatient","embarrassed","relieved","exhausted","disappointed","stubborn","awkward","homesick","bittersweet","comfort zone","gut feeling"],
     own:{2:["a hug","a smile","crying","laughing"]}},
   move:{n:"Getting about", w:["bicycle","suitcase","raincoat","umbrella","ladder","tractor","wheelbarrow","shoelace","holiday","shortcut","jet lag","cold feet","rain check","cabin fever","foot in the door"]},
   folk:{n:"People", w:["neighbour","nickname","apology","favour","promise","gossip","rumour","tradition","superstition","reunion","small talk","hypocrite","double standard","cold shoulder","olive branch","inside joke"],
     own:{2:["a stranger","a best friend","a queue","a family photo"]}},
   now:{n:"Modern life", w:["group chat","doomscrolling","ghosting","spoiler","cliffhanger","buzzword","micromanage","deadline","curfew","allowance","loophole","red tape","autopilot","overshare","procrastinate","the last word","wallet","midlife crisis","learning curve"]},
   says:{n:"Sayings", w:["silver lining","wake-up call","second wind","growing pains","culture shock","last resort","open secret","safety net","white lie","slippery slope","catch-22","ivory tower","paper trail","storm in a teacup","tip of the iceberg","needle in a haystack","small print","false alarm","blind spot","understatement"],
     own:{2:["good luck","never mind","no way","fair enough"],
          3:["better late than never","easier said than done","that is life","so far so good"]}},
   face:{n:"Famous faces", own:{
     2:["Einstein","Messi","Cristiano Ronaldo","Shakespeare","Beyoncé"],
     3:["Taylor Swift","Elon Musk","Adele","Michael Jordan","Serena Williams","Charlie Chaplin"],
     4:["Zendaya","Greta Thunberg","Keanu Reeves","Rihanna","David Attenborough","Frida Kahlo"],
     5:["Marie Curie","Alan Turing","Ada Lovelace","Banksy","Nikola Tesla"]}},
   telly:{n:"On television", own:{
     2:["the news","a cooking show","cartoons","the weather forecast"],
     3:["a talent show","a soap opera","a quiz show","a nature documentary","the adverts"],
     4:["a reality show","a season finale","a spin-off","binge-watching","skipping the intro","a true-crime series"],
     5:["a plot hole","a mockumentary","a shared streaming password","a filler episode"]}},
   sport:{n:"Sport", own:{
     2:["football","swimming","running","a whistle","a goal"],
     3:["the Olympics","a penalty","a referee","a marathon","extra time","the bench"],
     4:["an own goal","a hat-trick","offside","a personal best","home advantage"],
     5:["a false start","a photo finish","the underdog","a clean sheet"]}},
   music:{n:"Music", own:{
     2:["a drum","singing","a song","a piano"],
     3:["a choir","a concert","headphones","a chorus","a lullaby","a playlist"],
     4:["an earworm","a one-hit wonder","a support act","a music festival","a song on repeat"],
     5:["an encore","perfect pitch","a cover version","lip syncing","a viral sound"]}},
   world:{n:"Around the world", own:{
     2:["the desert","a mountain","an island","the jungle"],
     3:["a volcano","the Pyramids","a glacier","the Sahara","a rainforest"],
     4:["the Northern Lights","the Great Wall","the Amazon","a fjord","the Dead Sea"],
     5:["the equator","the Silk Road","a time zone","the Bermuda Triangle"]}},
   lands:{n:"Countries", own:{
     2:["Italy","Egypt","Japan","France"],
     3:["Brazil","India","Greece","Canada","Australia"],
     4:["Iceland","Morocco","Thailand","Argentina","Switzerland"],
     5:["Nepal","Peru","Finland","Vietnam"]}}
  };
  const HE_TOPICS = {
   home:{n:"בבית", w:["ספה","כרית","שמיכה","וילון","קומקום","מצנם","מזרן","פעמון דלת","ספוג","קנקן","מטלה","שגרה","שיעורי בית","שאריות","אוכל מנחם","קן ריק"]},
   feel:{n:"רגשות", w:["מקנא","לחוץ","נדיב","סקרן","אסיר תודה","חסר סבלנות","נבוך","הוקל לו","מותש","מאוכזב","עקשן","מביך","געגועים הביתה","מתוק־מר","אזור הנוחות","תחושת בטן"],
     own:{2:["חיבוק","חיוך","לבכות","לצחוק"]}},
   move:{n:"בדרכים", w:["אופניים","מזוודה","מעיל גשם","מטרייה","סולם","טרקטור","מריצה","שרוך","חופשה","קיצור דרך","ג׳ט לג","רגליים קרות","לדחות לפעם אחרת","לטפס על הקירות","רגל בדלת"]},
   folk:{n:"אנשים", w:["שכן","כינוי","התנצלות","טובה","הבטחה","רכילות","שמועה","מסורת","אמונה טפלה","מפגש מחזור","שיחת חולין","צבוע","איפה ואיפה","ענף זית","בדיחה פנימית","פרקליט השטן"],
     own:{2:["זר","חבר הכי טוב","תור","תמונה משפחתית"]}},
   now:{n:"החיים היום", w:["קבוצת ווטסאפ","גלילה אינסופית","היעלמות פתאומית","ספוילר","סוף פתוח","מילת באזז","ניהול זעיר","דדליין","שעת עוצר","דמי כיס","פרצה בחוק","בירוקרטיה","טייס אוטומטי","לשתף יותר מדי","לדחות למחר","המילה האחרונה","ארנק","משבר אמצע החיים","עקומת למידה"]},
   says:{n:"ניבים", w:["צד חיובי","קריאת השכמה","רוח שנייה","כאבי גדילה","הלם תרבותי","מוצא אחרון","סוד גלוי","רשת ביטחון","שקר לבן","מדרון חלקלק","מלכוד 22","מגדל שן","סערה בכוס מים","קצה הקרחון","מחט בערימת שחת","חרב פיפיות","לשון המעטה","אזעקת שווא","נקודה עיוורת","האותיות הקטנות"],
     own:{2:["בהצלחה","לא נורא","אין מצב","סבבה"],
          3:["מוטב מאוחר מלעולם לא","קל להגיד","ככה זה בחיים","בינתיים הכול טוב"]}},
   face:{n:"פרצופים מוכרים", own:{
     2:["איינשטיין","מסי","כריסטיאנו רונאלדו","שייקספיר","ביונסה"],
     3:["טיילור סוויפט","אילון מאסק","נועה קירל","עומר אדם","מייקל ג׳ורדן","צ׳רלי צ׳אפלין"],
     4:["זנדאיה","גרטה טונברג","קיאנו ריבס","ריהאנה","דיוויד אטנבורו","יובל נח הררי"],
     5:["מארי קירי","אלן טיורינג","עדה לאבלייס","בנקסי","ניקולה טסלה"]}},
   telly:{n:"בטלוויזיה", own:{
     2:["חדשות","תוכנית בישול","סרטים מצוירים","תחזית מזג האוויר"],
     3:["תוכנית כישרונות","אופרת סבון","חידון","סרט טבע","פרסומות"],
     4:["ריאליטי","פרק אחרון של עונה","ספין־אוף","בינג׳","לדלג על הפתיח","סדרת פשע אמיתי"],
     5:["חור בעלילה","מוקומנטרי","סיסמה משותפת לנטפליקס","פרק מילוי"]}},
   sport:{n:"ספורט", own:{
     2:["כדורגל","שחייה","ריצה","משרוקית","גול"],
     3:["אולימפיאדה","פנדל","שופט","מרתון","הארכה","ספסל"],
     4:["שער עצמי","שלושער","נבדל","שיא אישי","יתרון ביתיות"],
     5:["זינוק פסול","צילום סיום","המקופח","שער נקי"]}},
   music:{n:"מוזיקה", own:{
     2:["תופים","שירה","שיר","פסנתר"],
     3:["מקהלה","הופעה","אוזניות","פזמון","שיר ערש","פלייליסט"],
     4:["תולעת אוזן","להיט אחד","חימום","פסטיבל מוזיקה","שיר על ריפיט"],
     5:["הדרן","שמיעה אבסולוטית","גרסת כיסוי","פלייבק","סאונד ויראלי"]}},
   world:{n:"מסביב לעולם", own:{
     2:["מדבר","הר","אי","ג׳ונגל"],
     3:["הר געש","הפירמידות","קרחון","הסהרה","יער גשם"],
     4:["זוהר צפוני","החומה הסינית","האמזונס","פיורד","ים המלח"],
     5:["קו המשווה","דרך המשי","אזור זמן","משולש ברמודה"]}},
   lands:{n:"מדינות", own:{
     2:["איטליה","מצרים","יפן","צרפת"],
     3:["ברזיל","הודו","יוון","קנדה","אוסטרליה"],
     4:["איסלנד","מרוקו","תאילנד","ארגנטינה","שווייץ"],
     5:["נפאל","פרו","פינלנד","וייטנאם"]}}
  };
  /* ============ links ============
     A Link round hands the giver a thing and six words that all belong to it,
     and they put three of them up. Every word here really is of its link — a
     decoy would make the round unguessable, and the difficulty is already in
     which three the giver chooses to show. Ranked roughly obvious to oblique,
     so a giver reading down the list is reading down a difficulty curve.

     The Hebrew is not the English translated. A family in Israel is handed
     יום העצמאות and שבת and חמין and הפוך, because a link only works when it
     is lived in rather than looked up. */
  const EN_LINKS = {
   argentina:{ n:"Argentina", w:["Messi","tango","asado","the Andes","blue and white","a striped shirt"] },
   winter:{ n:"Winter", w:["snow","a scarf","short days","hot soup","bare trees","a hot water bottle"] },
   sea:{ n:"The sea", w:["waves","salt","a lighthouse","seagulls","the horizon","wet sand"] },
   egypt:{ n:"Egypt", w:["the pyramids","the Nile","camels","hieroglyphs","a pharaoh","the desert"] },
   wedding:{ n:"A wedding", w:["a ring","a white dress","speeches","confetti","a first dance","an aunt crying"] },
   coffee:{ n:"Coffee", w:["beans","the morning","steam","a paper cup","staying awake","a ring on the table"] },
   italy:{ n:"Italy", w:["pasta","the Colosseum","a gondola","olive oil","a scooter","hands that talk"] },
   rain:{ n:"Rain", w:["an umbrella","puddles","a grey sky","wet shoes","the smell of pavement","a cancelled picnic"] },
   school:{ n:"School", w:["a bell","a blackboard","homework","a satchel","break time","a report card"] },
   moon:{ n:"The moon", w:["craters","the tides","a flag","silver","a crescent","one small step"] },
   football:{ n:"Football", w:["a whistle","a red card","a goal","grass","a striped scarf","extra time"] },
   japan:{ n:"Japan", w:["sushi","cherry blossom","a bullet train","origami","bowing","Mount Fuji"] },
   hospital:{ n:"A hospital", w:["a white coat","a waiting room","a chart","disinfectant","a bed on wheels","visiting hours"] },
   chocolate:{ n:"Chocolate", w:["cocoa","a wrapper","melting","brown","a gift","breaking off a square"] },
   fire:{ n:"Fire", w:["smoke","orange","a match","warmth","ash","a chimney"] },
   books:{ n:"Books", w:["pages","a spine","a library","dust","a bookmark","quiet"] },
   birthday:{ n:"A birthday", w:["candles","a wish","cake","singing","wrapping paper","getting older"] },
   desert:{ n:"The desert", w:["sand","no water","a mirage","dunes","heat","a caravan"] },
   time:{ n:"Time", w:["a clock","a calendar","waiting","wrinkles","an hourglass","running out"] },
   france:{ n:"France", w:["a baguette","the Eiffel Tower","cheese","perfume","wine","a beret"] },
   music:{ n:"Music", w:["a stage","headphones","a chorus","applause","strings","a rhythm"] },
   cat:{ n:"A cat", w:["whiskers","a box","indifference","purring","nine lives","landing on its feet"] },
   money:{ n:"Money", w:["a coin","a wallet","a queue at the bank","taxes","a piggy bank","running short"] },
   space:{ n:"Space", w:["stars","a rocket","silence","a black hole","no gravity","a telescope"] },
   hotel:{ n:"A hotel", w:["a key card","a tiny soap","a stranger's bed","breakfast","a lobby","checking out"] },
   sleep:{ n:"Sleep", w:["a pillow","a dream","an alarm","snoring","darkness","an eye mask"] },
   greece:{ n:"Greece", w:["olives","white houses","blue doors","ruins","feta","a myth"] },
   sport:{ n:"Sport", w:["sweat","a stopwatch","a medal","the bench","training","a photo finish"] },
   farm:{ n:"A farm", w:["a tractor","mud","an early morning","a fence","hay","a rooster"] },
   india:{ n:"India", w:["spices","the monsoon","a sari","cricket","the Taj Mahal","a crowded train"] },
   phone:{ n:"A phone", w:["a screen","a charger","a notification","a cracked corner","a group chat","no battery left"] },
   barber:{ n:"A hairdresser", w:["scissors","a mirror","a cape","small talk","a sink","a fringe"] },
   circus:{ n:"The circus", w:["a tent","a clown","a tightrope","popcorn","a ringmaster","an elephant"] },
   autumn:{ n:"Autumn", w:["leaves","wind","a jumper","brown","the clocks going back","a school year starting"] },
   heist:{ n:"A robbery", w:["a mask","a getaway car","an alarm","a vault","a hostage","a plan that goes wrong"] },
   brazil:{ n:"Brazil", w:["carnival","the Amazon","a beach","football","samba","coffee"] },
   dentist:{ n:"A dentist", w:["a chair","a drill","a bright light","rinsing","a filling","dreading it"] },
   kitchen:{ n:"A kitchen", w:["a knife","steam","a burnt edge","a recipe","washing up","somebody in the way"] },
   childhood:{ n:"Childhood", w:["a scraped knee","a swing","a lunchbox","believing everything","a bunk bed","summer being long"] },
   train:{ n:"A train", w:["a platform","a ticket","a window seat","a delay","a tunnel","somebody's loud call"] },
   ireland:{ n:"Ireland", w:["green","rain","a pint","a fiddle","sheep","a saint"] },
   gym:{ n:"The gym", w:["a mirror","weights","sweat","the January crowd","a locker","giving up in February"] },
   wind:{ n:"Wind", w:["a slammed door","a kite","hair in your face","a whistle","a broken umbrella","washing on the line"] },
   library:{ n:"A library", w:["quiet","a stamp","shelves","a fine","a whisper","a due date"] },
   winterhols:{ n:"The holidays", w:["lights","a tree","queues in the shops","family","too much food","a terrible jumper"] }
  };
  const HE_LINKS = {
   argentina:{ n:"ארגנטינה", w:["מסי","טנגו","אסאדו","האנדים","כחול־לבן","חולצה מפוספסת"] },
   winter:{ n:"חורף", w:["גשם","מעיל","ימים קצרים","מרק","תנור","גרביים רטובות"] },
   sea:{ n:"הים", w:["גלים","מלח","מציל","חול","שקיעה","מדוזה"] },
   egypt:{ n:"מצרים", w:["הפירמידות","הנילוס","גמלים","סיני","פרעה","מדבר"] },
   wedding:{ n:"חתונה", w:["טבעת","שמלה לבנה","צלם","מעטפה","ריקוד ראשון","דודה שבוכה"] },
   coffee:{ n:"קפה", w:["הפוך","בוקר","קצף","כוס נייר","להישאר ער","בית קפה"] },
   italy:{ n:"איטליה", w:["פסטה","הקולוסיאום","גונדולה","שמן זית","ג׳לטו","ידיים שמדברות"] },
   rain:{ n:"גשם", w:["מטרייה","שלוליות","שמיים אפורים","נעליים רטובות","ריח של אספלט","טיול שבוטל"] },
   school:{ n:"בית ספר", w:["פעמון","לוח","שיעורי בית","ילקוט","הפסקה","תעודה"] },
   moon:{ n:"הירח", w:["מכתשים","גאות","דגל","כסוף","סהר","צעד קטן"] },
   football:{ n:"כדורגל", w:["שופט","כרטיס אדום","גול","דשא","צעיף","הארכה"] },
   japan:{ n:"יפן", w:["סושי","פריחת הדובדבן","רכבת מהירה","אוריגמי","קידה","הר פוג׳י"] },
   hospital:{ n:"בית חולים", w:["חלוק לבן","חדר המתנה","אינפוזיה","ריח של חיטוי","מיטה עם גלגלים","שעות ביקור"] },
   chocolate:{ n:"שוקולד", w:["קקאו","עטיפה","נמס","חום","מתנה","לשבור ריבוע"] },
   fire:{ n:"אש", w:["עשן","כתום","גפרור","חום","אפר","מדורה"] },
   books:{ n:"ספרים", w:["דפים","כריכה","ספרייה","אבק","סימנייה","שקט"] },
   birthday:{ n:"יום הולדת", w:["נרות","משאלה","עוגה","שיר","נייר עטיפה","להתבגר"] },
   desert:{ n:"המדבר", w:["חול","אין מים","מיראז׳","דיונות","חום","שביל"] },
   time:{ n:"זמן", w:["שעון","לוח שנה","לחכות","קמטים","שעון חול","נגמר"] },
   france:{ n:"צרפת", w:["באגט","מגדל אייפל","גבינה","בושם","יין","כומתה"] },
   music:{ n:"מוזיקה", w:["במה","אוזניות","פזמון","מחיאות כפיים","מיתרים","קצב"] },
   cat:{ n:"חתול", w:["שפם","קופסה","אדישות","גרגור","תשעה חיים","נוחת על הרגליים"] },
   money:{ n:"כסף", w:["מטבע","ארנק","תור בבנק","מיסים","קופת חיסכון","נגמר באמצע החודש"] },
   space:{ n:"החלל", w:["כוכבים","טיל","שקט","חור שחור","אפס כבידה","טלסקופ"] },
   hotel:{ n:"מלון", w:["כרטיס מגנטי","סבון קטן","מיטה זרה","ארוחת בוקר","לובי","צ׳ק אאוט"] },
   sleep:{ n:"שינה", w:["כרית","חלום","שעון מעורר","נחירות","חושך","כיסוי עיניים"] },
   greece:{ n:"יוון", w:["זיתים","בתים לבנים","דלתות כחולות","חורבות","פטה","מיתוס"] },
   sport:{ n:"ספורט", w:["זיעה","סטופר","מדליה","ספסל","אימון","צילום סיום"] },
   farm:{ n:"משק", w:["טרקטור","בוץ","בוקר מוקדם","גדר","חציר","תרנגול"] },
   india:{ n:"הודו", w:["תבלינים","מונסון","סארי","קריקט","הטאג׳ מאהל","רכבת עמוסה"] },
   phone:{ n:"טלפון", w:["מסך","מטען","התראה","פינה סדוקה","קבוצת ווטסאפ","נגמרה הסוללה"] },
   barber:{ n:"מספרה", w:["מספריים","מראה","שכמייה","שיחת חולין","כיור","פוני"] },
   circus:{ n:"קרקס", w:["אוהל","ליצן","חבל דק","פופקורן","מנהל הזירה","פיל"] },
   autumn:{ n:"סתיו", w:["עלים","רוח","סוודר","חום","שעון חורף","שנה שמתחילה"] },
   heist:{ n:"שוד", w:["מסכה","רכב מילוט","אזעקה","כספת","בן ערובה","תוכנית שמשתבשת"] },
   brazil:{ n:"ברזיל", w:["קרנבל","האמזונס","חוף","כדורגל","סמבה","קפה"] },
   dentist:{ n:"רופא שיניים", w:["כיסא","מקדחה","אור חזק","לשטוף","סתימה","לפחד מזה"] },
   kitchen:{ n:"מטבח", w:["סכין","אדים","קצה שרוף","מתכון","כלים בכיור","מישהו שעומד בדרך"] },
   childhood:{ n:"ילדות", w:["ברך שרוטה","נדנדה","קופסת אוכל","להאמין לכל דבר","מיטת קומתיים","קיץ ארוך"] },
   train:{ n:"רכבת", w:["רציף","כרטיס","מקום ליד החלון","עיכוב","מנהרה","מישהו שמדבר בקול"] },
   independence:{ n:"יום העצמאות", w:["דגלים","מנגל","זיקוקים","פטישי פלסטיק","מטס","שכונה שלמה בחוץ"] },
   gym:{ n:"חדר כושר", w:["מראה","משקולות","זיעה","עומס בינואר","לוקר","לוותר בפברואר"] },
   wind:{ n:"רוח", w:["דלת שנטרקת","עפיפון","שיער בפנים","שריקה","מטרייה שבורה","כביסה על החבל"] },
   library:{ n:"ספרייה", w:["שקט","חותמת","מדפים","קנס","לחישה","תאריך החזרה"] },
   shabbat:{ n:"שבת", w:["נרות","חלה","שקט ברחוב","ארוחה משפחתית","חמין","סבתא"] }
  };

  const EN = {words:EN_WORDS, cards:EN_CARDS, mods:EN_MODS, topics:EN_TOPICS, links:EN_LINKS, ui:EN_UI};
  const HE = {words:HE_WORDS, cards:HE_CARDS, mods:HE_MODS, topics:HE_TOPICS, links:HE_LINKS, ui:HE_UI};

  /* ============ board ============
     A lattice you actually navigate. Four columns, many rows. Every step you may
     go straight up or one column left or right, so from any square there are
     three ways on — and you re-choose every single round.
     Column 0 is plain and dull. Column 3 is where the awkward rounds live.
     Points are steps you SPEND: you may move up to that many and land wherever
     you like. The square you end on is the one that decides your next round. */
  const COLS = 4;
  /* What a word pays. The banks are keyed by tier — 2 up to 5, hardest last —
     and the tier is not the price. A solved round pays twice, the word to
     whoever got it and the timing to whoever gave it, and both of those are
     steps on a board of sixteen or so rows. Priced at the tier, one ordinary
     round moved a quarter of the board and a good one crossed half of it, so
     the scale sits a notch below the tiers and the flat bonuses sit with it. */
  const POINTS = { 2:1, 3:2, 4:3, 5:4 };
  /* A link has no tier to be priced from — it is a thing, not a word off a
     bank — so it carries one flat price, pitched at the dearer end because
     naming it from three oblique words is the hardest ask in the game. */
  const LINK_VALUE = 3;
  function wordPoints(tier){ return POINTS[tier] || 1; }
  const CHALLENGES = { topic:-1, open:0, cold:1 };
  /* The giver's reward for calling who would get it. On an ordinary round the
     aim is a secret guess with the rest of the table as a safety net; in a
     Duel it is said out loud and there is no net, so it pays one more. */
  const SHOT_BONUS = 1;
  function shotBonus(R){ return SHOT_BONUS + (R.mod === "U" ? 1 : 0); }
  function valueDelta(R){ return CHALLENGES[R.challenge] !== undefined ? CHALLENGES[R.challenge] : 0; }
  function wordValue(R, w){
    /* Two more, and the round is made hard enough to be worth it. At two on
       an ordinary round this was the best square on the board by a distance:
       it paid the most and landed the most, because the word was dearer
       without the round being harder. The dearness is the same now; what has
       changed is that a Gamble runs on the short clock and deals from the top
       of the bank, so nearly a third of them die and the giver pays for it. */
    return Math.max(1, w.value + (R.mod === "G" ? 2 : 0) + (R.mod === "W" ? -1 : 0) + valueDelta(R));
  }
  function dealTopic(key){
    const R = S.r, T0 = TOPICS[key] || {};
    const byTier = {2:[],3:[],4:[],5:[]};
    (T0.w || []).forEach(x => { if(TIER[x]) byTier[TIER[x]].push(x); });
    if(T0.own) [2,3,4,5].forEach(v => (T0.own[v] || []).forEach(x => byTier[v].push(x)));
    const pool = [].concat(byTier[2], byTier[3], byTier[4], byTier[5]);
    const out = [];
    [2,3,4,5].forEach(v => { const b = shuffle(byTier[v]); if(b.length) out.push({ text:b[0], value:wordPoints(v) }); });
    const tierLookup = {}; [2,3,4,5].forEach(v => byTier[v].forEach(x => { tierLookup[x] = v; }));
    const spare = shuffle(pool.filter(x => !out.some(o => o.text === x)));
    while(out.length < 4 && spare.length){ const x = spare.pop(); out.push({ text:x, value:wordPoints(tierLookup[x]) }); }
    if(out.length){ R.words = out.sort((a,b)=>a.value-b.value); }
    R.topic = key;
  }
  /* A link round is dealt whole: the thing itself becomes the round's one
     word — the answer everybody is racing to say — and the six that belong to
     it go in the pool the giver chooses three from. */
  function dealLink(){
    const keys = Object.keys(LINKS);
    const key = keys[Math.floor(Math.random() * keys.length)];
    const L = LINKS[key];
    S.r.linkKey  = key;
    S.r.words    = [{ text:L.n, value:LINK_VALUE }];
    S.r.pick     = 0;
    S.r.linkPool = shuffle(L.w.slice());
    S.r.shown    = [];
  }
  const UNIT_COLORS = ["#2C6BFF","#12B886","#FF5A3D","#D97706","#7A5AF8","#0891B2","#DB2777","#4D7C0F"];
  /* palettes this game has worn before, kept only so a saved game repaints itself */
  const OLD_UNIT_COLORS = [
    ["#5B9BFF","#3ED9A0","#FF5A4E","#F0B23C","#B98CFF","#4ED6E8","#FF8FB1","#9BD45A"],
    ["#3B4E8C","#0D7A6E","#8C3A5A","#8A5A12","#5B4B8A","#1F6F8B","#7A4E2E","#4C6B2F"]
  ];
  function unitColor(u){ return u.color || UNIT_COLORS[Math.max(0, S.units.indexOf(u)) % UNIT_COLORS.length]; }

  /* everyone gets a face: initials on a disc in their own colour */
  function initials(nm){
    const x = String(nm||"?").trim(), parts = x.split(/\s*\+\s*/);
    if(parts.length > 1 && parts[0] && parts[1]) return (parts[0].charAt(0)+parts[1].charAt(0)).toUpperCase();
    return x.slice(0,2).toUpperCase();
  }
  function avatar(nm, col, cls){
    return '<span class="av'+(cls?" "+cls:"")+'" style="background:'+col+'" aria-hidden="true">'+esc(initials(nm))+'</span>';
  }
  function playerColor(pid){
    const u = (S && Array.isArray(S.units) && S.units.length) ? unitOf(pid) : null;
    return u ? unitColor(u) : "var(--accent)";
  }
  function playerAv(pid, cls){ const p = playerById(pid); return avatar(p.name, playerColor(pid), cls); }
  /* a word's value badge, coloured by how dear the word is */
  const VAL_TINT = { blue:["var(--accent-soft)","var(--accent)"], green:["var(--good-soft)","var(--good-ink)"],
                     violet:["var(--violet-soft)","var(--violet)"], amber:["var(--blind-soft)","var(--blind-ink)"] };
  function wvChip(v){
    const k = v <= 1 ? "blue" : (v === 2 ? "green" : (v === 3 ? "violet" : "amber"));
    const c = VAL_TINT[k];
    return '<span class="wv" style="background:'+c[0]+';color:'+c[1]+'">'+v+'</span>';
  }
  /* ============ maps ============
     Five boards. Each one keeps the same 4-column, "step up or drift a lane"
     shape as the original, but carries its own mod-type cycle (the grid the
     original TYPE_PATTERN was), its own card-square rule, its own row-count
     nudge, and a themeId the client repaints the board with.

     Column 0 is the lane a player hugs when they want a quiet round, and the
     sweep says they hug it hard — over half of every round played came out
     Standard while Mime sat at 3%. So the quiet lane is no longer empty. It
     carries Partners and Fast, and none of Gamble, Mime or Blind: quiet has to
     mean a round that cannot punish you, and Gamble is the opposite of gentle —
     it is the one square where the giver can end a round worse off. That holds on
     every map but chaos, which is named for what it is. Left is calm, right is
     where the awkward rounds live, and now the calm side still has something
     happening on it. Sprint was the worst board of the five at three rounds in
     four plain, being six Standards in a single column; it keeps its own
     promise instead, which is that a short board never asks anyone to mime or
     to play blind. */
  const MAPS = {
   classic:{ id:"classic", themeId:"classic", rowsDelta:0,
     pattern:{ 0:["S","U","W","F","T","U"], 1:["S","F","T","W","U","F"],
               2:["O","G","L","T","G","O"], 3:["B","M","G","L","M","B"] },
     cardRule:{ col:1, every:3 }, wildRule:{ col:3, every:5 } },
   /* Twist is the board about words and how you are allowed to say them:
      Partners, Two words, One word, The link, and Blind at the awkward end.
      No Fast, no Duel, no Gamble and no Mime — nothing here is about the
      clock or about nerve. */
   twist:{ id:"twist", themeId:"twist", rowsDelta:0,
     pattern:{ 0:["S","T","W","T","S","W"], 1:["T","W","O","W","T","O"],
               2:["O","L","W","L","O","T"], 3:["B","L","B","O","B","L"] },
     cardRule:{ col:2, every:4 }, wildRule:{ col:0, every:5 } },
   /* Storm is the wild board, not the long one — its character is in the
      pattern, and two extra rows on top of it ran one game in eight past
      forty minutes once the rounds themselves grew longer. */
   storm:{ id:"storm", themeId:"storm", rowsDelta:1,
     /* the hard five and nothing else: Duel, The link, Gamble, Mime, Blind.
        Its quiet lane is quiet because it is nearly empty, not because it is
        gentle — there is no gentle kind on this board to put there. */
     pattern:{ 0:["S","U","S","U","L","U"], 1:["U","L","G","U","L","G"],
               2:["L","G","B","G","L","M"], 3:["M","B","G","B","M","B"] },
     cardRule:{ col:1, every:4 }, wildRule:{ col:2, every:4 } },
   sprint:{ id:"sprint", themeId:"sprint", rowsDelta:-3,
     /* the gentle five, and Gamble alone on the right so a short board still
        has something to lose. It keeps the promise it was built on — a short
        evening never asks anyone to mime or to play blind — and drops Two
        words and The link as well, which are the two that slow a round down. */
     pattern:{ 0:["S","F","T","F","S","T"], 1:["F","T","O","S","U","T"],
               2:["O","U","F","O","U","O"], 3:["G","O","U","G","T","G"] },
     cardRule:{ col:0, every:3 }, wildRule:{ col:3, every:4 } },
   /* Chaos is named for playing everything, so it plays all ten — Fast came
      back to it when the other boards were given a taste of their own. */
   chaos:{ id:"chaos", themeId:"chaos", rowsDelta:0,
     pattern:{ 0:["S","U","G","F","T","U"], 1:["O","G","U","W","G","O"],
               2:["G","L","B","T","G","M"], 3:["B","M","L","M","B","G"] },
     cardRule:{ col:3, every:3 }, wildRule:{ col:1, every:4 } }
  };
  /* Crossroads is not a sixth board: it is the other way to lay any of the
     five. Chosen in the lobby beside the map, it turns that map's lattice
     into a network — about half the squares, roads laid between them, a
     junction every fifth row — and draws that map's repertoire each game.
     The map keeps its paint, its card and wildcard rules and its row nudge,
     so the farm with roads is still the farm. */
  const ROADS = { junction:5, kinds:5 };
  /* How long the board is, by how many units are racing on it. A unit scores
     when it gives or when it gets the word, so the fewer of them there are the
     more often each one moves and the longer the board has to be. Four players
     in pairs are two racers, and two racers on the sixteen-row board meant for
     five crossed it in nine rounds.

     The row that came off when Gamble was cut to a point went back on when it
     went to two: a square paying 3.1 moves people, and without the row the
     median game lost a round. Both lengths pass every check — this is the one
     that keeps the board the length it was asked to be. */
  function baseRowsForN(n){
    return n <= 2 ? 20 : n === 3 ? 17 : n <= 5 ? 16 : n === 6 ? 14 : 12;
  }
  /* Two dials shorten the board — the mode and the map — and they used to
     subtract at once: Quick on Sprint came to nine rows, which is three good
     rounds, over before the table had met the board it was playing on. A
     lengthening is still taken whole. A shortening is allowed to take about
     a third, however much the two of them add up to. */
  function boardRows(n, modeId, mapId, crowd){
    const mode = MODES[modeId] || MODES.regular;
    const map = MAPS[mapId] || MAPS.classic;
    /* How many are behind each unit, not only how many units there are. A
       lone player is the one who has to get the word; a sofa of three has
       three chances at it and gives just as often, so it comes round the
       board faster and the board has to be longer to hold the same evening. */
    const base = baseRowsForN(n) + Math.round(Math.max(0, (crowd || 1) - 1) * 1.5);
    const delta = (mode.rowsDelta||0) + (map.rowsDelta||0);
    if(delta >= 0) return base + delta;
    return Math.max(10, Math.round(base * 0.7), base + delta);
  }
  function ROWS(){ return (S && S.rows) || 16; }
  /* the map's raw pattern, nudged by the mode's weight table. "regular" has
     no modWeights at all, so it always hands back the map's pattern as-is —
     no randomness, no regression risk, whatever mapId ends up in play.

     Every cell is re-rolled, Standard included. It used to skip them — a
     `cell === "S" ||` short-circuited before the draw — which quietly made
     Standard an absorbing state: a variant square could decay into a plain
     one and no plain one could ever become interesting. Quick and Slow bled
     about a fifth of their variant squares that way, every game, and half of
     every round played came out Standard. A mode's weights are a target share
     now rather than a one-way drain, so a mode with harsh taste can reach into
     the quiet lanes — which is the whole of what Challenge is for. */
  function buildPattern(map, modeId, allowed){
    const mode = MODES[modeId] || MODES.regular;
    const base = map.pattern;
    if(!mode.modWeights || !mode.reweighChance) return base;
    /* A road map drew five kinds and meant it. A mode still colours the board
       — it just does the colouring inside that repertoire instead of reaching
       past it for the four kinds this board is not playing tonight. */
    const letters = Object.keys(mode.modWeights)
      .filter(l => !allowed || allowed.indexOf(l) >= 0);
    if(!letters.length) return base;
    const total = letters.reduce((s,l) => s + mode.modWeights[l], 0);
    const weighted = () => {
      let r = Math.random() * total;
      for(const l of letters){ r -= mode.modWeights[l]; if(r <= 0) return l; }
      return letters[letters.length-1];
    };
    const out = {};
    Object.keys(base).forEach(c => {
      out[c] = base[c].map(cell => (Math.random() >= mode.reweighChance) ? cell : weighted());
    });
    return out;
  }
  /* ---- a road map ----
     Every other board is a lattice: four lanes the whole way up, three ways on
     from every square, every square there. Across 158,565 moves the bots
     actually made, two in three could reach any lane on the board — so the
     lane you stood in was a preference, not a decision, and the map on the
     wall had to draw ninety-eight identical footpaths to state a rule that
     never varies.

     A road map is a network instead. Not every row carries four squares, the
     ways between them are drawn rather than assumed, and every fifth row
     narrows to one square the whole table has to pass through — the one place
     you get to change your mind about the rest of the board.

     Two ways on from an ordinary square, and never fewer. A fifth of all moves
     are a single step, and a single step with one place to go is not a
     decision at all: cutting the board down to one road would have bought the
     strategy by taking away the choice. What it costs instead is that reaching
     a *named* lane takes rounds of intent rather than one step across.

     Generated once, when the board is set, and it travels to the phones with
     the layout exactly as S.pattern already does. */
  /* ---- what a road map plays ----
     Ten kinds of round is the whole game, and on a lattice you meet all ten
     every time. A table holding a shorter board with fewer squares on it does
     not want more to remember, it wants a board with a character — so this one
     draws its own repertoire: the plain square, which is most of the road, and
     five of the nine variants. Two games on this map are two different games,
     and neither of them asks the table to hold ten rules at once.

     Ranked by how much a square asks of you. The draw is made to span that
     range — one gentle kind at least, one harsh one at least — because five
     kinds all from the same end is not a character, it is a mood.

     A third of the board stays plain. On a lattice that share is a fifth, and
     it can be: there are four lanes running the whole way and somewhere quiet
     is always one step off. Here it has to be built in. */
  const MOD_RANK = { F:0, T:1, W:2, O:3, U:4, L:5, G:6, M:7, B:8 };
  const ROAD_S = [3,2,2,1];              /* plain squares per lane, out of six */
  function kindsOf(map){
    const seen = [];
    Object.keys(map.pattern).forEach(c => map.pattern[c].forEach(x => { if(seen.indexOf(x) < 0) seen.push(x); }));
    return seen;
  }
  function drawRepertoire(howMany){
    const pool = Object.keys(MOD_RANK);
    let picks = [];
    for(let tries=0; tries<40; tries++){
      const bag = pool.slice();
      for(let i=bag.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [bag[i],bag[j]]=[bag[j],bag[i]]; }
      picks = bag.slice(0, howMany).sort((a,b) => MOD_RANK[a] - MOD_RANK[b]);
      if(MOD_RANK[picks[0]] <= 2 && MOD_RANK[picks[picks.length-1]] >= 6) break;
    }
    /* the gentle end of the draw to the quiet lane, the harsh end to the
       awkward one, and the lanes overlap so none of them is one-note */
    const at = i => picks[Math.min(picks.length-1, Math.max(0, i))];
    const lanes = [[at(0)], [at(0), at(1)], [at(2), at(3)], [at(3), at(4)]];
    const pattern = {};
    lanes.forEach((kinds, c) => {
      const cells = [];
      for(let i=0;i<6;i++) cells.push(i < ROAD_S[c] ? "S" : kinds[(i - ROAD_S[c]) % kinds.length]);
      for(let i=cells.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [cells[i],cells[j]]=[cells[j],cells[i]]; }
      pattern[c] = cells;
    });
    return { kinds:["S"].concat(picks), pattern };
  }
  /* Roads, not rows. The board between two junctions carries two or three
     roads that do not touch: get on one and you are on it until the next
     junction, which is what makes the junction worth reaching and the choice
     there worth making. A road wanders a lane either way as it climbs, so
     none of them is straight and none of them is a lane in the old sense.

     Every so often two roads run close enough to step between — a crossover,
     the only place a route changes its mind mid-segment. They are rare on
     purpose. A board where you can always cross is the board this one is not.

     Most squares therefore lead to exactly one square, and that is the part
     worth being honest about: on a single-step move down a road with no fork
     in it, the only thing you choose is nothing. What is left in its place is
     the choice a lattice never really offered — how far along to go, and which
     square to stand on when you stop, which a third of the board being plain
     is what makes worth thinking about. */
  const ROAD_STARTS = { 2:[[0,2],[0,3],[1,3],[0,2],[1,3]], 3:[[0,1,3],[0,2,3],[0,1,2],[1,2,3]] };
  function buildRoads(map, rows){
    const cfg = ROADS, pick = a => a[Math.floor(Math.random()*a.length)];
    const k = (r,c) => r + "," + c;
    const cols = {}, out = {};
    const add = (r,a,c) => { const key = k(r,a); (out[key] = out[key] || []).push(c); };

    /* where the junctions fall: one square, the whole table through it */
    const junc = {};
    for(let r=cfg.junction; r<rows; r+=cfg.junction) if(r > 1) junc[r] = true;

    /* the segments between them, each laid with its own roads */
    const segs = [];
    let a = 1;
    for(let r=1;r<=rows;r++) if(junc[r]){ if(r-1 >= a) segs.push([a, r-1]); a = r+1; }
    if(a <= rows) segs.push([a, rows]);

    segs.forEach(seg => {
      const n = Math.min(seg[1]-seg[0] >= 1 ? pick([2,2,3]) : 2, 3);
      let cur = pick(ROAD_STARTS[n]).slice();
      const road = [];
      for(let r=seg[0]; r<=seg[1]; r++){
        if(r > seg[0] && Math.random() < 0.4){
          /* Now and then a road shifts a lane, so long as the roads keep their
             order and never land on each other. Now and then, not every row: a
             road that changes lane at every step is a zigzag, and on the screen
             in the room — where a row is a short step and a lane is a deep one
             — a zigzag is what it looks like. */
          const nxt = cur.slice(), i = Math.floor(Math.random()*n);
          const t = cur[i] + (Math.random() < 0.5 ? -1 : 1);
          const lo = i > 0 ? cur[i-1] + 1 : 0, hi = i < n-1 ? cur[i+1] - 1 : 3;
          if(t >= lo && t <= hi) nxt[i] = t;
          cur = nxt;
        }
        road.push(cur.slice());
        cols[r] = cur.slice().sort((x,y) => x - y);
      }
      for(let i=0;i<road.length-1;i++)
        for(let j=0;j<n;j++) add(seg[0]+i, road[i][j], road[i+1][j]);
      /* one or two crossovers, where two roads run close enough to step across */
      let want = pick([1,1,2]);
      for(let tries=0; tries<10 && want > 0; tries++){
        const i = 1 + Math.floor(Math.random()*Math.max(1, road.length-1)), j = Math.floor(Math.random()*(n-1));
        if(i >= road.length) continue;
        const from = road[i-1], to = road[i], sideA = Math.random() < 0.5 ? j : j+1, sideB = sideA === j ? j+1 : j;
        if(Math.abs(from[sideA] - to[sideB]) > 1) continue;
        const key = k(seg[0]+i-1, from[sideA]);
        if((out[key] || []).indexOf(to[sideB]) >= 0) continue;
        add(seg[0]+i-1, from[sideA], to[sideB]); want--;
      }
    });

    /* into a junction, everything; out of it, every road of the segment above */
    Object.keys(junc).map(Number).forEach(r => {
      cols[r] = [pick([1,2])];
      (cols[r-1] || []).forEach(c => { out[k(r-1,c)] = [cols[r][0]]; });
      if(r < rows) out[k(r, cols[r][0])] = (cols[r+1] || []).slice();
    });
    Object.keys(out).forEach(key => out[key] = out[key].filter((c,i,arr) => arr.indexOf(c) === i).sort((x,y) => x - y));

    /* The card and the wildcard keep the frequency the map asked for: where the
       square a rule names is not on this board, the rule takes the next one up
       its own lane rather than losing its turn. */
    const place = (rule, taken) => {
      const marks = {};
      if(!rule) return marks;
      for(let r=rule.every; r<=rows; r+=rule.every)
        for(let d=0; d<rule.every && r+d<=rows; d++){
          const rr = r + d;
          if(cols[rr].indexOf(rule.col) >= 0 && !taken[k(rr,rule.col)]){ marks[k(rr,rule.col)] = true; break; }
        }
      return marks;
    };
    const card = place(map.cardRule, {});
    /* A map that already has a repertoire keeps it: storm laid as roads is
       still the five hard rounds, and the farm with roads is still the farm.
       Only the two boards that play all ten — classic and chaos — have no
       taste of their own to keep, so those draw a five for the night. */
    const own = kindsOf(map);
    const rep = own.length <= (cfg.kinds || 5) + 1
      ? { kinds:own, pattern:map.pattern }
      : drawRepertoire(cfg.kinds || 5);
    return { junction:cfg.junction, cols, out, card, wild:place(map.wildRule, card),
             kinds:rep.kinds, pattern:rep.pattern };
  }
  function setBoard(n, modeId, mapId, crowd, roads){
    const mode = MODES[modeId] || MODES.regular;
    const map = MAPS[mapId] || MAPS.classic;
    S.modeId = mode.id; S.mapId = map.id; S.roads = !!roads;
    S.rows = boardRows(n, mode.id, map.id, crowd);
    const shape = roads ? buildRoads(map, S.rows) : null;
    S.pattern = buildPattern(shape ? { pattern:shape.pattern } : map, mode.id, shape && shape.kinds);
    S.cardRule = map.cardRule;
    S.wildRule = map.wildRule;
    S.shape = shape;
  }
  /* The start line is not a square on the board — it is where a unit waits
     until it has scored something, so it is the most-played ground in the
     game: a quarter of every round is given from row 0. And 54% of units go
     four rounds or more without scoring, which means the people meeting the
     same plain round again and again are precisely the ones already losing.
     So it rotates — by round number, so the whole table is standing on the
     same one and it can be said out loud. Standard, Partners, Fast, and back.
     Gamble is deliberately not among them: the start line is the one place a
     player is stuck without having chosen it, and a square that doubles what a
     wrong shout costs is the last thing to hand somebody already behind.
     Putting it here cost 2 points on the share of players who finish a game
     having scored nothing at all. Round zero is Standard, which keeps a
     table's first round the simple on-ramp it ought to be. Past the finish
     stays Standard: that unit has won and is not giving again. Row 0 is not
     part of boardLayout(), which starts at 1, so nothing here disturbs the
     board cache. */
  const START_LANE = ["S","T","F"];
  function nodeTypeAt(r,c){
    if(r <= 0) return START_LANE[((S && S.round) || 0) % START_LANE.length];
    if(r > ROWS()) return "S";
    const pattern = (S && S.pattern) || MAPS.classic.pattern;
    const col = pattern[c] || MAPS.classic.pattern[c];
    return col[(r-1) % col.length];
  }
  function isCardNode(r,c){
    if(r <= 0 || r > ROWS()) return false;
    if(S && S.shape) return !!S.shape.card[r+","+c];
    const rule = (S && S.cardRule) || MAPS.classic.cardRule;
    return c === rule.col && r % rule.every === 0;
  }
  /* The wildcard square: still rarer than a card square, and always in a
     different lane so the two rules can never claim the same node. It used to
     sit every six or seven rows, which put it on four boards out of five that
     no table ever reached — a whole system nobody met. */
  function isWildNode(r,c){
    if(r <= 0 || r > ROWS()) return false;
    if(isCardNode(r,c)) return false;
    if(S && S.shape) return !!S.shape.wild[r+","+c];
    const rule = (S && S.wildRule) || MAPS.classic.wildRule;
    return c === rule.col && r % rule.every === 0;
  }
  /* Landing on one rolls a single outcome and applies it on the spot. The new
     position is never re-examined afterwards — a leap onto another wildcard
     stops there, which keeps one unlucky roll from cascading. */
  const WILD_ODDS = [
    { kind:"card",    w:35 }, { kind:"leap", w:20 }, { kind:"slip",    w:15 },
    { kind:"steal",   w:10 }, { kind:"swap", w:10 }, { kind:"jackpot", w:10 }
  ];
  function rollWildKind(){
    const total = WILD_ODDS.reduce((s,o) => s + o.w, 0);
    let r = Math.random() * total;
    for(const o of WILD_ODDS){ r -= o.w; if(r <= 0) return o.kind; }
    return WILD_ODDS[0].kind;
  }
  function applyWild(u, kind){
    const out = { unitId:u.id, unitName:u.name, kind:kind };
    if(kind === "card"){
      const key = CARDKEYS[Math.floor(Math.random() * CARDKEYS.length)];
      u.cards = u.cards || []; u.cards.push(key);
      out.card = key;
    } else if(kind === "leap"){
      const to = Math.min(ROWS(), u.pos.r + 2);
      out.fromRow = u.pos.r; out.toRow = to;
      u.pos = landOn(to, u.pos.c);
    } else if(kind === "slip"){
      const to = Math.max(1, u.pos.r - 1);
      out.fromRow = u.pos.r; out.toRow = to;
      u.pos = landOn(to, u.pos.c);
    } else if(kind === "steal"){
      const lead = S.units.filter(x => x.id !== u.id && x.score > 0)
                          .sort((a,b) => b.score - a.score)[0];
      if(lead){ lead.score = Math.max(0, lead.score - 1); u.score = Math.max(0, u.score + 1); }
      out.from = lead ? lead.name : null;
    } else if(kind === "swap"){
      /* only with someone genuinely out on the board: trading with a unit
         still on the start line would be a harsher punishment than any
         outcome here is meant to be */
      const others = S.units.filter(x => x.id !== u.id && posOf(x).r >= 1 && !atFinish(x));
      const other = others[Math.floor(Math.random() * others.length)];
      if(other){ const mine = u.pos; u.pos = other.pos; other.pos = mine; }
      out.with = other ? other.name : null;
    } else if(kind === "jackpot"){
      u.score = Math.max(0, u.score + 2);
    }
    return out;
  }
  function rollWild(u){ return applyWild(u, rollWildKind()); }
  /* who wins, and when: "first" is the board itself — first unit to cross
     the finish line. "score" (Challenge) targets a score, but the finish
     line still stands as a safety net so a stalled game cannot run forever. */
  function winnerUnit(){
    const mode = MODES[(S && S.modeId)] || MODES.regular;
    const atEnd = S.units.find(u => atFinish(u));
    if(mode.win === "score"){
      const target = mode.scoreTarget || 20;
      return S.units.find(u => u.score >= target) || atEnd || null;
    }
    return atEnd || null;
  }
  function isGameOver(){ return !!winnerUnit(); }
  function colColor(c){ return ["var(--accent)","var(--good)","var(--blind)","var(--guilty)"][c]; }
  function colSoft(c){ return ["var(--accent-soft)","var(--good-soft)","var(--blind-soft)","var(--guilty-soft)"][c]; }
  function colInk(c){ return ["var(--accent-ink)","var(--good-ink)","var(--blind-ink)","var(--guilty-ink)"][c]; }

  /* a position is {r,c}. r=0 is the start line, r=ROWS()+1 is the finish. */
  function startPos(){ return { r:0, c:1 }; }
  function posOf(u){ return u.pos || startPos(); }
  function atFinish(u){ return posOf(u).r > ROWS(); }
  /* Which squares are on the board at all, and which of them a square leads
     to. A lattice answers both by arithmetic — every square exists and three
     ways lead on from each. A road map answers them from its own shape. */
  function nodeCols(r){
    const shape = S && S.shape;
    if(r <= 0 || r > ROWS()) return [1];
    return shape ? shape.cols[r] : [0,1,2,3];
  }
  function nodeExists(r,c){ return nodeCols(r).indexOf(c) >= 0; }
  /* the square actually there, when something other than a move puts a unit on
     a row — a wildcard's leap or slip keeps its lane, and on a road map that
     lane may not run through the row it lands in */
  function landOn(r,c){
    if(nodeExists(r,c)) return { r, c };
    let best = nodeCols(r)[0];
    nodeCols(r).forEach(x => { if(Math.abs(x-c) < Math.abs(best-c)) best = x; });
    return { r, c:best };
  }
  function nextFrom(p){
    const out = [];
    if(p.r >= ROWS()) return [{ r:ROWS()+1, c:1 }];
    if(p.r === 0) return nodeCols(1).map(c => ({ r:1, c }));
    const shape = S && S.shape;
    if(shape) return (shape.out[p.r+","+p.c] || []).map(c => ({ r:p.r+1, c }));
    for(let c=p.c-1;c<=p.c+1;c++){ if(c>=0 && c<COLS) out.push({ r:p.r+1, c }); }
    return out;
  }
  function key(p){ return p.r+","+p.c; }
  /* every square you could stand on after spending up to `steps` */
  function reachable(from, steps){
    const seen = {}, out = [];
    let edge = [from];
    seen[key(from)] = true;
    for(let i=0;i<steps;i++){
      const nxt = [];
      edge.forEach(p => nextFrom(p).forEach(q => {
        if(!seen[key(q)]){ seen[key(q)] = true; const w = { r:q.r, c:q.c, d:i+1 }; nxt.push(w); out.push(w); }
      }));
      edge = nxt;
      if(!edge.length) break;
    }
    return out;
  }
  function modOf(u){ const p = posOf(u); return nodeTypeAt(p.r, p.c); }

  /* ---------- drawing ---------- */
  function nodeXY(r,c){
    const R = ROWS();
    const top = 34, bottom = 534;
    const y = bottom - (bottom-top) * (r / (R+1));
    const x = 44 + c * 77;
    if(r === 0 || r > R) return { x: 44 + 1.5*77, y };
    return { x, y };
  }

  /* ============ state ============ */
  let S = null;
  function freshState(){
    return { screen:"setup", lang:(typeof S!=="undefined"&&S&&S.lang)||"en",
             names:["Dana","Savta","Ilan","Yoni"], mode:"solo",
             modeId:"regular", mapId:"classic", pattern:null, cardRule:null, shape:null,
             players:[], units:[], giverIdx:0, round:0, used:[], r:null, result:null,
             left:{}, rows:16, steps:{}, moveSeat:0, offers:null, boardBack:null, cardsWho:null };
  }
  function shuffle(a){ const x=a.slice(); for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; } return x; }
  function esc(s){ return String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
  /* Somebody who gets up and goes is taken out of S.players, but the round
     that was already running still names them — the giver of the round being
     abandoned, the partner a shot was aimed at. S.left keeps the name so the
     sentence stays a sentence. */
  function playerById(id){ return S.players.find(p=>p.id===id) || (S.left && S.left[id]) || {name:"?",id:""}; }
  function unitById(id){ return S.units.find(u=>u.id===id) || S.units[0]; }
  function unitOf(pid){ return S.units.find(u=>u.members.indexOf(pid)>=0) || S.units[0]; }
  function teammate(pid){ const u=unitOf(pid); return (u.members.filter(x=>x!==pid)[0]) || null; }

  /* ============ a round ============ */
  function newRound(){
    const giver = S.players[S.giverIdx % S.players.length].id;
    const mod = S.forceBlind ? "B" : modOf(unitOf(giver));
    /* A Gamble deals from the top of the bank. Every other round hands the
       giver one word from each tier, so there is always a cheap one to hide
       behind; on this square there is not. Half the risk is here and the other
       half is the clock, and between them they are what the two extra points
       are paid for. */
    const words = (mod === "G" ? [4,4,5,5] : [2,3,4,5]).map(v=>{
      const bank = W[v];
      const fresh = bank.filter(x=>S.used.indexOf(v+"|"+x)<0);
      const pool = fresh.length ? fresh : bank;
      const text = pool[Math.floor(Math.random()*pool.length)];
      S.used.push(v+"|"+text);
      return { text, value:wordPoints(v) };
    });
    /* `shotPublic` is whether the table can see who is aimed at. `shotFixed`
       is whether the game drew them, in which case the giver cannot change it.
       Duel is the one round that is public and still the giver's own choice —
       naming somebody out loud is the whole of it. */
    let shot = null, shotPublic = false, shotFixed = false;
    if(S.mode === "teams"){ shot = teammate(giver); shotPublic = shotFixed = true; }
    else if(mod === "T"){
      const others = S.players.filter(p=>p.id!==giver);
      shot = others[Math.floor(Math.random()*others.length)].id;
      shotPublic = shotFixed = true;
    }
    else if(mod === "U"){ shotPublic = true; }
    if(S.forceBlind){ S.forceBlind = false; }
    const modeTimer = (MODES[S.modeId] || MODES.regular).timer;
    S.r = { giver, words, pick:null, challenge: (mod==="B" || mod==="L" ? "open" : null), topic:null,
            shot: (mod==="B"?null:shot), shotPublic: (mod==="B"?false:shotPublic),
            shotFixed: (mod==="B"?false:shotFixed), only:null, mod,
            pick2:null, found:[], linkKey:null, linkPool:null, shown:null,
            total: (mod==="F"||mod==="G") ? modeTimer.fast : modeTimer.normal,
            acc:0, startedAt:null, lockedOut:[], solvedBy:null, solveMs:null,
            judging:null, doubles:[], insight:false, veto:false, mimeCard:false, swapped:false };
    if(mod === "L") dealLink();
    S.round += 1; S.result = null; S.steps = {}; S.moveSeat = 0; S.offers = null;
    S.screen = (mod === "B") ? "blindPick" : "giverHandoff";
  }
  function elapsedMs(){ const R=S.r; return (R.acc||0) + (R.startedAt ? Date.now()-R.startedAt : 0); }
  function remainMs(){ return Math.max(0, S.r.total*1000 - elapsedMs()); }
  function pauseClock(){ const R=S.r; if(R.startedAt){ R.acc = elapsedMs(); R.startedAt = null; } }
  function resumeClock(){ const R=S.r; if(!R.startedAt && !R.solvedBy) R.startedAt = Date.now(); }

  function scoreRound(){
    const R = S.r;
    const val = wordValue(R, R.words[R.pick]);
    const wrongCost = (R.mod === "G") ? 2 : 1;
    const add = {};
    const bump = (uid,n,why)=>{ const e = add[uid] = add[uid] || {pts:0, why:[]}; e.pts += n; if(why) e.why.push(why); };
    R.lockedOut.forEach(pid => bump(unitOf(pid).id, -wrongCost, t("w_wrong", wrongCost)));
    const gu = unitOf(R.giver);
    if(R.mod === "B"){
      if(R.solvedBy){
        const frac = R.solveMs / (R.total*1000);
        const n = frac <= 0.25 ? val+2 : (frac <= 0.70 ? val+1 : val);
        bump(gu.id, n, frac <= 0.25 ? t("w_fast", n) : (frac <= 0.70 ? t("w_ok", n) : t("w_slow", n)));
        S.players.forEach(p => { if(p.id !== R.giver) bump(unitOf(p.id).id, 1, t("w_helped")); });
      } else {
        bump(gu.id, 0, t("w_none"));
      }
      (R.doubles||[]).forEach(uid=>{ const e=add[uid]; if(e && e.pts>0){ e.pts*=2; e.why.push(t("w_double", e.pts)); } });
      const rowsB = S.units.map(u=>{
        const e = add[u.id] || {pts:0, why:[]};
        u.score = Math.max(0, u.score + e.pts);
        return { id:u.id, name:u.name, pts:e.pts, why:e.why, giver:u.id===gu.id };
      });
      S.result = { rows:rowsB, word:R.words[R.pick], solvedBy:R.solvedBy, solveMs:R.solveMs, total:R.total, val, mod:R.mod };
      S.steps = {}; rowsB.forEach(r=>{ if(r.pts>0) S.steps[r.id]=r.pts; });
      S.moveSeat = 0; S.giverIdx += 1;
      return;
    }
    if(R.mod === "W"){
      /* Two words, one sentence, and each of them pays whoever said it. The
         giver is paid once, on the timing of the SECOND word — that is the
         one they were really holding out for. Half the job done pays them the
         same as a word that landed instantly: something, but the least. */
      const found = (R.found || []).slice().sort((a,b) => a.ms - b.ms);
      found.forEach(f => {
        const w = R.words[f.pick];
        if(!w) return;
        bump(unitOf(f.by).id, wordValue(R, w), t("w_word", wordValue(R, w)));
      });
      if(found.length >= 2){
        const last = found[found.length-1];
        /* The discount is there because two payments go out to whoever said
           the words. The giver is still paid once, so taking it off their band
           as well charged them twice for the same thing — and the sweep put a
           Two words giver on 1.2 points against a Standard round's 2.3, the
           worst square on the board to be standing on. Their band is read off
           what the word is worth on its own. */
        const val2 = wordValue(R, R.words[last.pick]) + 1;
        const frac = last.ms / (R.total*1000);
        const band = frac <= 0.25 ? {n:1,      w:t("w_early")}
                   : frac <= 0.70 ? {n:val2,   w:t("w_mid", val2)}
                                  : {n:val2+1, w:t("w_late", val2+1)};
        bump(gu.id, band.n, band.w);
        /* Landing two words on one sentence is the harder ask, and paying it
           the same as landing one made Two words the worst square on the board
           to be standing on once the rounds that only half-landed were counted
           in. Both of them home is worth a point of its own. */
        bump(gu.id, 1, t("w_both"));
      } else if(found.length === 1){
        bump(gu.id, 1, t("w_half"));
      } else {
        bump(gu.id, 0, t("w_none"));
      }
      if(R.shot && found.some(f => f.by === R.shot))
        bump(gu.id, shotBonus(R), t("w_shot", shotBonus(R)));
      /* a unit that both gave the clue and said one of the words is paid once,
         the better of the two, the same way a partner who gets it is */
      const gv = add[gu.id];
      if(gv && found.some(f => unitOf(f.by).id === gu.id)){
        const mine = found.filter(f => unitOf(f.by).id === gu.id)
                          .reduce((n,f) => n + wordValue(R, R.words[f.pick]), 0);
        const asGiver = gv.pts - mine;
        gv.pts = Math.max(mine, asGiver);
      }
      (R.doubles||[]).forEach(uid=>{ const e=add[uid]; if(e && e.pts>0){ e.pts*=2; e.why.push(t("w_double", e.pts)); } });
      const rowsW = S.units.map(u=>{
        const e = add[u.id] || {pts:0, why:[]};
        u.score = Math.max(0, u.score + e.pts);
        return { id:u.id, name:u.name, pts:e.pts, why:e.why, giver:u.id===gu.id };
      });
      const last = found[found.length-1];
      S.result = { rows:rowsW, word:R.words[R.pick], mod:R.mod, total:R.total, val,
                   solvedBy: last ? last.by : null, solveMs: last ? last.ms : null,
                   /* both words, said out loud by now, and who said each */
                   pair: [R.pick, R.pick2].map(i => {
                     const f = found.find(x => x.pick === i);
                     return { text:(R.words[i]||{}).text, value:R.words[i] ? wordValue(R, R.words[i]) : 0,
                              by: f ? f.by : null, ms: f ? f.ms : null };
                   }) };
      S.steps = {}; rowsW.forEach(r=>{ if(r.pts>0) S.steps[r.id]=r.pts; });
      S.moveSeat = 0; S.giverIdx += 1;
      return;
    }
    if(R.solvedBy){
      const su = unitOf(R.solvedBy);
      const frac = R.solveMs / (R.total*1000);
      const band = (R.mod === "M")
        ? (frac <= 0.25 ? {n:val+2, w:t("w_fast", val+2)}
         : frac <= 0.70 ? {n:val+1, w:t("w_ok", val+1)}
                        : {n:val,   w:t("w_slow", val)})
        : (frac <= 0.25 ? {n:1,     w:t("w_early")}
         : frac <= 0.70 ? {n:val,   w:t("w_mid", val)}
                        : {n:val+1, w:t("w_late", val+1)});
      if(su.id === gu.id){
        // teams: your own partner got it — one payment, the better of the two, never both
        const best = Math.max(val, band.n);
        bump(su.id, best, best === band.n ? band.w : t("w_word", best));
      } else {
        bump(su.id, val, t("w_word", val));
        bump(gu.id, band.n, band.w);
        if(R.shot && R.shot === R.solvedBy) bump(gu.id, shotBonus(R), t("w_shot", shotBonus(R)));
      }
    } else if(R.mod === "G"){
      /* Gamble raises everybody's stake but the giver's: the word pays two
         points more to whoever gets it and a wrong shout costs two, while the
         giver had nothing of their own on the table. A round nobody gets costs
         them one, and on this square nearly a third of them do — the short
         clock and the dear word see to that. It is the whole of why this is a
         bet and not a free upgrade, and the reason two points are affordable. */
      bump(gu.id, -1, t("w_none_x2"));
    } else {
      bump(gu.id, 0, t("w_none"));
    }
    (R.doubles||[]).forEach(uid=>{ const e=add[uid]; if(e && e.pts>0){ e.pts*=2; e.why.push(t("w_double", e.pts)); } });
    const rows = S.units.map(u=>{
      const e = add[u.id] || {pts:0, why:[]};
      u.score = Math.max(0, u.score + e.pts);
      return { id:u.id, name:u.name, pts:e.pts, why:e.why, giver:u.id===gu.id };
    });
    S.result = { rows, word:R.words[R.pick], solvedBy:R.solvedBy, solveMs:R.solveMs, total:R.total, val, mod:R.mod };
    S.steps = {}; rows.forEach(r=>{ if(r.pts>0) S.steps[r.id]=r.pts; });
    S.moveSeat = 0;
    S.giverIdx += 1;
  }


  return {
    get S(){ return S; },
    set S(v){ S = v; },
    applyLang,
    t,
    freshState,
    shuffle,
    esc,
    playerById,
    unitById,
    unitOf,
    teammate,
    newRound,
    scoreRound,
    elapsedMs,
    remainMs,
    pauseClock,
    resumeClock,
    dealTopic,
    dealLink,
    wordValue,
    wordPoints,
    valueDelta,
    initials,
    ROWS,
    setBoard,
    boardRows,
    nodeCols,
    nodeExists,
    nodeTypeAt,
    isCardNode,
    isWildNode,
    rollWild,
    colColor,
    startPos,
    posOf,
    atFinish,
    nextFrom,
    reachable,
    modOf,
    nodeXY,
    key,
    winnerUnit,
    isGameOver,
    get CHALLENGES(){ return CHALLENGES; },
    get UNIT_COLORS(){ return UNIT_COLORS; },
    get COLS(){ return COLS; },
    get MODES(){ return MODES; },
    get MAPS(){ return MAPS; },
    packs(){ return { W, CARDS, MODS, TOPICS, LINKS, TIER, CARDKEYS, D }; }
  };
}

module.exports = { createEngine };
