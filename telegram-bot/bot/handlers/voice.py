"""Voice message handler.

Port of bot.on("message:voice") from src/lib/telegram.ts.
Downloads voice file, sends to Groq STT, shows confirmation.
"""

import logging
from datetime import datetime, timezone

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ContextTypes

from bot.services.database import get_session, update_session
from bot.services.groq_stt import transcribe_audio
from bot.utils.html_escape import escape_html

logger = logging.getLogger(__name__)


def _is_generation_locked(session: dict) -> bool:
    """Check if generation is locked (120s window)."""
    gen_at = session.get("generating_at")
    if not gen_at:
        return False
    if isinstance(gen_at, str):
        gen_at = datetime.fromisoformat(gen_at)
    if gen_at.tzinfo is None:
        gen_at = gen_at.replace(tzinfo=timezone.utc)
    elapsed = (datetime.now(timezone.utc) - gen_at).total_seconds()
    return elapsed < 120


async def voice_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle voice messages: transcribe and show topic confirmation."""
    if not update.effective_user or not update.message or not update.message.voice:
        return

    tg_id = update.effective_user.id
    session = get_session(tg_id)

    if not session or not session.get("authenticated"):
        await update.message.reply_text("Use /start para autenticar primeiro.")
        return

    # Check generation lock
    if _is_generation_locked(session):
        await update.message.reply_text("Ja estou gerando um artigo. Aguarde a conclusao.")
        return

    await update.message.reply_text("Transcrevendo audio...")

    try:
        # Download voice file from Telegram
        voice_file = await update.message.voice.get_file()
        audio_bytes = await voice_file.download_as_bytearray()

        transcription = await transcribe_audio(bytes(audio_bytes))

        if not transcription or len(transcription) < 3:
            await update.message.reply_text(
                "Nao consegui transcrever o audio. Tente novamente ou digite o tema."
            )
            return

        # Store pending topic in DB and set awaiting_confirmation
        update_session(
            tg_id,
            bot_step="awaiting_confirmation",
            pending_topic=transcription,
        )

        keyboard = InlineKeyboardMarkup(
            [
                [
                    InlineKeyboardButton("Sim, gerar artigo", callback_data="confirm_topic"),
                    InlineKeyboardButton("Nao, corrigir", callback_data="reject_topic"),
                ]
            ]
        )

        await update.message.reply_text(
            f"Transcricao: <b>{escape_html(transcription)}</b>\n\nGerar artigo sobre este tema?",
            parse_mode="HTML",
            reply_markup=keyboard,
        )

    except Exception as err:
        logger.error("STT error: %s", err, exc_info=True)
        await update.message.reply_text("Erro ao transcrever audio. Tente digitar o tema.")
