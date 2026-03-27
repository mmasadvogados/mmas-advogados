"""Speech-to-text service using Groq Whisper.

Port of src/lib/groq.ts.
Model: whisper-large-v3, language: pt, response_format: text.
Timeout: 30s.
"""

import logging

import httpx

from bot.config import settings

logger = logging.getLogger(__name__)

GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions"


async def transcribe_audio(audio_bytes: bytes) -> str:
    """Transcribe audio bytes (OGG) to text using Groq Whisper.

    Args:
        audio_bytes: Raw audio file bytes (OGG format from Telegram).

    Returns:
        Transcribed text string.

    Raises:
        RuntimeError: If transcription fails.
    """
    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
        response = await client.post(
            GROQ_STT_URL,
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            },
            files={
                "file": ("audio.ogg", audio_bytes, "audio/ogg"),
            },
            data={
                "model": "whisper-large-v3",
                "language": "pt",
                "response_format": "text",
            },
        )

        if response.status_code != 200:
            raise RuntimeError(f"Groq STT failed: {response.status_code}")

        return response.text.strip()
