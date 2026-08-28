"""Cloudinary storage, asset management, and AI quality enhancement service for AI Vision module.

Handles uploading raw artisan photographs, storing transparent cutout PNGs,
storing quality-enhanced intermediate assets, performing automated image quality analysis,
generating studio transformations, and managing asset lifecycles without exposing credentials.
"""

import io
from pathlib import Path
from typing import Any, BinaryIO, Dict, List, Optional, Union

import cloudinary.api
import cloudinary.uploader
import cloudinary.utils
from ai.vision.config import configure_cloudinary
from ai.vision.schemas import AssetDeleteResult, ImageAsset, OriginalImageResult, QualityAnalysisResult


class CloudinaryService:
    """Server-side service for managing image assets and AI quality enhancement in Cloudinary."""

    ORIGINALS_FOLDER = "artisan-ai/originals"
    CUTOUTS_FOLDER = "artisan-ai/cutouts"
    ENHANCED_FOLDER = "artisan-ai/enhanced"
    QUALITY_ENHANCED_FOLDER = "artisan-ai/quality-enhanced"

    def __init__(self, default_folder: str = ORIGINALS_FOLDER) -> None:
        """Initialize service and ensure Cloudinary SDK is configured."""
        self.default_folder = default_folder
        self.settings = configure_cloudinary()

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
        """Upload a transparent cutout PNG to persistent Cloudinary storage.

        Args:
            image_input: File path (str/Path), raw bytes, or a file-like stream of PNG data.
            folder: Custom folder path (defaults to 'artisan-ai/cutouts').
            public_id: Optional specific asset public ID.
            tags: Optional metadata tags for organization.

        Returns:
            OriginalImageResult containing ImageAsset metadata on success or error details.
        """
        return self._upload_asset(
            image_input=image_input,
            folder=folder or self.CUTOUTS_FOLDER,
            public_id=public_id,
            tags=tags,
            stage="cutout_upload",
            format_override="png",
        )

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
