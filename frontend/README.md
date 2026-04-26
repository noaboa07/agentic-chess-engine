# The Noah Verse — Agentic Chess Engine

An AI-powered chess training platform with 13 autonomous personas, Stockfish engine analysis, LLM coaching, and a full campaign progression system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Chess | `react-chessboard`, `chess.js` |
| Backend | Python 3.11, FastAPI, `python-chess`, Stockfish |
| AI | LangChain, Groq (`llama-3.3-70b-versatile`), ElevenLabs TTS |
| Database | Supabase (PostgreSQL + RLS) |
| Fonts | Fraunces (serif), JetBrains Mono, Geist Sans/Mono |

---

## Project Structure

```
agentic-chess-engine/
├── backend/
│   ├── main.py                    # FastAPI app — all routes
│   ├── personas/personas.py       # 13-persona ladder with StrategyProfile
│   ├── services/
│   │   ├── stockfish.py           # CPL classification, engine replies
│   │   ├── coach.py               # Groq coaching pipeline
│   │   ├── debate.py              # 3-agent debate (Tactician/Positional/Safety)
│   │   ├── tts.py                 # ElevenLabs TTS streaming
│   │   ├── telemetry.py           # Per-service latency/error observability
│   │   └── cache.py               # LRU coaching response cache (512 entries)
│   └── tests/
│       ├── conftest.py
│       ├── test_move_classification.py
│       ├── test_elo_math.py
│       └── test_agent_config.py
│
└── frontend/
    ├── app/
    │   ├── layout.tsx             # Root layout: AuthProvider + AchievementProvider + GlobalSettingsButton
    │   ├── page.tsx               # Landing page (server component)
    │   ├── error.tsx              # Global Next.js error boundary
    │   ├── play/
    │   │   ├── layout.tsx         # GameProvider + AtmosphereBackground
    │   │   └── page.tsx           # Phase controller (lobby ↔ game)
    │   ├── campaign/page.tsx      # Tiered boss ladder + BossFightModal
    │   ├── replay/[gameId]/page.tsx # Read-only board, eval bar, keyboard nav
    │   ├── dashboard/page.tsx     # SVG charts: Elo history, CPL trend, win rate
    │   ├── puzzles/page.tsx       # Blunder feed from game history
    │   ├── profile/page.tsx       # Stats, achievements grid, game history
    │   ├── demo/page.tsx          # 4-tab static preview (no auth)
    │   ├── shop/page.tsx          # Elo-gated board theme gallery
    │   ├── settings/page.tsx      # Legacy settings page (redirects to GlobalSettingsButton)
    │   ├── components/
    │   │   ├── landing/
    │   │   │   ├── LandingNav.tsx        # Sticky nav: wordmark, Play dropdown, logout
    │   │   │   ├── ChessBoardHero.tsx    # Terminal-style engine output panel
    │   │   │   └── PersonaLadder.tsx     # 13-persona roster with avatars + Elo
    │   │   ├── ChessBoard.tsx            # Board, arrows, premove blunder check
    │   │   ├── LobbyScreen.tsx           # Persona cards, time controls, teach mode
    │   │   ├── CoachPanel.tsx            # Coaching messages, TTS, debate, hints
    │   │   ├── DebatePanel.tsx           # 3-agent collapsible debate
    │   │   ├── ChessClock.tsx            # Countdown clock with increment
    │   │   ├── GameOverModal.tsx         # Result (win/loss/draw/resign), adaptive suggestion
    │   │   ├── BossFightModal.tsx        # Pre-game boss taunt + lesson
    │   │   ├── BlunderConfirmModal.tsx   # Pre-move warning for blunders/mistakes
    │   │   ├── AtmosphereBackground.tsx  # Per-persona crossfade music + intensity glow
    │   │   ├── AchievementToast.tsx      # Tier-glow toast, click → /profile
    │   │   ├── GlobalSettingsButton.tsx  # Fixed gear icon (all pages), settings modal
    │   │   ├── OnboardingOverlay.tsx     # 5-step spotlight tutorial
    │   │   ├── LeaderboardModal.tsx      # Top-50 by Elo
    │   │   ├── EvalBar.tsx               # SVG evaluation bar
    │   │   ├── Toast.tsx                 # Reusable error/info/success toast
    │   │   ├── EmptyState.tsx            # Reusable empty state with CTA
    │   │   ├── AuthModal.tsx             # Sign-in / sign-up modal
    │   │   └── LogoutButton.tsx          # Supabase sign-out
    │   └── context/
    │       ├── AuthContext.tsx           # Supabase auth gate, user session
    │       ├── GameContext.tsx           # Full game state, campaign state, puzzles
    │       └── AchievementContext.tsx    # Achievement queue + unlock logic
    ├── lib/
    │   ├── settings.ts            # AppSettings (9 fields), useSettings hook, localStorage
    │   ├── themes.ts              # 10 board themes, Elo gates, localStorage persistence
    │   ├── db.ts                  # All Supabase queries (RLS-compliant)
    │   ├── audio.ts               # Singleton SFX manager
    │   ├── openings.ts            # detectOpeningFull() → "ECO · Name"
    │   ├── openings-explorer.ts   # Opening explorer data
    │   ├── achievements.ts        # Achievement definitions (15 total, Bronze–Platinum)
    │   ├── auth.ts                # Auth helpers
    │   └── supabase.ts            # Supabase client
    ├── public/
    │   ├── avatars/               # 13 hand-authored SVG persona illustrations
    │   └── audio/                 # Per-persona music (not committed); notify.mp3
    └── tailwind.config.ts         # Color tokens: board.*, ink.*, gold, chess-win/loss/warn
```

