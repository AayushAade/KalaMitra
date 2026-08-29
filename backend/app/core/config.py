"""Backend application configuration module."""

from dataclasses import dataclass, field
import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load root .env if present
_env_path = Path(__file__).resolve().parents[3] / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
else:
    load_dotenv()


def _parse_cors_origins(raw: str) -> List[str]:
    """Parse comma-separated CORS origins from environment."""
    if not raw or raw.strip() == "*":
        return ["*"]
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@dataclass(frozen=True)
class Settings:
    """Backend application settings."""
    app_name: str = "KalaMitra API"
    app_version: str = "0.1.0"
    app_description: str = "AI-Powered Digital Storefront & Multimodal Services for Indian Artisans"
    api_v1_str: str = "/api/v1"
    cors_origins: List[str] = field(
        default_factory=lambda: _parse_cors_origins(os.getenv("CORS_ORIGINS", "*"))
    )


_settings: Settings = Settings()


def get_settings() -> Settings:
    """Return immutable application settings instance."""
    return _settings
