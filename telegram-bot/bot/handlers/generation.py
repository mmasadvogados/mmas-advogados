"""Shared article generation handler.

Port of handleGeneration() from src/lib/telegram.ts.
Used by both confirm_topic callback and regenerate callback.
"""

import logging
import re
import unicodedata
from datetime import datetime, timezone

from telegram import InlineKeyboardButton, InlineKeyboardMarkup

from bot.services.database import (
    get_session,
    insert_article,
    update_session,
)
from bot.services.openrouter import generate_article
from bot.utils.detection import detect_area
from bot.utils.html_escape import escape_html

logger = logging.getLogger(__name__)


def _make_slug(title: str) -> str:
    """Generate a URL-safe slug from article title. Same logic as TypeScript."""
    slug = title.lower()
    slug = unicodedata.normalize("NFD", slug)
    slug = re.sub(r"[\u0300-\u036f]", "", slug)  # strip accents
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")[:100]
    # Append base-36 timestamp for uniqueness
    ts = int(datetime.now(timezone.utc).timestamp() * 1000)
    # Convert to base 36
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    base36 = ""
    n = ts
    while n:
        base36 = digits[n % 36] + base36
        n //= 36
    return f"{slug}-{base36}"


async def handle_generation(reply_fn, tg_id: int, topic: str) -> None:
    """Generate an article and show preview with Aprovar/Rejeitar/Regenerar buttons.

    Args:
        reply_fn: Async callable(text, **kwargs) to send a message (update.message.reply_text or similar).
        tg_id: Telegram user ID.
        topic: Article topic string.
    """
    try:
        # Set generation lock
        update_session(
            tg_id,
            generating_at=datetime.now(timezone.utc),
            bot_step="idle",
        )

        area = detect_area(topic)
        article = await generate_article(topic=topic, area=area, length="medium", tone="technical")

        session = get_session(tg_id)

        # Save as draft article in DB
        slug = _make_slug(article.title)

        saved = insert_article(
            title=article.title,
            slug=slug,
            body=article.body,
            summary=article.summary,
            tags=article.tags,
            seo_description=article.seo_description,
            author_id=session.get("user_id") if session else None,
            source="telegram",
            status="draft",
        )

        # Update session: clear lock, store pending article reference
        update_session(
            tg_id,
            generating_at=None,
            pending_topic=topic,
            pending_article_id=saved["id"],
            bot_step="idle",
        )

        area_label = f"\nArea detectada: {escape_html(area)}" if area else ""

        # Count article stats
        word_count = len(article.body.split())
        section_count = len(re.findall(r"^##\s", article.body, re.MULTILINE))

        # Show beginning of actual article body (truncated to fit Telegram 4096 char limit)
        body_lines = [line for line in article.body.split("\n") if line.strip()]
        body_preview = ""
        for line in body_lines:
            if len(body_preview) + len(line) > 2500:
                break
            body_preview += line + "\n"
        body_preview = escape_html(body_preview.strip())

        preview = (
            f"<b>{escape_html(article.title)}</b>\n\n"
            f"<i>{escape_html(article.summary)}</i>\n"
            f"{area_label}\n"
            f"Tags: {' '.join('#' + escape_html(t) for t in article.tags)}\n\n"
            f"--- Preview do artigo ---\n\n"
            f"{body_preview}\n\n"
            f"--- Fim do preview ---\n"
            f"Palavras: {word_count} | Secoes: {section_count}"
        )

        keyboard = InlineKeyboardMarkup(
            [
                [
                    InlineKeyboardButton("Aprovar", callback_data="approve"),
                    InlineKeyboardButton("Rejeitar", callback_data="reject"),
                ],
                [
                    InlineKeyboardButton("Regenerar", callback_data="regenerate"),
                ],
            ]
        )

        # Telegram max message length is 4096 chars
        final_preview = (
            preview if len(preview) <= 4000
            else preview[:3950] + "\n\n... (preview truncado)"
        )

        await reply_fn(final_preview, parse_mode="HTML", reply_markup=keyboard)

    except Exception as err:
        error_msg = str(err)
        logger.error("Generation error: %s", error_msg, exc_info=True)
        # Clear lock on error
        try:
            update_session(tg_id, generating_at=None, bot_step="idle")
        except Exception:
            pass
        # Send as plain text (no Markdown) to avoid double failure
        await reply_fn(f"Falha ao gerar artigo: {error_msg[:200]}")
