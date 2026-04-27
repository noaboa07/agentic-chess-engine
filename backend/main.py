import base64
import json as _json
import threading
import time
from collections import defaultdict
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
import chess
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from services.stockfish import analyze_move, get_engine_first_move
from services.coach import get_coaching_message, generate_coach_report, on_opening_identified, explain_why_not
from services.debate import get_debate_transcript, reset_debate_counter
from services.tts import generate_speech
from services.telemetry import record_latency, record_error, get_stats
from services.cache import cache_stats
from personas.personas import get_persona

load_dotenv()


# ── Rate limiting ─────────────────────────────────────────────────────────────

def _get_jwt_user_id(request: Request) -> str:
    """Extract Supabase user ID from JWT for per-user rate limiting.
    Decodes payload without signature verification — safe for rate limiting only.
    Falls back to IP address if JWT is absent or malformed."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return get_remote_address(request)
    try:
        payload_b64 = auth[7:].split(".")[1]
        payload_b64 += "=" * (4 - len(payload_b64) % 4)
        payload = _json.loads(base64.urlsafe_b64decode(payload_b64))
        user_id = payload.get("sub")
        return user_id if user_id else get_remote_address(request)
    except Exception:
        return get_remote_address(request)


# IP-based limiter (existing — coarse protection)
limiter = Limiter(key_func=get_remote_address)

# Per-user sliding-window rate limiter (Layer 2 — identity-bound LLM protection)
_user_buckets: dict[str, list[float]] = defaultdict(list)
_bucket_lock = threading.Lock()


def _check_user_limit(user_id: str, limit: int, window_secs: int = 60) -> tuple[bool, int]:
    """Sliding window check. Returns (is_allowed, retry_after_seconds)."""
    now = time.time()
    with _bucket_lock:
        history = [t for t in _user_buckets[user_id] if now - t < window_secs]
        if len(history) >= limit:
            oldest = min(history)
            retry_after = max(1, int(window_secs - (now - oldest)) + 1)
            _user_buckets[user_id] = history
            return False, retry_after
        history.append(now)
        _user_buckets[user_id] = history
        return True, 0


def _rate_limited_response(retry_after: int) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit",
            "message": "Too many requests — slow down",
            "retry_after_seconds": retry_after,
        },
        headers={"Retry-After": str(retry_after)},
    )


async def _custom_rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return _rate_limited_response(60)


app = FastAPI(title="Agentic Chess Engine API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _custom_rate_limit_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class NewGameRequest(BaseModel):
    persona: str = "default"
    player_color: str = "white"


class MoveRequest(BaseModel):
    fen: str
    move: str
    persona: str = "default"
    move_number: int = 1
    teach_mode: bool = False
    hint_requested: bool = False
    blunder_context: str | None = None
    time_remaining_secs: float | None = None
    opening_name: str | None = None


class EngineFirstMoveRequest(BaseModel):
    fen: str
    persona: str = "clown_noah"
    time_remaining_secs: float | None = None


class CoachReportRequest(BaseModel):
    move_log: list[dict]
    persona_id: str
    result: str  # win | loss | draw | resigned
    opening_name: str | None = None
    player_color: str = "white"


class ExplainMoveRequest(BaseModel):
    fen: str
    candidate_move: str
    persona: str = "default"


class TtsRequest(BaseModel):
    text: str


class EvaluatePreMoveRequest(BaseModel):
    fen: str
    move: str


class ExplainOpponentMoveRequest(BaseModel):
    fen_before: str
    engine_move: str
    persona_id: str
    player_color: str = "white"


class EloCalculateRequest(BaseModel):
    player_elo: int
    opponent_elo: int
    result: str  # "win" | "loss" | "draw" | "resigned"
    games_played: int


class EloCalculateResponse(BaseModel):
    new_elo: int
    delta: int
    k_factor: int


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "agentic-chess-engine"}


@app.post("/api/game/new")
def new_game(req: NewGameRequest) -> dict:
    persona = get_persona(req.persona)
    return {
        "fen": chess.Board().fen(),
        "persona": {
            "id": persona.id,
            "name": persona.name,
            "description": persona.description,
            "elo": persona.elo,
        },
        "player_color": req.player_color,
    }


@app.post("/api/move")
@limiter.limit("60/minute")
def process_move(request: Request, req: MoveRequest):
    user_id = _get_jwt_user_id(request)
    allowed, retry_after = _check_user_limit(user_id, limit=30, window_secs=60)
    if not allowed:
        return _rate_limited_response(retry_after)

    try:
        persona = get_persona(req.persona)

        sf_t0 = time.perf_counter()
        result = analyze_move(
            req.fen, req.move,
            skill_level=persona.skill_level,
            play_depth=persona.play_depth,
            target_elo=persona.elo,
            strategy=persona.strategy,
            time_remaining_secs=req.time_remaining_secs,
        )
        record_latency("stockfish", (time.perf_counter() - sf_t0) * 1000)

        coach_message = None
        coach_cache_hit = False
        if req.opening_name and req.teach_mode and 5 <= req.move_number <= 12:
            try:
                coach_message = on_opening_identified(req.opening_name, req.persona)
            except Exception:
                coach_message = None
        elif req.teach_mode or req.hint_requested:
            try:
                coach_message = get_coaching_message(
                    move_uci=req.move,
                    evaluation=result.evaluation,
                    classification=result.classification,
                    best_move=result.best_move,
                    move_number=req.move_number,
                    hint_requested=req.hint_requested,
                    persona_id=req.persona,
                    blunder_context=req.blunder_context,
                )
                stats = cache_stats()
                coach_cache_hit = stats.get("hits", 0) > 0
            except Exception:
                coach_message = None

        cpl = max(0, -result.eval_delta)
        debate_transcript = None
        debate_skipped = False
        try:
            debate_transcript, debate_skipped = get_debate_transcript(
                result.top_lines, cpl, req.persona, session_key=user_id,
            )
        except Exception:
            debate_transcript = None

        return {
            "fen_after": result.fen_after,
            "best_move": result.best_move,
            "engine_move": result.engine_move,
            "evaluation": result.evaluation,
            "eval_delta": result.eval_delta,
            "is_blunder": result.is_blunder,
            "classification": result.classification,
            "coach_message": coach_message,
            "coach_cache_hit": coach_cache_hit,
            "debate_transcript": debate_transcript,
            "debate_skipped": debate_skipped,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/engine-first-move")
def engine_first_move(request: Request, req: EngineFirstMoveRequest) -> dict:
    # Reset per-user debate counter when a new game starts
    reset_debate_counter(_get_jwt_user_id(request))
    try:
        persona = get_persona(req.persona)
        move = get_engine_first_move(
            req.fen, persona.elo,
            strategy=persona.strategy,
            time_remaining_secs=req.time_remaining_secs,
        )
        return {"engine_move": move}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/elo/calculate", response_model=EloCalculateResponse)
def calculate_elo(req: EloCalculateRequest) -> EloCalculateResponse:
    if req.games_played < 20:
        k = 40
    elif req.player_elo >= 2400:
        k = 10
    else:
        k = 20

    expected = 1.0 / (1.0 + 10.0 ** ((req.opponent_elo - req.player_elo) / 400.0))
    score = {"win": 1.0, "loss": 0.0, "draw": 0.5, "resigned": 0.0}.get(req.result, 0.0)

    raw_delta = round(k * (score - expected))
    new_elo = max(100, req.player_elo + raw_delta)
    return EloCalculateResponse(new_elo=new_elo, delta=new_elo - req.player_elo, k_factor=k)


@app.get("/api/telemetry")
def telemetry() -> dict:
    return {**get_stats(), "coach_cache": cache_stats()}


@app.post("/api/coach-report")
@limiter.limit("20/minute")
def coach_report(request: Request, req: CoachReportRequest):
    user_id = _get_jwt_user_id(request)
    allowed, retry_after = _check_user_limit(user_id, limit=3, window_secs=60)
    if not allowed:
        return _rate_limited_response(retry_after)
    try:
        if len(req.move_log) < 3:
            raise HTTPException(status_code=400, detail="Game too short for report")
        report = generate_coach_report(
            req.move_log,
            req.persona_id,
            req.result,
            opening_name=req.opening_name,
            player_color=req.player_color,
        )
        return report
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/explain-move")
@limiter.limit("20/minute")
def explain_move_endpoint(request: Request, req: ExplainMoveRequest):
    user_id = _get_jwt_user_id(request)
    allowed, retry_after = _check_user_limit(user_id, limit=10, window_secs=60)
    if not allowed:
        return _rate_limited_response(retry_after)
    try:
        from services.stockfish import STOCKFISH_PATH, DEPTH, _score_to_cp
        import chess.engine as _ce

        board = chess.Board(req.fen)
        candidate = chess.Move.from_uci(req.candidate_move)
        if candidate not in board.legal_moves:
            raise HTTPException(status_code=400, detail="Illegal move")

        moving_color = board.turn

        with _ce.SimpleEngine.popen_uci(STOCKFISH_PATH) as engine:
            info_before = engine.analyse(board, _ce.Limit(depth=DEPTH))
            cp_before = _score_to_cp(info_before["score"])
            pv = info_before.get("pv") or []
            best_move = pv[0].uci() if pv else req.candidate_move

            board.push(candidate)
            info_after = engine.analyse(board, _ce.Limit(depth=DEPTH))
            cp_after = _score_to_cp(info_after["score"])

        delta = (cp_after - cp_before) if moving_color == chess.WHITE else -(cp_after - cp_before)
        cpl = max(0, -delta)

        explanation = explain_why_not(req.fen, req.candidate_move, best_move, cpl, req.persona)
        return {"explanation": explanation, "best_move": best_move, "cpl": cpl}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/evaluate-premove")
@limiter.limit("60/minute")
def evaluate_premove(request: Request, req: EvaluatePreMoveRequest) -> dict:
    try:
        from services.stockfish import STOCKFISH_PATH, DEPTH, _score_to_cp, _classify
        import chess.engine as _ce

        board = chess.Board(req.fen)
        candidate = chess.Move.from_uci(req.move)
        if candidate not in board.legal_moves:
            raise HTTPException(status_code=400, detail="Illegal move")

        moving_color = board.turn
        with _ce.SimpleEngine.popen_uci(STOCKFISH_PATH) as engine:
            info_before = engine.analyse(board, _ce.Limit(depth=DEPTH))
            cp_before = _score_to_cp(info_before["score"])
            pv = info_before.get("pv") or []
            best_move = pv[0].uci() if pv else req.move

            board.push(candidate)
            if board.is_game_over():
                return {"cpl": 0, "classification": "good", "best_move": best_move, "warning": False}
            info_after = engine.analyse(board, _ce.Limit(depth=DEPTH))
            cp_after = _score_to_cp(info_after["score"])

        delta = (cp_after - cp_before) if moving_color == chess.WHITE else -(cp_after - cp_before)
        cpl = max(0, -delta)
        classification = _classify(cpl, delta)
        return {"cpl": cpl, "classification": classification, "best_move": best_move, "warning": cpl > 100}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/explain-opponent-move")
@limiter.limit("20/minute")
def explain_opponent_move_endpoint(request: Request, req: ExplainOpponentMoveRequest):
    user_id = _get_jwt_user_id(request)
    allowed, retry_after = _check_user_limit(user_id, limit=10, window_secs=60)
    if not allowed:
        return _rate_limited_response(retry_after)
    try:
        from services.coach import explain_opponent_move
        explanation = explain_opponent_move(req.fen_before, req.engine_move, req.persona_id)
        return {"explanation": explanation}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tts")
def text_to_speech(req: TtsRequest) -> Response:
    try:
        audio_bytes = generate_speech(req.text)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
