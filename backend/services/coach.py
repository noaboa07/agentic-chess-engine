import json as _json
import os
import time
from functools import lru_cache
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from personas.personas import get_persona
from services.telemetry import record_latency, record_error, record_cache_hit
from services.cache import get_cached_coaching, set_cached_coaching

MODEL = "llama-3.3-70b-versatile"


@lru_cache(maxsize=1)
def _get_llm() -> ChatGroq:
    return ChatGroq(
        model=MODEL,
        api_key=os.getenv("GROQ_API_KEY", ""),
        max_tokens=300,
        temperature=0.7,
    )


def should_coach(move_number: int, classification: str, hint_requested: bool) -> bool:
    if hint_requested:
        return True
    if move_number <= 5:
        return True
    if classification in ("brilliant", "mistake", "blunder"):
        return True
    return False


def get_coaching_message(
    move_uci: str,
    evaluation: dict,
    classification: str,
    best_move: str,
    move_number: int,
    hint_requested: bool,
    persona_id: str = "default",
    blunder_context: str | None = None,
) -> str | None:
    if not should_coach(move_number, classification, hint_requested):
        return None

    eval_str = (
        f"Mate in {abs(evaluation['value'])}"
        if evaluation["type"] == "mate"
        else f"{evaluation['value'] / 100:+.2f} pawns (white's perspective)"
    )

    user_content = (
        f"Move played: {move_uci}\n"
        f"Classification: {classification}\n"
        f"Evaluation after move: {eval_str}\n"
        f"Engine's best move instead: {best_move}\n\n"
        "Give me your coaching feedback."
    )

    persona = get_persona(persona_id)
    system_prompt = persona.system_prompt
    if blunder_context:
        system_prompt += (
            f"\n\n[Player History]\n{blunder_context}\n"
            "Weave these patterns into your feedback naturally when relevant — "
            "don't recite them robotically."
        )

    cache_ctx = f"{classification}|{evaluation}|{best_move}"
    cached = get_cached_coaching(cache_ctx, move_uci, persona_id)
    if cached is not None:
        record_cache_hit("groq")
        return cached

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_content),
    ]

    t0 = time.perf_counter()
    try:
        response = _get_llm().invoke(messages)
        latency_ms = (time.perf_counter() - t0) * 1000
        result = str(response.content)
        tokens = getattr(response, "usage_metadata", {}).get("total_tokens", 0) if hasattr(response, "usage_metadata") else 0
        record_latency("groq", latency_ms, tokens=tokens)
        set_cached_coaching(cache_ctx, move_uci, persona_id, result)
        return result
    except Exception:
        record_error("groq", (time.perf_counter() - t0) * 1000)
        raise


def explain_why_not(
    fen: str,
    candidate_move: str,
    best_move: str,
    cpl: int,
    persona_id: str,
) -> str | None:
    """
    Explains why candidate_move is worse than best_move.
    Returns None when CPL <= 30 (move is close enough to optimal).
    """
    if cpl <= 30:
        return None

    persona = get_persona(persona_id)
    prompt = (
        f"The player is considering {candidate_move} instead of the stronger {best_move}. "
        f"This costs approximately {cpl} centipawns. "
        f"In 2-3 sentences, explain why {candidate_move} falls short and what {best_move} achieves. "
        "Stay in character."
    )
    messages = [
        SystemMessage(content=persona.system_prompt),
        HumanMessage(content=prompt),
    ]
    t0 = time.perf_counter()
    try:
        response = _get_llm().invoke(messages)
        latency_ms = (time.perf_counter() - t0) * 1000
        tokens = (
            getattr(response, "usage_metadata", {}).get("total_tokens", 0)
            if hasattr(response, "usage_metadata") else 0
        )
        record_latency("groq", latency_ms, tokens=tokens)
        return str(response.content)
    except Exception:
        record_error("groq", (time.perf_counter() - t0) * 1000)
        raise


def on_opening_identified(opening_name: str, persona_id: str) -> str:
    persona = get_persona(persona_id)
    prompt = (
        f"The player has entered the {opening_name}. "
        "Give a single, short coaching tip (1-2 sentences) about this opening's "
        "key ideas, threats, or pitfalls. Stay in character."
    )
    messages = [
        SystemMessage(content=persona.system_prompt),
        HumanMessage(content=prompt),
    ]
    t0 = time.perf_counter()
    try:
        response = _get_llm().invoke(messages)
        latency_ms = (time.perf_counter() - t0) * 1000
        tokens = (
            getattr(response, "usage_metadata", {}).get("total_tokens", 0)
            if hasattr(response, "usage_metadata") else 0
        )
        record_latency("groq", latency_ms, tokens=tokens)
        return str(response.content)
    except Exception:
        record_error("groq", (time.perf_counter() - t0) * 1000)
        raise


