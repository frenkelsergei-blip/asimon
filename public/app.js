/* Asimon — the phone.
   The server decides everything; this file only draws what this phone was
   sent and posts back what its owner taps.                                  */
"use strict";
const app = document.getElementById("app");
const AV = ["#2C6BFF","#12B886","#FF5A3D","#D97706","#7A5AF8","#0891B2","#DB2777","#4D7C0F"];
/* a word card is tinted by what it pays. Four prices, 1 up to 4, and the
   ones above that a Gamble square or a Cold deal can push a word to. */
const VAL_TINT = { 1:["var(--accent-soft)","var(--accent)"], 2:["var(--good-soft)","var(--good-ink)"],
                   3:["#F1EDFE","var(--violet)"],            4:["var(--blind-soft)","var(--blind-ink)"],
                   5:["var(--blind-soft)","var(--blind-ink)"] };

/* copy that only exists once you are playing across phones */
const L = {
  he:{ title:"אסימון", tag:"משפט אחד · הזדמנות אחת",
    yourname:"איך קוראים לכם?", nameph:"השם שלכם", create:"לפתוח חדר חדש",
    joinbtn:"להצטרף עם קוד", join_k:"קוד החדר", codeph:"ABCD", go:"להצטרף", back:"חזרה",
    lang_k:"שפה", room_k:"קוד החדר", players_k:"מי בפנים", host:"מארח/ת", you:"את/ה",
    face_k:"בחרו פרצוף", face_d:"זה מה שכולם יראו לידכם כל המשחק.",
    face_change:"להחליף פרצוף", face_done:"זהו", e_face_taken:"מישהו כבר לקח את הפרצוף הזה.",
    waiting:"מחכים לעוד שחקנים — צריך לפחות 3.", startgame:"מתחילים", leave:"לצאת מהחדר",
    seat_groups:"בקבוצות", group_k:"הקבוצה שלכם", group_ph:"שם הקבוצה", person_ph:"שם",
    groups_note:"עד {0} אנשים על הטלפון הזה. הניקוד קבוצתי — אבל המשחק זוכר מי עשה מה.",
    group_of:"{0} בקבוצה",
    share:"שאר הטלפונים נכנסים לכתובת הזאת, על אותו ה־Wi‑Fi:", hostwait:"המארח/ת מתחיל/ה את המשחק.",
    bigscreen:"יש טלוויזיה או טאבלט? פתחו שם את הכתובת הזאת — מסך שרק מראה את הלוח ואת המצב:",
    offline:"מנותק — מנסים להתחבר מחדש…",
    picking:"{0} בוחר/ת מילה", picking_d:"רגע אחד. אל תסתכלו לו/ה בטלפון.",
    lookaway:"{0} — תסתובבו", lookaway_d:"כל השאר בוחרים לכם מילה בטלפון שלהם.",
    yourword:"המילה שלכם", buzznow:"יש לי!", buzzsub:"לוחצים ואומרים בקול",
    /* the same round, told to the phone holding the buzzer instead of to the
       one saying the sentence — say_it* is the giver's, hear_it* everyone else's */
    hear_it:"תקשיבו. זה נאמר פעם אחת.",
    hear_it_d:"ברגע שנפל האסימון: לוחצים.",
    hear_it_one:"מילה אחת. תקשיבו טוב.",
    hear_it_one_d:"מילה אחת בלבד, נאמרת פעם אחת. נפל האסימון? לוחצים.",
    hear_it_mime:"תסתכלו. בלי מילה, בלי קול.",
    hear_it_mime_d:"ברגע שנפל האסימון: לוחצים.",
    youout:"אתם בחוץ בסבב הזה", giverwait:"אתם נותנים את הרמז — אין באזר.",
    blind_nobuzz:"{0} מנחש/ת — הבאזר שלהם.", time_up_wait:"הזמן נגמר — הסבב נסגר",
    someone:"{0} לחץ/ה", judging:"{0} בודק/ת את התשובה…", waitjudge:"מחכים לנותן/ת הרמז.",
    duelwatch:"דו־קרב &mdash; {0} עונה לבד.",
    waitjudge_b:"מחכים לכל השאר.",
    aim_at:"כוונו לאדם אחד", pass_note:"הטלפון נשאר אצלכם — אף אחד אחר לא רואה את המילים.",
    mode_k:"איך משחקים?", mode_solo:"כל אחד לעצמו", mode_teams:"בזוגות",
    gm_k:"באיזו מהירות?", gm_teaser:"מהיר, רגיל, רגוע או אתגר — לכל אחד קצב אחר.",
    gm_title:"סגנון משחק", gm_close:"סגירה",
    map_k:"הלוח הפעם", reroll:"להגריל לוח אחר", mm_fmt:"{0} · {1}",
    shape_k:"איך הלוח מונח", shape_lanes:"מסלולים", shape_roads:"פרשת דרכים",
    shape_lanes_d:"ארבעה מסלולים פתוחים — מכל משבצת אפשר ישר או לצדדים.",
    shape_roads_d:"דרכים וצמתים — חצי מהמשבצות, ובוחרים דרך ונשארים עליה עד הצומת הבא.",
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
    e_not_started:"המשחק לא התחיל.",
    /* ---- הפסקה, ופרישה באמצע ---- */
    pause:"הפסקה", paused_k:"הפסקה", paused_head:"השולחן עוצר",
    pause_ask_k:"להפסיק את המשחק?",
    pause_ask_d:"השעון של כולם נעצר במקום, ואף אחד לא יכול לענות. ממשיכים אוטומטית אחרי חצי דקה — או ברגע שתלחצו ״ממשיכים״.",
    pause_ask_yes:"כן, עוצרים", pause_ask_no:"לא, ממשיכים",
    paused_by:"{0} ביקש/ה רגע", paused_auto:"ממשיכים לבד כשזה נגמר",
    paused_d:"שעון הסבב עצר על {0} ואף אחד לא יכול לענות. כל לחיצה על ״עוד 30״ מוסיפה חצי דקה.",
    paused_d2:"אף אחד לא יכול לגעת בכלום עד שחוזרים. כל לחיצה על ״עוד 30״ מוסיפה חצי דקה.",
    paused_wait:"מחכים ל{0}", paused_wait_d:"אפשר להוסיף עוד חצי דקה. לחזור מוקדם יכולים רק {0} או המארח/ת — ואם אף אחד לא נוגע, המשחק ממשיך לבד.",
    pause_more:"עוד 30 שניות", pause_back:"ממשיכים",
    pause_left:"הפסקות שנשארו לכם: {0}", pause_last:"זו ההפסקה האחרונה שלכם.",
    pause_spent:"אין לכם עוד הפסקות",
    quit:"לפרוש מהמשחק", quit_k:"לפרוש מהמשחק?",
    quit_1:"האסימון שלכם יורד מהלוח, והניקוד לא נשמר.",
    quit_2:"אם אתם באמצע רמז — הסבב יחולק מחדש, באותו מספר, לשחקן/ית הבא/ה.",
    quit_3:"השאר ממשיכים. נשאר שולחן של אחד? המשחק נגמר.",
    quit_note:"אפשר לחזור בכל רגע עם קוד החדר — אבל בתור שחקן/ית חדש/ה, בלי הנקודות.",
    quit_yes:"כן, אני יוצא/ת", quit_no:"לא, ממשיכים",
    gone_msg:"{0} פרש/ה", gone_sub:"השאר ממשיכים",
    e_paused:"המשחק בהפסקה.", e_not_your_break:"ההפסקה לא שלכם.",
    e_no_breaks:"נגמרו לכם ההפסקות.",
    /* ---- איך משחקים ---- */
    howto:"איך משחקים?", hw_teaser:"חדשים במשחק? כל הכללים בדקה.",
    hw_k:"איך משחקים", hw_close:"סגירה", hw_got:"הבנתי, קדימה",
    hw_idea:"מישהו אחד יודע את המילה ואומר עליה משפט אחד. השאר צריכים לקלוט מה זה. הטריק: הנותן לא רוצה שיקלטו מהר — הוא רוצה שיקלטו בשנייה האחרונה.",
    hw_round_k:"סבב, שלב אחרי שלב",
    hw_s1:"הנותן בוחר מילה", hw_s1d:"ארבע מילים על המסך שלו, שוות 1 עד 4 נקודות. ככל שהמילה שווה יותר, ככה היא קשה יותר.",
    hw_s2:"ומכוון לאדם אחד", hw_s2d:"בשקט, בלי שאף אחד יידע. אם דווקא הוא זה שקולט — הנותן מקבל נקודה נוספת.",
    hw_s3:"משפט אחד. פעם אחת.", hw_s3d:"תשעים שניות על השעון. אסור לומר את המילה, ואסור לחזור על המשפט.",
    hw_s4:"מי שקולט — לוחץ", hw_s4d:"לוחצים על הכפתור האדום ואומרים בקול. צדקתם? צברתם. טעיתם? יורדת נקודה ואתם בחוץ עד סוף הסבב.",
    hw_when_k:"מתי הכי כדאי שיקלטו",
    hw_b1:"מיד", hw_b1d:"הנותן לוקח 1", hw_b2:"באמצע", hw_b2d:"שווי המילה", hw_b3:"ברגע האחרון", hw_b3d:"שווי המילה +1",
    hw_when_d:"אף אחד לא קלט? הנותן לא מקבל כלום. לכן רמז מעורפל מדי מסוכן בדיוק כמו רמז ברור מדי — צריך לכוון לשנייה האחרונה, לא אחריה.",
    hw_score_k:"מי מקבל מה",
    hw_p1:"הקולט", hw_p1d:"מקבל את שווי המילה במלואו, בלי קשר לתזמון.",
    hw_p2:"הנותן", hw_p2d:"מקבל לפי התזמון שלמעלה, ועוד נקודה אם זה האדם שכיוון אליו.",
    hw_p3:"באזה שגוי", hw_p3d:"עולה נקודה אחת, ואתם מחוץ לסבב.",
    hw_board_k:"והלוח",
    hw_board_d:"כל נקודה שצברתם היא צעד על הלוח. הראשון שמגיע לסוף מנצח — בערך שמונה סבבים, כ־25 דקות. במסך התנועה יש הסבר מלא על הלוח.",
    /* ---- מקרא הלוח ---- */
    lg_open:"מה זה הלוח?", lg_teaser:"מסלולים, קלפים, ואיך בכלל זזים.",
    zoom_out:"כל הלוח", zoom_in:"רק המהלכים שלי",
    lg_k:"קוראים את הלוח", lg_close:"סגירה",
    lg_step_k:"איך זזים",
    lg_step_d:"כל נקודה שצברתם בסבב היא צעד אחד. צעד = שורה אחת קדימה, ואפשר לגלוש מסלול אחד ימינה או שמאלה. אפשר לעצור בכל משבצת שמסומנת — לא חייבים לנצל את כל הצעדים.",
    lg_step_rd:"כל נקודה שצברתם בסבב היא צעד אחד. כאן אין מסלולים ישרים — יש דרכים. צעד = משבצת אחת קדימה בדרך שאתם עליה, ולרוב יש רק דרך אחת. בצומת — משבצת בודדת שכולם עוברים בה — כל הדרכים נפתחות. אפשר לעצור בכל משבצת שמסומנת.",
    lg_lane_k:"המסלולים",
    lg_lane_rk:"הצבעים",
    lg_lane_d:"ארבעה מסלולים, כל אחד בצבע שלו, וכל אחד נושא סוג אחר של סבבים.",
    lg_lane_rd:"אין כאן מסלולים ישרים — הדרכים מתפתלות. אבל הצבע של משבצת עדיין אומר איזה סוג סבב היא נושאת.",
    lg_lane_plain:"רק סבבים רגילים",
    lg_why_k:"למה זה משנה",
    lg_why_d:"המשבצת שהנותן עומד עליה קובעת איזה סוג סבב יהיה כשיגיע תורו. אז כשאתם בוחרים לאן לזוז — אתם בוחרים איזה סבב תיתנו.",
    lg_key_k:"מה יש על הלוח",
    lg_dot:"משבצת ריקה", lg_dot_d:"סבב רגיל. תשעים שניות, משפט אחד.",
    lg_card:"משבצת קלף", lg_card_d:"נחיתה עליה נותנת לכם קלף לבחירה.",
    lg_wild:"משבצת הפתעה", lg_wild_d:"נדירה. נחיתה עליה מגלגלת משהו — לרוב לטובתכם.",
    lg_end:"הסוף", lg_end_d:"הראשון שמגיע מנצח.",
    lg_twist_k:"התוויות הצבעוניות",
    lg_you:"אתם כאן",
    free_seat:"מקום פנוי", pick_card:"בחרו קלף מהיד", play_it:"לשחק את הקלף", take_it:"לקחת את הקלף",
    ord_k:"סדר המשחק", ord_rolling:"מגרילים סדר…", ord_title:"זה הסדר",
    ord_d:"מי נותן רמז ראשון, ומי אחרון. הסדר נקבע בהגרלה ונשאר ככה כל המשחק.",
    ord_ok:"אני מוכן/ה", ord_in:"מוכן/ה", ord_wait:"מחכים לעוד {0}",
    ord_first:"ראשון/ה", ord_last:"אחרון/ה",
    ord_gift:"קלף מתנה — רק לכם", ord_gift_d:"התחלתם עם קלף. אף אחד לא יודע שהוא אצלכם.",
    wild_k:"משבצת הפתעה", wild_hit:"{0} נחת/ה על הפתעה", wild_go:"ממשיכים",
    wild_card:"קלף חינם", wild_card_d:"{0} — ישר ליד.",
    wild_leap:"קפיצה קדימה", wild_leap_d:"שתי משבצות קדימה, בחינם.",
    wild_slip:"מעידה", wild_slip_d:"משבצת אחת אחורה.",
    wild_steal:"גניבת נקודה", wild_steal_d:"נקודה אחת עוברת מ{0} אליכם.",
    wild_steal_none:"אין ממי לגנוב — לאף אחד אין עדיין נקודות.",
    wild_swap:"החלפת מקומות", wild_swap_d:"החלפתם מקום עם {0}.",
    wild_swap_none:"לא נמצא מישהו להחליף איתו.",
    wild_jackpot:"ג׳קפוט", wild_jackpot_d:"שתי נקודות, כאן ועכשיו.",
    ver:"גרסה {0}", ver_tap:"לבדוק עדכון", ver_checking:"בודקים…",
    ver_fresh:"זו הגרסה העדכנית.", ver_failed:"אין חיבור לשרת.",
    upd_t:"יש גרסה חדשה", upd_d:"טוענים אותה מחדש — ייקח רגע.", upd_go:"לעדכן",
    cl_k:"מה חדש", cl_close:"סגירה", cl_now:"הגרסה שלכם",
    cl_new:"חדש", cl_rules:"כללים", cl_change:"השתנה", cl_fix:"תוקן",
    cl_loading:"טוענים…", cl_failed:"אין חיבור לשרת.", cl_retry:"לנסות שוב",
    e_dummy:"" },
  en:{ title:"Asimon", tag:"one sentence · one shot",
    yourname:"What is your name?", nameph:"Your name", create:"Open a new room",
    joinbtn:"Join with a code", join_k:"Room code", codeph:"ABCD", go:"Join", back:"Back",
    lang_k:"Language", room_k:"Room code", players_k:"Who is in", host:"host", you:"you",
    face_k:"Pick your face", face_d:"This is what everyone sees next to you all game.",
    face_change:"Change face", face_done:"Done", e_face_taken:"Somebody already took that face.",
    waiting:"Waiting for more players — you need at least 3.", startgame:"Start the game", leave:"Leave the room",
    seat_groups:"In groups", group_k:"Your group", group_ph:"Group name", person_ph:"Name",
    groups_note:"Up to {0} people on this phone. The score is the group's — but the game remembers who did what.",
    group_of:"{0} in the group",
    share:"The other phones open this address, on the same Wi‑Fi:", hostwait:"The host starts the game.",
    bigscreen:"A television or a tablet in the room? Open this on it — a screen that only shows the board and where everyone stands:",
    offline:"Disconnected — reconnecting…",
    picking:"{0} is choosing a word", picking_d:"Give them a moment. No peeking at their phone.",
    lookaway:"{0} — look away", lookaway_d:"Everyone else is choosing your word on their own phone.",
    yourword:"Your word", buzznow:"I have it!", buzzsub:"tap, then say it out loud",
    hear_it:"Listen. It is said once.",
    hear_it_d:"The moment it drops, hit the buzzer.",
    hear_it_one:"One word. Listen closely.",
    hear_it_one_d:"A single word, said once. The moment it drops, hit the buzzer.",
    hear_it_mime:"Watch. Not a word, not a sound.",
    hear_it_mime_d:"The moment it drops, hit the buzzer.",
    youout:"You are out for this round", giverwait:"You are giving the clue — no buzzer for you.",
    blind_nobuzz:"{0} is guessing — the buzzer is theirs.", time_up_wait:"Time is up — the round is closing",
    someone:"{0} buzzed", judging:"{0} is checking the answer…", waitjudge:"Waiting for the giver.",
    duelwatch:"A duel &mdash; {0} answers alone.",
    waitjudge_b:"Waiting for everybody else.",
    aim_at:"Aim at one person", pass_note:"The phone stays with you — nobody else can see these.",
    mode_k:"How are you playing?", mode_solo:"Every player for themselves", mode_teams:"In pairs",
    gm_k:"How fast do you want it?", gm_teaser:"Quick, Regular, Slow, or Challenge — each its own pace.",
    gm_title:"Play style", gm_close:"Close",
    map_k:"Tonight's board", reroll:"Roll a new board", mm_fmt:"{0} · {1}",
    shape_k:"How the board is laid", shape_lanes:"Lanes", shape_roads:"Crossroads",
    shape_lanes_d:"Four open lanes — from any square, straight on or to either side.",
    shape_roads_d:"Roads and junctions — half the squares; take a road and you are on it until the next junction.",
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
    e_not_started:"The game has not started.",
    /* ---- a break, and leaving in the middle ---- */
    pause:"Break", paused_k:"Break", paused_head:"The table has stopped",
    pause_ask_k:"Stop the game?",
    pause_ask_d:"Everyone's clock stops where it stands and nobody can answer. It starts again on its own after half a minute — or the moment you tap “Back to it”.",
    pause_ask_yes:"Yes, stop it", pause_ask_no:"Never mind",
    paused_by:"{0} asked for a moment", paused_auto:"it starts again on its own",
    paused_d:"The round clock stopped at {0} and nobody can answer. Each press of “+30” adds another half minute.",
    paused_d2:"Nobody can touch anything until you come back. Each press of “+30” adds another half minute.",
    paused_wait:"Waiting for {0}", paused_wait_d:"You can give them another half minute. Only {0} or the host can come back early — and if nobody touches it, the game carries on by itself.",
    pause_more:"+30 seconds", pause_back:"Back to it",
    pause_left:"Breaks you have left: {0}", pause_last:"This is your last one.",
    pause_spent:"No breaks left",
    quit:"Leave the game", quit_k:"Leave the game?",
    quit_1:"Your token comes off the board, and your score is not kept.",
    quit_2:"Mid-clue — the round is dealt again, same number, to the next player.",
    quit_3:"Everyone else carries on. A table of one? The game is over.",
    quit_note:"You can come back any time with the room code — as a new player, without the points.",
    quit_yes:"Yes, I'm out", quit_no:"Never mind",
    gone_msg:"{0} left", gone_sub:"the rest carry on",
    e_paused:"The game is on a break.", e_not_your_break:"That break is not yours to end.",
    e_no_breaks:"You have used both of your breaks.",
    /* ---- how to play ---- */
    howto:"How to play", hw_teaser:"New here? Every rule in a minute.",
    hw_k:"How to play", hw_close:"Close", hw_got:"Got it — let's go",
    hw_idea:"One person knows the word and says one sentence about it. Everyone else has to work out what it is. The catch: the giver does not want it caught quickly — they want it caught at the last second.",
    hw_round_k:"A round, step by step",
    hw_s1:"The giver picks a word", hw_s1d:"Four words on their phone, worth 1 to 4 points. The more it is worth, the harder it is.",
    hw_s2:"and aims at one person", hw_s2d:"Quietly, without anyone knowing. If that is the person who gets it, the giver takes one more.",
    hw_s3:"One sentence. Said once.", hw_s3d:"Ninety seconds on the clock. You may not say the word, and you may not repeat the sentence.",
    hw_s4:"Whoever gets it buzzes", hw_s4d:"Hit the red button and say it out loud. Right? You score. Wrong? A point comes off and you are out for the round.",
    hw_when_k:"When you want it to land",
    hw_b1:"Instantly", hw_b1d:"the giver takes 1", hw_b2:"Midway", hw_b2d:"the word's value", hw_b3:"At the last second", hw_b3d:"the word's value +1",
    hw_when_d:"Nobody gets it? The giver takes nothing. So a clue that is too vague is exactly as costly as one that is too obvious — aim for the last second, not past it.",
    hw_score_k:"Who takes what",
    hw_p1:"Whoever gets it", hw_p1d:"takes the word's full value, whenever they got it.",
    hw_p2:"The giver", hw_p2d:"takes what the timing above is worth, plus one if it was the person they aimed at.",
    hw_p3:"A wrong buzz", hw_p3d:"costs a point, and you are out for the rest of the round.",
    hw_board_k:"And the board",
    hw_board_d:"Every point you score is a step on the board. First to the end wins — about eight rounds, 25 minutes. The move screen explains the board in full.",
    /* ---- the board legend ---- */
    lg_open:"What is this board?", lg_teaser:"Lanes, cards, and how a step works.",
    zoom_out:"The whole board", zoom_in:"Just my moves",
    lg_k:"Reading the board", lg_close:"Close",
    lg_step_k:"How you move",
    lg_step_d:"Every point you scored this round is one step. A step is one row forward, and you may drift one lane left or right. Stop on any marked square — you do not have to spend them all.",
    lg_step_rd:"Every point you scored this round is one step. There are no straight lanes here, only roads. A step is one square along the road you are on, and most squares have exactly one way on. At a junction — the single square the whole table passes through — every road opens up. Stop on any marked square.",
    lg_lane_k:"The lanes",
    lg_lane_rk:"The colours",
    lg_lane_d:"Four lanes, each its own colour, each carrying a different kind of round.",
    lg_lane_rd:"No straight lanes here — the roads wander. But a square's colour still says what kind of round it carries.",
    lg_lane_plain:"Ordinary rounds only",
    lg_why_k:"Why it matters",
    lg_why_d:"The square the giver is standing on decides what kind of round it will be when their turn comes. So choosing where to move is choosing what round you will give.",
    lg_key_k:"What is on the board",
    lg_dot:"An empty square", lg_dot_d:"An ordinary round. Ninety seconds, one sentence.",
    lg_card:"A card square", lg_card_d:"Landing here lets you take a card.",
    lg_wild:"A wildcard square", lg_wild_d:"Rare. Landing here rolls something — usually in your favour.",
    lg_end:"The end", lg_end_d:"First one there wins.",
    lg_twist_k:"The coloured tags",
    lg_you:"You are here",
    free_seat:"A free seat", pick_card:"Tap a card in your hand", play_it:"Play it", take_it:"Take it",
    ord_k:"Play order", ord_rolling:"Drawing the order…", ord_title:"Here is the order",
    ord_d:"Who gives the first clue, and who gives the last. Drawn at random, and it holds all game.",
    ord_ok:"I'm ready", ord_in:"ready", ord_wait:"Waiting on {0} more",
    ord_first:"first", ord_last:"last",
    ord_gift:"A card, just for you", ord_gift_d:"You start holding this. Nobody knows you have it.",
    wild_k:"Wildcard square", wild_hit:"{0} hit a wildcard", wild_go:"Carry on",
    wild_card:"A free card", wild_card_d:"{0} — straight into your hand.",
    wild_leap:"Leap ahead", wild_leap_d:"Two squares forward, for nothing.",
    wild_slip:"Slipped back", wild_slip_d:"One square backwards.",
    wild_steal:"Stole a point", wild_steal_d:"One point off {0} and onto you.",
    wild_steal_none:"Nobody had a point to take yet.",
    wild_swap:"Swapped places", wild_swap_d:"You traded squares with {0}.",
    wild_swap_none:"There was nobody to swap with.",
    wild_jackpot:"Jackpot", wild_jackpot_d:"Two points, right now.",
    ver:"Version {0}", ver_tap:"Check for an update", ver_checking:"Checking…",
    ver_fresh:"This is the latest.", ver_failed:"Could not reach the server.",
    upd_t:"A new version is out", upd_d:"Loading it again takes a moment.", upd_go:"Update",
    cl_k:"What's new", cl_close:"Close", cl_now:"You are on this one",
    cl_new:"New", cl_rules:"Rules", cl_change:"Changed", cl_fix:"Fixed",
    cl_loading:"Loading…", cl_failed:"Could not reach the server.", cl_retry:"Try again",
    e_dummy:"" }
};

