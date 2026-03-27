"""Database service using psycopg2 with connection pooling.

Tables: telegram_sessions, articles, users, article_status_history, newsletter_logs.
Connection string from DATABASE_URL env var (Supabase format with ?sslmode=require).
"""

import logging
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Optional

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor

from bot.config import settings

logger = logging.getLogger(__name__)

# Connection pool (min 1, max 10 connections)
_pool: Optional[pool.ThreadedConnectionPool] = None


def get_pool() -> pool.ThreadedConnectionPool:
    global _pool
    if _pool is None or _pool.closed:
        _pool = pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=settings.DATABASE_URL,
        )
    return _pool


@contextmanager
def get_conn():
    """Get a connection from the pool, auto-return on exit."""
    p = get_pool()
    conn = p.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        p.putconn(conn)


# ---------------------------------------------------------------------------
# Telegram Sessions
# ---------------------------------------------------------------------------


def get_session(tg_id: int) -> Optional[dict]:
    """Fetch telegram_sessions row by telegram_user_id."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM telegram_sessions WHERE telegram_user_id = %s LIMIT 1",
                (tg_id,),
            )
            row = cur.fetchone()
            return dict(row) if row else None


def create_session(tg_id: int, authenticated: bool = False, bot_step: str = "idle") -> dict:
    """Insert a new telegram_sessions row."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """INSERT INTO telegram_sessions (telegram_user_id, authenticated, bot_step)
                   VALUES (%s, %s, %s) RETURNING *""",
                (tg_id, authenticated, bot_step),
            )
            row = cur.fetchone()
            return dict(row)


def update_session(tg_id: int, **data: Any) -> None:
    """Update telegram_sessions fields for a given telegram_user_id.

    Accepts keyword arguments mapping column names (snake_case) to values.
    Supported fields: bot_step, pending_topic, pending_article_id,
    generating_at, authenticated, user_id.
    """
    if not data:
        return

    # Map Python-friendly names to DB column names
    col_map = {
        "bot_step": "bot_step",
        "pending_topic": "pending_topic",
        "pending_article_id": "pending_article_id",
        "generating_at": "generating_at",
        "authenticated": "authenticated",
        "user_id": "user_id",
    }

    sets = []
    vals = []
    for key, value in data.items():
        col = col_map.get(key)
        if col is None:
            raise ValueError(f"Unknown session field: {key}")
        sets.append(f"{col} = %s")
        vals.append(value)

    vals.append(tg_id)

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE telegram_sessions SET {', '.join(sets)} WHERE telegram_user_id = %s",
                vals,
            )


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


def get_all_users() -> list[dict]:
    """Return all users (for password auth check)."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM users")
            return [dict(r) for r in cur.fetchall()]


def get_user_by_id(user_id: str) -> Optional[dict]:
    """Fetch a single user by UUID."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM users WHERE id = %s LIMIT 1", (user_id,))
            row = cur.fetchone()
            return dict(row) if row else None


# ---------------------------------------------------------------------------
# Articles
# ---------------------------------------------------------------------------


def insert_article(
    title: str,
    slug: str,
    body: str,
    summary: Optional[str],
    tags: list[str],
    seo_description: Optional[str],
    author_id: Optional[str],
    source: str = "telegram",
    status: str = "draft",
) -> dict:
    """Insert a new article and return the row."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """INSERT INTO articles
                   (title, slug, body, summary, tags, seo_description, author_id, source, status)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                   RETURNING *""",
                (title, slug, body, summary, tags, seo_description, author_id, source, status),
            )
            row = cur.fetchone()
            return dict(row)


def get_article_by_id(article_id: str) -> Optional[dict]:
    """Fetch a single article by UUID."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM articles WHERE id = %s LIMIT 1", (article_id,))
            row = cur.fetchone()
            return dict(row) if row else None


def update_article_status(article_id: str, status: str, published_at: Optional[datetime] = None) -> Optional[dict]:
    """Update article status and optionally published_at. Returns updated row."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if published_at:
                cur.execute(
                    """UPDATE articles SET status = %s, published_at = %s
                       WHERE id = %s RETURNING id, status, slug""",
                    (status, published_at, article_id),
                )
            else:
                cur.execute(
                    """UPDATE articles SET status = %s
                       WHERE id = %s RETURNING id, status, slug""",
                    (status, article_id),
                )
            row = cur.fetchone()
            return dict(row) if row else None


def delete_article(article_id: str) -> None:
    """Delete an article by UUID."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM articles WHERE id = %s", (article_id,))


def get_latest_draft_by_user(user_id: str) -> Optional[dict]:
    """Find the most recent draft telegram article by a user."""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """SELECT id FROM articles
                   WHERE author_id = %s AND status = 'draft' AND source = 'telegram'
                   ORDER BY created_at DESC LIMIT 1""",
                (user_id,),
            )
            row = cur.fetchone()
            return dict(row) if row else None


# ---------------------------------------------------------------------------
# Article Status History
# ---------------------------------------------------------------------------


def insert_status_history(article_id: str, from_status: str, to_status: str, changed_by: str) -> None:
    """Insert an article_status_history row."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO article_status_history (article_id, from_status, to_status, changed_by)
                   VALUES (%s, %s, %s, %s)""",
                (article_id, from_status, to_status, changed_by),
            )
