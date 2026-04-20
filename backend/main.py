from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chess
from dotenv import load_dotenv
from services.stockfish import analyze_move
from services.coach import get_coaching_message

load_dotenv()

app = FastAPI(title="Agentic Chess Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class MoveRequest(BaseModel):
    fen: str
    move: str


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "agentic-chess-engine"}


@app.get("/api/board/validate")
async def validate_fen(fen: str) -> dict[str, bool | str]:
    try:
        board = chess.Board(fen)
        return {
            "valid": True,
            "turn": "white" if board.turn == chess.WHITE else "black",
            "is_check": board.is_check(),
            "is_game_over": board.is_game_over(),
        }
    except ValueError:
        return {"valid": False, "error": "Invalid FEN string"}


@app.post("/api/move")
def process_move(req: MoveRequest) -> dict:
    try:
        result = analyze_move(req.fen, req.move)
        coach_message = get_coaching_message(
            move_uci=req.move,
            evaluation=result.evaluation,
            classification=result.classification,
            best_move=result.best_move,
        )
        return {
            "fen_after": result.fen_after,
            "best_move": result.best_move,
            "evaluation": result.evaluation,
            "is_blunder": result.is_blunder,
            "classification": result.classification,
            "coach_message": coach_message,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Engine error — is Stockfish installed?")