/* the four game modes: how fast/hard a game plays. Same {n,s,d} shape the
   engine's own EN_MODS/HE_MODS use, so this stays in step with them. */
const MODES_COPY = {
  he:{
    quick:    {n:"מהיר",  s:"מהיר",  d:"לוח קצר, שעון קצר — סבב שלם בפחות מדקה."},
    regular:  {n:"רגיל",  s:"רגיל",  d:"ברירת המחדל — תשעים שניות, הלוח שאתם מכירים."},
    slow:     {n:"רגוע",  s:"רגוע",  d:"לוח ארוך, שעון ארוך, פחות לחץ בכל סבב."},
    challenge:{n:"אתגר",  s:"אתגר",  d:"רוב הסבבים קשים, והניצחון נקבע לפי ניקוד — לא רק מי שמגיע ראשון לסוף."}
  },
  en:{
    quick:    {n:"Quick",     s:"QUICK", d:"A short board, a short clock — a whole round in under a minute."},
    regular:  {n:"Regular",   s:"REG",   d:"The default — ninety seconds, the board you already know."},
    slow:     {n:"Slow",      s:"SLOW",  d:"A longer board, a longer clock, less pressure each round."},
    challenge:{n:"Challenge", s:"HARD",  d:"Mostly hard rounds, and the win goes by score — not just who reaches the end first."}
  }
};
const MODE_IDS = ["quick","regular","slow","challenge"];

/* the five maps: different patterns, card placement and colour theme. Picked
   randomly per game; the host may reroll before starting, and may lay any of
   them as roads instead of lanes. */
