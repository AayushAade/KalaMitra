"""Unit tests for Cloudinary AI Quality Analysis and Tiered Enhancement."""

from pathlib import Path
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure repo root is on sys.path
_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from ai.vision.cloudinary_service import CloudinaryService
from ai.vision.enhancer import QualityEnhancer
from ai.vision.schemas import EnhancedImageResult, ImageAsset, OriginalImageResult, ProcessedImageResult


class TestCloudinaryQuality(unittest.TestCase):
    """Unit tests for Cloudinary quality analysis heuristics and transformation layers."""

    def setUp(self):
        self.service = CloudinaryService()

    def test_1_quality_analysis_high_tier(self):
        """1. High resolution asset (1920x1080, 500KB) classifies as 'high' tier."""
        with patch.object(self.service, "get_asset_metadata") as mock_meta:
            mock_meta.return_value = ImageAsset(
                public_id="artisan-ai/originals/dslr_pottery_1",
                secure_url="https://res.cloudinary.com/demo/image/upload/sample.jpg",
                width=1920,
                height=1080,
                format="jpg",
                bytes=520000,
            )
            analysis = self.service.analyze_image_quality("artisan-ai/originals/dslr_pottery_1")
            self.assertEqual(analysis.quality_tier, "high")
            self.assertGreaterEqual(analysis.quality_score, 0.8)
            effects = [l.get("effect") for l in analysis.recommended_transformations if "effect" in l]
            self.assertIn("improve", effects)

    def test_2_quality_analysis_medium_tier(self):
        """2. Medium resolution asset (800x600, 120KB) classifies as 'medium' tier."""
        with patch.object(self.service, "get_asset_metadata") as mock_meta:
            mock_meta.return_value = ImageAsset(
                public_id="artisan-ai/originals/phone_pottery_1",
                secure_url="https://res.cloudinary.com/demo/image/upload/sample.jpg",
                width=800,
                height=600,
                format="jpg",
                bytes=120000,
            )
            analysis = self.service.analyze_image_quality("artisan-ai/originals/phone_pottery_1")
            self.assertEqual(analysis.quality_tier, "medium")
            effects = [l.get("effect") for l in analysis.recommended_transformations if "effect" in l]
            self.assertIn("enhance", effects)

    def test_3_quality_analysis_poor_tier(self):
        """3. Low resolution asset (320x240, 25KB) classifies as 'poor' tier."""
        with patch.object(self.service, "get_asset_metadata") as mock_meta:
            mock_meta.return_value = ImageAsset(
                public_id="artisan-ai/originals/lowres_pottery_1",
                secure_url="https://res.cloudinary.com/demo/image/upload/sample.jpg",
                width=320,
                height=240,
                format="jpg",
                bytes=25000,
            )
            analysis = self.service.analyze_image_quality("artisan-ai/originals/lowres_pottery_1")
            self.assertEqual(analysis.quality_tier, "poor")
            effects = [l.get("effect") for l in analysis.recommended_transformations if "effect" in l]
            self.assertIn("gen_restore", effects)

    def test_4_build_quality_transformations_rules(self):
        """4. Verify deterministic transformation rules for all tiers."""
        high_t = self.service.build_quality_transformations("high")
        med_t = self.service.build_quality_transformations("medium")
        poor_t = self.service.build_quality_transformations("poor")

        self.assertTrue(any(t.get("effect") == "improve" for t in high_t))
        self.assertTrue(any(t.get("effect") == "enhance" for t in med_t))
        self.assertTrue(any(t.get("effect") == "gen_restore" for t in poor_t))

    def test_5_get_quality_enhanced_url(self):
        """5. Verify quality enhanced URL contains expected transformation keys."""
        url = self.service.get_quality_enhanced_url(
            public_id="artisan-ai/originals/test_asset",
            quality_tier="medium",
        )
        self.assertIn("e_enhance", url)
        self.assertIn("e_improve:indoor", url)


class TestQualityEnhancerCloudinaryIntegration(unittest.TestCase):
    """Unit tests for QualityEnhancer with Cloudinary Quality Analysis."""

    PNG_HEADER = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"

    def setUp(self):
        self.mock_picsart = MagicMock()
        self.mock_cloudinary = MagicMock()
        self.mock_studio = MagicMock()
        self.enhancer = QualityEnhancer(
            picsart_provider=self.mock_picsart,
            cloudinary_service=self.mock_cloudinary,
            studio_composer=self.mock_studio,
        )

        self.mock_original = ImageAsset(
            public_id="artisan-ai/originals/craft_1",
            secure_url="https://res.cloudinary.com/demo/image/upload/craft_1.jpg",
            width=800,
            height=600,
            format="jpg",
            bytes=100000,
        )

        self.mock_cutout = ImageAsset(
            public_id="artisan-ai/cutouts/craft_1",
            secure_url="https://res.cloudinary.com/demo/image/upload/craft_1.png",
            width=800,
            height=600,
            format="png",
            bytes=180000,
        )

        self.mock_enhanced = ImageAsset(
            public_id="artisan-ai/enhanced/craft_1",
            secure_url="https://res.cloudinary.com/demo/image/upload/craft_1.webp",
            width=1080,
            height=1080,
            format="webp",
            bytes=95000,
        )

    def _create_mock_stream(self, data: bytes, status: int = 200):
        mock_resp = MagicMock()
        mock_resp.status = status
        mock_resp.read.return_value = data
        mock_resp.__enter__.return_value = mock_resp
        return mock_resp

    @patch("urllib.request.urlopen")
    def test_pipeline_with_cloudinary_quality_enhancement(self, mock_urlopen):
        """Test full pipeline: Cloudinary Original -> Cloudinary AI Enhance -> Picsart Cutout -> Studio."""
        from ai.vision.schemas import QualityAnalysisResult

        # Mock original upload
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_original,
        )

        # Mock quality analysis
        self.mock_cloudinary.analyze_image_quality.return_value = QualityAnalysisResult(
            quality_tier="medium",
            width=800,
            height=600,
            megapixels=0.48,
            bytes=100000,
            format="jpg",
            recommended_transformations=[{"effect": "enhance"}],
            quality_score=0.65,
        )

        self.mock_cloudinary.get_quality_enhanced_url.return_value = "https://res.cloudinary.com/demo/image/upload/e_enhance/craft_1.jpg"

        # Mock Picsart adjust
        self.mock_picsart.adjust.return_value = ProcessedImageResult(
            success=True,
            output_url="https://cdn.picsart.io/adj.jpg",
        )

        # Mock Picsart removebg
        self.mock_picsart.remove_background.return_value = ProcessedImageResult(
            success=True,
            output_url="https://cdn.picsart.io/cutout.png",
        )

        # Mock CDN downloads for (1) Cloudinary enhanced URL, (2) Cutout PNG
        mock_urlopen.side_effect = [
            self._create_mock_stream(b"cloud_enhanced_bytes"),
            self._create_mock_stream(self.PNG_HEADER + b"fakepngbytes"),
        ]

        # Mock cutout upload
        self.mock_cloudinary.upload_cutout_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_cutout,
        )

        # Mock studio composer
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
            image_input=b"raw_bytes",
            category="pottery",
            preset="warm_neutral",
        )

        self.assertTrue(result.success)
        self.mock_cloudinary.analyze_image_quality.assert_called_once()
        self.mock_cloudinary.get_quality_enhanced_url.assert_called_once()
        self.mock_picsart.remove_background.assert_called_once()
        self.mock_studio.compose_studio_image.assert_called_once()


if __name__ == "__main__":
    unittest.main()
