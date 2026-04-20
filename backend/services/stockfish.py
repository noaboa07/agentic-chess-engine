import os
import chess
import chess.engine
from dataclasses import dataclass
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_SF_PATH = str(_BACKEND_DIR / "stockfish" / "stockfish-windows-x86-64-avx2.exe")
STOCKFISH_PATH = os.getenv("STOCKFISH_PATH") or _DEFAULT_SF_PATH
DEPTH = 15


@dataclass
class MoveAnalysis:
    fen_after: str
    best_move: str    # human's better alternative (from pre-move position)
    engine_move: str  # opponent's reply (skill-level-configured)
    evaluation: dict[str, str | int]
    eval_delta: int
    is_blunder: bool
    classification: str


def _score_to_cp(score: chess.engine.PovScore) -> int:
    white = score.white()
    if white.is_mate():
        return 10000 if (white.mate() or 0) > 0 else -10000
    return white.score() or 0


def _classify(cpl: int, delta: int) -> str:
    """Classify a move by Centipawn Loss (CPL = how much worse than engine's top choice).
    cpl  = max(0, -delta) — always non-negative.
    delta is kept for brilliant detection: a CPL-0 move that also swings eval >50cp
    in the user's favour (tactical shot / sacrifice) earns 'brilliant'."""
    if cpl == 0 and delta > 50:
        return "brilliant"
    if cpl == 0:
        return "great"
    if cpl <= 40:
        return "good"
    if cpl <= 90:
        return "inaccuracy"
    if cpl <= 200:
        return "mistake"
    return "blunder"


def analyze_move(fen: str, move_uci: str, skill_level: int = 20) -> MoveAnalysis:
    board = chess.Board(fen)
    move = chess.Move.from_uci(move_uci)

    if move not in board.legal_moves:
        raise ValueError(f"Illegal move: {move_uci}")

    moving_color = board.turn

    with chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH) as engine:
        info_before = engine.analyse(board, chess.engine.Limit(depth=DEPTH))
        cp_before = _score_to_cp(info_before["score"])

        pv_before: list[chess.Move] = info_before.get("pv") or []
        best_move = pv_before[0].uci() if pv_before else ""

        board.push(move)
        fen_after = board.fen()

        info_after = engine.analyse(board, chess.engine.Limit(depth=DEPTH))
        cp_after = _score_to_cp(info_after["score"])

        engine_move = ""
        if not board.is_game_over():
            try:
                engine.configure({"Skill Level": skill_level})
            except chess.engine.EngineError:
                pass
            # Low skill tiers get a hard cap so the engine genuinely plays weak moves
            if skill_level < 5:
                play_limit = chess.engine.Limit(depth=1)
            else:
                play_limit = chess.engine.Limit(depth=max(5, DEPTH // 3))
            engine_result = engine.play(board, play_limit)
            engine_move = engine_result.move.uci() if engine_result.move else ""

    delta = (cp_after - cp_before) if moving_color == chess.WHITE else -(cp_after - cp_before)
    cpl = max(0, -delta)
    classification = _classify(cpl, delta)

    # Opening exemption: upgrade inaccuracies to 'good' for the first 10 half-moves
    if classification == "inaccuracy" and len(board.move_stack) <= 10:
        classification = "good"

    final_score = info_after["score"].white()
    if final_score.is_mate():
        evaluation: dict[str, str | int] = {"type": "mate", "value": final_score.mate() or 0}
    else:
        evaluation = {"type": "cp", "value": final_score.score() or 0}

    return MoveAnalysis(
        fen_after=fen_after,
        best_move=best_move,
        engine_move=engine_move,
        evaluation=evaluation,
        eval_delta=delta,
        is_blunder=classification in ("mistake", "blunder"),
        classification=classification,
    )
