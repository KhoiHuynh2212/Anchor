import base64
import httpx
from app.config import settings


async def text_to_speech(text: str) -> bytes:
    """Convert text to speech using ElevenLabs API. Returns audio bytes."""
    if not settings.elevenlabs_api_key or not settings.elevenlabs_voice_id:
        return b""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{settings.elevenlabs_voice_id}",
                headers={
                    "xi-api-key": settings.elevenlabs_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "model_id": "eleven_turbo_v2_5",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75,
                        "style": 0.3,
                    },
                },
            )
            if response.status_code == 200:
                return response.content
    except Exception as e:
        print(f"ElevenLabs TTS error: {e}")
    return b""


async def text_to_speech_base64(text: str) -> str:
    """Convert text to speech and return as base64 data URI."""
    audio_bytes = await text_to_speech(text)
    if not audio_bytes:
        return ""
    b64 = base64.b64encode(audio_bytes).decode("utf-8")
    return f"data:audio/mpeg;base64,{b64}"


async def speech_to_text(audio_base64: str) -> str:
    """Convert speech (base64 audio) to text using ElevenLabs STT API."""
    if not settings.elevenlabs_api_key:
        return ""

    try:
        # Decode base64 audio
        if audio_base64.startswith("data:"):
            audio_base64 = audio_base64.split(",", 1)[1]
        audio_bytes = base64.b64decode(audio_base64)

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.elevenlabs.io/v1/speech-to-text",
                headers={"xi-api-key": settings.elevenlabs_api_key},
                files={"file": ("audio.m4a", audio_bytes, "audio/m4a")},
                data={"model_id": "scribe_v1"},
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("text", "")
    except Exception as e:
        print(f"ElevenLabs STT error: {e}")
    return ""
