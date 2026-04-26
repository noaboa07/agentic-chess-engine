<div align="center">

# ♟ The Noah Verse

**A next-generation AI chess training platform where every opponent is a fully autonomous agent — with a distinct personality, a calibrated Elo, real-time coaching, a campaign ladder, replay analysis, and personalized training.**

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

Beyond head-to-head play, the platform is a complete chess training system: a campaign progression ladder with tier groupings and pre-fight briefings, game history replay with move-by-move evaluation, a progress dashboard with CPL trends and weakness heatmaps, an auto-generated puzzle feed from your own blunders, a personalized training plan, and a 15-achievement badge system — all without leaving the app. A fully static `/demo` route lets recruiters explore the platform without signing in.

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

### 🗺 Campaign / Progression System

A linear unlock ladder lets you climb through all 13 personas with structured learning goals. Each persona is assigned a lesson focus:

| Persona | Lesson Focus |
|---|---|
| Roomba Noah | Moving pieces legally |
| Clown Noah | Basic captures |
| Tilted Noah | Opening principles |
| Sleep-Deprived Noah | Avoiding blunders |
| Gym Bro Noah | Tactics — forks & pins |
| Coffee Shop Noah | Pawn structure |
| Tech Bro Noah | Positional play |
| Rat Main Noah | Endgame fundamentals |
| Grandmaster Twitch Noah | Attack patterns |
| 4.0 GPA Noah | Strategic planning |
| Devil Noah | Complex combinations |
| Angel Noah | Defense & counterplay |
| God Noah | Full game mastery |

**Unlock logic:** Roomba Noah is always available. Win against a persona to unlock the next one. Progress is stored in Supabase (`campaign_progress` table, RLS-enforced) and persists across sessions. Campaign games auto-start in Teach Mode with no time control.

**Tier groupings:** The campaign ladder is divided into five named tiers — Beginner Chaos, Fundamentals, Tactical Arena, Positional Masters, and Final Bosses — with visual connector lines between cards that turn emerald as you clear each tier.

**Pre-fight briefing:** Clicking "Fight Boss" opens a `BossFightModal` showing the persona's lesson focus, a "Watch Out" tip, and the reward before you commit. "Start Fight" navigates directly to the game.

---

### 🏅 Achievement System

15 earnable badges across four tiers (Bronze → Silver → Gold → Platinum). Achievements are stored in Supabase (`user_achievements`, RLS-enforced) and unlock is idempotent — duplicate unlocks are silently ignored.

| ID | Title | Tier | Trigger |
|---|---|---|---|
| first_blood | First Blood | Bronze | Win your first game |
| no_mercy | No Mercy | Silver | Win with zero blunders |
| survivor | Survivor | Bronze | Win despite mistakes or blunders |
| blunder_breaker | Blunder Breaker | Silver | Win with zero blunders (mistakes OK) |
| endgame_cleaner | Endgame Cleaner | Silver | Win a game longer than 40 moves |
| comeback_king | Comeback King | Gold | Win from a position with eval ≤ −300 |
| time_survivor | Time Survivor | Gold | Win with less than 10 seconds remaining |
| puzzle_solver | Puzzle Solver | Bronze | Solve your first puzzle |
| tactic_finder | Tactic Finder | Silver | Solve 10 puzzles |
| boss_slayer | Boss Slayer | Silver | Win any campaign fight |
| ladder_climber | Ladder Climber | Gold | Complete 5 or more campaign bosses |
| god_slayer | God Slayer | Platinum | Beat God Noah |
| scholar | Scholar | Bronze | View any game replay |
| opening_student | Opening Student | Bronze | Open the Opening Explorer |
| coachable | Coachable | Silver | Request "Explain last move" 5 times |

When a new achievement is unlocked, an `AchievementToast` slides in from the bottom-right with the achievement icon, tier badge, title, and description ("how you earned it"). Each toast has a **tier-based glow** (`box-shadow`) — bronze amber, silver slate, gold yellow, platinum violet — plus CSS keyframe entry (`slideUpFadeIn`) and exit (`slideDownFadeOut`) animations. Clicking the toast navigates to `/profile` (with an exit animation before push). The dismiss `×` stops propagation. A progress bar drains over 4.2 seconds then auto-dismisses. `notify.mp3` plays on unlock (respects the achievementSoundEnabled setting). Guest users (null `userId`) are silently skipped.

