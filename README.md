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

Most chess apps give you a difficulty slider. The Noah Verse gives you **13 distinct opponents** — each one a fully realized AI agent with its own personality, communication style, and strategic identity. From a blunder-prone chaos machine at 150 Elo to an all-knowing 2700-rated deity, every agent is backed by a Stockfish engine profile and an LLM that generates real-time coaching, trash talk, and post-move analysis — all in character.

This is not a wrapper around an existing chess platform. It is a ground-up multi-agent system where the chess engine, the LLM coach, and the TTS voice pipeline are orchestrated as independent microservices and composed into a single, immersive experience.

---

## Features

### 🤖 Multi-Agent Persona System

Thirteen agents span the full Elo spectrum, each with a hand-crafted system prompt defining their personality:

| Agent | Elo | Archetype |
|---|---|---|
| Roomba Noah | 150 | Pure chaos. Moves are essentially random. |
| Clown Noah | 300 | Overconfident. Blunders constantly. |
| Tilted Noah | 500 | Emotionally compromised. Hangs pieces. |
| Sleep-Deprived Noah | 700 | Makes logical moves, then completely collapses. |
| Gym Bro Noah | 900 | Brash. Good fundamentals, terrible endgame. |
| Coffee Shop Noah | 1100 | Solid, calculated. Occasional creative lapse. |
| Tech Bro Noah | 1300 | Optimizes aggressively. Underestimates opponents. |
| Rat Main Noah | 1500 | Hyper-prepared. Loves the Sicilian. |
| Grandmaster Twitch Noah | 1700 | High-variance. Brilliant tactics, streamer tilt. |
| 4.0 GPA Noah | 1900 | Methodical. Never a mistake, rarely inspired. |
| Devil Noah | 2100 | Punishes every inaccuracy. Cold and precise. |
| Angel Noah | 2300 | Positionally dominant. Suffocates slowly. |
| God Noah | 2700 | Omniscient. Perfect play. No mercy. |

Each agent is powered by a distinct Stockfish engine profile — randomized move selection at the low end, blended random/skill weighting in the mid-tier, and `UCI_LimitStrength + UCI_Elo` for the upper tier — ensuring authentic, differentiated gameplay at every level.

---

### 📊 Dynamic Elo & Rating System

Player ratings are tracked across five independent time control pools, mirroring how real-world platforms like FIDE and Lichess handle rating segmentation:

- **Bullet** (2+1)
- **Blitz** (5+3)
- **Rapid** (10+5)
- **Classical** (30+0)
- **Unlimited**

The rating algorithm applies **dynamic K-factor scaling**: new players start with a high K-factor (more volatile ratings) that decays as game count increases, reflecting established skill. Elo updates are executed as a single atomic batch write to Supabase when the game concludes — never mid-game.

---

### 🎙 AI Coaching & Teach Mode

Toggle **Teach Mode** before a game to activate the full coaching pipeline:

- **Real-time move classification** — every move is scored as Brilliant, Great, Good, Inaccuracy, Mistake, or Blunder via Stockfish centipawn loss analysis.
- **Natural-language commentary** — after each move, a Groq-powered LLM generates a coaching message in the voice of the current persona, explaining what happened and why.
- **Blunder pattern injection** — the system queries your last 20 games from Supabase, detects recurring mistake patterns (minimum 3 blunders across 3 games), and injects that context directly into the LLM system prompt so the coach addresses your *actual* weaknesses.
- **Voice synthesis** — coaching messages are streamed through an ElevenLabs TTS pipeline and played back with per-session mute control.
- **Best move display** — the engine's preferred reply is shown after each move.
- **Hint on demand** — request a natural-language explanation of the last move at any time.

All LLM and TTS calls are aggressively gated behind centipawn thresholds and explicit user actions to minimize API cost while preserving coaching quality.

---

### 🔊 Immersive Audio Engine

A singleton `AudioManager` (`lib/audio.ts`) preloads 13 contextual sound effects on mount and manages playback with zero re-render overhead:

| Trigger | SFX |
|---|---|
| Player move | `move-self` |
| AI move | `move-opponent` |
| Capture | `capture` |
| Check (highest priority — overrides capture) | `move-check` |
| Castling | `castle` |
| Promotion | `promote` |
| Illegal move attempt | `illegal` |
| 10 seconds remaining on clock | `tenseconds` |
| Win / Loss | `game-end` |
| Draw | `game-draw` |

A global mute toggle in the UI kills both SFX and TTS simultaneously without interrupting game state.

---

### ⏱ Time Controls & Chess Clock

A self-contained `ChessClock` component manages countdown entirely in local state (no re-render pressure on the game loop). Features:
- Configurable increment per move
- 10-second warning audio triggered exactly once per player per game
- Timeout resolves through the same `concludeGame` pipeline as checkmate — producing the correct win/loss modal

---

### 🎨 Atmosphere System

The background dynamically responds to the quality of your play:

| State | Trigger | Visual | Music |
|---|---|---|---|
| Calm | Default | Neutral | `calm.mp3` |
| Hype | 3 consecutive Good / Great / Brilliant | Indigo glow | `hype.mp3` |
| Dramatic | 3 consecutive Inaccuracy / Mistake / Blunder | Red glow | `dramatic.mp3` |