const MAPS_COPY = {
  he:{
    classic:{n:"קלאסי",     d:"הלוח המוכר — תמהיל אחיד של הכול."},
    twist:  {n:"תפנית",     d:"הכול על המילים ואיך מותר להגיד אותן — כלום כאן לא קשור לשעון."},
    storm:  {n:"סופה",      d:"חמשת הסבבים הקשים, ושום דבר אחר."},
    sprint: {n:"ספרינט",    d:"קצר וזורם — הסבבים הנוחים, והימור לבדו מימין."},
    chaos:  {n:"תוהו ובוהו", d:"כל עשרת סוגי הסבבים, והמסלול השקט לא באמת שקט."}
  },
  en:{
    classic:{n:"Classic", d:"The board you already know — an even mix of everything."},
    twist:  {n:"Twist",   d:"All about the words and how you may say them — nothing here is about the clock."},
    storm:  {n:"Storm",   d:"The five hard rounds, and nothing else."},
    sprint: {n:"Sprint",  d:"Short and flowing — the gentle rounds, with Gamble alone on the right."},
    chaos:  {n:"Chaos",   d:"All ten kinds of round, and the quiet lane is not quiet."}
  }
};
/* four lane colours per map theme, read off the CSS custom properties so a
   redesign of the palette only ever has to happen in style.css */
function themeColc(themeId){ return asimonBoard.lanes(themeId); }

/* ---------------- how big this glass draws things ----------------
   style.css sizes the whole sheet off one dial, --k: 1 on a phone, more on a
   tablet. A handful of things are measured here instead of there — the cards
   in a hand, the podium, the tokens in the play order — because their size
   depends on how many there are. They read the same dial, so a tablet grows
   them with everything else rather than leaving them phone-sized.        */
function kScale(){
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--k"));
  return v > 0 ? v : 1;
}
const kpx = n => Math.round(n * kScale());

let lang = "he", pack = null, state = null, es = null, me = null;
let screen = "name", error = "", online = false, mode = "solo", gameMode = "regular";
let clockAt = 0, clockMs = 0, ticker = null;
/* the break: when this phone was told how much of it was left, and whether it
   is standing on the screen that asks if you really mean to go */
let pauseAt = 0, pauseMs = 0, quitting = false, pauseAsk = false;
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
/* The move screen opens on the squares you may actually stand on rather than
   on all seventeen rows; this is the way back out, and back in. */
let boardZoom = true;
/* the help sheet: null | "rules" | "legend" | "modes" | "whatsnew". sheetSeen
   stops it sliding in again every time the room pushes new state while it is
   open */
let sheet = null, sheetSeen = false;

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

/* ---------------- the version, and getting off an old one ----------------
   A phone on a home screen never reloads by itself. iOS keeps the page alive
   between launches, and in standalone there is no address bar to pull down —
   which is exactly how a table ends up playing last month's build without
   anyone knowing. So the page carries the build it was served as, asks the
   server now and then whether that is still the build being served, and offers
   a way back to the current one that clears everything on the way out.      */
const metaTag = n => { const m = document.querySelector('meta[name="'+n+'"]'); return m ? m.content : ""; };
const VERSION = metaTag("asimon-version") || "0";
const BUILD   = metaTag("asimon-build");
let newBuild = "", verBusy = false, verNote = "", verAt = 0;
/* What changed, and in which version. The list lives on the server — one file,
   both languages, the same one CHANGELOG.md is written from — so a phone that
   has sat on a home screen for a month can read what it has been missing
   before it decides to reload. Asked for only when the sheet is opened, and
   then kept for the rest of the session. */
let clRel = null, clLang = "", clBusy = false, clErr = false;

async function checkUpdate(manual){
  if(verBusy || newBuild) return;
  /* a phone coming back to the foreground asks at most twice a minute; a tap
     always asks, because a tap is somebody who suspects they are stale */
  if(!manual && Date.now() - verAt < 30000) return;
  verBusy = true; verAt = Date.now();
  const was = newBuild + "|" + verNote;
  if(manual){ verNote = "checking"; render(); }
  try{
    const r = await fetch("/api/version?t=" + Date.now(), { cache:"no-store" });
    const v = await r.json();
    if(v && v.build && BUILD && v.build !== BUILD){ newBuild = v.build; verNote = ""; }
    else verNote = manual ? "fresh" : "";
  }catch(e){ verNote = manual ? "failed" : verNote; }
  verBusy = false;
  /* a quiet check that found nothing repaints nothing — it can land in the
     middle of a round, and a repaint there is a flicker for no reason */
  if(manual || newBuild + "|" + verNote !== was) render();
}

/* Called every time the sheet is drawn rather than only when it is opened, so
   it is written to do nothing at all once the list is in hand — and to ask
   again by itself if the language moved out from under it. */
async function loadChangelog(){
  const want = lang;
  if(clBusy || (clRel && clLang === want)) return;
  clBusy = true; clErr = false; render();
  try{
    const r = await fetch("/api/changelog?lang=" + encodeURIComponent(want), { cache:"no-store" });
    const d = await r.json();
    clRel = (d && Array.isArray(d.releases)) ? d.releases : [];
    clLang = want;
  }catch(e){ clErr = true; }
  clBusy = false;
  render();
}

/* Drop anything that could hand back the old files — there is no service
   worker here, but one may have been registered by an older build, and a phone
   that is stuck is exactly the phone that would still be holding it — then come
   back on an address this phone has never seen before. */