The **Profile** page shows the full 5×3 achievement grid — earned badges are fully colored with tier label; locked badges are dimmed to 30% opacity.

---

### 🎮 Demo Mode

`/demo` is a fully static page requiring no authentication. It shows recruiters and first-time visitors four tabs of hardcoded sample data:

- **Dashboard** — stat cards, SVG Elo history chart, training recommendations
- **Weaknesses** — move quality breakdown bars and key weakness bullets
- **Puzzles** — two read-only board positions with revealed best moves
- **Replay** — interactive move list stepping through a sample game

An amber banner at the top explains the data is a demo and links to sign-in.

---

### 🎭 Per-Agent Strategy Profiles

Beyond Elo calibration, each agent has a `StrategyProfile` that governs *how* it plays, not just *how strong* it plays:

- **`blunder_chance`** — probability of picking a sub-optimal Stockfish MultiPV candidate
- **`endgame_skill`** — scaled blunder injection increase when piece count drops below 10
- **`time_pressure_multiplier`** — blunder chance amplifier when clock drops below 30 seconds
- **`tactic_depth`** — depth of MultiPV analysis used for candidate move selection

Two agents at similar Elo can play very differently: one might be solid positionally but collapse under time pressure; another might blunder in the endgame but find brilliant tactics in the middlegame.

---

### 🎙 AI Coaching & Teach Mode

Toggle **Teach Mode** before a game to activate the full coaching pipeline:

- **Real-time move classification** — every move scored as Brilliant / Great / Good / Inaccuracy / Mistake / Blunder via Stockfish centipawn loss (opening exemption: inaccuracies in moves 1–10 auto-upgraded to Good)
- **Natural-language commentary** — Groq-powered LLM generates coaching in the persona's voice after each significant move
- **Blunder pattern injection** — queries your last 20 games, detects recurring mistake patterns, and injects that context into the LLM system prompt so the coach addresses your *actual* weaknesses
- **Opening tip** — fires once per game (moves 5–12) when an ECO opening is identified
- **Voice synthesis** — coaching messages stream through ElevenLabs TTS with per-session mute control
- **Hint on demand** — request a natural-language explanation at any point
- **LRU response cache** — identical (context + persona) coaching responses are served from an in-memory cache, cutting repeat Groq calls to zero

---

### 🚨 Pre-Move Blunder Confirmation

In Teach Mode, before a move is submitted to the engine, the backend evaluates it via `/api/evaluate-premove`. If the centipawn loss exceeds 100 (a blunder threshold), a warning modal appears:

- Shows the CPL cost and the engine's recommended best move
- Two options: **Take it back** (restores the board) or **Play anyway**
- Only fires in Teach Mode — fast chess is uninterrupted

The board applies the move visually immediately for responsiveness, then either commits it or restores the previous FEN on cancel.

---

### 🤔 "Why Did the AI Play That?"

After every engine move in Teach Mode, a **"Why did AI play that?"** button appears in the coach panel. Clicking calls `/api/explain-opponent-move`, which generates a 2–3 sentence explanation of the engine's reasoning — in the persona's own voice. The response appears in an indigo callout panel and is gated: one explanation per AI move, re-enabled after the next engine reply.

---

### 🔍 "Explain Why Not"

In Teach Mode, **right-click any legal move dot** to ask the coach why that candidate is worse than the engine's best move. The backend computes the centipawn cost, then calls the LLM (if CPL > 30) to explain the specific tactical or strategic reason it falls short — in the persona's voice. Responses appear as a sky-blue callout in the coach panel.

---

### ⚖️ Move Debate Multi-Agent System

When your move is a significant error (CPL > 50), three internal agents debate the position using the top Stockfish MultiPV candidates:

