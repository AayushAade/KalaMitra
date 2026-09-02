"""Unit tests for Cloudinary configuration, schemas, and service layer."""

import io
import os
import sys
from pathlib import Path
import unittest
from unittest.mock import MagicMock, patch

# Ensure repo root is on sys.path
_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from ai.vision.config import CloudinarySettings, configure_cloudinary, get_cloudinary_config
from ai.vision.schemas import ImageAsset, OriginalImageResult, AssetDeleteResult
from ai.vision.cloudinary_service import CloudinaryService


class TestCloudinaryConfig(unittest.TestCase):
    """Tests for Cloudinary configuration and credential validation."""

    def test_missing_credentials_raises_error(self):
        """Ensure missing environment variables trigger a descriptive ValueError."""
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError) as ctx:
                get_cloudinary_config()
            self.assertIn("CLOUDINARY_CLOUD_NAME", str(ctx.exception))
            self.assertIn("CLOUDINARY_API_KEY", str(ctx.exception))
            self.assertIn("CLOUDINARY_API_SECRET", str(ctx.exception))

    def test_valid_credentials_loaded(self):
        """Ensure valid credentials create a settings object."""
        test_env = {
            "CLOUDINARY_CLOUD_NAME": "test-cloud",
            "CLOUDINARY_API_KEY": "1234567890",
            "CLOUDINARY_API_SECRET": "secret_xyz_987",
        }
        with patch.dict(os.environ, test_env, clear=True):
            settings = get_cloudinary_config()
            self.assertEqual(settings.cloud_name, "test-cloud")
            self.assertEqual(settings.api_key, "1234567890")
            self.assertEqual(settings.api_secret, "secret_xyz_987")
            self.assertTrue(settings.secure)

    def test_secrets_masked_in_repr(self):
        """Ensure API secret is never printed or exposed in repr."""
        settings = CloudinarySettings(
            cloud_name="demo-cloud",
            api_key="987654321",
            api_secret="ultra_sensitive_secret_token",
        )
        repr_str = repr(settings)
        self.assertNotIn("ultra_sensitive_secret_token", repr_str)
        self.assertIn("******", repr_str)


class TestCloudinaryService(unittest.TestCase):
    """Tests for CloudinaryService upload and asset operations with mocks."""

    def setUp(self):
        self.mock_settings = CloudinarySettings(
            cloud_name="test-cloud",
            api_key="123456",
            api_secret="secret_abc",
        )

    @patch("ai.vision.cloudinary_service.configure_cloudinary")
    @patch("cloudinary.uploader.upload")
    def test_upload_original_image_stream(self, mock_upload, mock_configure):
        """Test uploading a file-like stream to Cloudinary."""
        mock_configure.return_value = self.mock_settings
        mock_upload.return_value = {
            "public_id": "artisan-ai/originals/artisan_vase_123",
            "secure_url": "https://res.cloudinary.com/test-cloud/image/upload/v1/artisan-ai/originals/artisan_vase_123.jpg",
            "width": 1080,
            "height": 1080,
            "format": "jpg",
            "bytes": 524288,
            "created_at": "2026-08-28T00:00:00Z",
        }

        service = CloudinaryService()
        fake_stream = io.BytesIO(b"fake-image-binary-data")
        result = service.upload_original_image(fake_stream)

        self.assertTrue(result.success)
        self.assertEqual(result.provider, "cloudinary")
        self.assertEqual(result.stage, "original_upload")
        self.assertIsNotNone(result.asset)
        self.assertEqual(result.asset.public_id, "artisan-ai/originals/artisan_vase_123")
        self.assertEqual(result.asset.width, 1080)
        self.assertEqual(result.asset.height, 1080)
        self.assertEqual(result.asset.format, "jpg")
        self.assertEqual(result.asset.bytes, 524288)
        self.assertIsNone(result.error)

        mock_upload.assert_called_once()
        args, kwargs = mock_upload.call_args
        self.assertEqual(kwargs.get("folder"), "artisan-ai/originals")
        self.assertEqual(kwargs.get("resource_type"), "image")

    @patch("ai.vision.cloudinary_service.configure_cloudinary")
    @patch("cloudinary.uploader.upload")
    def test_upload_original_image_bytes(self, mock_upload, mock_configure):
        """Test uploading raw bytes."""
        mock_configure.return_value = self.mock_settings
        mock_upload.return_value = {
            "public_id": "artisan-ai/originals/textile_01",
            "secure_url": "https://res.cloudinary.com/test-cloud/image/upload/textile_01.png",
            "width": 800,
            "height": 600,
            "format": "png",
            "bytes": 204800,
        }

        service = CloudinaryService()
        raw_bytes = b"\x89PNG\r\n\x1a\nfakeimagebytes"
        result = service.upload_original_image(raw_bytes, public_id="textile_01")

        self.assertTrue(result.success)
        self.assertEqual(result.asset.public_id, "artisan-ai/originals/textile_01")
        self.assertEqual(result.asset.format, "png")

    @patch("ai.vision.cloudinary_service.configure_cloudinary")
    @patch("cloudinary.uploader.upload")
    def test_upload_failure_handling(self, mock_upload, mock_configure):
        """Test that upload exceptions are captured cleanly in result schema without crashing."""
        mock_configure.return_value = self.mock_settings
        mock_upload.side_effect = Exception("Cloudinary connection timeout")

        service = CloudinaryService()
        result = service.upload_original_image(b"broken-bytes")

        self.assertFalse(result.success)
        self.assertIsNone(result.asset)
        self.assertIn("Cloudinary connection timeout", result.error)

    @patch("ai.vision.cloudinary_service.configure_cloudinary")
    @patch("cloudinary.api.resource")
    def test_get_asset_metadata(self, mock_resource, mock_configure):
        """Test fetching existing asset metadata."""
        mock_configure.return_value = self.mock_settings
        mock_resource.return_value = {
            "public_id": "artisan-ai/originals/pottery_09",
            "secure_url": "https://res.cloudinary.com/test-cloud/image/upload/pottery_09.jpg",
            "width": 1200,
            "height": 900,
            "format": "jpg",
            "bytes": 450000,
        }

        service = CloudinaryService()
        asset = service.get_asset_metadata("artisan-ai/originals/pottery_09")

        self.assertIsNotNone(asset)
        self.assertEqual(asset.public_id, "artisan-ai/originals/pottery_09")
        self.assertEqual(asset.width, 1200)

    @patch("ai.vision.cloudinary_service.configure_cloudinary")
    @patch("cloudinary.uploader.destroy")
    def test_delete_asset(self, mock_destroy, mock_configure):
        """Test deleting an asset from storage."""
        mock_configure.return_value = self.mock_settings
        mock_destroy.return_value = {"result": "ok"}

        service = CloudinaryService()
        del_result = service.delete_asset("artisan-ai/originals/old_sample")

        self.assertTrue(del_result.success)
        self.assertEqual(del_result.public_id, "artisan-ai/originals/old_sample")
        self.assertEqual(del_result.result, "ok")


if __name__ == "__main__":
    unittest.main()
