"""Integration tests for AI Image Enhancement Provider Fallback & Quota Resilience.

Verifies:
A. Cloud provider succeeds -> Normal success result (provider=VERTEX_AI / PHOTOROOM)
B. Gemini returns 429 RESOURCE_EXHAUSTED -> Fallback succeeds seamlessly (provider=LOCAL_FALLBACK)
C. Cloud provider unavailable / unconfigured -> Local fallback succeeds (provider=LOCAL_FALLBACK)
D. All providers fail -> Clean error response, zero crash
"""

import io
import unittest
from unittest.mock import MagicMock, patch
from PIL import Image

from backend.app.services.image_processing.service import ImageProcessingService
from backend.app.services.image_processing.vertex_provider import VertexAIImageProvider
from backend.app.services.image_processing.local_provider import LocalImageProcessingProvider
from ai.vision.schemas import ProcessedImageResult


class TestImageEnhancementResilience(unittest.TestCase):
    """Test suite ensuring Gemini 429 quota exhaustion gracefully falls back without user disruption."""

    def setUp(self):
        # Create a small valid test image in memory
        img = Image.new("RGB", (200, 200), color=(180, 100, 50))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        self.sample_image_bytes = buf.getvalue()

    def test_case_a_cloud_provider_succeeds(self):
        """Case A: When cloud provider succeeds, normal enhanced result is returned."""
        mock_vertex = MagicMock(spec=VertexAIImageProvider)
        mock_vertex.is_available = True
        mock_vertex.provider_name = "vertex_ai"
        
        # Valid output bytes
        out_img = Image.new("RGB", (200, 200), color=(255, 255, 255))
        out_buf = io.BytesIO()
        out_img.save(out_buf, format="PNG")
        
        mock_vertex.edit_product_image.return_value = ProcessedImageResult(
            success=True,
            provider="vertex_ai",
            operation="studio_editing",
            metadata={"image_bytes": out_buf.getvalue()},
        )

        service = ImageProcessingService(vertex_provider=mock_vertex)
        # Mock fidelity validator to PASS
        service.fidelity = MagicMock()
        service.fidelity.validate.return_value = MagicMock(decision="PASS", model_dump=lambda: {"decision": "PASS"})
        # Mock Cloudinary
        service.cloudinary = MagicMock()
        service.cloudinary.upload_original_image.return_value = MagicMock(success=True, asset=MagicMock(public_id="orig_123", secure_url="https://cdn/orig.jpg"))
        service.cloudinary.upload_enhanced_image.return_value = MagicMock(success=True, asset=MagicMock(public_id="enh_123", secure_url="https://cdn/enh.webp"))

        res = service.enhance_artisan_product_image(
            image_input=self.sample_image_bytes,
            product_category="POTTERY",
            product_name="Terracotta Clay Handi",
        )

        self.assertTrue(res["success"])
        self.assertEqual(res["provider"], "VERTEX_AI")
        self.assertFalse(res["fallbackUsed"])
        self.assertIsNotNone(res["imageUrl"])

    def test_case_b_gemini_returns_429_quota_exceeded_fallback_succeeds(self):
        """Case B: When Gemini returns 429 RESOURCE_EXHAUSTED, local fallback seamlessly succeeds."""
        mock_vertex = MagicMock(spec=VertexAIImageProvider)
        mock_vertex.is_available = True
        mock_vertex.provider_name = "vertex_ai"
        
        # Simulate 429 Quota Exhausted failure
        mock_vertex.edit_product_image.return_value = ProcessedImageResult(
            success=False,
            provider="vertex_ai",
            operation="studio_editing",
            error="429 RESOURCE_EXHAUSTED: generate_content_free_tier_requests limit: 0",
            error_code="QUOTA_EXCEEDED",
        )

        service = ImageProcessingService(vertex_provider=mock_vertex)
        # Mock Cloudinary uploads
        service.cloudinary = MagicMock()
        service.cloudinary.upload_original_image.return_value = MagicMock(success=True, asset=MagicMock(public_id="orig_123", secure_url="https://cdn/orig.jpg"))
        service.cloudinary.upload_enhanced_image.return_value = MagicMock(success=True, asset=MagicMock(public_id="enh_fallback_123", secure_url="https://cdn/enh_fallback.webp"))

        res = service.enhance_artisan_product_image(
            image_input=self.sample_image_bytes,
            product_category="POTTERY",
            product_name="Terracotta Clay Handi",
        )

        self.assertTrue(res["success"], "Artisan must receive a successful response despite Gemini 429")
        self.assertEqual(res["provider"], "LOCAL_FALLBACK")
        self.assertTrue(res["fallbackUsed"])
        self.assertIn("QUOTA_EXCEEDED", res["telemetry"].get("fallback_reason", ""))
        self.assertIsNotNone(res["imageUrl"])

    def test_case_c_cloud_provider_unavailable_local_fallback_succeeds(self):
        """Case C: When cloud provider is unconfigured/unavailable, local fallback executes cleanly."""
        mock_vertex = MagicMock(spec=VertexAIImageProvider)
        mock_vertex.is_available = False

        service = ImageProcessingService(vertex_provider=mock_vertex)
        service.cloudinary = MagicMock()
        service.cloudinary.upload_original_image.return_value = MagicMock(success=True, asset=MagicMock(public_id="orig_123", secure_url="https://cdn/orig.jpg"))
        service.cloudinary.upload_enhanced_image.return_value = MagicMock(success=True, asset=MagicMock(public_id="enh_local_123", secure_url="https://cdn/enh_local.webp"))

        res = service.enhance_artisan_product_image(
            image_input=self.sample_image_bytes,
            product_category="WOODEN_CRAFTS",
            product_name="Carved Wood Toy",
        )

        self.assertTrue(res["success"])
        self.assertEqual(res["provider"], "LOCAL_FALLBACK")
        self.assertTrue(res["fallbackUsed"])
        self.assertIsNotNone(res["imageUrl"])

    def test_case_d_all_providers_unavailable_clean_error(self):
        """Case D: When all providers fail, return a clean structured error without crashing."""
        mock_vertex = MagicMock(spec=VertexAIImageProvider)
        mock_vertex.is_available = True
        mock_vertex.edit_product_image.return_value = ProcessedImageResult(
            success=False,
            provider="vertex_ai",
            operation="studio_editing",
            error="429 Quota Exceeded",
            error_code="QUOTA_EXCEEDED",
        )

        mock_local = MagicMock(spec=LocalImageProcessingProvider)
        mock_local.generate_studio_image.return_value = ProcessedImageResult(
            success=False,
            provider="local_fallback",
            operation="studio_composition",
            error="Disk write failure",
            error_code="DISK_ERROR",
        )

        service = ImageProcessingService(vertex_provider=mock_vertex, local_provider=mock_local)
        service.cloudinary = MagicMock()
        service.cloudinary.upload_original_image.return_value = MagicMock(success=True, asset=MagicMock(public_id="orig_123", secure_url="https://cdn/orig.jpg"))

        res = service.enhance_artisan_product_image(
            image_input=self.sample_image_bytes,
            product_category="POTTERY",
            product_name="Terracotta Handi",
        )

        self.assertFalse(res["success"])
        self.assertEqual(res["error_code"], "ALL_PROVIDERS_FAILED")
        self.assertIn("failed", res["error"].lower())


if __name__ == "__main__":
    unittest.main()