async function applyUpdate(){
  try{
    if(navigator.serviceWorker){
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  }catch(e){}
  try{
    if(window.caches){ const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); }
  }catch(e){}
  try{
    const u = new URL(location.href);
    u.searchParams.set("u", newBuild || String(Date.now()));
    location.replace(u.toString());
  }catch(e){ location.reload(); }
}

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
  es.onopen  = () => { online = true; seatChecks = 0; lastHeard = Date.now(); render(); };
  es.onerror = () => {
    online = false; render();
    /* a 404 closes an EventSource for good; anything else it retries itself */
    if(es && es.readyState === 2) checkSeat();
  };
  es.onmessage = ev => {
    lastHeard = Date.now();
    let msg; try{ msg = JSON.parse(ev.data); }catch(e){ return; }
    if(msg.type === "beat") return;          /* nothing to do but have heard it */
    if(msg.type === "ui"){ pack = msg.pack; lang = msg.lang; applyLang(); render(); return; }
    if(msg.type === "event"){
      if(msg.kind === "left") showNote(t("gone_msg", esc(msg.by)), t("gone_sub"));
      else showBanner(msg);
      return;
    }
    if(msg.type !== "state") return;
    const prev = state;
    state = msg.state;
    if(state.lang !== lang){ lang = state.lang; applyLang(); }
    if(!prev || prev.phase !== state.phase || prev.round !== state.round){
      movePickLocal = null; showHand = false; boardZoom = true; }
    if(typeof state.remainMs === "number"){ clockMs = state.remainMs; clockAt = Date.now(); }
    if(state.paused){ pauseMs = state.paused.ms; pauseAt = Date.now(); pauseAsk = false; }
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
/* Phones suspend the page when they lock, and the socket underneath often
   dies while they are asleep — the page is frozen, so no error event ever
   runs. It wakes to an EventSource still reporting OPEN, an `online` flag
   still true, and nothing at all coming down: this used to pass every test
   here and reconnect nothing, which is how a phone could sit on a round the
   rest of the table had already finished. So the stream is judged by what it
   has actually delivered, not by what it claims about itself. */
let lastHeard = 0;
const STALE_MS = 50000;                  /* two and a half missed heartbeats */
const streamDead = () => !es || es.readyState === 2 || !online ||
                         (lastHeard > 0 && Date.now() - lastHeard > STALE_MS);
function ensureLive(){
  if(!me || !me.pid) return;
  if(streamDead()){ seatChecks = 0; checkSeat(); }
}
document.addEventListener("visibilitychange", () => { if(!document.hidden) ensureLive(); });
window.addEventListener("online", ensureLive);
window.addEventListener("pageshow", ensureLive);
/* and for a socket that dies while the page is watching, where no wake-up
   event is coming to ask the question for us */
setInterval(ensureLive, 10000);

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
function banner(inner, tone){
  const old = document.querySelector(".banner");
  if(old) old.remove();
  if(bannerTimer) clearTimeout(bannerTimer);
  const el = document.createElement("div");
  el.className = "banner";
  el.innerHTML = '<div class="in">'+inner+'</div>';
  document.body.appendChild(el);
  flash(tone);
  bannerTimer = setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 320);
  }, 2400);
}
function showBanner(ev){
  banner(cardTile(ev.card.key)+
    '<span><span class="bn">'+esc(ev.card.n)+'</span>'+
    '<span class="bw" style="display:block">'+t("played_by", esc(ev.by))+'</span></span>', ev.tone);
}
/* the same drop-down strip, with words instead of a card: somebody left */
function showNote(bold, sub){
  banner('<span class="bn">'+bold+'</span><span class="bw">'+sub+'</span>');
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
/* offered only where a reload costs nothing — the name screen, the lobby, the
   podium. Never mid-round: a game in play is not the moment to ask anyone to
   reload, and the round would be waiting on them. */
function updBox(){
  if(!newBuild) return "";
  return '<div class="upd"><span class="ut"><b>'+t("upd_t")+'</b>'+
         '<span>'+t("upd_d")+'</span></span>'+
         '<button id="updgo">'+t("upd_go")+'</button></div>';
}
/* the line at the foot of the first screen: which build this phone is, what
   arrived in it, and a way to ask for a newer one without waiting for the next
   check. Three plain words on one line — none of this is a task, so none of it
   wears a button. */
function verBox(){
  const note = verBusy ? t("ver_checking")
             : verNote === "fresh"  ? t("ver_fresh")
             : verNote === "failed" ? t("ver_failed")
             : t("ver_tap");
  return '<div class="verline">'+
         '<span class="num">'+t("ver", esc(VERSION))+'</span>'+
         '<button class="vn" id="verwhat">'+t("cl_k")+'</button>'+
         '<button class="vn" id="vertap">'+esc(note)+'</button></div>';
}
function wireVersion(){
  on("updgo", applyUpdate);
  on("vertap", () => checkUpdate(true));
  on("verwhat", () => openSheet("whatsnew"));
}
let handUp = null, awardUp = null, dealtFor = "";
/* the order reveal runs on a clock of its own: when this phone first saw it,
   the route each avatar takes through the shuffle, and the repaint that ends it */
let orderAt = 0, orderPath = null, orderTimer = null;

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
  h('<div class="stack grow">'+updBox()+
    '<div><p class="kicker">'+t("tag")+'</p><h1>'+wordmark(lang)+'</h1></div>'+
    learnBtn("howto", t("howto"), t("hw_teaser"))+
    '<p class="kicker">'+t("lang_k")+'</p>'+
    '<div class="langsw"><button id="lhe" class="'+(lang==="he"?"on":"")+'">עברית</button>'+
    '<button id="len" class="'+(lang==="en"?"on":"")+'">English</button></div>'+
    '<p class="kicker">'+t("face_k")+'</p>'+
    faceGrid(myFace, [], "data-face")+
    '<p class="kicker">'+t("yourname")+'</p>'+
    '<input id="nm" type="text" maxlength="14" placeholder="'+t("nameph")+'">'+
    errBox()+'<div class="grow"></div>'+
    '<button id="create">'+t("create")+'</button>'+
    '<button class="ghost" id="tojoin">'+t("joinbtn")+'</button>'+
    verBox()+'</div>');
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
    learnBtn("howto", t("howto"), t("hw_teaser"))+
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
/* the map preview: a small four-colour swatch off the active theme, the
   map's name and one-line description, and — for the host — a reroll */
function mapChipHTML(s, withReroll){
  const mapId = s.mapId || "classic";
  const info = (MAPS_COPY[lang] && MAPS_COPY[lang][mapId]) || MAPS_COPY.en[mapId] || { n:mapId, d:"" };
  const swatch = '<span class="mapswatch" aria-hidden="true">'+
    themeColc(mapId).map(c => '<i style="background:'+c+'"></i>').join("")+'</span>';
  return '<div class="mapchip">'+swatch+
    '<span class="mt"><span class="mn">'+esc(info.n)+(s.roads ? ' · '+t("shape_roads") : '')+'</span><span class="md">'+esc(info.d)+'</span></span>'+
    (withReroll ? '<button class="reroll" id="reroll">'+t("reroll")+'</button>' : '')+
    '</div>';
}
/* In groups a phone carries a whole group, so it has a roster to keep: the
   group's name, and who is holding it. Every phone edits its own slice and
   nobody else's — the server is what stops the two drifting apart. */
function groupBox(s){
  const mine = (s.people || []).filter(p => (s.mine || []).indexOf(p.id) >= 0);
  const rows = mine.map((p, i) =>
    '<div class="prow"><span class="av pic">'+faceSvg(p.face || "boy", 34)+'</span>'+
    '<span class="pname">'+esc(p.name)+'</span>'+
    (i === 0
      ? '<span class="tag you">'+t("you")+'</span>'
      : '<button class="quiet" data-drop="'+esc(p.id)+'" '+
        'style="width:auto;padding:6px 12px;font-size:19px;line-height:1">&times;</button>')+
    '</div>').join("");
  return '<p class="kicker">'+t("group_k")+'</p>'+
    '<input id="gname" placeholder="'+esc(t("group_ph"))+'" value="'+esc(s.groupName || "")+'">'+
    '<div class="plist">'+rows+'</div>'+
    (mine.length < (s.maxGroup || 5)
      ? '<div class="btnrow"><input id="pname" placeholder="'+esc(t("person_ph"))+'">'+
        '<button id="padd" style="flex:0 0 auto;width:auto;padding:15px 20px">+</button></div>'
      : '')+
    '<p class="note">'+t("groups_note", s.maxGroup || 5)+'</p>';
}
function wireGroupBox(s){
  const mine = () => (s.people || []).filter(p => (s.mine || []).indexOf(p.id) >= 0);
  const gval = () => { const g = document.getElementById("gname"); return g ? g.value : (s.groupName || ""); };
  const send = list => act({ type:"people", list, groupName: gval() });
  on("padd", () => {
    const el = document.getElementById("pname");
    const nm = ((el && el.value) || "").trim();
    if(!nm) return;
    send(mine().map(p => ({ name:p.name, face:p.face })).concat([{ name:nm }]));
  });
  each("[data-drop]", b => b.onclick = () =>
    send(mine().filter(p => p.id !== b.dataset.drop).map(p => ({ name:p.name, face:p.face }))));
  const g = document.getElementById("gname");
  if(g) g.onchange = () => send(mine().map(p => ({ name:p.name, face:p.face })));
}

function vLobby(){
  const s = state, list = s.players;
  /* Seating is the room's, not this phone's: the roster editor has to appear
     on every phone the moment the host picks groups, so it goes to the server
     when it is tapped rather than waiting for the start button. */
  const seat = s.seating || "solo";
  const rows = list.map(p =>
    '<div class="prow">'+av(p.name, colorOf(p.id), "", p.face)+
    '<span class="pname">'+esc(p.name)+
      (p.host ? '<span class="tag host">'+t("host")+'</span>' : '')+
      (p.id === s.you ? '<span class="tag you">'+t("you")+'</span>' : '')+'</span>'+
    '<span class="dot'+(p.online?'':' off')+'"></span></div>').join("")+
    /* the seats still to be filled, so the wait has a shape */
    Array.from({ length: Math.max(0, 3 - list.length) }, () =>
      '<div class="prow empty"><span class="seat"></span>'+
      '<span class="pname">'+t("free_seat")+'</span><span class="dot off"></span></div>').join("");
  /* The lobby is the one screen that is a list rather than a figure, and it
     is really two lists: the room — who is here and how to reach it — and
     the settings the host turns before starting. They already had a seam
     between them: the spacer that pushes the start button to the foot of a
     phone. Naming the two halves costs the phone nothing — a flex column
     inside a flex column, same gap, same order — and gives a tablet lying
     on its side two panes to set side by side instead of one long scroll. */
  h('<div class="stack grow split">'+offBox()+updBox()+
    '<div class="pane">'+
    '<div><div class="hero roomhead" style="display:flex;align-items:center;justify-content:space-between;gap:14px">'+
      '<div><p class="kicker">'+t("room_k")+'</p><div class="roomcode">'+esc(s.code)+'</div></div>'+
      '<span class="av" style="background:rgba(255,255,255,.16);width:44px;height:44px;flex:0 0 44px;font-size:15px">'+
      list.length+'</span></div><div class="perf"></div></div>'+
    '<p class="note">'+t("share")+'</p><div class="link">'+esc(s.lanUrl||location.origin)+'</div>'+
    '<p class="note">'+t("bigscreen")+'</p><div class="link">'+
      esc((s.lanUrl||location.origin)+'/board?room='+s.code)+'</div>'+
    '<p class="kicker">'+t("players_k")+'</p><div class="plist">'+rows+'</div>'+
    (s.seating === "groups" ? groupBox(s) : '')+
    (pickingFace
      ? '<p class="kicker">'+t("face_k")+'</p>'+faceGrid(myFace, s.taken || [], "data-reface")+
        '<button class="quiet" id="facedone">'+t("face_done")+'</button>'
      : '<button class="ghost" id="facebtn">'+t("face_change")+'</button>')+
    errBox()+'</div><div class="grow"></div><div class="pane">'+
    learnBtn("howto", t("howto"), t("hw_teaser"))+
    learnBtn("modeinfo", t("gm_title"), t("gm_teaser"))+
    '<p class="kicker">'+t("map_k")+'</p>'+mapChipHTML(s, s.isHost)+
    (s.isHost
      ? (list.length < 3 ? '<p class="note">'+t("waiting")+'</p>' : '')+
        '<p class="kicker">'+t("shape_k")+'</p>'+
        '<div class="modesw" style="grid-template-columns:repeat(2,1fr)">'+
        '<button data-roads="0" class="'+(s.roads?"":"on")+'">'+t("shape_lanes")+'</button>'+
        '<button data-roads="1" class="'+(s.roads?"on":"")+'">'+t("shape_roads")+'</button></div>'+
        '<p class="note">'+t(s.roads ? "shape_roads_d" : "shape_lanes_d")+'</p>'+
        '<p class="kicker">'+t("gm_k")+'</p>'+
        '<div class="modesw">'+MODE_IDS.map(id => {
          const info = (MODES_COPY[lang] && MODES_COPY[lang][id]) || MODES_COPY.en[id];
          return '<button data-gm="'+id+'" class="'+(gameMode===id?"on":"")+'">'+esc(info.n)+'</button>';
        }).join("")+'</div>'+
        '<p class="kicker">'+t("mode_k")+'</p>'+
        '<div class="modesw" style="grid-template-columns:repeat(3,1fr)">'+
        '<button data-seat="solo" class="'+(seat==="solo"?"on":"")+'">'+t("mode_solo")+'</button>'+
        '<button data-seat="pairs" class="'+(seat==="pairs"?"on":"")+'"'+(list.length<4?" disabled":"")+'>'+t("mode_teams")+'</button>'+
        '<button data-seat="groups" class="'+(seat==="groups"?"on":"")+'">'+t("seat_groups")+'</button></div>'+
        (list.length < 4 ? '<p class="note">'+t("need4")+'</p>' : '')+
        '<div class="langsw"><button id="lhe" class="'+(s.lang==="he"?"on":"")+'">עברית</button>'+
        '<button id="len" class="'+(s.lang==="en"?"on":"")+'">English</button></div>'+
        '<button id="start"'+(list.length<3?" disabled":"")+'>'+t("startgame")+'</button>'
      : '<p class="note">'+t("hostwait")+'</p>')+
    '<button class="quiet" id="leave">'+t("leave")+'</button></div></div>');
  if(s.isHost){
    on("lhe", () => act({ type:"lang", lang:"he" }));
    on("len", () => act({ type:"lang", lang:"en" }));
    each("[data-seat]", b => b.onclick = () => act({ type:"seating", seating:b.dataset.seat }));
    each("[data-roads]", b => b.onclick = () => act({ type:"roads", roads:b.dataset.roads === "1" }));
    each("[data-gm]", b => b.onclick = () => { gameMode = b.dataset.gm; render(); });
    on("reroll", () => act({ type:"reroll_map" }));
    on("start", () => act({ type:"start", seating:seat, gameMode }));
  }
  if(s.seating === "groups") wireGroupBox(s);
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
  return '<div class="mod art">'+modSvg(s.mod.key, 40)+
         '<span class="mt"><span class="sl">'+t("table_k", s.round)+'</span>'+
         '<span class="sw">'+s.mod.name+'</span><span class="sr">'+s.mod.desc+'</span></span></div>';
}
function notes(s){
  let out = "";
  if(s.topic) out += '<div class="sentence art">'+topicSvg(s.topicKey, 36)+
    '<span class="mt"><span class="sl">'+t("topic_is")+'</span>'+
    '<span class="sw">'+s.topic+'</span></span></div>';
  if(s.partner) out += '<div class="sentence"><span class="sl">'+
    (s.mod.key === "U" ? t("duel_is") : t("partner_k"))+'</span>'+
    '<span class="sw">'+esc(s.partner.name)+'</span></div>';
  if(s.insight) out += '<div class="sentence art">'+cardEmblem("insight", 36)+
    '<span class="mt"><span class="sl">'+t("insight_k")+'</span>'+
    '<span class="sw" style="font-size:17px">'+s.insight.map(esc).join(" · ")+'</span></span></div>';
  if(s.link && (s.link.shown || []).length){
    out += '<div class="sentence"><span class="sl">'+t("link_shown")+'</span>'+
      '<span class="sw">'+s.link.shown.map(esc).join(
        '<span style="opacity:.35"> · </span>')+'</span></div>';
  }
  if(s.two){
    (s.two.found || []).forEach(f => {
      out += '<div class="sentence"><span class="sl">'+t("got_tag")+'</span>'+
        '<span class="sw">'+esc(f.text)+'</span>'+
        '<span class="sr">'+esc(f.name)+'</span></div>';
    });
    if((s.two.found || []).length < s.two.need)
      out += '<div class="mod"><span class="mt"><span class="sl">'+t("two_left")+'</span></span></div>';
  }
  if(s.veto)     out += '<div class="mod art">'+cardEmblem("veto", 36)+
    '<span class="mt"><span class="sl">'+t("veto_k")+'</span><span class="sr">'+t("veto_d")+'</span></span></div>';
  if(s.mimeCard) out += '<div class="mod art">'+cardEmblem("mime", 36)+
    '<span class="mt"><span class="sl">'+t("mime_k")+'</span><span class="sr">'+t("mime_d")+'</span></span></div>';
  return out;
}
/* The word bank runs to hundreds of words, so a word card is not illustrated
   word by word. What it gets instead is a proper index: the value set in the
   display face over a struck token, the way a playing card carries its rank.
   The topic is drawn once, above these, and not repeated four times.       */
function valuePip(fill){
  return '<i>'+'<svg viewBox="0 0 40 40" width="14" height="14" aria-hidden="true">'+
    '<circle cx="20" cy="20" r="18" fill="currentColor"/>'+
    '<rect x="9" y="15.6" width="22" height="8" rx="4" fill="'+fill+'" '+
    'transform="rotate(-30 20 20)"/></svg>'+'</i>';
}
function wordCards(s, sel, disabled){
  /* Two words rounds carry a second choice, and both wear the same mark —
     which of them leads is the engine's business, not a matter of tap order. */
  const also = s.secret ? s.secret.pick2 : null;
  return '<div class="cardgrid stagger">'+s.secret.words.map((w,i) => {
    const on = sel === i || (also !== null && also !== undefined && also === i);
    const tint = VAL_TINT[Math.min(5, Math.max(1, w.value))] || VAL_TINT[5];
    return '<button class="wordcard'+(on?" on":"")+'" data-w="'+i+'"'+(disabled?" disabled":"")+'>'+
      '<span class="wt">'+esc(w.text)+'</span>'+
      '<span class="wv" style="background:'+tint[0]+';color:'+tint[1]+'">'+
        '<b>'+w.value+'</b>'+valuePip(on ? "#221700" : tint[0])+'</span></button>';
  }).join("")+'</div>';
}
/* Six words that all belong to the thing, and the thing itself above them.
   Three go up; the other three stay where nobody sees them. */
function linkPicker(s){
  const sec = s.secret || {}, pool = sec.pool || [], up = sec.shown || [];
  return '<div class="sentence"><span class="sl">'+t("link_is")+'</span>'+
    '<span class="sw">'+esc(((sec.words || [])[0] || {}).text || "")+'</span></div>'+
    '<div class="cardgrid stagger">'+pool.map((w, i) =>
      '<button class="wordcard'+(up.indexOf(i) >= 0 ? " on" : "")+'" data-w="'+i+'">'+
      '<span class="wt">'+esc(w)+'</span>'+
      (up.indexOf(i) >= 0
        ? '<span class="wv" style="background:var(--good-soft);color:var(--good-ink)">'+
          (up.indexOf(i) + 1)+'</span>' : '')+
      '</button>').join("")+'</div>';
}
function waitCard(title, sub, who){
  /* nothing else is on this screen, so the face is the screen */
  return '<div class="panel center grow" style="justify-content:center">'+
    (who ? pav(who, "big") : '<span class="spin">'+coinMark(kpx(52))+'</span>')+
    '<h2>'+title+'</h2><p class="note">'+sub+'</p></div>';
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
    h('<div class="stack grow split">'+topbar(s)+'<div class="pane">'+
      '<h2>'+t("chal_k")+'</h2>'+modBlock(s)+
      '<p class="kicker">'+t("payoff_k")+'</p>'+
      '<div class="payoff">'+
        '<div class="best"><b>'+t(s.mod.key==="M"?"po_m_best":"po_best")+'</b><span>'+t("po_best_d")+'</span></div>'+
        '<div class="meh"><b>'+t(s.mod.key==="M"?"po_m_meh":"po_meh")+'</b><span>'+t(s.mod.key==="M"?"po_m_meh_d":"po_meh_d")+'</span></div>'+
        '<div class="none"><b>'+t("po_none")+'</b><span>'+t("po_none_d")+'</span></div></div>'+
      '</div><div class="pane">'+
      '<p class="kicker">'+t("chal_pick_k")+'</p>'+
      '<div class="cardgrid stagger">'+["topic","open","cold"].map(k => {
        const col = k==="cold" ? "var(--good-ink)" : (k==="topic" ? "var(--muted)" : "var(--accent-ink)");
        return '<button class="gcard card" data-ch="'+k+'">'+choiceSvg(k, 46)+
          '<span class="ctext"><span class="cw" style="color:'+col+'">'+t("cw_"+k)+'</span>'+
          '<span class="cn">'+t("ch_"+k)+'</span><span class="cd">'+t("ch_"+k+"_d")+'</span></span></button>';
      }).join("")+'</div>'+errBox()+'</div></div>');
    each("[data-ch]", b => b.onclick = () => act({ type:"challenge", k:b.dataset.ch }));
    return;
  }
  /* step 2 — which topic */
  if(s.challenge === "topic" && !s.topic){
    h('<div class="stack grow">'+topbar(s)+'<h2>'+t("topic_k")+'</h2>'+
      '<div class="topicgrid stagger">'+(pack.topics||[]).map(x =>
        '<button class="topic" data-tp="'+x.k+'">'+topicSvg(x.k, 40)+
        '<span class="tn">'+x.n+'</span></button>').join("")+'</div>'+errBox()+'</div>');
    each("[data-tp]", b => b.onclick = () => act({ type:"topic", k:b.dataset.tp }));
    return;
  }
  /* step 3 — the word, and who it is aimed at */
  const sec = s.secret || { words:[], pick:null };
  const cold = s.challenge === "cold";
  /* a Duel's target is public, but it is still the giver's to name */
  const duel = s.mod.key === "U";
  const aimed = sec.shot;
  const two = s.mod.key === "W";
  const link = s.mod.key === "L";
  const canGo = (link ? (sec.shown || []).length === 3 : sec.pick !== null)
                && (!two || (sec.pick2 !== null && sec.pick2 !== undefined))
                && (aimed || s.partner);
  /* Two decisions, and on a phone you scroll from one to the other: which
     word, and who to aim it at. Lying down there is room to hold both at
     once, so they are named as halves — but only when there really are two.
     Around one phone a group has nobody to aim at, and half a screen of
     nothing is worse than the column it replaced. */
  const twoSided = !s.partner;
  h('<div class="stack grow'+(twoSided ? " split" : "")+'">'+topbar(s)+
    (twoSided ? '<div class="pane">' : '')+
    '<h2>'+(link ? t("link_k") : cold ? t("cold_k") : two ? t("two_k") : t("pick_word"))+'</h2>'+
    '<p class="note">'+(link ? t("link_d") : cold ? t("cold_d") : two ? t("two_d") : t("pick_word_d"))+'</p>'+
    modBlock(s)+notes(s)+
    (link ? linkPicker(s) : wordCards(s, sec.pick, cold))+
    (twoSided ? '</div><div class="pane">' : '')+
    (s.shotFixed ? '' :
      '<p class="kicker">'+(duel ? t("duel_k") : t("shot_k"))+'</p>'+
      '<p class="note">'+(duel ? t("duel_d") : t("shot_d"))+'</p>'+
      '<div class="suslist stagger">'+s.players.filter(p => p.id !== s.you).map(p =>
        '<button class="sus'+(aimed===p.id?" on":"")+'" data-aim="'+p.id+'">'+
        av(p.name, colorOf(p.id), "", p.face)+'<span class="nm">'+esc(p.name)+'</span><span class="dotpick"></span></button>').join("")+'</div>')+
    errBox()+'<div class="grow"></div>'+
    '<p class="note">'+t("pass_note")+'</p>'+
    '<button id="ready"'+(canGo?"":" disabled")+'>'+t("ready")+'</button>'+
    (twoSided ? '</div>' : '')+'</div>');
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
  /* One screen, two jobs. The giver is being told to say the thing; everybody
     else is holding a buzzer and is being told to listen for it — so each is
     told their own. Blind is the exception and needs no branch: there the
     table talks and the giver guesses, and its copy already describes the
     round rather than instructing whoever happens to be reading it. */
  /* A Link round has no sentence to say or to listen for — the three words
     are already on the table and everybody works on them at once. */
  const linkRound = s.mod.key === "L";
  const head = linkRound ? t("link_table_h")
             : blind ? t("blind_table_h")
             : s.isGiver
               ? (mimed ? t("say_it_mime")  : s.mod.key === "O" ? t("say_it_one")  : t("say_it"))
               : (mimed ? t("hear_it_mime") : s.mod.key === "O" ? t("hear_it_one") : t("hear_it"));
  const sub  = linkRound ? t("link_table_d")
             : blind ? t("blind_table_d", esc(s.giverName))
             : s.isGiver
               ? (mimed ? t("say_it_mime_d")  : s.mod.key === "O" ? t("say_it_one_d")  : t("say_it_d"))
               : (mimed ? t("hear_it_mime_d") : s.mod.key === "O" ? t("hear_it_one_d") : t("hear_it_d"));

  const mine = s.secret && s.secret.pick !== null && s.secret.words[s.secret.pick];
  const gotAlready = ((s.two && s.two.found) || []).map(f => f.text);
  const held = (s.isGiver && s.secret)
    ? [s.secret.pick, s.secret.pick2]
        .filter(i => i !== null && i !== undefined)
        .map(i => s.secret.words[i]).filter(Boolean)
    : [];
  const yourWord = (s.isGiver && mine)
    ? '<div class="sentence"><span class="sl">'+t("yourword")+'</span>'+
      '<span class="sw">'+held.map(w =>
        gotAlready.indexOf(w.text) >= 0
          ? '<s style="opacity:.45">'+esc(w.text)+'</s>'
          : esc(w.text)).join(' <span style="opacity:.4">·</span> ')+'</span>'+
      (s.secret.shotName ? '<span class="sr">'+t("shot_k")+': '+esc(s.secret.shotName)+'</span>' : '')+'</div>'
    : "";

  const canBuzz = blind ? s.isGiver : (!s.isGiver && !s.iAmOut && !s.watching && left > 0);
  /* The box that stands in for the buzzer has to say why it is not one. It
     used to fall through to the buzzer's own label, so a phone that simply
     ran out of clock got a dead grey panel reading "I have it!" — which is
     the one thing on the screen that looks like your own button, disabled,
     and reads as a turn you are being kept from. Every reason canBuzz is
     false now has a line of its own. */
  const buzzLabel = blind
      ? (s.isGiver ? t("buzznow") : t("blind_nobuzz", esc(s.giverName)))
      : s.isGiver  ? t("giverwait")
      : s.iAmOut   ? t("youout")
      : s.watching ? t("duelwatch", esc((s.duel || {}).name || ""))
      : t("time_up_wait");

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
    /* Ending the round by hand. It is outlined in both of its states and
       never primary, because it is an escape rather than the way through:
       a round with nobody in ends on the server's own clock (armClock, and
       timeUp behind it), so at zero this is only here for the table whose
       push never arrived — a phone coming back from the background with a
       stale clock, or a room the timer somehow missed. Loud, it would read
       as the way rounds are meant to finish, which it is not. */
    ((s.isGiver || s.isHost)
      ? '<button class="ghost" id="none">'+(left <= 0 ? t("time_up_end") : t("end_round"))+'</button>'
      : '')+
    '</div>');
  on("bz", () => act({ type:"buzz" }));
  on("none", () => act({ type:"nobody" }));
  on("hand", () => { showHand = !showHand; handUp = null; render(); });
  setRing(left / (s.total * 1000));
  each("[data-hand]", b => b.onclick = () => {
    const i = Number(b.dataset.hand);
    handUp = (handUp === i) ? null : i;
    render();
  });
  on("playnow", () => {
    const c = (s.hand || [])[handUp];
    if(!c) return;
    throwCard(app.querySelector('[data-hand="' + handUp + '"]'));
    showHand = false; handUp = null;
    act({ type:"playcard", key:c.key });
  });
  startTicker(s);
}
/* The hand you are holding. Shut, it is a few backs peeking out of the button.
   Open, it is a fan — and tapping a card lifts it clear of the others so you
   can read what it does before you commit to throwing it down.             */
