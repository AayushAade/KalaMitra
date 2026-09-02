"""Unit tests for transparent cutout size optimization and Cloudinary upload guarding."""

import io
import unittest
from unittest.mock import MagicMock, patch

from PIL import Image

from ai.vision.cloudinary_service import CloudinaryService


class TestCutoutOptimization(unittest.TestCase):
    """Test suite verifying transparent cutout size optimization."""

    def _create_synthetic_cutout_png(
        self,
        width: int,
        height: int,
        fill_alpha: bool = True,
    ) -> bytes:
        """Helper to create a synthetic transparent RGBA PNG image."""
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        # Draw a semi-transparent square in the center
        for x in range(width // 4, 3 * width // 4):
            for y in range(height // 4, 3 * height // 4):
                img.putpixel((x, y), (200, 100, 50, 220 if fill_alpha else 0))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    def test_small_cutout_remains_untouched(self):
        """Small cutout below safety threshold must pass through without resizing."""
        small_bytes = self._create_synthetic_cutout_png(200, 300)
        orig_size = len(small_bytes)

        optimized_bytes, telemetry = CloudinaryService.optimize_cutout_bytes(
            small_bytes,
            max_bytes=9_500_000,
        )

        self.assertFalse(telemetry["optimization_required"])
        self.assertEqual(len(optimized_bytes), orig_size)
        self.assertEqual(optimized_bytes, small_bytes)

    def test_oversized_cutout_optimization_triggered_and_bounded(self):
        """Oversized cutout must trigger optimization and reduce bytes below max_bytes."""
        # Create a large image with high-entropy noise to simulate large camera PNG
        large_img = Image.new("RGBA", (3000, 4000), (100, 150, 200, 180))
        buf = io.BytesIO()
        large_img.save(buf, format="PNG", compress_level=1)
        large_bytes = buf.getvalue()

        # Set a low threshold (e.g. 50 KB) to strictly verify the downscale loop
        test_max_bytes = 50_000
        self.assertGreater(len(large_bytes), test_max_bytes)

        optimized_bytes, telemetry = CloudinaryService.optimize_cutout_bytes(
            large_bytes,
            max_bytes=test_max_bytes,
            min_dimension=100,
        )

        self.assertTrue(telemetry["optimization_required"])
        self.assertLessEqual(len(optimized_bytes), test_max_bytes)
        self.assertLess(len(optimized_bytes), len(large_bytes))

    def test_transparency_and_rgba_mode_preserved(self):
        """Optimization must strictly preserve the alpha channel."""
        img = Image.new("RGBA", (1500, 1500), (0, 0, 0, 0))
        # Top half solid, bottom half transparent
        for x in range(1500):
            for y in range(750):
                img.putpixel((x, y), (255, 0, 0, 255))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        raw_bytes = buf.getvalue()

        test_max = len(raw_bytes) // 2
        optimized_bytes, telemetry = CloudinaryService.optimize_cutout_bytes(
            raw_bytes,
            max_bytes=test_max,
            min_dimension=200,
        )

        # Inspect resulting image
        res_img = Image.open(io.BytesIO(optimized_bytes))
        self.assertEqual(res_img.mode, "RGBA")
        self.assertEqual(res_img.format, "PNG")

        # Verify transparent pixels in bottom half still have alpha=0
        w, h = res_img.size
        sample_pixel_top = res_img.getpixel((w // 2, h // 4))
        sample_pixel_bottom = res_img.getpixel((w // 2, 3 * h // 4))

        self.assertEqual(sample_pixel_top[3], 255)
        self.assertEqual(sample_pixel_bottom[3], 0)

    def test_aspect_ratio_preserved_during_downscale(self):
        """Aspect ratio must be preserved after downscaling."""
        # 16:9 ratio image
        orig_w, orig_h = 3200, 1800
        img = Image.new("RGBA", (orig_w, orig_h), (50, 100, 150, 200))
        buf = io.BytesIO()
        img.save(buf, format="PNG", compress_level=1)
        raw_bytes = buf.getvalue()

        test_max = 40_000
        optimized_bytes, telemetry = CloudinaryService.optimize_cutout_bytes(
            raw_bytes,
            max_bytes=test_max,
            min_dimension=100,
        )

        res_img = Image.open(io.BytesIO(optimized_bytes))
        new_w, new_h = res_img.size

        orig_ratio = round(orig_w / orig_h, 2)
        new_ratio = round(new_w / new_h, 2)
        self.assertAlmostEqual(orig_ratio, new_ratio, delta=0.05)

    @patch("cloudinary.uploader.upload")
    def test_upload_cutout_image_attaches_optimization_telemetry(self, mock_upload):
        """upload_cutout_image must optimize if needed and attach telemetry to result."""
        mock_upload.return_value = {
            "public_id": "artisan-ai/cutouts/test_cutout_123",
            "secure_url": "https://res.cloudinary.com/demo/image/upload/artisan-ai/cutouts/test_cutout_123.png",
            "width": 800,
            "height": 600,
            "format": "png",
            "bytes": 150_000,
            "created_at": "2026-08-31T18:00:00Z",
        }

        service = CloudinaryService()
        small_bytes = self._create_synthetic_cutout_png(400, 400)

        result = service.upload_cutout_image(small_bytes)

        self.assertTrue(result.success)
        self.assertIsNotNone(result.asset)
        self.assertIsNotNone(result.metadata)
        self.assertIn("original_bytes", result.metadata)
        self.assertIn("optimization_required", result.metadata)


if __name__ == "__main__":
    unittest.main()
