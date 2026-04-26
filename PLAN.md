# Agentic Chess Engine — Implementation Plan

## Current State (as of Phase 15 complete)

```
frontend/
  app/
    layout.tsx                    ✅ Root layout: AuthProvider wraps ALL routes
    page.tsx                      ✅ Landing page (Server Component): Play/Settings/Shop links
    play/
      layout.tsx                  ✅ GameProvider > AtmosphereBackground
      page.tsx                    ✅ Phase controller (lobby ↔ game)
    settings/page.tsx             ✅ Stub
    shop/page.tsx                 ✅ Stub
    components/
      LobbyScreen.tsx             ✅ 13-persona cards, time control pills, teach mode toggle
      ChessBoard.tsx              ✅ Move dots, click-to-move, sound, flip, game-over detection
      CoachPanel.tsx              ✅ Mute, resign, hint, eval, leaderboard
      GameOverModal.tsx           ✅ Victory/Defeat/Draw/Resigned; Rematch/Change Opponent/Go Home
      ChessClock.tsx              ✅ Countdown, onTimeout, 10-sec warning
      PersonaPanel.tsx            ✅ Avatar, name, Elo badge
      AtmosphereBackground.tsx    ✅ 3-track crossfade (calm/dramatic/hype)
      LogoutButton.tsx            ✅ Fixed bottom-left on landing page
      LeaderboardModal.tsx        ✅ Top-50 by Elo
    context/
      AuthContext.tsx             ✅ Supabase onAuthStateChange, gates behind AuthModal
      GameContext.tsx             ✅ Full game state; gameOverPending → acknowledgeGameOver pattern
  lib/
    supabase.ts                   ✅ Supabase client
    auth.ts                       ✅ signUp, signIn, signOut
    db.ts                         ✅ saveGame, getUserElo, updateElo, getUserBlunderPatterns
    audio.ts                      ✅ Singleton audio manager; 13 SFX
backend/
  main.py                         ✅ /health, /api/game/new, /api/move, /api/tts, /api/engine-first-move
  personas/personas.py            ✅ 13-tier Noahverse ladder
  services/
    stockfish.py                  ✅ CPL classification; blended random+skill engine reply
    coach.py                      ✅ should_coach gate; blunder context injection
    tts.py                        ✅ ElevenLabs TTS
```

### 13-Persona Ladder
| ID | Name | Elo | Skill | Depth |
|----|------|-----|-------|-------|
| roomba_noah | Roomba Noah | 150 | 0 | 1 |
| clown_noah | Clown Noah | 300 | 0 | 1 |
| tilted_noah | Tilted Noah | 500 | 1 | 1 |
| sleep_deprived_noah | Sleep-Deprived Noah | 700 | 2 | 2 |
| gym_bro_noah | Gym Bro Noah | 900 | 3 | 3 |
| coffee_shop_noah | Coffee Shop Noah | 1100 | 5 | 5 |
| tech_bro_noah | Tech Bro Noah | 1300 | 7 | 7 |
| rat_main_noah | Rat Main Noah | 1500 | 9 | 9 |
| grandmaster_twitch_noah | Grandmaster Twitch Noah | 1700 | 11 | 10 |
| gpa_noah | 4.0 GPA Noah | 1900 | 13 | 12 |
| devil_noah | Devil Noah | 2100 | 15 | 14 |
| angel_noah | Angel Noah | 2300 | 17 | 16 |
| god_noah | God Noah | 2700 | 20 | 20 |

### Classification System (CPL-based)
| Label | CPL | Note |
|-------|-----|------|
| Brilliant | 0 + delta > 50cp | Tactical shot / sacrifice |
| Great | 0 | Exact engine top choice |
| Good | 1–40 | |
| Inaccuracy | 41–90 | Auto-upgraded to Good in moves 1–10 |
| Mistake | 91–200 | |
| Blunder | >200 | |

