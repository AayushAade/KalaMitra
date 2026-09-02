"""Unit and metric verification tests for ProductFidelityValidator.

Tests the product-fidelity validation engine across synthetic and real product transformations:
- Identical copy (PASS)
- Background replacement (PASS)
- Lighting improvement (PASS)
- Super-resolution / sharpening (PASS)
- Recolored product (FAIL/REVIEW)
- Reshaped / deformed geometry (FAIL)
- Missing component / partial deletion (FAIL)
- Different product entirely (FAIL)
- Canvas aspect-ratio changes (PASS)
"""

import io
import unittest

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

from ai.vision.config import FidelitySettings
from ai.vision.fidelity import ProductFidelityValidator
from ai.vision.schemas import FidelityValidationResult


class TestProductFidelityValidator(unittest.TestCase):
    """Test suite verifying metric calculations and decision logic in ProductFidelityValidator."""

    def setUp(self):
        """Create synthetic artisan product test fixtures with transparent and opaque backgrounds."""
        self.validator = ProductFidelityValidator()

        # Create a synthetic terracotta pottery vase with transparent background
        self.base_pottery_rgba = Image.new("RGBA", (400, 400), (0, 0, 0, 0))
        draw = ImageDraw.Draw(self.base_pottery_rgba)
        # Draw vase body (terracotta color: 204, 78, 36)
        draw.ellipse([120, 160, 280, 360], fill=(204, 78, 36, 255))
        # Draw vase neck
        draw.rectangle([160, 80, 240, 180], fill=(204, 78, 36, 255))
        # Draw rim
        draw.ellipse([150, 70, 250, 95], fill=(225, 95, 50, 255))
        # Draw decorative carved band
        draw.line([130, 260, 270, 260], fill=(80, 40, 20, 255), width=6)

        # Convert to RGB with white background
        self.base_pottery_white_bg = Image.new("RGB", (400, 400), (255, 255, 255))
        self.base_pottery_white_bg.paste(
            self.base_pottery_rgba, (0, 0), mask=self.base_pottery_rgba.split()[3]
        )

        # Convert to RGB with simulated textured workshop background
        self.base_pottery_workshop_bg = Image.new("RGB", (400, 400), (140, 130, 120))
        self.base_pottery_workshop_bg.paste(
            self.base_pottery_rgba, (0, 0), mask=self.base_pottery_rgba.split()[3]
        )

    def test_01_identical_image_passes(self):
        """1. Test that comparing identical images produces a confident PASS with near 1.0 metrics."""
        result = self.validator.validate(
            original_image=self.base_pottery_rgba,
            generated_image=self.base_pottery_rgba,
            category="pottery",
        )

        self.assertIsInstance(result, FidelityValidationResult)
        self.assertEqual(result.decision, "PASS")
        self.assertGreaterEqual(result.score, 0.95)
        self.assertGreaterEqual(result.metrics.mask_iou, 0.98)
        self.assertGreaterEqual(result.metrics.ssim, 0.95)
        self.assertLessEqual(result.metrics.color_delta_e, 1.0)
        self.assertLessEqual(result.metrics.aspect_ratio_delta, 0.05)
        self.assertEqual(len(result.warnings), 0)

    def test_02_background_change_preserves_product(self):
        """2. Test that replacing the background does NOT trigger a fidelity failure."""
        # Generated image is the same pottery on a different luxury beige background
        beige_bg = Image.new("RGB", (400, 400), (247, 244, 238))
        beige_bg.paste(self.base_pottery_rgba, (0, 0), mask=self.base_pottery_rgba.split()[3])

        result = self.validator.validate(
            original_image=self.base_pottery_rgba,
            generated_image=beige_bg,
            category="pottery",
        )

        self.assertEqual(result.decision, "PASS")
        self.assertGreaterEqual(result.score, 0.85)
        self.assertGreaterEqual(result.metrics.mask_iou, 0.88)
        self.assertLessEqual(result.metrics.color_delta_e, 5.0)

    def test_03_lighting_correction_passes(self):
        """3. Test that realistic exposure / lighting improvement passes fidelity validation."""
        # Brighten the product slightly (15% exposure lift)
        enhancer = ImageEnhance.Brightness(self.base_pottery_white_bg)
        brightened = enhancer.enhance(1.15)

        result = self.validator.validate(
            original_image=self.base_pottery_white_bg,
            generated_image=brightened,
            category="pottery",
        )

        self.assertEqual(result.decision, "PASS")
        self.assertGreaterEqual(result.score, 0.80)
        self.assertGreaterEqual(result.metrics.mask_iou, 0.88)
        self.assertLessEqual(result.metrics.color_delta_e, 12.0)

    def test_04_sharpening_and_super_resolution_passes(self):
        """4. Test that detail sharpening / super-resolution is accepted."""
        sharpened = self.base_pottery_rgba.filter(ImageFilter.SHARPEN)

        result = self.validator.validate(
            original_image=self.base_pottery_rgba,
            generated_image=sharpened,
            category="pottery",
        )

        self.assertEqual(result.decision, "PASS")
        self.assertGreaterEqual(result.score, 0.90)
        self.assertGreaterEqual(result.metrics.mask_iou, 0.95)

    def test_05_recolored_product_fails_or_flags_review(self):
        """5. Test that drastically recoloring the product (terracotta -> bright cyan) is flagged."""
        # Change terracotta (204, 78, 36) into cyan (36, 180, 204)
        recolored = Image.new("RGBA", (400, 400), (0, 0, 0, 0))
        draw = ImageDraw.Draw(recolored)
        draw.ellipse([120, 160, 280, 360], fill=(36, 180, 204, 255))
        draw.rectangle([160, 80, 240, 180], fill=(36, 180, 204, 255))
        draw.ellipse([150, 70, 250, 95], fill=(50, 210, 225, 255))

        result = self.validator.validate(
            original_image=self.base_pottery_rgba,
            generated_image=recolored,
            category="pottery",
        )

        self.assertIn(result.decision, ["REVIEW", "FAIL"])
        self.assertGreater(result.metrics.color_delta_e, 25.0)
        self.assertTrue(any("color" in w.lower() for w in result.warnings))

    def test_06_reshaped_product_fails(self):
        """6. Test that severe aspect-ratio / geometric distortion triggers FAIL."""
        # Horizontally stretch the vase by 2x
        stretched = self.base_pottery_rgba.resize((700, 400))

        result = self.validator.validate(
            original_image=self.base_pottery_rgba,
            generated_image=stretched,
            category="pottery",
        )

        self.assertEqual(result.decision, "FAIL")
        self.assertGreater(result.metrics.aspect_ratio_delta, 0.30)
        self.assertTrue(any("aspect ratio" in w.lower() for w in result.warnings))

    def test_07_missing_component_flags_fail_or_review(self):
        """7. Test that deleting major product components (e.g. neck & rim of vase removed) is detected."""
        # Only bottom bowl remains, neck removed
        missing_neck = Image.new("RGBA", (400, 400), (0, 0, 0, 0))
        draw = ImageDraw.Draw(missing_neck)
        draw.ellipse([120, 160, 280, 360], fill=(204, 78, 36, 255))

        result = self.validator.validate(
            original_image=self.base_pottery_rgba,
            generated_image=missing_neck,
            category="pottery",
        )

        self.assertIn(result.decision, ["REVIEW", "FAIL"])
        self.assertLess(result.metrics.mask_iou, 0.85)

    def test_08_completely_different_product_fails(self):
        """8. Test that an entirely different product (e.g. square box instead of round vase) triggers hard FAIL."""
        # Create a synthetic metal jewelry box (square grey/gold box)
        diff_product = Image.new("RGBA", (400, 400), (0, 0, 0, 0))
        draw = ImageDraw.Draw(diff_product)
        draw.rectangle([50, 120, 350, 280], fill=(180, 160, 80, 255))

        result = self.validator.validate(
            original_image=self.base_pottery_rgba,
            generated_image=diff_product,
            category="pottery",
        )

        self.assertEqual(result.decision, "FAIL")
        self.assertLess(result.score, 0.65)
        self.assertLess(result.metrics.mask_iou, 0.70)

    def test_09_different_canvas_aspect_ratio_preserves_score(self):
        """9. Test that changing canvas framing (e.g. 1:1 square vs 4:5 portrait) does not cause false failures."""
        # Place the same pottery cutout in a portrait 400x500 canvas
        portrait_canvas = Image.new("RGBA", (400, 500), (0, 0, 0, 0))
        portrait_canvas.paste(self.base_pottery_rgba, (0, 50))

        result = self.validator.validate(
            original_image=self.base_pottery_rgba,
            generated_image=portrait_canvas,
            category="pottery",
        )

        self.assertEqual(result.decision, "PASS")
        self.assertGreaterEqual(result.score, 0.90)
        self.assertGreaterEqual(result.metrics.mask_iou, 0.95)

    def test_10_category_specific_weighting(self):
        """10. Test that category-specific weights apply properly."""
        res_pottery = self.validator.validate(self.base_pottery_rgba, self.base_pottery_rgba, category="pottery")
        res_jewellery = self.validator.validate(self.base_pottery_rgba, self.base_pottery_rgba, category="jewellery")

        self.assertIn("pottery", res_pottery.category)
        self.assertIn("jewellery", res_jewellery.category)
        self.assertEqual(res_pottery.details["weights_applied"]["w_iou"], 0.35)
        self.assertEqual(res_jewellery.details["weights_applied"]["w_col"], 0.25)

    def test_11_configurable_custom_thresholds(self):
        """11. Test validator respects custom strict FidelitySettings overrides."""
        strict_settings = FidelitySettings(
            mask_iou_pass=0.99,  # Ultra strict
            ssim_pass=0.99,
            color_delta_e_pass=0.5,
        )
        strict_validator = ProductFidelityValidator(settings=strict_settings)

        # A slightly modified image that would normally pass should be flagged under strict settings
        enhancer = ImageEnhance.Brightness(self.base_pottery_rgba)
        slightly_brighter = enhancer.enhance(1.08)

        res = strict_validator.validate(self.base_pottery_rgba, slightly_brighter)
        self.assertIn(res.decision, ["REVIEW", "FAIL"])
        self.assertTrue(len(res.warnings) > 0)

    def test_12_invalid_image_payload_error_handling(self):
        """12. Test error handling when unparseable or corrupted payload is passed."""
        res = self.validator.validate("non_existent_file.jpg", self.base_pottery_rgba)
        self.assertEqual(res.decision, "FAIL")
        self.assertEqual(res.score, 0.0)
        self.assertIsNotNone(res.error)


if __name__ == "__main__":
    unittest.main()
