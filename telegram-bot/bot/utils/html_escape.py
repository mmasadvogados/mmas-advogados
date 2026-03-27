"""HTML escape utility for Telegram HTML parse mode."""


def escape_html(text: str) -> str:
    """Escape &, <, > for Telegram HTML parse mode."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