function handBlock(s){
  const hand = s.hand || [];
  if(!hand.length) return "";
  const n = hand.length;
  if(!showHand){
    const bw = kpx(26), step = kpx(11);
    return '<button class="ghost handbtn" id="hand">'+
      '<span class="mini" style="width:'+(bw + (n - 1) * step)+'px;height:'+Math.round(bw * 1.4)+'px">'+
      hand.map((c, i) => '<span class="mb" style="inset-inline-start:'+(i * step)+'px;'+
        'transform:rotate('+((i - (n - 1) / 2) * 7).toFixed(1)+'deg)">'+cardBack(bw)+'</span>').join("")+
      '</span><span>'+t("playcard")+' · '+n+'</span></button>';
  }
  const w = kpx(n <= 3 ? 98 : (n <= 5 ? 86 : 74));
  const mid = (n - 1) / 2, lean = Math.min(9, 26 / n);
  const up = (handUp !== null && hand[handUp]) ? hand[handUp] : null;
  const cards = hand.map((c, i) => {
    const d = i - mid, isUp = handUp === i;
    const dx = Math.round(d * w * 0.6);
    const dy = isUp ? -Math.round(w * 0.16) : Math.round(Math.abs(d) * w * 0.07);
    return '<button class="pcbtn'+(isUp ? " up" : "")+'" data-hand="'+i+'" '+
      'style="z-index:'+(isUp ? 20 : 10 - Math.round(Math.abs(d)))+';'+
      'transform:translateX(-50%) translateX('+dx+'px) rotate('+(isUp ? 0 : d * lean).toFixed(1)+'deg) '+
      'translateY('+dy+'px)">'+cardFace(c.key, esc(c.n), w)+'</button>';
  }).join("");
  return '<div class="fanwrap"><p class="kicker">'+t("hand_k")+'</p>'+
    '<div class="fan" style="height:'+(Math.round(w * 1.4) + Math.round(w * 0.3))+'px">'+cards+'</div>'+
    (up ? '<div class="raised"><span class="rn">'+up.n+'</span><span class="rd">'+up.d+'</span></div>'+
          '<button id="playnow">'+t("play_it")+'</button>'
        : '<p class="note" style="text-align:center">'+t("pick_card")+'</p>')+
    '<button class="quiet" id="hand">'+t("closehand")+'</button></div>';
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
  /* They come off the deck face down and turn over one after another — but
     only the first time this award is painted, or every push would re-deal. */
  const stamp = s.round + ":" + a.unitId;
  const run = dealtFor !== stamp;
  if(run){ dealtFor = stamp; awardUp = null; }
  const n = a.offers.length, w = kpx(n <= 2 ? 118 : (n === 3 ? 100 : 84)), ch = Math.round(w * 7 / 5);
  const mid = (n - 1) / 2;
  const up = (awardUp !== null && a.offers[awardUp]) ? a.offers[awardUp] : null;
  /* the three that came off the deck, and — once one is turned up — what it
     does and the button that takes it */
  h('<div class="stack grow split">'+offBox()+'<div class="pane">'+
    '<p class="kicker" style="color:var(--good-ink)">'+t("card_won")+'</p>'+
    '<h2>'+t("takeone", esc(a.unitName))+'</h2>'+
    '<div class="deal'+(run ? " run" : "")+'">'+a.offers.map((c, i) =>
      '<button class="pcbtn'+(awardUp !== null && awardUp !== i ? " dim" : "")+'" data-up="'+i+'" '+
      'style="--i:'+i+';--dx:'+Math.round((i - mid) * -34)+'px;--dr:'+((i - mid) * -8).toFixed(0)+'deg">'+
      '<span class="slide" style="display:block;width:'+w+'px;height:'+ch+'px">'+
        '<span class="flip" style="width:'+w+'px;height:'+ch+'px">'+
          '<span class="side back">'+cardBack(w)+'</span>'+
          '<span class="side front">'+cardFace(c.key, esc(c.n), w)+'</span>'+
        '</span></span></button>').join("")+'</div>'+
    '</div><div class="pane">'+
    (up ? '<div class="raised"><span class="rn">'+up.n+'</span><span class="rd">'+up.d+'</span></div>'+
          '<button id="takenow">'+t("take_it")+'</button>'
        : '<p class="note" style="text-align:center">'+t("pick_card")+'</p>')+
    errBox()+'<div class="grow"></div>'+
    '<p class="note">'+t("cards_secret")+'</p></div></div>');
  each("[data-up]", b => b.onclick = () => {
    const i = Number(b.dataset.up);
    awardUp = (awardUp === i) ? null : i;
    render();
  });
  on("takenow", () => {
    const c = a.offers[awardUp];
    if(c) act({ type:"take", key:c.key });
  });
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
      /* The server ends a round the moment its own clock runs out, so a phone
         still sitting on the table a second later did not hear it. That is
         the loudest evidence of a dead stream this screen ever gets — take
         it, rather than parking on 0:00 waiting for a push that cannot come. */
      setTimeout(() => {
        if(state && state.phase === "table" && remain() <= 0){ seatChecks = 0; checkSeat(); }
      }, 1500);
    }
  }, 200);
}
function stopTicker(){ if(ticker){ clearInterval(ticker); ticker = null; } }

