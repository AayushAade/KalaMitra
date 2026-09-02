"""Vertex AI Image Processing Provider.

Implements the official Google Gen AI SDK (google-genai) client in Vertex AI mode
supporting Application Default Credentials (ADC) and server-side configuration.
"""

from __future__ import annotations

import base64
import logging
import os
import time
from typing import Any, BinaryIO, Dict, List, Optional, Union
from PIL import Image

from backend.app.core.vertex_config import (
    VertexAISettings,
    get_vertex_ai_config,
)
from backend.app.services.image_processing.base import BaseImageProcessingProvider
from ai.vision.schemas import ProcessedImageResult

logger = logging.getLogger(__name__)


class VertexAIImageProvider(BaseImageProcessingProvider):
    """Production provider for Vertex AI Image Processing via google-genai SDK."""

    def __init__(
        self,
        project_id: Optional[str] = None,
        location: Optional[str] = None,
        image_model: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        settings: Optional[VertexAISettings] = None,
    ) -> None:
        """Initialize VertexAIImageProvider with environment or custom settings."""
        if settings:
            self._settings = settings
        else:
            cfg = get_vertex_ai_config()
            self._settings = VertexAISettings(
                project_id=project_id if project_id is not None else cfg.project_id,
                location=location if location is not None else cfg.location,
                image_model=image_model if image_model is not None else cfg.image_model,
                api_key=api_key if api_key is not None else cfg.api_key,
                timeout_seconds=timeout_seconds if timeout_seconds is not None else cfg.timeout_seconds,
            )

        self.project_id = self._settings.project_id
        self.location = self._settings.location
        self.image_model = self._settings.image_model
        self.api_key = self._settings.api_key
        self.timeout_seconds = self._settings.timeout_seconds
        self._client = None

    @property
    def provider_name(self) -> str:
        """Unique identifier for Vertex AI provider."""
        return "vertex_ai"

    def __repr__(self) -> str:
        """Sanitized string representation masking secrets."""
        masked_key = f"{self.api_key[:4]}..." if self.api_key and len(self.api_key) > 4 else ("******" if self.api_key else None)
        return (
            f"VertexAIImageProvider(project_id='{self.project_id}', location='{self.location}', "
            f"model='{self.image_model}', api_key='{masked_key}', timeout={self.timeout_seconds}s)"
        )

    @property
    def is_available(self) -> bool:
        """Check if Vertex AI is configured with valid project/credentials or developer key."""
        return bool(self.project_id or self.api_key)

    def _get_client(self):
        """Lazy-load the official google-genai client."""
        if self._client is not None:
            return self._client

        try:
            from google import genai
        except ImportError as err:
            raise ImportError(
                "The official 'google-genai' package is not installed. "
                "Install it using: pip install google-genai"
            ) from err

        # 1. Prefer Vertex AI Mode with Google Cloud Project + Location
        if self.project_id:
            logger.info(
                "Initializing google-genai Client in Vertex AI mode (project=%s, location=%s)",
                self.project_id,
                self.location,
            )
            self._client = genai.Client(
                vertexai=True,
                project=self.project_id,
                location=self.location,
            )
            return self._client

        # 2. Fallback to Developer API mode if API key is provided
        if self.api_key:
            logger.info("Initializing google-genai Client in Developer API mode using api_key")
            self._client = genai.Client(api_key=self.api_key.strip())
            return self._client

        raise ValueError(
            "Neither GOOGLE_CLOUD_PROJECT nor GEMINI_API_KEY is configured in the environment. "
            "Set GOOGLE_CLOUD_PROJECT to use Vertex AI or run 'gcloud auth application-default login'."
        )

    def verify_connection(self) -> Dict[str, Any]:
        """Verify Google Cloud authentication and Vertex AI connectivity.

        Returns:
            Dict with authentication and connectivity diagnostic details.
        """
        start_time = time.time()
        diagnostics: Dict[str, Any] = {
            "provider": self.provider_name,
            "project_id": self.project_id,
            "location": self.location,
            "model": self.image_model,
            "is_configured": self.is_available,
            "authenticated": False,
            "connection_status": "unverified",
        }

        if not self.is_available:
            diagnostics["error"] = "GOOGLE_CLOUD_PROJECT environment variable is missing."
            diagnostics["error_code"] = "CONFIG_MISSING_PROJECT"
            return diagnostics

        try:
            client = self._get_client()
            diagnostics["authenticated"] = True

            # Check model availability / info
            try:
                model_info = client.models.get(model=self.image_model)
                diagnostics["model_info"] = {
                    "name": getattr(model_info, "name", self.image_model),
                    "display_name": getattr(model_info, "display_name", None),
                }
                diagnostics["connection_status"] = "connected"
            except Exception as model_err:
                logger.warning("Could not fetch model info for %s: %s", self.image_model, model_err)
                diagnostics["connection_status"] = "client_initialized"
                diagnostics["model_warning"] = str(model_err)

            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            diagnostics["execution_time_ms"] = elapsed_ms
            return diagnostics

        except Exception as conn_err:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            err_str = str(conn_err)
            err_code = self._map_error_code(err_str)
            logger.error("Vertex AI connection verification failed (%s): %s", err_code, conn_err)

            diagnostics["connection_status"] = "failed"
            diagnostics["error"] = err_str
            diagnostics["error_code"] = err_code
            diagnostics["execution_time_ms"] = elapsed_ms
            return diagnostics

    def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        number_of_images: int = 1,
        **kwargs: Any,
    ) -> ProcessedImageResult:
        """Generate a real image using Vertex AI image generation models.

        Args:
            prompt: Text prompt describing the e-commerce visual.
            aspect_ratio: Aspect ratio (e.g. '1:1', '4:3', '16:9').
            number_of_images: Number of variations to produce (default: 1).
            **kwargs: Extra parameters passed to the model.

        Returns:
            ProcessedImageResult containing image bytes and execution telemetry.
        """
        start_time = time.time()

        if not prompt or not prompt.strip():
            return ProcessedImageResult(
                success=False,
                provider=self.provider_name,
                operation="image_generation",
                error="Prompt cannot be empty.",
                error_code="INVALID_PROMPT",
            )

        if not self.is_available:
            return ProcessedImageResult(
                success=False,
                provider=self.provider_name,
                operation="image_generation",
                error="Vertex AI is not configured. Set GOOGLE_CLOUD_PROJECT or authenticate with gcloud.",
                error_code="CONFIG_ERROR",
                metadata={"project_id": self.project_id, "location": self.location},
            )

        try:
            client = self._get_client()
        except Exception as client_err:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            err_code = self._map_error_code(str(client_err))
            return ProcessedImageResult(
                success=False,
                provider=self.provider_name,
                operation="image_generation",
                error=f"Vertex AI client initialization failed: {str(client_err)}",
                error_code=err_code,
                metadata={"execution_time_ms": elapsed_ms},
            )

        try:
            logger.info(
                "Invoking Vertex AI image generation (model=%s, prompt_len=%d, aspect_ratio=%s)",
                self.image_model,
                len(prompt),
                aspect_ratio,
            )

            # 1. Primary: If Imagen image generation model in Vertex AI mode
            if self.project_id and "imagen" in self.image_model.lower():
                try:
                    from google.genai import types
                    img_config = types.GenerateImagesConfig(
                        number_of_images=number_of_images,
                        aspect_ratio=aspect_ratio,
                        output_mime_type="image/png",
                    )
                except Exception:
                    img_config = {
                        "number_of_images": number_of_images,
                        "aspect_ratio": aspect_ratio,
                        "output_mime_type": "image/png",
                    }

                try:
                    response = client.models.generate_images(
                        model=self.image_model,
                        prompt=prompt,
                        config=img_config,
                    )
                    generated_bytes = self._extract_image_bytes(response)
                except Exception as img_err:
                    logger.warning("generate_images call failed, trying generate_content: %s", img_err)
                    response = client.models.generate_content(
                        model="gemini-2.5-flash" if "imagen" in self.image_model.lower() else self.image_model,
                        contents=prompt,
                    )
                    generated_bytes = self._extract_image_bytes(response)

            # 2. Modern Google GenAI recommended approach: generate_content
            else:
                model_to_use = self.image_model if not ("imagen" in self.image_model.lower() and not self.project_id) else "gemini-2.5-flash"
                response = client.models.generate_content(
                    model=model_to_use,
                    contents=prompt,
                )
                generated_bytes = self._extract_image_bytes(response)

            elapsed_ms = round((time.time() - start_time) * 1000, 2)

            if not generated_bytes:
                return ProcessedImageResult(
                    success=False,
                    provider=self.provider_name,
                    operation="image_generation",
                    error="Vertex AI returned a response without image bytes.",
                    error_code="NO_IMAGE_RETURNED",
                    metadata={
                        "model": self.image_model,
                        "execution_time_ms": elapsed_ms,
                    },
                )

            return ProcessedImageResult(
                success=True,
                provider=self.provider_name,
                operation="image_generation",
                output_format="PNG",
                metadata={
                    "model": self.image_model,
                    "project_id": self.project_id,
                    "location": self.location,
                    "aspect_ratio": aspect_ratio,
                    "execution_time_ms": elapsed_ms,
                    "image_bytes": generated_bytes,
                    "byte_count": len(generated_bytes),
                },
            )

        except Exception as gen_err:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            err_str = str(gen_err)
            err_code = self._map_error_code(err_str)
            logger.error("Vertex AI image generation failed (%s): %s", err_code, gen_err)

            return ProcessedImageResult(
                success=False,
                provider=self.provider_name,
                operation="image_generation",
                error=f"Vertex AI generation error: {err_str}",
                error_code=err_code,
                metadata={
                    "model": self.image_model,
                    "project_id": self.project_id,
                    "location": self.location,
                    "execution_time_ms": elapsed_ms,
                },
            )

    def _normalize_image_for_ai(
        self,
        image_input: Union[str, Path, bytes, BinaryIO, Image.Image],
    ) -> Tuple[bytes, Image.Image]:
        """Validate, correct EXIF orientation, and normalize input into PIL Image and bytes."""
        import io
        from PIL import Image, ImageOps

        if isinstance(image_input, (str, Path)):
            pil_img = Image.open(str(image_input))
        elif isinstance(image_input, bytes):
            pil_img = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, Image.Image):
            pil_img = image_input
        elif hasattr(image_input, "read"):
            pil_img = Image.open(image_input)
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        try:
            pil_img = ImageOps.exif_transpose(pil_img)
        except Exception:
            pass

        # Convert to RGB if palette or non-RGBA
        if pil_img.mode not in ("RGB", "RGBA"):
            pil_img = pil_img.convert("RGB")

        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        return buf.getvalue(), pil_img

    def edit_product_image(
        self,
        image_input: Union[str, Path, bytes, BinaryIO, Image.Image],
        prompt: str,
        aspect_ratio: str = "1:1",
        **kwargs: Any,
    ) -> ProcessedImageResult:
        """Edit and enhance a product photograph with product-aware studio staging."""
        start_time = time.time()

        if not self.is_available:
            return ProcessedImageResult(
                success=False,
                provider=self.provider_name,
                operation="studio_editing",
                error="Vertex AI is not configured. Set GOOGLE_CLOUD_PROJECT or authenticate with gcloud.",
                error_code="CONFIG_ERROR",
            )

        try:
            raw_bytes, pil_img = self._normalize_image_for_ai(image_input)
        except Exception as prep_err:
            return ProcessedImageResult(
                success=False,
                provider=self.provider_name,
                operation="studio_editing",
                error=f"Image validation/preprocessing failed: {str(prep_err)}",
                error_code="INVALID_IMAGE",
            )

        try:
            client = self._get_client()
        except Exception as client_err:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            err_code = self._map_error_code(str(client_err))
            return ProcessedImageResult(
                success=False,
                provider=self.provider_name,
                operation="studio_editing",
                error=f"Vertex AI client initialization failed: {str(client_err)}",
                error_code=err_code,
                metadata={"execution_time_ms": elapsed_ms},
            )

        try:
            logger.info(
                "Invoking Vertex AI Gemini image editing (model=%s, prompt_len=%d)",
                self.image_model,
                len(prompt),
            )

            # Invoke multimodal generate_content with [image, prompt]
            response = client.models.generate_content(
                model=self.image_model,
                contents=[pil_img, prompt],
            )

            generated_bytes = self._extract_image_bytes(response)
            elapsed_ms = round((time.time() - start_time) * 1000, 2)

            if not generated_bytes:
                return ProcessedImageResult(
                    success=False,
                    provider=self.provider_name,
                    operation="studio_editing",
                    error="Vertex AI returned a response without edited image bytes.",
                    error_code="NO_IMAGE_RETURNED",
                    metadata={
                        "model": self.image_model,
                        "execution_time_ms": elapsed_ms,
                    },
                )

            # Safety Validation Check on returned bytes
            try:
                import io
                from PIL import Image
                test_img = Image.open(io.BytesIO(generated_bytes))
                test_img.verify()
            except Exception as decode_err:
                logger.warning("Generated image failed sanity decode check: %s", decode_err)
                return ProcessedImageResult(
                    success=False,
                    provider=self.provider_name,
                    operation="studio_editing",
                    error=f"Generated output failed image decoding: {str(decode_err)}",
                    error_code="CORRUPTED_OUTPUT",
                    metadata={"execution_time_ms": elapsed_ms},
                )

            return ProcessedImageResult(
                success=True,
                provider=self.provider_name,
                operation="studio_editing",
                output_format="PNG",
                metadata={
                    "model": self.image_model,
                    "project_id": self.project_id,
                    "location": self.location,
                    "aspect_ratio": aspect_ratio,
                    "execution_time_ms": elapsed_ms,
                    "image_bytes": generated_bytes,
                    "byte_count": len(generated_bytes),
                },
            )

        except Exception as edit_err:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            err_str = str(edit_err)
            err_code = self._map_error_code(err_str)
            logger.error("Vertex AI studio editing failed (%s): %s", err_code, edit_err)

            return ProcessedImageResult(
                success=False,
                provider=self.provider_name,
                operation="studio_editing",
                error=f"Vertex AI studio editing error: {err_str}",
                error_code=err_code,
                metadata={
                    "model": self.image_model,
                    "project_id": self.project_id,
                    "location": self.location,
                    "execution_time_ms": elapsed_ms,
                },
            )

    def _extract_image_bytes(self, response: Any) -> Optional[bytes]:
        """Extract raw image bytes from Vertex AI / GenAI response object."""
        if response is None:
            return None

        # 1. Imagen generated images response
        if hasattr(response, "generated_images") and response.generated_images:
            for g_img in response.generated_images:
                if hasattr(g_img, "image") and hasattr(g_img.image, "image_bytes"):
                    raw_bytes = g_img.image.image_bytes
                    if isinstance(raw_bytes, bytes):
                        return raw_bytes
                    if isinstance(raw_bytes, str):
                        try:
                            return base64.b64decode(raw_bytes)
                        except Exception:
                            pass

        # 2. Output image attribute
        if hasattr(response, "output_image") and response.output_image is not None:
            out_img = response.output_image
            if hasattr(out_img, "data") and out_img.data:
                if isinstance(out_img.data, bytes):
                    return out_img.data
                try:
                    return base64.b64decode(out_img.data)
                except Exception:
                    pass

        # 3. Candidates inline data
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

        # 4. Dict structure
        if isinstance(response, dict):
            predictions = response.get("predictions")
            if predictions and isinstance(predictions, list) and len(predictions) > 0:
                p0 = predictions[0]
                b64 = p0.get("bytesBase64Encoded") or p0.get("image", {}).get("imageBytes")
                if b64:
                    try:
                        return base64.b64decode(b64)
                    except Exception:
                        pass

        return None

    def _map_error_code(self, err_msg: str) -> str:
        """Map raw error messages to standardized error codes."""
        lowered = err_msg.lower()
        if "401" in lowered or "unauthenticated" in lowered or "invalid credentials" in lowered:
            return "AUTH_ERROR"
        if "403" in lowered or "permission_denied" in lowered or "permissiondenied" in lowered:
            return "PERMISSION_DENIED"
        if "429" in lowered or "quota" in lowered or "resource_exhausted" in lowered:
            return "QUOTA_EXCEEDED"
        if "404" in lowered or "not found" in lowered:
            return "MODEL_NOT_FOUND"
        if "disabled" in lowered or "has not been used in project" in lowered:
            return "API_DISABLED"
        if "timeout" in lowered or "timed out" in lowered:
            return "TIMEOUT_ERROR"
        if "network" in lowered or "connection refused" in lowered or "dns" in lowered:
            return "NETWORK_ERROR"
        return "VERTEX_AI_ERROR"
