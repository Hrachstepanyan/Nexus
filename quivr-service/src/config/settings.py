"""Application configuration management."""
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with validation."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # API Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    env: Literal["development", "production", "test"] = "development"

    # LLM Providers
    anthropic_api_key: str
    openai_api_key: str | None = None
    mistral_api_key: str | None = None

    # Storage
    brains_storage_path: Path = Path("./brains_data")

    # Logging
    log_level: str = "INFO"

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.env == "development"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.brains_storage_path.mkdir(parents=True, exist_ok=True)


settings = Settings()
