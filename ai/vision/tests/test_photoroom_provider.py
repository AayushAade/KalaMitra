"""Unit tests for PhotoroomProvider.

Verifies Photoroom image editing provider initialization, multipart payload generation,
prompt construction, response parsing, and error mapping with mocked HTTP calls.
"""

import io
import os
from pathlib import Path
import unittest
from unittest.mock import MagicMock, patch
import urllib.error

from PIL import Image

from ai.vision.providers.photoroom_provider import (
    PHOTOROOM_STUDIO_PRESETS,
    PhotoroomProvider,
    build_photoroom_prompt,
)
from ai.vision.schemas import ProcessedImageResult


class TestPhotoroomProvider(unittest.TestCase):
    """Unit test suite for PhotoroomProvider."""

    def setUp(self):
        """Set up test fixtures with in-memory sample images."""
        self.dummy_key = "pr_live_test_api_key_12345678"
        self.provider = PhotoroomProvider(api_key=self.dummy_key)

        # Create a valid in-memory 100x100 RGB image
        img = Image.new("RGB", (100, 100), color=(220, 180, 140))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        self.sample_image_bytes = buf.getvalue()

        # Create fake output PNG
        out_img = Image.new("RGBA", (1080, 1080), color=(250, 245, 240, 255))
        out_buf = io.BytesIO()
        out_img.save(out_buf, format="PNG")
        self.fake_output_bytes = out_buf.getvalue()

    def test_01_provider_initialization_defaults(self):
        """1. Test provider initializes with expected defaults."""
        provider = PhotoroomProvider(api_key="test_pr_key")
        self.assertEqual(provider.api_key, "test_pr_key")
        self.assertEqual(provider.base_url, "https://image-api.photoroom.com")
        self.assertEqual(provider.studio_model_version, "background-studio-beta-2025-03-17")
        self.assertEqual(provider.shadow_mode, "ai.auto-with-overrides")
        self.assertEqual(provider.timeout_seconds, 45)
        self.assertTrue(provider.is_available)

    def test_02_missing_api_key_handling(self):
        """2. Test provider gracefully handles missing API key."""
        empty_provider = PhotoroomProvider(api_key="")
        self.assertFalse(empty_provider.is_available)

        res = empty_provider.edit_studio_image(self.sample_image_bytes)
        self.assertFalse(res.success)
        self.assertEqual(res.error_code, "CONFIG_ERROR")
        self.assertIn("PHOTOROOM_API_KEY", res.error)

    def test_03_secret_masking_in_repr(self):
        """3. Test provider masks secrets in string representation."""
        provider = PhotoroomProvider(api_key="pr_live_secret_key_9999")
        repr_str = repr(provider)
        self.assertNotIn("secret_key_9999", repr_str)
        self.assertIn("pr_l...", repr_str)

    def test_04_prompt_generation_categories(self):
        """4. Test that category studio prompts are generated properly."""
        categories = ["pottery", "textiles", "jewellery", "wooden_crafts", "general"]
        for cat in categories:
            prompt = build_photoroom_prompt(category=cat, preset="warm_neutral")
            self.assertTrue(len(prompt) > 20)
            self.assertEqual(prompt, PHOTOROOM_STUDIO_PRESETS[cat]["warm_neutral"])

    @patch("urllib.request.urlopen")
    def test_05_successful_studio_edit(self, mock_urlopen):
        """5. Test successful image edit via Photoroom API."""
        mock_response = MagicMock()
        mock_response.read.return_value = self.fake_output_bytes
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response

        res = self.provider.edit_studio_image(
            image_input=self.sample_image_bytes,
            category="pottery",
            preset="warm_neutral",
            aspect_ratio="1:1",
            add_shadow=True,
        )

        self.assertTrue(res.success)
        self.assertEqual(res.provider, "photoroom")
        self.assertEqual(res.operation, "studio_restyling")
        self.assertEqual(res.output_format, "PNG")
        self.assertEqual(res.metadata["image_bytes"], self.fake_output_bytes)
        self.assertEqual(res.metadata["category"], "pottery")

    @patch("urllib.request.urlopen")
    def test_06_auth_error_handling(self, mock_urlopen):
        """6. Test HTTP 401/403 authorization error mapping."""
        mock_urlopen.side_effect = urllib.error.HTTPError(
            url="https://image-api.photoroom.com/v2/edit",
            code=401,
            msg="Unauthorized",
            hdrs={},
            fp=io.BytesIO(b'{"error": "Invalid API key"}'),
        )

        res = self.provider.edit_studio_image(self.sample_image_bytes)
        self.assertFalse(res.success)
        self.assertEqual(res.error_code, "AUTH_ERROR")

    @patch("urllib.request.urlopen")
    def test_07_rate_limit_error_handling(self, mock_urlopen):
        """7. Test HTTP 429 rate limit error mapping."""
        mock_urlopen.side_effect = urllib.error.HTTPError(
            url="https://image-api.photoroom.com/v2/edit",
            code=429,
            msg="Too Many Requests",
            hdrs={},
            fp=io.BytesIO(b'{"error": "Quota exceeded"}'),
        )

        res = self.provider.edit_studio_image(self.sample_image_bytes)
        self.assertFalse(res.success)
        self.assertEqual(res.error_code, "RATE_LIMIT_ERROR")

    @patch("urllib.request.urlopen")
    def test_08_timeout_error_handling(self, mock_urlopen):
        """8. Test network timeout mapping."""
        mock_urlopen.side_effect = urllib.error.URLError("timed out")

        res = self.provider.edit_studio_image(self.sample_image_bytes)
        self.assertFalse(res.success)
        self.assertEqual(res.error_code, "TIMEOUT_ERROR")

    @patch("urllib.request.urlopen")
    def test_09_background_removal(self, mock_urlopen):
        """9. Test transparent background cutout removal."""
        mock_response = MagicMock()
        mock_response.read.return_value = self.fake_output_bytes
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response

        res = self.provider.remove_background(self.sample_image_bytes)
        self.assertTrue(res.success)
        self.assertEqual(res.provider, "photoroom")
        self.assertEqual(res.operation, "background_removal")


if __name__ == "__main__":
    unittest.main()