/* ---------------- judging ---------------- */
function vJudge(s){
  const who = s.judging ? s.judging.name : "?";
  /* Blind hands the verdict to everybody except the giver — on that round the
     giver is the one guessing, and the only person who never saw the word. */
  const mine = s.mod.key === "B" ? !s.isGiver : s.isGiver;
  if(!mine){
    h('<div class="stack grow">'+offBox()+topbar(s)+stuckBar(s)+errBox()+
      waitCard(t("someone", esc(who)),
               s.mod.key === "B" ? t("waitjudge_b") : t("waitjudge"),
               s.judging && s.judging.id)+'</div>');
    wireSkip();
    return;
  }
  /* Two words asks which, not whether. The giver is the only phone holding
     both of them, so the buttons can carry the words themselves. */
  const two = s.mod.key === "W" && s.secret;
  const gone = ((s.two && s.two.found) || []).map(f => f.text);
  const stillOut = !two ? [] : [s.secret.pick, s.secret.pick2]
    .filter(i => i !== null && i !== undefined)
    .map(i => ({ i, w:s.secret.words[i] }))
    .filter(x => x.w && gone.indexOf(x.w.text) < 0);

  /* who buzzed and what you have to decide about them, and the deciding */
  h('<div class="stack grow split">'+topbar(s)+
    '<div class="pane">'+
    '<div class="panel center grow" style="justify-content:center">'+
    (s.judging ? pav(s.judging.id) : "")+
    '<h2>'+(two ? t("judge_which", esc(who)) : t("judge_q", esc(who)))+'</h2></div>'+
    '</div><div class="pane">'+errBox()+
    (two
      ? stillOut.map(x => '<button class="good" data-said="'+x.i+'">'+esc(x.w.text)+'</button>').join("")+
        '<button class="quiet" id="no">'+t("judge_neither")+'</button>'
      : '<button class="good" id="yes">'+t("judge_yes")+'</button>'+
        '<button class="quiet" id="no">'+t("judge_no")+'</button>')+
    '</div></div>');
  if(two){
    each("[data-said]", b => b.onclick = () => act({ type:"judge", word:Number(b.dataset.said) }));
    on("no", () => act({ type:"judge", word:-1 }));
    return;
  }
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
  /* The token drops. The game is named for the moment somebody gets it, so
     when the word was got the token falls into the receipt, lands with a
     bounce, and only then does the confetti go. It falls once — the first
     draw of this round's reveal — and on every redraw after that it is
     simply lying where it landed. */
  const stamp = s.round + ":" + r.word, first = solved && burstFor !== stamp;
  const still = (typeof REDUCED !== "undefined") && REDUCED;

  h('<div class="stack grow">'+offBox()+
    '<p class="kicker">'+t("solved_k", s.round)+'</p>'+
    '<div><div class="hero '+(solved?"good":"none")+'">'+watermark(s.topicKey, 132)+
    (solved ? '<span class="tokdrop'+(first && !still ? " drop" : "")+'" aria-hidden="true"><i></i>'+coinMark(74)+'</span>' : '')+
    '<p class="kicker">'+t("the_word")+'</p>'+
    '<div class="bigword">'+(r.pair
      ? r.pair.map(w => esc(w.text)).join('<span style="opacity:.35"> · </span>')
      : esc(r.word))+'</div>'+
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
      '<div class="'+(bandIdx===i?"hit "+quality[i]:"")+'">'+bandGlyph(i)+
      '<span>'+t(keys[i])+'</span></div>').join("")+'</div>'+
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
  if(first){
    burstFor = stamp;
    /* the confetti waits for the token to land; the landing has its own sound */
    const landAt = still ? 220 : 470;
    if(!still) setTimeout(() => { try{ if(window.SFX) SFX.play("land"); }catch(e){} }, landAt);
    setTimeout(() => burst({ y: innerHeight * 0.28 }), landAt + 60);
  }
}

/* early, halfway, late — one clock, its hand in three places */
function bandGlyph(i){
  const ang = [-58, 26, 138][i];
  return '<svg class="bg" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">'+
    '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/>'+
    '<rect x="10.9" y="5.8" width="2.2" height="7" rx="1.1" fill="currentColor" '+
      'transform="rotate('+ang+' 12 12)"/></svg>';
}

/* ---------------- the board ---------------- */
/* The map itself is drawn in boardart.js, because the screen in the room
   draws the same one. What stays here is what only a phone knows: which
   squares are yours to tap, and what the squares are called in this language. */
function boardSVG(s, spots, picked, crop){
  return asimonBoard.draw({
    board: s.board, units: s.units, spots, picked, pick: true, window: crop,
    label: n => n.t === "CARD" ? t("card_node") : n.t === "WILD" ? "" : ((pack.mods[n.t]||{}).s || ""),
    endText: lang === "he" ? "סוף" : "END",
    moved: u => !!(lastPos[u.id] && (lastPos[u.id] !== u.pos.r+","+u.pos.c))
  });
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
  /* the board is baffling the first time you meet it — open the legend unasked,
     once per phone, on the first move this player is actually asked to make */
  if(mv.mine && !sawBoard()){ markBoard(); sheet = "legend"; sheetSeen = false; }
  const picked = mv.mine ? (movePickLocal || mv.picked) : mv.picked;
  const sel = picked && mv.spots.find(p => p.r === picked.r && p.c === picked.c);
  /* Cropped to the squares that are yours, plus the one you are standing on so
     the step is a step from somewhere. Only on your own turn: watching somebody
     else move, the whole board is the thing worth seeing. */
  const here = (s.units.find(u => u.id === mv.unitId) || {}).pos;
  const crop = mv.mine && boardZoom && mv.spots.length
    ? asimonBoard.windowFor(s.rows, mv.spots.concat(here ? [here] : []))
    : null;
  const zoomer = mv.mine && mv.spots.length
    ? '<button class="zoomer" id="zoom">'+(crop ? t("zoom_out") : t("zoom_in"))+'</button>' : '';
  const queue = mv.of < 2 ? "" :
    '<p class="kicker">'+t("move_queue_k", mv.of)+'</p><div class="qbar">'+
    (s.queue||[]).map(q => '<span class="qchip'+(q.done?" done":(q.now?" now":""))+'">'+
      uav(s.units.find(u=>u.id===q.id)||{name:q.name}, "sm")+esc(q.name)+
      ' <i>'+(q.done?"✓":q.steps)+'</i></span>').join("")+'</div>';
  const readout = sel
    ? '<div class="sentence"><span class="sl">'+t("move_sel_k")+'</span>'+
      '<span class="sw">'+(sel.type.key === "END" ? t("the_end")
        : sel.type.key === "CARD" ? t("card_node_d")
        : sel.type.key === "WILD" ? t("lg_wild") : sel.type.name)+'</span>'+
      '<span class="sr">'+t("move_cost", sel.type.key==="END" ? t("the_end") : t("row_n", sel.r), sel.d+"/"+mv.steps)+
      (sel.type.desc ? ' · '+sel.type.desc : '')+'</span></div>'
    : '<p class="note">'+t("move_tap", mv.spots.length)+'</p>';

  h('<div class="stack grow">'+offBox()+
    '<div class="topbar"><p class="kicker">'+t("move_k", mv.seat+"/"+mv.of)+'</p></div>'+
    (mv.mine
      ? '<h2 style="color:'+unitColor(s.units.find(u=>u.id===mv.unitId)||{})+'">'+
        moveHead(s.units.find(u=>u.id===mv.unitId), mv.unitName, mv.steps)+'</h2><p class="note">'+(mv.steps === 1 ? t("move_d1") : t("move_d", mv.steps))+'</p>' 
      : '<div class="waitrow">'+uav(s.units.find(u=>u.id===mv.unitId)||{name:mv.unitName})+
        '<span><span class="wt">'+tUnit("waitmove", s.units.find(u=>u.id===mv.unitId), mv.unitName)+'</span>'+
        '<span class="ws">'+t("yourturn", esc(mv.unitName))+'</span></span></div>')+
    queue+stuckBar(s)+
    '<div class="boardwrap'+(zoomer?" zoomable":"")+'">'+zoomer+
      boardSVG(s, mv.mine ? mv.spots : [], picked, crop)+'</div>'+
    learnBtn("boardhelp", t("lg_open"), t("lg_teaser"))+
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
    on("zoom", () => { boardZoom = !boardZoom; render(); });
  }
}
function podium(s){
  const top = (s.standings || []).slice(0, 3);
  if(!top.length) return "";
  /* second, first, third — the winner in the middle, standing highest */
  const order = top.length >= 3 ? [1, 0, 2] : (top.length === 2 ? [1, 0] : [0]);
  const size = [96, 60, 52].map(kpx), step = [86, 56, 40].map(kpx);
  return '<div class="podium">'+order.map(k => {
    const u = top[k];
    const unit = s.units.find(x => x.id === u.id) || {};
    return '<div class="pcol'+(k === 0 ? " win" : "")+'">'+
      '<span class="hold">'+
        '<span class="pav" style="width:'+size[k]+'px;height:'+size[k]+'px;background:'+
          unitColor(unit)+';font-size:'+kpx(k === 0 ? 26 : 15)+'px">'+
          (unit.face ? faceSvg(unit.face, size[k]) : esc(initials(u.name)))+'</span>'+
        (k === 0 ? '<span class="crown">'+coinMark(kpx(40))+'</span>' : '')+
      '</span>'+
      '<span class="pstep" style="width:'+(size[k] + 8)+'px;height:'+step[k]+'px;'+
        'font-size:'+kpx(k === 0 ? 34 : 22)+'px">'+(k + 1)+'</span></div>';
  }).join("")+'</div>';
}
function vOver(s){
  document.documentElement.dataset.tone = "scored";
  /* the top three on the steps, and everybody's numbers beside them */
  h('<div class="stack grow split">'+offBox()+updBox()+'<div class="pane">'+
    '<p class="kicker">'+t("after_rounds", s.round)+'</p>'+
    '<h1>'+tUnit("wins", s.units.find(u=>u.id===(s.standings[0]||{}).id), (s.standings[0]||{}).name)+'</h1>'+
    podium(s)+
    '</div><div class="pane">'+
    '<div class="scores">'+s.standings.map((u,i) =>
      '<div class="resrow">'+uav(s.units.find(x=>x.id===u.id)||{name:u.name})+
      '<span class="who"><span class="nm">'+(i+1)+'. '+esc(u.name)+'</span></span>'+
      '<span class="pt">'+u.score+'</span></div>').join("")+'</div>'+
    errBox()+'<div class="grow"></div>'+
    (s.isHost ? '<button id="again">'+t("playagain")+'</button>' : '')+
    '<button class="quiet" id="leave">'+t("leave")+'</button></div></div>');
  on("again", () => act({ type:"again" }));
  on("leave", async () => { await act({ type:"leave" }); forget(); render(); });
  if(burstFor !== "over"){ burstFor = "over"; setTimeout(() => burst({ y: innerHeight * 0.3 }), 260); }
}

/* ---------------- the play order, drawn in front of everyone ---------------- */
const SHUFFLE_MS = 2100;
/* the fewer the players, the bigger their faces get to be */
function orderSize(n){ return kpx(n <= 4 ? 84 : (n <= 6 ? 64 : 48)); }
function orderPaths(n, pitch){
  /* one stable set of offsets per phone: the tokens have to take the same
     route through the shuffle on every repaint, or a phone tapping in
     mid-animation would send everybody else's avatars somewhere new */
  if(orderPath && orderPath.length === n) return orderPath;
  /* every offset lands the token squarely on another seat's slot, so the row
     never grows wider than it started */
  orderPath = Array.from({length:n}, (_, i) => {
    const at = k => ((i + k * 2 + 1) % n - i) * pitch;
    return [at(1), at(2), at(3), at(4)];
  });
  return orderPath;
}
function vOrder(s){
  document.documentElement.dataset.tone = "live";
  const o = s.order;
  if(!o){ h('<div class="stack grow">'+offBox()+waitCard("…","")+'</div>'); return; }
  if(!orderAt) orderAt = Date.now();
  const elapsed = Date.now() - orderAt;
  const rolling = elapsed < SHUFFLE_MS;
  const n = o.seats.length, sz = orderSize(n);
  const paths = orderPaths(n, sz + 10);

  const seats = o.seats.map((p, i) => {
    const seat = i === 0 ? t("ord_first") : (i === o.seats.length - 1 ? t("ord_last") : (i + 1) + "");
    const path = paths[i];
    const style = rolling
      ? 'animation-delay:'+(-elapsed)+'ms;--a:'+path[0]+'px;--b:'+path[1]+'px;--c:'+path[2]+'px;--d:'+path[3]+'px'
      : '';
    return '<div class="ordtok'+(rolling ? " rolling" : "")+(p.in ? " in" : "")+'" style="'+style+'">'+
      '<span class="ordav">'+pav(p.id)+(!rolling && p.in ? '<i class="ordtick">✓</i>' : '')+'</span>'+
      (rolling ? '' :
        '<span class="ordseat">'+esc(seat)+'</span><span class="ordname">'+esc(p.name)+'</span>')+
    '</div>';
  }).join("");

  const gift = (!rolling && s.opening)
    ? '<div class="giftrow">'+cardTile(s.opening.key, kpx(44))+
      '<span><b>'+t("ord_gift")+'</b><span>'+t("ord_gift_d")+'</span>'+
      '<span class="giftname">'+esc(s.opening.n)+' — '+s.opening.d+'</span></span></div>'
    : '';

  h('<div class="stack grow">'+offBox()+
    '<div class="topbar"><p class="kicker">'+t("ord_k")+'</p>'+modeMapBadge(s)+'</div>'+
    '<h2>'+(rolling ? t("ord_rolling") : t("ord_title"))+'</h2>'+
    (rolling ? '' : '<p class="note">'+t("ord_d")+'</p>')+
    '<div class="ordrow" style="--sz:'+sz+'px">'+seats+'</div>'+
    gift+(rolling ? '' : stuckBar(s))+errBox()+'<div class="grow"></div>'+
    (rolling ? '' :
      (o.mineIn
        ? '<p class="note" style="text-align:center">'+t("ord_wait", o.left)+'</p>'
        : '<button id="ordok">'+t("ord_ok")+'</button>'))+
    '</div>');

  if(rolling){
    clearTimeout(orderTimer);
    orderTimer = setTimeout(render, SHUFFLE_MS - elapsed + 30);
  } else {
    wireSkip();
    on("ordok", () => act({ type:"order_ok" }));
  }
}