### Atmosphere State Machine
| State | Trigger | Glow | Audio |
|-------|---------|------|-------|
| Hype | 3 consecutive Good/Great/Brilliant | Indigo | hype.mp3 |
| Dramatic | 3 consecutive Inaccuracy/Mistake/Blunder | Red | dramatic.mp3 |
| Calm | Default | None | calm.mp3 |

### Supabase Schema
```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL UNIQUE, email TEXT NOT NULL,
  current_elo INTEGER NOT NULL DEFAULT 400, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE public.games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  opponent_id TEXT NOT NULL, opponent_skill INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win','loss','draw','resigned')),
  moves JSONB NOT NULL DEFAULT '[]', played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_control TEXT
);
-- RLS enabled on both tables
```

### Architecture
```
User Move (drag/drop)
       │
       ▼
ChessBoard.tsx ──POST /api/move──▶ FastAPI
                                       │
                                  python-chess + Stockfish (CPL eval + engine reply)
                                       │
                                  coach.py (gated LLM via Groq)
                                       │
               ◀── { engine_move, evaluation, classification, coach_message } ──
       │
       ▼
GameContext (move history in state — NO per-move DB writes)
       │
       ├──▶ CoachPanel (coach message + TTS)
       ├──▶ AtmosphereBackground (intensity → music/color)
       └──▶ acknowledgeGameOver() → single batch Supabase insert
```

### Key Gotchas
- **chess.js v1**: `move()` does NOT accept UCI strings — always use `uciToMove()` helper
- **Deferred game-over**: `concludeGame` only sets `gameOverPending` — never resets board. `acknowledgeGameOver` is the ONLY function that saves to DB and resets.
- **AuthProvider**: lives in root `app/layout.tsx`, NOT in `play/layout.tsx`
- **Phase routing**: lobby↔game is `useState` in `play/page.tsx`, not URL
- **Audio files**: Must be manually dropped into `public/audio/` — not committed to git
- **Mid-game DB writes**: Never write to Supabase during a game — batch insert on `acknowledgeGameOver` only

### Environment Variables
**`backend/.env`**: `STOCKFISH_PATH`, `GROQ_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
**`frontend/.env.local`**: `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Phase Status

| Phase | Feature | Status |
|-------|---------|--------|
| 1–5 | Core engine, personas, atmosphere, auth foundations | Done ✅ |
| 6 | Supabase Auth & Data Persistence | Done ✅ |
| 7 | Pattern Recognition & Long-Term Memory | Done ✅ |
| 8 | Color Randomization & Board Flip | Done ✅ |
| 9 | Timed Game Modes (ChessClock) | Done ✅ |
| 10 | Logout Flow | Done ✅ |
| 11 | App Architecture Redesign (landing → lobby → game) | Done ✅ |
| 12 | Sound Effects (13-SFX singleton audio manager) | Done ✅ |
| 13 | Game Over Modal (deferred gameOverPending pattern) | Done ✅ |
| 14 | Opening Name Detection (chess-openings ECO badge) | Done ✅ |
| 15 | Global Leaderboard (top-50 by Elo modal) | Done ✅ |
| 16 | **Per-Persona Music Themes** | Done ✅ |
| 17 | **Per-Persona Icons** | Done ✅ |
| 18 | **Shop — Chess Sets** | Done ✅ |
| 19 | **Customizable Profiles** | Done ✅ |
| 20 | **Settings Page** | Done ✅ |
| 21 | **Background Gradient** | Done ✅ |
| 22 | **Per-Agent Strategy Profiles** | Done ✅ |
| 23 | **Post-Game Coach Report** | Done ✅ |
| 24 | **Player Weakness Tracking Dashboard** | Done ✅ |
| 25 | **Move Debate Multi-Agent System** | Done ✅ |
| 26 | **"Explain Why Not" Feature** | Done ✅ |
| 27 | **Enhanced Opening Recognition** | Done ✅ |
| 28 | **Adaptive Difficulty** | Done ✅ |
| 29 | **Latency & Cost Observability** | Done ✅ |
| 30 | **Coaching Response Cache** | Done ✅ |
| 31 | **Test Suite** | Done ✅ |
| 32 | **Professional README Rewrite** | Done ✅ |

