import re

MAX_USERNAME_LENGTH = 32
MAX_OPENING_LENGTH = 64
MAX_SAN_LENGTH = 10
MAX_FEN_LENGTH = 100

INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous\s+)?instructions",
    r"you\s+are\s+now",
    r"act\s+as",
    r"pretend\s+(you\s+are|to\s+be)",
    r"disregard\s+(all\s+)?(previous\s+)?",
    r"system\s*prompt",
    r"jailbreak",
    r"DAN",
    r"<\s*script",
    r"prompt\s*injection",
]


def sanitize_user_string(value: str, max_length: int, field_name: str) -> str:
    """
    Sanitize a user-supplied string before LLM prompt interpolation.
    - Strips leading/trailing whitespace
    - Truncates to max_length
    - Detects and rejects known injection patterns
    - Removes characters that have no place in chess context
    Returns the sanitized string, or a safe placeholder if injection is detected.
    """
    if not isinstance(value, str):
        return f"[invalid {field_name}]"

    value = value.strip()[:max_length]

    # Check for injection patterns (case-insensitive)
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            # Log the attempt — don't expose detection to the user
            print(f"[SECURITY] Injection pattern detected in {field_name}: {repr(value[:50])}")
            return f"[{field_name} unavailable]"

    # Strip characters that have no legitimate chess or username purpose
    # Keep: alphanumeric, spaces, hyphens, underscores, periods, chess notation chars
    value = re.sub(r"[^\w\s\-\.\,\!\?\'\"\/\+\#\=\(\)x]", "", value)

    return value


def sanitize_fen(fen: str) -> str:
    """FEN strings have a known format — validate against it."""
    fen = fen.strip()[:MAX_FEN_LENGTH]
    # Basic FEN validation: should contain only valid FEN characters
    # a-h covers en passant target square file (e.g. "e3" in "KQkq e3 0 1")
    if not re.match(r"^[rnbqkpRNBQKP1-8/\s\-wbKQkqa-h0-9]+$", fen):
        print(f"[SECURITY] Invalid FEN detected: {repr(fen[:50])}")
        return "[invalid position]"
    return fen


def sanitize_san(san: str) -> str:
    """SAN move notation has a known format."""
    san = san.strip()[:MAX_SAN_LENGTH]
    if not re.match(r"^[RNBQK]?[a-h]?[1-8]?x?[a-h][1-8](=[RNBQ])?[\+#]?$|^O-O(-O)?[\+#]?$", san):
        return "[move]"
    return san
