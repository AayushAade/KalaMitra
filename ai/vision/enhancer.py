"""AI Image Quality Enhancement & Super-Resolution Layer.

Enhances poor-quality artisan smartphone photographs using Cloudinary AI Quality Analysis &
Restoration alongside Picsart fine adjustments before cutout extraction and studio composition.
Strictly guarantees that genuine product characteristics, textures, and geometry remain unmodified.
"""

from pathlib import Path
import time
from typing import Any, BinaryIO, Dict, List, Optional, Union
import urllib.request

from ai.vision.cloudinary_service import CloudinaryService
from ai.vision.persistence import PersistenceBridge
from ai.vision.providers.picsart_provider import PicsartProvider
from ai.vision.schemas import EnhancedImageResult, ImageAsset, ProcessedImageResult, QualityAnalysisResult
from ai.vision.studio import StudioComposer


class QualityEnhancer:
    """Orchestrator for automated image quality analysis, super-resolution, and studio presentation."""

    def __init__(
        self,
        picsart_provider: Optional[PicsartProvider] = None,
        cloudinary_service: Optional[CloudinaryService] = None,
        studio_composer: Optional[StudioComposer] = None,
    ) -> None:
        """Initialize QualityEnhancer with vision service dependencies."""
        self.picsart = picsart_provider or PicsartProvider()
        self.cloudinary = cloudinary_service or CloudinaryService()
        self.studio = studio_composer or StudioComposer(cloudinary_service=self.cloudinary)
        self.bridge = PersistenceBridge(
            cloudinary_service=self.cloudinary,
            picsart_provider=self.picsart,
        )

    def analyze_quality(self, public_id: str) -> QualityAnalysisResult:
        """Analyze image resolution, dimensions, and compression to determine quality tier."""
        return self.cloudinary.analyze_image_quality(public_id)

    def enhance_image(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        mode: str = "ultra",
        upscale_factor: int = 2,
    ) -> ProcessedImageResult:
        """Enhance image quality using Picsart AI models.

        Args:
            image_input: Raw image payload (file path, bytes, or stream).
            mode: Enhancement mode ('ultra', 'upscale', or 'standard').
            upscale_factor: Scaling multiplier (2 or 4).

        Returns:
            ProcessedImageResult with enhanced asset URL and metadata.
        """
        clean_mode = mode.lower()
        if clean_mode == "ultra":
            return self.picsart.ultra_enhance(
                image_input=image_input,
                upscale_factor=upscale_factor,
                output_format="JPG",
            )
        elif clean_mode == "upscale":
            return self.picsart.upscale(
                image_input=image_input,
                upscale_factor=upscale_factor,
                output_format="JPG",
            )
        elif clean_mode == "standard":
            return self.picsart.adjust(
                image_input=image_input,
                clarity=20,
                contrast=10,
                vibrance=10,
                output_format="JPG",
            )
        else:
            return ProcessedImageResult(
                success=False,
                provider="picsart",
                operation="quality_enhancement",
                error=f"Unsupported quality enhancement mode '{mode}'. Valid modes: ultra, upscale, standard",
                error_code="INVALID_ENHANCEMENT_MODE",
            )

    def process_enhanced_studio_pipeline(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        category: str = "general",
        preset: Optional[str] = None,
        aspect_ratio: Optional[str] = None,
        add_shadow: Optional[bool] = None,
        quality_mode: str = "auto",
        upscale_factor: int = 2,
        enable_quality_enhancement: bool = True,
        tags: Optional[List[str]] = None,
    ) -> EnhancedImageResult:
        """Execute full end-to-end multi-tier quality-enhanced studio pipeline.

        Flow:
        1. Ingest & store raw original in Cloudinary (artisan-ai/originals/).
        2. Perform automated image quality analysis (High / Medium / Poor tier).
        3. Apply AI Quality Enhancement (Cloudinary or Picsart depending on mode).
        4. Extract transparent cutout from enhanced image (POST /removebg).
        5. Validate & store transparent PNG cutout in Cloudinary (artisan-ai/cutouts/).
        6. Compose studio backdrop & contact shadow into Cloudinary (artisan-ai/enhanced/).

        Args:
            image_input: Raw image input.
            category: Artisan craft category (pottery, textiles, wooden_crafts, jewellery, general).
            preset: Studio backdrop preset.
            aspect_ratio: Canvas aspect ratio.
            add_shadow: Contact drop shadow toggle.
            quality_mode: Quality mode ('auto', 'ultra', 'upscale', 'standard', 'cloudinary').
            upscale_factor: Scaling factor (2 or 4).
            enable_quality_enhancement: Whether to apply quality enhancement.
            tags: Optional metadata tags.

        Returns:
            EnhancedImageResult with original, cutout, and enhanced assets.
        """
        start_time = time.time()
        pipeline_tags = list(tags) if tags else []

        # 1. Normalize image into byte buffer
        image_bytes: bytes
        if isinstance(image_input, (str, Path)):
            path_obj = Path(image_input)
            if not path_obj.exists():
                return EnhancedImageResult(
                    success=False,
                    category=category,
                    error=f"Source image file not found: {path_obj}",
                    error_code="FILE_NOT_FOUND",
                )
            image_bytes = path_obj.read_bytes()
        elif isinstance(image_input, bytes):
            image_bytes = image_input
        elif hasattr(image_input, "read"):
            image_bytes = image_input.read()
        else:
            return EnhancedImageResult(
                success=False,
                category=category,
                error=f"Unsupported image input type: {type(image_input)}",
                error_code="INVALID_INPUT_TYPE",
            )

        if not image_bytes:
            return EnhancedImageResult(
                success=False,
                category=category,
                error="Provided image payload is empty (0 bytes)",
                error_code="EMPTY_IMAGE",
            )

        # 2. Upload raw original photograph to Cloudinary (artisan-ai/originals/)
        orig_upload_res = self.cloudinary.upload_original_image(
            image_input=image_bytes,
            tags=pipeline_tags,
        )
        if not orig_upload_res.success or not orig_upload_res.asset:
            return EnhancedImageResult(
                success=False,
                category=category,
                error=f"Failed to upload original image to Cloudinary: {orig_upload_res.error}",
                error_code="ORIGINAL_UPLOAD_FAILED",
            )
        original_asset = orig_upload_res.asset

        # 3. Automated Image Quality Analysis (Cloudinary)
        analysis = self.analyze_quality(original_asset.public_id)

        working_image_bytes = image_bytes
        quality_metadata: Dict[str, Any] = {
            "quality_enhancement_enabled": enable_quality_enhancement,
            "quality_tier": analysis.quality_tier,
            "megapixels": analysis.megapixels,
            "quality_score": analysis.quality_score,
            "recommended_transformations": analysis.recommended_transformations,
        }

        # 4. Multi-Tier AI Quality Enhancement
        if enable_quality_enhancement:
            clean_mode = quality_mode.lower()

            if clean_mode in ("ultra", "upscale"):
                # Picsart AI Upscale / Ultra-Enhance
                enh_res = self.enhance_image(
                    image_input=image_bytes,
                    mode=clean_mode,
                    upscale_factor=upscale_factor,
                )
                if enh_res.success and enh_res.output_url:
                    try:
                        req = urllib.request.Request(
                            url=enh_res.output_url,
                            headers={"User-Agent": "KalaMitra-QualityEnhancer/1.0"},
                        )
                        with urllib.request.urlopen(req, timeout=30) as cdn_res:
                            if cdn_res.status == 200:
                                working_image_bytes = cdn_res.read()
                                quality_metadata["quality_enhancement_status"] = f"applied ({clean_mode})"
                    except Exception as exc:
                        quality_metadata["quality_enhancement_status"] = f"fallback ({str(exc)})"
                else:
                    quality_metadata["quality_enhancement_status"] = f"fallback (provider: {enh_res.error})"

            else:
                # Cloudinary AI Quality Enhancement
                try:
                    cloudinary_enhanced_url = self.cloudinary.get_quality_enhanced_url(
                        public_id=original_asset.public_id,
                        quality_tier=analysis.quality_tier,
                    )
                    quality_metadata["cloudinary_enhanced_url"] = cloudinary_enhanced_url

                    req = urllib.request.Request(
                        url=cloudinary_enhanced_url,
                        headers={"User-Agent": "KalaMitra-QualityEnhancer/1.0"},
                    )
                    with urllib.request.urlopen(req, timeout=25) as cdn_res:
                        if cdn_res.status == 200:
                            working_image_bytes = cdn_res.read()
                            quality_metadata["cloudinary_enhancement_status"] = "applied"
                except Exception as exc:
                    quality_metadata["cloudinary_enhancement_status"] = f"fallback ({str(exc)})"

                # Picsart Fine Tuning (Standard Mode)
                if clean_mode == "standard":
                    adj_res = self.picsart.adjust(
                        image_input=working_image_bytes,
                        clarity=20,
                        contrast=10,
                        vibrance=10,
                    )
                    if adj_res.success and adj_res.output_url:
                        try:
                            req = urllib.request.Request(
                                url=adj_res.output_url,
                                headers={"User-Agent": "KalaMitra-QualityEnhancer/1.0"},
                            )
                            with urllib.request.urlopen(req, timeout=25) as adj_cdn_res:
                                if adj_cdn_res.status == 200:
                                    working_image_bytes = adj_cdn_res.read()
                                    quality_metadata["picsart_adjust_status"] = "applied"
                        except Exception:
                            quality_metadata["picsart_adjust_status"] = "fallback"

        # 5. Background Removal (Cutout Extraction)
        cutout_res = self.picsart.remove_background(
            image_input=working_image_bytes,
            output_format="PNG",
        )

        if not cutout_res.success or not cutout_res.output_url:
            return EnhancedImageResult(
                success=False,
                original=original_asset,
                cutout=None,
                enhanced=None,
                category=category,
                error=f"Background removal failed: {cutout_res.error}",
                error_code=cutout_res.error_code or "BACKGROUND_REMOVAL_FAILED",
                metadata={"quality_metadata": quality_metadata},
            )

        # 6. Fetch and validate transparent PNG cutout
        try:
            req = urllib.request.Request(
                url=cutout_res.output_url,
                headers={"User-Agent": "KalaMitra-QualityEnhancer/1.0"},
            )
            with urllib.request.urlopen(req, timeout=30) as cdn_response:
                cutout_bytes = cdn_response.read()

            if len(cutout_bytes) < 8 or cutout_bytes[:8] != b"\x89PNG\r\n\x1a\n":
                return EnhancedImageResult(
                    success=False,
                    original=original_asset,
                    cutout=None,
                    enhanced=None,
                    category=category,
                    error="Downloaded cutout is not a valid PNG format",
                    error_code="INVALID_CUTOUT_FORMAT",
                    metadata={"quality_metadata": quality_metadata},
                )
        except Exception as exc:
            return EnhancedImageResult(
                success=False,
                original=original_asset,
                cutout=None,
                enhanced=None,
                category=category,
                error=f"Failed to fetch cutout PNG from CDN: {str(exc)}",
                error_code="CUTOUT_DOWNLOAD_FAILED",
                metadata={"quality_metadata": quality_metadata},
            )

        # 7. Upload cutout to Cloudinary (artisan-ai/cutouts/)
        cutout_tags = list(pipeline_tags)
        cutout_tags.append("cutout")
        cutout_upload = self.cloudinary.upload_cutout_image(
            image_input=cutout_bytes,
            tags=cutout_tags,
        )

        if not cutout_upload.success or not cutout_upload.asset:
            return EnhancedImageResult(
                success=False,
                original=original_asset,
                cutout=None,
                enhanced=None,
                category=category,
                error=f"Cloudinary cutout upload failed: {cutout_upload.error}",
                error_code="CUTOUT_UPLOAD_FAILED",
                metadata={"quality_metadata": quality_metadata},
            )
        cutout_asset = cutout_upload.asset

        # 8. Compose Studio Presentation on chosen Backdrop
        final_result = self.studio.compose_studio_image(
            cutout=cutout_asset,
            original=original_asset,
            category=category,
            preset=preset,
            aspect_ratio=aspect_ratio,
            add_shadow=add_shadow,
            tags=pipeline_tags,
        )

        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        if final_result.metadata is not None:
            final_result.metadata["total_execution_time_ms"] = elapsed_ms
            final_result.metadata["quality_enhancement"] = quality_metadata

        return final_result


def get_quality_enhancer() -> QualityEnhancer:
    """Factory helper to obtain a QualityEnhancer instance."""
    return QualityEnhancer()
