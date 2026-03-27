"""Post-publish HTTP calls: revalidation + newsletter notification.

Fire and forget -- catch exceptions, log, don't crash.
Port of the fetch() calls in telegram.ts approve handler.
"""

import logging

import httpx

from bot.config import settings

logger = logging.getLogger(__name__)


async def _build_headers() -> dict[str, str]:
    """Build headers with optional Authorization for internal API calls."""
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if settings.REVALIDATE_SECRET:
        headers["Authorization"] = f"Bearer {settings.REVALIDATE_SECRET}"
    return headers


async def trigger_revalidation(slug: str) -> None:
    """POST to /api/revalidate with paths to revalidate after publish."""
    app_url = settings.NEXT_PUBLIC_APP_URL
    if not app_url:
        logger.warning("[REVALIDATE] No NEXT_PUBLIC_APP_URL configured, skipping")
        return
    try:
        headers = await _build_headers()
        paths = ["/blog", f"/blog/{slug}", "/"]
        logger.info("[REVALIDATE] POST %s/api/revalidate paths=%s", app_url, paths)
        async with httpx.AsyncClient(timeout=httpx.Timeout(15.0)) as client:
            resp = await client.post(
                f"{app_url}/api/revalidate",
                json={"paths": paths},
                headers=headers,
            )
            logger.info("[REVALIDATE] Response: %s %s", resp.status_code, resp.text[:200])
    except Exception as err:
        logger.error("[REVALIDATE] FAILED: %s", err)


async def trigger_publish_notify(article_id: str) -> None:
    """POST to /api/telegram/publish-notify with articleId for newsletter."""
    app_url = settings.NEXT_PUBLIC_APP_URL
    if not app_url:
        logger.warning("[PUBLISH-NOTIFY] No NEXT_PUBLIC_APP_URL configured, skipping")
        return
    try:
        headers = await _build_headers()
        logger.info("[PUBLISH-NOTIFY] POST %s/api/telegram/publish-notify articleId=%s", app_url, article_id)
        async with httpx.AsyncClient(timeout=httpx.Timeout(15.0)) as client:
            resp = await client.post(
                f"{app_url}/api/telegram/publish-notify",
                json={"articleId": article_id},
                headers=headers,
            )
            logger.info("[PUBLISH-NOTIFY] Response: %s %s", resp.status_code, resp.text[:200])
    except Exception as err:
        logger.error("[PUBLISH-NOTIFY] FAILED: %s", err)
