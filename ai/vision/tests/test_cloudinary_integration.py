"""Manual integration test for Cloudinary service (requires real credentials).

This test is skipped during automated runs unless LIVE_CLOUDINARY_TEST=true is set.
"""

import os
import sys
from pathlib import Path
import unittest

_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from ai.vision.cloudinary_service import CloudinaryService


class TestCloudinaryIntegration(unittest.TestCase):
    """Live Cloudinary integration test suite."""

    @unittest.skipUnless(
        os.getenv("LIVE_CLOUDINARY_TEST") == "true",
        "Set LIVE_CLOUDINARY_TEST=true to run live integration tests",
    )
    def test_live_upload_and_delete(self):
        """Test real upload and deletion using local test image."""
        service = CloudinaryService()
        test_img_path = Path(__file__).parent / "test_product.jpg"
        self.assertTrue(test_img_path.exists(), "test_product.jpg must exist")

        # 1. Upload
        result = service.upload_original_image(
            image_input=test_img_path,
            folder="artisan-ai/test-runs",
            tags=["integration-test", "phase-1"],
        )
        self.assertTrue(result.success, f"Live upload failed: {result.error}")
        self.assertIsNotNone(result.asset)
        public_id = result.asset.public_id

        # 2. Verify metadata
        metadata = service.get_asset_metadata(public_id)
        self.assertIsNotNone(metadata)
        self.assertEqual(metadata.public_id, public_id)

        # 3. Clean up
        delete_res = service.delete_asset(public_id)
        self.assertTrue(delete_res.success)


if __name__ == "__main__":
    unittest.main()
