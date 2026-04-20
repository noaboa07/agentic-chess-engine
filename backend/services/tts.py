import os
from functools import lru_cache
from elevenlabs import ElevenLabs

DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"  # George — available on free tier


@lru_cache(maxsize=1)
def _get_client() -> ElevenLabs:
    return ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY", ""))


def generate_speech(text: str) -> bytes:
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", DEFAULT_VOICE_ID)
    audio_chunks = _get_client().text_to_speech.convert(
        voice_id=voice_id,
        text=text,
        model_id="eleven_multilingual_v2",
    )
    return b"".join(audio_chunks)