/* ---------------- the wildcard square ---------------- */
function wildLines(w){
  if(w.kind === "card")  return [t("wild_card"), t("wild_card_d", esc(w.cardName || ""))];
  if(w.kind === "leap")  return [t("wild_leap"), t("wild_leap_d")];
  if(w.kind === "slip")  return [t("wild_slip"), t("wild_slip_d")];
  if(w.kind === "steal") return [t("wild_steal"), w.from ? t("wild_steal_d", esc(w.from)) : t("wild_steal_none")];
  if(w.kind === "swap")  return [t("wild_swap"), w.with ? t("wild_swap_d", esc(w.with)) : t("wild_swap_none")];
  return [t("wild_jackpot"), t("wild_jackpot_d")];
}
function vWild(s){
  document.documentElement.dataset.tone = "live";
  const w = s.wild;
  if(!w){ h('<div class="stack grow">'+offBox()+waitCard("…","")+'</div>'); return; }
  const u = s.units.find(x => x.id === w.unitId) || { name:w.unitName };
  const [title, line] = wildLines(w);
  h('<div class="stack grow">'+offBox()+
    '<div class="topbar"><p class="kicker">'+t("wild_k")+'</p></div>'+
    '<div class="wildcard wild-'+esc(w.kind)+'">'+
      '<span class="wildface">'+uav(u, "big")+'<i class="wildmark">?</i></span>'+
      '<span class="wildwho">'+esc(t("wild_hit", w.unitName))+'</span>'+
      '<b class="wildtitle">'+title+'</b>'+
      '<span class="wildline">'+line+'</span>'+
      (w.kind === "card" && w.mine && w.cardName
        ? '<span class="wildgot">'+cardTile(w.card, 40)+'<span>'+esc(w.cardName)+'</span></span>' : '')+
    '</div>'+
    stuckBar(s)+errBox()+'<div class="grow"></div>'+
    (w.mine ? '<button id="wildgo">'+t("wild_go")+'</button>'
            : '<p class="note" style="text-align:center">'+t("yourturn", esc(w.unitName))+'</p>')+
    '</div>');
  wireSkip();
  on("wildgo", () => act({ type:"wildok" }));
}

function modeMapBadge(s){
  const gm = (MODES_COPY[lang] && MODES_COPY[lang][s.gameMode]) || MODES_COPY.en[s.gameMode];
  const mp = (MAPS_COPY[lang] && MAPS_COPY[lang][s.mapId]) || MAPS_COPY.en[s.mapId];
  if(!gm || !mp) return "";
  return '<span class="mmbadge">'+esc(t("mm_fmt", gm.n, mp.n))+'</span>';
}
function topbar(s){
  return '<div class="topbar"><p class="kicker">'+t("table_k", s.round)+'</p>'+
         modeMapBadge(s)+
         '<span class="qchip">'+pav(s.giver, "sm")+esc(s.giverName)+'</span></div>';
}

/* ---------------- the break, and getting up ----------------
   Any phone can stop the room. The clock holds, every screen goes grey, and
   the game starts itself again after half a minute — so a break nobody comes
   back from cannot strand the table. Coming back early belongs to whoever
   called it, and to the host; everyone else is offered the generous half of
   it instead, which is another thirty seconds.                             */
const pauseLeft = () => Math.max(0, pauseMs - (Date.now() - pauseAt));

/* the break button, appended after the screen has drawn rather than written
   into each of them: it belongs to the room, not to any one step. Where the
   screen already ends in a quiet button, the two go side by side.

   It carries its own budget: a pip for each of the two breaks the phone
   started the game with, filled while it still has them. Both spent, the
   button stays on the screen and goes dead — a control that vanishes leaves
   people hunting for it, and the dead one says plainly why it will not go. */
function breakBar(s){
  if(!s || s.phase === "lobby" || s.phase === "over" || s.paused) return;
  const stack = app.querySelector(".stack");
  if(!stack) return;
  const brk = s.breaks, spent = !!brk && brk.left <= 0;
  const b = document.createElement("button");
  b.className = "brk"; b.id = "brk";
  b.innerHTML = '<span>'+t(spent ? "pause_spent" : "pause")+'</span>'+pausePips(brk);
  b.disabled = spent;
  /* side by side with whatever secondary control the screen already ends in —
     never with a primary, which has the row to itself */
  const last = stack.lastElementChild;
  if(last && last.tagName === "BUTTON" &&
     (last.classList.contains("quiet") || last.classList.contains("ghost"))){
    const rowEl = document.createElement("div");
    rowEl.className = "btnrow";
    stack.insertBefore(rowEl, last);
    rowEl.appendChild(b); rowEl.appendChild(last);
  } else {
    stack.appendChild(b);
  }
  if(!spent) b.onclick = () => { pauseAsk = true; render(); };
}
/* one dot per break the phone was given, dimmed as they are spent. An older
   server that does not count them sends nothing, and the row draws nothing. */
function pausePips(brk){
  if(!brk || !brk.of) return "";
  let out = "";
  for(let i = 0; i < brk.of; i++) out += '<i'+(i < brk.left ? '' : ' class="off"')+'></i>';
  return '<span class="brkpips" aria-hidden="true">'+out+'</span>';
}

/* Stopping the room stops it for everyone, so it is asked before it is done —
   the same two taps leaving takes, for the same reason: nobody should hold up
   a table by putting a phone in a pocket badly. */
function vPauseAsk(s){
  document.documentElement.dataset.tone = "held";
  stopTicker();
  h('<div class="stack grow">'+topbar(s)+'<div class="grow"></div>'+
    '<div class="center">'+
      '<span class="pausemark">'+pauseGlyph(64)+'</span>'+
      '<h2>'+t("pause_ask_k")+'</h2>'+
      '<p class="note">'+t("pause_ask_d")+'</p>'+
      (s.breaks ? '<p class="brkleft">'+(s.breaks.left <= 1
        ? t("pause_last") : t("pause_left", s.breaks.left))+'</p>' : '')+
      '</div>'+
    errBox()+'<div class="grow"></div>'+
    '<button id="paok">'+t("pause_ask_yes")+'</button>'+
    '<button class="ghost" id="pano">'+t("pause_ask_no")+'</button></div>');
  on("paok", () => { pauseAsk = false; act({ type:"pause" }); });
  on("pano", () => { pauseAsk = false; render(); });
}
/* two bars, the shape every pause button on earth has */
function pauseGlyph(px){
  return '<svg viewBox="0 0 40 40" width="'+px+'" height="'+px+'" aria-hidden="true">'+
    '<circle cx="20" cy="20" r="20" fill="var(--sunk)"/>'+
    '<rect x="14" y="12" width="4.4" height="16" rx="2.2" fill="var(--second)"/>'+
    '<rect x="21.6" y="12" width="4.4" height="16" rx="2.2" fill="var(--second)"/></svg>';
}

function vPaused(s){
  const p = s.paused, left = pauseLeft();
  document.documentElement.dataset.tone = "held";
  /* the round clock, stopped where it stood — worth showing, because it is
     the thing everyone is afraid of losing when they ask for a moment */
  const frozen = (s.phase === "table" && typeof s.remainMs === "number") ? fmt(s.remainMs) : null;
  h('<div class="stack grow">'+offBox()+topbar(s)+
    '<div><div class="hero pausecard">'+
      '<p class="kicker">'+t("paused_k")+'</p>'+
      '<div class="pclock" id="pclk">'+fmt(left)+'</div>'+
      '<p class="psub">'+t("paused_auto")+'</p>'+
      '<div class="prail"><i id="prail" style="width:'+pausePct(left, p)+'%"></i></div>'+
      '<div class="herorow"><span class="hw">'+pav(p.by, "sm")+
        '<span>'+t("paused_by", esc(p.name))+'</span></span>'+
        (frozen ? '<span class="ht num">'+frozen+'</span>' : '')+
      '</div></div><div class="perf"></div></div>'+
    '<h2>'+(p.mine ? t("paused_head") : t("paused_wait", esc(p.name)))+'</h2>'+
    '<p class="note">'+(p.mine
      ? (frozen ? t("paused_d", frozen) : t("paused_d2"))
      : t("paused_wait_d", esc(p.name)))+'</p>'+
    errBox()+'<div class="grow"></div>'+
    (p.mine
      ? '<div class="btnrow"><button class="ghost" id="more">'+t("pause_more")+'</button>'+
        '<button id="back">'+t("pause_back")+'</button></div>'
      : '<button class="ghost" id="more">'+t("pause_more")+'</button>')+
    '<button class="quiet warn" id="quit">'+t("quit")+'</button></div>');
  on("more", () => act({ type:"pause" }));
  on("back", () => act({ type:"resume" }));
  on("quit", () => { quitting = true; render(); });
  startPauseTicker(p);
}
const pausePct = (left, p) => Math.max(0, Math.min(100, Math.round(100 * left / ((p && p.of) || 30000))));
function startPauseTicker(p){
  stopTicker();
  ticker = setInterval(() => {
    const clk = document.getElementById("pclk");
    if(!clk){ stopTicker(); return; }
    const left = pauseLeft();
    clk.textContent = fmt(left);
    const rail = document.getElementById("prail");
    if(rail) rail.style.width = pausePct(left, p) + "%";
    if(left <= 0) stopTicker();          /* the server's own timer brings us back */
  }, 200);
}

/* Leaving in the middle. Two taps, and the second one says what it costs —
   the table has already stopped by the time this screen is on, so nobody
   walks out of a game by mis-tapping. */
function vQuit(s){
  document.documentElement.dataset.tone = "held";
  stopTicker();
  const mine = (s.players || []).find(p => p.id === s.you) || {};
  h('<div class="stack grow">'+
    '<div class="center" style="padding:22px 0 4px">'+
      av(mine.name, colorOf(s.you), "big", mine.face)+
      '<h2>'+t("quit_k")+'</h2></div>'+
    '<div class="panel qlist">'+[1,2,3].map(i =>
      '<div class="qline"><span class="qb"></span><span>'+t("quit_"+i)+'</span></div>').join("")+'</div>'+
    '<p class="note">'+t("quit_note")+'</p>'+errBox()+'<div class="grow"></div>'+
    '<button class="red" id="quityes">'+t("quit_yes")+'</button>'+
    '<button class="ghost" id="quitno">'+t("quit_no")+'</button></div>');
  on("quityes", async () => { quitting = false; await act({ type:"leave" }); forget(); render(); });
  on("quitno", () => { quitting = false; render(); });
}

/* ---------------- dispatch ---------------- */
/* ---------------- how to play, and reading the board ---------------- */
/* Which round kinds each lane carries, read off the board actually on the
   table. This used to be a constant — the classic map's four lanes, written
   down once and coloured in the classic map's four colours. It was wrong on
   the other four maps, whose lanes carry different kinds in different colours;
   wrong again on a road board, which has no lanes to speak of; and it had
   never heard of Gamble, Duel, Two words or The link, so half the repertoire
   was missing from the legend that was supposed to be exhaustive. The board
   already tells the phone what is on every square. Ask it. */
function boardLanes(){
  const counts = [0,1,2,3].map(() => ({}));
  const nodes = (state && state.board && state.board.nodes) || [];
  nodes.forEach(n => {
    if(n.t === "CARD" || n.t === "WILD" || n.t === "S") return;
    if(n.c >= 0 && n.c < 4) counts[n.c][n.t] = (counts[n.c][n.t] || 0) + 1;
  });
  /* commonest first, so a lane reads as what it mostly is */
  const per = counts.map(m => Object.keys(m).sort((a,z) => m[z] - m[a] || (a < z ? -1 : 1)));
  /* and where a kind appears in more than one lane, its tag takes the colour
     of the lane it lives in most */
  const home = {};
  per.forEach((keys, c) => keys.forEach(k => {
    if(home[k] === undefined || counts[c][k] > counts[home[k]][k]) home[k] = c;
  }));
  return { per, home };
}
const K_SEEN = "lastsecond.sawboard";
const sawBoard = () => { try{ return !!localStorage.getItem(K_SEEN); }catch(e){ return true; } };
const markBoard = () => { try{ localStorage.setItem(K_SEEN, "1"); }catch(e){} };

function learnBtn(id, label, teaser){
  return '<button class="learn" id="'+id+'"><span class="li">?</span>'+
    '<span class="lt"><b>'+label+'</b><span>'+teaser+'</span></span>'+
    '<span class="lc" aria-hidden="true">›</span></button>';
}
function wireLearn(){
  on("howto", () => { openSheet("rules"); });
  on("boardhelp", () => { openSheet("legend"); });
  on("modeinfo", () => { openSheet("modes"); });
}
function openSheet(which){ sheet = which; sheetSeen = false; render(); }