| Agent | Focus |
|---|---|
| **Tactician** | Material gain, forcing sequences, immediate threats |
| **Positional** | Pawn structure, piece activity, long-term strategy |
| **Safety** | King safety, avoiding unnecessary exposure |

A **Final Arbiter** LLM call synthesizes the debate into a verdict. Only one Groq call is made per move; the agent arguments are generated deterministically from Stockfish data.

---

### 📼 Game History Replay

Every completed game is saved with a full `MoveRecord[]` (FEN, SAN, CPL, classification, best move, evaluation, coach message, debate transcript). From the **Profile** page, click **Replay** on any game to enter the replay viewer:

- Read-only chessboard steps through each position
- Vertical **evaluation bar** (pure SVG, no dependencies) shows white/black advantage
- Clickable move list with classification badges and CPL scores
- Auto-play mode steps through at 800ms per move
- Selected move shows the coach message and best move suggestion from that moment in the game

---

### 📊 Progress Dashboard

The **Dashboard** page aggregates your last 50 games and visualizes your improvement over time:

- **Elo history** — pure SVG line chart of rating across recent games
- **CPL trend** — average centipawn loss per game, last 10 games
- **Classification breakdown** — horizontal bar chart of Brilliant / Great / Good / Inaccuracy / Mistake / Blunder distribution
- **Win rate by persona** — table showing W/L/D for each opponent you've faced
- **Summary stat cards** — total games, win rate, avg CPL, blunders per game

No external chart library — all visualizations are hand-written SVG.

---

### 🎯 Personalized Training Plan

Below the dashboard stats, a deterministic algorithm generates 3–5 prioritized training recommendations based on your actual numbers:

| Condition | Recommendation |
|---|---|
| Avg CPL > 80 | Slow down — use 10+0 time control to reduce blunders |
| Blunders/game > 2 | Solve 5 puzzles before your next game |
| < 5 total games | Play more games to unlock personalized insights |
| All metrics healthy | Play the next campaign opponent |

No LLM call — pure deterministic logic on aggregated game data.

---

### 🧩 Puzzle Generator

After every game, blunders and mistakes (where a `bestMove` was recorded) are automatically extracted and saved to Supabase as puzzles. The **Puzzles** page presents them as an interactive training feed:

- Board shows the position just before your blunder
- Prompt: "Find the best move in this position"
- Drag-to-play: correct move → success animation; wrong move → shows the right answer
- Progress bar and prev/next navigation through your personal puzzle set
- Solved puzzles are marked and de-prioritized on next visit

Puzzle solving is entirely client-side — no API calls, pure UCI string comparison.

---

### 🔎 Opening Explorer

The ECO badge in the board header (e.g. `B20 · Sicilian Defense`) is a clickable button. Clicking opens the **Opening Explorer Modal**, which shows static reference data for 20 major openings:

- ECO code, full name, and main line moves
- **White's Plan** — the strategic idea for the first player
- **Black's Plan** — the counterplay strategy
- **Watch Out** — a common trap or pitfall specific to that opening

Entirely static — no API calls, no database reads.

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

Each category includes a trend indicator (improving / worsening / stable).

---

### 📈 Adaptive Difficulty

The `GameOverModal` analyzes your recent performance and surfaces suggestions automatically:

- **Upgrade suggestion** (indigo banner) — win streak vs. current persona detected
- **Downgrade suggestion** (amber banner) — early blunder rate trending up across recent games

---

### 🏆 Dynamic Elo & Multi-Mode Ratings

Ratings tracked across five independent time control pools: **Bullet · Blitz · Rapid · Classical · Unlimited**

Dynamic K-factor scaling: K=40 for new players (< 20 games), K=20 for established, K=10 for 2400+ Elo. Elo updates are a single atomic batch write on game conclusion — never mid-game. Each game row stores `player_elo_after` for accurate rating history.

A **global leaderboard** (top 50) is accessible from the coach panel during play.

---

### 🎵 Atmosphere & Per-Persona Music

| State | Trigger | Visual | Audio |
|---|---|---|---|
| Calm | Default | Neutral | `calm.mp3` |
| Hype | 3 consecutive Good / Great / Brilliant | Indigo glow | `hype.mp3` |
| Dramatic | 3 consecutive Inaccuracy / Mistake / Blunder | Red glow | `dramatic.mp3` |

