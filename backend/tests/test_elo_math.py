import pytest


# Mirror of the logic in main.py /api/elo/calculate
def _calc(player_elo: int, opponent_elo: int, result: str, games_played: int):
    if games_played < 20:
        k = 40
    elif player_elo >= 2400:
        k = 10
    else:
        k = 20

    expected = 1.0 / (1.0 + 10.0 ** ((opponent_elo - player_elo) / 400.0))
    score = {"win": 1.0, "loss": 0.0, "draw": 0.5, "resigned": 0.0}.get(result, 0.0)
    raw_delta = round(k * (score - expected))
    new_elo = max(100, player_elo + raw_delta)
    return new_elo, new_elo - player_elo, k


# ── K-factor selection ────────────────────────────────────────────────────────

def test_k40_for_new_players():
    _, _, k = _calc(1000, 1000, "win", 5)
    assert k == 40

def test_k40_at_boundary_19_games():
    _, _, k = _calc(1000, 1000, "win", 19)
    assert k == 40

def test_k20_at_boundary_20_games():
    _, _, k = _calc(1000, 1000, "win", 20)
    assert k == 20

def test_k10_for_high_elo():
    _, _, k = _calc(2400, 2400, "win", 100)
    assert k == 10

def test_k20_just_below_high_elo():
    _, _, k = _calc(2399, 2399, "win", 100)
    assert k == 20


# ── Basic outcomes ────────────────────────────────────────────────────────────

def test_win_gains_elo():
    _, delta, _ = _calc(1000, 1000, "win", 30)
    assert delta > 0

def test_loss_loses_elo():
    _, delta, _ = _calc(1000, 1000, "loss", 30)
    assert delta < 0

def test_draw_vs_equal_is_neutral():
    _, delta, _ = _calc(1000, 1000, "draw", 30)
    assert delta == 0

def test_resigned_same_delta_as_loss():
    _, d_loss, _ = _calc(1000, 1000, "loss", 30)
    _, d_resign, _ = _calc(1000, 1000, "resigned", 30)
    assert d_loss == d_resign


# ── Floor ─────────────────────────────────────────────────────────────────────

def test_elo_floor_at_100():
    new_elo, _, _ = _calc(100, 3000, "loss", 30)
    assert new_elo == 100

def test_floor_does_not_apply_when_above_100():
    new_elo, _, _ = _calc(500, 500, "loss", 30)
    assert new_elo > 100


# ── Upset bonus ───────────────────────────────────────────────────────────────

def test_beating_stronger_opponent_gains_more():
    _, delta_strong, _ = _calc(1000, 1400, "win", 30)
    _, delta_equal,  _ = _calc(1000, 1000, "win", 30)
    assert delta_strong > delta_equal

def test_losing_to_weaker_opponent_loses_more():
    _, delta_weak,  _ = _calc(1000, 600,  "loss", 30)
    _, delta_equal, _ = _calc(1000, 1000, "loss", 30)
    assert delta_weak < delta_equal
