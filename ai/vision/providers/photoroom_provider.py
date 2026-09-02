"""Photoroom Image Enhancement & Studio Staging Provider.

Integrates Photoroom's Image Editing API (v2/edit) to transform raw artisan product
photographs into studio-grade e-commerce catalog assets with AI backgrounds,
contact shadows, and product preservation.
"""

from __future__ import annotations

import io
import json
import logging
import os
from pathlib import Path
import time
from typing import Any, BinaryIO, Dict, List, Optional, Tuple, Union
import urllib.error
import urllib.request
import uuid

from PIL import Image

from ai.vision.config import PhotoroomSettings, get_photoroom_config
from ai.vision.schemas import ProcessedImageResult

logger = logging.getLogger(__name__)

# Category-aware studio backgrounds tailored for artisan craft e-commerce
PHOTOROOM_STUDIO_PRESETS: Dict[str, Dict[str, str]] = {
    "pottery": {
        "warm_neutral": "A luxury e-commerce product studio scene with a warm beige stone podium, soft diffused directional morning lighting, and clean minimalist editorial background.",
        "ecommerce_white": "Clean commercial e-commerce seamless infinity white cyclorama studio with soft balanced dual key lighting and subtle floor reflection.",
        "terracotta_sand": "Artisan terracotta clay staging with natural sunlit sand texture, warm earth tones, and elegant organic shadows.",
        "travertine_podium": "Architectural travertine marble pedestal in an upscale sunlit gallery studio with soft ambient fill light.",
        "minimal_grey": "Modern matte concrete surface with high-fashion directional studio spotlighting and clean neutral grey tones.",
    },
    "textiles": {
        "warm_neutral": "A boutique studio staging for handwoven fabrics, warm linen background, soft diffused golden-hour lighting.",
        "ecommerce_white": "Pure seamless white e-commerce catalog background with crisp, true-to-life color rendering.",
        "terracotta_sand": "Natural raw wood and textured fabric setting with organic warm neutral daylight.",
        "travertine_podium": "Minimalist gallery podium with gentle ambient softbox lighting.",
        "minimal_grey": "Neutral light grey studio background with soft natural fabric drape shadows.",
    },
    "jewellery": {
        "warm_neutral": "Luxury jewellery display on polished micro-cement and satin stone with precision macro jewelry lighting.",
        "ecommerce_white": "Pure high-key commercial jewellery studio white background with sparkling specular highlights.",
        "terracotta_sand": "Raw silk and warm desert sandstone texture with elegant soft jewelry lighting.",
        "travertine_podium": "Premium Italian travertine marble block with warm cinematic spotlighting.",
        "minimal_grey": "Sleek slate stone surface with refined side rim lighting.",
    },
    "wooden_crafts": {
        "warm_neutral": "Warm Scandinavian artisan workshop background with smooth oak tabletop and diffused natural sunlight.",
        "ecommerce_white": "Clean white e-commerce catalog studio with natural grounding contact shadow.",
        "terracotta_sand": "Rustic earthy stone surface with warm ambient daylight.",
        "travertine_podium": "Brushed stone display block in an airy architectural studio.",
        "minimal_grey": "Contemporary minimal grey slate with soft contrast lighting.",
    },
    "general": {
        "warm_neutral": "A professional e-commerce product photograph on a warm neutral stone podium with soft diffused natural lighting.",
        "ecommerce_white": "Commercial pure white seamless studio cyclorama with balanced softbox lighting.",
        "terracotta_sand": "Artisan handcrafted presentation on textured warm earth background with soft natural light.",
        "travertine_podium": "Luxury travertine marble pedestal in a modern minimalist studio.",
        "minimal_grey": "Clean matte neutral grey surface with soft directional lighting.",
    },
}

ASPECT_RATIO_OUTPUT_SIZES: Dict[str, str] = {
    "1:1": "1080x1080",
    "square_1x1": "1080x1080",
    "4:5": "1080x1350",
    "portrait_4x5": "1080x1350",
    "9:16": "1080x1920",
    "portrait_9x16": "1080x1920",
    "16:9": "1920x1080",
    "landscape_16x9": "1920x1080",
}

MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB limit


