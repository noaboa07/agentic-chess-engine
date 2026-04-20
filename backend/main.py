from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import chess

app = FastAPI(title="Agentic Chess Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "agentic-chess-engine"}


@app.get("/api/board/validate")
async def validate_fen(fen: str) -> dict[str, bool | str]:
    """Validate a FEN string and return basic board info."""
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