Each persona has its own 3-track soundtrack. Tracks crossfade on state and persona changes. Missing persona tracks fall back to `/audio/default/{intensity}.mp3` automatically.

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

---

### 🔊 Sound Engine

A singleton `AudioManager` preloads 13 sound effects on mount. Check priority: check sound overrides capture sound when both apply.

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

### 🎓 Onboarding Tutorial

First-time visitors to `/play` see a 5-step spotlight tutorial explaining the persona system, Teach Mode, blunder protection, and the Dashboard. Stored in `localStorage` — never shown again after completion. Dismissable at any step.

---

### ⚙️ Settings & UX Preferences

A `lib/settings.ts` module provides a typed localStorage-backed settings store. The `AppSettings` interface covers nine fields:

| Setting | Type | Default | Effect |
|---|---|---|---|
| `showLegalMoves` | boolean | true | Toggle legal-move dot highlights on the board |
| `showArrows` | boolean | true | Toggle right-click candidate arrows on canvas |
| `autoQueenPromotion` | boolean | true | Skip promotion picker, always queen |
| `blunderConfirmMode` | `'off' \| 'blunders' \| 'mistakes'` | `'blunders'` | Pre-move warning threshold |
| `defaultTeachMode` | boolean | false | Pre-check Teach Mode in the lobby |
| `defaultTimeControlId` | string | `'untimed'` | Pre-select time control in the lobby |
| `confirmResign` | boolean | true | Confirm dialog before resign |
| `achievementSoundEnabled` | boolean | true | Play `notify.mp3` on achievement unlock |
| `reducedMotion` | boolean | false | Disable glow pulses and non-essential animations |

Exports: `getSettings()` (merge DEFAULTS with localStorage), `setSetting<K>()` (patch one key), `useSettings()` (reactive hook for the Settings page).

The **Settings page** (`/settings`) is divided into four sections:
- **Board & Visuals** — all four board behavior toggles + the board theme picker
- **Audio** — achievement sound toggle (in-game volume is controlled by the mute button in the coach panel)
- **Coaching** — default Teach Mode toggle + blunder confirmation radio group (`Off / Blunders only ≥ CPL 100 / Mistakes & Blunders ≥ CPL 40`)
- **Gameplay** — confirm-resign toggle + default time control pill selector + reset-all button

**Configurable blunder warning:** `'off'` skips the `/api/evaluate-premove` fetch entirely; `'blunders'` triggers at CPL ≥ 100 (original behavior); `'mistakes'` triggers at CPL ≥ 40.

**LobbyScreen defaults:** `teachMode` and `selectedTC` initialize from `getSettings()` so the lobby pre-selects whatever the user saved.

---

### 🗺 Campaign UX Polish

**Boss intro taunts:** The `BossFightModal` shows a per-persona italic taunt line below the Elo rating — e.g., *"There is no move you can make that I have not already calculated."* for God Noah. One line per persona, all 13 covered.

**Available-boss glow:** Unlocked, not-yet-beaten persona cards animate with `ring-1 ring-indigo-500/30 shadow-[0_0_16px_rgba(99,102,241,0.2)] animate-pulse` to draw the eye to the next target.

---

### 📼 Replay Enhancements

**Keyboard navigation:** `ArrowLeft` / `ArrowRight` step through moves; `Space` toggles auto-play. All wired via a `useEffect` keydown listener with `e.preventDefault()` on Space to suppress page scroll.

**Quick Review mode ("⚠ Mistakes"):** A toggle button filters the move list to mistakes and blunders only, shows a "Mistake X / Y" counter instead of "Move X / Y", and makes the Prev/Next buttons jump between filtered indices rather than stepping through every move.

---

### 🏁 GameOverModal Polish

Result icons prefix the headline: 🏆 win, 💀 loss, 🤝 draw, 🏳 resigned. Headline upgraded to `text-6xl font-black tracking-tighter`. Button stack is full-width. A "Review Game →" text link navigates to `/profile` (with exit animation) so the player can immediately step through their game.

