# Agentic Chess Engine — Implementation Plan

## Current State (as of Phase 5 complete)

```
frontend/
  app/
    page.tsx                    ✅ Layout: PersonaPanel above board, CoachPanel beside
    components/
      ChessBoard.tsx            ✅ Engine move application, board reset on persona change, timeout cancel
      CoachPanel.tsx            ✅ Teach Mode toggle, Hint button, global mute, persona selector
      PersonaPanel.tsx          ✅ Active opponent avatar, name, Elo badge
      AtmosphereBackground.tsx  ✅ 3-track crossfade (calm/dramatic/hype), autoplay-safe start
    context/
      GameContext.tsx           ✅ Full game state, globalMuted, FRESH_GAME_STATE reset on persona change
backend/
  main.py                       ✅ /health, /api/game/new, /api/move, /api/tts
  personas/personas.py          ✅ 6-tier Noahverse ladder (200–2800 Elo)
  services/
    stockfish.py                ✅ CPL classification, opening exemption, skill-throttled engine reply
    coach.py                    ✅ should_coach gate (opening/blunder/hint), Groq Llama 3.3 70B
    tts.py                      ✅ ElevenLabs TTS
```

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

### Noahverse Ladder
| Persona | Elo | Skill Level |
|---------|-----|-------------|
| Clown Noah | 200 | 0 (depth=1) |
| Gym Bro Noah | 700 | 3 |
| Rat Main Noah | 1200 | 6 |
| 4.0 GPA Noah | 1700 | 11 |
| Devil Noah | 2200 | 16 |
| God Noah | 2800 | 20 |

---

## Architecture Overview

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
GameContext (accumulates move history in state — NO per-move Firestore writes)
       │
       ├──▶ CoachPanel (coach message + TTS)
       ├──▶ AtmosphereBackground (intensity → music/color)
       └──▶ On game end → single batch Firestore write
```

---

## Phase 6 — Supabase Auth & Data Persistence

**Goal:** Email/Password auth with username registration. Single batch Supabase insert on game end. RLS enforced at DB level.

### Folder Structure

```
frontend/
  lib/
    supabase.ts          # createClient + Database types
    auth.ts              # signUp, signIn, signOut helpers
    db.ts                # saveGame(), getUserProfile(), updateElo()
  app/
    context/
      AuthContext.tsx    # onAuthStateChange → exposes user, loading, signOut
    components/
      AuthModal.tsx      # Registration + Login modal (dark Tailwind)
```

### Supabase SQL Schema

```sql
-- users table
CREATE TABLE public.users (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username     TEXT NOT NULL UNIQUE,
  email        TEXT NOT NULL,
  current_elo  INTEGER NOT NULL DEFAULT 400,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- games table (moves stored as JSONB — no per-move writes)
CREATE TABLE public.games (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  opponent_id    TEXT NOT NULL,
  opponent_skill INTEGER NOT NULL,
  result         TEXT NOT NULL CHECK (result IN ('win','loss','draw','resigned')),
  moves          JSONB NOT NULL DEFAULT '[]',
  played_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "games_select_own" ON public.games FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "games_insert_own" ON public.games FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### npm Command

```bash
# from frontend/
npm install @supabase/supabase-js
```

### Auth Injection Plan

1. **`lib/supabase.ts`** — `createClient<Database>(url, anonKey)` with inline `Database` type for full `from()` type safety.

2. **`lib/auth.ts`** — Three helpers: `signUp(email, password, username)` creates auth user then inserts `public.users` row (username captured here, not from auth.users). `signIn(email, password)`. `signOut()`.

3. **`AuthContext.tsx`** — `getSession()` on mount + `onAuthStateChange` listener. While `loading`, renders a spinner. When `!user`, renders `<AuthModal />` fullscreen — game is fully gated. When `user` exists, renders children.

4. **`GameContext.tsx`** additions (Batch 2):
   - Add `moveLog: MoveRecord[]` accumulated in state — zero DB writes mid-game.
   - Backend needs to return `cpl` in `/api/move` response (minor addition).
   - Add `concludeGame(result)` action — single `supabase.from('games').insert()` + Elo update.
   - Add `resignGame()` → calls `concludeGame('resigned')`.

5. **`lib/db.ts`** — `saveGame(userId, payload)`: single insert to `games`. `updateElo(userId, newElo)`: single update to `users`. Both called together in `concludeGame`.

### Page-Level Auth Gate

```tsx
<AuthProvider>          {/* gates everything; renders AuthModal when !user */}
  <GameProvider>
    <AtmosphereBackground>
      <main>…</main>
    </AtmosphereBackground>
  </GameProvider>
</AuthProvider>
```

### Build Order

```
Batch 1: lib/supabase.ts → lib/auth.ts → AuthContext.tsx
Batch 2: AuthModal.tsx
Batch 3: GameContext moveLog + lib/db.ts + concludeGame() + ChessBoard wiring
```

---

## Phase 7 — Pattern Recognition & Long-Term Memory (Stretch)

**Goal:** AI references your historical blunders in coaching messages.

- Aggregate blunder patterns per user from Firestore game history
- On game start, fetch top 3 recurring CPL-spike positions
- Inject into system prompt: `"This user repeatedly blunders in the Sicilian at move 15"`
- Coach proactively warns before similar positions arise

---

## Environment Variables

### `backend/.env`
```
STOCKFISH_PATH=./stockfish/stockfish-windows-x86-64-avx2.exe
GROQ_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

### `frontend/.env.local`
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
