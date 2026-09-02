"""Unit tests for StudioComposer, backdrop presets, contact shadows, and aspect ratio framing."""

import io
from pathlib import Path
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure repo root is on sys.path
_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from ai.vision.schemas import EnhancedImageResult, ImageAsset, OriginalImageResult, PersistenceBridgeResult
from ai.vision.studio import (
    ASPECT_RATIOS,
    CATEGORY_DEFAULTS,
    STUDIO_PRESETS,
    StudioComposer,
)


class TestStudioComposer(unittest.TestCase):
    """Unit test suite for Phase 3B Studio Composition Layer."""

    def setUp(self):
        self.mock_cloudinary = MagicMock()
        self.mock_bridge = MagicMock()
        self.composer = StudioComposer(
            cloudinary_service=self.mock_cloudinary,
            persistence_bridge=self.mock_bridge,
        )

        self.mock_original = ImageAsset(
            public_id="artisan-ai/originals/vase_orig_99",
            secure_url="https://res.cloudinary.com/demo/image/upload/v1/artisan-ai/originals/vase_orig_99.jpg",
            width=1080,
            height=1080,
            format="jpg",
            bytes=420000,
        )

        self.mock_cutout = ImageAsset(
            public_id="artisan-ai/cutouts/vase_cutout_99",
            secure_url="https://res.cloudinary.com/demo/image/upload/v1/artisan-ai/cutouts/vase_cutout_99.png",
            width=1080,
            height=1080,
            format="png",
            bytes=250000,
        )

        self.mock_enhanced = ImageAsset(
            public_id="artisan-ai/enhanced/vase_enhanced_99",
            secure_url="https://res.cloudinary.com/demo/image/upload/v1/artisan-ai/enhanced/vase_enhanced_99.webp",
            width=1080,
            height=1080,
            format="webp",
            bytes=120000,
        )

    def test_1_white_studio_preset(self):
        """1. Test ecommerce_white backdrop configuration (rgb:FFFFFF)."""
        layers = self.composer.build_transformation_layers(
            preset="ecommerce_white",
            aspect_ratio="square_1x1",
            add_shadow=True,
        )
        bg_layers = [layer for layer in layers if "background" in layer]
        self.assertTrue(len(bg_layers) > 0)
        self.assertEqual(bg_layers[0]["background"], "rgb:FFFFFF")

    def test_2_warm_neutral_preset(self):
        """2. Test warm_neutral backdrop configuration (rgb:F7F4EE)."""
        layers = self.composer.build_transformation_layers(
            preset="warm_neutral",
            aspect_ratio="square_1x1",
            add_shadow=True,
        )
        bg_layers = [layer for layer in layers if "background" in layer]
        self.assertEqual(bg_layers[0]["background"], "rgb:F7F4EE")

    def test_3_minimal_grey_preset(self):
        """3. Test minimal_grey backdrop configuration (rgb:F5F5F7)."""
        layers = self.composer.build_transformation_layers(
            preset="minimal_grey",
            aspect_ratio="square_1x1",
            add_shadow=True,
        )
        bg_layers = [layer for layer in layers if "background" in layer]
        self.assertEqual(bg_layers[0]["background"], "rgb:F5F5F7")

    def test_4_terracotta_sand_preset(self):
        """4. Test terracotta_sand backdrop configuration (rgb:F4EBE1)."""
        layers = self.composer.build_transformation_layers(
            preset="terracotta_sand",
            aspect_ratio="square_1x1",
            add_shadow=True,
        )
        bg_layers = [layer for layer in layers if "background" in layer]
        self.assertEqual(bg_layers[0]["background"], "rgb:F4EBE1")

    def test_5_transparent_png_preset(self):
        """5. Test transparent_png preset (no background, PNG format enforced)."""
        layers = self.composer.build_transformation_layers(
            preset="transparent_png",
            aspect_ratio="square_1x1",
            add_shadow=False,
        )
        # Background key should not exist in canvas layer
        canvas_layer = [l for l in layers if l.get("crop") == "pad"][0]
        self.assertNotIn("background", canvas_layer)
        # Fetch format must be png
        fmt_layer = [l for l in layers if "fetch_format" in l][0]
        self.assertEqual(fmt_layer["fetch_format"], "png")

    def test_6_contact_shadow_enabled(self):
        """6. Test contact drop shadow layer is generated when enabled."""
        layers = self.composer.build_transformation_layers(
            preset="ecommerce_white",
            aspect_ratio="square_1x1",
            add_shadow=True,
        )
        shadow_layers = [l for l in layers if "shadow" in str(l.get("effect", ""))]
        self.assertTrue(len(shadow_layers) > 0)
        self.assertEqual(shadow_layers[0]["effect"], "shadow:40")

    def test_7_contact_shadow_disabled(self):
        """7. Test contact drop shadow layer is omitted when disabled."""
        layers = self.composer.build_transformation_layers(
            preset="ecommerce_white",
            aspect_ratio="square_1x1",
            add_shadow=False,
        )
        shadow_layers = [l for l in layers if "shadow" in str(l.get("effect", ""))]
        self.assertEqual(len(shadow_layers), 0)

    def test_8_square_output_dimensions(self):
        """8. Test square_1x1 canvas dimensions (1080x1080)."""
        layers = self.composer.build_transformation_layers(
            preset="ecommerce_white",
            aspect_ratio="square_1x1",
        )
        canvas = [l for l in layers if l.get("crop") == "pad"][0]
        self.assertEqual(canvas["width"], 1080)
        self.assertEqual(canvas["height"], 1080)

    def test_9_portrait_output_dimensions(self):
        """9. Test portrait_4x5 (1080x1350) and portrait_9x16 (1080x1920)."""
        layers_4x5 = self.composer.build_transformation_layers(
            preset="ecommerce_white",
            aspect_ratio="portrait_4x5",
        )
        canvas_4x5 = [l for l in layers_4x5 if l.get("crop") == "pad"][0]
        self.assertEqual(canvas_4x5["width"], 1080)
        self.assertEqual(canvas_4x5["height"], 1350)

        layers_9x16 = self.composer.build_transformation_layers(
            preset="ecommerce_white",
            aspect_ratio="portrait_9x16",
        )
        canvas_9x16 = [l for l in layers_9x16 if l.get("crop") == "pad"][0]
        self.assertEqual(canvas_9x16["width"], 1080)
        self.assertEqual(canvas_9x16["height"], 1920)

    def test_10_landscape_output_dimensions(self):
        """10. Test landscape_16x9 canvas dimensions (1920x1080)."""
        layers_16x9 = self.composer.build_transformation_layers(
            preset="ecommerce_white",
            aspect_ratio="landscape_16x9",
        )
        canvas_16x9 = [l for l in layers_16x9 if l.get("crop") == "pad"][0]
        self.assertEqual(canvas_16x9["width"], 1920)
        self.assertEqual(canvas_16x9["height"], 1080)

    def test_11_category_defaults(self):
        """11. Test craft category defaults for pottery, textiles, wooden_crafts, jewellery, general."""
        # Pottery -> warm_neutral, square_1x1, shadow=True
        self.assertEqual(CATEGORY_DEFAULTS["pottery"]["preset"], "warm_neutral")
        self.assertEqual(CATEGORY_DEFAULTS["pottery"]["aspect_ratio"], "square_1x1")
        self.assertTrue(CATEGORY_DEFAULTS["pottery"]["add_shadow"])

        # Textiles -> ecommerce_white, portrait_4x5, shadow=False
        self.assertEqual(CATEGORY_DEFAULTS["textiles"]["preset"], "ecommerce_white")
        self.assertEqual(CATEGORY_DEFAULTS["textiles"]["aspect_ratio"], "portrait_4x5")
        self.assertFalse(CATEGORY_DEFAULTS["textiles"]["add_shadow"])

        # Wooden crafts -> terracotta_sand, square_1x1, shadow=True
        self.assertEqual(CATEGORY_DEFAULTS["wooden_crafts"]["preset"], "terracotta_sand")

        # Jewellery -> minimal_grey, square_1x1, shadow=True
        self.assertEqual(CATEGORY_DEFAULTS["jewellery"]["preset"], "minimal_grey")

    def test_12_invalid_preset_rejected(self):
        """12. Test that invalid studio preset keys are rejected."""
        with self.assertRaises(ValueError) as ctx:
            self.composer.build_transformation_layers(preset="invalid_neon_backdrop")
        self.assertIn("Invalid studio preset", str(ctx.exception))

    def test_13_invalid_aspect_ratio_rejected(self):
        """13. Test that invalid aspect ratio keys are rejected."""
        with self.assertRaises(ValueError) as ctx:
            self.composer.build_transformation_layers(aspect_ratio="ultra_wide_32x9")
        self.assertIn("Invalid aspect ratio", str(ctx.exception))

    def test_14_original_asset_remains_untouched(self):
        """14. Test that original asset metadata is preserved in result schema."""
        self.mock_cloudinary.upload_enhanced_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_enhanced,
        )

        result = self.composer.compose_studio_image(
            cutout=self.mock_cutout,
            original=self.mock_original,
            category="pottery",
        )

        self.assertTrue(result.success)
        self.assertIsNotNone(result.original)
        self.assertEqual(result.original.public_id, "artisan-ai/originals/vase_orig_99")
        self.assertEqual(result.original.secure_url, self.mock_original.secure_url)

    def test_15_cutout_asset_remains_untouched(self):
        """15. Test that cutout asset metadata is preserved in result schema."""
        self.mock_cloudinary.upload_enhanced_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_enhanced,
        )

        result = self.composer.compose_studio_image(
            cutout=self.mock_cutout,
            original=self.mock_original,
            category="pottery",
        )

        self.assertTrue(result.success)
        self.assertIsNotNone(result.cutout)
        self.assertEqual(result.cutout.public_id, "artisan-ai/cutouts/vase_cutout_99")
        self.assertEqual(result.cutout.format, "png")

    def test_16_proportional_framing_without_stretching(self):
        """16. Test that crop='pad' is used in canvas composition to prevent stretching."""
        layers = self.composer.build_transformation_layers(
            preset="ecommerce_white",
            aspect_ratio="portrait_4x5",
        )
        canvas = [l for l in layers if "crop" in l][0]
        self.assertEqual(canvas["crop"], "pad")  # 'pad' guarantees aspect ratio preservation

    def test_17_final_asset_stored_in_enhanced_folder(self):
        """17. Test that final studio composition uploads to artisan-ai/enhanced/ folder."""
        self.mock_cloudinary.upload_enhanced_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_enhanced,
        )

        result = self.composer.compose_studio_image(
            cutout=self.mock_cutout,
            original=self.mock_original,
            category="wooden_crafts",
        )

        self.assertTrue(result.success)
        self.mock_cloudinary.upload_enhanced_image.assert_called_once()
        self.assertEqual(result.enhanced.public_id, "artisan-ai/enhanced/vase_enhanced_99")


if __name__ == "__main__":
    unittest.main()
