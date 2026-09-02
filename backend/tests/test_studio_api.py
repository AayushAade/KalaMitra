"""Unit and integration tests for FastAPI backend API endpoints."""

import io
import unittest
from unittest.mock import MagicMock, patch
from PIL import Image
from fastapi.testclient import TestClient

from ai.vision.schemas import EnhancedImageResult, ImageAsset
from backend.app.main import app
from backend.app.services.vision_service import VisionService, get_vision_service


def create_test_image_bytes(format: str = "JPEG", size: tuple = (100, 100)) -> bytes:
    """Helper to generate valid in-memory image bytes for testing."""
    img = Image.new("RGB", size, color=(200, 150, 100))
    buffer = io.BytesIO()
    img.save(buffer, format=format)
    return buffer.getvalue()


class TestHealthEndpoint(unittest.TestCase):
    """Test health check route."""

    def setUp(self):
        self.client = TestClient(app)

    def test_health_check_returns_200(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})


class TestStudioEnhanceAPI(unittest.TestCase):
    """Test POST /api/v1/studio/enhance validation, routing, and response formatting."""

    def setUp(self):
        self.client = TestClient(app)
        self.valid_jpeg_bytes = create_test_image_bytes("JPEG")
        self.valid_png_bytes = create_test_image_bytes("PNG")

    def test_rejects_missing_image_file(self):
        """Endpoint must return 422 if no image file is provided in multipart body."""
        response = self.client.post("/api/v1/studio/enhance", data={"category": "pottery"})
        self.assertEqual(response.status_code, 422)

    def test_rejects_unsupported_content_type(self):
        """Endpoint must return 400 for non-image file uploads."""
        files = {"image": ("document.pdf", b"%PDF-1.4 dummy content", "application/pdf")}
        response = self.client.post("/api/v1/studio/enhance", files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported file type", response.json()["detail"])

    def test_rejects_empty_image_file(self):
        """Endpoint must return 400 when an empty (0 byte) file is uploaded."""
        files = {"image": ("empty.jpg", b"", "image/jpeg")}
        response = self.client.post("/api/v1/studio/enhance", files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("empty", response.json()["detail"].lower())

    def test_rejects_corrupted_image_content(self):
        """Endpoint must return 400 when file content is not a parseable image."""
        files = {"image": ("fake.jpg", b"This is not a real image header", "image/jpeg")}
        response = self.client.post("/api/v1/studio/enhance", files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("not a valid", response.json()["detail"].lower())

    def test_rejects_invalid_upscale_factor(self):
        """Endpoint must return 422 when upscale_factor is not 2 or 4."""
        files = {"image": ("test.jpg", self.valid_jpeg_bytes, "image/jpeg")}
        data = {"upscale_factor": 3}
        response = self.client.post("/api/v1/studio/enhance", files=files, data=data)
        self.assertEqual(response.status_code, 422)
        self.assertIn("upscale_factor", response.json()["detail"].lower())

    @patch("backend.app.services.vision_service.QualityEnhancer")
    def test_successful_enhancement_invocation(self, mock_enhancer_cls):
        """Test successful pipeline invocation and schema mapping with mocked QualityEnhancer."""
        mock_enhancer = MagicMock()
        mock_enhancer.process_enhanced_studio_pipeline.return_value = EnhancedImageResult(
            success=True,
            provider="cloudinary",
            original=ImageAsset(
                public_id="artisan-ai/originals/test_orig",
                secure_url="https://res.cloudinary.com/demo/image/upload/artisan-ai/originals/test_orig.jpg",
                width=100,
                height=100,
                format="jpg",
                bytes=2048,
                created_at="2026-08-29T12:00:00Z",
            ),
            cutout=ImageAsset(
                public_id="artisan-ai/cutouts/test_cutout",
                secure_url="https://res.cloudinary.com/demo/image/upload/artisan-ai/cutouts/test_cutout.png",
                width=100,
                height=100,
                format="png",
                bytes=1500,
                created_at="2026-08-29T12:00:01Z",
            ),
            enhanced=ImageAsset(
                public_id="artisan-ai/enhanced/test_enhanced",
                secure_url="https://res.cloudinary.com/demo/image/upload/artisan-ai/enhanced/test_enhanced.webp",
                width=1080,
                height=1080,
                format="webp",
                bytes=45000,
                created_at="2026-08-29T12:00:02Z",
            ),
            category="pottery",
            preset="warm_neutral",
            aspect_ratio="square_1x1",
            shadow_enabled=True,
            metadata={"execution_time_ms": 1250.5},
        )

        custom_service = VisionService(enhancer=mock_enhancer)
        app.dependency_overrides[get_vision_service] = lambda: custom_service

        try:
            files = {"image": ("pottery.jpg", self.valid_jpeg_bytes, "image/jpeg")}
            data = {
                "category": "pottery",
                "preset": "warm_neutral",
                "aspect_ratio": "square_1x1",
                "add_shadow": "true",
                "quality_mode": "local_ai",
                "upscale_factor": "2",
            }
            response = self.client.post("/api/v1/studio/enhance", files=files, data=data)

            self.assertEqual(response.status_code, 200)
            res_json = response.json()
            self.assertTrue(res_json["success"])
            self.assertEqual(res_json["provider"], "cloudinary")
            self.assertEqual(res_json["category"], "pottery")
            self.assertEqual(res_json["preset"], "warm_neutral")
            self.assertIsNotNone(res_json["original"])
            self.assertIsNotNone(res_json["cutout"])
            self.assertIsNotNone(res_json["enhanced"])
            self.assertEqual(
                res_json["enhanced"]["secure_url"],
                "https://res.cloudinary.com/demo/image/upload/artisan-ai/enhanced/test_enhanced.webp",
            )
            mock_enhancer.process_enhanced_studio_pipeline.assert_called_once()
        finally:
            app.dependency_overrides.clear()

    @patch("backend.app.services.vision_service.QualityEnhancer")
    def test_pipeline_handled_failure_returns_normalized_response(self, mock_enhancer_cls):
        """Test that handled pipeline errors return 200 with success=False and error details."""
        mock_enhancer = MagicMock()
        mock_enhancer.process_enhanced_studio_pipeline.return_value = EnhancedImageResult(
            success=False,
            category="textiles",
            preset="ecommerce_white",
            error="Cloudinary upload capacity exceeded",
            error_code="STORAGE_QUOTA_EXCEEDED",
        )

        custom_service = VisionService(enhancer=mock_enhancer)
        app.dependency_overrides[get_vision_service] = lambda: custom_service

        try:
            files = {"image": ("textile.png", self.valid_png_bytes, "image/png")}
            response = self.client.post(
                "/api/v1/studio/enhance",
                files=files,
                data={"category": "textiles"},
            )
            self.assertEqual(response.status_code, 200)
            res_json = response.json()
            self.assertFalse(res_json["success"])
            self.assertEqual(res_json["error"], "Cloudinary upload capacity exceeded")
            self.assertEqual(res_json["error_code"], "STORAGE_QUOTA_EXCEEDED")
        finally:
            app.dependency_overrides.clear()


if __name__ == "__main__":
    unittest.main()