@lru_cache(maxsize=1)
def _get_report_llm() -> ChatGroq:
    return ChatGroq(
        model=MODEL,
        api_key=os.getenv("GROQ_API_KEY", ""),
        max_tokens=700,
        temperature=0.5,
    )


def _acpl_to_elo(acpl: float) -> int:
    if acpl < 10: return 2500
    if acpl < 20: return 2100
    if acpl < 35: return 1800
    if acpl < 55: return 1500
    if acpl < 80: return 1200
    if acpl < 110: return 900
    return 650


def generate_coach_report(
    move_log: list[dict],
    persona_id: str,
    result: str,
    opening_name: str | None = None,
    player_color: str = "white",
) -> dict:
    if len(move_log) < 3:
        raise ValueError("Game too short for report")

    cpls = [m.get("cpl", 0) for m in move_log]
    avg_cpl = sum(cpls) / len(cpls) if cpls else 0

    counts: dict[str, int] = {}
    for m in move_log:
        c = m.get("classification", "good")
        counts[c] = counts.get(c, 0) + 1

    worst_3 = sorted(
        [(i + 1, m) for i, m in enumerate(move_log)],
        key=lambda x: x[1].get("cpl", 0),
        reverse=True,
    )[:3]

    critical_str = "\n".join(
        f"  Move {n}: {m.get('san', '?')} — {m.get('classification', '?')} (CPL: {m.get('cpl', 0)})"
        for n, m in worst_3
        if m.get("cpl", 0) > 30
    ) or "  No major errors recorded"

    opening_sans = " ".join(m.get("san", "") for m in move_log[:10] if m.get("san"))
    opening_line = (
        f'Opening: {opening_name} (use this exact name for "opening_played")'
        if opening_name
        else (
            f'Opening moves played: {opening_sans}\n'
            f'Identify the opening name from these moves and use it for "opening_played". '
            f'Use your best guess — only write "Unknown" if the moves are truly unrecognizable.'
        )
    )

    prompt = (
        f"Analyze this chess game and return ONLY valid JSON with no markdown.\n\n"
        f"Player color: {player_color} | Result: {result} | Moves: {len(move_log)} | Avg CPL: {avg_cpl:.1f}\n"
        f"IMPORTANT: All moves and statistics below are from the {player_color} player's perspective only. "
        f"Refer to the player as 'you' (second person) throughout — never 'the white player' or 'the black player'.\n"
        f"Blunders: {counts.get('blunder', 0)} | Mistakes: {counts.get('mistake', 0)} | "
        f"Inaccuracies: {counts.get('inaccuracy', 0)} | Brilliant: {counts.get('brilliant', 0)}\n"
        f"{opening_line}\n"
        f"Critical mistakes:\n{critical_str}\n\n"
        'Return exactly this JSON (no extra keys, no markdown):\n'
        '{\n'
        '  "game_summary": "2-3 sentence overview of the game",\n'
        '  "opening_played": "opening name or Unknown",\n'
        '  "critical_mistakes": [{"move": "san", "issue": "brief explanation"}, ...],\n'
        '  "best_move_missed": "description of the worst missed opportunity",\n'
        '  "recurring_weakness": "one key pattern weakness",\n'
        '  "tactical_theme": "dominant tactical theme",\n'
        '  "recommended_practice": "specific actionable improvement advice"\n'
        '}'
    )

    response = _get_report_llm().invoke([
        SystemMessage(content="You are a chess coach. Return only valid JSON, no markdown fences."),
        HumanMessage(content=prompt),
    ])

    content = str(response.content).strip()
    if "```" in content:
        for part in content.split("```"):
            stripped = part.strip().lstrip("json").strip()
            if stripped.startswith("{"):
                content = stripped
                break

    report: dict = _json.loads(content)
    report["estimated_performance_rating"] = _acpl_to_elo(avg_cpl)
    return report


def explain_opponent_move(
    fen_before: str,
    engine_move_uci: str,
    persona_id: str,
) -> str:
    """Generates a persona-voiced explanation of why the AI played its last move."""
    import chess as _chess
    persona = get_persona(persona_id)

    board = _chess.Board(fen_before)
    move = _chess.Move.from_uci(engine_move_uci)
    try:
        san = board.san(move)
    except Exception:
        san = engine_move_uci

    prompt = (
        f"You just played {san} against your opponent. "
        "In 2–3 sentences, explain why this was a strong move — "
        "speak in first person, in character, concise and direct."
    )
    messages = [
        SystemMessage(content=persona.system_prompt),
        HumanMessage(content=prompt),
    ]
    t0 = time.perf_counter()
    try:
        response = _get_llm().invoke(messages)
        latency_ms = (time.perf_counter() - t0) * 1000
        tokens = (
            getattr(response, "usage_metadata", {}).get("total_tokens", 0)
            if hasattr(response, "usage_metadata") else 0
        )
        record_latency("groq", latency_ms, tokens=tokens)
        return str(response.content).strip()
    except Exception:
        record_error("groq", (time.perf_counter() - t0) * 1000)
        raise
