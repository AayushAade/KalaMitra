"""Unit tests for PicsartProvider background removal and error handling."""

import io
import json
import os
from pathlib import Path
import socket
import sys
import unittest
from unittest.mock import MagicMock, patch
import urllib.error

# Ensure repo root is on sys.path
_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from ai.vision.config import PicsartSettings, get_picsart_config
from ai.vision.schemas import ProcessedImageResult
from ai.vision.providers.picsart_provider import PicsartProvider


class TestPicsartConfig(unittest.TestCase):
    """Unit tests for Picsart configuration and key masking."""

    def test_missing_api_key_raises_error(self):
        """Ensure missing PICSART_API_KEY triggers a descriptive ValueError."""
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError) as ctx:
                get_picsart_config()
            self.assertIn("PICSART_API_KEY", str(ctx.exception))

    def test_valid_api_key_loaded(self):
        """Ensure valid API key creates a PicsartSettings instance."""
        with patch.dict(os.environ, {"PICSART_API_KEY": "fake_test_key_12345"}, clear=True):
            settings = get_picsart_config()
            self.assertEqual(settings.api_key, "fake_test_key_12345")
            self.assertEqual(settings.base_url, "https://api.picsart.io/tools/1.0")
            self.assertEqual(settings.timeout_seconds, 30)

    def test_api_key_masked_in_repr(self):
        """Ensure API key is masked in string representations/logs."""
        settings = PicsartSettings(api_key="super_confidential_picsart_token")
        repr_str = repr(settings)
        self.assertNotIn("super_confidential_picsart_token", repr_str)
        self.assertIn("supe...", repr_str)


