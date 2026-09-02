"""Unit tests for Cloudinary -> Picsart -> Cloudinary Persistence Bridge."""

import io
from pathlib import Path
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure repo root is on sys.path
_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from ai.vision.persistence import PersistenceBridge, process_original_to_cutout
from ai.vision.schemas import ImageAsset, OriginalImageResult, ProcessedImageResult


class TestPersistenceBridge(unittest.TestCase):
    """Unit test suite for the PersistenceBridge orchestration layer."""

    PNG_SAMPLE = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x048\x00\x00\x048\x08\x06\x00\x00\x00fakepngdata"

    def setUp(self):
        self.mock_cloudinary = MagicMock()
        self.mock_picsart = MagicMock()
        self.bridge = PersistenceBridge(
            cloudinary_service=self.mock_cloudinary,
            picsart_provider=self.mock_picsart,
        )

        self.mock_original_asset = ImageAsset(
            public_id="artisan-ai/originals/vase_raw_123",
            secure_url="https://res.cloudinary.com/demo/image/upload/v1/artisan-ai/originals/vase_raw_123.jpg",
            width=1080,
            height=1080,
            format="jpg",
            bytes=450000,
            created_at="2026-08-28T00:00:00Z",
        )

        self.mock_cutout_asset = ImageAsset(
            public_id="artisan-ai/cutouts/vase_cutout_123",
            secure_url="https://res.cloudinary.com/demo/image/upload/v1/artisan-ai/cutouts/vase_cutout_123.png",
            width=1080,
            height=1080,
            format="png",
            bytes=280000,
            created_at="2026-08-28T00:00:05Z",
        )

    def _create_mock_cdn_response(self, content_bytes: bytes, status: int = 200):
        mock_resp = MagicMock()
        mock_resp.status = status
        mock_resp.read.return_value = content_bytes
        mock_resp.__enter__.return_value = mock_resp
        return mock_resp

    @patch("urllib.request.urlopen")
    def test_1_successful_pipeline_execution(self, mock_urlopen):
        """1. Test successful end-to-end bridge execution with valid outputs."""
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=True,
            provider="cloudinary",
            stage="original_upload",
            asset=self.mock_original_asset,
        )

        self.mock_picsart.remove_background.return_value = ProcessedImageResult(
            success=True,
            provider="picsart",
            operation="remove_background",
            output_url="https://cdn.picsart.io/cutouts/vase_cutout.png",
            output_format="PNG",
            metadata={"asset_id": "vase_cutout_123"},
        )

        mock_urlopen.return_value = self._create_mock_cdn_response(self.PNG_SAMPLE)

        self.mock_cloudinary.upload_cutout_image.return_value = OriginalImageResult(
            success=True,
            provider="cloudinary",
            stage="cutout_upload",
            asset=self.mock_cutout_asset,
        )

        result = self.bridge.process_original_to_cutout(
            image_input=b"fake-raw-jpg-bytes",
            tags=["terracotta", "vase"],
        )

        self.assertTrue(result.success)
        self.assertEqual(result.provider, "picsart")
        self.assertEqual(result.operation, "remove_background")
        self.assertIsNotNone(result.original)
        self.assertEqual(result.original.public_id, "artisan-ai/originals/vase_raw_123")
        self.assertIsNotNone(result.cutout)
        self.assertEqual(result.cutout.public_id, "artisan-ai/cutouts/vase_cutout_123")
        self.assertEqual(result.cutout.format, "png")
        self.assertIsNone(result.error)

        self.mock_cloudinary.upload_original_image.assert_called_once()
        self.mock_picsart.remove_background.assert_called_once()
        mock_urlopen.assert_called_once()
        self.mock_cloudinary.upload_cutout_image.assert_called_once()

    def test_2_original_upload_failure_aborts_pipeline(self):
        """2. Test that if Cloudinary original upload fails, Picsart is never called."""
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=False,
            provider="cloudinary",
            stage="original_upload",
            error="Cloudinary connection refused",
        )

        result = self.bridge.process_original_to_cutout(b"raw-image-bytes")

        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "ORIGINAL_UPLOAD_FAILED")
        self.assertIn("Cloudinary original upload failed", result.error)
        self.assertIsNone(result.original)
        self.assertIsNone(result.cutout)
        self.mock_picsart.remove_background.assert_not_called()

    def test_3_picsart_auth_failure_preserves_original(self):
        """3. Test that Picsart 401 error returns structured failure while preserving the original."""
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=True,
            provider="cloudinary",
            asset=self.mock_original_asset,
        )

        self.mock_picsart.remove_background.return_value = ProcessedImageResult(
            success=False,
            provider="picsart",
            operation="remove_background",
            error="Picsart authentication failed. Check PICSART_API_KEY.",
            error_code="UNAUTHORIZED",
        )

        result = self.bridge.process_original_to_cutout(b"raw-image-bytes")

        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "UNAUTHORIZED")
        self.assertIsNotNone(result.original)
        self.assertEqual(result.original.public_id, "artisan-ai/originals/vase_raw_123")
        self.assertIsNone(result.cutout)

    def test_4_picsart_rate_limit_preserves_original(self):
        """4. Test that Picsart 429 rate limit preserves original asset."""
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_original_asset,
        )

        self.mock_picsart.remove_background.return_value = ProcessedImageResult(
            success=False,
            provider="picsart",
            operation="remove_background",
            error="Picsart rate limit or credit quota exceeded.",
            error_code="RATE_LIMITED",
        )

        result = self.bridge.process_original_to_cutout(b"raw-image-bytes")

        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "RATE_LIMITED")
        self.assertIsNotNone(result.original)

    def test_5_picsart_timeout_preserves_original(self):
        """5. Test that network timeout preserves original asset."""
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_original_asset,
        )

        self.mock_picsart.remove_background.return_value = ProcessedImageResult(
            success=False,
            provider="picsart",
            operation="remove_background",
            error="Picsart request timed out after 30 seconds",
            error_code="TIMEOUT",
        )

        result = self.bridge.process_original_to_cutout(b"raw-image-bytes")

        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "TIMEOUT")
        self.assertIsNotNone(result.original)

    def test_6_picsart_malformed_response_preserves_original(self):
        """6. Test that malformed JSON response from Picsart preserves original asset."""
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_original_asset,
        )

        self.mock_picsart.remove_background.return_value = ProcessedImageResult(
            success=False,
            provider="picsart",
            operation="remove_background",
            error="Malformed JSON response from Picsart API",
            error_code="MALFORMED_RESPONSE",
        )

        result = self.bridge.process_original_to_cutout(b"raw-image-bytes")

        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "MALFORMED_RESPONSE")
        self.assertIsNotNone(result.original)

    def test_7_picsart_missing_url_preserves_original(self):
        """7. Test that success response lacking output URL preserves original asset."""
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_original_asset,
        )

        self.mock_picsart.remove_background.return_value = ProcessedImageResult(
            success=True,
            provider="picsart",
            operation="remove_background",
            output_url=None,  # missing
        )

        result = self.bridge.process_original_to_cutout(b"raw-image-bytes")

        self.assertFalse(result.success)
        self.assertIsNotNone(result.original)
        self.assertIsNone(result.cutout)

    @patch("urllib.request.urlopen")
    def test_8_cutout_download_failure_preserves_original(self, mock_urlopen):
        """8. Test that failure downloading cutout from CDN preserves original asset."""
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_original_asset,
        )

        self.mock_picsart.remove_background.return_value = ProcessedImageResult(
            success=True,
            provider="picsart",
            operation="remove_background",
            output_url="https://cdn.picsart.io/broken_link.png",
        )

        mock_urlopen.side_effect = Exception("Connection closed by CDN")

        result = self.bridge.process_original_to_cutout(b"raw-image-bytes")

        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "CUTOUT_DOWNLOAD_FAILED")
        self.assertIsNotNone(result.original)
        self.assertIsNone(result.cutout)

    @patch("urllib.request.urlopen")
    def test_9_cutout_invalid_png_format_preserves_original(self, mock_urlopen):
        """9. Test that non-PNG payload returned by CDN is rejected and original preserved."""
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_original_asset,
        )

        self.mock_picsart.remove_background.return_value = ProcessedImageResult(
            success=True,
            provider="picsart",
            operation="remove_background",
            output_url="https://cdn.picsart.io/not_a_png.html",
        )

        mock_urlopen.return_value = self._create_mock_cdn_response(b"<html>502 Bad Gateway</html>")

        result = self.bridge.process_original_to_cutout(b"raw-image-bytes")

        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "INVALID_CUTOUT_FORMAT")
        self.assertIn("not a valid PNG", result.error)
        self.assertIsNotNone(result.original)
        self.assertIsNone(result.cutout)

    @patch("urllib.request.urlopen")
    def test_10_cutout_upload_failure_preserves_original(self, mock_urlopen):
        """10. Test that Cloudinary cutout upload failure preserves original asset."""
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_original_asset,
        )

        self.mock_picsart.remove_background.return_value = ProcessedImageResult(
            success=True,
            provider="picsart",
            operation="remove_background",
            output_url="https://cdn.picsart.io/valid.png",
        )

        mock_urlopen.return_value = self._create_mock_cdn_response(self.PNG_SAMPLE)

        self.mock_cloudinary.upload_cutout_image.return_value = OriginalImageResult(
            success=False,
            stage="cutout_upload",
            error="Cloudinary rate limit reached",
        )

        result = self.bridge.process_original_to_cutout(b"raw-image-bytes")

        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "CUTOUT_UPLOAD_FAILED")
        self.assertIsNotNone(result.original)
        self.assertIsNone(result.cutout)

    @patch("urllib.request.urlopen")
    def test_11_cutout_stored_as_png_and_tagged(self, mock_urlopen):
        """11. Test that cutout upload strictly preserves PNG format and appends 'cutout' tag."""
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_original_asset,
        )

        self.mock_picsart.remove_background.return_value = ProcessedImageResult(
            success=True,
            output_url="https://cdn.picsart.io/valid.png",
        )

        mock_urlopen.return_value = self._create_mock_cdn_response(self.PNG_SAMPLE)

        self.mock_cloudinary.upload_cutout_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_cutout_asset,
        )

        result = self.bridge.process_original_to_cutout(
            image_input=b"raw-bytes",
            tags=["craft_pottery"],
        )

        self.assertTrue(result.success)
        self.mock_cloudinary.upload_cutout_image.assert_called_once()
        _, kwargs = self.mock_cloudinary.upload_cutout_image.call_args
        self.assertIn("cutout", kwargs.get("tags", []))
        self.assertIn("craft_pottery", kwargs.get("tags", []))

    def test_12_empty_input_rejected_gracefully(self):
        """12. Test that empty input data is rejected without invoking network providers."""
        result = self.bridge.process_original_to_cutout(b"")
        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "EMPTY_IMAGE")
        self.mock_cloudinary.upload_original_image.assert_not_called()
        self.mock_picsart.remove_background.assert_not_called()


if __name__ == "__main__":
    unittest.main()
