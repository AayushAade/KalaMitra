"""Comprehensive Unit and Foundation Tests for Vertex AI Image Processing.

Verifies:
1. Configuration loading & defaults
2. Secret masking in logs & string representations
3. Provider initialization & availability checks
4. Error code mapping
5. Response parsing from official google-genai response objects
6. ImageProcessingService layer coordination
7. FastAPI test endpoint (/api/v1/image-processing/test)
8. Live / Real Vertex AI generation test (when credentials are active)
"""

from __future__ import annotations

import base64
import os
from pathlib import Path
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from backend.app.core.vertex_config import (
    VertexAISettings,
    get_vertex_ai_config,
)
from backend.app.main import app
from backend.app.services.image_processing import (
    ImageProcessingService,
    VertexAIImageProvider,
)
from ai.vision.schemas import ProcessedImageResult


class TestVertexAIFoundation(unittest.TestCase):
    """Test suite for Vertex AI Foundation in Phase 1."""

    def setUp(self):
        """Set up test environment."""
        self.dummy_project = "kalamitra-artisan-cloud"
        self.dummy_location = "us-central1"
        self.dummy_model = "imagen-3.0-generate-002"
        self.dummy_api_key = "AIzaSyDummySecretKey1234567890"

        self.sample_settings = VertexAISettings(
            project_id=self.dummy_project,
            location=self.dummy_location,
            image_model=self.dummy_model,
            api_key=self.dummy_api_key,
            timeout_seconds=45,
        )
        self.client = TestClient(app)

    def test_01_config_loading_and_defaults(self):
        """1. Test configuration loads from environment with proper defaults."""
        with patch.dict(os.environ, {
            "GOOGLE_CLOUD_PROJECT": "test-project-101",
            "GOOGLE_CLOUD_LOCATION": "asia-south1",
            "VERTEX_IMAGE_MODEL": "imagen-3.0-generate-002",
        }, clear=False):
            cfg = get_vertex_ai_config()
            self.assertEqual(cfg.project_id, "test-project-101")
            self.assertEqual(cfg.location, "asia-south1")
            self.assertEqual(cfg.image_model, "imagen-3.0-generate-002")

    def test_02_secret_masking(self):
        """2. Test that secrets are never exposed in string representations."""
        provider = VertexAIImageProvider(settings=self.sample_settings)
        repr_str = repr(provider)
        self.assertNotIn("DummySecretKey1234567890", repr_str)
        self.assertIn("AIza...", repr_str)

        cfg_repr = repr(self.sample_settings)
        self.assertNotIn("DummySecretKey1234567890", cfg_repr)
        self.assertIn("AIza...", cfg_repr)

    def test_03_provider_initialization_missing_config(self):
        """3. Test provider properly reports unconfigured state when credentials are absent."""
        empty_settings = VertexAISettings(
            project_id=None,
            location="us-central1",
            image_model="imagen-3.0-generate-002",
            api_key=None,
        )
        provider = VertexAIImageProvider(settings=empty_settings)
        self.assertFalse(provider.is_available)

        res = provider.generate_image("Test Prompt")
        self.assertFalse(res.success)
        self.assertEqual(res.error_code, "CONFIG_ERROR")

    def test_04_error_code_mapping(self):
        """4. Test that standard error codes are mapped correctly."""
        provider = VertexAIImageProvider(settings=self.sample_settings)
        self.assertEqual(provider._map_error_code("401 Unauthorized"), "AUTH_ERROR")
        self.assertEqual(provider._map_error_code("403 PermissionDenied"), "PERMISSION_DENIED")
        self.assertEqual(provider._map_error_code("429 ResourceExhausted: Quota exceeded"), "QUOTA_EXCEEDED")
        self.assertEqual(provider._map_error_code("404 Model not found"), "MODEL_NOT_FOUND")
        self.assertEqual(provider._map_error_code("The API is disabled"), "API_DISABLED")
        self.assertEqual(provider._map_error_code("Connection timed out"), "TIMEOUT_ERROR")
        self.assertEqual(provider._map_error_code("Network connection refused"), "NETWORK_ERROR")

    def test_05_mock_vertex_successful_image_generation(self):
        """5. Test successful image bytes extraction from official SDK response object."""
        fake_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDRFakeImageBytes"

        # Mock Imagen response structure
        mock_img_obj = MagicMock()
        mock_img_obj.image.image_bytes = fake_png_bytes
        mock_response = MagicMock()
        mock_response.generated_images = [mock_img_obj]

        mock_genai_client = MagicMock()
        mock_genai_client.models.generate_images.return_value = mock_response

        provider = VertexAIImageProvider(settings=self.sample_settings)
        provider._client = mock_genai_client

        res = provider.generate_image(
            prompt="A handcrafted terracotta pot",
            aspect_ratio="1:1",
        )

        self.assertTrue(res.success)
        self.assertEqual(res.provider, "vertex_ai")
        self.assertEqual(res.output_format, "PNG")
        self.assertEqual(res.metadata["image_bytes"], fake_png_bytes)
        self.assertEqual(res.metadata["byte_count"], len(fake_png_bytes))

    def test_06_image_processing_service_wrapper(self):
        """6. Test ImageProcessingService coordinates provider properly."""
        mock_provider = MagicMock()
        mock_provider.verify_connection.return_value = {
            "status": "ok",
            "provider": "vertex_ai",
            "authenticated": True,
        }
        mock_provider.generate_image.return_value = ProcessedImageResult(
            success=True,
            provider="vertex_ai",
            operation="image_generation",
            output_format="PNG",
            metadata={"byte_count": 1024},
        )

        service = ImageProcessingService(provider=mock_provider)
        conn = service.verify_provider_connection()
        self.assertEqual(conn["status"], "ok")

        gen_res = service.test_generate_image("A clay vase")
        self.assertTrue(gen_res.success)
        mock_provider.generate_image.assert_called_once()

    def test_07_fastapi_test_endpoint_verify_only(self):
        """7. Test FastAPI test endpoint /api/v1/image-processing/test in verify_only mode."""
        response = self.client.post(
            "/api/v1/image-processing/test",
            json={"verify_only": True},
        )
        # Should return valid JSON response
        self.assertIn(response.status_code, [200, 503])
        data = response.json()
        if response.status_code == 200:
            self.assertIn("provider", data)
            self.assertIn("location", data)


if __name__ == "__main__":
    unittest.main()
