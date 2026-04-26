# The Noah Verse — Project Plan

## Status: All phases complete. No remaining work as of 2026-04-26.

---

## Architecture

```
Browser (Next.js 14 App Router)
  └── AuthContext · AchievementContext · GameContext
      └── HTTP REST → FastAPI (Python 3.11)
          ├── Stockfish (local) · Groq LLM · ElevenLabs TTS
          └── Supabase (PostgreSQL + RLS)
               users · games · campaign_progress · user_achievements
```

---

## Completed Phases

### Phase 1 — Core Engine & Persona System
- FastAPI backend with all routes: `/api/move`, `/api/coach-report`, `/api/explain-move`, `/api/engine-first-move`, `/api/evaluate-premove`, `/api/explain-opponent-move`, `/api/elo/calculate`, `/api/tts`, `/api/telemetry`
- 13-persona ladder with calibrated Elo (150–2700) and `StrategyProfile` per persona (`blunder_chance`, `endgame_skill`, `time_pressure_multiplier`, `tactic_depth`)
- Stockfish MultiPV=3, depth=15; mate score capped at ±600 cp; 100% random ≤600 Elo, blended 601–1319, UCI_LimitStrength 1320+

### Phase 2 — Game Context & Board
- `GameContext.tsx`: full game state, campaign state, puzzles, rate-limit error, adaptive suggestion
- `ChessBoard.tsx`: board, canvas arrows (right-click drag), premove blunder check with `BlunderConfirmModal`, opening badge, take-back, flip board, engine reply with 400ms delay
- `ChessClock.tsx`: countdown with increment, per-color start/stop

### Phase 3 — Coaching Pipeline
- `CoachPanel.tsx`: move classification display, LLM coaching messages, debate panel, "Explain last move" / "Why did AI play that?" / "Explain Why Not" (right-click legal dot), guest banner, mute toggle
- LRU coaching cache (512 entries) — identical context tuples skip Groq call
- LangChain + Groq `llama-3.3-70b-versatile`; ElevenLabs TTS streaming

### Phase 4 — Campaign & Authentication
- `AuthContext.tsx`: Supabase auth gate, `AuthModal` when unauthenticated, user session
- `campaign/page.tsx`: 5-tier boss ladder, `BossFightModal` with per-persona italic taunts + lesson/watch-out/reward, unlock logic via `campaign_progress` table (RLS)
- Campaign games auto-start in Teach Mode with no time control

### Phase 5 — Replay, Dashboard, Puzzles
- `replay/[gameId]/page.tsx`: read-only board, SVG eval bar, clickable move list, auto-play, coach message per move; ←/→/Space keyboard nav; "⚠ Mistakes" toggle (filtered list, Prev/Next jumping)
- `dashboard/page.tsx`: pure SVG charts — Elo history, CPL trend, classification breakdown, win rate by persona; deterministic training plan
- `puzzles/page.tsx`: blunder feed auto-generated from game blunders; client-side UCI comparison

### Phase 6 — Achievements, Profile, Demo
- 15 achievements (Bronze → Platinum), `user_achievements` Supabase table (RLS), `AchievementContext` with queue, `unlockAchievement()` idempotent upsert
- `profile/page.tsx`: stat cards, boss progress bar, 5×3 achievement grid (dimmed locked), game history with Replay links
- `demo/page.tsx`: 4-tab static page (Dashboard, Weaknesses, Puzzles, Replay) — no auth required

### Phase 7 — Production Polish & Infrastructure
- Rate limiting via `slowapi`: 60 req/min (move routes), 20 req/min (LLM routes); 429 surfaced as dismissible `Toast`
- `Toast.tsx`: reusable error/info/success toast, slide-in from bottom-center, 5s auto-dismiss
- `EmptyState.tsx`: reusable empty state with icon + title + body + CTA
- `OnboardingOverlay.tsx`: 5-step spotlight tutorial, localStorage flag, dismissable
- `error.tsx`: global Next.js error boundary with "Try again" recovery
- Guest mode: full game functionality without account; Elo/history not persisted; amber coach panel banner
- Adaptive difficulty: win-streak → upgrade suggestion; blunder-rate → downgrade suggestion in `GameOverModal`

