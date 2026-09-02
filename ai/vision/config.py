"""Vision configuration boundary for Cloudinary and Picsart providers.

Reads credentials safely from the environment, validates their presence,
and configures SDKs/settings idempotently without leaking secrets.
"""

from dataclasses import dataclass
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load root .env if present
_env_path = Path(__file__).resolve().parents[2] / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
else:
    load_dotenv()


@dataclass(frozen=True)
class CloudinarySettings:
    """Immutable, sanitized container for Cloudinary settings."""
    cloud_name: str
    api_key: str
    api_secret: str
    secure: bool = True

    def __repr__(self) -> str:
        """Prevent secrets from leaking in string representations/logs."""
        masked_secret = "******" if self.api_secret else ""
        masked_key = f"{self.api_key[:4]}..." if len(self.api_key) > 4 else "******"
        return (
            f"CloudinarySettings(cloud_name='{self.cloud_name}', "
            f"api_key='{masked_key}', api_secret='{masked_secret}', secure={self.secure})"
        )


@dataclass(frozen=True)
class PicsartSettings:
    """Immutable, sanitized container for Picsart API settings."""
    api_key: str
    base_url: str = "https://api.picsart.io/tools/1.0"
    timeout_seconds: int = 30

    def __repr__(self) -> str:
        """Prevent secrets from leaking in string representations/logs."""
        masked_key = f"{self.api_key[:4]}..." if len(self.api_key) > 4 else "******"
        return (
            f"PicsartSettings(api_key='{masked_key}', "
            f"base_url='{self.base_url}', timeout_seconds={self.timeout_seconds})"
        )


_is_configured: bool = False
_cached_cloudinary_settings: Optional[CloudinarySettings] = None
_cached_picsart_settings: Optional[PicsartSettings] = None


def get_cloudinary_config() -> CloudinarySettings:
    """Retrieve and validate Cloudinary configuration from environment variables.

    Raises:
        ValueError: If any required Cloudinary credential is missing.
    """
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
    api_key = os.getenv("CLOUDINARY_API_KEY", "").strip()
    api_secret = os.getenv("CLOUDINARY_API_SECRET", "").strip()

    missing = []
    if not cloud_name:
        missing.append("CLOUDINARY_CLOUD_NAME")
    if not api_key:
        missing.append("CLOUDINARY_API_KEY")
    if not api_secret:
        missing.append("CLOUDINARY_API_SECRET")

    if missing:
        raise ValueError(
            f"Missing required Cloudinary environment variables: {', '.join(missing)}"
        )

    return CloudinarySettings(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )


def configure_cloudinary(force: bool = False) -> CloudinarySettings:
    """Idempotently configure the Cloudinary SDK.

    Args:
        force: If True, re-evaluates environment variables and reconfigures.

    Returns:
        Validated CloudinarySettings instance.
    """
    global _is_configured, _cached_cloudinary_settings

    if _is_configured and not force and _cached_cloudinary_settings is not None:
        return _cached_cloudinary_settings

    settings = get_cloudinary_config()

    import cloudinary
    cloudinary.config(
        cloud_name=settings.cloud_name,
        api_key=settings.api_key,
        api_secret=settings.api_secret,
        secure=settings.secure,
    )

    _is_configured = True
    _cached_cloudinary_settings = settings
    return settings


def get_picsart_config() -> PicsartSettings:
    """Retrieve and validate Picsart configuration from environment variables.

    Returns:
        Validated PicsartSettings instance.

    Raises:
        ValueError: If PICSART_API_KEY is missing or empty.
    """
    api_key = os.getenv("PICSART_API_KEY", "").strip()
    if not api_key:
        raise ValueError("Missing required environment variable: PICSART_API_KEY")

    base_url = os.getenv("PICSART_BASE_URL", "https://api.picsart.io/tools/1.0").strip()
    timeout_raw = os.getenv("PICSART_TIMEOUT_SECONDS", "30").strip()
    try:
        timeout_seconds = int(timeout_raw)
    except ValueError:
        timeout_seconds = 30

    return PicsartSettings(
        api_key=api_key,
        base_url=base_url,
        timeout_seconds=timeout_seconds,
    )


