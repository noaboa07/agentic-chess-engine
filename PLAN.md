# Agentic Chess Engine — Implementation Plan

## Current State

```
frontend/
  app/
    page.tsx              ✅ Layout shell (dark bg, flex)
    components/
      ChessBoard.tsx      ✅ Drag-and-drop via react-chessboard + chess.js, FEN tracking
      CoachPanel.tsx      ✅ Health-check polling, connection indicator
backend/
  main.py                 ✅ /health + /api/board/validate (FEN → turn/check/checkmate)
  requirements.txt        ✅ fastapi, uvicorn, python-chess
```

**Nothing is wired together yet.** ChessBoard moves are validated locally (chess.js) but never sent to the backend. CoachPanel shows a green dot and nothing else.

---

## Architecture Overview

```
User Move (drag/drop)
       │
       ▼
ChessBoard.tsx  ──POST /api/move──▶  FastAPI
                                         │
                                    python-chess (validate + Stockfish eval)
                                         │
                                    LangChain + Claude (coaching text)
                                         │
                ◀── { stockfish_eval, best_move, coach_message } ──
       │
       ▼
CoachPanel.tsx (render coaching text + eval bar)
       │
       ▼
ElevenLabs TTS (stream audio of coach message)
       │
       ▼
Firebase (persist game + blunder log)
```

---

## Phase 1 — Move Pipeline (Backend ↔ Frontend)

**Goal:** Every legal move the user makes gets sent to the backend and returns Stockfish analysis.

### Backend

- [ ] Add `POST /api/move` endpoint
  - Accepts: `{ fen: string, move: string }` (move in UCI format, e.g. `e2e4`)
  - Validates move with `python-chess`
  - Runs Stockfish via `chess.engine.SimpleEngine` (bundled binary)
  - Returns:
    ```json
    {
      "fen_after": "...",
      "best_move": "d7d5",
      "evaluation": { "type": "cp", "value": -35 },
      "is_blunder": false,
      "classification": "good" // brilliant | good | inaccuracy | mistake | blunder
    }
    ```
- [ ] Download/bundle Stockfish binary into `backend/stockfish/`
- [ ] Add `python-dotenv` + `.env` for Stockfish path config
- [ ] Add `POST /api/game/start` — resets engine session, returns starting FEN

### Frontend

- [ ] In `ChessBoard.tsx`, after a successful `chess.move()`, `POST /api/move` with current FEN + move
- [ ] Handle the response: update board to `fen_after`, store eval + classification in state
- [ ] Pass `{ evaluation, classification, best_move }` up to parent or into shared context
- [ ] Show a loading state on the board while awaiting response

### Shared State

- [ ] Create `GameContext.tsx` (React Context)
  - Holds: `fen`, `evaluation`, `lastClassification`, `coachMessage`, `persona`
  - Wrap `page.tsx` in `<GameProvider>`

---

## Phase 2 — AI Coaching Layer

**Goal:** After each move, the backend calls Claude via LangChain and returns a coaching message.

### Backend

- [ ] Install: `langchain`, `langchain-anthropic`, `anthropic`
- [ ] Create `services/coach.py`
  - `get_coaching_message(fen, move, evaluation, classification, persona, history) -> str`
  - Uses LangChain `ChatAnthropic` with `claude-3-5-sonnet-20241022`
  - **Token optimization:** system prompt is cached via Anthropic prompt caching (`cache_control: ephemeral`). Only the delta (last move + eval) is sent as user turn — never the full PGN.
  - Persona is injected into the system prompt template (see Phase 4)
- [ ] Add `coach_message: str` to `/api/move` response
- [ ] Store `ANTHROPIC_API_KEY` in `backend/.env`

### Frontend

- [ ] `CoachPanel.tsx`: replace health-check placeholder with coach message display
  - Render `coachMessage` from `GameContext`
  - Markdown-safe text rendering
  - Smooth fade-in animation on new message

---

## Phase 3 — ElevenLabs TTS

**Goal:** Coach message is spoken aloud in a custom voice after each move.

### Backend

- [ ] Install: `elevenlabs` (official Python SDK)
- [ ] Create `services/tts.py`
  - `stream_audio(text, voice_id) -> bytes`
  - Returns MP3 bytes streamed from ElevenLabs
- [ ] Add `GET /api/tts?message=...` or return base64 audio in `/api/move` response
  - Prefer a separate `/api/tts` endpoint to keep move latency low (fire-and-forget from frontend)
- [ ] Store `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` in `backend/.env`

### Frontend

