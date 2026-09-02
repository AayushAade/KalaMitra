"""Studio Background Composition & E-commerce Presentation Layer.

Transforms transparent artisan product cutouts into professional e-commerce studio assets
by applying curated background backdrops, subtle contact shadows, and standard aspect ratio canvases
WITHOUT altering the underlying artisan product.
"""

from pathlib import Path
import time
from typing import Any, BinaryIO, Dict, List, Optional, Tuple, Union
import cloudinary.utils

from ai.vision.cloudinary_service import CloudinaryService
from ai.vision.persistence import PersistenceBridge
from ai.vision.schemas import EnhancedImageResult, ImageAsset


STUDIO_PRESETS: Dict[str, Dict[str, Any]] = {
    "ecommerce_white": {
        "name": "E-commerce Pure White",
        "background": "rgb:FFFFFF",
        "format": "auto",
        "description": "Clean Amazon/Flipkart standard pure white backdrop",
    },
    "warm_neutral": {
        "name": "Warm Neutral Studio",
        "background": "rgb:F7F4EE",
        "format": "auto",
        "description": "Soft beige/off-white studio tone, ideal for terracotta pottery and textiles",
    },
    "minimal_grey": {
        "name": "Minimal Studio Grey",
        "background": "rgb:F5F5F7",
        "format": "auto",
        "description": "Contemporary light grey for modern jewellery, metalcraft, and stone items",
    },
    "terracotta_sand": {
        "name": "Terracotta & Sand",
        "background": "rgb:F4EBE1",
        "format": "auto",
        "description": "Warm earthy clay tone complementary to wood, brass, and terracotta",
    },
    "transparent_png": {
        "name": "Transparent Cutout",
        "background": None,
        "format": "png",
        "description": "Transparent background PNG for marketing collaterals and custom banners",
    },
}

ASPECT_RATIOS: Dict[str, Tuple[int, int]] = {
    "square_1x1": (1080, 1080),
    "portrait_4x5": (1080, 1350),
    "portrait_9x16": (1080, 1920),
    "landscape_16x9": (1920, 1080),
}

CATEGORY_DEFAULTS: Dict[str, Dict[str, Any]] = {
    "pottery": {
        "preset": "warm_neutral",
        "aspect_ratio": "square_1x1",
        "add_shadow": True,
        "description": "Terracotta, ceramics, and clay items with 3D depth shadow",
    },
    "textiles": {
        "preset": "ecommerce_white",
        "aspect_ratio": "portrait_4x5",
        "add_shadow": False,
        "description": "Sarees, dupattas, shawls requiring portrait framing for full drape",
    },
    "wooden_crafts": {
        "preset": "terracotta_sand",
        "aspect_ratio": "square_1x1",
        "add_shadow": True,
        "description": "Hand-carved woodwork and rustic home decor",
    },
    "jewellery": {
        "preset": "minimal_grey",
        "aspect_ratio": "square_1x1",
        "add_shadow": True,
        "description": "Metalwork, silver filigree, and beadwork with high clarity",
    },
    "general": {
        "preset": "ecommerce_white",
        "aspect_ratio": "square_1x1",
        "add_shadow": True,
        "description": "General artisan handicrafts and home accessories",
    },
}


