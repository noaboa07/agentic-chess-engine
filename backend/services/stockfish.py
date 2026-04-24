import os
import random
import chess
import chess.engine
from dataclasses import dataclass
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_SF_PATH = str(_BACKEND_DIR / "stockfish" / "stockfish-windows-x86-64-avx2.exe")
STOCKFISH_PATH = os.getenv("STOCKFISH_PATH") or _DEFAULT_SF_PATH
DEPTH = 15
_UCI_ELO_MIN = 1320   # Stockfish's minimum supported UCI_Elo
_PURE_RANDOM_MAX = 600  # At or below this Elo: 100% random moves, no engine evaluation


@dataclass
class MoveAnalysis:
    fen_after: str
    best_move: str    # human's better alternative (from pre-move position)
    engine_move: str  # opponent's reply
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
    """Classify a move by Centipawn Loss."""
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


def _engine_reply(engine: chess.engine.SimpleEngine, board: chess.Board, target_elo: int) -> str:
    """
    Select an engine reply calibrated to target_elo.

    Below Stockfish's UCI_Elo floor (1320), we blend random legal moves with
    depth-1/skill-0 moves. The lower the Elo, the higher the random fraction.
    At 1320+, we hand off to UCI_LimitStrength which is properly calibrated.
    """
    legal_moves = list(board.legal_moves)
    if not legal_moves:
        return ""

    if target_elo <= _PURE_RANDOM_MAX:
        # Roomba (150), Clown (300), Tilted (500): zero engine evaluation — pure chaos.
        # Even depth=1 Stockfish sees Scholar's Mate threats; random moves don't.
        return random.choice(legal_moves).uci()

    if target_elo < _UCI_ELO_MIN:
        # 601–1319 Elo: blend random with depth-1/skill-0 engine moves.
        # At 700 Elo: ~86% random. At 1100 Elo: ~31% random. At 1300 Elo: ~3% random.
        random_prob = 1.0 - ((target_elo - _PURE_RANDOM_MAX) / (_UCI_ELO_MIN - _PURE_RANDOM_MAX))
        if random.random() < random_prob:
            return random.choice(legal_moves).uci()
        try:
            engine.configure({"UCI_LimitStrength": False, "Skill Level": 0})
        except chess.engine.EngineError:
            pass
        result = engine.play(board, chess.engine.Limit(depth=1))
        return result.move.uci() if result.move else random.choice(legal_moves).uci()

    # 1320+ Elo: UCI_LimitStrength is properly calibrated to real Elo ratings
    try:
        engine.configure({"UCI_LimitStrength": True, "UCI_Elo": min(target_elo, 3190)})
    except chess.engine.EngineError:
        # Fallback if engine doesn't support UCI_Elo
        sl = min(20, max(0, round((target_elo - 800) / 100)))
        try:
            engine.configure({"UCI_LimitStrength": False, "Skill Level": sl})
        except chess.engine.EngineError:
            pass
    result = engine.play(board, chess.engine.Limit(depth=DEPTH))
    return result.move.uci() if result.move else ""


def get_engine_first_move(fen: str, target_elo: int) -> str:
    """Return the engine's opening move when the player is playing as black."""
    board = chess.Board(fen)
    with chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH) as engine:
        return _engine_reply(engine, board, target_elo)


def analyze_move(
    fen: str,
    move_uci: str,
    skill_level: int = 20,
    play_depth: int = 15,
    target_elo: int = 2700,
) -> MoveAnalysis:
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
            engine_move = _engine_reply(engine, board, target_elo)

    delta = (cp_after - cp_before) if moving_color == chess.WHITE else -(cp_after - cp_before)
    cpl = max(0, -delta)
    classification = _classify(cpl, delta)

    # Opening exemption: upgrade inaccuracies in moves 1–10
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