### Phase 8 — Atmosphere & Themes
- `AtmosphereBackground.tsx`: per-persona music (calm/hype/dramatic), crossfade on state/persona change, fallback to `/audio/default/`
- Board intensity glow: neutral (calm), indigo (hype), red (dramatic)
- 10 board color themes, Elo-gated, `Shop` page, localStorage persistence
- Dynamic Elo: 5 time-control pools, K-factor scaling (40/20/10), stored in `player_elo_after` per game row
- Leaderboard (top 50) accessible from coach panel

### Phase 9 — Settings & UX Preferences
- `lib/settings.ts`: `AppSettings` interface (9 fields), `getSettings()`, `setSetting<K>()`, `useSettings()` hook, localStorage-backed with DEFAULTS merge
- `ChessBoard` wired: `showLegalMoves` (dot suppression), `showArrows` (canvas + right-click gate), `blunderConfirmMode` (`'off'` skips fetch, `'mistakes'` threshold 40cp, `'blunders'` threshold 100cp)
- `LobbyScreen`: `teachMode` + `selectedTC` initialize from `getSettings()`

### Phase 10 — Premium Polish Sprint
- `AchievementToast`: tier-based `box-shadow` glow, CSS keyframe entry/exit animations, entire toast navigates to `/profile` on click, `notify.mp3` SFX, "Tap to view all achievements →" hover hint
- `BossFightModal`: per-persona italic intro taunt (all 13 personas)
- `GameOverModal`: result icons (🏆/💀/🤝/🏳), `text-6xl font-black` headline, full-width buttons, "Review Game →" navigates to `/profile`
- Campaign available-boss cards: indigo ring pulse animation
- `globals.css`: `slideUpFadeIn`/`slideDownFadeOut` keyframes

### Phase 11 — Landing Page & Global Settings
- Fonts: `Fraunces` (serif) + `JetBrains Mono` added via `next/font/google`; CSS vars `--font-serif`, `--font-mono` on `<html>`
- Tailwind: color token system — `board.*`, `ink.*`, `gold #E8B931`, `chess-win/loss/warn`; `fontFamily.serif` + `fontFamily.mono`
- `app/page.tsx`: full server-component landing page — sticky nav, 60/40 hero split, persona ladder, 4-feature editorial rows, architecture block, footer
- `components/landing/LandingNav.tsx`: wordmark, Demo/Profile/GitHub links, Log Out, Play → dropdown (Campaign + Free Play)
- `components/landing/ChessBoardHero.tsx`: terminal-style engine output panel
- `components/landing/PersonaLadder.tsx`: 13-persona roster, desktop grid + mobile horizontal scroll
- `components/GlobalSettingsButton.tsx`: fixed gear icon `bottom-6 left-6 z-[185]` on every page; settings modal `z-[190]` with all 4 sections (Board & Visuals, Audio, Coaching, Gameplay); Escape + backdrop close; body scroll lock; reset button

---

## Key Design Invariants

- **No mid-game DB writes** — move history in React state; single batch JSONB insert via `acknowledgeGameOver()` only
- **Deferred game-over** — `concludeGame()` sets flag only; `acknowledgeGameOver()` is the sole DB commit point
- **RLS everywhere** — all Supabase queries use authenticated `uid`; no admin bypass on frontend
- **LLM gating** — Groq fires on CPL thresholds, explicit user action, or significant events; never per-move
- **Gold accent only** — `#E8B931` used exclusively for primary CTAs, stat numerals, hover accents; no indigo/violet on public-facing UI
- **chess.js v1** — `move()` does NOT accept UCI strings; use `uciToMove()` helper
- **Scroll pattern** — `body { overflow: hidden }` in globals.css; each page uses `h-full overflow-y-auto` on its outer div
- **Z-index hierarchy** — achievement toasts `z-[200]`, settings modal `z-[190]`, gear button `z-[185]`

---

## Verification Checklist

- `npx tsc --noEmit` — zero errors ✓
- `pytest tests/ -v` — CPL classification, Elo math, persona invariants ✓
- `npm test` — Elo calculation mirroring backend ✓
- Landing page: serif headline (Fraunces), mono eyebrows (JetBrains Mono), gold CTAs only, all 13 persona cards visible ✓
- Achievement toast: tier glow, slide-in/out animation, notify.mp3, click → /profile ✓
- Settings: all 9 toggles persist across page reload; blunderConfirmMode 'off' skips fetch ✓
- Replay: arrow keys navigate, Space toggles play, Mistakes toggle filters list ✓