function rulesBody(){
  const step = i => '<li><b>'+t("hw_s"+i)+'</b><span>'+t("hw_s"+i+"d")+'</span></li>';
  const pay  = (i,c) => '<div class="'+c+'"><b>'+t("hw_b"+i)+'</b><span>'+t("hw_b"+i+"d")+'</span></div>';
  const who  = i => '<div class="keyrow"><span class="kn">'+t("hw_p"+i)+'</span>'+
                    '<span class="kd">'+t("hw_p"+i+"d")+'</span></div>';
  return '<p class="lead">'+t("hw_idea")+'</p>'+
    '<p class="kicker">'+t("hw_round_k")+'</p>'+
    '<ol class="steps">'+[1,2,3,4].map(step).join("")+'</ol>'+
    '<p class="kicker">'+t("hw_when_k")+'</p>'+
    '<div class="payoff">'+pay(1,"none")+pay(2,"meh")+pay(3,"best")+'</div>'+
    '<p class="note">'+t("hw_when_d")+'</p>'+
    '<p class="kicker">'+t("hw_score_k")+'</p>'+
    '<div class="keylist">'+[1,2,3].map(who).join("")+'</div>'+
    '<p class="kicker">'+t("hw_board_k")+'</p>'+
    '<p class="note">'+t("hw_board_d")+'</p>';
}
/* one step. On a lattice: a row forward, and at most one lane sideways. On a
   road board that picture is a lie — most squares have exactly one way on, and
   the fan belongs at the junction — so the drawing changes with the board. */
function stepDiagram(roads){
  const to = [46, 110, 174];
  const line = (x1,y1,x2,y2) => '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+
    '" stroke="var(--accent)" stroke-width="2" opacity=".38" stroke-linecap="round"/>';
  const spot = (x,y,r) => '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="var(--accent-soft)" '+
    'stroke="var(--accent)" stroke-width="2"/>';
  const you = (x,y) => '<circle cx="'+x+'" cy="'+y+'" r="12.5" fill="var(--accent)"/>';
  const caption = y => '<text x="110" y="'+y+'" text-anchor="middle" font-family="Assistant,sans-serif" '+
    'font-size="11.5" font-weight="700" fill="var(--muted)">'+esc(t("lg_you"))+'</text>';
  if(!roads) return '<svg class="lgdiag" viewBox="0 0 220 104" role="img" aria-hidden="true">'+
    to.map(x => line(110, 72, x, 34)).join("")+
    to.map(x => spot(x, 30, 10.5)).join("")+ you(110, 74) + caption(100) +'</svg>';
  return '<svg class="lgdiag tall" viewBox="0 0 220 128" role="img" aria-hidden="true">'+
    line(110, 86, 110, 79) + line(110, 61, 110, 55) +
    to.map(x => line(110, 33, x, 25)).join("")+
    to.map(x => spot(x, 16, 9)).join("")+
    /* the junction, drawn heavier because it is the square worth reaching */
    '<circle cx="110" cy="44" r="11" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="3"/>'+
    spot(110, 70, 9) + you(110, 98) + caption(124) +'</svg>';
}
function miniNode(kind){
  const open = '<svg class="lgmini" viewBox="0 0 40 22" aria-hidden="true">';
  if(kind === "dot")  return open+'<circle cx="20" cy="11" r="4.5" fill="var(--rule)"/></svg>';
  if(kind === "card") return open+'<rect x="3" y="2.5" width="34" height="17" rx="8.5" fill="var(--good)"/>'+
    '<text x="20" y="14.4" text-anchor="middle" font-family="Assistant,sans-serif" font-size="7.5" '+
    'font-weight="800" fill="#FFFFFF">'+esc(t("card_node"))+'</text></svg>';
  if(kind === "wild") return open+'<circle cx="20" cy="11" r="9.5" fill="var(--surface)" '+
    'stroke="var(--violet)" stroke-width="1.6" stroke-dasharray="3 2.4"/>'+
    '<text x="20" y="14.8" text-anchor="middle" font-family="Suez One,Georgia,serif" '+
    'font-size="11" fill="var(--violet)">?</text></svg>';
  return open+'<circle cx="20" cy="11" r="10.5" fill="var(--ink)"/>'+
    '<text x="20" y="14.2" text-anchor="middle" font-family="Assistant,sans-serif" font-size="8" '+
    'font-weight="800" fill="#FFFFFF">'+(lang === "he" ? "סוף" : "END")+'</text></svg>';
}
function legendBody(){
  const mods = (pack && pack.mods) || {};
  const board = (state && state.board) || {};
  /* a road board sends the ways between its squares; a lattice sends none */
  const roads = !!board.ways;
  const COL = themeColc(board.themeId);
  const { per, home } = boardLanes();
  const lanes = [0,1,2,3].map(i =>
    '<div class="keyrow"><span class="lgswatch" style="background:'+COL[i]+'"></span>'+
    '<span class="kd">'+(per[i].length
      ? per[i].map(k => esc((mods[k] || {}).n || k)).join(", ")
      : t("lg_lane_plain"))+'</span></div>').join("");
  const key = ["dot","card","wild","end"].map(k =>
    '<div class="keyrow">'+miniNode(k)+'<span class="kd"><b>'+t("lg_"+k)+'</b> — '+t("lg_"+k+"_d")+'</span></div>').join("");
  /* only the kinds this board actually deals, in the colour it deals them in */
  const tags = Object.keys(home).filter(k => mods[k] && mods[k].s).map(k => {
    const col = COL[home[k]];
    return '<div class="keyrow"><span class="lgbadge">'+modSvg(k, 28)+
      '<span class="lgtag" style="border-color:'+col+';color:'+col+'">'+esc(mods[k].s)+'</span></span>'+
      '<span class="kd"><b>'+esc(mods[k].n)+'</b> — '+mods[k].d+'</span></div>';
  }).join("");
  return '<p class="kicker">'+t("lg_step_k")+'</p>'+stepDiagram(roads)+
    '<p class="note">'+t(roads ? "lg_step_rd" : "lg_step_d")+'</p>'+
    '<p class="kicker">'+t("lg_key_k")+'</p><div class="keylist">'+key+'</div>'+
    '<p class="kicker">'+t(roads ? "lg_lane_rk" : "lg_lane_k")+'</p>'+
    '<p class="note">'+t(roads ? "lg_lane_rd" : "lg_lane_d")+'</p><div class="keylist">'+lanes+'</div>'+
    '<p class="kicker">'+t("lg_why_k")+'</p>'+
    '<p class="note">'+t("lg_why_d")+'</p>'+
    (tags ? '<p class="kicker">'+t("lg_twist_k")+'</p><div class="keylist">'+tags+'</div>' : '');
}
/* the modes explainer: every game mode, one card each, same {n,s,d} shape
   the engine's own mods copy uses so English/Hebrew stay lined up */
function modesBody(){
  const copy = MODES_COPY[lang] || MODES_COPY.en;
  const cards = MODE_IDS.map((id,i) =>
    '<div class="modecard"><span class="mi">'+(i+1)+'</span>'+
    '<span class="mt"><b>'+esc(copy[id].n)+'</b><span>'+esc(copy[id].d)+'</span></span></div>').join("");
  return '<p class="lead">'+t("gm_teaser")+'</p><div class="modelist">'+cards+'</div>';
}
/* What's new: every release the server still lists, newest first, in this
   phone's language. The release this phone is actually running is marked —
   which is the whole reason the list is reachable from the version line and
   not from the rules. */
function clDate(iso){
  const d = new Date(String(iso) + "T00:00:00");
  if(isNaN(d.getTime())) return String(iso);
  try{ return d.toLocaleDateString(lang === "he" ? "he-IL" : "en-GB",
        { day:"numeric", month:"short", year:"numeric" }); }
  catch(e){ return String(iso); }
}
function whatsNewBody(){
  const held = (clRel && clLang === lang) ? clRel : null;
  if(clBusy && !held) return '<p class="note">'+t("cl_loading")+'</p>';
  if(clErr && !held)
    return '<p class="note">'+t("cl_failed")+'</p>'+
           '<button class="ghost" id="clretry">'+t("cl_retry")+'</button>';
  const rel = held || [];
  if(!rel.length) return '<p class="note">'+t("cl_failed")+'</p>';
  return rel.map(r => {
    const rows = (r.lines || []).map(l =>
      '<div class="keyrow"><span class="kn k_'+esc(l.kind)+'">'+t("cl_" + l.kind)+'</span>'+
      '<span class="kd">'+esc(l.text)+'</span></div>').join("");
    return '<div class="clrel"><span class="cv">'+esc(r.v)+'</span>'+
      '<span class="cd">'+esc(clDate(r.date))+'</span>'+
      (r.v === VERSION ? '<span class="cnow">'+t("cl_now")+'</span>' : '')+
      '</div><div class="keylist">'+rows+'</div>';
  }).join("");
}
const SHEETS = {
  rules:    { title:"hw_k", close:"hw_got", body:rulesBody },
  legend:   { title:"lg_k", close:"lg_close", body:legendBody },
  modes:    { title:"gm_title", close:"gm_close", body:modesBody },
  whatsnew: { title:"cl_k", close:"cl_close", body:whatsNewBody }
};
function paintSheet(){
  const cfg = SHEETS[sheet] || SHEETS.rules;
  if(sheet === "whatsnew") loadChangelog();
  const html = '<div class="sheet'+(sheetSeen ? " still" : "")+'" id="sheet">'+
    '<div class="sheetcard" role="dialog" aria-modal="true" aria-label="'+t(cfg.title)+'">'+
      '<div class="sheethead"><h2>'+t(cfg.title)+'</h2>'+
        '<button class="sheetx" id="sheetx" aria-label="'+t("hw_close")+'">'+
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" '+
        'stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'+
      '<div class="sheetbody">'+cfg.body()+'</div>'+
      '<div class="sheetfoot"><button id="sheetdone">'+t(cfg.close)+'</button></div>'+
    '</div></div>';
  const holder = document.createElement("div");
  holder.innerHTML = html;
  app.appendChild(holder.firstChild);
  sheetSeen = true;
  const close = () => { sheet = null; render(); };
  on("sheetx", close);
  on("sheetdone", close);
  on("clretry", () => { clErr = false; loadChangelog(); });
  const sh = document.getElementById("sheet");
  if(sh) sh.addEventListener("click", e => { if(e.target === sh) close(); });
}

function render(){
  paint();
  wireLearn();
  wireVersion();
  if(sheet) paintSheet();
}
function paint(){
  applyLang();
  if(screen !== "game") stopTicker();
  if(screen === "join"){ vJoin(); return; }
  if(!me || !me.pid){ vName(); return; }
  if(!state){ h('<div class="stack"><h1>'+wordmark(lang)+'</h1><p class="sub">…</p></div>'); return; }
  if(state.phase === "lobby"){ document.documentElement.dataset.tone = "live"; vLobby(); return; }
  if(!pack){ h('<div class="stack"><h1>'+wordmark(lang)+'</h1><p class="sub">…</p></div>'); return; }
  document.documentElement.dataset.tone = TONE[state.phase] || "live";
  /* the order reveal is a one-off: once the game is under way, the next one
     starts its shuffle from scratch */
  if(state.phase !== "order" && orderAt){ orderAt = 0; orderPath = null; clearTimeout(orderTimer); }
  /* A break covers the room, and the screen that asks whether you really mean
     to go covers even that — a break running out under someone reading it
     would answer the question for them. */
  if(quitting){ vQuit(state); return; }
  if(state.paused){ vPaused(state); return; }
  if(pauseAsk){ vPauseAsk(state); return; }
  const f = { order:vOrder, giver:vGiver, blind:vBlind, table:vTable, judge:vJudge,
              reveal:vReveal, move:vMove, award:vAward, swap:vSwap, wild:vWild, over:vOver }[state.phase];
  if(f) f(state); else vLobby();
  breakBar(state);
}

/* ---------------- turning the tablet over ----------------
   Everything drawn in CSS follows the new orientation on its own. The few
   sizes measured in javascript cannot, so when a turn moves the sheet to a
   different scale — and only then, not every time a keyboard opens — the
   screen is drawn again at the new one. */
let lastK = kScale();
let turnTimer = null;
function onTurn(){
  clearTimeout(turnTimer);
  turnTimer = setTimeout(() => {
    const k = kScale();
    if(k === lastK) return;
    lastK = k;
    render();
  }, 120);
}
addEventListener("resize", onTurn);
addEventListener("orientationchange", onTurn);

/* ---------------- boot ---------------- */
/* coming back to the foreground is the moment a stale phone is most likely to
   be showing an old build — so that is when it asks */
document.addEventListener("visibilitychange", () => { if(!document.hidden) checkUpdate(false); });
window.addEventListener("pageshow", e => { if(e.persisted) checkUpdate(false); });
setInterval(() => { if(!document.hidden) checkUpdate(false); }, 15 * 60 * 1000);
/* the ?u= that brought this load here has done its job; take it back out of
   the address so it is not carried into anything shared from here */
if(new URLSearchParams(location.search).has("u")){
  try{
    const u = new URL(location.href);
    u.searchParams.delete("u");
    history.replaceState(null, "", u.pathname + (u.search || "") + u.hash);
  }catch(e){}
}

try{ me = JSON.parse(localStorage.getItem(K_ROOM) || "null"); }catch(e){ me = null; }
try{ myFace = localStorage.getItem(K_FACE) || null; }catch(e){}
if(!myFace) myFace = FACES[Math.floor(Math.random() * FACES.length)].id;
if(me && me.pid && me.code){ connect(); render(); }
else { if(me && me.name) me = { name:me.name }; render(); }