---

## Queued — Visual/Polish (Phases 16–21)

| Phase | Feature | Notes |
|-------|---------|-------|
| 16 | **Per-Persona Music Themes** | 3 tracks per persona in `/audio/{persona_id}/`; crossfade on persona switch |
| 17 | **Per-Persona Icons** | Replace placeholder SVGs in `public/avatars/` with custom per-persona art |
| 18 | **Shop — Chess Sets** | Board/piece skin system; skins purchasable/unlockable in `/shop` |
| 19 | **Customizable Profiles** | Username, avatar, profile page with stats/game history |
| 20 | **Settings Page** | Dark/light mode, board theme, volume, language; wires `/settings` stub |
| 21 | **Background Gradient** | Dynamic gradient behind board/lobby |

---

## New Feature Phases (22–32)

### Phase 22 — Per-Agent Strategy Profiles
**Goal:** Make agents play differently, not just talk differently.

**Files:**
- `backend/personas/personas.py` — Add `strategy` config dict to each persona entry
- `backend/services/stockfish.py` — Consume strategy profile in `_engine_reply()`

**Config shape:**
```python
strategy = {
    "openingBias": ["sicilian", "caro-kann"],  # ECO prefixes
    "riskTolerance": 0.75,
    "tradePreference": 0.25,
    "kingSafetyWeight": 0.6,
    "tacticDepth": 3,           # Stockfish MultiPV depth
    "blunderChance": 0.08,      # random sub-optimal move injection rate
    "endgameSkill": 0.45,       # skill throttle when piece count < 10
    "timePressureMultiplier": 1.4  # multiplies blunderChance when time < 30s
}
```

**Behavior:** `_engine_reply()` pulls top-N Stockfish candidates via `MultiPV`, picks sub-optimal candidate at rate `blunderChance * timePressureMultiplier` when applicable.

---

### Phase 23 — Post-Game Coach Report
**Goal:** Structured AI-generated report after every game; stored in Supabase for longitudinal tracking.

**New files:**
- `backend/services/coach.py` — `generate_coach_report(move_log, persona, result)` function
- `backend/main.py` — `POST /api/coach-report` endpoint
- `frontend/lib/db.ts` — `saveCoachReport(userId, gameId, report)` insert
- `frontend/app/components/CoachReportModal.tsx` — Modal shown after GameOverModal closes

**Report fields:** Game Summary | Opening Played | 3 Critical Mistakes | Best Move Missed | Recurring Weakness | Tactical Theme | Recommended Practice | Estimated Performance Rating

**New Supabase table:**
```sql
CREATE TABLE public.coach_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  report JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS: select/insert own rows only
```

---

### Phase 24 — Player Weakness Tracking Dashboard
**Goal:** Classify blunders into categories; show a personalized weakness widget.

**Categories:** Hanging pieces | Missed tactics | Opening mistakes | Poor king safety | Endgame technique | Bad trades | Time pressure blunders | Repeated queen moves | Missed checkmates

**New files:**
- `backend/services/weakness_classifier.py` — Heuristic classifier per blunder move
- `backend/main.py` — `POST /api/weaknesses` endpoint
- `frontend/lib/db.ts` — `getUserWeaknessProfile(userId)` query
- `frontend/app/components/WeaknessPanel.tsx` — Dashboard widget in CoachPanel or profile page

**Widget output per category:**
```
Your top weakness: Hanging pieces
Seen in: 7 of last 20 games  |  Trend: Improving
Recommended practice: Tactics + undefended pieces
```

---

