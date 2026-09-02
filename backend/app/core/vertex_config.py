"""Vertex AI Configuration Module for KalaMitra API.

Reads and validates Google Cloud / Vertex AI environment variables securely.
Supports Application Default Credentials (ADC) and configurable image models.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load root .env if present
_env_path = Path(__file__).resolve().parents[3] / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
else:
    load_dotenv()

DEFAULT_VERTEX_LOCATION = "global"
DEFAULT_VERTEX_IMAGE_MODEL = "gemini-3.1-flash-image"
DEFAULT_VERTEX_TIMEOUT_SECONDS = 60


@dataclass(frozen=True)
class VertexAISettings:
    """Immutable and sanitized container for Vertex AI settings."""
    project_id: Optional[str]
    location: str = DEFAULT_VERTEX_LOCATION
    image_model: str = DEFAULT_VERTEX_IMAGE_MODEL
    api_key: Optional[str] = None
    timeout_seconds: int = DEFAULT_VERTEX_TIMEOUT_SECONDS
    use_enterprise: bool = True

    def __repr__(self) -> str:
        """Prevent secrets from leaking in string representations/logs."""
        masked_key = f"{self.api_key[:4]}..." if self.api_key and len(self.api_key) > 4 else ("******" if self.api_key else None)
        return (
            f"VertexAISettings(project_id='{self.project_id}', location='{self.location}', "
            f"image_model='{self.image_model}', api_key='{masked_key}', "
            f"timeout_seconds={self.timeout_seconds}, enterprise={self.use_enterprise})"
        )


def get_vertex_ai_config() -> VertexAISettings:
    """Retrieve Vertex AI configuration from environment variables.

    Reads:
        GOOGLE_CLOUD_PROJECT / VERTEX_PROJECT_ID / GCP_PROJECT
        GOOGLE_APPLICATION_CREDENTIALS (auto-reads project_id from service account JSON)
        GOOGLE_CLOUD_LOCATION / VERTEX_LOCATION
        VERTEX_IMAGE_MODEL
        VERTEX_AI_API_KEY / GEMINI_API_KEY / GOOGLE_API_KEY
        GOOGLE_GENAI_USE_ENTERPRISE
        VERTEX_TIMEOUT_SECONDS
    """
    import json

    project_id = (
        os.getenv("GOOGLE_CLOUD_PROJECT", "").strip()
        or os.getenv("VERTEX_PROJECT_ID", "").strip()
        or os.getenv("GCP_PROJECT", "").strip()
        or None
    )

    # Auto-detect project_id from service account JSON if project_id is empty
    if not project_id:
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
        if cred_path and Path(cred_path).exists():
            try:
                with open(cred_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    project_id = data.get("project_id")
            except Exception as err:
                logger.debug("Could not read project_id from GOOGLE_APPLICATION_CREDENTIALS: %s", err)

    location = (
        os.getenv("GOOGLE_CLOUD_LOCATION", "").strip()
        or os.getenv("VERTEX_LOCATION", "").strip()
        or DEFAULT_VERTEX_LOCATION
    )

    image_model = (
        os.getenv("VERTEX_IMAGE_MODEL", "").strip()
        or DEFAULT_VERTEX_IMAGE_MODEL
    )

    api_key = (
        os.getenv("VERTEX_AI_API_KEY", "").strip()
        or os.getenv("GEMINI_API_KEY", "").strip()
        or os.getenv("GOOGLE_API_KEY", "").strip()
        or None
    )


    use_enterprise_raw = os.getenv("GOOGLE_GENAI_USE_ENTERPRISE", "True").strip().lower()
    use_enterprise = use_enterprise_raw not in ("false", "0", "no")

    timeout_raw = os.getenv("VERTEX_TIMEOUT_SECONDS", str(DEFAULT_VERTEX_TIMEOUT_SECONDS)).strip()
    try:
        timeout_seconds = int(timeout_raw)
    except ValueError:
        timeout_seconds = DEFAULT_VERTEX_TIMEOUT_SECONDS

    return VertexAISettings(
        project_id=project_id,
        location=location,
        image_model=image_model,
        api_key=api_key,
        timeout_seconds=timeout_seconds,
        use_enterprise=use_enterprise,
    )

