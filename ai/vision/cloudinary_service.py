"""Cloudinary storage, asset management, and AI quality enhancement service for AI Vision module.

Handles uploading raw artisan photographs, storing transparent cutout PNGs,
storing quality-enhanced intermediate assets, performing automated image quality analysis,
generating studio transformations, and managing asset lifecycles without exposing credentials.
"""

import io
import logging
from pathlib import Path
from typing import Any, BinaryIO, Dict, List, Optional, Tuple, Union

from PIL import Image

import cloudinary.api
import cloudinary.uploader
import cloudinary.utils
from ai.vision.config import configure_cloudinary
from ai.vision.schemas import AssetDeleteResult, ImageAsset, OriginalImageResult, QualityAnalysisResult

logger = logging.getLogger("kalamitra.vision.cloudinary")


class CloudinaryService:
    """Server-side service for managing image assets and AI quality enhancement in Cloudinary."""

    ORIGINALS_FOLDER = "artisan-ai/originals"
    CUTOUTS_FOLDER = "artisan-ai/cutouts"
    ENHANCED_FOLDER = "artisan-ai/enhanced"
    QUALITY_ENHANCED_FOLDER = "artisan-ai/quality-enhanced"

    # 9.5 MB safety threshold (Cloudinary free/standard limit is 10 MB = 10,485,760 bytes)
    MAX_CUTOUT_BYTES: int = 9_500_000
    MIN_CUTOUT_DIMENSION: int = 800

    def __init__(self, default_folder: str = ORIGINALS_FOLDER) -> None:
        """Initialize service and ensure Cloudinary SDK is configured."""
        self.default_folder = default_folder
        self.settings = configure_cloudinary()

    @classmethod
    def optimize_cutout_bytes(
        cls,
        image_input: Union[str, Path, bytes, BinaryIO],
        max_bytes: int = MAX_CUTOUT_BYTES,
        min_dimension: int = MIN_CUTOUT_DIMENSION,
    ) -> Tuple[bytes, Dict[str, Any]]:
        """Optimize a transparent cutout PNG in-memory to guarantee it is strictly below Cloudinary size limits.

        Preserves the RGBA alpha channel transparency and aspect ratio.

        Args:
            image_input: Raw cutout bytes, stream, or file path.
            max_bytes: Maximum allowed byte size (defaults to 9.5 MB).
            min_dimension: Minimum resolution floor (defaults to 800px).

        Returns:
            Tuple of (optimized_bytes, telemetry_dict).
        """
        # Read raw input bytes
        if isinstance(image_input, (str, Path)):
            with open(image_input, "rb") as f:
                raw_bytes = f.read()
        elif isinstance(image_input, bytes):
            raw_bytes = image_input
        elif hasattr(image_input, "read"):
            pos = image_input.tell() if hasattr(image_input, "tell") else None
            raw_bytes = image_input.read()
            if pos is not None and hasattr(image_input, "seek"):
                image_input.seek(pos)
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        orig_len = len(raw_bytes)
        telemetry: Dict[str, Any] = {
            "original_bytes": orig_len,
            "max_allowed_bytes": max_bytes,
            "optimization_required": False,
            "optimized_bytes": orig_len,
            "compression_stages": [],
        }

        # Fast path: if already under safety threshold, return untouched
        if orig_len <= max_bytes:
            return raw_bytes, telemetry

        telemetry["optimization_required"] = True
        logger.info(
            f"[CloudinaryService] Cutout size ({orig_len} bytes) exceeds {max_bytes} bytes limit. "
            "Optimizing transparent PNG in-memory..."
        )

        try:
            img = Image.open(io.BytesIO(raw_bytes))
            # Ensure RGBA mode for transparency
            if img.mode != "RGBA":
                img = img.convert("RGBA")

            orig_w, orig_h = img.size
            curr_w, curr_h = orig_w, orig_h
            telemetry["initial_dimensions"] = [orig_w, orig_h]

            # Stage 0: Safe dimension ceiling to guarantee compatibility with Cloudinary 25MP limit
            MAX_MEGAPIXELS = 20_000_000
            if (curr_w * curr_h) > MAX_MEGAPIXELS or max(curr_w, curr_h) > 4096:
                ceiling_scale = min(4096 / max(curr_w, curr_h), (MAX_MEGAPIXELS / (curr_w * curr_h)) ** 0.5)
                curr_w = int(curr_w * ceiling_scale)
                curr_h = int(curr_h * ceiling_scale)
                img = img.resize((curr_w, curr_h), Image.Resampling.LANCZOS)
                telemetry["ceiling_clamped_dimensions"] = [curr_w, curr_h]

            # Stage 1: In-memory PNG compression with optimize=True, compress_level=9
            out_buf = io.BytesIO()
            img.save(out_buf, format="PNG", optimize=True, compress_level=9)
            compressed_bytes = out_buf.getvalue()
            telemetry["compression_stages"].append({
                "stage": "png_compression_level_9",
                "bytes": len(compressed_bytes),
                "dimensions": [curr_w, curr_h],
            })

            # Stage 2: Bounded iterative downscale if still above threshold
            iteration = 0
            while len(compressed_bytes) > max_bytes and iteration < 10:
                iteration += 1
                # Calculate scale factor proportional to square root of byte ratio
                ratio = (max_bytes / len(compressed_bytes)) ** 0.5
                scale = min(0.85, max(0.4, ratio * 0.95))

                new_w = max(min_dimension, int(curr_w * scale))
                new_h = max(min_dimension, int(curr_h * scale))

                # If dimensions cannot be reduced further due to min_dimension floor, break
                if new_w >= curr_w and new_h >= curr_h:
                    logger.warning(
                        f"[CloudinaryService] Reached minimum dimension floor ({min_dimension}px) "
                        f"with {len(compressed_bytes)} bytes."
                    )
                    break

                curr_w, curr_h = new_w, new_h
                resized_img = img.resize((curr_w, curr_h), Image.Resampling.LANCZOS)

                out_buf = io.BytesIO()
                resized_img.save(out_buf, format="PNG", optimize=True, compress_level=9)
                compressed_bytes = out_buf.getvalue()

                telemetry["compression_stages"].append({
                    "stage": f"downscale_iteration_{iteration}",
                    "bytes": len(compressed_bytes),
                    "dimensions": [curr_w, curr_h],
                })
                logger.info(
                    f"[CloudinaryService] Downscale iteration {iteration}: {curr_w}x{curr_h} -> {len(compressed_bytes)} bytes"
                )

            # Stage 3: Aggressive downscale if still over threshold
            while len(compressed_bytes) > max_bytes and curr_w > 200 and curr_h > 200:
                curr_w = int(curr_w * 0.75)
                curr_h = int(curr_h * 0.75)
                resized_img = img.resize((curr_w, curr_h), Image.Resampling.LANCZOS)
                out_buf = io.BytesIO()
                resized_img.save(out_buf, format="PNG", optimize=True, compress_level=9)
                compressed_bytes = out_buf.getvalue()
                telemetry["compression_stages"].append({
                    "stage": "aggressive_downscale",
                    "bytes": len(compressed_bytes),
                    "dimensions": [curr_w, curr_h],
                })

            telemetry["optimized_bytes"] = len(compressed_bytes)
            telemetry["final_dimensions"] = [curr_w, curr_h]
            telemetry["format"] = "PNG"
            telemetry["transparency_preserved"] = True

            logger.info(
                f"[CloudinaryService] Cutout optimization complete: {orig_len} -> {len(compressed_bytes)} bytes "
                f"({orig_w}x{orig_h} -> {curr_w}x{curr_h} PNG, RGBA)"
            )
            return compressed_bytes, telemetry

        except Exception as opt_err:
            logger.error(f"[CloudinaryService] Cutout optimization failed: {opt_err}")
            raise RuntimeError(f"Failed to optimize oversized cutout image: {opt_err}") from opt_err

    def upload_original_image(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        folder: Optional[str] = None,
        public_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> OriginalImageResult:
        """Upload a raw artisan photograph to secure Cloudinary storage.

        Args:
            image_input: File path (str/Path), raw bytes, or a file-like stream.
            folder: Custom folder path (defaults to 'artisan-ai/originals').
            public_id: Optional specific asset public ID.
            tags: Optional metadata tags for organization.

        Returns:
            OriginalImageResult containing ImageAsset metadata on success or error details.
        """
        return self._upload_asset(
            image_input=image_input,
            folder=folder or self.ORIGINALS_FOLDER,
            public_id=public_id,
            tags=tags,
            stage="original_upload",
        )

    def upload_cutout_image(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        folder: Optional[str] = None,
        public_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> OriginalImageResult:
        """Upload a transparent cutout PNG to persistent Cloudinary storage with automatic size guarding.

        Args:
            image_input: File path (str/Path), raw bytes, or a file-like stream of PNG data.
            folder: Custom folder path (defaults to 'artisan-ai/cutouts').
            public_id: Optional specific asset public ID.
            tags: Optional metadata tags for organization.

        Returns:
            OriginalImageResult containing ImageAsset metadata on success or error details.
        """
        try:
            optimized_bytes, telemetry = self.optimize_cutout_bytes(image_input)
        except Exception as exc:
            logger.error(f"[CloudinaryService] Cutout optimization error: {exc}")
            return OriginalImageResult(
                success=False,
                stage="cutout_upload",
                error=f"Cutout size optimization failed: {str(exc)}",
            )

        res = self._upload_asset(
            image_input=optimized_bytes,
            folder=folder or self.CUTOUTS_FOLDER,
            public_id=public_id,
            tags=tags,
            stage="cutout_upload",
            format_override="png",
        )
        res.metadata = telemetry
        return res

    def upload_enhanced_image(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        folder: Optional[str] = None,
        public_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        format_override: Optional[str] = None,
    ) -> OriginalImageResult:
        """Upload a final studio-enhanced asset to persistent Cloudinary storage.

        Args:
            image_input: Transformed image URL (str), binary bytes, or stream.
            folder: Custom folder path (defaults to 'artisan-ai/enhanced').
            public_id: Optional specific asset public ID.
            tags: Optional metadata tags for organization.
            format_override: Optional image format (e.g. 'webp', 'jpg', 'png').

        Returns:
            OriginalImageResult containing ImageAsset metadata on success or error details.
        """
        return self._upload_asset(
            image_input=image_input,
            folder=folder or self.ENHANCED_FOLDER,
            public_id=public_id,
            tags=tags,
            stage="enhanced_upload",
            format_override=format_override,
        )

    def upload_quality_enhanced_image(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        folder: Optional[str] = None,
        public_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> OriginalImageResult:
        """Upload a quality-enhanced intermediate asset to persistent Cloudinary storage.

        Args:
            image_input: Transformed image URL (str), binary bytes, or stream.
            folder: Custom folder path (defaults to 'artisan-ai/quality-enhanced').
            public_id: Optional specific asset public ID.
            tags: Optional metadata tags for organization.

        Returns:
            OriginalImageResult containing ImageAsset metadata on success or error details.
        """
        return self._upload_asset(
            image_input=image_input,
            folder=folder or self.QUALITY_ENHANCED_FOLDER,
            public_id=public_id,
            tags=tags,
            stage="quality_enhanced_upload",
        )

    def _upload_asset(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        folder: str,
        public_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        stage: str = "upload",
        format_override: Optional[str] = None,
    ) -> OriginalImageResult:
        """Internal helper for executing Cloudinary asset uploads."""
        upload_payload: Union[str, BinaryIO]

        if isinstance(image_input, (str, Path)):
            upload_payload = str(image_input)
        elif isinstance(image_input, bytes):
            upload_payload = io.BytesIO(image_input)
        elif hasattr(image_input, "read"):
            upload_payload = image_input
        else:
            return OriginalImageResult(
                success=False,
                stage=stage,
                error=f"Unsupported image input type: {type(image_input)}",
            )

        upload_options = {
            "folder": folder,
            "resource_type": "image",
            "overwrite": True,
            "unique_filename": True,
        }

        if format_override:
            upload_options["format"] = format_override
        if public_id:
            upload_options["public_id"] = public_id
        if tags:
            upload_options["tags"] = tags

        try:
            response = cloudinary.uploader.upload(upload_payload, **upload_options)

            asset = ImageAsset(
                public_id=response.get("public_id", ""),
                secure_url=response.get("secure_url", ""),
                width=int(response.get("width", 0)),
                height=int(response.get("height", 0)),
                format=str(response.get("format", "")),
                bytes=int(response.get("bytes", 0)),
                created_at=response.get("created_at"),
            )

            return OriginalImageResult(
                success=True,
                provider="cloudinary",
                stage=stage,
                asset=asset,
            )
        except Exception as exc:
            return OriginalImageResult(
                success=False,
                provider="cloudinary",
                stage=stage,
                error=str(exc),
            )

    def get_asset_metadata(self, public_id: str) -> Optional[ImageAsset]:
        """Fetch asset metadata from Cloudinary.

        Args:
            public_id: Target asset identifier.

        Returns:
            ImageAsset instance if found, None otherwise.
        """
        try:
            res = cloudinary.api.resource(public_id, resource_type="image")
            return ImageAsset(
                public_id=res.get("public_id", public_id),
                secure_url=res.get("secure_url", ""),
                width=int(res.get("width", 0)),
                height=int(res.get("height", 0)),
                format=str(res.get("format", "")),
                bytes=int(res.get("bytes", 0)),
                created_at=res.get("created_at"),
            )
        except Exception:
            return None

    def analyze_image_quality(self, public_id: str) -> QualityAnalysisResult:
        """Analyze image resolution, dimensions, and compression to determine quality tier.

        Args:
            public_id: Public ID of the asset stored in Cloudinary.

        Returns:
            QualityAnalysisResult with classified tier ('high', 'medium', 'poor') and recommended transformations.
        """
        asset = self.get_asset_metadata(public_id)
        if not asset:
            # Fallback for unknown asset
            return QualityAnalysisResult(
                quality_tier="medium",
                width=800,
                height=800,
                megapixels=0.64,
                bytes=100000,
                format="jpg",
                recommended_transformations=self.build_quality_transformations("medium"),
                quality_score=0.5,
                metrics={"note": "Asset metadata unavailable; default to medium tier"},
            )

        min_dim = min(asset.width, asset.height)
        mp = round((asset.width * asset.height) / 1_000_000, 2)

        # Quality Tier Classification Heuristics:
        # High: Min dimension >= 1080px and size >= 200KB
        # Medium: Min dimension >= 500px and size >= 40KB
        # Poor: Min dimension < 500px or size < 40KB (low-resolution phone photo)
        if min_dim >= 1080 and asset.bytes >= 200_000:
            tier = "high"
            score = 0.9
        elif min_dim >= 500 and asset.bytes >= 40_000:
            tier = "medium"
            score = 0.65
        else:
            tier = "poor"
            score = 0.35

        transformations = self.build_quality_transformations(tier)

        return QualityAnalysisResult(
            quality_tier=tier,
            width=asset.width,
            height=asset.height,
            megapixels=mp,
            bytes=asset.bytes,
            format=asset.format,
            recommended_transformations=transformations,
            quality_score=score,
            metrics={
                "min_dimension": min_dim,
                "aspect_ratio": round(asset.width / max(1, asset.height), 2),
                "bytes_per_pixel": round(asset.bytes / max(1, asset.width * asset.height), 3),
            },
        )

    def build_quality_transformations(self, quality_tier: str) -> List[Dict[str, Any]]:
        """Build deterministic Cloudinary AI enhancement transformations based on quality tier.

        Args:
            quality_tier: 'high', 'medium', or 'poor'.

        Returns:
            List of transformation dictionaries for Cloudinary URL generation.
        """
        tier = quality_tier.lower()

        if tier == "high":
            # High quality: Light color balance and subtle edge sharpening
            return [
                {"effect": "improve"},
                {"effect": "sharpen:50"},
                {"quality": "auto", "fetch_format": "auto"},
            ]
        elif tier == "medium":
            # Medium quality: AI auto-enhance + indoor lighting correction + sharpening
            return [
                {"effect": "enhance"},
                {"effect": "improve:indoor"},
                {"effect": "sharpen:80"},
                {"quality": "auto", "fetch_format": "auto"},
            ]
        else:
            # Poor quality: Deep AI restoration + enhancement + sharpening
            return [
                {"effect": "gen_restore"},
                {"effect": "enhance"},
                {"effect": "sharpen:100"},
                {"quality": "auto", "fetch_format": "auto"},
            ]

    def get_quality_enhanced_url(
        self,
        public_id: str,
        quality_tier: Optional[str] = None,
    ) -> str:
        """Generate Cloudinary delivery URL with AI quality enhancement transformations applied.

        Args:
            public_id: Target asset identifier.
            quality_tier: Optional tier override ('high', 'medium', 'poor'). If None, analyzed automatically.

        Returns:
            Secure HTTPS URL with quality enhancement transformations.
        """
        if quality_tier is None:
            analysis = self.analyze_image_quality(public_id)
            tier = analysis.quality_tier
        else:
            tier = quality_tier

        transformations = self.build_quality_transformations(tier)
        url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            transformation=transformations,
            secure=True,
        )
        return url

    def delete_asset(self, public_id: str) -> AssetDeleteResult:
        """Delete an asset from Cloudinary storage.

        Args:
            public_id: Target asset identifier to remove.

        Returns:
            AssetDeleteResult indicating status.
        """
        try:
            res = cloudinary.uploader.destroy(public_id, resource_type="image")
            result_status = res.get("result", "unknown")
            return AssetDeleteResult(
                success=(result_status == "ok"),
                public_id=public_id,
                result=result_status,
            )
        except Exception as exc:
            return AssetDeleteResult(
                success=False,
                public_id=public_id,
                result=str(exc),
            )
