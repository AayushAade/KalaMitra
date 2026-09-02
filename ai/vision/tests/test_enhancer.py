"""Integration and unit tests for QualityEnhancer orchestrator.

Verifies end-to-end routing across:
1. Gemini Primary Engine + Fidelity Validation PASS -> Cloudinary enhanced
2. Gemini Fidelity FAIL -> Local Fallback Pipeline
3. Gemini Timeout / API Error -> Local Fallback Pipeline
4. Gemini Empty / No Image -> Local Fallback Pipeline
5. Gemini REVIEW -> Configurable Default Local Fallback
6. Original asset immutability & Cloudinary final storage
7. Telemetry reporting without credential leakage
"""

import io
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import MagicMock, patch

from PIL import Image

from ai.vision.enhancer import QualityEnhancer
from ai.vision.providers.picsart_provider import PicsartProvider
from ai.vision.schemas import (
    EnhancedImageResult,
    FidelityMetrics,
    FidelityValidationResult,
    ImageAsset,
    OriginalImageResult,
    ProcessedImageResult,
)


class TestQualityEnhancerPipelineIntegration(unittest.TestCase):
    """Integration test suite for the complete production vision pipeline."""

    PNG_SAMPLE = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x048\x00\x00\x048\x08\x06\x00\x00\x00fakepngdata"

    def setUp(self):
        """Configure mock services for isolated pipeline verification."""
        self.mock_cloudinary = MagicMock()
        self.mock_gemini = MagicMock()
        self.mock_fidelity = MagicMock()
        self.mock_picsart = MagicMock()
        self.mock_rembg = MagicMock()
        self.mock_studio = MagicMock()

        # Create a valid test image
        img = Image.new("RGB", (200, 200), (180, 100, 50))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        self.sample_bytes = buf.getvalue()

        self.mock_original = ImageAsset(
            public_id="artisan-ai/originals/orig_vase_101",
            secure_url="https://res.cloudinary.com/demo/image/upload/v1/artisan-ai/originals/orig_vase_101.jpg",
            width=800,
            height=600,
            format="jpg",
            bytes=150000,
        )

        self.mock_cutout = ImageAsset(
            public_id="artisan-ai/cutouts/vase_cutout_101",
            secure_url="https://res.cloudinary.com/demo/image/upload/v1/artisan-ai/cutouts/vase_cutout_101.png",
            width=800,
            height=600,
            format="png",
            bytes=120000,
        )

        self.mock_enhanced_gemini = ImageAsset(
            public_id="artisan-ai/enhanced/gemini_vase_101",
            secure_url="https://res.cloudinary.com/demo/image/upload/v1/artisan-ai/enhanced/gemini_vase_101.webp",
            width=1080,
            height=1080,
            format="webp",
            bytes=210000,
        )

        self.mock_enhanced_local = ImageAsset(
            public_id="artisan-ai/enhanced/local_vase_101",
            secure_url="https://res.cloudinary.com/demo/image/upload/v1/artisan-ai/enhanced/local_vase_101.webp",
            width=1080,
            height=1080,
            format="webp",
            bytes=190000,
        )

        # Configure default Cloudinary mock responses
        self.mock_cloudinary.upload_original_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_original,
        )
        self.mock_cloudinary.upload_cutout_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_cutout,
        )
        self.mock_cloudinary.upload_enhanced_image.return_value = OriginalImageResult(
            success=True,
            asset=self.mock_enhanced_gemini,
        )

        # Configure Studio Composer mock response for local fallback
        self.mock_studio.compose_studio_image.return_value = EnhancedImageResult(
            success=True,
            provider="local_fallback",
            original=self.mock_original,
            cutout=self.mock_cutout,
            enhanced=self.mock_enhanced_local,
            category="pottery",
            preset="warm_neutral",
            aspect_ratio="square_1x1",
            shadow_enabled=True,
            metadata={"studio_engine": "local_composer"},
        )

        # Configure Rembg fallback
        self.mock_rembg.extract_cutout_bytes.return_value = self.PNG_SAMPLE

        # Initialize Enhancer with mocks
        self.enhancer = QualityEnhancer(
            gemini_provider=self.mock_gemini,
            fidelity_validator=self.mock_fidelity,
            picsart_provider=self.mock_picsart,
            rembg_provider=self.mock_rembg,
            cloudinary_service=self.mock_cloudinary,
            studio_composer=self.mock_studio,
        )

    def test_01_gemini_success_and_fidelity_pass_accepted(self):
        """1. TEST 1: Gemini succeeds + Fidelity PASS -> Gemini result accepted, no fallback."""
        self.mock_gemini.is_available = True
        fake_generated_bytes = b"fake_gemini_generated_png_bytes"
        self.mock_gemini.edit_studio_image.return_value = ProcessedImageResult(
            success=True,
            provider="gemini_nano_banana",
            operation="studio_restyling",
            output_format="PNG",
            metadata={"image_bytes": fake_generated_bytes, "model": "gemini-3.1-flash-image"},
        )

        self.mock_fidelity.validate.return_value = FidelityValidationResult(
            decision="PASS",
            score=0.94,
            category="pottery",
            metrics=FidelityMetrics(
                mask_iou=0.95,
                silhouette_similarity=0.96,
                ssim=0.91,
                color_delta_e=3.4,
                aspect_ratio_delta=0.02,
                area_coverage_ratio=0.99,
            ),
            warnings=[],
            execution_time_ms=15.2,
        )

        result = self.enhancer.process_enhanced_studio_pipeline(
            image_input=self.sample_bytes,
            category="pottery",
            preset="travertine_podium",
        )

        self.assertTrue(result.success)
        self.assertEqual(result.provider, "gemini_nano_banana")
        self.assertFalse(result.metadata["fallback_used"])
        self.assertEqual(result.metadata["fidelity"]["decision"], "PASS")
        self.assertEqual(result.metadata["fidelity"]["score"], 0.94)
        self.mock_gemini.edit_studio_image.assert_called_once()
        self.mock_fidelity.validate.assert_called_once()
        # Ensure local studio composition was NOT invoked
        self.mock_studio.compose_studio_image.assert_not_called()

    def test_02_gemini_fidelity_fail_triggers_local_fallback(self):
        """2. TEST 2: Gemini succeeds but Fidelity FAILS -> Automatically routes to local fallback."""
        self.mock_gemini.is_available = True
        self.mock_gemini.edit_studio_image.return_value = ProcessedImageResult(
            success=True,
            provider="gemini_nano_banana",
            operation="studio_restyling",
            output_format="PNG",
            metadata={"image_bytes": b"fake_corrupted_generated_bytes"},
        )

        self.mock_fidelity.validate.return_value = FidelityValidationResult(
            decision="FAIL",
            score=0.45,
            category="pottery",
            metrics=FidelityMetrics(
                mask_iou=0.52,
                silhouette_similarity=0.55,
                ssim=0.40,
                color_delta_e=28.5,
                aspect_ratio_delta=0.35,
                area_coverage_ratio=0.70,
            ),
            warnings=["Product silhouette severely distorted", "Color shift Delta E exceeds threshold"],
            execution_time_ms=18.0,
        )

        result = self.enhancer.process_enhanced_studio_pipeline(
            image_input=self.sample_bytes,
            category="pottery",
        )

        self.assertTrue(result.success)
        self.assertEqual(result.provider, "local_fallback")
        self.assertTrue(result.metadata["fallback_used"])
        self.assertIn("fidelity_fail", result.metadata["pipeline_telemetry"]["fallback_reason"])
        # Local studio composer was invoked
        self.mock_studio.compose_studio_image.assert_called_once()

    def test_03_gemini_timeout_triggers_local_fallback(self):
        """3. TEST 3: Gemini times out -> Gracefully routes to local fallback."""
        self.mock_gemini.is_available = True
        self.mock_gemini.edit_studio_image.return_value = ProcessedImageResult(
            success=False,
            provider="gemini_nano_banana",
            operation="studio_restyling",
            error="Request timed out after 45 seconds",
            error_code="TIMEOUT_ERROR",
        )

        result = self.enhancer.process_enhanced_studio_pipeline(
            image_input=self.sample_bytes,
            category="pottery",
        )

        self.assertTrue(result.success)
        self.assertEqual(result.provider, "local_fallback")
        self.assertTrue(result.metadata["fallback_used"])
        self.assertIn("TIMEOUT_ERROR", result.metadata["pipeline_telemetry"]["fallback_reason"])
        self.mock_studio.compose_studio_image.assert_called_once()

    def test_04_gemini_api_error_triggers_local_fallback(self):
        """4. TEST 4: Gemini returns 429 or API error -> Gracefully routes to local fallback."""
        self.mock_gemini.is_available = True
        self.mock_gemini.edit_studio_image.return_value = ProcessedImageResult(
            success=False,
            provider="gemini_nano_banana",
            operation="studio_restyling",
            error="429 ResourceExhausted: Quota exceeded",
            error_code="RATE_LIMIT_ERROR",
        )

        result = self.enhancer.process_enhanced_studio_pipeline(
            image_input=self.sample_bytes,
            category="pottery",
        )

        self.assertTrue(result.success)
        self.assertEqual(result.provider, "local_fallback")
        self.assertTrue(result.metadata["fallback_used"])
        self.assertIn("RATE_LIMIT_ERROR", result.metadata["pipeline_telemetry"]["fallback_reason"])

    def test_05_gemini_empty_output_triggers_local_fallback(self):
        """5. TEST 5: Gemini returns text-only or empty output -> Routes to local fallback."""
        self.mock_gemini.is_available = True
        self.mock_gemini.edit_studio_image.return_value = ProcessedImageResult(
            success=False,
            provider="gemini_nano_banana",
            operation="studio_restyling",
            error="No image bytes returned",
            error_code="NO_IMAGE_RETURNED",
        )

        result = self.enhancer.process_enhanced_studio_pipeline(
            image_input=self.sample_bytes,
            category="pottery",
        )

        self.assertTrue(result.success)
        self.assertEqual(result.provider, "local_fallback")
        self.assertTrue(result.metadata["fallback_used"])

    def test_06_gemini_fidelity_review_default_fallback(self):
        """6. TEST 6: Gemini Fidelity REVIEW with default settings -> Routes to local fallback."""
        self.mock_gemini.is_available = True
        self.mock_gemini.edit_studio_image.return_value = ProcessedImageResult(
            success=True,
            provider="gemini_nano_banana",
            operation="studio_restyling",
            output_format="PNG",
            metadata={"image_bytes": b"borderline_generated_bytes"},
        )

        self.mock_fidelity.validate.return_value = FidelityValidationResult(
            decision="REVIEW",
            score=0.72,
            category="pottery",
            metrics=FidelityMetrics(
                mask_iou=0.78,
                silhouette_similarity=0.82,
                ssim=0.68,
                color_delta_e=14.2,
                aspect_ratio_delta=0.08,
                area_coverage_ratio=0.92,
            ),
            warnings=["Color shift Delta E slightly elevated"],
            execution_time_ms=16.0,
        )

        result = self.enhancer.process_enhanced_studio_pipeline(
            image_input=self.sample_bytes,
            category="pottery",
        )

        self.assertTrue(result.success)
        self.assertEqual(result.provider, "local_fallback")
        self.assertTrue(result.metadata["fallback_used"])
        self.assertIn("fidelity_review", result.metadata["pipeline_telemetry"]["fallback_reason"])

    def test_07_original_asset_remains_untouched(self):
        """7. TEST 7: Original asset is ingested to originals/ and preserved in output."""
        self.mock_gemini.is_available = False  # Local pipeline path

        result = self.enhancer.process_enhanced_studio_pipeline(
            image_input=self.sample_bytes,
            category="pottery",
        )

        self.mock_cloudinary.upload_original_image.assert_called_once()
        self.assertIsNotNone(result.original)
        self.assertEqual(result.original.public_id, "artisan-ai/originals/orig_vase_101")
        self.assertEqual(result.original.secure_url, self.mock_original.secure_url)

    def test_08_final_image_stored_in_enhanced_folder(self):
        """8. TEST 8: Successful result references asset in artisan-ai/enhanced/ folder."""
        self.mock_gemini.is_available = True
        self.mock_gemini.edit_studio_image.return_value = ProcessedImageResult(
            success=True,
            provider="gemini_nano_banana",
            operation="studio_restyling",
            output_format="PNG",
            metadata={"image_bytes": b"fake_good_image_bytes"},
        )
        self.mock_fidelity.validate.return_value = FidelityValidationResult(
            decision="PASS",
            score=0.96,
            category="pottery",
            metrics=FidelityMetrics(
                mask_iou=0.98,
                silhouette_similarity=0.98,
                ssim=0.95,
                color_delta_e=1.5,
                aspect_ratio_delta=0.01,
                area_coverage_ratio=1.0,
            ),
            warnings=[],
            execution_time_ms=14.0,
        )

        result = self.enhancer.process_enhanced_studio_pipeline(
            image_input=self.sample_bytes,
            category="pottery",
        )

        self.assertTrue(result.success)
        self.assertIsNotNone(result.enhanced)
        self.assertTrue("enhanced" in result.enhanced.public_id)

    def test_09_response_contains_provider_and_fidelity_telemetry(self):
        """9. TEST 9: Response metadata contains provider and structured fidelity metrics."""
        self.mock_gemini.is_available = True
        self.mock_gemini.edit_studio_image.return_value = ProcessedImageResult(
            success=True,
            provider="gemini_nano_banana",
            operation="studio_restyling",
            output_format="PNG",
            metadata={"image_bytes": b"fake_bytes"},
        )
        self.mock_fidelity.validate.return_value = FidelityValidationResult(
            decision="PASS",
            score=0.92,
            category="pottery",
            metrics=FidelityMetrics(
                mask_iou=0.93,
                silhouette_similarity=0.94,
                ssim=0.88,
                color_delta_e=4.1,
                aspect_ratio_delta=0.03,
                area_coverage_ratio=0.98,
            ),
            warnings=[],
            execution_time_ms=15.0,
        )

        result = self.enhancer.process_enhanced_studio_pipeline(
            image_input=self.sample_bytes,
            category="pottery",
        )

        self.assertIn("provider", result.metadata)
        self.assertIn("fallback_used", result.metadata)
        self.assertIn("fidelity", result.metadata)
        self.assertEqual(result.metadata["fidelity"]["metrics"]["ssim"], 0.88)
        self.assertEqual(result.metadata["fidelity"]["metrics"]["mask_iou"], 0.93)

    def test_10_response_does_not_leak_secrets(self):
        """10. TEST 10: API response metadata and logs do NOT expose raw API keys."""
        self.mock_gemini.is_available = True
        self.mock_gemini.edit_studio_image.return_value = ProcessedImageResult(
            success=True,
            provider="gemini_nano_banana",
            operation="studio_restyling",
            output_format="PNG",
            metadata={"image_bytes": b"fake_bytes"},
        )
        self.mock_fidelity.validate.return_value = FidelityValidationResult(
            decision="PASS",
            score=0.95,
            category="pottery",
            metrics=FidelityMetrics(
                mask_iou=0.95,
                silhouette_similarity=0.95,
                ssim=0.90,
                color_delta_e=2.0,
                aspect_ratio_delta=0.01,
                area_coverage_ratio=1.0,
            ),
            warnings=[],
            execution_time_ms=10.0,
        )

        result = self.enhancer.process_enhanced_studio_pipeline(
            image_input=self.sample_bytes,
            category="pottery",
        )

        meta_str = json.dumps(result.metadata or {})
        self.assertNotIn("AIzaSy", meta_str)
        self.assertNotIn("CLOUDINARY_API_SECRET", meta_str)
        self.assertNotIn("api_secret", meta_str)


if __name__ == "__main__":
    unittest.main()
