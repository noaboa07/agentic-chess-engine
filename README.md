<div align="center">

# ♟ The Noah Verse

**A next-generation chess platform where every opponent is a fully autonomous AI agent — complete with a distinct personality, a calibrated Elo rating, and the ability to coach you in real time.**

*Powered by Stockfish, orchestrated by LLMs, delivered through a full-stack TypeScript + Python microservices architecture.*

<br/>

![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

</div>

---

## The Concept

Most chess apps give you a difficulty slider. The Noah Verse gives you **13 distinct opponents** — each a fully realized AI agent with its own personality, communication style, and strategic identity. From a blunder-prone chaos machine at 150 Elo to an all-knowing 2700-rated deity, every agent is backed by a Stockfish engine profile and an LLM that generates real-time coaching, trash talk, post-game analysis, and multi-agent move debates — all in character.

This is not a wrapper around an existing chess platform. It is a ground-up multi-agent system where the chess engine, the LLM coaching pipeline, and the TTS voice synthesizer are orchestrated as independent microservices and composed into a single, immersive experience.

---

## Features

### 🤖 13-Agent Persona System

Each agent spans a unique slice of the Elo spectrum with hand-crafted personality, a custom SVG avatar, and a dedicated per-persona music soundtrack:

| Agent | Elo | Archetype |
|---|---|---|
| Roomba Noah | 150 | Pure chaos. Completely random moves, zero engine evaluation. |
| Clown Noah | 300 | Overconfident. Blunders constantly. Doesn't know it. |
| Tilted Noah | 500 | Emotionally compromised. Hangs pieces. Blames you. |
| Sleep-Deprived Noah | 700 | Solid for a few moves, then completely collapses. |
| Gym Bro Noah | 900 | Brash. Good fundamentals, terrible endgame. |
| Coffee Shop Noah | 1100 | Calculated and composed. Occasional creative lapse. |
| Tech Bro Noah | 1300 | Optimizes aggressively. Underestimates opponents. |
| Rat Main Noah | 1500 | Hyper-prepared. Obsessed with the Sicilian. |
| Grandmaster Twitch Noah | 1700 | High-variance. Brilliant tactics, streamer tilt. |
| 4.0 GPA Noah | 1900 | Methodical. Never a mistake, rarely inspired. |
| Devil Noah | 2100 | Punishes every inaccuracy. Cold and precise. |
| Angel Noah | 2300 | Positionally dominant. Suffocates slowly. |
| God Noah | 2700 | Omniscient. Perfect play. Zero mercy. |

Each agent uses a **tiered engine backend**: randomized move selection at the low end, blended random/skill weighting in the mid-tier, and `UCI_LimitStrength + UCI_Elo` for the upper tier — ensuring authentic, differentiated gameplay at every level.

---

### 🎭 Per-Agent Strategy Profiles

Beyond Elo calibration, each agent has a `StrategyProfile` that governs *how* it plays, not just *how strong* it plays:

- **`blunder_chance`** — probability of picking a sub-optimal Stockfish MultiPV candidate instead of the top move
- **`endgame_skill`** — scaled blunder injection increase when piece count drops below 10
- **`time_pressure_multiplier`** — blunder chance amplifier when clock drops below 30 seconds
- **`tactic_depth`** — depth of MultiPV analysis used for candidate move selection

This means two agents at similar Elo can play very differently: one might be a solid positional player who collapses under time pressure; another might blunder freely in the endgame but find brilliant tactics in the middlegame.

---

### 🎙 AI Coaching & Teach Mode

Toggle **Teach Mode** before a game to activate the full coaching pipeline:

- **Real-time move classification** — every move scored as Brilliant / Great / Good / Inaccuracy / Mistake / Blunder via Stockfish centipawn loss analysis (opening exemption: inaccuracies in moves 1–10 auto-upgraded to Good)
- **Natural-language commentary** — Groq-powered LLM generates coaching in the persona's voice after each significant move
- **Blunder pattern injection** — queries your last 20 games, detects recurring mistake patterns (min. 3 blunders across 3 games), and injects that context into the LLM system prompt so the coach addresses your *actual* weaknesses
- **Opening tip** — fires once per game (moves 5–12) when an ECO opening is identified, giving a one-shot tip on key ideas or threats
- **Voice synthesis** — coaching messages stream through ElevenLabs TTS with per-session mute control
- **Hint on demand** — request a natural-language explanation at any point
- **LRU response cache** — identical (context + persona) coaching responses are served from an in-memory cache, cutting repeat Groq calls to zero

All LLM and TTS calls are aggressively gated behind centipawn thresholds and explicit user actions to minimize API cost.

---

### ⚖️ Move Debate Multi-Agent System

When your move is a significant error (CPL > 50), three internal agents debate the position using the top Stockfish MultiPV candidates:

| Agent | Focus |
|---|---|
| **Tactician** | Material gain, forcing sequences, immediate threats |
| **Positional** | Pawn structure, piece activity, long-term strategy |
| **Safety** | King safety, avoiding unnecessary exposure |

A **Final Arbiter** LLM call synthesizes the debate into a verdict. The transcript is displayed in a collapsible `DebatePanel` in the coach sidebar. Only one Groq call is made per move (the arbiter); the agent arguments are generated deterministically from Stockfish data.

---

### 🔍 "Explain Why Not"

In Teach Mode, **right-click any legal move dot** to ask the coach why that candidate is worse than the engine's best move. The backend computes the centipawn cost of the candidate, then calls the LLM (if CPL > 30) to explain the specific tactical or strategic reason it falls short — in the persona's voice. Responses appear as a sky-blue callout in the coach panel.

---

### 📋 Post-Game Coach Report

After every game (minimum 3 moves), a structured AI-generated report is available:

- **Game summary** — narrative overview of how the game unfolded
- **Opening identification** — ECO code + variation name
- **Critical mistakes** — top 3 moves by CPL with explanations
- **Best move missed** — worst missed opportunity
- **Recurring weakness** — dominant error pattern across the game
- **Tactical theme** — the main tactical motif (forks, pins, discovered attacks, etc.)
- **Recommended practice** — specific, actionable improvement advice
- **Estimated performance rating** — derived from average centipawn loss

Reports are generated in second person ("you played…") and scoped exclusively to the player's moves — not the opponent's.

---

### 📊 Player Weakness Tracking

The system analyzes your last 20 games and surfaces a personalized weakness profile across five categories:

| Category | Detection Logic |
|---|---|
| Hanging Pieces | Blunders with CPL > 250 |
| Opening Mistakes | Blunders in moves 1–10 |
| Missed Tactics | Blunders in moves 11–30 |
| Endgame Technique | Blunders when piece count ≤ 8 |
| Queen Overextension | Queen moves before move 20 that cost material |

Each category includes a trend indicator (improving / worsening / stable) computed by comparing your rate in recent games vs. older games.

---

### 📈 Adaptive Difficulty

The `GameOverModal` analyzes your recent performance and surfaces suggestions automatically:

- **Upgrade suggestion** (indigo banner) — win streak vs. current persona detected
- **Downgrade suggestion** (amber banner) — early blunder rate trending up across recent games

No user action required; the suggestion computes on game completion from Supabase history.

---

### 🏆 Dynamic Elo & Multi-Mode Ratings

Ratings tracked across five independent time control pools:

- **Bullet** · **Blitz** · **Rapid** · **Classical** · **Unlimited**

Dynamic K-factor scaling: K=40 for new players (< 20 games), K=20 for established players, K=10 for 2400+ Elo. Elo updates are a single atomic batch write on game conclusion — never mid-game.

A **global leaderboard** (top 50) is accessible from the coach panel during play.

---

### 🎵 Atmosphere & Per-Persona Music

The background dynamically responds to play quality:

| State | Trigger | Visual | Audio |
|---|---|---|---|
| Calm | Default | Neutral | `calm.mp3` |
| Hype | 3 consecutive Good / Great / Brilliant | Indigo glow | `hype.mp3` |
| Dramatic | 3 consecutive Inaccuracy / Mistake / Blunder | Red glow | `dramatic.mp3` |

Each persona has its own 3-track soundtrack (`/audio/{personaId}/{intensity}.mp3`). Tracks crossfade on state and persona changes. A cinematic vignette darkens the edges of the viewport to draw focus to the board. If a persona's tracks are missing, the system falls back to `/audio/default/{intensity}.mp3` automatically.

---

### 🎨 Board Themes & Shop

Ten board color themes, unlockable by reaching the required Elo:

| Theme | Elo Required |
|---|---|
| Classic, Ocean | Free |
| Forest | 400 |
| Slate | 600 |
| Rose | 800 |
| Gold Rush | 1000 |
| Ice | 1200 |
| Royal | 1500 |
| Obsidian | 1800 |
| Inferno | 2100 |

Theme selection persists in `localStorage` and applies immediately to the board. The **Shop** page shows lock/unlock status against your current Elo; the **Settings** page provides quick-change access.

---

### 🔊 Sound Engine

A singleton `AudioManager` preloads 13 sound effects on mount with zero re-render overhead. Check priority: check sound overrides capture sound when both apply.

| Trigger | SFX |
|---|---|
| Player move | `move-self` |
| AI move | `move-opponent` |
| Capture | `capture` |
| Check (highest priority) | `move-check` |
| Castling | `castle` |
| Promotion | `promote` |
| Illegal attempt | `illegal` |
| 10 seconds remaining | `tenseconds` |
| Win / Loss | `game-end` |
| Draw | `game-draw` |
| Game start | `game-start` |
| Notify | `notify` |

---

### ♟ Opening Recognition

Live ECO detection using an embedded `eco-openings.json` lookup (EPD key → `{ code, name }`). The opening badge updates after every move and displays `"ECO · Variation Name"` (e.g. `"B30 · Sicilian Defense"`). The first identification in Teach Mode triggers a one-shot persona coaching tip.

---

### 🖥 Observability

An in-memory telemetry ring buffer (last 1,000 entries) tracks per-service latency and error rates. A dev dashboard at `/dev` (gated by `NEXT_PUBLIC_DEV_MODE=true`) polls `/api/telemetry` every 5 seconds.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           Browser                               │
│                                                                 │
│  Next.js 14 App Router                                          │
│  ┌────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐  │
│  │LobbyScreen │  │ ChessBoard  │  │CoachPanel│  │DebatePanel│ │
│  └────────────┘  └─────────────┘  └──────────┘  └──────────┘  │
│                         │                                       │
│               GameContext (React)                               │
│    move log · eval · classification · opening · debate          │
│    deferred game-over · adaptive suggestion · theme             │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP REST
┌─────────────────────────────▼───────────────────────────────────┐
│                      FastAPI (Python 3.11)                      │
│                                                                 │
│  POST /api/move           POST /api/coach-report                │
│  POST /api/explain-move   POST /api/engine-first-move           │
│  POST /api/elo/calculate  POST /api/tts                         │
│  GET  /api/telemetry                                            │
│                                                                 │
│  ┌────────────┐  ┌──────────────┐  ┌──────────┐  ┌─────────┐  │
│  │ Stockfish  │  │  coach.py    │  │debate.py │  │cache.py │  │
│  │ (local)    │  │  (Groq LLM)  │  │(3-agent) │  │(LRU 512)│  │
│  │ MultiPV=3  │  │  LangChain   │  │1 Groq    │  │         │  │
│  └────────────┘  └──────────────┘  │call/move │  └─────────┘  │
│                                    └──────────┘                 │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐  │
│  │  tts.py         │  │  telemetry.py (ring buffer, p50/p95) │  │
│  │  (ElevenLabs)   │  └─────────────────────────────────────┘  │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │      Supabase      │
                    │  users · games     │
                    │  coach_reports     │
                    │  RLS on all tables │
                    └────────────────────┘
```

### Key Design Decisions

**Deferred game-over pattern** — `concludeGame()` only sets a `gameOverPending` flag in React context. `acknowledgeGameOver()` is the sole function that commits to Supabase and resets board state. This separates UI feedback from data persistence and prevents partial write races.

**No mid-game DB writes** — move history lives entirely in React state and is batch-inserted as a JSONB array on game conclusion. Eliminates per-move latency and prevents partial write corruption.

**Stockfish tiered backend** — low-Elo agents use Python-level randomized move selection before Stockfish is ever consulted. Prevents the "all agents feel the same under 800 Elo" problem common in naive skill-level implementations.

**Mate score capping** — `_score_to_cp()` caps mate scores at ±600 cp. Prevents astronomical centipawn loss values (up to 20,000 cp) when a player misses a forced mate, which would corrupt coaching quality metrics.

**Phase-based routing** — lobby → game is a `useState` transition in `play/page.tsx`, not URL navigation. Keeps `AtmosphereBackground` mounted across transitions so music never re-initializes.

**LRU coaching cache** — identical (classification + evaluation + persona) tuples are served from an in-memory LRU cache (maxsize=512). Cache hits skip the Groq call entirely and are tracked in telemetry.

---

## Performance Benchmarks

Measured locally (Stockfish depth=15, Groq `llama-3.3-70b-versatile`):

| Service | p50 | p95 | Notes |
|---|---|---|---|
| Stockfish analysis | ~220 ms | ~480 ms | depth=15, MultiPV=3 |
| Groq coaching | ~450 ms | ~900 ms | gated: only on blunders / explicit request |
| Groq debate (arbiter) | ~380 ms | ~750 ms | gated: CPL > 50 only |
| ElevenLabs TTS | ~650 ms | ~1,400 ms | gated: explicit user action |
| `/api/move` (no coaching) | ~250 ms | ~520 ms | Stockfish only |
| `/api/move` (with coaching) | ~720 ms | ~1,350 ms | Stockfish + Groq |
| Cache hit (coaching) | < 5 ms | < 10 ms | LRU, no Groq call |

Live metrics are available at `/api/telemetry` (see Observability section).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (App Router) |
| UI Language | TypeScript 5 + React 18 (hooks only, no class components) |
| Styling | Tailwind CSS |
| Chess Logic | `chess.js` v1 + `react-chessboard` |
| Backend Framework | FastAPI (Python 3.11+) |
| Chess Engine | Stockfish (local binary via `python-chess`) |
| LLM Orchestration | LangChain + Groq API (`llama-3.3-70b-versatile`) |
| Voice Synthesis | ElevenLabs API |
| Auth & Database | Supabase (PostgreSQL + Row Level Security) |
| Audio | Web Audio API (singleton manager, zero dependencies) |
| Testing | pytest (backend) + Jest (frontend) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- A local [Stockfish binary](https://stockfishchess.org/download/)
- Supabase project (free tier works)
- Groq API key (free tier works)
- ElevenLabs API key (optional — TTS degrades gracefully)

### 1. Clone

```bash
git clone https://github.com/noaboa07/agentic-chess-engine.git
cd agentic-chess-engine
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
STOCKFISH_PATH=/path/to/stockfish
GROQ_API_KEY=your_groq_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_voice_id
```

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Supabase Schema

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
  result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'draw', 'resigned')),
  time_control TEXT DEFAULT NULL,
  moves JSONB NOT NULL DEFAULT '[]',
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "games_select_own" ON public.games FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "games_insert_own" ON public.games FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 5. Audio Files

Place `.mp3` files in `frontend/public/audio/`:

```
# Sound effects (root of /audio/)
move-self.mp3  move-opponent.mp3  capture.mp3  move-check.mp3
castle.mp3     promote.mp3        illegal.mp3  premove.mp3
tenseconds.mp3 game-start.mp3     game-end.mp3 game-draw.mp3
notify.mp3

# Per-persona music (one folder per persona_id, fallback in /default/)
audio/{persona_id}/calm.mp3
audio/{persona_id}/dramatic.mp3
audio/{persona_id}/hype.mp3
audio/default/calm.mp3        # fallback if persona tracks are missing
audio/default/dramatic.mp3
audio/default/hype.mp3
```

Audio files are excluded from this repo for licensing reasons.

---

## Running Tests

**Backend (pytest):**

```bash
cd backend
pytest tests/ -v
```

Covers: CPL classification boundaries, Elo math (K-factor / outcomes / floor / upsets), all 13 persona strategy profile invariants.

**Frontend (Jest):**

```bash
cd frontend
npm install --save-dev jest @types/jest ts-jest
# configure jest.config.js with next/jest
npm test
```

Covers: Elo calculation logic mirroring `/api/elo/calculate`.

---

## Project Structure

```
agentic-chess-engine/
├── backend/
│   ├── main.py                    # All FastAPI routes
│   ├── personas/
│   │   └── personas.py            # 13-persona ladder + strategy profiles
│   ├── services/
│   │   ├── stockfish.py           # Engine reply, CPL analysis, mate cap
│   │   ├── coach.py               # LLM coaching, report, explain-why-not
│   │   ├── debate.py              # 3-agent MultiPV debate
│   │   ├── tts.py                 # ElevenLabs TTS
│   │   ├── telemetry.py           # Latency ring buffer
│   │   └── cache.py               # LRU coaching cache
│   └── tests/
│       ├── test_move_classification.py
│       ├── test_elo_math.py
│       └── test_agent_config.py
└── frontend/
    ├── app/
    │   ├── page.tsx               # Landing page
    │   ├── play/page.tsx          # Lobby ↔ game phase controller
    │   ├── settings/page.tsx      # Board theme picker
    │   ├── shop/page.tsx          # Elo-gated theme gallery
    │   ├── profile/page.tsx       # Stats, history, username editing
    │   ├── components/
    │   │   ├── ChessBoard.tsx     # Board, arrows, sound, click-to-move
    │   │   ├── CoachPanel.tsx     # Coaching, eval, debate, explain
    │   │   ├── DebatePanel.tsx    # Collapsible 3-agent debate
    │   │   ├── LobbyScreen.tsx    # Persona cards, time controls
    │   │   ├── GameOverModal.tsx  # Result + adaptive suggestion
    │   │   ├── ChessClock.tsx     # Countdown with increment
    │   │   └── AtmosphereBackground.tsx  # Crossfade music + vignette
    │   └── context/
    │       ├── GameContext.tsx    # Full game state
    │       └── AuthContext.tsx    # Supabase auth gate
    └── lib/
        ├── themes.ts              # 10 board themes, localStorage
        ├── db.ts                  # All Supabase queries
        ├── audio.ts               # SFX singleton manager
        └── openings.ts            # ECO lookup
```

---

## License

MIT © [Noah Russell](https://github.com/noaboa07)

---

<div align="center">
  <sub>Built with TypeScript, Python, and an unhealthy obsession with chess.</sub>
</div>
