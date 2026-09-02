"""Vision service adapter for AI Studio processing."""

import io
import logging
from typing import Any, Dict, List, Optional, Tuple
from PIL import Image

from ai.vision.enhancer import QualityEnhancer, get_quality_enhancer
from ai.vision.schemas import EnhancedImageResult, ImageAsset
from backend.app.schemas.studio import ImageAssetResponse, StudioEnhanceResponse

logger = logging.getLogger(__name__)


def _map_image_asset(asset: Optional[ImageAsset]) -> Optional[ImageAssetResponse]:
    """Map internal ImageAsset to client-safe ImageAssetResponse."""
    if asset is None:
        return None
    return ImageAssetResponse(
        public_id=asset.public_id,
        secure_url=asset.secure_url,
        width=asset.width,
        height=asset.height,
        format=asset.format,
        bytes=asset.bytes,
        created_at=asset.created_at,
    )


class VisionService:
    """Service adapter interfacing FastAPI endpoints with AI Vision pipeline."""

    def __init__(self, enhancer: Optional[QualityEnhancer] = None) -> None:
        """Initialize with existing QualityEnhancer or lazy default."""
        self._enhancer = enhancer

    @property
    def enhancer(self) -> QualityEnhancer:
        """Lazy load or return existing QualityEnhancer instance."""
        if self._enhancer is None:
            self._enhancer = get_quality_enhancer()
        return self._enhancer

    def validate_image_bytes(self, image_bytes: bytes) -> Tuple[bool, Optional[str], Optional[str]]:
        """Validate raw bytes to ensure a non-empty, genuine image file.

        Returns:
            Tuple of (is_valid, error_message, detected_format)
        """
        if not image_bytes or len(image_bytes) == 0:
            return False, "Provided image payload is empty (0 bytes)", None

        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                img.verify()
                detected_format = (img.format or "").lower()
            return True, None, detected_format
        except Exception as e:
            logger.warning(f"Image bytes validation failed: {e}")
            return False, "File content is not a valid or supported image", None

    def enhance_studio_image(
        self,
        image_bytes: bytes,
        category: str = "general",
        preset: Optional[str] = None,
        aspect_ratio: Optional[str] = None,
        add_shadow: Optional[bool] = None,
        quality_mode: str = "auto",
        upscale_factor: int = 2,
        enable_lighting_correction: bool = True,
        enable_super_resolution: bool = True,
        enable_quality_enhancement: bool = True,
        tags: Optional[List[str]] = None,
    ) -> StudioEnhanceResponse:
        """Execute the multi-stage AI vision studio pipeline via QualityEnhancer.

        Args:
            image_bytes: Raw image file content.
            category: Artisan craft category.
            preset: Studio backdrop preset key.
            aspect_ratio: Canvas aspect ratio.
            add_shadow: Whether to render contact drop shadow.
            quality_mode: Processing engine mode ('auto', 'local_ai', 'cloud').
            upscale_factor: Super-resolution factor (2 or 4).
            enable_lighting_correction: CLAHE lighting & white balance toggle.
            enable_super_resolution: 2x/4x Super-resolution toggle.
            enable_quality_enhancement: Master quality engine toggle.
            tags: Optional metadata tags.

        Returns:
            Normalized StudioEnhanceResponse with client-safe asset URLs and telemetry.
        """
        # 1. Validate image bytes
        is_valid, error_msg, _ = self.validate_image_bytes(image_bytes)
        if not is_valid:
            return StudioEnhanceResponse(
                success=False,
                category=category,
                preset=preset or "ecommerce_white",
                aspect_ratio=aspect_ratio or "square_1x1",
                shadow_enabled=add_shadow if add_shadow is not None else True,
                error=error_msg,
                error_code="INVALID_IMAGE_PAYLOAD",
            )

        # 2. Forward to existing QualityEnhancer pipeline
        try:
            result: EnhancedImageResult = self.enhancer.process_enhanced_studio_pipeline(
                image_input=image_bytes,
                category=category,
                preset=preset,
                aspect_ratio=aspect_ratio,
                add_shadow=add_shadow,
                quality_mode=quality_mode,
                upscale_factor=upscale_factor,
                enable_lighting_correction=enable_lighting_correction,
                enable_super_resolution=enable_super_resolution,
                enable_quality_enhancement=enable_quality_enhancement,
                tags=tags,
            )
        except Exception as exc:
            logger.exception(f"Unexpected error in QualityEnhancer pipeline: {exc}")
            return StudioEnhanceResponse(
                success=False,
                category=category,
                preset=preset or "ecommerce_white",
                aspect_ratio=aspect_ratio or "square_1x1",
                shadow_enabled=add_shadow if add_shadow is not None else True,
                error=f"Vision pipeline processing error: {str(exc)}",
                error_code="PIPELINE_EXECUTION_ERROR",
            )

        # 3. Map pipeline result to client-facing response
        return StudioEnhanceResponse(
            success=result.success,
            provider=result.provider,
            original=_map_image_asset(result.original),
            cutout=_map_image_asset(result.cutout),
            enhanced=_map_image_asset(result.enhanced),
            category=result.category,
            preset=result.preset,
            aspect_ratio=result.aspect_ratio,
            shadow_enabled=result.shadow_enabled,
            metadata=result.metadata or {},
            error=result.error,
            error_code=result.error_code,
        )


_default_vision_service: Optional[VisionService] = None


def get_vision_service() -> VisionService:
    """Dependency provider for VisionService."""
    global _default_vision_service
    if _default_vision_service is None:
        _default_vision_service = VisionService()
    return _default_vision_service