### Phase 25 — Move Debate Multi-Agent System
**Goal:** Pre-move internal 3-agent debate; displayed in CoachPanel as "agent reasoning."

**Agents:** Tactician (material gain) | Positional (structure/center) | Safety (king exposure) | Final Arbiter

**New files:**
- `backend/services/debate.py` — Pulls top-3 Stockfish `MultiPV` lines; assigns heuristically to sub-agents; formats transcript
- `backend/main.py` — `debate_transcript` field in `/api/move` response
- `frontend/app/components/DebatePanel.tsx` — Collapsible section in CoachPanel

**Token gate:** Only trigger when CPL > 50. Groq called once max (Final Arbiter summary only) — rest is deterministic.

---

### Phase 26 — "Explain Why Not" Feature
**Goal:** User right-clicks a candidate move square; backend explains why it's worse than best move.

**New files:**
- `backend/main.py` — `POST /api/explain-move` — accepts `{ fen, candidate_move, best_move }`
- `backend/services/coach.py` — `explain_why_not(fen, candidate_move, best_move, cpl)` function
- `frontend/app/components/ChessBoard.tsx` — Right-click on highlighted move dot triggers request
- `frontend/app/components/CoachPanel.tsx` — Renders explain-why-not response in a distinct callout

**Token gate:** Only call Groq when candidate CPL > 30.

---

### Phase 27 — Enhanced Opening Recognition
**Goal:** Upgrade Phase 14 ECO badge to show variation name + one-time contextual coach tip.

**Current:** Live `chess-openings` badge shows opening name.

**Enhancements:**
- `frontend/app/components/ChessBoard.tsx` — Expand badge to show variation (e.g., "Sicilian — Najdorf Variation")
- `backend/services/coach.py` — `on_opening_identified(opening_name, player_color)` for contextual tip
- Tip fires once per game at move 5–10 ECO solidification, gated by `teachMode`
- Flows through existing `/api/move` response — no new endpoint needed

---

### Phase 28 — Adaptive Difficulty
**Goal:** System suggests persona tier adjustments based on win/loss trend.

**Logic:**
- Win 3 in a row vs current persona → suggest next tier persona
- Blunder ≥ 3 times in first 10 moves across 2 consecutive games → suggest stepping down
- Elo rising ≥ 50 in last 5 games → introduce harder openings via strategy profile

**Files (frontend only):**
- `frontend/lib/db.ts` — `getRecentResults(userId, n)` query
- `frontend/app/context/GameContext.tsx` — `adaptiveSuggestion` state, computed in `acknowledgeGameOver`
- `frontend/app/components/GameOverModal.tsx` — Adaptive suggestion banner

---

### Phase 29 — Latency & Cost Observability
**Goal:** Per-service latency logging + dev dashboard; produces benchmark data for README.

**New files:**
- `backend/services/telemetry.py` — `record_latency(service, ms)`, `record_cost(service, tokens)`, `record_error(service, msg)`, `record_cache_hit(service)`; in-memory ring buffer (last 1000 entries)
- `backend/main.py` — `time.perf_counter()` spans around all service calls; `GET /api/telemetry` endpoint
- `frontend/app/dev/page.tsx` — Dev dashboard gated by `NEXT_PUBLIC_DEV_MODE=true`; polls `/api/telemetry` every 5s

**Metrics:** p50/p95/p99 latency | error rate | cache hit rate | estimated cost per 1000 requests

---

### Phase 30 — Coaching Response Cache
**Goal:** LRU cache for identical (FEN + move + persona) coaching responses.

**Cache key:** `sha256(fen + "|" + move + "|" + persona_id)`

**New files:**
- `backend/services/cache.py` — `LRUCache(maxsize=512)`; `get(key)` / `set(key, value)` / `stats()`
- `backend/services/coach.py` — Wrap `get_coach_message()` with cache lookup; log hit/miss to telemetry
- `backend/main.py` — Include `cache_hit: bool` in `/api/move` response

