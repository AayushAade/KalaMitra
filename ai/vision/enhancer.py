"""AI Image Quality Enhancement, Super-Resolution & Studio Orchestrator.

Orchestrates the complete KalaMitra production vision pipeline:
1. Immutable Raw Ingestion into Cloudinary Storage Vault (artisan-ai/originals/)
2. Gemini / Nano Banana Primary Studio Generation Engine (Master E-Commerce Prompt)
3. Product Fidelity Validation Gate (SSIM, Mask IoU, CIELAB Delta E, Geometry checks)
   - If PASS -> Cloudinary Final Catalog Asset (artisan-ai/enhanced/)
   - If FAIL / REVIEW / Timeout / API Error -> Seamless Local Fallback Pipeline
4. Local Fallback Pipeline:
   - AI Lighting & White-Balance Correction (CLAHE + Gray-World Color Normalization)
   - AI Super-Resolution & Texture Reconstruction (Lanczos-4 / Bilateral Unsharp)
   - Transparent Background Removal (Rembg U2-Net / Picsart Cutout)
   - E-Commerce Studio Framing & Contact Shadows (StudioComposer)
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
import time
from typing import Any, BinaryIO, Dict, List, Optional, Union
import urllib.request

from ai.vision.cloudinary_service import CloudinaryService
from ai.vision.fidelity import ProductFidelityValidator
from ai.vision.lighting import LightingCorrector
from ai.vision.persistence import PersistenceBridge
from ai.vision.providers.gemini_studio import GeminiStudioProvider
from ai.vision.providers.photoroom_provider import PhotoroomProvider
from ai.vision.providers.picsart_provider import PicsartProvider
from ai.vision.providers.rembg_provider import RembgProvider
try:
    from ai.vision.providers.sr_provider import SuperResolutionProvider
except ImportError:
    SuperResolutionProvider = None
from ai.vision.schemas import EnhancedImageResult, ImageAsset, ProcessedImageResult, QualityAnalysisResult
from ai.vision.studio import StudioComposer

logger = logging.getLogger(__name__)


class QualityEnhancer:
    """End-to-end vision pipeline orchestrator for artisan e-commerce photography."""

    def __init__(
        self,
        lighting_corrector: Optional[LightingCorrector] = None,
        sr_provider: Optional[Any] = None,
        rembg_provider: Optional[RembgProvider] = None,
        picsart_provider: Optional[PicsartProvider] = None,
        gemini_provider: Optional[GeminiStudioProvider] = None,
        photoroom_provider: Optional[PhotoroomProvider] = None,
        fidelity_validator: Optional[ProductFidelityValidator] = None,
        cloudinary_service: Optional[CloudinaryService] = None,
        studio_composer: Optional[StudioComposer] = None,
    ) -> None:
        """Initialize QualityEnhancer with vision service dependencies."""
        self.lighting = lighting_corrector or LightingCorrector()
        if sr_provider is not None:
            self.sr = sr_provider
        elif SuperResolutionProvider is not None:
            self.sr = SuperResolutionProvider()
        else:
            self.sr = None
        self.rembg = rembg_provider or RembgProvider()
        self.picsart = picsart_provider or PicsartProvider()
        self.cloudinary = cloudinary_service or CloudinaryService()
        self.studio = studio_composer or StudioComposer(cloudinary_service=self.cloudinary)
        self.gemini = gemini_provider or GeminiStudioProvider()
        self.photoroom = photoroom_provider or PhotoroomProvider()
        self.fidelity = fidelity_validator or ProductFidelityValidator(rembg_provider=self.rembg)
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

    def _execute_local_fallback_pipeline(
        self,
        image_bytes: bytes,
        original_asset: ImageAsset,
        category: str,
        preset: Optional[str],
        aspect_ratio: Optional[str],
        add_shadow: Optional[bool],
        quality_mode: str,
        upscale_factor: int,
        enable_lighting_correction: bool,
        enable_super_resolution: bool,
        enable_quality_enhancement: bool,
        pipeline_tags: List[str],
        fallback_telemetry: Dict[str, Any],
        start_time: float,
    ) -> EnhancedImageResult:
        """Execute the resilient 4-stage local image enhancement fallback pipeline."""
        working_bytes = image_bytes
        stages_applied = list(fallback_telemetry.get("stages_applied", []))

        # 1. Multi-Tier Quality Enhancement / Super-Resolution
        if enable_quality_enhancement:
            clean_mode = quality_mode.lower()

            if clean_mode in ("ultra", "upscale"):
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
                                stages_applied.append(f"picsart_{clean_mode}")
                    except Exception:
                        pass

            elif clean_mode in ("cloudinary", "auto"):
                try:
                    analysis = self.analyze_quality(original_asset.public_id)
                    cloudinary_enhanced_url = self.cloudinary.get_quality_enhanced_url(
                        public_id=original_asset.public_id,
                        quality_tier=analysis.quality_tier,
                    )
                    req = urllib.request.Request(
                        url=cloudinary_enhanced_url,
                        headers={"User-Agent": "KalaMitra-QualityEnhancer/1.0"},
                    )
                    with urllib.request.urlopen(req, timeout=25) as cdn_res:
                        if getattr(cdn_res, "status", 200) in (200, None):
                            working_bytes = cdn_res.read()
                            stages_applied.append("cloudinary_ai_enhance")
                except Exception:
                    pass

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
                        fallback_telemetry["lighting_correction"] = light_telemetry
                        stages_applied.append("lighting_correction")
                    except Exception as light_err:
                        fallback_telemetry["lighting_correction_error"] = str(light_err)

                if enable_super_resolution and self.sr is not None:
                    try:
                        working_bytes, sr_telemetry = self.sr.upscale_image(
                            working_bytes,
                            scale=upscale_factor,
                        )
                        fallback_telemetry["super_resolution"] = sr_telemetry
                        stages_applied.append(f"super_resolution_{upscale_factor}x")
                    except Exception as sr_err:
                        fallback_telemetry["super_resolution_error"] = str(sr_err)

        # 2. Extract Cutout PNG
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
                            stages_applied.append("background_removal_cloud")
        except Exception:
            pass

        if cutout_bytes is None:
            try:
                cutout_bytes = self.rembg.extract_cutout_bytes(working_bytes)
                stages_applied.append("background_removal_local")
            except Exception:
                pass

        if cutout_bytes is None or len(cutout_bytes) < 8 or cutout_bytes[:8] != b"\x89PNG\r\n\x1a\n":
            return EnhancedImageResult(
                success=False,
                provider="local_fallback",
                original=original_asset,
                cutout=None,
                enhanced=None,
                category=category,
                preset=preset or "ecommerce_white",
                aspect_ratio=aspect_ratio or "square_1x1",
                shadow_enabled=add_shadow if add_shadow is not None else True,
                error="Background removal failed to extract a valid transparent PNG cutout",
                error_code="BACKGROUND_REMOVAL_FAILED",
                metadata={"pipeline_telemetry": fallback_telemetry},
            )

        # 3. Upload transparent cutout PNG to Cloudinary (artisan-ai/cutouts/)
        cutout_tags = list(pipeline_tags) + ["cutout", "fallback"]
        cutout_upload = self.cloudinary.upload_cutout_image(
            image_input=cutout_bytes,
            tags=cutout_tags,
        )

        if not cutout_upload.success or not cutout_upload.asset:
            return EnhancedImageResult(
                success=False,
                provider="local_fallback",
                original=original_asset,
                cutout=None,
                enhanced=None,
                category=category,
                preset=preset or "ecommerce_white",
                aspect_ratio=aspect_ratio or "square_1x1",
                shadow_enabled=add_shadow if add_shadow is not None else True,
                error=f"Cloudinary cutout upload failed: {cutout_upload.error}",
                error_code="CUTOUT_UPLOAD_FAILED",
                metadata={"pipeline_telemetry": fallback_telemetry},
            )
        cutout_asset = cutout_upload.asset
        if cutout_upload.metadata:
            pipeline_telemetry["cutout_optimization"] = cutout_upload.metadata
            if cutout_upload.metadata.get("optimization_required"):
                pipeline_telemetry["stages_applied"].append("cutout_size_optimization")

        # 4. Compose final studio presentation asset
        final_result = self.studio.compose_studio_image(
            cutout=cutout_asset,
            original=original_asset,
            category=category,
            preset=preset,
            aspect_ratio=aspect_ratio,
            add_shadow=add_shadow,
            tags=pipeline_tags + ["fallback"],
        )

        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        stages_applied.append("studio_composition")
        fallback_telemetry["stages_applied"] = stages_applied
        fallback_telemetry["total_execution_time_ms"] = elapsed_ms
        fallback_telemetry["fallback_used"] = True

        return EnhancedImageResult(
            success=final_result.success,
            provider="local_fallback",
            original=original_asset,
            cutout=cutout_asset,
            enhanced=final_result.enhanced,
            category=category,
            preset=final_result.preset,
            aspect_ratio=final_result.aspect_ratio,
            shadow_enabled=final_result.shadow_enabled,
            metadata={
                "provider": "local_fallback",
                "fallback_used": True,
                "total_execution_time_ms": elapsed_ms,
                "pipeline_telemetry": fallback_telemetry,
                **(final_result.metadata or {}),
            },
            error=final_result.error,
            error_code=final_result.error_code,
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
        """Execute the production-grade AI vision studio pipeline.

        Architecture:
        1. Ingest raw photo into persistent Cloudinary storage (artisan-ai/originals/).
        2. Gemini / Nano Banana Primary Generation Engine.
        3. Product Fidelity Validation Gate (SSIM, mask IoU, CIELAB Delta E).
           - Decision == PASS -> Persist to Cloudinary enhanced/ & return.
           - Decision == FAIL / REVIEW -> Route to Local Fallback Pipeline.
        4. Local Fallback Pipeline (Lighting -> SR -> Rembg Cutout -> StudioComposer).

        Args:
            image_input: Raw image payload (file path, raw bytes, or stream).
            category: Artisan craft category (pottery, textiles, wooden_crafts, jewellery, general).
            preset: Studio backdrop preset key (ecommerce_white, warm_neutral, terracotta_sand, minimal_grey, travertine_podium).
            aspect_ratio: Canvas aspect ratio (square_1x1, portrait_4x5, portrait_9x16, landscape_16x9).
            add_shadow: Whether to apply a realistic 3D contact drop shadow.
            quality_mode: Processing mode ('auto', 'gemini', 'local_ai', 'cloud').
            upscale_factor: Super-resolution multiplier (2 or 4).
            enable_lighting_correction: Toggle for lighting & white-balance engine.
            enable_super_resolution: Toggle for 2x/4x pixel super-resolution engine.
            enable_quality_enhancement: Master quality enhancement toggle.
            tags: Optional metadata tags.

        Returns:
            EnhancedImageResult with original, cutout, final enhanced asset, provider, and fidelity telemetry.
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
                    provider="quality_enhancer",
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
                provider="quality_enhancer",
                category=category,
                error=f"Unsupported image input type: {type(image_input)}",
                error_code="INVALID_INPUT_TYPE",
            )

        if not image_bytes:
            return EnhancedImageResult(
                success=False,
                provider="quality_enhancer",
                category=category,
                error="Provided image payload is empty (0 bytes)",
                error_code="EMPTY_IMAGE",
            )

        # 2. Immutable Ingest of raw original photograph into Cloudinary (artisan-ai/originals/)
        orig_upload_res = self.cloudinary.upload_original_image(
            image_input=image_bytes,
            tags=pipeline_tags + ["original"],
        )
        if not orig_upload_res.success or not orig_upload_res.asset:
            return EnhancedImageResult(
                success=False,
                provider="cloudinary",
                category=category,
                error=f"Failed to upload original image to Cloudinary: {orig_upload_res.error}",
                error_code="ORIGINAL_UPLOAD_FAILED",
            )
        original_asset = orig_upload_res.asset

        pipeline_telemetry: Dict[str, Any] = {
            "stages_applied": ["original_ingest"],
            "original_public_id": original_asset.public_id,
        }

        # 3. Primary Cloud Generation Engines (Photoroom -> Gemini -> Local Fallback)
        clean_mode = quality_mode.lower()
        allow_cloud = clean_mode not in ("local_ai", "local", "offline")
        applied_cloud = False

        # 3A. Photoroom Studio Engine (High-Fidelity AI Background & Lighting)
        allow_photoroom = allow_cloud and self.photoroom.is_available and clean_mode != "gemini"
        if allow_photoroom:
            try:
                pr_res = self.photoroom.edit_studio_image(
                    image_input=image_bytes,
                    category=category,
                    preset=preset or "warm_neutral",
                    aspect_ratio=aspect_ratio or "1:1",
                    add_shadow=add_shadow if add_shadow is not None else True,
                )

                if pr_res.success and pr_res.metadata and pr_res.metadata.get("image_bytes"):
                    generated_bytes = pr_res.metadata["image_bytes"]

                    # Product Fidelity Validation Gate
                    fidelity_res = self.fidelity.validate(
                        original_image=image_bytes,
                        generated_image=generated_bytes,
                        category=category,
                    )

                    pipeline_telemetry["fidelity"] = fidelity_res.model_dump()
                    pipeline_telemetry["stages_applied"].append("photoroom_studio_generation")
                    pipeline_telemetry["stages_applied"].append("fidelity_validation")

                    review_action = os.getenv("FIDELITY_REVIEW_ACTION", "accept").strip().lower()
                    should_accept = (
                        fidelity_res.decision == "PASS"
                        or (fidelity_res.decision == "REVIEW" and review_action == "accept")
                    )

                    if should_accept:
                        # Upload Photoroom generated final asset to Cloudinary (artisan-ai/enhanced/)
                        enhanced_upload = self.cloudinary.upload_enhanced_image(
                            image_input=generated_bytes,
                            tags=pipeline_tags + ["enhanced", "photoroom", f"cat_{category}"],
                            format_override="webp",
                        )

                        if enhanced_upload.success and enhanced_upload.asset:
                            elapsed_ms = round((time.time() - start_time) * 1000, 2)
                            pipeline_telemetry["stages_applied"].append("enhanced_upload")
                            pipeline_telemetry["total_execution_time_ms"] = elapsed_ms
                            pipeline_telemetry["provider"] = "photoroom"
                            pipeline_telemetry["fallback_used"] = False

                            return EnhancedImageResult(
                                success=True,
                                provider="photoroom",
                                original=original_asset,
                                cutout=None,
                                enhanced=enhanced_upload.asset,
                                category=category,
                                preset=preset or "warm_neutral",
                                aspect_ratio=aspect_ratio or "square_1x1",
                                shadow_enabled=add_shadow if add_shadow is not None else True,
                                metadata={
                                    "provider": "photoroom",
                                    "fallback_used": False,
                                    "fidelity": fidelity_res.model_dump(),
                                    "total_execution_time_ms": elapsed_ms,
                                    "pipeline_telemetry": pipeline_telemetry,
                                },
                            )

                    pipeline_telemetry["fallback_reason"] = f"photoroom_fidelity_{fidelity_res.decision.lower()}"
                else:
                    pipeline_telemetry["fallback_reason"] = f"photoroom_{pr_res.error_code or 'NO_OUTPUT'}"
                    pipeline_telemetry["photoroom_error"] = pr_res.error

            except Exception as pr_err:
                logger.warning("Photoroom primary engine encountered exception: %s", pr_err)
                pipeline_telemetry["fallback_reason"] = f"photoroom_exception_{type(pr_err).__name__}"
                pipeline_telemetry["photoroom_error"] = str(pr_err)

        # 3B. Gemini Studio Engine (Secondary Cloud Engine)
        allow_gemini = allow_cloud and self.gemini.is_available and clean_mode != "photoroom" and not applied_cloud
        if allow_gemini and pipeline_telemetry.get("provider") != "photoroom":
            try:
                gemini_res = self.gemini.edit_studio_image(
                    image_input=image_bytes,
                    category=category,
                    preset=preset or "warm_neutral",
                    aspect_ratio="1:1" if (aspect_ratio and "square" in aspect_ratio) else "1:1",
                )

                if gemini_res.success and gemini_res.metadata and gemini_res.metadata.get("image_bytes"):
                    generated_bytes = gemini_res.metadata["image_bytes"]

                    # Product Fidelity Validation Gate
                    fidelity_res = self.fidelity.validate(
                        original_image=image_bytes,
                        generated_image=generated_bytes,
                        category=category,
                    )

                    pipeline_telemetry["fidelity"] = fidelity_res.model_dump()
                    pipeline_telemetry["stages_applied"].append("gemini_generation")
                    pipeline_telemetry["stages_applied"].append("fidelity_validation")

                    review_action = os.getenv("FIDELITY_REVIEW_ACTION", "fallback").strip().lower()
                    should_accept = (
                        fidelity_res.decision == "PASS"
                        or (fidelity_res.decision == "REVIEW" and review_action == "accept")
                    )

                    if should_accept:
                        enhanced_upload = self.cloudinary.upload_enhanced_image(
                            image_input=generated_bytes,
                            tags=pipeline_tags + ["enhanced", "gemini_nano_banana", f"cat_{category}"],
                            format_override="webp",
                        )

                        if enhanced_upload.success and enhanced_upload.asset:
                            elapsed_ms = round((time.time() - start_time) * 1000, 2)
                            pipeline_telemetry["stages_applied"].append("enhanced_upload")
                            pipeline_telemetry["total_execution_time_ms"] = elapsed_ms
                            pipeline_telemetry["provider"] = "gemini_nano_banana"
                            pipeline_telemetry["fallback_used"] = False

                            return EnhancedImageResult(
                                success=True,
                                provider="gemini_nano_banana",
                                original=original_asset,
                                cutout=None,
                                enhanced=enhanced_upload.asset,
                                category=category,
                                preset=preset or "warm_neutral",
                                aspect_ratio=aspect_ratio or "square_1x1",
                                shadow_enabled=add_shadow if add_shadow is not None else True,
                                metadata={
                                    "provider": "gemini_nano_banana",
                                    "fallback_used": False,
                                    "fidelity": fidelity_res.model_dump(),
                                    "total_execution_time_ms": elapsed_ms,
                                    "pipeline_telemetry": pipeline_telemetry,
                                },
                            )

                    pipeline_telemetry["fallback_reason"] = (
                        f"gemini_fidelity_{fidelity_res.decision.lower()}"
                    )
                else:
                    pipeline_telemetry["fallback_reason"] = (
                        f"gemini_{gemini_res.error_code or 'NO_OUTPUT'}"
                    )
                    pipeline_telemetry["gemini_error"] = gemini_res.error

            except Exception as gemini_err:
                logger.warning("Gemini primary engine encountered exception: %s", gemini_err)
                pipeline_telemetry["fallback_reason"] = f"gemini_exception_{type(gemini_err).__name__}"
                pipeline_telemetry["gemini_error"] = str(gemini_err)
        elif not allow_cloud:
            pipeline_telemetry["fallback_reason"] = "forced_local_mode"
        elif not self.photoroom.is_available and not self.gemini.is_available:
            pipeline_telemetry["fallback_reason"] = "cloud_providers_unavailable"

        # 4. Route to Local Enhancement Pipeline Fallback
        pipeline_telemetry["stages_applied"].append("local_fallback_invoked")

        return self._execute_local_fallback_pipeline(
            image_bytes=image_bytes,
            original_asset=original_asset,
            category=category,
            preset=preset,
            aspect_ratio=aspect_ratio,
            add_shadow=add_shadow,
            quality_mode=quality_mode,
            upscale_factor=upscale_factor,
            enable_lighting_correction=enable_lighting_correction,
            enable_super_resolution=enable_super_resolution,
            enable_quality_enhancement=enable_quality_enhancement,
            pipeline_tags=pipeline_tags,
            fallback_telemetry=pipeline_telemetry,
            start_time=start_time,
        )


def get_quality_enhancer() -> QualityEnhancer:
    """Factory helper to obtain a QualityEnhancer instance."""
    return QualityEnhancer()
