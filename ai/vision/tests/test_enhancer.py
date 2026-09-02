"""Unit tests for Phase 3C QualityEnhancer and Picsart quality methods."""

import io
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure repo root is on sys.path
_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from ai.vision.enhancer import QualityEnhancer
from ai.vision.providers.picsart_provider import PicsartProvider
from ai.vision.schemas import EnhancedImageResult, ImageAsset, OriginalImageResult, ProcessedImageResult


class TestPicsartQualityMethods(unittest.TestCase):
    """Unit tests for Picsart quality enhancement provider methods."""

    def setUp(self):
        self.mock_settings = MagicMock()
        self.mock_settings.base_url = "https://api.picsart.io/tools/1.0"
        self.mock_settings.api_key = "mock_key"
        self.mock_settings.timeout_seconds = 10
        self.provider = PicsartProvider(settings=self.mock_settings)

    def _create_mock_response(self, body_dict: dict, status_code: int = 200):
        mock_resp = MagicMock()
        mock_resp.status = status_code
        mock_resp.read.return_value = json.dumps(body_dict).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp
        return mock_resp

    @patch("urllib.request.urlopen")
    def test_upscale_success(self, mock_urlopen):
        """Test upscaling image resolution with 2x multiplier."""
        mock_urlopen.return_value = self._create_mock_response({
            "data": {"id": "upscaled_123", "url": "https://cdn.picsart.io/upscaled.jpg"},
            "status": "success",
        })

        result = self.provider.upscale(b"sample_bytes", upscale_factor=2)
        self.assertTrue(result.success)
        self.assertEqual(result.operation, "upscale")
        self.assertEqual(result.output_url, "https://cdn.picsart.io/upscaled.jpg")
        mock_urlopen.assert_called_once()

    @patch("urllib.request.urlopen")
    def test_ultra_enhance_success(self, mock_urlopen):
        """Test ultra-enhancement (super-resolution + denoising)."""
        mock_urlopen.return_value = self._create_mock_response({
            "data": {"id": "ultra_123", "url": "https://cdn.picsart.io/ultra_enhanced.jpg"},
            "status": "success",
        })

        result = self.provider.ultra_enhance(b"sample_bytes", upscale_factor=2)
        self.assertTrue(result.success)
        self.assertEqual(result.operation, "ultra_enhance")
        self.assertEqual(result.output_url, "https://cdn.picsart.io/ultra_enhanced.jpg")

    @patch("urllib.request.urlopen")
    def test_adjust_success(self, mock_urlopen):
        """Test clarity, contrast, and vibrance adjustment."""
        mock_urlopen.return_value = self._create_mock_response({
            "data": {"id": "adj_123", "url": "https://cdn.picsart.io/adjusted.jpg"},
            "status": "success",
        })

        result = self.provider.adjust(b"sample_bytes", clarity=30, contrast=15, vibrance=20)
        self.assertTrue(result.success)
        self.assertEqual(result.operation, "adjust")
        self.assertEqual(result.output_url, "https://cdn.picsart.io/adjusted.jpg")