---

### 🛡 Production Polish

- **Guest mode** — `/play` is accessible without an account. Guest games are fully functional; Elo and history are not persisted. An amber banner in the coach panel prompts sign-in.
- **Rate limiting** — `slowapi` middleware on the FastAPI backend: `/api/move` and `/api/evaluate-premove` at 60 req/min per IP; `/api/coach-report`, `/api/explain-move`, and `/api/explain-opponent-move` at 20 req/min per IP. Returns 429 with JSON error on breach. The frontend detects 429 on `/api/move`, `requestHint`, and `explainOpponentMove` and surfaces a dismissible `Toast` error instead of crashing.
- **Toast notifications** — a reusable `Toast` component (error / info / success) slides in from the bottom-center, auto-dismisses after 5 seconds, and is used for rate-limit errors and other transient messages.
- **Empty states** — a reusable `EmptyState` component (icon + title + body + CTA) replaces ad-hoc "no data" blocks on the Dashboard and Puzzles pages.
- **Resigned = loss** — profile stats and win-rate calculations treat `resigned` results as losses via an `isLoss()` helper, matching the semantic intent.
- **Global error boundary** — Next.js 14 `app/error.tsx` catches unhandled render errors and presents a recoverable "Try again" screen.
- **Opening recognition** — Live ECO detection using an embedded lookup. Badge updates after every move.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                              Browser                                  │
│                                                                       │
│  Next.js 14 App Router                                                │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Lobby   │ │ChessBoard │ │CoachPanel│ │Dashboard │ │Campaign  │  │
│  └──────────┘ └───────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐                             │
│  │  Puzzles │ │  Replay   │ │ Profile  │                             │
│  └──────────┘ └───────────┘ └──────────┘                             │
│                        │                                              │
│     GameContext + AchievementContext (React)                          │
│    move log · eval · classification · opening · debate                │
│    deferred game-over · adaptive suggestion · campaign state          │
│    15 achievements · rate-limit error · toast coordination            │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ HTTP REST (rate-limited via slowapi)
┌───────────────────────────▼──────────────────────────────────────────┐
│                        FastAPI (Python 3.11)                          │
│                                                                       │
│  POST /api/move               POST /api/coach-report                  │
│  POST /api/explain-move       POST /api/engine-first-move             │
│  POST /api/evaluate-premove   POST /api/explain-opponent-move         │
│  POST /api/elo/calculate      POST /api/tts                           │
│  GET  /api/telemetry                                                  │
│                                                                       │
│  ┌────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Stockfish  │  │  coach.py    │  │debate.py │  │  cache.py    │   │
│  │ (local)    │  │  (Groq LLM)  │  │(3-agent) │  │  (LRU 512)   │   │
│  │ MultiPV=3  │  │  LangChain   │  │1 Groq/mv │  │              │   │
│  └────────────┘  └──────────────┘  └──────────┘  └──────────────┘   │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
               ┌────────────▼────────────┐
               │         Supabase         │
               │  users · games           │
               │  campaign_progress       │
               │  puzzles                 │
               │  user_achievements       │
               │  RLS on all tables       │
               └──────────────────────────┘
