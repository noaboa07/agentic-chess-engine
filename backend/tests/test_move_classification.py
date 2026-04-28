import pytest
from services.stockfish import _classify, _MATE_CP


# ── Brilliant ────────────────────────────────────────────────────────────────

def test_brilliant_requires_sacrifice():
    # All conditions met: best move, large improvement, winning, AND material sacrifice
    assert _classify(0, 51, 100, sacrifice=True) == "brilliant"

def test_brilliant_blocked_without_sacrifice():
    # Same numbers but no sacrifice — falls to "great"
    assert _classify(0, 51, 100, sacrifice=False) == "great"

def test_brilliant_blocked_when_mover_still_losing():
    # Best move in a losing position — never brilliant regardless of sacrifice
    assert _classify(0, 200, -100, sacrifice=True) == "great"

def test_brilliant_blocked_when_mover_exactly_zero():
    # Equal after the move — not winning, not brilliant
    assert _classify(0, 100, 0, sacrifice=True) == "great"

def test_brilliant_blocked_when_delta_not_enough():
    # delta must be > 50, not == 50
    assert _classify(0, 50, 100, sacrifice=True) == "great"


# ── Great ─────────────────────────────────────────────────────────────────────

def test_great_at_delta_above_20():
    # CPL=0, delta>20 → great
    assert _classify(0, 21, 100) == "great"

def test_great_at_delta_exactly_50():
    # delta==50 is not >50 for brilliant, but is >20 → great
    assert _classify(0, 50, 100) == "great"

def test_great_blocked_when_delta_at_20():
    # delta==20 is not >20 → falls to "good"
    assert _classify(0, 20, 100) == "good"


# ── Good ─────────────────────────────────────────────────────────────────────

def test_good_cpl_zero_low_delta():
    # Best move but modest improvement — good
    assert _classify(0, 1, 100) == "good"

def test_good_cpl_boundary_low():
    assert _classify(1, -1, 100) == "good"

def test_good_cpl_boundary_high():
    # New threshold: CPL ≤ 20 is "good"
    assert _classify(20, -20, 100) == "good"

def test_good_cpl_just_above_threshold():
    assert _classify(21, -21, 100) == "inaccuracy"


# ── Inaccuracy ────────────────────────────────────────────────────────────────

def test_inaccuracy_boundary_low():
    assert _classify(21, -21, 100) == "inaccuracy"

def test_inaccuracy_boundary_high():
    # New threshold: CPL ≤ 60 is "inaccuracy"
    assert _classify(60, -60, 100) == "inaccuracy"

def test_inaccuracy_just_above_threshold():
    assert _classify(61, -61, 100) == "mistake"


# ── Mistake ───────────────────────────────────────────────────────────────────

def test_mistake_boundary_low():
    assert _classify(61, -61, 100) == "mistake"

def test_mistake_boundary_high():
    # New threshold: CPL ≤ 150 is "mistake"
    assert _classify(150, -150, 100) == "mistake"

def test_mistake_just_above_threshold():
    assert _classify(151, -151, 100) == "blunder"


# ── Blunder ───────────────────────────────────────────────────────────────────

def test_blunder_boundary():
    assert _classify(151, -151, -300) == "blunder"

def test_blunder_large_cpl():
    assert _classify(500, -500, -400) == "blunder"


# ── _MATE_CP constant ─────────────────────────────────────────────────────────

def test_mate_cp_is_reasonable():
    assert 200 <= _MATE_CP <= 10_000

def test_mate_cp_not_inflated():
    assert _MATE_CP <= 1000
