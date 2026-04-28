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
_PIECE_VALUES = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9}


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


def _material(board: chess.Board, color: chess.Color) -> int:
    """Total material value (in pawns) for one side. Kings excluded."""
    return sum(
        _PIECE_VALUES.get(pt, 0) * len(board.pieces(pt, color))
        for pt in _PIECE_VALUES
    )


def _is_sacrifice(board: chess.Board, move: chess.Move) -> bool:
    """
    Returns True if the move gives up material — either a down-trade capture
    (e.g. Rook takes Knight) or a quiet move that walks into a cheaper recapture.
    Used to gate the 'brilliant' classification.
    """
    moving_piece = board.piece_at(move.from_square)
    if moving_piece is None:
        return False
    mover_value = _PIECE_VALUES.get(moving_piece.piece_type, 0)
    captured = board.piece_at(move.to_square)
    captured_value = _PIECE_VALUES.get(captured.piece_type, 0) if captured else 0

    # Exchange sacrifice: capturing with a piece worth more than what is taken
    if mover_value > captured_value + 1:
        return True

    # Quiet sacrifice: moving into a square where a cheaper opponent piece can recapture
    board_copy = board.copy()
    board_copy.push(move)
    opponent = not board.turn
    for sq in board_copy.attackers(opponent, move.to_square):
        attacker = board_copy.piece_at(sq)
        if attacker and _PIECE_VALUES.get(attacker.piece_type, 0) < mover_value - 1:
            return True

    return False


def _classify(cpl: int, delta: int, cp_after_mover: int, sacrifice: bool = False) -> str:
    """
    Classify a move by centipawn loss and positional context.

    Thresholds (Lichess/Chess.com aligned):
      Brilliant: best move + position improved ≥50cp + winning + material sacrifice
      Great:     best move (CPL=0) + position improved >20cp
      Good:      CPL ≤ 20 (very close to best move)
      Inaccuracy: CPL ≤ 60
      Mistake:   CPL ≤ 150
      Blunder:   CPL > 150
    """
    if cpl == 0 and delta > 50 and cp_after_mover > 0 and sacrifice:
        return "brilliant"
    if cpl == 0 and delta > 20:
        return "great"
    if cpl <= 20:
        return "good"
    if cpl <= 60:
        return "inaccuracy"
    if cpl <= 150:
        return "mistake"
    return "blunder"


