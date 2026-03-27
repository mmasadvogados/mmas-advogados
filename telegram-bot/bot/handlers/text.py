"""Text message handler.

Port of bot.on("message:text") from src/lib/telegram.ts.
Handles: password auth, casual replies, generation lock, topic confirmation.
"""

import logging
from datetime import datetime, timezone

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ContextTypes

from bot.handlers.start import handle_password
from bot.services.database import get_session, update_session
from bot.utils.detection import detect_area, get_casual_reply
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


async def text_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle all non-command text messages."""
    if not update.effective_user or not update.message or not update.message.text:
        return

    tg_id = update.effective_user.id
    text = update.message.text

    # Password auth flow (consumed if in awaiting_password step)
    consumed = await handle_password(update, context)
    if consumed:
        return

    # Check auth
    session = get_session(tg_id)
    if not session or not session.get("authenticated"):
        await update.message.reply_text("Use /start para autenticar primeiro.")
        return

    # Friendly response to casual messages
    casual_reply = get_casual_reply(text)
    if casual_reply:
        await update.message.reply_text(casual_reply)
        return

    # Check generation lock
    if _is_generation_locked(session):
        await update.message.reply_text("Ja estou gerando um artigo. Aguarde a conclusao.")
        return

    # Confirmation step: store topic, ask before generating
    update_session(tg_id, bot_step="awaiting_confirmation", pending_topic=text)

    detected_area = detect_area(text)
    area_hint = f"\nArea detectada: {detected_area}" if detected_area else ""

    keyboard = InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton("Sim, gerar artigo", callback_data="confirm_topic"),
                InlineKeyboardButton("Cancelar", callback_data="reject_topic"),
            ]
        ]
    )

    await update.message.reply_text(
        f'Gerar artigo sobre: <b>{escape_html(text)}</b>?{area_hint}\n\n'
        f"(Geracao leva ate 60 segundos)",
        parse_mode="HTML",
        reply_markup=keyboard,
    )