@dataclass(frozen=True)
class PhotoroomSettings:
    """Immutable, sanitized container for Photoroom API settings."""
    api_key: str
    base_url: str = "https://image-api.photoroom.com"
    studio_model_version: str = "background-studio-beta-2025-03-17"
    shadow_model_version: str = "2026-04-15"
    shadow_mode: str = "ai.auto-with-overrides"
    timeout_seconds: int = 45

    def __repr__(self) -> str:
        """Prevent secrets from leaking in string representations/logs."""
        masked_key = f"{self.api_key[:4]}..." if len(self.api_key) > 4 else "******"
        return (
            f"PhotoroomSettings(api_key='{masked_key}', base_url='{self.base_url}', "
            f"studio_model='{self.studio_model_version}', timeout_seconds={self.timeout_seconds})"
        )


def get_photoroom_config() -> PhotoroomSettings:
    """Retrieve and validate Photoroom configuration from environment variables.

    Returns:
        Validated PhotoroomSettings instance.

    Raises:
        ValueError: If PHOTOROOM_API_KEY is missing or empty.
    """
    api_key = os.getenv("PHOTOROOM_API_KEY", "").strip()
    if not api_key:
        raise ValueError("Missing required environment variable: PHOTOROOM_API_KEY")

    base_url = os.getenv("PHOTOROOM_BASE_URL", "https://image-api.photoroom.com").strip()
    studio_model = os.getenv("PHOTOROOM_STUDIO_MODEL_VERSION", "background-studio-beta-2025-03-17").strip()
    shadow_model = os.getenv("PHOTOROOM_SHADOW_MODEL_VERSION", "2026-04-15").strip()
    shadow_mode = os.getenv("PHOTOROOM_SHADOW_MODE", "ai.auto-with-overrides").strip()
    timeout_raw = os.getenv("PHOTOROOM_TIMEOUT_SECONDS", "45").strip()

    try:
        timeout_seconds = int(timeout_raw)
    except ValueError:
        timeout_seconds = 45

    return PhotoroomSettings(
        api_key=api_key,
        base_url=base_url or "https://image-api.photoroom.com",
        studio_model_version=studio_model or "background-studio-beta-2025-03-17",
        shadow_model_version=shadow_model or "2026-04-15",
        shadow_mode=shadow_mode or "ai.auto-with-overrides",
        timeout_seconds=timeout_seconds,
    )


@dataclass(frozen=True)
class FidelitySettings:
    """Configurable thresholds for product-fidelity validation."""
    mask_iou_pass: float = 0.80
    mask_iou_review: float = 0.65
    ssim_pass: float = 0.70
    ssim_review: float = 0.55
    color_delta_e_pass: float = 12.0
    color_delta_e_review: float = 22.0
    aspect_ratio_delta_max: float = 0.20


def get_fidelity_config() -> FidelitySettings:
    """Retrieve product fidelity thresholds from environment with safe defaults."""
    def _get_float(key: str, default: float) -> float:
        val = os.getenv(key, "").strip()
        if val:
            try:
                return float(val)
            except ValueError:
                pass
        return default

    return FidelitySettings(
        mask_iou_pass=_get_float("FIDELITY_MASK_IOU_PASS", 0.80),
        mask_iou_review=_get_float("FIDELITY_MASK_IOU_REVIEW", 0.65),
        ssim_pass=_get_float("FIDELITY_SSIM_PASS", 0.70),
        ssim_review=_get_float("FIDELITY_SSIM_REVIEW", 0.55),
        color_delta_e_pass=_get_float("FIDELITY_COLOR_DELTA_E_PASS", 12.0),
        color_delta_e_review=_get_float("FIDELITY_COLOR_DELTA_E_REVIEW", 22.0),
        aspect_ratio_delta_max=_get_float("FIDELITY_ASPECT_RATIO_DELTA_MAX", 0.20),
    )



