import os
import time
from functools import lru_cache
from elevenlabs import ElevenLabs
from services.telemetry import record_latency, record_error

DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"  # George — available on free tier


@lru_cache(maxsize=1)
def _get_client() -> ElevenLabs:
    return ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY", ""))


def generate_speech(text: str) -> bytes:
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", DEFAULT_VOICE_ID)
    t0 = time.perf_counter()
    try:
        audio_chunks = _get_client().text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id="eleven_multilingual_v2",
        )
        result = b"".join(audio_chunks)
        record_latency("elevenlabs", (time.perf_counter() - t0) * 1000, chars=len(text))
        return result
    except Exception:
        record_error("elevenlabs", (time.perf_counter() - t0) * 1000)
        raise
