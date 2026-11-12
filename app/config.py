from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Localiza la raíz del proyecto (dos niveles arriba de app/config.py)
ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
        extra="ignore"
    )

    meta_app_secret: str
    meta_webhook_verify_token: str
    whatsapp_phone_number_id: str
    whatsapp_access_token: str

    openai_api_key: str
    openai_model: str

    redis_url: str = "redis://localhost:6379/0"
    database_url: str

    debounce_seconds: float = 2.5
    rate_limit_per_minute: int = 20

    groq_api_key: str | None = None
    crm_webhook_url: str | None = None
    escalation_webhook_url: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()