def _engine_reply(
    engine: chess.engine.SimpleEngine,
    board: chess.Board,
    target_elo: int,
    strategy: StrategyProfile | None = None,
    time_remaining_secs: float | None = None,
    skill_level_out_of_book: int | None = None,
) -> str:
    """
    Select an engine reply calibrated to target_elo, optionally shaped by a StrategyProfile.

    Below Stockfish's UCI_Elo floor (1320), we blend random legal moves with
    depth-1/skill-0 moves. The lower the Elo, the higher the random fraction.
    At 1320+, we hand off to UCI_LimitStrength which is properly calibrated.

    StrategyProfile fields implemented here:
      opening_bias       — steers first 4 moves toward defined openings (85% probability)
      blunder_chance     — injects sub-optimal MultiPV candidate
      search_time_ms     — hard time cap on engine search (e.g. Boros 100ms)
      no_tactical_bias   — prefers non-capturing moves (Lady Vipra)
      skill_level_out_of_book — drops to lower skill after move 22 (Tobias)
    """
    legal_moves = list(board.legal_moves)
    if not legal_moves:
        return ""

    if target_elo <= _PURE_RANDOM_MAX:
        return random.choice(legal_moves).uci()

    # Opening bias: steer moves 1–4 (first 8 half-moves) toward the persona's preferred lines.
    # Handles both lowercase SAN ("nf3") and standard SAN ("Nf3") via first-char capitalisation.
    if strategy is not None and strategy.opening_bias and len(board.move_stack) < 8:
        bias_moves: list[chess.Move] = []
        for san in strategy.opening_bias:
            candidates_san = {san, san[0].upper() + san[1:]} if san else {san}
            for candidate_san in candidates_san:
                try:
                    m = board.parse_san(candidate_san)
                    if m in board.legal_moves:
                        bias_moves.append(m)
                        break
                except (chess.InvalidMoveError, chess.IllegalMoveError, chess.AmbiguousMoveError, ValueError):
                    pass
        if bias_moves and random.random() < 0.85:
            return random.choice(bias_moves).uci()

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

    # Out-of-book collapse: after 22 half-moves, Tobias (and any future split-skill persona)
    # drops from UCI_Elo to a weaker Skill Level, simulating theory collapse off-book.
    if skill_level_out_of_book is not None and len(board.move_stack) > 22:
        try:
            engine.configure({"UCI_LimitStrength": False, "Skill Level": skill_level_out_of_book})
        except chess.engine.EngineError:
            pass
        result = engine.play(board, chess.engine.Limit(depth=DEPTH))
        return result.move.uci() if result.move else ""

    # 1320+ Elo: UCI_LimitStrength is properly calibrated to real Elo ratings.
    try:
        engine.configure({"UCI_LimitStrength": True, "UCI_Elo": min(target_elo, 3190)})
    except chess.engine.EngineError:
        # Fallback if engine doesn't support UCI_Elo
        sl = min(20, max(0, round((target_elo - 800) / 100)))
        try:
            engine.configure({"UCI_LimitStrength": False, "Skill Level": sl})
        except chess.engine.EngineError:
            pass

    # Search limit: honour search_time_ms hard cap (e.g. Boros 100ms), otherwise depth.
    if strategy is not None and strategy.search_time_ms is not None:
        play_limit = chess.engine.Limit(time=strategy.search_time_ms / 1000.0)
    else:
        play_limit = chess.engine.Limit(depth=DEPTH)

    # no_tactical_bias: prefer non-capturing moves from top candidates (Lady Vipra's positional play).
    if strategy is not None and strategy.no_tactical_bias:
        top_infos = engine.analyse(board, play_limit, multipv=3)
        top_moves = [info["pv"][0] for info in top_infos if info.get("pv")]
        non_captures = [m for m in top_moves if not board.is_capture(m)]
        if non_captures:
            return non_captures[0].uci()
        # All top candidates are captures — fall through to normal play

    result = engine.play(board, play_limit)
    return result.move.uci() if result.move else ""


def get_engine_first_move(
    fen: str,
    target_elo: int,
    strategy: StrategyProfile | None = None,
    time_remaining_secs: float | None = None,
    skill_level_out_of_book: int | None = None,
) -> str:
    """Return the engine's opening move when the player is playing as black."""
    board = chess.Board(fen)
    with chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH) as engine:
        return _engine_reply(engine, board, target_elo, strategy, time_remaining_secs, skill_level_out_of_book)


def analyze_move(
    fen: str,
    move_uci: str,
    skill_level: int = 20,
    play_depth: int = 15,
    target_elo: int = 2700,
    strategy: StrategyProfile | None = None,
    time_remaining_secs: float | None = None,
    skill_level_out_of_book: int | None = None,
) -> MoveAnalysis:
    board = chess.Board(fen)
    move = chess.Move.from_uci(move_uci)

    if move not in board.legal_moves:
        raise ValueError(f"Illegal move: {move_uci}")

    moving_color = board.turn
    sacrifice = _is_sacrifice(board, move)

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
            engine_move = _engine_reply(engine, board, target_elo, strategy, time_remaining_secs, skill_level_out_of_book)

    delta = (cp_after - cp_before) if moving_color == chess.WHITE else -(cp_after - cp_before)
    cpl = max(0, -delta)
    cp_after_mover = cp_after if moving_color == chess.WHITE else -cp_after
    classification = _classify(cpl, delta, cp_after_mover, sacrifice)

    # Opening exemption (moves 1–10): soften inaccuracy→good, mistake→inaccuracy.
    # Blunders (CPL > 150) are never softened — a blunder in the opening is still a blunder.
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
