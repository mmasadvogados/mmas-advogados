"""Main entry point for the MMAS Advogados Telegram Bot.

Registers all handlers and starts polling with a background health server on port 8080.
"""

import asyncio
import logging
import threading

import uvicorn
from telegram.ext import (
    ApplicationBuilder,
    CallbackQueryHandler,
    CommandHandler,
    MessageHandler,
    filters,
)

from bot.config import settings
from bot.handlers.callbacks import callback_handler
from bot.handlers.start import logout_command, start_command
from bot.handlers.text import text_handler
from bot.handlers.voice import voice_handler

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def _start_health_server() -> None:
    """Run the FastAPI health server in a background thread."""
    from health_server import app as health_app

    config = uvicorn.Config(health_app, host="0.0.0.0", port=8080, log_level="warning")
    server = uvicorn.Server(config)
    server.run()


def main() -> None:
    """Build the bot application, register handlers, and start polling."""
    logger.info("Starting MMAS Advogados Telegram Bot...")

    # Start health server in background thread
    health_thread = threading.Thread(target=_start_health_server, daemon=True)
    health_thread.start()
    logger.info("Health server started on port 8080")

    # Build application
    app = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).build()

    # Register handlers (order matters -- commands first, then callbacks, then messages)
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("logout", logout_command))
    app.add_handler(CallbackQueryHandler(callback_handler))
    app.add_handler(MessageHandler(filters.VOICE, voice_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, text_handler))

    logger.info("Bot handlers registered. Starting polling...")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
