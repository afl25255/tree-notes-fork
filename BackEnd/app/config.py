from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_REPO_ROOT = _BACKEND_ROOT.parent


def _normalize_database_url(url: str) -> str:
    """Normalize Postgres URLs for SQLAlchemy: accept postgres://; leave sslmode to the caller or connection string."""
    u = (url or "").strip()
    if not u:
        return u
    if u.startswith("postgres://"):
        u = "postgresql://" + u[len("postgres://") :]
    if "sslmode=" in u.lower():
        return u
    return u


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            _BACKEND_ROOT / ".env",
            _REPO_ROOT / ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+psycopg2://postgres:changeme@127.0.0.1:5432/treenotes"
    cors_origins: str = "http://127.0.0.1:8080,http://localhost:8080"

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, v: object) -> object:
        if isinstance(v, str):
            return _normalize_database_url(v)
        return v

    # AI: auto = Gemini if GEMINI_API_KEY is set, OpenAI if OPENAI_API_KEY is set, else placeholder.
    # Supported values: auto | gemini | openai | ollama | placeholder
    ai_provider: str = "auto"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    openai_api_key: str = ""
    openai_model: str = "gpt-5-mini"
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "llama3"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
