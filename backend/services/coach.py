import os
from functools import lru_cache
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

MODEL = "gemini-1.5-flash"


@lru_cache(maxsize=1)
def _get_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=MODEL,
        google_api_key=os.getenv("GOOGLE_API_KEY", ""),
        max_output_tokens=300,
        temperature=0.7,
    )

_SYSTEM_PROMPT = """\
You are an expert chess coach providing real-time feedback during a live game.

After each move you receive the move played, the position evaluation, the move \
classification, and the engine's best alternative. Your job is to give the player \
a short, insightful coaching note.

Rules:
- 2–3 sentences maximum. Be concise.
- Explain WHY the move was strong or weak — not just the classification label.
- If it was a mistake or blunder, briefly indicate what the better idea was.
- If it was good or brilliant, reinforce the strategic concept behind it.
- Keep the tone calm and analytical. Do not repeat the raw eval number.
- Do not use algebraic chess notation beyond the UCI move itself.\
"""


def get_coaching_message(
    move_uci: str,
    evaluation: dict,
    classification: str,
    best_move: str,
) -> str:
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

    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(content=user_content),
    ]

    response = _get_llm().invoke(messages)
    return str(response.content)
