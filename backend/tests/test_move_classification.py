import pytest
from services.stockfish import _classify, _MATE_CP


# ── _classify boundary conditions ────────────────────────────────────────────

def test_brilliant_requires_delta_above_50_and_winning():
    # cpl=0, delta>50, AND mover must be winning after the move
    assert _classify(0, 51, 100) == "brilliant"

def test_brilliant_blocked_when_mover_still_losing():
    # Best move in a losing position — "great", not "brilliant"
    assert _classify(0, 200, -100) == "great"

def test_brilliant_blocked_when_mover_exactly_zero():
    # Equal after the move — not winning, not brilliant
    assert _classify(0, 100, 0) == "great"

def test_great_at_delta_exactly_50():
    # delta == 50 is NOT > 50, so falls to "great"
    assert _classify(0, 50, 100) == "great"

def test_great_any_positive_delta_with_zero_cpl():
    assert _classify(0, 1, 100) == "great"

def test_good_cpl_boundary_low():
    assert _classify(1, -1, 100) == "good"

def test_good_cpl_boundary_high():
    assert _classify(40, -40, 100) == "good"

def test_inaccuracy_boundary_low():
    assert _classify(41, -41, 100) == "inaccuracy"

def test_inaccuracy_boundary_high():
    assert _classify(90, -90, 100) == "inaccuracy"

def test_mistake_boundary_low():
    assert _classify(91, -91, 100) == "mistake"

def test_mistake_boundary_high():
    assert _classify(200, -200, 100) == "mistake"

def test_blunder_boundary():
    assert _classify(201, -201, -300) == "blunder"

def test_blunder_large_cpl():
    assert _classify(500, -500, -400) == "blunder"


# ── _MATE_CP constant ─────────────────────────────────────────────────────────

def test_mate_cp_is_reasonable():
    # Must be large enough to be distinguishable but not astronomical
    assert 200 <= _MATE_CP <= 10_000

def test_mate_cp_not_inflated():
    # The whole point of the cap is to prevent CPL > 1200 on checkmate moves
    assert _MATE_CP <= 1000