def build_photoroom_prompt(category: str = "general", preset: str = "warm_neutral") -> str:
    """Build high-fidelity e-commerce prompt for Photoroom AI background generation."""
    cat_key = category.lower().replace(" ", "_")
    cat_presets = PHOTOROOM_STUDIO_PRESETS.get(cat_key, PHOTOROOM_STUDIO_PRESETS["general"])
    preset_key = preset.lower().replace(" ", "_")
    return cat_presets.get(preset_key, cat_presets.get("warm_neutral", PHOTOROOM_STUDIO_PRESETS["general"]["warm_neutral"]))


class PhotoroomProvider:
    """Production provider for Photoroom Image Editing and AI Studio Background API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        settings: Optional[PhotoroomSettings] = None,
    ) -> None:
        """Initialize PhotoroomProvider with API credentials."""
        if settings:
            self.api_key = settings.api_key
            self.base_url = settings.base_url
            self.studio_model_version = settings.studio_model_version
            self.shadow_model_version = settings.shadow_model_version
            self.shadow_mode = settings.shadow_mode
            self.timeout_seconds = settings.timeout_seconds
        else:
            try:
                cfg = get_photoroom_config()
                self.api_key = api_key if api_key is not None else cfg.api_key
                self.base_url = base_url if base_url is not None else cfg.base_url
                self.studio_model_version = cfg.studio_model_version
                self.shadow_model_version = cfg.shadow_model_version
                self.shadow_mode = cfg.shadow_mode
                self.timeout_seconds = timeout_seconds if timeout_seconds is not None else cfg.timeout_seconds
            except ValueError:
                self.api_key = api_key or ""
                self.base_url = base_url or "https://image-api.photoroom.com"
                self.studio_model_version = "background-studio-beta-2025-03-17"
                self.shadow_model_version = "2026-04-15"
                self.shadow_mode = "ai.auto-with-overrides"
                self.timeout_seconds = timeout_seconds or 45

    def __repr__(self) -> str:
        """Mask credentials in string representations/logs."""
        masked_key = f"{self.api_key[:4]}..." if len(self.api_key) > 4 else "******"
        return (
            f"PhotoroomProvider(api_key='{masked_key}', base_url='{self.base_url}', "
            f"timeout_seconds={self.timeout_seconds})"
        )

    @property
    def is_available(self) -> bool:
        """Check if PHOTOROOM_API_KEY is configured with a non-empty value."""
        return bool(self.api_key and self.api_key.strip())

    def _prepare_image(
        self,
        image_input: Union[str, Path, bytes, BinaryIO, Image.Image],
    ) -> Tuple[bytes, str]:
        """Validate and normalize image payload into raw bytes and MIME type."""
        raw_bytes: bytes

        if isinstance(image_input, (str, Path)):
            path_obj = Path(image_input)
            if not path_obj.exists():
                raise FileNotFoundError(f"Source image file does not exist: {path_obj}")
            raw_bytes = path_obj.read_bytes()
        elif isinstance(image_input, bytes):
            raw_bytes = image_input
        elif isinstance(image_input, Image.Image):
            buf = io.BytesIO()
            fmt = image_input.format or "PNG"
            image_input.save(buf, format=fmt)
            raw_bytes = buf.getvalue()
        elif hasattr(image_input, "read"):
            raw_bytes = image_input.read()
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        if not raw_bytes or len(raw_bytes) == 0:
            raise ValueError("Provided image payload is empty (0 bytes).")

        if len(raw_bytes) > MAX_IMAGE_SIZE_BYTES:
            raise ValueError(f"Image payload size ({len(raw_bytes)} bytes) exceeds limit of {MAX_IMAGE_SIZE_BYTES} bytes.")

        try:
            pil_img = Image.open(io.BytesIO(raw_bytes))
            pil_img.verify()
            pil_img = Image.open(io.BytesIO(raw_bytes))
        except Exception as err:
            raise ValueError(f"Corrupted or invalid image data: {err}")

        img_format = (pil_img.format or "JPEG").upper()
        mime_type = f"image/{img_format.lower()}"
        if img_format == "JPG":
            mime_type = "image/jpeg"

        return raw_bytes, mime_type

    def _build_multipart_payload(
        self,
        image_bytes: bytes,
        mime_type: str,
        fields: Dict[str, str],
    ) -> Tuple[bytes, str]:
        """Encode multipart/form-data payload with image file and form fields."""
        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
        body = bytearray()

        # Add string fields
        for field_name, field_value in fields.items():
            if field_value is not None:
                body.extend(f"--{boundary}\r\n".encode("utf-8"))
                body.extend(f'Content-Disposition: form-data; name="{field_name}"\r\n\r\n'.encode("utf-8"))
                body.extend(f"{field_value}\r\n".encode("utf-8"))

        # Add image file
        ext = "png" if "png" in mime_type else "jpg"
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="imageFile"; filename="image.{ext}"\r\n'.encode("utf-8"))
        body.extend(f"Content-Type: {mime_type}\r\n\r\n".encode("utf-8"))
        body.extend(image_bytes)
        body.extend(b"\r\n")

        # Closing boundary
        body.extend(f"--{boundary}--\r\n".encode("utf-8"))

        content_type = f"multipart/form-data; boundary={boundary}"
        return bytes(body), content_type

    def edit_studio_image(
        self,
        image_input: Union[str, Path, bytes, BinaryIO, Image.Image],
        category: str = "general",
        preset: str = "warm_neutral",
        aspect_ratio: str = "1:1",
        add_shadow: bool = True,
        custom_prompt_override: Optional[str] = None,
        padding: float = 0.1,
    ) -> ProcessedImageResult:
        """Transform an artisan photograph into a professional e-commerce studio catalog asset."""
        start_time = time.time()

        if not self.is_available:
            return ProcessedImageResult(
                success=False,
                provider="photoroom",
                operation="studio_restyling",
                error="PHOTOROOM_API_KEY is not configured in server environment or provider arguments.",
                error_code="CONFIG_ERROR",
            )

        try:
            raw_bytes, mime_type = self._prepare_image(image_input)
        except FileNotFoundError as fnf_err:
            return ProcessedImageResult(
                success=False,
                provider="photoroom",
                operation="studio_restyling",
                error=str(fnf_err),
                error_code="FILE_NOT_FOUND",
            )
        except ValueError as val_err:
            return ProcessedImageResult(
                success=False,
                provider="photoroom",
                operation="studio_restyling",
                error=f"Invalid image input: {str(val_err)}",
                error_code="INVALID_IMAGE_INPUT",
            )
        except Exception as prep_err:
            return ProcessedImageResult(
                success=False,
                provider="photoroom",
                operation="studio_restyling",
                error=f"Image preparation failed: {str(prep_err)}",
                error_code="IMAGE_PREP_ERROR",
            )

        prompt = custom_prompt_override or build_photoroom_prompt(category=category, preset=preset)
        output_size = ASPECT_RATIO_OUTPUT_SIZES.get(aspect_ratio, "1080x1080")

        fields: Dict[str, str] = {
            "background.prompt": prompt,
            "padding": str(padding),
            "outputSize": output_size,
            "format": "png",
        }

        if add_shadow:
            fields["shadow.mode"] = self.shadow_mode
            fields["shadow.softnessOverride"] = "0.35"
            fields["shadow.intensityOverride"] = "0.75"
        else:
            fields["shadow.mode"] = "off"

        url = f"{self.base_url.rstrip('/')}/v2/edit"
        payload_bytes, content_type_header = self._build_multipart_payload(
            image_bytes=raw_bytes,
            mime_type=mime_type,
            fields=fields,
        )

        headers = {
            "x-api-key": self.api_key.strip(),
            "Content-Type": content_type_header,
            "pr-ai-background-model-version": self.studio_model_version,
            "pr-ai-shadows-model-version": self.shadow_model_version,
            "User-Agent": "KalaMitra-PhotoroomStudio/1.0",
        }

        req = urllib.request.Request(
            url=url,
            data=payload_bytes,
            headers=headers,
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
                resp_bytes = resp.read()
                elapsed_ms = round((time.time() - start_time) * 1000, 2)

                if not resp_bytes or len(resp_bytes) == 0:
                    return ProcessedImageResult(
                        success=False,
                        provider="photoroom",
                        operation="studio_restyling",
                        error="Photoroom API returned empty response body.",
                        error_code="EMPTY_RESPONSE",
                        metadata={"execution_time_ms": elapsed_ms},
                    )

                return ProcessedImageResult(
                    success=True,
                    provider="photoroom",
                    operation="studio_restyling",
                    output_format="PNG",
                    metadata={
                        "model": self.studio_model_version,
                        "execution_time_ms": elapsed_ms,
                        "category": category,
                        "preset": preset,
                        "aspect_ratio": aspect_ratio,
                        "image_bytes": resp_bytes,
                        "byte_count": len(resp_bytes),
                    },
                )

        except urllib.error.HTTPError as http_err:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            status_code = http_err.code
            try:
                err_detail = http_err.read().decode("utf-8", errors="replace")
            except Exception:
                err_detail = str(http_err)

            err_code = "API_ERROR"
            if status_code in (401, 403):
                err_code = "AUTH_ERROR"
            elif status_code == 429:
                err_code = "RATE_LIMIT_ERROR"
            elif status_code == 400:
                err_code = "BAD_REQUEST"

            logger.warning("Photoroom API HTTP error %s: %s", status_code, err_detail)
            return ProcessedImageResult(
                success=False,
                provider="photoroom",
                operation="studio_restyling",
                error=f"Photoroom API error ({status_code}): {err_detail}",
                error_code=err_code,
                metadata={
                    "status_code": status_code,
                    "execution_time_ms": elapsed_ms,
                    "category": category,
                    "preset": preset,
                },
            )

        except urllib.error.URLError as url_err:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            is_timeout = "timed out" in str(url_err).lower()
            return ProcessedImageResult(
                success=False,
                provider="photoroom",
                operation="studio_restyling",
                error=f"Photoroom network error: {str(url_err)}",
                error_code="TIMEOUT_ERROR" if is_timeout else "NETWORK_ERROR",
                metadata={"execution_time_ms": elapsed_ms},
            )

        except Exception as gen_err:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            return ProcessedImageResult(
                success=False,
                provider="photoroom",
                operation="studio_restyling",
                error=f"Photoroom processing error: {str(gen_err)}",
                error_code="UNEXPECTED_ERROR",
                metadata={"execution_time_ms": elapsed_ms},
            )

    def remove_background(
        self,
        image_input: Union[str, Path, bytes, BinaryIO, Image.Image],
        padding: float = 0.05,
    ) -> ProcessedImageResult:
        """Extract a clean transparent cutout of the artisan product."""
        start_time = time.time()

        if not self.is_available:
            return ProcessedImageResult(
                success=False,
                provider="photoroom",
                operation="background_removal",
                error="PHOTOROOM_API_KEY is not configured.",
                error_code="CONFIG_ERROR",
            )

        try:
            raw_bytes, mime_type = self._prepare_image(image_input)
        except Exception as prep_err:
            return ProcessedImageResult(
                success=False,
                provider="photoroom",
                operation="background_removal",
                error=f"Image preparation failed: {str(prep_err)}",
                error_code="IMAGE_PREP_ERROR",
            )

        fields = {
            "padding": str(padding),
            "format": "png",
        }

        url = f"{self.base_url.rstrip('/')}/v2/edit"
        payload_bytes, content_type_header = self._build_multipart_payload(
            image_bytes=raw_bytes,
            mime_type=mime_type,
            fields=fields,
        )

        headers = {
            "x-api-key": self.api_key.strip(),
            "Content-Type": content_type_header,
            "User-Agent": "KalaMitra-PhotoroomCutout/1.0",
        }

        req = urllib.request.Request(url=url, data=payload_bytes, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
                resp_bytes = resp.read()
                elapsed_ms = round((time.time() - start_time) * 1000, 2)
                return ProcessedImageResult(
                    success=True,
                    provider="photoroom",
                    operation="background_removal",
                    output_format="PNG",
                    metadata={
                        "execution_time_ms": elapsed_ms,
                        "image_bytes": resp_bytes,
                        "byte_count": len(resp_bytes),
                    },
                )
        except Exception as err:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            return ProcessedImageResult(
                success=False,
                provider="photoroom",
                operation="background_removal",
                error=f"Photoroom cutout extraction failed: {str(err)}",
                error_code="API_ERROR",
                metadata={"execution_time_ms": elapsed_ms},
            )
