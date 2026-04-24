from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import chess
from dotenv import load_dotenv
from services.stockfish import analyze_move, get_engine_first_move
from services.coach import get_coaching_message
from services.tts import generate_speech
from personas.personas import get_persona

load_dotenv()

app = FastAPI(title="Agentic Chess Engine API")

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


class EngineFirstMoveRequest(BaseModel):
    fen: str
    persona: str = "clown_noah"


class TtsRequest(BaseModel):
    text: str


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
def process_move(req: MoveRequest) -> dict:
    try:
        persona = get_persona(req.persona)
        result = analyze_move(req.fen, req.move, skill_level=persona.skill_level, play_depth=persona.play_depth, target_elo=persona.elo)

        coach_message = None
        if req.teach_mode or req.hint_requested:
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
            except Exception:
                coach_message = None

        return {
            "fen_after": result.fen_after,
            "best_move": result.best_move,
            "engine_move": result.engine_move,
            "evaluation": result.evaluation,
            "eval_delta": result.eval_delta,
            "is_blunder": result.is_blunder,
            "classification": result.classification,
            "coach_message": coach_message,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/engine-first-move")
def engine_first_move(req: EngineFirstMoveRequest) -> dict:
    try:
        persona = get_persona(req.persona)
        move = get_engine_first_move(req.fen, persona.elo)
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


@app.post("/api/tts")
def text_to_speech(req: TtsRequest) -> Response:
    try:
        audio_bytes = generate_speech(req.text)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
