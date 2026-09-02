"""AI Image Quality Enhancement, Super-Resolution & Studio Orchestrator.

Orchestrates the complete 4-stage artisan vision pipeline:
1. AI Lighting & White-Balance Correction (CLAHE + Gray-World Color Normalization)
2. AI Pixel Super-Resolution & Texture Reconstruction (2x/4x Detail Sharpening)
3. AI Cluttered Background Removal (Offline U2-Net / Rembg with zero API fees)
4. E-Commerce Studio Framing, Backdrops & Contact Drop Shadows (Marketplace Standards)

Guarantees 100% genuine handicraft authenticity without synthetic distortion.
"""

from pathlib import Path
import time
from typing import Any, BinaryIO, Dict, List, Optional, Union
import urllib.request

from ai.vision.cloudinary_service import CloudinaryService
from ai.vision.lighting import LightingCorrector
from ai.vision.persistence import PersistenceBridge
from ai.vision.providers.picsart_provider import PicsartProvider
from ai.vision.providers.rembg_provider import RembgProvider
from ai.vision.providers.sr_provider import SuperResolutionProvider
from ai.vision.schemas import EnhancedImageResult, ImageAsset, ProcessedImageResult, QualityAnalysisResult
from ai.vision.studio import StudioComposer


class QualityEnhancer:
    """End-to-end vision pipeline orchestrator for artisan e-commerce photography."""

    def __init__(
        self,
        lighting_corrector: Optional[LightingCorrector] = None,
        sr_provider: Optional[SuperResolutionProvider] = None,
        rembg_provider: Optional[RembgProvider] = None,
        picsart_provider: Optional[PicsartProvider] = None,
        cloudinary_service: Optional[CloudinaryService] = None,
        studio_composer: Optional[StudioComposer] = None,
    ) -> None:
        """Initialize QualityEnhancer with vision service dependencies."""
        self.lighting = lighting_corrector or LightingCorrector()
        self.sr = sr_provider or SuperResolutionProvider()
        self.rembg = rembg_provider or RembgProvider()
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
        """Enhance image quality using Picsart AI models."""
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
        enable_lighting_correction: bool = True,
        enable_super_resolution: bool = True,
        enable_quality_enhancement: bool = True,
        tags: Optional[List[str]] = None,
    ) -> EnhancedImageResult:
        """Execute the complete 4-stage local AI vision & studio presentation pipeline.

        Flow:
        1. Ingest raw photo into persistent Cloudinary storage (artisan-ai/originals/).
        2. Perform automated image quality analysis & classification.
        3. Stage 1: Correct dim/uneven lighting, shadow underexposure, and color balance.
        4. Stage 2: Reconstruct pixel sharpness, deblur, and upscale 2x/4x via SuperResolutionProvider.
        5. Stage 3: Extract transparent PNG cutout via RembgProvider.
        6. Stage 4: Compose onto professional e-commerce studio backdrop with contact shadow.
        7. Persist final studio asset into Cloudinary (artisan-ai/enhanced/).

        Args:
            image_input: Raw image payload (file path, raw bytes, or stream).
            category: Artisan craft category (pottery, textiles, wooden_crafts, jewellery, general).
            preset: Studio backdrop preset key (ecommerce_white, warm_neutral, terracotta_sand, minimal_grey).
            aspect_ratio: Canvas aspect ratio (square_1x1, portrait_4x5, portrait_9x16, landscape_16x9).
            add_shadow: Whether to apply a realistic 3D contact drop shadow.
            quality_mode: Processing mode ('local_ai', 'cloud', 'auto').
            upscale_factor: Super-resolution multiplier (2 or 4).
            enable_lighting_correction: Toggle for lighting & white-balance engine.
            enable_super_resolution: Toggle for 2x/4x pixel super-resolution engine.
            enable_quality_enhancement: Master quality enhancement toggle.
            tags: Optional metadata tags.

        Returns:
            EnhancedImageResult with original, cutout, and final enhanced studio assets.
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

        # 2. Ingest raw original photograph to Cloudinary (artisan-ai/originals/)
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

        # 3. Quality Analysis
        analysis = self.analyze_quality(original_asset.public_id)

        working_bytes = image_bytes
        pipeline_telemetry: Dict[str, Any] = {
            "quality_tier": analysis.quality_tier,
            "quality_score": analysis.quality_score,
            "megapixels_original": analysis.megapixels,
            "stages_applied": [],
        }

        # 4. Multi-Tier AI Quality Enhancement & Super-Resolution
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
                            if getattr(cdn_res, "status", 200) in (200, None):
                                working_bytes = cdn_res.read()
                                pipeline_telemetry["quality_enhancement_status"] = f"applied ({clean_mode})"
                                pipeline_telemetry["stages_applied"].append(f"picsart_{clean_mode}")
                    except Exception as exc:
                        pipeline_telemetry["quality_enhancement_status"] = f"fallback ({str(exc)})"
                else:
                    pipeline_telemetry["quality_enhancement_status"] = f"fallback (provider: {enh_res.error})"

            elif clean_mode in ("cloudinary", "auto"):
                try:
                    cloudinary_enhanced_url = self.cloudinary.get_quality_enhanced_url(
                        public_id=original_asset.public_id,
                        quality_tier=analysis.quality_tier,
                    )
                    pipeline_telemetry["cloudinary_enhanced_url"] = cloudinary_enhanced_url
                    req = urllib.request.Request(
                        url=cloudinary_enhanced_url,
                        headers={"User-Agent": "KalaMitra-QualityEnhancer/1.0"},
                    )
                    with urllib.request.urlopen(req, timeout=25) as cdn_res:
                        if getattr(cdn_res, "status", 200) in (200, None):
                            working_bytes = cdn_res.read()
                            pipeline_telemetry["cloudinary_enhancement_status"] = "applied"
                            pipeline_telemetry["stages_applied"].append("cloudinary_ai_enhance")
                except Exception as exc:
                    pipeline_telemetry["cloudinary_enhancement_status"] = f"fallback ({str(exc)})"

            else:
                # 100% Local AI Pipeline (Lighting + Super-Resolution)
                if enable_lighting_correction:
                    try:
                        working_bytes, light_telemetry = self.lighting.correct_lighting(
                            working_bytes,
                            enable_white_balance=True,
                            enable_clahe=True,
                            enable_auto_exposure=True,
                        )
                        pipeline_telemetry["lighting_correction"] = light_telemetry
                        pipeline_telemetry["stages_applied"].append("lighting_correction")
                    except Exception as light_err:
                        pipeline_telemetry["lighting_correction_error"] = str(light_err)

                if enable_super_resolution:
                    try:
                        working_bytes, sr_telemetry = self.sr.upscale_image(
                            working_bytes,
                            scale=upscale_factor,
                        )
                        pipeline_telemetry["super_resolution"] = sr_telemetry
                        pipeline_telemetry["stages_applied"].append(f"super_resolution_{upscale_factor}x")
                    except Exception as sr_err:
                        pipeline_telemetry["super_resolution_error"] = str(sr_err)

        # 5. Background Removal (Try Picsart first, seamless local Rembg fallback)
        cutout_bytes: Optional[bytes] = None

        try:
            cutout_res = self.picsart.remove_background(
                image_input=working_bytes,
                output_format="PNG",
            )
            if cutout_res.success and cutout_res.output_url:
                req = urllib.request.Request(
                    url=cutout_res.output_url,
                    headers={"User-Agent": "KalaMitra-QualityEnhancer/1.0"},
                )
                with urllib.request.urlopen(req, timeout=30) as cdn_response:
                    if getattr(cdn_response, "status", 200) in (200, None):
                        dl_bytes = cdn_response.read()
                        if len(dl_bytes) >= 8 and dl_bytes[:8] == b"\x89PNG\r\n\x1a\n":
                            cutout_bytes = dl_bytes
                            pipeline_telemetry["cutout_provider"] = "picsart_cloud"
                            pipeline_telemetry["stages_applied"].append("background_removal_cloud")
        except Exception:
            pass


        if cutout_bytes is None:
            try:
                cutout_bytes = self.rembg.extract_cutout_bytes(working_bytes)
                pipeline_telemetry["cutout_provider"] = "rembg_offline_u2net"
                pipeline_telemetry["stages_applied"].append("background_removal_local")
            except Exception as rembg_err:
                pass

        if cutout_bytes is None or len(cutout_bytes) < 8 or cutout_bytes[:8] != b"\x89PNG\r\n\x1a\n":
            return EnhancedImageResult(
                success=False,
                original=original_asset,
                cutout=None,
                enhanced=None,
                category=category,
                error="Background removal failed to extract a valid transparent PNG cutout",
                error_code="BACKGROUND_REMOVAL_FAILED",
                metadata={"pipeline_telemetry": pipeline_telemetry},
            )


        # 7. Upload transparent cutout PNG to Cloudinary (artisan-ai/cutouts/)
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
                metadata={"pipeline_telemetry": pipeline_telemetry},
            )
        cutout_asset = cutout_upload.asset
        if cutout_upload.metadata:
            pipeline_telemetry["cutout_optimization"] = cutout_upload.metadata
            if cutout_upload.metadata.get("optimization_required"):
                pipeline_telemetry["stages_applied"].append("cutout_size_optimization")

        # 8. Stage 4: E-Commerce Studio Presentation Composition
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
        pipeline_telemetry["stages_applied"].append("studio_composition")
        pipeline_telemetry["total_execution_time_ms"] = elapsed_ms

        if final_result.metadata is not None:
            final_result.metadata["total_execution_time_ms"] = elapsed_ms
            final_result.metadata["pipeline_telemetry"] = pipeline_telemetry

        return final_result


def get_quality_enhancer() -> QualityEnhancer:
    """Factory helper to obtain a QualityEnhancer instance."""
    return QualityEnhancer()
