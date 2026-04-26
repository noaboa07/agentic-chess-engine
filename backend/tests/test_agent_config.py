import pytest
from personas.personas import PERSONAS, get_persona


# ── Ladder integrity ──────────────────────────────────────────────────────────

def test_all_13_personas_defined():
    assert len(PERSONAS) == 13

def test_persona_ids_unique():
    ids = [p.id for p in PERSONAS]
    assert len(ids) == len(set(ids))

def test_elo_ladder_strictly_ascending():
    elos = [p.elo for p in PERSONAS]
    assert elos == sorted(elos), "Personas must be ordered by ascending Elo"

def test_all_elos_positive():
    for p in PERSONAS:
        assert p.elo > 0, f"{p.id} has non-positive Elo"


# ── get_persona ───────────────────────────────────────────────────────────────

def test_get_persona_returns_correct_id():
    for p in PERSONAS:
        fetched = get_persona(p.id)
        assert fetched.id == p.id

def test_get_persona_unknown_id_falls_back():
    result = get_persona("nonexistent_persona_xyz")
    assert result is not None  # should not raise


# ── Strategy profiles ─────────────────────────────────────────────────────────

def test_strategy_blunder_chance_in_range():
    for p in PERSONAS:
        if p.strategy is None:
            continue
        assert 0.0 <= p.strategy.blunder_chance <= 1.0, \
            f"{p.id}: blunder_chance {p.strategy.blunder_chance} out of [0,1]"

def test_strategy_endgame_skill_in_range():
    for p in PERSONAS:
        if p.strategy is None:
            continue
        assert 0.0 <= p.strategy.endgame_skill <= 1.0, \
            f"{p.id}: endgame_skill {p.strategy.endgame_skill} out of [0,1]"

def test_strategy_time_pressure_multiplier_at_least_1():
    for p in PERSONAS:
        if p.strategy is None:
            continue
        assert p.strategy.time_pressure_multiplier >= 1.0, \
            f"{p.id}: time_pressure_multiplier should be >= 1.0"

def test_strategy_tactic_depth_positive():
    for p in PERSONAS:
        if p.strategy is None:
            continue
        assert p.strategy.tactic_depth >= 1, \
            f"{p.id}: tactic_depth must be >= 1"

def test_high_elo_personas_have_lower_blunder_chance():
    god_noah = get_persona("god_noah")
    clown_noah = get_persona("clown_noah")
    if god_noah.strategy and clown_noah.strategy:
        assert god_noah.strategy.blunder_chance <= clown_noah.strategy.blunder_chance