```

### Key Design Decisions

**Deferred game-over pattern** — `concludeGame()` only sets a `gameOverPending` flag. `acknowledgeGameOver()` is the sole function that commits to Supabase and resets board state, preventing partial write races.

**No mid-game DB writes** — move history lives entirely in React state and is batch-inserted as a JSONB array on game conclusion. Eliminates per-move latency and prevents partial write corruption.

**Premove blunder check** — `onPieceDrop` returns `true` synchronously (board shows the move immediately). If the backend flags it as a blunder, a modal appears; on cancel, the board is restored to the pre-move FEN from a saved snapshot. This avoids any visual flicker while keeping the check genuinely asynchronous.

**applyEngineReply extraction** — shared `useCallback` handles the engine reply sequence identically whether invoked from the normal move flow or from blunder-confirm acceptance, eliminating code duplication.

**Puzzle generation on game end** — `acknowledgeGameOver` scans the completed `MoveRecord[]` for blunder/mistake entries with a recorded `bestMove`, then batch-inserts them as puzzles in a single Supabase call. No mid-game writes, no separate trigger.

**Stockfish tiered backend** — low-Elo agents use Python-level randomized move selection before Stockfish is consulted. Prevents the "all agents feel the same under 800 Elo" problem.

**Mate score capping** — `_score_to_cp()` caps mate scores at ±600 cp. Prevents astronomical CPL values that corrupt coaching quality metrics.

**LRU coaching cache** — identical (classification + evaluation + persona) tuples skip the Groq call entirely. Cache hits tracked in telemetry.

---

## Performance Benchmarks

Measured locally (Stockfish depth=15, Groq `llama-3.3-70b-versatile`):

| Service | p50 | p95 | Notes |
|---|---|---|---|
| Stockfish analysis | ~220 ms | ~480 ms | depth=15, MultiPV=3 |
| Groq coaching | ~450 ms | ~900 ms | gated: blunders / explicit request |
| Groq debate (arbiter) | ~380 ms | ~750 ms | gated: CPL > 50 only |
| Groq explain-opponent | ~400 ms | ~850 ms | gated: explicit button click |
| ElevenLabs TTS | ~650 ms | ~1,400 ms | gated: explicit user action |
| `/api/move` (no coaching) | ~250 ms | ~520 ms | Stockfish only |
| `/api/move` (with coaching) | ~720 ms | ~1,350 ms | Stockfish + Groq |
| Cache hit (coaching) | < 5 ms | < 10 ms | LRU, no Groq call |
| `/api/evaluate-premove` | ~230 ms | ~490 ms | Stockfish only, no LLM |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (App Router) |
| UI Language | TypeScript 5 + React 18 (hooks only) |
| Styling | Tailwind CSS |
| Chess Logic | `chess.js` v1 + `react-chessboard` |
| Backend Framework | FastAPI (Python 3.11+) |
| Chess Engine | Stockfish (local binary via `python-chess`) |
| LLM Orchestration | LangChain + Groq API (`llama-3.3-70b-versatile`) |
| Voice Synthesis | ElevenLabs API |
| Auth & Database | Supabase (PostgreSQL + Row Level Security) |
| Rate Limiting | slowapi (FastAPI middleware) |
| Audio | Web Audio API (singleton manager) |
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
-- Core tables
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
  player_elo_after INTEGER,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign progression
CREATE TABLE public.campaign_progress (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  persona_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('locked','available','complete')) DEFAULT 'locked',
  unlocked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, persona_id)
);

-- Puzzles generated from blunders
CREATE TABLE public.puzzles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  fen TEXT NOT NULL,
  correct_move TEXT NOT NULL,
  classification TEXT NOT NULL,
  move_number INTEGER NOT NULL,
  solved BOOLEAN NOT NULL DEFAULT FALSE,
  solved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puzzles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "games_select_own" ON public.games FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "games_insert_own" ON public.games FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "games_update_own" ON public.games FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users manage own campaign" ON public.campaign_progress
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own puzzles" ON public.puzzles
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Achievements
CREATE TABLE public.user_achievements (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  PRIMARY KEY (user_id, achievement_id)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own achievements" ON public.user_achievements
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed first campaign persona for all existing users
INSERT INTO public.campaign_progress (user_id, persona_id, status)
  SELECT id, 'roomba_noah', 'available' FROM public.users
  ON CONFLICT DO NOTHING;
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
audio/default/calm.mp3
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
npm test
```

Covers: Elo calculation logic mirroring `/api/elo/calculate`.

---

## Project Structure

