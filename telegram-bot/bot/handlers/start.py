"""/start and /logout command handlers.

Port of the command handlers from src/lib/telegram.ts.
"""

import logging
from concurrent.futures import ThreadPoolExecutor

import bcrypt
from telegram import Update
from telegram.ext import ContextTypes

from bot.services.database import (
    create_session,
    get_all_users,
    get_session,
    update_session,
)

logger = logging.getLogger(__name__)

# Thread pool for blocking bcrypt operations
_executor = ThreadPoolExecutor(max_workers=2)


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/start -- create or update session, set awaiting_password."""
    if not update.effective_user:
        return
    tg_id = update.effective_user.id

    session = get_session(tg_id)

    if session and session.get("authenticated"):
        await update.message.reply_text(
            'Voce ja esta autenticado! Envie um tema para gerar artigo.\n\n'
            'Exemplo: "Direitos do consumidor em compras online"'
        )
        return

    if session:
        update_session(tg_id, bot_step="awaiting_password")
    else:
        create_session(tg_id, authenticated=False, bot_step="awaiting_password")

    await update.message.reply_text(
        "Bem-vindo ao MMAS Artigos Bot!\n\nDigite sua senha para autenticar:"
    )


async def logout_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/logout -- clear session."""
    if not update.effective_user:
        return
    tg_id = update.effective_user.id

    update_session(
        tg_id,
        authenticated=False,
        bot_step="idle",
        pending_topic=None,
        pending_article_id=None,
        generating_at=None,
    )

    await update.message.reply_text(
        "Sessao encerrada. Use /start para autenticar novamente."
    )


def _check_password(plain: str, hashed: str) -> bool:
    """Synchronous bcrypt check."""
    if isinstance(hashed, str):
        hashed = hashed.encode("utf-8")
    if isinstance(plain, str):
        plain = plain.encode("utf-8")
    return bcrypt.checkpw(plain, hashed)


async def handle_password(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    """Handle password auth flow. Returns True if message was consumed (password step).

    Called from the text handler when session.bot_step == 'awaiting_password'.
    """
    if not update.effective_user or not update.message:
        return False

    tg_id = update.effective_user.id
    text = update.message.text

    session = get_session(tg_id)
    if not session or session.get("bot_step") != "awaiting_password":
        return False

    all_users = get_all_users()
    authenticated_user = None

    import asyncio

    loop = asyncio.get_event_loop()
    for user in all_users:
        match = await loop.run_in_executor(
            _executor, _check_password, text, user["password_hash"]
        )
        if match:
            authenticated_user = user
            break

    if not authenticated_user:
        await update.message.reply_text("Senha incorreta. Tente novamente:")
        return True

    update_session(
        tg_id,
        authenticated=True,
        user_id=authenticated_user["id"],
        bot_step="idle",
    )

    await update.message.reply_text(
        'Autenticado! Envie um tema para gerar artigo.\n\n'
        'Exemplo: "Direitos do consumidor em compras online"'
    )
    return True
