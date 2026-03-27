from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables. Fail fast if required vars missing."""

    # Telegram
    TELEGRAM_BOT_TOKEN: str

    # Database (Supabase)
    DATABASE_URL: str

    # LLM Providers
    OPENROUTER_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    # App URL (Next.js frontend)
    NEXT_PUBLIC_APP_URL: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