class TestQualityEnhancer(unittest.TestCase):
    """Unit tests for QualityEnhancer orchestration layer."""

    PNG_SAMPLE = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x048\x00\x00\x048\x08\x06\x00\x00\x00fakepngdata"

    def setUp(self):
        self.mock_picsart = MagicMock()
        self.mock_cloudinary = MagicMock()
        self.mock_studio = MagicMock()
        self.enhancer = QualityEnhancer(
            picsart_provider=self.mock_picsart,
            cloudinary_service=self.mock_cloudinary,
            studio_composer=self.mock_studio,
        )

        from ai.vision.schemas import QualityAnalysisResult
        self.mock_cloudinary.analyze_image_quality.return_value = QualityAnalysisResult(
            quality_tier="medium",
            width=800,
            height=600,
            megapixels=0.48,
            bytes=150000,
            format="jpg",
            recommended_transformations=[{"effect": "enhance"}],
            quality_score=0.65,
        )
        self.mock_cloudinary.get_quality_enhanced_url.return_value = "https://res.cloudinary.com/demo/image/upload/e_enhance/sample.jpg"

        self.mock_original = ImageAsset(
            public_id="artisan-ai/originals/raw_vase_1",
            secure_url="https://res.cloudinary.com/demo/image/upload/v1/artisan-ai/originals/raw_vase_1.jpg",
            width=800,
            height=600,
            format="jpg",
            bytes=150000,
        )

        self.mock_cutout = ImageAsset(
            public_id="artisan-ai/cutouts/vase_cutout_1",
            secure_url="https://res.cloudinary.com/demo/image/upload/v1/artisan-ai/cutouts/vase_cutout_1.png",
            width=1600,
            height=1200,
            format="png",
            bytes=320000,
        )

        self.mock_enhanced = ImageAsset(
            public_id="artisan-ai/enhanced/vase_final_1",
            secure_url="https://res.cloudinary.com/demo/image/upload/v1/artisan-ai/enhanced/vase_final_1.webp",
            width=1080,
            height=1080,
            format="webp",
            bytes=180000,
        )

    def _create_mock_cdn_response(self, content_bytes: bytes, status: int = 200):
        mock_resp = MagicMock()
        mock_resp.status = status
        mock_resp.read.return_value = content_bytes
        mock_resp.__enter__.return_value = mock_resp
        return mock_resp

    def test_enhance_mode_ultra(self):
        """Test quality enhancement dispatch in ultra mode."""
        self.mock_picsart.ultra_enhance.return_value = ProcessedImageResult(
            success=True,
            output_url="https://cdn.picsart.io/enhanced.jpg",
        )
        result = self.enhancer.enhance_image(b"bytes", mode="ultra")
        self.assertTrue(result.success)
        self.mock_picsart.ultra_enhance.assert_called_once()

    def test_enhance_mode_invalid(self):
        """Test rejection of unsupported enhancement mode."""
        result = self.enhancer.enhance_image(b"bytes", mode="hallucinate_ai")
        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "INVALID_ENHANCEMENT_MODE")

    @patch("urllib.request.urlopen")
    def test_end_to_end_enhanced_pipeline_success(self, mock_urlopen):
        """Test full pipeline: Ingest Original -> Ultra Enhance -> Cutout -> Studio Framing."""
        # 1. Cloudinary upload original
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_original,
        )

        # 2. Picsart ultra enhance
        self.mock_picsart.ultra_enhance.return_value = ProcessedImageResult(
            success=True,
            output_url="https://cdn.picsart.io/super_res.jpg",
        )

        # 3. Picsart remove background
        self.mock_picsart.remove_background.return_value = ProcessedImageResult(
            success=True,
            output_url="https://cdn.picsart.io/cutout.png",
        )

        # Mock CDN downloads for (1) Picsart ultra enhanced JPG, (2) Cutout PNG
        mock_urlopen.side_effect = [
            self._create_mock_cdn_response(b"ultra_enhanced_jpeg_bytes"),
            self._create_mock_cdn_response(self.PNG_SAMPLE),
        ]

        # 4. Cloudinary upload cutout
        self.mock_cloudinary.upload_cutout_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_cutout,
        )

        # 5. Studio compose
        self.mock_studio.compose_studio_image.return_value = EnhancedImageResult(
            success=True,
            original=self.mock_original,
            cutout=self.mock_cutout,
            enhanced=self.mock_enhanced,
            category="pottery",
            preset="warm_neutral",
            aspect_ratio="square_1x1",
            shadow_enabled=True,
        )

        result = self.enhancer.process_enhanced_studio_pipeline(
            image_input=b"raw_low_res_bytes",
            category="pottery",
            preset="warm_neutral",
            quality_mode="ultra",
        )

        self.assertTrue(result.success)
        self.assertIsNotNone(result.original)
        self.assertIsNotNone(result.cutout)
        self.assertIsNotNone(result.enhanced)
        self.mock_picsart.ultra_enhance.assert_called_once()
        self.mock_picsart.remove_background.assert_called_once()
        self.mock_studio.compose_studio_image.assert_called_once()

    @patch("urllib.request.urlopen")
    def test_pipeline_fallback_when_enhancement_fails(self, mock_urlopen):
        """Test that if ultra-enhancement fails, pipeline safely falls back to raw bytes for cutout."""
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_original,
        )

        # Quality enhancement returns rate limit error
        self.mock_picsart.ultra_enhance.return_value = ProcessedImageResult(
            success=False,
            error="Rate limit on upscale",
            error_code="RATE_LIMITED",
        )

        # Background removal succeeds on raw bytes
        self.mock_picsart.remove_background.return_value = ProcessedImageResult(
            success=True,
            output_url="https://cdn.picsart.io/cutout.png",
        )

        mock_urlopen.return_value = self._create_mock_cdn_response(self.PNG_SAMPLE)

        self.mock_cloudinary.upload_cutout_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_cutout,
        )

        self.mock_studio.compose_studio_image.return_value = EnhancedImageResult(
            success=True,
            original=self.mock_original,
            cutout=self.mock_cutout,
            enhanced=self.mock_enhanced,
            category="pottery",
        )

        result = self.enhancer.process_enhanced_studio_pipeline(
            image_input=b"raw_bytes",
            category="pottery",
            quality_mode="ultra",
        )

        # Pipeline still succeeds via graceful fallback
        self.assertTrue(result.success)
        self.mock_picsart.remove_background.assert_called_once_with(
            image_input=b"raw_bytes",
            output_format="PNG",
        )


if __name__ == "__main__":
    unittest.main()