class TestPicsartProvider(unittest.TestCase):
    """Unit tests for PicsartProvider HTTP communication and edge cases with mocks."""

    def setUp(self):
        self.mock_settings = PicsartSettings(
            api_key="mock_picsart_key",
            base_url="https://api.picsart.io/tools/1.0",
            timeout_seconds=5,
        )
        self.provider = PicsartProvider(settings=self.mock_settings)

    def _create_mock_response(self, body_dict: dict, status_code: int = 200):
        """Helper to create a mocked urllib HTTP response."""
        mock_resp = MagicMock()
        mock_resp.status = status_code
        mock_resp.read.return_value = json.dumps(body_dict).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp
        return mock_resp

    @patch("urllib.request.urlopen")
    def test_1_successful_background_removal_stream(self, mock_urlopen):
        """1. Test successful background removal using a file stream."""
        mock_urlopen.return_value = self._create_mock_response({
            "data": {
                "id": "asset_cutout_pottery_99",
                "url": "https://cdn.picsart.io/cutouts/pottery_99.png",
                "status": "success",
            },
            "status": "success",
        })

        stream = io.BytesIO(b"fake-binary-image-data")
        result = self.provider.remove_background(stream)

        self.assertTrue(result.success)
        self.assertEqual(result.provider, "picsart")
        self.assertEqual(result.operation, "remove_background")
        self.assertEqual(result.output_url, "https://cdn.picsart.io/cutouts/pottery_99.png")
        self.assertEqual(result.output_format, "PNG")
        self.assertIsNone(result.error)
        self.assertEqual(result.metadata.get("asset_id"), "asset_cutout_pottery_99")

        mock_urlopen.assert_called_once()
        req_arg = mock_urlopen.call_args[0][0]
        self.assertEqual(req_arg.headers.get("X-picsart-api-key"), "mock_picsart_key")

    def test_2_missing_api_key(self):
        """2. Test provider gracefully handles missing API key configuration."""
        unconfigured_provider = PicsartProvider(settings=None)
        with patch.dict(os.environ, {}, clear=True):
            result = unconfigured_provider.remove_background(b"fake_image_bytes")
            self.assertFalse(result.success)
            self.assertEqual(result.error_code, "MISSING_API_KEY")
            self.assertIn("PICSART_API_KEY", result.error)

    def test_3_invalid_empty_image(self):
        """3 & 4. Test validation when empty image bytes/streams are passed."""
        result_empty_bytes = self.provider.remove_background(b"")
        self.assertFalse(result_empty_bytes.success)
        self.assertEqual(result_empty_bytes.error_code, "EMPTY_IMAGE")

        empty_stream = io.BytesIO(b"")
        result_empty_stream = self.provider.remove_background(empty_stream)
        self.assertFalse(result_empty_stream.success)
        self.assertEqual(result_empty_stream.error_code, "EMPTY_IMAGE")

    @patch("urllib.request.urlopen")
    def test_5_http_400_bad_request(self, mock_urlopen):
        """5. Test Picsart HTTP 400 rejection (e.g. invalid format or dimensions)."""
        error_body = json.dumps({"message": "Image dimensions exceed max limit"}).encode("utf-8")
        mock_urlopen.side_effect = urllib.error.HTTPError(
            url="https://api.picsart.io/tools/1.0/removebg",
            code=400,
            msg="Bad Request",
            hdrs={},
            fp=io.BytesIO(error_body),
        )

        result = self.provider.remove_background(b"invalid_dim_image")
        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "BAD_REQUEST")
        self.assertIn("Image dimensions exceed max limit", result.error)

    @patch("urllib.request.urlopen")
    def test_6_http_401_unauthorized(self, mock_urlopen):
        """6. Test Picsart HTTP 401 authentication failure."""
        error_body = json.dumps({"message": "Invalid API Key"}).encode("utf-8")
        mock_urlopen.side_effect = urllib.error.HTTPError(
            url="https://api.picsart.io/tools/1.0/removebg",
            code=401,
            msg="Unauthorized",
            hdrs={},
            fp=io.BytesIO(error_body),
        )

        result = self.provider.remove_background(b"sample_bytes")
        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "UNAUTHORIZED")
        self.assertIn("authentication failed", result.error)

    @patch("urllib.request.urlopen")
    def test_7_http_429_rate_limit(self, mock_urlopen):
        """7. Test Picsart HTTP 429 rate limit / quota exceeded."""
        error_body = json.dumps({"message": "Rate limit exceeded"}).encode("utf-8")
        mock_urlopen.side_effect = urllib.error.HTTPError(
            url="https://api.picsart.io/tools/1.0/removebg",
            code=429,
            msg="Too Many Requests",
            hdrs={},
            fp=io.BytesIO(error_body),
        )

        result = self.provider.remove_background(b"sample_bytes")
        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "RATE_LIMITED")
        self.assertIn("rate limit or credit quota exceeded", result.error)

    @patch("urllib.request.urlopen")
    def test_8_http_500_server_error(self, mock_urlopen):
        """8. Test Picsart HTTP 500 internal server error."""
        error_body = json.dumps({"message": "Internal processing failure"}).encode("utf-8")
        mock_urlopen.side_effect = urllib.error.HTTPError(
            url="https://api.picsart.io/tools/1.0/removebg",
            code=500,
            msg="Internal Server Error",
            hdrs={},
            fp=io.BytesIO(error_body),
        )

        result = self.provider.remove_background(b"sample_bytes")
        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "SERVER_ERROR")
        self.assertIn("Picsart server error (HTTP 500)", result.error)

    @patch("urllib.request.urlopen")
    def test_9_network_timeout(self, mock_urlopen):
        """9. Test network socket timeout handling."""
        mock_urlopen.side_effect = socket.timeout("timed out")

        result = self.provider.remove_background(b"sample_bytes")
        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "TIMEOUT")
        self.assertIn("timed out", result.error)

    @patch("urllib.request.urlopen")
    def test_10_network_connection_failure(self, mock_urlopen):
        """10. Test network DNS/connection failure handling."""
        mock_urlopen.side_effect = urllib.error.URLError("Name or service not known")

        result = self.provider.remove_background(b"sample_bytes")
        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "CONNECTION_ERROR")
        self.assertIn("Network connection failure", result.error)

    @patch("urllib.request.urlopen")
    def test_11_malformed_json_response(self, mock_urlopen):
        """11. Test handling when Picsart returns invalid/non-JSON text."""
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.read.return_value = b"<html>502 Bad Gateway</html>"
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        result = self.provider.remove_background(b"sample_bytes")
        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "MALFORMED_RESPONSE")
        self.assertIn("Malformed JSON response", result.error)

    @patch("urllib.request.urlopen")
    def test_12_missing_output_url_in_success_response(self, mock_urlopen):
        """12. Test handling when Picsart response is 200 OK but lacks a valid output URL."""
        mock_urlopen.return_value = self._create_mock_response({
            "status": "success",
            "data": {"id": "asset_123", "status": "done"},  # missing 'url'
        })

        result = self.provider.remove_background(b"sample_bytes")
        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "MALFORMED_RESPONSE")
        self.assertIn("missing output URL", result.error)


if __name__ == "__main__":
    unittest.main()
