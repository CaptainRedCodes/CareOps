from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration — all values sourced from environment variables."""
    model_config = SettingsConfigDict(
        # Load .env and .env.local from parent dir (for when running from backend/)
        # or current dir (fallback)
        env_file=("../.env", "../.env.local", ".env", ".env.local"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str

    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/oauth/google/callback"

    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15

    # SMTP (email)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@careops.app"

    # Token lifetimes
    EMAIL_TOKEN_EXPIRE_HOURS: int = 24
    INVITATION_TOKEN_EXPIRE_DAYS: int = 7


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (read once per process)."""
    return Settings()
