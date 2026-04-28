import os
import time
from functools import lru_cache
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from personas.personas import get_persona
from services.telemetry import record_latency, record_error

MODEL = "llama-3.3-70b-versatile"

_AGENT_ROLES = [
    {"name": "Tactician",  "focus": "material gain, tactics, and forcing sequences"},
    {"name": "Positional", "focus": "pawn structure, piece activity, and long-term strategy"},
    {"name": "Safety",     "focus": "king safety and avoiding unnecessary risks"},
]

# ── Debate circuit breaker ────────────────────────────────────────────────────
# Caps debate calls at DEBATE_CAP per game to prevent Groq saturation during
# blunder-heavy games. Counter is reset at game start via reset_debate_counter().
DEBATE_CAP = 10
_debate_counts: dict[str, int] = {}


def reset_debate_counter(session_key: str) -> None:
    """Reset the per-game debate counter. Called on game start (engine-first-move + move 1)."""
    _debate_counts.pop(session_key, None)


@lru_cache(maxsize=1)
def _get_sub_llm() -> ChatGroq:
    """Lightweight LLM for the 3 analytical sub-agents — short focused responses."""
    return ChatGroq(
        model=MODEL,
        api_key=os.getenv("GROQ_API_KEY", ""),
        max_tokens=80,
        temperature=0.6,
    )


@lru_cache(maxsize=1)
def _get_arbiter_llm() -> ChatGroq:
    """LLM for the Final Arbiter — persona-aware synthesis."""
    return ChatGroq(
        model=MODEL,
        api_key=os.getenv("GROQ_API_KEY", ""),
        max_tokens=150,
        temperature=0.65,
    )


def _run_sub_agent(role: dict, lines: list[dict], fen: str) -> str:
    """
    Single LLM call for one debate sub-agent.
    Falls back to a minimal template string if the LLM call fails.
    """
    moves_str = ", ".join(
        f"{line['move']} ({line['cp'] / 100:+.2f})" for line in lines
    )
    prompt = (
        f"Chess position (FEN): {fen}\n"
        f"Candidate moves: {moves_str}\n\n"
        f"You are the {role['name']} — focused on {role['focus']}. "
        f"In 1-2 sentences, argue for the move you prefer from your perspective. "
        f"Be specific about what it achieves in THIS position."
    )
    system = (
        f"You are a chess analysis sub-agent specializing in {role['focus']}. "
        "Be concise and specific. No fluff — name the move and explain why it's best from your lens."
    )
    t0 = time.perf_counter()
    try:
        response = _get_sub_llm().invoke([
            SystemMessage(content=system),
            HumanMessage(content=prompt),
        ])
        latency_ms = (time.perf_counter() - t0) * 1000
        tokens = (
            getattr(response, "usage_metadata", {}).get("total_tokens", 0)
            if hasattr(response, "usage_metadata") else 0
        )
        record_latency("groq", latency_ms, tokens=tokens)
        return str(response.content).strip()
    except Exception:
        record_error("groq", (time.perf_counter() - t0) * 1000)
        # Minimal fallback so the transcript isn't empty
        best = lines[0]
        return (
            f"I advocate {best['move']} ({best['cp'] / 100:+.2f}) "
            f"as the strongest choice from a {role['focus']} standpoint."
        )


def get_debate_transcript(
    top_lines: list[dict],
    cpl: int,
    persona_id: str,
    session_key: str = "default",
    fen: str = "",
) -> tuple[list[dict] | None, bool]:
    """
    Build a 4-entry debate transcript (3 sub-agents + Final Arbiter) when the
    player made a meaningful error (CPL > 30).

    top_lines — pre-computed MultiPV candidates: [{"move": "e2e4", "cp": 45}, ...]
    fen       — FEN of the position BEFORE the player's move (for sub-agent context)

    Returns (transcript, debate_skipped).
    debate_skipped=True only when the circuit breaker has fired for this game.
    """
    if cpl <= 30 or len(top_lines) < 2:
        return None, False

    current_count = _debate_counts.get(session_key, 0)
    if current_count >= DEBATE_CAP:
        return None, True
    _debate_counts[session_key] = current_count + 1

    lines = top_lines[:3]
    transcript: list[dict] = []

    # Each sub-agent makes a real LLM call with their analytical lens
    for i, role in enumerate(_AGENT_ROLES):
        argument = _run_sub_agent(role, lines, fen)
        transcript.append({
            "agent": role["name"],
            "move": lines[i % len(lines)]["move"],
            "argument": argument,
        })

    # Final Arbiter: persona-aware synthesis of the sub-agents' debate
    persona = get_persona(persona_id)
    debate_text = "\n".join(
        f"{e['agent']} advocates {e['move']}: {e['argument']}"
        for e in transcript
    )
    arbiter_prompt = (
        f"Your internal sub-agents just debated the best move:\n{debate_text}\n\n"
        "As the Final Arbiter, give a single sentence ruling — which move wins the debate "
        "and why. Stay in character."
    )

    t0 = time.perf_counter()
    try:
        response = _get_arbiter_llm().invoke([
            SystemMessage(content=persona.system_prompt),
            HumanMessage(content=arbiter_prompt),
        ])
        latency_ms = (time.perf_counter() - t0) * 1000
        tokens = (
            getattr(response, "usage_metadata", {}).get("total_tokens", 0)
            if hasattr(response, "usage_metadata") else 0
        )
        record_latency("groq", latency_ms, tokens=tokens)
        arbiter = str(response.content).strip()
    except Exception:
        record_error("groq", (time.perf_counter() - t0) * 1000)
        arbiter = None

    if arbiter:
        transcript.append({
            "agent": "Final Arbiter",
            "move": lines[0]["move"],
            "argument": arbiter,
        })

    return transcript, False
