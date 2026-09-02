"""Gemini / Nano Banana Image Editing Studio Provider.

Integrates Google's Gemini / Nano Banana multimodal image-editing models
to transform raw artisan product photographs into professional, studio-grade
e-commerce catalog assets while maintaining absolute product fidelity.
"""

from __future__ import annotations

import base64
from dataclasses import dataclass
import io
import json
import logging
import os
from pathlib import Path
import time
from typing import Any, BinaryIO, Dict, List, Optional, Tuple, Union
import urllib.error
import urllib.request

from PIL import Image

from ai.vision.prompts.studio_prompt import build_studio_edit_prompt
from ai.vision.schemas import ProcessedImageResult

logger = logging.getLogger(__name__)

# Constants
DEFAULT_GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image"
FALLBACK_GEMINI_IMAGE_MODELS = [
    "gemini-3.1-flash-image",
    "gemini-3-pro-image",
    "gemini-2.5-flash-image",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "imagen-3.0-generate-002",
]
DEFAULT_TIMEOUT_SECONDS = 45
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit


@dataclass(frozen=True)
class GeminiStudioSettings:
    """Configurable settings for GeminiStudioProvider."""
    api_key: str
    image_model: str = DEFAULT_GEMINI_IMAGE_MODEL
    fallback_models: List[str] = None
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS

    def __repr__(self) -> str:
        masked_key = f"{self.api_key[:4]}..." if len(self.api_key) > 4 else "******"
        return f"GeminiStudioSettings(image_model={self.image_model}, api_key='{masked_key}', timeout_seconds={self.timeout_seconds})"