---

## 13-Persona Ladder

| Persona | Elo |
|---|---|
| Roomba Noah | 150 |
| Clown Noah | 300 |
| Tilted Noah | 500 |
| Sleep-Deprived Noah | 700 |
| Gym Bro Noah | 900 |
| Coffee Shop Noah | 1100 |
| Tech Bro Noah | 1300 |
| Rat Main Noah | 1500 |
| Grandmaster Twitch Noah | 1700 |
| 4.0 GPA Noah | 1900 |
| Devil Noah | 2100 |
| Angel Noah | 2300 |
| God Noah | 2700 |

---

## Features

### Core Engine
- FastAPI backend with Stockfish MultiPV=3, depth=15; mate score capped at ±600 cp
- Per-persona strategy profiles: `blunder_chance`, `endgame_skill`, `time_pressure_multiplier`, `tactic_depth`
- 100% random moves ≤600 Elo; blended random+engine 601–1319; UCI_LimitStrength 1320+
- CPL classification: Brilliant / Great / Best / Good / Inaccuracy / Mistake / Blunder

### Coaching Pipeline
- Groq LLM (`llama-3.3-70b-versatile`) coaching gated on CPL thresholds — never per-move
- LRU cache (512 entries) skips repeat Groq calls for identical context tuples
- 3-agent debate: Tactician vs. Positional vs. Safety + Final Arbiter (CPL > 50 gate)
- ElevenLabs TTS streaming; mute toggle; coach coach cache persists across moves
- "Explain last move", "Why did AI play that?", "Explain Why Not" (right-click legal dot)

### Board & Controls
- Right-click drag canvas arrows; legal move dots; opening badge
- Pre-move blunder warning (`off` / `blunders` / `mistakes` modes)
- Take-back, flip board, auto-queen promotion, reduced motion toggle
- 10 board color themes, Elo-gated, persisted to localStorage

### Campaign
- 5-tier boss ladder; `BossFightModal` with per-persona italic taunts and lesson/watch-out/reward
- Unlock state in `campaign_progress` Supabase table (RLS)
- Campaign games auto-start in Teach Mode with no time control
- Available-boss cards animate with indigo ring pulse

### Replay
- Read-only board with SVG eval bar; clickable move list; auto-play
- Arrow key navigation (←/→) + Space to toggle play
- "⚠ Mistakes" toggle: filtered mistake-only list with Prev/Next jumping

### Achievements
- 15 achievements (Bronze → Platinum), `user_achievements` table (RLS)
- Tier-based glow toast (slide-in/out CSS keyframes), `notify.mp3` SFX
- Click toast → navigate to `/profile`; idempotent upsert prevents duplicates

### Dashboard & Puzzles
- Pure SVG charts: Elo history, CPL trend, classification breakdown, win rate by persona
- Deterministic training plan from weakness profile
- Blunder feed auto-generated from game history; client-side UCI comparison

### Settings (Global)
- Fixed gear icon (`bottom-left`, all pages) opens settings modal
- 9 settings: `showLegalMoves`, `showArrows`, `autoQueenPromotion`, `reducedMotion`, `achievementSoundEnabled`, `defaultTeachMode`, `blunderConfirmMode`, `confirmResign`, `defaultTimeControlId`
- All persisted to localStorage under `noahverse_settings`

### Guest Mode
- Full game functionality without account; amber coach panel banner
- Elo and history not persisted; prompts sign-up on game conclusion

### Infrastructure
- Rate limiting via `slowapi`: 60 req/min (move), 20 req/min (LLM); 429 → dismissible Toast
- Dynamic Elo: 5 time-control pools, K-factor scaling (40/20/10), stored per game row
- `OnboardingOverlay`: 5-step spotlight tutorial, localStorage flag, dismissable
- Leaderboard (top 50) accessible from coach panel

---

## Setup

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Set STOCKFISH_PATH, GROQ_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID in .env
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
# Set NEXT_PUBLIC_BACKEND_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
npm run dev
```

### Tests
```bash
# Backend
cd backend && pytest tests/ -v

# Frontend
cd frontend && npm test
```

---

## Supabase Schema

```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  current_elo INTEGER NOT NULL DEFAULT 400,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  opponent_id TEXT NOT NULL,
  opponent_skill INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win','loss','draw','resigned')),
  moves JSONB NOT NULL DEFAULT '[]',
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_control TEXT,
  player_elo_after INTEGER,
  mode TEXT
);

CREATE TABLE public.campaign_progress (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  persona_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, persona_id)
);

CREATE TABLE public.user_achievements (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- RLS enabled on all tables
```

---

## Key Design Invariants

- **No mid-game DB writes** — move history in React state; single batch JSONB insert on game conclusion via `acknowledgeGameOver()`
- **Deferred game-over** — `concludeGame()` sets flag only; `acknowledgeGameOver()` is the sole DB commit point
- **RLS everywhere** — all Supabase queries use authenticated `uid`; no admin bypass on frontend
- **LLM gating** — Groq only fires on CPL thresholds, explicit user action, or significant events; never per-move
- **Gold accent only** — `#E8B931` used exclusively for primary CTAs, stat numerals, and hover accents; no indigo/violet on public-facing UI
- **Audio files** — dropped manually into `public/audio/`; per-persona at `/audio/{personaId}/{intensity}.mp3`; fallback at `/audio/default/{intensity}.mp3`
