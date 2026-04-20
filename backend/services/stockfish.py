import os
import chess
import chess.engine
from dataclasses import dataclass

STOCKFISH_PATH = os.getenv("STOCKFISH_PATH", "./stockfish/stockfish")
DEPTH = 15


@dataclass
class MoveAnalysis:
    fen_after: str
    best_move: str
    evaluation: dict[str, str | int]
    is_blunder: bool
    classification: str


def _score_to_cp(score: chess.engine.PovScore) -> int:
    white = score.white()
    if white.is_mate():
        return 10000 if (white.mate() or 0) > 0 else -10000
    return white.score() or 0


def _classify(delta_cp: int) -> str:
    if delta_cp > 150:
        return "brilliant"
    if delta_cp >= -50:
        return "good"
    if delta_cp >= -100:
        return "inaccuracy"
    if delta_cp >= -200:
        return "mistake"
    return "blunder"


def analyze_move(fen: str, move_uci: str) -> MoveAnalysis:
    board = chess.Board(fen)
    move = chess.Move.from_uci(move_uci)

    if move not in board.legal_moves:
        raise ValueError(f"Illegal move: {move_uci}")

    moving_color = board.turn

    with chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH) as engine:
        info_before = engine.analyse(board, chess.engine.Limit(depth=DEPTH))
        cp_before = _score_to_cp(info_before["score"])

        board.push(move)
        fen_after = board.fen()

        info_after = engine.analyse(board, chess.engine.Limit(depth=DEPTH))
        cp_after = _score_to_cp(info_after["score"])

        best_result = engine.play(board, chess.engine.Limit(depth=DEPTH))
        best_move = best_result.move.uci() if best_result.move else ""

    delta = (cp_after - cp_before) if moving_color == chess.WHITE else -(cp_after - cp_before)
    classification = _classify(delta)

    final_score = info_after["score"].white()
    if final_score.is_mate():
        evaluation: dict[str, str | int] = {"type": "mate", "value": final_score.mate() or 0}
    else:
        evaluation = {"type": "cp", "value": final_score.score() or 0}

    return MoveAnalysis(
        fen_after=fen_after,
        best_move=best_move,
        evaluation=evaluation,
        is_blunder=classification in ("mistake", "blunder"),
        classification=classification,
    )