**Note:** In-memory only (no Redis). Cache resets on server restart — acceptable for demo/portfolio.

---

### Phase 31 — Test Suite
**Goal:** Meaningful coverage that signals production readiness.

**Backend (`backend/tests/`):**
- `test_legal_moves.py` — Legal move validation via python-chess
- `test_elo_math.py` — Elo update math (win/loss/draw/resigned cases)
- `test_game_conclusion.py` — Checkmate, stalemate, resignation flows
- `test_move_classification.py` — CPL boundary conditions
- `test_agent_config.py` — All 13 persona strategy profiles load with valid fields
- `test_no_mid_game_db_writes.py` — `/api/move` never triggers DB write (mock Supabase)
- `test_coach_cache.py` — Cache hit/miss behavior

**Frontend (`frontend/__tests__/`):**
- `elo-update.test.ts` — Elo math unit test
- `supabase-payload.test.ts` — `saveGame()` payload matches DB schema

**Framework:** pytest + pytest-asyncio (backend), Jest (frontend).

---

### Phase 32 — Professional README Rewrite
**Goal:** Portfolio-quality README reflecting full feature set and engineering decisions.

**Sections:**
1. Project overview + live demo link
2. Feature highlights (screenshots/GIFs)
3. Architecture diagram (Mermaid or ASCII)
4. 13-persona ladder table
5. Stack & dependencies
6. Local setup (backend + frontend + env vars)
7. Benchmark table (latencies from Phase 29 telemetry)
8. Roadmap
9. License

**Trigger:** Only after all Phases 22–31 are shipped and verified.

---

## Recommended Implementation Order

**Tier 1 — Backend-only, high impact:**
22 (strategy profiles) → 23 (coach report) → 24 (weakness tracking) → 29 (observability) → 30 (cache)

**Tier 2 — New UI + interactivity:**
25 (move debate) → 26 (explain why not) → 27 (enhanced openings) → 28 (adaptive difficulty)

**Tier 3 — Polish + infrastructure:**
31 (tests) → 16–21 (visual polish) → 32 (README)

---

## Verification Checklist (per phase)
- [ ] `npx tsc --noEmit` passes
- [ ] `pytest` passes
- [ ] `npm run build` succeeds
- [ ] No mid-game DB writes introduced
- [ ] All new Supabase tables have RLS enabled
- [ ] LLM/TTS calls remain gated behind thresholds

---

## Critical Files Reference

| File | Role |
|------|------|
| `backend/personas/personas.py` | Persona definitions + strategy profiles (Phase 22) |
| `backend/services/stockfish.py` | Engine reply; strategy consumption |
| `backend/services/coach.py` | LLM coaching, explain-why-not, opening tips, cache wrap |
| `backend/services/debate.py` | Move debate — NEW Phase 25 |
| `backend/services/weakness_classifier.py` | Blunder categorization — NEW Phase 24 |
| `backend/services/telemetry.py` | Latency/cost observability — NEW Phase 29 |
| `backend/services/cache.py` | LRU coaching cache — NEW Phase 30 |
| `backend/main.py` | All FastAPI routes |
| `frontend/lib/db.ts` | saveGame, updateElo, weakness profile, coach reports |
| `frontend/app/context/GameContext.tsx` | Game state; adaptive difficulty logic |
| `frontend/app/components/GameOverModal.tsx` | Adaptive suggestion banner |
| `frontend/app/components/CoachPanel.tsx` | DebatePanel, explain-why-not display |
| `frontend/app/components/ChessBoard.tsx` | Right-click explain trigger |
| `frontend/app/components/CoachReportModal.tsx` | Post-game report — NEW Phase 23 |
| `frontend/app/components/WeaknessPanel.tsx` | Weakness dashboard widget — NEW Phase 24 |
| `frontend/app/dev/page.tsx` | Telemetry dashboard — NEW Phase 29 |