Tracks crossfade smoothly between states, and the atmosphere layer stays mounted across the lobby → game transition so music never interrupts.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│  Next.js 14 (App Router)                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  LobbyScreen │  │  ChessBoard  │  │   CoachPanel     │  │
│  │  (persona +  │  │  (react-     │  │   (eval, TTS,    │  │
│  │  time ctrl)  │  │  chessboard) │  │   classification)│  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         │                 │                    │             │
│         └─────────────────┴────────────────────┘            │
│                           │                                  │
│                    GameContext (React)                       │
│              (move log, eval, game state,                    │
│               deferred game-over pattern)                    │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP (REST)
┌───────────────────────────▼─────────────────────────────────┐
│                     FastAPI (Python)                         │
│                                                             │
│  /api/move          /api/tts          /api/engine-first-move│
│       │                  │                    │              │
│  ┌────▼────┐      ┌──────▼──────┐    ┌───────▼──────┐      │
│  │Stockfish│      │ ElevenLabs  │    │   Stockfish  │      │
│  │  Engine │      │  TTS API    │    │  (black open)│      │
│  └────┬────┘      └─────────────┘    └──────────────┘      │
│       │                                                      │
│  ┌────▼──────────────────┐                                  │
│  │  Groq LLM (LangChain) │                                  │
│  │  + Blunder Injection  │                                  │
│  └───────────────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │   Supabase    │
                    │ (users, games │
                    │  Elo, RLS)    │
                    └───────────────┘
```

### Key Design Decisions

**Deferred game-over pattern** — `concludeGame()` only sets a `gameOverPending` flag in React context. The `GameOverModal` reads this flag and renders. `acknowledgeGameOver()` is the sole function that commits to Supabase and resets board state. This cleanly separates UI feedback from data persistence.

**No mid-game DB writes** — move history lives entirely in React state (`GameContext.moveLog`) and is batch-inserted as a JSONB array on game conclusion. This eliminates per-move latency and prevents partial write corruption.

**Stockfish as a tiered backend service** — low-Elo agents use randomized move selection in Python before Stockfish is ever consulted. This prevents the "all agents feel the same under 800 Elo" problem common in naive skill-level implementations.

**Phase-based routing** — the lobby → game transition is managed by a single `useState<'lobby'|'game'>` in `play/page.tsx`, not URL navigation. This keeps `AtmosphereBackground` mounted across transitions so audio never interrupts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (App Router) |
| UI Language | TypeScript + React (hooks only) |
| Styling | Tailwind CSS |
| Chess Logic | `chess.js` v1, `react-chessboard` |
| Backend Framework | FastAPI (Python 3.11+) |
| Chess Engine | Stockfish (local binary via `python-chess`) |
| LLM Orchestration | LangChain + Groq API |
| Voice Synthesis | ElevenLabs API |
| Auth & Database | Supabase (Row Level Security enforced) |
| Audio | Web Audio API (singleton manager, no dependencies) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- A local [Stockfish binary](https://stockfishchess.org/download/)
- Supabase project (free tier works)
- Groq API key (free tier works)
- ElevenLabs API key (optional — TTS degrades gracefully)

### 1. Clone the repo

```bash
git clone https://github.com/noaboa07/agentic-chess-engine.git
cd agentic-chess-engine
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
STOCKFISH_PATH=/path/to/stockfish
GROQ_API_KEY=your_groq_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=your_voice_id
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend setup

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

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Supabase Schema

Run the following SQL in your Supabase SQL editor:

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

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own row" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own row" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own row" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can read own games" ON public.games FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own games" ON public.games FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 5. Audio files

Place the following `.mp3` files in `frontend/public/audio/`:

```
move-self.mp3   move-opponent.mp3   capture.mp3   move-check.mp3
castle.mp3      promote.mp3         illegal.mp3   premove.mp3
tenseconds.mp3  game-start.mp3      game-end.mp3  game-draw.mp3
notify.mp3
```

The chess.com sound pack is a popular source. Files are excluded from this repo for licensing reasons.

---

## Roadmap

- [ ] **Opening name detection** — live ECO code badge (e.g. "Sicilian Defense, Najdorf Variation") via `chess-openings` npm package
- [ ] **Per-persona music themes** — each agent gets a unique 3-track soundtrack (calm / hype / dramatic) with crossfading
- [ ] **Global leaderboard** — top-50 players by Elo, modal accessible from the coach panel
- [ ] **Segmented Elo by time control** — separate Bullet / Blitz / Rapid / Classical / Unlimited ratings per user
- [ ] **Take-back system** — request move undo in teach mode (opponent must accept)
- [ ] **Game history replay** — step through completed games move-by-move with Stockfish annotations
- [ ] **Friend leaderboard** — requires `friendships` table; deferred

---

## Contributing

Contributions, issues, and feature requests are welcome. Please open an issue first to discuss what you'd like to change. Pull requests should target the `main` branch and pass `npm run build` + `npx tsc --noEmit` before review.

---

## License

MIT © [Noah Russell](https://github.com/noaboa07)

---

<div align="center">
  <sub>Built with TypeScript, Python, and an unhealthy obsession with chess.</sub>
</div>
