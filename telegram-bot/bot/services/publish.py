"""Post-publish HTTP calls: revalidation + newsletter notification.

Fire and forget -- catch exceptions, log, don't crash.
Port of the fetch() calls in telegram.ts approve handler.
"""

import logging

import httpx

from bot.config import settings

logger = logging.getLogger(__name__)


async def trigger_revalidation(slug: str) -> None:
    """POST to /api/revalidate with paths to revalidate after publish."""
    app_url = settings.NEXT_PUBLIC_APP_URL
    if not app_url:
        return
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
            await client.post(
                f"{app_url}/api/revalidate",
                json={"paths": ["/blog", f"/blog/{slug}", "/"]},
            )
    except Exception as err:
        logger.warning("Revalidation failed: %s", err)


async def trigger_publish_notify(article_id: str) -> None:
    """POST to /api/telegram/publish-notify with articleId for newsletter."""
    app_url = settings.NEXT_PUBLIC_APP_URL
    if not app_url:
        return
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
            await client.post(
                f"{app_url}/api/telegram/publish-notify",
                json={"articleId": article_id},
            )
    except Exception as err:
        logger.warning("Publish notify failed: %s", err)