- [ ] After receiving `coachMessage`, fire `GET /api/tts?message=...`
- [ ] Play returned audio via `new Audio(url).play()` or Web Audio API
- [ ] Add a mute toggle in `CoachPanel.tsx`

---

## Phase 4 — Persona System

**Goal:** User can switch between coaching personas that change tone, style, and aggression.

### Personas (MVP)

| ID | Name | Tone |
|----|------|------|
| `default` | Grandmaster | Calm, analytical, Socratic |
| `devil_noah` | Devil Noah | Ruthless, trash-talking, brutally honest |
| `hype_man` | Hype Man | Overly enthusiastic, celebrates every move |
| `beginner_coach` | Coach Mike | Patient, simple language, encouraging |

### Backend

- [ ] Create `personas/` directory with a `personas.json` or `personas.py` defining each persona's system prompt template
- [ ] `/api/move` accepts optional `persona: string` field
- [ ] `coach.py` selects the correct system prompt by persona ID

### Frontend

- [ ] Add persona selector UI to `CoachPanel.tsx` (dropdown or icon buttons)
- [ ] Store active persona in `GameContext`
- [ ] Send persona ID with every `/api/move` request

---

## Phase 5 — Intensity / Atmosphere System

**Goal:** The UI and audio dynamically respond to the quality of play.

### Logic

- Track a rolling 3-move window of classifications in `GameContext`
- If 3 consecutive "brilliant" moves → **Hype mode**
- If 2+ blunders → **Tension mode**

### Frontend

- [ ] `useIntensity.ts` hook — computes current intensity level from move history
- [ ] Background music player (`/public/audio/`) — fade in/out based on intensity
  - Tracks: `calm.mp3`, `intense.mp3`, `triumph.mp3`
- [ ] Subtle CSS class swap on board container (`bg-neutral-900` → `bg-red-950` on tension)

---

## Phase 6 — Firebase Persistence

**Goal:** Store game history and blunder patterns per user for long-term coaching.

### Setup

- [ ] Create Firebase project, enable Firestore + Auth (Google sign-in)
- [ ] Add Firebase config to `frontend/.env.local`
- [ ] Install: `firebase` (frontend SDK)

### Data Model

```
users/{uid}/
  games/{gameId}/
    created_at: timestamp
    moves: [{ fen, move, classification, eval }]
    result: "win" | "loss" | "draw"
  blunder_patterns/
    {patternId}: { fen_prefix, count, last_seen }
```

### Frontend

- [ ] `AuthContext.tsx` — Google sign-in, expose `user`
- [ ] After each move, write to Firestore (non-blocking)
- [ ] On game end, write final result

### Backend (optional)

- [ ] Firebase Admin SDK for server-side pattern analysis (Phase 7+)

---

## Phase 7 — Pattern Recognition & Long-Term Memory (Stretch)

**Goal:** AI references your historical blunders in coaching messages.

- [ ] Cloud Function or cron job: aggregate blunder patterns per user
- [ ] On game start, fetch top 3 recurring patterns
- [ ] Inject into system prompt: `"This user repeatedly blunders in the Sicilian at move 15"`
- [ ] Claude can then proactively warn before similar positions arise

---

## File Targets by Phase

| Phase | New Files | Modified Files |
|-------|-----------|----------------|
| 1 | `backend/services/stockfish.py`, `GameContext.tsx` | `main.py`, `ChessBoard.tsx`, `CoachPanel.tsx` |
| 2 | `backend/services/coach.py` | `main.py`, `CoachPanel.tsx` |
| 3 | `backend/services/tts.py` | `main.py`, `CoachPanel.tsx` |
| 4 | `backend/personas/personas.py` | `coach.py`, `main.py`, `CoachPanel.tsx`, `GameContext.tsx` |
| 5 | `hooks/useIntensity.ts`, `public/audio/*` | `page.tsx`, `ChessBoard.tsx` |
| 6 | `lib/firebase.ts`, `AuthContext.tsx` | `page.tsx`, `GameContext.tsx` |
| 7 | `backend/services/memory.py` | `coach.py`, Firebase schema |

---

## Environment Variables

### `backend/.env`
```
STOCKFISH_PATH=./stockfish/stockfish-windows-x86-64.exe
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

### `frontend/.env.local`
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```

---

## Build Order (Recommended)

```
Phase 1 → Phase 2 → Phase 4 → Phase 3 → Phase 5 → Phase 6 → Phase 7
```

Rationale: Get the full move→analysis→coaching loop working first (1+2), add persona flavor (4), then layer on audio (3), atmosphere (5), and persistence (6+7). Each phase is independently shippable.
