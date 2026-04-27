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
# Caps debate calls at DEBATE_CAP per game session to prevent Groq saturation
# during blunder-heavy games. Keyed by session identifier (user_id or IP).
DEBATE_CAP = 10
_debate_counts: dict[str, int] = {}


def reset_debate_counter(session_key: str) -> None:
    """Reset the per-session debate counter. Call on game start."""
    _debate_counts.pop(session_key, None)


@lru_cache(maxsize=1)
def _get_llm() -> ChatGroq:
    return ChatGroq(
        model=MODEL,
        api_key=os.getenv("GROQ_API_KEY", ""),
        max_tokens=150,
        temperature=0.65,
    )


def get_debate_transcript(
    top_lines: list[dict],
    cpl: int,
    persona_id: str,
    session_key: str = "default",
) -> tuple[list[dict] | None, bool]:
    """
    Build a 3-agent debate transcript when the player made a significant error (CPL > 50).
    top_lines — pre-computed MultiPV candidates: [{"move": "e2e4", "cp": 45}, ...]
    Calls Groq exactly once (Final Arbiter summary). Everything else is deterministic.
    Returns (transcript, debate_skipped). debate_skipped=True when the circuit breaker fires.
    """
    if cpl <= 50 or len(top_lines) < 2:
        return None, False

    current_count = _debate_counts.get(session_key, 0)
    if current_count >= DEBATE_CAP:
        return None, True
    _debate_counts[session_key] = current_count + 1

    lines = top_lines[:3]
    transcript: list[dict] = []

    for i, line in enumerate(lines):
        role = _AGENT_ROLES[i % len(_AGENT_ROLES)]
        cp_str = f"{line['cp'] / 100:+.2f}"
        transcript.append({
            "agent": role["name"],
            "move": line["move"],
            "argument": (
                f"Advocates {line['move']} (score {cp_str}) — "
                f"strongest from a {role['focus']} perspective."
            ),
        })

    persona = get_persona(persona_id)
    debate_text = "\n".join(
        f"{e['agent']} advocates {e['move']}: {e['argument']}"
        for e in transcript
    )
    prompt = (
        f"Your internal sub-agents just debated the best move:\n{debate_text}\n\n"
        "As the Final Arbiter, give a single sentence ruling — which move wins the debate "
        "and why. Stay in character."
    )

    t0 = time.perf_counter()
    try:
        response = _get_llm().invoke([
            SystemMessage(content=persona.system_prompt),
            HumanMessage(content=prompt),
        ])
        latency_ms = (time.perf_counter() - t0) * 1000
        tokens = (
            getattr(response, "usage_metadata", {}).get("total_tokens", 0)
            if hasattr(response, "usage_metadata") else 0
        )
        record_latency("groq", latency_ms, tokens=tokens)
        arbiter = str(response.content)
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
