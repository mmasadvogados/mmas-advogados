"""Callback query handler for inline keyboard buttons.

Port of bot.on("callback_query:data") from src/lib/telegram.ts.
Handles: approve, reject, regenerate, confirm_topic, reject_topic.
"""

import asyncio
import logging
from datetime import datetime, timezone
from urllib.parse import quote

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ContextTypes

from bot.config import settings
from bot.handlers.generation import handle_generation
from bot.services.database import (
    delete_article,
    get_article_by_id,
    get_latest_draft_by_user,
    get_session,
    insert_status_history,
    update_article_status,
    update_session,
)
from bot.services.publish import trigger_publish_notify, trigger_revalidation

logger = logging.getLogger(__name__)


async def _safe_edit_message(query, text: str, **kwargs) -> None:
    """Safe edit — never crashes the flow, editMessage is cosmetic only."""
    try:
        await query.edit_message_text(text, **kwargs)
    except Exception as err:
        logger.debug("editMessageText failed (non-blocking): %s", err)


async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle all callback queries from inline keyboards."""
    query = update.callback_query
    if not query or not query.data:
        return

    # ALWAYS answer callback FIRST to prevent Telegram retries
    await query.answer()

    tg_id = update.effective_user.id
    data = query.data

    try:
        session = get_session(tg_id)
        if not session or not session.get("authenticated"):
            return

        if data == "approve":
            await _handle_approve(query, tg_id, session)

        elif data == "confirm_topic":
            topic = session.get("pending_topic")
            if not topic:
                await query.message.reply_text(
                    "Tema nao encontrado. Envie o tema novamente por texto ou audio."
                )
                return
            await _safe_edit_message(
                query,
                f'Gerando artigo sobre: "{topic}"...\n\nIsso pode levar ate 60 segundos.',
            )
            await handle_generation(query.message.reply_text, tg_id, topic)

        elif data == "reject_topic":
            update_session(tg_id, bot_step="idle", pending_topic=None)
            await _safe_edit_message(query, "Ok, envie o tema correto por texto.")

        elif data == "reject":
            # Delete draft article if exists
            article_id = session.get("pending_article_id")
            if article_id:
                delete_article(article_id)
            update_session(
                tg_id,
                bot_step="idle",
                pending_article_id=None,
                pending_topic=None,
            )
            await _safe_edit_message(
                query, "Artigo descartado. Envie novo tema quando quiser."
            )

        elif data == "regenerate":
            topic = session.get("pending_topic")
            if not topic:
                await query.message.reply_text(
                    "Tema nao encontrado. Envie o tema novamente por texto ou audio."
                )
                return
            # Delete previous draft
            article_id = session.get("pending_article_id")
            if article_id:
                delete_article(article_id)
            update_session(tg_id, pending_article_id=None)
            await _safe_edit_message(query, "Regenerando artigo...")
            await handle_generation(query.message.reply_text, tg_id, topic)

        else:
            await query.message.reply_text(
                "Nenhuma acao pendente. Envie um tema para gerar novo artigo."
            )

    except Exception as err:
        error_msg = str(err)
        logger.error("Callback error: %s", error_msg, exc_info=True)
        try:
            await query.message.reply_text(
                f"Erro ao processar: {error_msg[:200]}\n\nTente novamente enviando o tema."
            )
        except Exception:
            pass
        # Only clean up lock/step -- preserve pendingArticleId and pendingTopic
        try:
            update_session(tg_id, bot_step="idle", generating_at=None)
        except Exception:
            pass


async def _handle_approve(query, tg_id: int, session: dict) -> None:
    """Handle the approve callback: publish article, fire revalidation."""
    article_id = session.get("pending_article_id")

    # Fallback: find most recent draft by this user if pendingArticleId was lost
    if not article_id and session.get("user_id"):
        recent = get_latest_draft_by_user(session["user_id"])
        article_id = recent["id"] if recent else None

    if not article_id:
        await query.message.reply_text(
            "Nenhum artigo pendente para aprovar. Envie um tema para gerar."
        )
        return

    # Read draft article from DB
    draft = get_article_by_id(article_id)
    if not draft:
        await query.message.reply_text("Artigo nao encontrado no banco. Envie novo tema.")
        update_session(
            tg_id,
            bot_step="idle",
            pending_article_id=None,
            pending_topic=None,
        )
        return

    # Update draft to published
    updated = update_article_status(
        article_id, "published", published_at=datetime.now(timezone.utc)
    )

    if not updated or updated.get("status") != "published":
        await query.message.reply_text(
            f"ERRO: Falha ao publicar artigo (ID: {draft['id']}). "
            f"Status: {updated.get('status') if updated else 'desconhecido'}. Tente novamente."
        )
        return

    if session.get("user_id"):
        insert_status_history(
            article_id=draft["id"],
            from_status="draft",
            to_status="published",
            changed_by=session["user_id"],
        )

    update_session(
        tg_id,
        bot_step="idle",
        pending_article_id=None,
        pending_topic=None,
    )

    blog_url = f"{settings.NEXT_PUBLIC_APP_URL}/blog/{updated['slug']}"
    share_text = quote(f"{draft['title']} {blog_url}")

    share_keyboard = InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("Ver no Blog", url=blog_url)],
            [
                InlineKeyboardButton(
                    "Compartilhar WhatsApp",
                    url=f"https://wa.me/?text={share_text}",
                )
            ],
        ]
    )

    await _safe_edit_message(query, "Publicado!")
    await query.message.reply_text(
        f"Artigo publicado!\n\n"
        f"Titulo: {draft['title']}\n"
        f"Status: publicado\n"
        f"Link: {blog_url}",
        reply_markup=share_keyboard,
    )

    # Trigger revalidation + newsletter via separate HTTP calls (non-blocking)
    asyncio.create_task(trigger_revalidation(updated["slug"]))
    asyncio.create_task(trigger_publish_notify(draft["id"]))
