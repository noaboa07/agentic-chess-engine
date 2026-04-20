from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import chess
from dotenv import load_dotenv
from services.stockfish import analyze_move
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


class TtsRequest(BaseModel):
    text: str


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
        result = analyze_move(req.fen, req.move, skill_level=persona.skill_level)

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


@app.post("/api/tts")
def text_to_speech(req: TtsRequest) -> Response:
    try:
        audio_bytes = generate_speech(req.text)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
