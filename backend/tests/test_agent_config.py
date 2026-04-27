import pytest
from personas.personas import PERSONAS, get_persona


# ── Ladder integrity ──────────────────────────────────────────────────────────

def test_all_15_personas_defined():
    assert len(PERSONAS) == 15

def test_persona_ids_unique():
    ids = [p.id for p in PERSONAS.values()]
    assert len(ids) == len(set(ids))

def test_elo_ladder_strictly_ascending():
    elos = [p.elo for p in PERSONAS.values()]
    assert elos == sorted(elos), "Personas must be ordered by ascending Elo"

def test_all_elos_positive():
    for p in PERSONAS.values():
        assert p.elo > 0, f"{p.id} has non-positive Elo"

def test_canonical_elo_sequence():
    elos = [p.elo for p in PERSONAS.values()]
    assert elos == [200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2100, 2300, 2500, 2700, 3000]


# ── Canonical sin roster ──────────────────────────────────────────────────────

def test_all_15_sins_present():
    sins = [p.sin for p in PERSONAS.values()]
    expected = [
        'Recklessness', 'Greed', 'Sloth', 'Vanity', 'Lust', 'Stagnation', 'Pride',
        'Wrath', 'Envy', 'Cruelty', 'Tyranny', 'Inevitability', 'Paranoia', 'Despair', 'All',
    ]
    assert sins == expected


# ── get_persona ───────────────────────────────────────────────────────────────

def test_get_persona_returns_correct_id():
    for p in PERSONAS.values():
        fetched = get_persona(p.id)
        assert fetched.id == p.id

def test_get_persona_unknown_id_falls_back():
    result = get_persona("nonexistent_persona_xyz")
    assert result is not None  # should not raise


# ── Canonical AI config assertions ───────────────────────────────────────────

def test_vipra_no_tactical_bias():
    vipra = get_persona("lady_vipra")
    assert vipra.strategy.no_tactical_bias is True

def test_boros_search_time_ms():
    boros = get_persona("boros")
    assert boros.strategy.search_time_ms == 100

def test_reaper_simplification_bias():
    reaper = get_persona("the_reaper")
    assert reaper.strategy.trade_preference >= 0.85

def test_reaper_endgame_skill_maxed():
    reaper = get_persona("the_reaper")
    assert reaper.strategy.endgame_skill == 1.0

def test_tobias_split_skill():
    tobias = get_persona("magister_tobias")
    assert tobias.skill_level == 14
    assert tobias.skill_level_out_of_book == 8

def test_hades_no_blunder():
    hades = get_persona("dread_hades")
    assert hades.strategy.blunder_chance == 0.0

def test_mirror_maiden_opening_selector():
    maiden = get_persona("the_mirror_maiden")
    assert maiden.strategy.opening_selector == "mirror_player_last_3_games"


# ── Strategy profile invariants ───────────────────────────────────────────────

def test_strategy_blunder_chance_in_range():
    for p in PERSONAS.values():
        assert 0.0 <= p.strategy.blunder_chance <= 1.0, \
            f"{p.id}: blunder_chance {p.strategy.blunder_chance} out of [0,1]"

def test_strategy_endgame_skill_in_range():
    for p in PERSONAS.values():
        assert 0.0 <= p.strategy.endgame_skill <= 1.0, \
            f"{p.id}: endgame_skill {p.strategy.endgame_skill} out of [0,1]"

def test_strategy_time_pressure_multiplier_at_least_1():
    for p in PERSONAS.values():
        assert p.strategy.time_pressure_multiplier >= 1.0, \
            f"{p.id}: time_pressure_multiplier should be >= 1.0"

def test_strategy_tactic_depth_positive():
    for p in PERSONAS.values():
        assert p.strategy.tactic_depth >= 1, \
            f"{p.id}: tactic_depth must be >= 1"