def get_gemini_studio_config() -> GeminiStudioSettings:
    """Load Gemini configuration from environment variables."""
    api_key = (
        os.getenv("GEMINI_API_KEY", "").strip()
        or os.getenv("GOOGLE_CLOUD_API_KEY", "").strip()
        or os.getenv("GOOGLE_API_KEY", "").strip()
    )
    model = os.getenv("GEMINI_IMAGE_MODEL", DEFAULT_GEMINI_IMAGE_MODEL).strip()
    timeout_raw = os.getenv("GEMINI_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT_SECONDS)).strip()

    try:
        timeout = int(timeout_raw)
    except ValueError:
        timeout = DEFAULT_TIMEOUT_SECONDS

    return GeminiStudioSettings(
        api_key=api_key,
        image_model=model or DEFAULT_GEMINI_IMAGE_MODEL,
        fallback_models=FALLBACK_GEMINI_IMAGE_MODELS,
        timeout_seconds=timeout,
    )


class GeminiStudioProvider:
    """Production provider for Gemini/Nano Banana image editing and restyling."""

    DEFAULT_IMAGE_MODEL = DEFAULT_GEMINI_IMAGE_MODEL
    FALLBACK_IMAGE_MODELS = FALLBACK_GEMINI_IMAGE_MODELS

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        settings: Optional[GeminiStudioSettings] = None,
    ) -> None:
        """Initialize GeminiStudioProvider with API credentials and model configuration."""
        if settings:
            self.api_key = settings.api_key
            self.model_name = settings.image_model
            self.timeout_seconds = settings.timeout_seconds
        else:
            cfg = get_gemini_studio_config()
            self.api_key = api_key if api_key is not None else cfg.api_key
            self.model_name = model_name if model_name is not None else cfg.image_model
            self.timeout_seconds = timeout_seconds if timeout_seconds is not None else cfg.timeout_seconds

        self._client = None

    def __repr__(self) -> str:
        """Prevent secrets from leaking in string representations/logs."""
        masked_key = f"{self.api_key[:4]}..." if len(self.api_key) > 4 else "******"
        return (
            f"GeminiStudioProvider(model='{self.model_name}', "
            f"api_key='{masked_key}', timeout_seconds={self.timeout_seconds})"
        )

    @property
    def is_available(self) -> bool:
        """Check if GEMINI_API_KEY is configured with a non-empty value."""
        return bool(self.api_key and self.api_key.strip())

    def _get_client(self):
        """Lazy-load the Google GenAI client if installed."""
        if not self.is_available:
            raise ValueError("GEMINI_API_KEY is not configured in server environment or provider arguments.")

        if self._client is None:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key.strip())
            except Exception:
                self._client = None

        return self._client

    def _prepare_image(
        self,
        image_input: Union[str, Path, bytes, BinaryIO, Image.Image],
    ) -> Tuple[bytes, Image.Image, str]:
        """Validate and normalize image payload into raw bytes, PIL Image, and MIME type."""
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
            raise ValueError(f"Image payload size ({len(raw_bytes)} bytes) exceeds max limit of {MAX_IMAGE_SIZE_BYTES} bytes.")

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

        return raw_bytes, pil_img, mime_type

    def _extract_image_bytes_from_response(self, response: Any) -> Optional[bytes]:
        """Robustly extract image bytes from Google GenAI / REST response objects."""
        if response is None:
            return None

        # Dict response from REST API
        if isinstance(response, dict):
            # Imagen predictions
            predictions = response.get("predictions")
            if predictions and isinstance(predictions, list) and len(predictions) > 0:
                p0 = predictions[0]
                b64 = p0.get("bytesBase64Encoded") or p0.get("image", {}).get("imageBytes")
                if b64:
                    try:
                        return base64.b64decode(b64)
                    except Exception:
                        pass

            # Gemini candidates
            candidates = response.get("candidates")
            if candidates and isinstance(candidates, list) and len(candidates) > 0:
                parts = candidates[0].get("content", {}).get("parts", [])
                for part in parts:
                    inline = part.get("inline_data") or part.get("inlineData")
                    if inline and inline.get("data"):
                        try:
                            return base64.b64decode(inline["data"])
                        except Exception:
                            pass

        # Python SDK response object
        if hasattr(response, "output_image") and response.output_image is not None:
            out_img = response.output_image
            if hasattr(out_img, "data") and out_img.data:
                if isinstance(out_img.data, bytes):
                    return out_img.data
                try:
                    return base64.b64decode(out_img.data)
                except Exception:
                    pass

        candidates = getattr(response, "candidates", None)
        if candidates and len(candidates) > 0:
            content = getattr(candidates[0], "content", None)
            parts = getattr(content, "parts", None) if content else None
            if parts:
                for part in parts:
                    inline = getattr(part, "inline_data", None)
                    if inline and getattr(inline, "data", None):
                        data = inline.data
                        if isinstance(data, bytes):
                            return data
                        try:
                            return base64.b64decode(data)
                        except Exception:
                            pass
                    if hasattr(part, "data") and isinstance(part.data, bytes):
                        return part.data

        if hasattr(response, "generated_images") and response.generated_images:
            for g_img in response.generated_images:
                if hasattr(g_img, "image") and hasattr(g_img.image, "image_bytes"):
                    return g_img.image.image_bytes

        return None

    def _call_gemini_rest_api(
        self,
        model: str,
        raw_bytes: bytes,
        mime_type: str,
        prompt: str,
    ) -> Dict[str, Any]:
        """Direct HTTPS REST API call to Google Generative Language API without SDK dependencies."""
        api_key = self.api_key.strip()
        b64_image = base64.b64encode(raw_bytes).decode("utf-8")

        if "imagen" in model.lower():
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:predict?key={api_key}"
            payload = {
                "instances": [
                    {
                        "prompt": prompt,
                    }
                ],
                "parameters": {
                    "sampleCount": 1,
                    "aspectRatio": "1:1",
                    "outputOptions": {
                        "mimeType": "image/png"
                    }
                }
            }
        else:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": b64_image,
                                }
                            },
                            {
                                "text": prompt,
                            }
                        ]
                    }
                ]
            }

        req_body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url=url,
            data=req_body,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "KalaMitra-GeminiStudio/1.0",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
            resp_body = resp.read()
            return json.loads(resp_body.decode("utf-8"))

    def edit_studio_image(
        self,
        image_input: Union[str, Path, bytes, BinaryIO, Image.Image],
        category: str = "general",
        preset: str = "warm_neutral",
        aspect_ratio: str = "1:1",
        lighting_style: Optional[str] = None,
        custom_prompt_override: Optional[str] = None,
    ) -> ProcessedImageResult:
        """Transform a raw artisan photograph into a professional e-commerce catalog image."""
        start_time = time.time()

        if not self.is_available:
            return ProcessedImageResult(
                success=False,
                provider="gemini_nano_banana",
                operation="studio_restyling",
                error="GEMINI_API_KEY is not configured in server environment or provider arguments.",
                error_code="CONFIG_ERROR",
                metadata={"model": self.model_name},
            )

        try:
            raw_bytes, pil_img, mime_type = self._prepare_image(image_input)
        except FileNotFoundError as fnf_err:
            return ProcessedImageResult(
                success=False,
                provider="gemini_nano_banana",
                operation="studio_restyling",
                error=str(fnf_err),
                error_code="FILE_NOT_FOUND",
                metadata={"model": self.model_name},
            )
        except ValueError as val_err:
            return ProcessedImageResult(
                success=False,
                provider="gemini_nano_banana",
                operation="studio_restyling",
                error=f"Invalid image input: {str(val_err)}",
                error_code="INVALID_IMAGE_INPUT",
                metadata={"model": self.model_name},
            )
        except Exception as prep_err:
            return ProcessedImageResult(
                success=False,
                provider="gemini_nano_banana",
                operation="studio_restyling",
                error=f"Image preparation failed: {str(prep_err)}",
                error_code="IMAGE_PREP_ERROR",
                metadata={"model": self.model_name},
            )

        # Construct master studio prompt
        prompt = custom_prompt_override or build_studio_edit_prompt(
            category=category,
            preset=preset,
            aspect_ratio=aspect_ratio,
            lighting_style=lighting_style,
        )

        client = self._get_client()
        models_to_try = [self.model_name] + [m for m in self.FALLBACK_IMAGE_MODELS if m != self.model_name]

        response = None
        used_model = self.model_name
        last_exception = None

        for model in models_to_try:
            try:
                logger.info("Invoking Gemini studio generation with model: %s", model)
                if client is not None:
                    response = client.models.generate_content(
                        model=model,
                        contents=[pil_img, prompt],
                    )
                else:
                    response = self._call_gemini_rest_api(
                        model=model,
                        raw_bytes=raw_bytes,
                        mime_type=mime_type,
                        prompt=prompt,
                    )
                if response:
                    used_model = model
                    break
            except Exception as api_err:
                last_exception = api_err
                err_str = str(api_err).lower()
                logger.warning("Gemini model %s call failed: %s", model, api_err)
                if "rate" in err_str or "quota" in err_str or "429" in err_str:
                    break

        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        if response is None:
            err_msg = str(last_exception) if last_exception else "No response returned from Gemini API"
            err_code = "API_ERROR"
            if "rate" in err_msg.lower() or "quota" in err_msg.lower() or "429" in err_msg:
                err_code = "RATE_LIMIT_ERROR"
            elif "timeout" in err_msg.lower():
                err_code = "TIMEOUT_ERROR"
            elif "auth" in err_msg.lower() or "key" in err_msg.lower() or "permission" in err_msg.lower() or "403" in err_msg:
                err_code = "AUTH_ERROR"

            return ProcessedImageResult(
                success=False,
                provider="gemini_nano_banana",
                operation="studio_restyling",
                error=f"Gemini API generation failed: {err_msg}",
                error_code=err_code,
                metadata={
                    "model": used_model,
                    "execution_time_ms": elapsed_ms,
                    "category": category,
                    "preset": preset,
                },
            )

        # Check for safety filter blocks in response
        candidates = getattr(response, "candidates", None)
        if candidates and len(candidates) > 0:
            finish_reason = getattr(candidates[0], "finish_reason", None)
            if finish_reason and str(finish_reason).upper() == "SAFETY":
                return ProcessedImageResult(
                    success=False,
                    provider="gemini_nano_banana",
                    operation="studio_restyling",
                    error="Gemini generation was blocked by safety filters.",
                    error_code="BLOCKED_SAFETY",
                    metadata={
                        "model": used_model,
                        "execution_time_ms": elapsed_ms,
                        "category": category,
                        "preset": preset,
                    },
                )

        generated_bytes = self._extract_image_bytes_from_response(response)

        if not generated_bytes:
            has_text = bool(getattr(response, "text", None))
            err_msg = "Gemini returned a text response without image bytes." if has_text else "Gemini generation produced no image bytes in response."
            return ProcessedImageResult(
                success=False,
                provider="gemini_nano_banana",
                operation="studio_restyling",
                error=err_msg,
                error_code="NO_IMAGE_RETURNED",
                metadata={
                    "model": used_model,
                    "execution_time_ms": elapsed_ms,
                    "category": category,
                    "preset": preset,
                },
            )

        return ProcessedImageResult(
            success=True,
            provider="gemini_nano_banana",
            operation="studio_restyling",
            output_format="PNG",
            metadata={
                "model": used_model,
                "execution_time_ms": elapsed_ms,
                "category": category,
                "preset": preset,
                "aspect_ratio": aspect_ratio,
                "image_bytes": generated_bytes,
                "byte_count": len(generated_bytes),
            },
        )
