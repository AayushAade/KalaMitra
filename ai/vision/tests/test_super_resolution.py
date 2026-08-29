"""Unit tests for SuperResolutionProvider."""

import io
from pathlib import Path
import sys
import unittest
import numpy as np
from PIL import Image

_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from ai.vision.providers.sr_provider import SuperResolutionProvider


class TestSuperResolutionProvider(unittest.TestCase):
    """Test suite for SuperResolutionProvider."""

    def setUp(self):
        self.sr = SuperResolutionProvider()
        self.sample_img_path = Path(__file__).parent / "test_product.jpg"

    def test_upscale_2x(self):
        """Test 2x super-resolution and dimension scaling."""
        self.assertTrue(self.sample_img_path.exists())
        upscaled_bytes, telemetry = self.sr.upscale_image(self.sample_img_path, scale=2)

        self.assertIsInstance(upscaled_bytes, bytes)
        self.assertEqual(telemetry["scale_factor"], 2)

        # Verify decoded dimensions doubled
        img = Image.open(io.BytesIO(upscaled_bytes))
        orig_img = Image.open(self.sample_img_path)
        self.assertEqual(img.width, orig_img.width * 2)
        self.assertEqual(img.height, orig_img.height * 2)

    def test_upscale_4x(self):
        """Test 4x super-resolution scaling."""
        upscaled_bytes, telemetry = self.sr.upscale_image(self.sample_img_path, scale=4)
        img = Image.open(io.BytesIO(upscaled_bytes))
        orig_img = Image.open(self.sample_img_path)
        self.assertEqual(img.width, orig_img.width * 4)
        self.assertEqual(img.height, orig_img.height * 4)


if __name__ == "__main__":
    unittest.main()
