"""Image Processing Service Orchestrator for KalaMitra Artisan Studio.

Orchestrates the end-to-end artisan e-commerce photography pipeline:
1. Input validation & EXIF normalization
2. Product category & visual style resolution
3. Dynamic product-aware studio prompt construction
4. Immutable original image vault persistence in Cloudinary
5. Primary Engine: Vertex AI Gemini Image Editing
6. Quality & product-preservation fidelity check
7. Resilient Secondary Engine: Local Studio Fallback Pipeline
8. Cloudinary enhanced asset upload & catalogue reference delivery
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
import time
from typing import Any, BinaryIO, Dict, List, Optional, Tuple, Union
from PIL import Image, ImageOps

from backend.app.core.product_studio_prompts import (
    ProductCategory,
    VisualStyle,
    build_artisan_studio_prompt,
    resolve_product_category,
    resolve_visual_style,
)
from backend.app.services.image_processing.base import BaseImageProcessingProvider
from backend.app.services.image_processing.local_provider import LocalImageProcessingProvider
from backend.app.services.image_processing.vertex_provider import VertexAIImageProvider
from ai.vision.cloudinary_service import CloudinaryService
from ai.vision.fidelity import ProductFidelityValidator
from ai.vision.schemas import EnhancedImageResult, ImageAsset, ProcessedImageResult

logger = logging.getLogger(__name__)

SUPPORTED_MIME_TYPES = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB limit


class ImageProcessingService:
    """Core image processing service orchestrator."""

    def __init__(
        self,
        vertex_provider: Optional[VertexAIImageProvider] = None,
        local_provider: Optional[LocalImageProcessingProvider] = None,
        cloudinary_service: Optional[CloudinaryService] = None,
        fidelity_validator: Optional[ProductFidelityValidator] = None,
        provider: Optional[BaseImageProcessingProvider] = None,
    ) -> None:
        """Initialize service with designated cloud and local providers."""
        self.vertex = vertex_provider or (provider if isinstance(provider, VertexAIImageProvider) else None) or provider or VertexAIImageProvider()
        self.local = local_provider or LocalImageProcessingProvider()
        self.cloudinary = cloudinary_service or CloudinaryService()
        self.fidelity = fidelity_validator or ProductFidelityValidator()


    @property
    def provider(self) -> BaseImageProcessingProvider:
        """Default active cloud provider."""
        return self.vertex

    def verify_provider_connection(self) -> Dict[str, Any]:
        """Verify the active Vertex AI provider connectivity and credentials."""
        return self.vertex.verify_connection()

    def test_generate_image(
        self,
        prompt: str = "A luxury handcrafted Indian terracotta pot displayed on a minimalist studio podium, soft diffused lighting, 8k e-commerce photo",
        aspect_ratio: str = "1:1",
        number_of_images: int = 1,
        **kwargs: Any,
    ) -> ProcessedImageResult:
        """Execute a test image generation request through the configured Vertex AI provider."""
        return self.vertex.generate_image(
            prompt=prompt,
            aspect_ratio=aspect_ratio,
            number_of_images=number_of_images,
            **kwargs,
        )

    def validate_image_payload(
        self,
        image_input: Union[str, Path, bytes, BinaryIO, Image.Image],
    ) -> Tuple[bytes, Image.Image, str]:
        """Validate format, size, and decode image with EXIF normalization.

        Raises:
            ValueError: If image is empty, oversized, or corrupted.
        """
        import io

        raw_bytes: bytes
        if isinstance(image_input, (str, Path)):
            p = Path(image_input)
            if not p.exists():
                raise ValueError(f"Image file not found: {p}")
            raw_bytes = p.read_bytes()
        elif isinstance(image_input, bytes):
            raw_bytes = image_input
        elif isinstance(image_input, Image.Image):
            buf = io.BytesIO()
            image_input.save(buf, format="PNG")
            raw_bytes = buf.getvalue()
        elif hasattr(image_input, "read"):
            raw_bytes = image_input.read()
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        if not raw_bytes or len(raw_bytes) == 0:
            raise ValueError("Uploaded image payload is empty (0 bytes).")

        if len(raw_bytes) > MAX_IMAGE_SIZE_BYTES:
            raise ValueError(
                f"Image file size ({len(raw_bytes) / (1024 * 1024):.1f} MB) exceeds maximum allowed size of 15 MB."
            )

        try:
            pil_img = Image.open(io.BytesIO(raw_bytes))
            pil_img.verify()
            pil_img = Image.open(io.BytesIO(raw_bytes))
            original_format = (pil_img.format or "JPEG").upper()
        except Exception as err:
            raise ValueError(f"Corrupted or invalid image file: {str(err)}")

        # Correct EXIF rotation
        try:
            pil_img = ImageOps.exif_transpose(pil_img)
        except Exception:
            pass

        format_name = original_format
        if format_name not in ("JPEG", "JPG", "PNG", "WEBP"):
            raise ValueError(f"Unsupported image format: {format_name}. Supported: JPEG, JPG, PNG, WEBP.")

        mime_type = f"image/{format_name.lower()}"
        if format_name in ("JPEG", "JPG"):
            mime_type = "image/jpeg"


        return raw_bytes, pil_img, mime_type

    def enhance_artisan_product_image(
        self,
        image_input: Union[str, Path, bytes, BinaryIO, Image.Image],
        product_category: Optional[str] = None,
        product_name: Optional[str] = None,
        product_description: Optional[str] = None,
        style: Optional[str] = None,
        aspect_ratio: str = "1:1",
    ) -> Dict[str, Any]:
        """Execute end-to-end artisan product photography enhancement.

        Workflow:
        1. Validate & normalize image
        2. Resolve category & visual style
        3. Build dynamic product-aware prompt
        4. Upload immutable original image to Cloudinary vault
        5. PRIMARY: Invoke Vertex AI Gemini Image Editing
        6. Validate product preservation fidelity
        7. SECONDARY: Auto-fallback to Local Fallback Pipeline if Vertex fails or rejects
        8. Upload enhanced image to Cloudinary & return catalogue asset
        """
        start_time = time.time()

        # 1. Validation & Preprocessing
        try:
            raw_bytes, pil_img, mime_type = self.validate_image_payload(image_input)
        except ValueError as val_err:
            return {
                "success": False,
                "error": str(val_err),
                "error_code": "VALIDATION_ERROR",
                "execution_time_ms": round((time.time() - start_time) * 1000, 2),
            }

        # 2. Category & Style Resolution
        category = resolve_product_category(
            explicit_category=product_category,
            product_name=product_name,
            product_description=product_description,
        )
        visual_style = resolve_visual_style(
            explicit_style=style,
            category=category,
        )

        # 3. Build Product-Aware Prompt
        prompt = build_artisan_studio_prompt(
            category=category,
            style=visual_style,
            product_name=product_name,
            product_description=product_description,
        )

        logger.info(
            "Starting Artisan Studio enhancement (category=%s, style=%s, img_bytes=%d)",
            category.value,
            visual_style.value,
            len(raw_bytes),
        )

        # 4. Immutable Original Image Ingest to Cloudinary
        orig_upload = self.cloudinary.upload_original_image(
            image_input=raw_bytes,
            tags=["original", f"cat_{category.value.lower()}"],
        )
        original_asset = orig_upload.asset if orig_upload.success else None
        original_url = original_asset.secure_url if original_asset else None

        pipeline_telemetry: Dict[str, Any] = {
            "category": category.value,
            "style": visual_style.value,
            "original_public_id": original_asset.public_id if original_asset else None,
            "stages_applied": ["validation", "prompt_construction", "original_vault_ingest"],
        }

        # 5. PRIMARY ENGINE: Vertex AI Gemini Image Editing
        vertex_success = False
        enhanced_bytes = None
        vertex_error = None
        vertex_error_code = None

        if self.vertex.is_available:
            try:
                vertex_res = self.vertex.edit_product_image(
                    image_input=raw_bytes,
                    prompt=prompt,
                    aspect_ratio=aspect_ratio,
                )

                if vertex_res.success and vertex_res.metadata and vertex_res.metadata.get("image_bytes"):
                    candidate_bytes = vertex_res.metadata["image_bytes"]

                    # 6. Safety & Product Fidelity Validation
                    fidelity_res = self.fidelity.validate(
                        original_image=raw_bytes,
                        generated_image=candidate_bytes,
                        category=category.value.lower(),
                    )

                    pipeline_telemetry["fidelity"] = fidelity_res.model_dump()
                    pipeline_telemetry["stages_applied"].append("vertex_ai_editing")
                    pipeline_telemetry["stages_applied"].append("fidelity_validation")

                    review_action = os.getenv("FIDELITY_REVIEW_ACTION", "accept").strip().lower()
                    if fidelity_res.decision == "PASS" or (fidelity_res.decision == "REVIEW" and review_action == "accept"):
                        enhanced_bytes = candidate_bytes
                        vertex_success = True
                    else:
                        vertex_error = f"Vertex output rejected by product fidelity gate ({fidelity_res.decision})"
                        vertex_error_code = f"FIDELITY_{fidelity_res.decision}"
                        logger.warning(vertex_error)
                else:
                    vertex_error = vertex_res.error
                    vertex_error_code = vertex_res.error_code
            except Exception as v_err:
                vertex_error = str(v_err)
                vertex_error_code = "VERTEX_EXCEPTION"
                logger.error("Vertex AI execution exception: %s", v_err)
        else:
            vertex_error = "Vertex AI is not configured"
            vertex_error_code = "VERTEX_NOT_CONFIGURED"

        # 7. SECONDARY ENGINE: Local Fallback Pipeline (if Vertex fails or rejected)
        active_provider = "VERTEX_AI"
        fallback_used = False

        if not vertex_success or not enhanced_bytes:
            reason_desc = "quota exceeded" if vertex_error_code == "QUOTA_EXCEEDED" else (vertex_error or "engine unavailable")
            logger.warning("[AI Studio] Gemini unavailable: %s", reason_desc)
            logger.info("[AI Studio] Falling back to Local Studio Fallback Engine (rembg / U2-Net)")
            fallback_used = True
            active_provider = "LOCAL_FALLBACK"
            pipeline_telemetry["fallback_reason"] = f"{vertex_error_code}: {vertex_error}"
            pipeline_telemetry["stages_applied"].append("local_fallback_engine")

            local_res = self.local.generate_studio_image(
                image_input=raw_bytes,
                category=category,
                style=visual_style,
                canvas_size=1080,
            )

            if local_res.success and local_res.metadata and local_res.metadata.get("image_bytes"):
                enhanced_bytes = local_res.metadata["image_bytes"]
            else:
                elapsed_ms = round((time.time() - start_time) * 1000, 2)
                return {
                    "success": False,
                    "error": f"Both Vertex AI and Local Fallback processing failed: {local_res.error or vertex_error}",
                    "error_code": "ALL_PROVIDERS_FAILED",
                    "provider": "NONE",
                    "fallbackUsed": True,
                    "category": category.value,
                    "style": visual_style.value,
                    "execution_time_ms": elapsed_ms,
                    "telemetry": pipeline_telemetry,
                }

        # 8. Upload Enhanced Image to Cloudinary & Deliver Final Catalogue Reference
        upload_tags = [
            "enhanced",
            f"prov_{active_provider.lower()}",
            f"cat_{category.value.lower()}",
            f"style_{visual_style.value.lower()}",
        ]
        enhanced_upload = self.cloudinary.upload_enhanced_image(
            image_input=enhanced_bytes,
            tags=upload_tags,
            format_override="webp",
        )

        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        pipeline_telemetry["stages_applied"].append("enhanced_upload")
        pipeline_telemetry["total_execution_time_ms"] = elapsed_ms

        if enhanced_upload.success and enhanced_upload.asset:
            enhanced_url = enhanced_upload.asset.secure_url
            enhanced_public_id = enhanced_upload.asset.public_id
        else:
            # If Cloudinary upload fails, deliver as inline data uri fallback
            import base64
            b64 = base64.b64encode(enhanced_bytes).decode("utf-8")
            enhanced_url = f"data:image/webp;base64,{b64}"
            enhanced_public_id = "local-encoded-asset"

        return {
            "success": True,
            "imageUrl": enhanced_url,
            "originalImageUrl": original_url,
            "publicId": enhanced_public_id,
            "provider": active_provider,
            "fallbackUsed": fallback_used,
            "category": category.value,
            "style": visual_style.value,
            "executionTimeMs": elapsed_ms,
            "telemetry": pipeline_telemetry,
        }


_service_instance: Optional[ImageProcessingService] = None


def get_image_processing_service() -> ImageProcessingService:
    """Dependency factory providing a singleton ImageProcessingService instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = ImageProcessingService()
    return _service_instance
