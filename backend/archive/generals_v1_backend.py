# Archived 2026-04-26 — replaced by Hells of Caïssa roster. See personas/personas.py.
# This file contains the 13-general interim roster (Petey through Magnus Noah).

from dataclasses import dataclass


@dataclass(frozen=True)
class StrategyProfile:
    opening_bias: tuple[str, ...]
    risk_tolerance: float
    trade_preference: float
    king_safety_weight: float
    tactic_depth: int
    blunder_chance: float
    endgame_skill: float
    time_pressure_multiplier: float


@dataclass(frozen=True)
class Persona:
    id: str
    name: str
    description: str
    system_prompt: str
    elo: int
    skill_level: int
    play_depth: int
    strategy: StrategyProfile
    adaptive: bool = False


GENERALS_V1_PERSONAS: dict[str, Persona] = {
    "pawnstorm_petey": Persona(
        id="pawnstorm_petey", name="Pawnstorm Petey",
        description="Shoves every pawn forward turn one, hangs pieces constantly",
        elo=150, skill_level=0, play_depth=1,
        strategy=StrategyProfile(opening_bias=(), risk_tolerance=1.0, trade_preference=0.5,
            king_safety_weight=0.0, tactic_depth=1, blunder_chance=0.0, endgame_skill=0.0, time_pressure_multiplier=1.0),
        system_prompt="You are Pawnstorm Petey — you have exactly one strategy: push pawns...",
    ),
    "sir_trades_a_lot": Persona(
        id="sir_trades_a_lot", name="Sir Trades-a-Lot",
        description="Initiates every trade regardless of whether it's good",
        elo=300, skill_level=0, play_depth=1,
        strategy=StrategyProfile(opening_bias=(), risk_tolerance=0.8, trade_preference=0.95,
            king_safety_weight=0.05, tactic_depth=1, blunder_chance=0.0, endgame_skill=0.0, time_pressure_multiplier=1.0),
        system_prompt="You are Sir Trades-a-Lot — a medieval knight who believes chess is simply about exchanging pieces...",
    ),
    "fianchetto_friar": Persona(
        id="fianchetto_friar", name="The Fianchetto Friar",
        description="Religiously fianchettos both bishops, then has no plan",
        elo=500, skill_level=1, play_depth=1,
        strategy=StrategyProfile(opening_bias=("g3", "b3", "g6", "b6"), risk_tolerance=0.4, trade_preference=0.3,
            king_safety_weight=0.6, tactic_depth=1, blunder_chance=0.0, endgame_skill=0.02, time_pressure_multiplier=1.2),
        system_prompt="You are The Fianchetto Friar — a devout chess monk who has taken a sacred vow to fianchetto every bishop...",
    ),
    "scholars_mate_steve": Persona(
        id="scholars_mate_steve", name="Scholar's Mate Steve",
        description="Plays the same 4-move mate attempt every game",
        elo=700, skill_level=2, play_depth=2,
        strategy=StrategyProfile(opening_bias=("e4", "Qh5", "Bc4"), risk_tolerance=0.9, trade_preference=0.4,
            king_safety_weight=0.1, tactic_depth=2, blunder_chance=0.20, endgame_skill=0.05, time_pressure_multiplier=1.6),
        system_prompt="You are Scholar's Mate Steve — you have been playing the same four-move checkmate attempt since 2003...",
    ),
    "coffeehouse_cassandra": Persona(
        id="coffeehouse_cassandra", name="Coffeehouse Cassandra",
        description="All romantic-era gambits — brilliant attacks if you accept",
        elo=900, skill_level=3, play_depth=3,
        strategy=StrategyProfile(opening_bias=("e4", "f4", "d4", "c3"), risk_tolerance=0.9, trade_preference=0.2,
            king_safety_weight=0.15, tactic_depth=3, blunder_chance=0.18, endgame_skill=0.1, time_pressure_multiplier=1.4),
        system_prompt="You are Coffeehouse Cassandra — you play only romantic-era gambits, exactly as your grandfather taught you...",
    ),
    "the_hippo": Persona(
        id="the_hippo", name="The Hippo",
        description="Pure passive setup, never initiates, punishes impatience",
        elo=1100, skill_level=5, play_depth=5,
        strategy=StrategyProfile(opening_bias=("g3", "b3", "e3", "d3"), risk_tolerance=0.15, trade_preference=0.1,
            king_safety_weight=0.7, tactic_depth=3, blunder_chance=0.12, endgame_skill=0.4, time_pressure_multiplier=1.3),
        system_prompt="You are The Hippo — a vast, immovable presence. You move your pawns to the third rank...",
    ),
    "theory_bro_tobias": Persona(
        id="theory_bro_tobias", name="Theory Bro Tobias",
        description="Memorized 20 moves of theory, lost in sidelines",
        elo=1300, skill_level=7, play_depth=7,
        strategy=StrategyProfile(opening_bias=("e4", "d4", "c4", "nf3"), risk_tolerance=0.5, trade_preference=0.5,
            king_safety_weight=0.6, tactic_depth=4, blunder_chance=0.22, endgame_skill=0.3, time_pressure_multiplier=1.5),
        system_prompt="You are Theory Bro Tobias — you have memorized 22 moves of the Najdorf English Attack...",
    ),
    "tactics_tommy": Persona(
        id="tactics_tommy", name="Tactics Tommy",
        description="Forces tactics in every position, even when they don't exist",
        elo=1500, skill_level=9, play_depth=9,
        strategy=StrategyProfile(opening_bias=("e4", "d4"), risk_tolerance=0.85, trade_preference=0.3,
            king_safety_weight=0.35, tactic_depth=5, blunder_chance=0.14, endgame_skill=0.3, time_pressure_multiplier=1.3),
        system_prompt="You are Tactics Tommy — you see combinations everywhere. Absolutely everywhere...",
    ),
    "positional_patricia": Persona(
        id="positional_patricia", name="Positional Patricia",
        description="Accumulates tiny positional advantages — no tactics, just pressure",
        elo=1700, skill_level=11, play_depth=11,
        strategy=StrategyProfile(opening_bias=("d4", "c4", "nf3"), risk_tolerance=0.3, trade_preference=0.55,
            king_safety_weight=0.8, tactic_depth=5, blunder_chance=0.06, endgame_skill=0.75, time_pressure_multiplier=1.1),
        system_prompt="You are Positional Patricia — you do not play tactics. You play chess...",
    ),
    "bullet_demon_boris": Persona(
        id="bullet_demon_boris", name="Bullet Demon Boris",
        description="Premoves everything, plays for flag, sound but shallow",
        elo=1900, skill_level=13, play_depth=3,
        strategy=StrategyProfile(opening_bias=("e4",), risk_tolerance=0.65, trade_preference=0.4,
            king_safety_weight=0.55, tactic_depth=4, blunder_chance=0.10, endgame_skill=0.55, time_pressure_multiplier=0.6),
        system_prompt="You are Bullet Demon Boris — you have played 50,000 bullet games and you premove everything...",
    ),
    "endgame_executioner": Persona(
        id="endgame_executioner", name="The Endgame Executioner",
        description="Trades down to endgames at every opportunity, surgical technique",
        elo=2100, skill_level=15, play_depth=14,
        strategy=StrategyProfile(opening_bias=("d4", "c4"), risk_tolerance=0.4, trade_preference=0.85,
            king_safety_weight=0.75, tactic_depth=7, blunder_chance=0.04, endgame_skill=0.95, time_pressure_multiplier=1.05),
        system_prompt="You are The Endgame Executioner — the middlegame is noise...",
    ),
    "the_prophylact": Persona(
        id="the_prophylact", name="The Prophylact",
        description="Prevents your plans before you form them — Karpovian style",
        elo=2300, skill_level=17, play_depth=16,
        strategy=StrategyProfile(opening_bias=("d4", "c4", "nf3"), risk_tolerance=0.35, trade_preference=0.6,
            king_safety_weight=0.9, tactic_depth=8, blunder_chance=0.02, endgame_skill=0.88, time_pressure_multiplier=1.05),
        system_prompt="You are The Prophylact — you do not attack. You prevent...",
    ),
    "magnus_noah": Persona(
        id="magnus_noah", name="Magnus Noah, the Architect",
        description="Universal style — adapts to target your specific weaknesses",
        elo=2700, skill_level=20, play_depth=20, adaptive=True,
        strategy=StrategyProfile(opening_bias=(), risk_tolerance=0.5, trade_preference=0.5,
            king_safety_weight=1.0, tactic_depth=10, blunder_chance=0.0, endgame_skill=1.0, time_pressure_multiplier=1.0),
        system_prompt="You are Magnus Noah, the Architect — the final general...",
    ),
}

GENERALS_V1_DEFAULT_PERSONA_ID = "pawnstorm_petey"
