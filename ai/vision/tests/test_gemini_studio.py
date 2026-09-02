"""Unit and integration tests for GeminiStudioProvider.

Verifies Gemini/Nano Banana image editing provider behavior, prompt construction,
response parsing, and error boundaries with strictly mocked GenAI API calls.
"""

import base64
import io
import os
from pathlib import Path
import unittest
from unittest.mock import MagicMock

from PIL import Image

from ai.vision.prompts.studio_prompt import (
    CATEGORY_STAGING_DIRECTIVES,
    build_studio_edit_prompt,
)
from ai.vision.providers.gemini_studio import GeminiStudioProvider
from ai.vision.schemas import ProcessedImageResult


class TestGeminiStudioProvider(unittest.TestCase):
    """Unit test suite for GeminiStudioProvider."""

    def setUp(self):
        """Set up test fixtures with in-memory sample images."""
        self.dummy_key = "AIzaSyDummyKeyForTestingOnly1234567890"
        self.provider = GeminiStudioProvider(api_key=self.dummy_key)

        # Create a valid in-memory 100x100 RGB image for testing
        img = Image.new("RGB", (100, 100), color=(200, 150, 100))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        self.sample_image_bytes = buf.getvalue()

        # Create a fake generated PNG image for mock response testing
        gen_img = Image.new("RGBA", (1080, 1080), color=(240, 235, 230, 255))
        gen_buf = io.BytesIO()
        gen_img.save(gen_buf, format="PNG")
        self.fake_generated_png_bytes = gen_buf.getvalue()

    def test_01_provider_initialization_defaults(self):
        """1. Test provider initializes with correct default model and timeout."""
        provider = GeminiStudioProvider(api_key="test_key")
        self.assertEqual(provider.api_key, "test_key")
        self.assertEqual(provider.model_name, "gemini-3.1-flash-image")
        self.assertEqual(provider.timeout_seconds, 45)
        self.assertTrue(provider.is_available)

    def test_02_missing_api_key_handling(self):
        """2. Test provider gracefully handles missing API key."""
        empty_provider = GeminiStudioProvider(api_key="")
        self.assertFalse(empty_provider.is_available)

        res = empty_provider.edit_studio_image(self.sample_image_bytes)
        self.assertFalse(res.success)
        self.assertEqual(res.error_code, "CONFIG_ERROR")
        self.assertIn("GEMINI_API_KEY", res.error)

    def test_03_secret_masking_in_repr(self):
        """3. Test provider string representation masks API secrets."""
        provider = GeminiStudioProvider(api_key="AIzaSySecretApiKey999")
        repr_str = repr(provider)
        self.assertNotIn("SecretApiKey999", repr_str)
        self.assertIn("AIza...", repr_str)

    def test_04_prompt_generation_structure(self):
        """4. Test that master studio prompt contains all core luxury directives."""
        prompt = build_studio_edit_prompt(
            category="pottery",
            preset="warm_neutral",
            aspect_ratio="1:1",
        )
        self.assertIn("premium luxury e-commerce catalogue image", prompt)
        self.assertIn("preserve the exact physical product", prompt)
        self.assertIn("Remove the existing background completely", prompt)
        self.assertIn("Do NOT use a plain white background", prompt)

    def test_05_category_specific_prompt_generation(self):
        """5. Test category-aware prompt returns master luxury prompt."""
        categories = ["pottery", "textiles", "jewellery", "wooden_crafts", "general"]
        for cat in categories:
            prompt = build_studio_edit_prompt(category=cat)
            self.assertIn("premium luxury e-commerce catalogue image", prompt)
            self.assertIn(CATEGORY_STAGING_DIRECTIVES[cat], prompt)


    def test_06_successful_gemini_response_parsing(self):
        """6. Test extracting image bytes from a successful GenAI response."""
        mock_client = MagicMock()
        self.provider._client = mock_client

        # Mock GenAI response with inline image data
        mock_part = MagicMock()
        mock_part.inline_data = MagicMock(data=self.fake_generated_png_bytes)
        mock_candidate = MagicMock()
        mock_candidate.content.parts = [mock_part]
        mock_candidate.finish_reason = "STOP"

        mock_response = MagicMock()
        mock_response.candidates = [mock_candidate]
        mock_client.models.generate_content.return_value = mock_response

        res = self.provider.edit_studio_image(
            image_input=self.sample_image_bytes,
            category="jewellery",
            preset="travertine_podium",
        )

        self.assertTrue(res.success)
        self.assertEqual(res.provider, "gemini_nano_banana")
        self.assertEqual(res.operation, "studio_restyling")
        self.assertEqual(res.output_format, "PNG")
        self.assertEqual(res.metadata["image_bytes"], self.fake_generated_png_bytes)
        self.assertEqual(res.metadata["category"], "jewellery")

    def test_07_text_only_response_handling(self):
        """7. Test that text-only response is rejected with NO_IMAGE_RETURNED."""
        mock_client = MagicMock()
        self.provider._client = mock_client

        # Mock response with text only (no inline image)
        mock_part = MagicMock()
        mock_part.inline_data = None
        mock_part.data = None
        mock_candidate = MagicMock()
        mock_candidate.content.parts = [mock_part]
        mock_candidate.finish_reason = "STOP"

        mock_response = MagicMock()
        mock_response.candidates = [mock_candidate]
        mock_response.output_image = None
        mock_response.text = "Here is a descriptive text of the studio staging."
        mock_client.models.generate_content.return_value = mock_response

        res = self.provider.edit_studio_image(self.sample_image_bytes)

        self.assertFalse(res.success)
        self.assertEqual(res.error_code, "NO_IMAGE_RETURNED")
        self.assertIn("text response", res.error.lower())

    def test_08_empty_response_handling(self):
        """8. Test handling of an empty response."""
        mock_client = MagicMock()
        self.provider._client = mock_client

        mock_response = MagicMock()
        mock_response.candidates = []
        mock_response.output_image = None
        mock_response.text = None
        mock_client.models.generate_content.return_value = mock_response

        res = self.provider.edit_studio_image(self.sample_image_bytes)
        self.assertFalse(res.success)
        self.assertEqual(res.error_code, "NO_IMAGE_RETURNED")

    def test_09_safety_blocked_response_handling(self):
        """9. Test handling of a response blocked by safety filters."""
        mock_client = MagicMock()
        self.provider._client = mock_client

        mock_candidate = MagicMock()
        mock_candidate.finish_reason = "SAFETY"
        mock_response = MagicMock()
        mock_response.candidates = [mock_candidate]
        mock_client.models.generate_content.return_value = mock_response

        res = self.provider.edit_studio_image(self.sample_image_bytes)
        self.assertFalse(res.success)
        self.assertEqual(res.error_code, "BLOCKED_SAFETY")
        self.assertIn("safety", res.error.lower())

    def test_10_rate_limit_and_api_error_handling(self):
        """10. Test rate limit (429) and network exception mapping."""
        mock_client = MagicMock()
        self.provider._client = mock_client

        # Simulate 429 quota exception
        mock_client.models.generate_content.side_effect = Exception("429 ResourceExhausted: Quota exceeded")

        res = self.provider.edit_studio_image(self.sample_image_bytes)
        self.assertFalse(res.success)
        self.assertEqual(res.error_code, "RATE_LIMIT_ERROR")

    def test_11_timeout_error_handling(self):
        """11. Test timeout exception mapping."""
        mock_client = MagicMock()
        self.provider._client = mock_client

        # Simulate timeout exception
        mock_client.models.generate_content.side_effect = Exception("Request timeout while waiting for Gemini")

        res = self.provider.edit_studio_image(self.sample_image_bytes)
        self.assertFalse(res.success)
        self.assertEqual(res.error_code, "TIMEOUT_ERROR")

    def test_12_invalid_image_input_validation(self):
        """12. Test validation of empty and corrupted image payloads."""
        # Empty payload
        res_empty = self.provider.edit_studio_image(b"")
        self.assertFalse(res_empty.success)
        self.assertEqual(res_empty.error_code, "INVALID_IMAGE_INPUT")

        # Corrupted payload
        res_corrupt = self.provider.edit_studio_image(b"not_a_valid_image_bytes_payload")
        self.assertFalse(res_corrupt.success)
        self.assertEqual(res_corrupt.error_code, "INVALID_IMAGE_INPUT")

    def test_13_file_not_found_validation(self):
        """13. Test non-existent file path handling."""
        res = self.provider.edit_studio_image("non_existent_image_path_12345.jpg")
        self.assertFalse(res.success)
        self.assertEqual(res.error_code, "FILE_NOT_FOUND")

    @unittest.skipUnless(os.getenv("LIVE_GEMINI_TEST") == "1", "Live Gemini test is opt-in (set LIVE_GEMINI_TEST=1)")
    def test_14_live_gemini_integration(self):
        """14. Opt-in live test against real Gemini API (requires LIVE_GEMINI_TEST=1)."""
        live_provider = GeminiStudioProvider()
        if not live_provider.is_available:
            self.skipTest("GEMINI_API_KEY not configured in environment for live test.")

        res = live_provider.edit_studio_image(
            image_input=self.sample_image_bytes,
            category="pottery",
            preset="warm_neutral",
        )
        self.assertIsInstance(res, ProcessedImageResult)


if __name__ == "__main__":
    unittest.main()
