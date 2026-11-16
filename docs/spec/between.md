# אסימון · בין לבין

Between is a Hebrew numeric trivia game on the same Node server as the classic
game. Its phone route is `/between`, and `/between/tv?room=ABCD` has a read-only
living-room view. The TV shows the question and who has locked a range. It sees
the correct number and private ranges when the server reveals them.

## Rules

- A room starts with three to eight players and runs ten questions. The first
  chooser is randomized, then the turn rotates. The chooser has 16 seconds to
  select one of three topics. The first offered topic is the timeout default.
- Each player has 35 seconds to lock a whole-number guess and an inclusive range.
  The three half-widths are set per question. Ranges start at zero or higher.
  A narrow hit pays 3, a medium hit 2 and a broad hit 1. A miss or missing guess
  pays zero. More than one player can earn the same score.
- The topic chooser earns one extra point if their base score equals the highest
  positive score on that question. This includes a shared top score.
- In round five, a hint lets a player with a medium or broad range tighten by
  one tier without moving the center. Round eight offers a room-memory question
  about the sum of points earned in the first five rounds.
- The highest total after question ten wins. Ties at a positive score are shared.
  The host may advance a reveal early, or the room advances after 24 seconds.

## Storage and hosting

The existing `asimon` Docker web service on Render serves both modes. It uses a
single instance because active rooms live in the process. Guests get a temporary
room seat. A completed game contributes to statistics only for signed-in seats,
and each signed-in player and game pair can be recorded only once. Daily and
weekly wins use `Asia/Jerusalem`. The week starts on Sunday.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Internal Render PostgreSQL URL. Place PostgreSQL in the web service's region. |
| `PUBLIC_ORIGIN` | Canonical origin, e.g. `https://asimon.onrender.com`. |
| `GOOGLE_CLIENT_ID` | Google OAuth web application client ID. |
| `GOOGLE_CLIENT_SECRET` | Matching secret. Set in Render. |
| `SESSION_SECRET` | Random secret of at least 32 characters. Set in Render. |
| `BETWEEN_DATA_FILE` | Optional JSON path for local development or a persistent mount. |

Register `https://asimon.onrender.com/api/between/auth/callback` as an authorized
redirect URI for that Google web application. The server uses the Google subject
identifier and stores the player's chosen nickname and character. The schema and
question bank initialize on the first database-backed request. By default, local
development stores accounts and results in `.data/between.json`; Google needs its
OAuth configuration, and on Render also needs a configured persistent store.

`game/between.test.js` exercises the ten-round flow, eight seats, the chooser
bonus, public and private views, the Google callback with a mocked provider, and
leaderboard deduplication.
