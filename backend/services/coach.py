import os
from functools import lru_cache
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from personas.personas import get_persona

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
    messages = [
        SystemMessage(content=persona.system_prompt),
        HumanMessage(content=user_content),
    ]

    response = _get_llm().invoke(messages)
    return str(response.content)