class StudioComposer:
    """Orchestrator for studio background framing and e-commerce presentation."""

    def __init__(
        self,
        cloudinary_service: Optional[CloudinaryService] = None,
        persistence_bridge: Optional[PersistenceBridge] = None,
    ) -> None:
        """Initialize StudioComposer with Cloudinary service and PersistenceBridge."""
        self.cloudinary = cloudinary_service or CloudinaryService()
        self.bridge = persistence_bridge or PersistenceBridge(cloudinary_service=self.cloudinary)

    def build_transformation_layers(
        self,
        preset: str = "ecommerce_white",
        aspect_ratio: str = "square_1x1",
        add_shadow: bool = True,
    ) -> List[Dict[str, Any]]:
        """Build deterministic Cloudinary transformation layers.

        Args:
            preset: Studio background preset key.
            aspect_ratio: Target canvas aspect ratio key.
            add_shadow: Whether to generate a subtle contact drop shadow.

        Returns:
            List of transformation parameter dictionaries.

        Raises:
            ValueError: If preset or aspect_ratio is invalid.
        """
        preset_key = preset.lower()
        if preset_key not in STUDIO_PRESETS:
            valid_presets = ", ".join(STUDIO_PRESETS.keys())
            raise ValueError(f"Invalid studio preset '{preset}'. Valid presets: {valid_presets}")

        aspect_key = aspect_ratio.lower()
        if aspect_key not in ASPECT_RATIOS:
            valid_ratios = ", ".join(ASPECT_RATIOS.keys())
            raise ValueError(f"Invalid aspect ratio '{aspect_ratio}'. Valid ratios: {valid_ratios}")

        preset_cfg = STUDIO_PRESETS[preset_key]
        width, height = ASPECT_RATIOS[aspect_key]

        transformation_layers: List[Dict[str, Any]] = [
            {"effect": "trim"},  # Auto-crop transparent boundaries to perfectly center the product
        ]

        # 1. Contact shadow beneath/behind product
        if add_shadow and preset_key != "transparent_png":
            transformation_layers.append({
                "effect": "shadow:40",
                "color": "rgb:202020",
                "x": 0,
                "y": 15,
            })

        # 2. Canvas padding (preserves proportional product dimensions without stretching)
        canvas_layer: Dict[str, Any] = {
            "width": width,
            "height": height,
            "crop": "pad",
        }
        if preset_cfg["background"]:
            canvas_layer["background"] = preset_cfg["background"]

        transformation_layers.append(canvas_layer)

        # 3. Format & delivery optimization
        if preset_cfg["format"] == "png":
            transformation_layers.append({"fetch_format": "png", "quality": "auto"})
        else:
            transformation_layers.append({"fetch_format": "auto", "quality": "auto"})

        return transformation_layers

    def generate_studio_url(
        self,
        cutout_public_id: str,
        preset: str = "ecommerce_white",
        aspect_ratio: str = "square_1x1",
        add_shadow: bool = True,
    ) -> str:
        """Generate direct Cloudinary dynamic delivery URL for a studio composition.

        Args:
            cutout_public_id: Public ID of the transparent cutout asset.
            preset: Studio backdrop preset key.
            aspect_ratio: Target aspect ratio key.
            add_shadow: Whether contact drop shadow is enabled.

        Returns:
            Secure HTTPS delivery URL with all transformation parameters.
        """
        transformations = self.build_transformation_layers(
            preset=preset,
            aspect_ratio=aspect_ratio,
            add_shadow=add_shadow,
        )
        # Prepend safe dimension limit (2048x2048) to guarantee Cloudinary on-the-fly transformations
        # never exceed Cloudinary's 25 Megapixel transformation limit on raw camera cutouts
        safe_transformations = [{"crop": "limit", "width": 2048, "height": 2048}] + transformations
        url, _ = cloudinary.utils.cloudinary_url(
            cutout_public_id,
            transformation=safe_transformations,
            secure=True,
        )
        return url

    def compose_studio_image(
        self,
        cutout: ImageAsset,
        original: Optional[ImageAsset] = None,
        category: str = "general",
        preset: Optional[str] = None,
        aspect_ratio: Optional[str] = None,
        add_shadow: Optional[bool] = None,
        enhanced_public_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> EnhancedImageResult:
        """Compose a persistent studio-enhanced asset from a transparent cutout.

        Args:
            cutout: Source ImageAsset from artisan-ai/cutouts/.
            original: Optional raw ImageAsset from artisan-ai/originals/.
            category: Craft category to derive defaults from.
            preset: Optional backdrop preset override.
            aspect_ratio: Optional aspect ratio override.
            add_shadow: Optional shadow toggle override.
            enhanced_public_id: Optional custom public ID for the enhanced asset.
            tags: Optional metadata tags.

        Returns:
            EnhancedImageResult containing original, cutout, and enhanced assets.
        """
        start_time = time.time()
        cat_key = category.lower()
        cat_defaults = CATEGORY_DEFAULTS.get(cat_key, CATEGORY_DEFAULTS["general"])

        final_preset = (preset or cat_defaults["preset"]).lower()
        final_aspect = (aspect_ratio or cat_defaults["aspect_ratio"]).lower()
        final_shadow = cat_defaults["add_shadow"] if add_shadow is None else add_shadow

        try:
            studio_url = self.generate_studio_url(
                cutout_public_id=cutout.public_id,
                preset=final_preset,
                aspect_ratio=final_aspect,
                add_shadow=final_shadow,
            )
        except ValueError as val_err:
            return EnhancedImageResult(
                success=False,
                original=original,
                cutout=cutout,
                category=cat_key,
                preset=final_preset,
                aspect_ratio=final_aspect,
                shadow_enabled=final_shadow,
                error=str(val_err),
                error_code="INVALID_STUDIO_CONFIGURATION",
            )

        # Upload transformed URL into persistent storage under artisan-ai/enhanced/
        enhanced_tags = list(tags) if tags else []
        enhanced_tags.extend(["enhanced", f"preset_{final_preset}", f"category_{cat_key}"])

        format_override = "png" if final_preset == "transparent_png" else "webp"

        upload_res = self.cloudinary.upload_enhanced_image(
            image_input=studio_url,
            public_id=enhanced_public_id,
            tags=enhanced_tags,
            format_override=format_override,
        )

        if not upload_res.success or not upload_res.asset:
            return EnhancedImageResult(
                success=False,
                original=original,
                cutout=cutout,
                enhanced=None,
                category=cat_key,
                preset=final_preset,
                aspect_ratio=final_aspect,
                shadow_enabled=final_shadow,
                error=f"Cloudinary enhanced asset creation failed: {upload_res.error}",
                error_code="ENHANCED_UPLOAD_FAILED",
                metadata={"execution_time_ms": round((time.time() - start_time) * 1000, 2)},
            )

        enhanced_asset = upload_res.asset
        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        return EnhancedImageResult(
            success=True,
            provider="cloudinary",
            original=original,
            cutout=cutout,
            enhanced=enhanced_asset,
            category=cat_key,
            preset=final_preset,
            aspect_ratio=final_aspect,
            shadow_enabled=final_shadow,
            metadata={
                "execution_time_ms": elapsed_ms,
                "studio_url": studio_url,
                "dimensions": f"{enhanced_asset.width}x{enhanced_asset.height}",
                "format": enhanced_asset.format,
                "preset_config": STUDIO_PRESETS.get(final_preset),
            },
        )

    def process_studio_pipeline(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        category: str = "general",
        preset: Optional[str] = None,
        aspect_ratio: Optional[str] = None,
        add_shadow: Optional[bool] = None,
        tags: Optional[List[str]] = None,
    ) -> EnhancedImageResult:
        """Execute full end-to-end studio pipeline: Raw -> Cutout -> Enhanced Studio Asset.

        Args:
            image_input: Raw image input.
            category: Artisan craft category.
            preset: Optional backdrop preset override.
            aspect_ratio: Optional aspect ratio override.
            add_shadow: Optional shadow toggle override.
            tags: Optional metadata tags.

        Returns:
            EnhancedImageResult containing original, cutout, and enhanced assets.
        """
        cat_key = category.lower()
        cat_defaults = CATEGORY_DEFAULTS.get(cat_key, CATEGORY_DEFAULTS["general"])
        final_preset = (preset or cat_defaults["preset"]).lower()
        final_aspect = (aspect_ratio or cat_defaults["aspect_ratio"]).lower()
        final_shadow = cat_defaults["add_shadow"] if add_shadow is None else add_shadow

        # Step 1 & 2: Persistence Bridge (Raw -> Cloudinary -> Picsart -> Cloudinary Cutout)
        bridge_res = self.bridge.process_original_to_cutout(
            image_input=image_input,
            tags=tags,
        )

        if not bridge_res.success or not bridge_res.cutout:
            return EnhancedImageResult(
                success=False,
                original=bridge_res.original,
                cutout=None,
                enhanced=None,
                category=cat_key,
                preset=final_preset,
                aspect_ratio=final_aspect,
                shadow_enabled=final_shadow,
                error=bridge_res.error,
                error_code=bridge_res.error_code,
                metadata=bridge_res.metadata,
            )

        # Step 3: Compose Studio Presentation
        return self.compose_studio_image(
            cutout=bridge_res.cutout,
            original=bridge_res.original,
            category=cat_key,
            preset=final_preset,
            aspect_ratio=final_aspect,
            add_shadow=final_shadow,
            tags=tags,
        )


def get_studio_composer() -> StudioComposer:
    """Factory helper to obtain a configured StudioComposer instance."""
    return StudioComposer()
