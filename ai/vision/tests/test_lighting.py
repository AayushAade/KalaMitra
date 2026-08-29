"""Unit tests for LightingCorrector engine."""

import io
from pathlib import Path
import sys
import unittest
import numpy as np
from PIL import Image

_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from ai.vision.lighting import LightingCorrector


class TestLightingCorrector(unittest.TestCase):
    """Test suite for lighting and white-balance correction."""

    def setUp(self):
        self.corrector = LightingCorrector()
        self.sample_img_path = Path(__file__).parent / "test_product.jpg"

    def test_lighting_correction_on_local_file(self):
        """Test full lighting pipeline on real sample image."""
        self.assertTrue(self.sample_img_path.exists())
        enhanced_bytes, telemetry = self.corrector.correct_lighting(
            self.sample_img_path,
            enable_white_balance=True,
            enable_clahe=True,
            enable_auto_exposure=True,
        )

        self.assertIsInstance(enhanced_bytes, bytes)
        self.assertGreater(len(enhanced_bytes), 1000)
        self.assertIn("execution_time_ms", telemetry)
        self.assertIn("enhanced_luminance", telemetry)
        self.assertTrue(telemetry["clahe_applied"])

    def test_underexposed_image_enhancement(self):
        """Test auto exposure lift on an artificially darkened image."""
        # Create dark image (mean lum ~ 30)
        dark_arr = np.full((100, 100, 3), 30, dtype=np.uint8)
        enhanced_bytes, telemetry = self.corrector.correct_lighting(dark_arr)

        img = Image.open(io.BytesIO(enhanced_bytes))
        mean_lum_after = np.mean(np.array(img))
        self.assertGreater(mean_lum_after, 30)
        self.assertGreater(telemetry["luminance_boost_percent"], 0)


if __name__ == "__main__":
    unittest.main()
