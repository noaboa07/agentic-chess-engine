import os
import random
import chess
import chess.engine
from dataclasses import dataclass, field
from pathlib import Path
from personas.personas import StrategyProfile

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
    top_lines: list[dict] = field(default_factory=list)  # top MultiPV candidates pre-move


_MATE_CP = 600  # Cap mate scores at ±600 cp for delta/CPL math.
                # Prevents astronomical CPL when a player misses a forced mate.
                # The eval display uses the raw score separately and still shows "M3" etc.

def _score_to_cp(score: chess.engine.PovScore) -> int:
    white = score.white()
    if white.is_mate():
        return _MATE_CP if (white.mate() or 0) > 0 else -_MATE_CP
    return white.score() or 0


def _classify(cpl: int, delta: int, cp_after_mover: int) -> str:
    """
    cpl:            centipawn loss vs engine's best move (0 = played best move)
    delta:          how much the position improved for the mover after this move
    cp_after_mover: evaluation after the move from the MOVER's perspective
                    (positive = mover is winning, negative = mover is losing)

    Brilliant requires all three:
      - played the engine's top choice (cpl == 0)
      - position improved significantly (delta > 50)
      - mover is actually winning after the move (cp_after_mover > 0)
    Without the third guard, a "best try" queen sac in a losing position can
    fire as brilliant just because the horizon effect shows a slightly less-bad line.
    """
    if cpl == 0 and delta > 50 and cp_after_mover > 0:
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


def _engine_reply(
    engine: chess.engine.SimpleEngine,
    board: chess.Board,
    target_elo: int,
    strategy: StrategyProfile | None = None,
    time_remaining_secs: float | None = None,
) -> str:
    """
    Select an engine reply calibrated to target_elo, optionally shaped by a StrategyProfile.

    Below Stockfish's UCI_Elo floor (1320), we blend random legal moves with
    depth-1/skill-0 moves. The lower the Elo, the higher the random fraction.
    At 1320+, we hand off to UCI_LimitStrength which is properly calibrated.

    When a StrategyProfile is provided, blunder_chance injects a sub-optimal MultiPV
    candidate before the UCI path runs, making each agent play stylistically differently.
    """
    legal_moves = list(board.legal_moves)
    if not legal_moves:
        return ""

    if target_elo <= _PURE_RANDOM_MAX:
        # Petey (150), Sir Trades (300), Fianchetto Friar (500): zero engine evaluation — pure chaos.
        # Even depth=1 Stockfish sees Scholar's Mate threats; random moves don't.
        return random.choice(legal_moves).uci()

    # Strategy-based blunder injection: pick a sub-optimal candidate from MultiPV lines.
    # Runs before the UCI path so it applies to both the blended and calibrated zones.
    if strategy is not None and strategy.blunder_chance > 0 and len(legal_moves) >= 2:
        effective_chance = strategy.blunder_chance

        if time_remaining_secs is not None and time_remaining_secs < 30:
            effective_chance = min(1.0, effective_chance * strategy.time_pressure_multiplier)

        # Endgame: agents with low endgame_skill blunder more in simplified positions
        non_king_pieces = len(board.piece_map()) - 2
        if non_king_pieces <= 10:
            effective_chance = min(1.0, effective_chance + (1.0 - strategy.endgame_skill) * 0.12)

        if random.random() < effective_chance:
            depth = max(1, strategy.tactic_depth)
            n_lines = min(len(legal_moves), max(2, depth))
            try:
                engine.configure({"UCI_LimitStrength": False, "Skill Level": 15})
            except chess.engine.EngineError:
                pass
            infos = engine.analyse(board, chess.engine.Limit(depth=depth), multipv=n_lines)
            candidates = [info["pv"][0].uci() for info in infos if info.get("pv")]
            if len(candidates) >= 2:
                # Pick from the weaker lines — not the engine's top choice
                return random.choice(candidates[1:])

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


def get_engine_first_move(
    fen: str,
    target_elo: int,
    strategy: StrategyProfile | None = None,
    time_remaining_secs: float | None = None,
) -> str:
    """Return the engine's opening move when the player is playing as black."""
    board = chess.Board(fen)
    with chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH) as engine:
        return _engine_reply(engine, board, target_elo, strategy, time_remaining_secs)


def analyze_move(
    fen: str,
    move_uci: str,
    skill_level: int = 20,
    play_depth: int = 15,
    target_elo: int = 2700,
    strategy: StrategyProfile | None = None,
    time_remaining_secs: float | None = None,
) -> MoveAnalysis:
    board = chess.Board(fen)
    move = chess.Move.from_uci(move_uci)

    if move not in board.legal_moves:
        raise ValueError(f"Illegal move: {move_uci}")

    moving_color = board.turn

    with chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH) as engine:
        # Use MultiPV=3 to collect top candidate lines for the debate transcript.
        # multipv > 1 always returns a list; index 0 is the engine's top choice.
        infos_before = engine.analyse(board, chess.engine.Limit(depth=DEPTH), multipv=3)
        info_before = infos_before[0] if isinstance(infos_before, list) else infos_before
        cp_before = _score_to_cp(info_before["score"])

        pv_before: list[chess.Move] = info_before.get("pv") or []
        best_move = pv_before[0].uci() if pv_before else ""

        top_lines: list[dict] = []
        for info in (infos_before if isinstance(infos_before, list) else [info_before]):
            pv = info.get("pv") or []
            if pv:
                top_lines.append({"move": pv[0].uci(), "cp": _score_to_cp(info["score"])})

        board.push(move)
        fen_after = board.fen()

        engine_move = ""
        info_after = None
        if board.is_game_over():
            # Don't call engine.analyse on a terminal position — Stockfish returns Mate(0)
            # which is ambiguous (Python: `0 or 0 > 0` is False), causing wrong cp sign.
            # Instead, assign cp_after directly: mating side gets +_MATE_CP, draw gets 0.
            if board.is_checkmate():
                cp_after = _MATE_CP if moving_color == chess.WHITE else -_MATE_CP
            else:
                cp_after = 0  # stalemate / insufficient material / etc.
        else:
            info_after = engine.analyse(board, chess.engine.Limit(depth=DEPTH))
            cp_after = _score_to_cp(info_after["score"])
            engine_move = _engine_reply(engine, board, target_elo, strategy, time_remaining_secs)

    delta = (cp_after - cp_before) if moving_color == chess.WHITE else -(cp_after - cp_before)
    cpl = max(0, -delta)
    cp_after_mover = cp_after if moving_color == chess.WHITE else -cp_after
    classification = _classify(cpl, delta, cp_after_mover)

    # Opening exemption (moves 1–10): soften classifications one tier.
    # inaccuracy → good, mistake → inaccuracy.
    # Blunders (CPL > 200) are never softened — those are real errors at any stage.
    if len(board.move_stack) <= 10:
        if classification == "inaccuracy":
            classification = "good"
        elif classification == "mistake":
            classification = "inaccuracy"

    if info_after is None:
        evaluation: dict[str, str | int] = (
            {"type": "mate", "value": 0} if board.is_checkmate() else {"type": "cp", "value": 0}
        )
    else:
        final_score = info_after["score"].white()
        if final_score.is_mate():
            evaluation = {"type": "mate", "value": final_score.mate() or 0}
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
        top_lines=top_lines,
    )