```
agentic-chess-engine/
├── backend/
│   ├── main.py                        # All FastAPI routes + slowapi rate limiting
│   ├── personas/
│   │   └── personas.py                # 13-persona ladder + strategy profiles
│   ├── services/
│   │   ├── stockfish.py               # Engine reply, CPL analysis, mate cap
│   │   ├── coach.py                   # LLM coaching, report, explain-why-not, explain-opponent
│   │   ├── debate.py                  # 3-agent MultiPV debate
│   │   ├── tts.py                     # ElevenLabs TTS
│   │   ├── telemetry.py               # Latency ring buffer
│   │   └── cache.py                   # LRU coaching cache
│   └── tests/
│       ├── test_move_classification.py
│       ├── test_elo_math.py
│       └── test_agent_config.py
└── frontend/
    ├── app/
    │   ├── page.tsx                   # Landing page — hero, feature strip, CTAs, nav
    │   ├── error.tsx                  # Global error boundary
    │   ├── demo/page.tsx              # Static demo (no auth) — Dashboard/Weaknesses/Puzzles/Replay tabs
    │   ├── play/page.tsx              # Lobby ↔ game phase controller, campaign auto-start
    │   ├── campaign/page.tsx          # Tiered persona ladder, BossFightModal, unlock status
    │   ├── dashboard/page.tsx         # Stats, charts, training plan
    │   ├── puzzles/page.tsx           # Blunder puzzle feed
    │   ├── replay/[gameId]/page.tsx   # Move-by-move game replay viewer
    │   ├── profile/page.tsx           # Stats, bosses defeated, achievements grid, history
    │   ├── settings/page.tsx          # 4-section settings panel (Board & Visuals, Audio, Coaching, Gameplay)
    │   ├── shop/page.tsx              # Elo-gated theme gallery
    │   ├── components/
    │   │   ├── ChessBoard.tsx         # Board, arrows, premove blunder check, opening explorer, settings wiring
    │   │   ├── CoachPanel.tsx         # Coaching, eval, debate, explain, guest banner
    │   │   ├── AchievementToast.tsx   # Tier-glow slide-in toast; clickable → /profile; notify.mp3 SFX
    │   │   ├── BossFightModal.tsx     # Pre-fight briefing + per-persona intro taunt
    │   │   ├── BlunderConfirmModal.tsx # Pre-move blunder warning dialog
    │   │   ├── EmptyState.tsx         # Reusable empty-state with icon + CTA
    │   │   ├── Toast.tsx              # Dismissible error/info/success toast
    │   │   ├── EvalBar.tsx            # Vertical SVG evaluation bar
    │   │   ├── OnboardingOverlay.tsx  # First-visit 5-step tutorial
    │   │   ├── OpeningExplorerModal.tsx # Static opening reference modal
    │   │   ├── DebatePanel.tsx        # Collapsible 3-agent debate
    │   │   ├── LobbyScreen.tsx        # Persona cards, time controls
    │   │   ├── GameOverModal.tsx      # Result icons, polished hierarchy, Review Game → /profile
    │   │   ├── ChessClock.tsx         # Countdown with increment
    │   │   ├── WeaknessPanel.tsx      # Recurring mistake tracker
    │   │   ├── AtmosphereBackground.tsx # Crossfade music + vignette
    │   │   └── landing/
    │   │       ├── ChessBoardHero.tsx # Terminal-style engine output panel (hero right column)
    │   │       └── PersonaLadder.tsx  # 13-persona roster strip with avatars + Elo
    │   └── context/
    │       ├── GameContext.tsx        # Full game state + campaign + puzzles + rate-limit error
    │       ├── AuthContext.tsx        # Supabase auth gate
    │       └── AchievementContext.tsx # Achievement unlock + toast coordination
    └── lib/
        ├── achievements.ts            # 15 achievement definitions, TIER_COLORS, TIER_BG
        ├── settings.ts                # Typed settings module: AppSettings, getSettings, setSetting, useSettings
        ├── themes.ts                  # 10 board themes, localStorage
        ├── db.ts                      # All Supabase queries (RLS-enforced)
        ├── audio.ts                   # SFX singleton manager
        ├── openings.ts                # ECO lookup
        └── openings-explorer.ts       # Static opening reference data (20 openings)
```

---

## License

MIT © [Noah Russell](https://github.com/noaboa07)

---

<div align="center">
  <sub>Built with TypeScript, Python, and an unhealthy obsession with chess.</sub>
</div>
