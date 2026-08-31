"""Unit tests for the FastAPI Voice Cataloging API endpoints."""

import io
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.schemas.voice import VoiceExtractionMetadata, VoiceTranscribeResponse


class TestVoiceAPI(unittest.TestCase):
    """Test suite for /api/v1/voice endpoints."""

    def setUp(self):
        self.client = TestClient(app)

    def test_rejects_request_without_audio_file(self):
        """Endpoint must return 400 when no audio file is provided."""
        response = self.client.post("/api/v1/voice/transcribe-and-extract")
        self.assertEqual(response.status_code, 400)
        self.assertIn("No audio file provided", response.json()["detail"])

    def test_rejects_empty_audio_file(self):
        """Endpoint must return 400 when an empty (0 byte) file is uploaded."""
        empty_file = io.BytesIO(b"")
        response = self.client.post(
            "/api/v1/voice/transcribe-and-extract",
            files={"audio": ("empty.wav", empty_file, "audio/wav")},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("empty", response.json()["detail"])

    @patch("backend.app.api.v1.voice.voice_service.process_audio")
    def test_successful_voice_transcription_and_extraction(self, mock_process):
        """Endpoint must return 200 with structured metadata when processing succeeds."""
        mock_process.return_value = VoiceTranscribeResponse(
            success=True,
            transcript="यह एक रेशमी दुपट्टा है",
            detected_language="Hindi",
            metadata=VoiceExtractionMetadata(
                product_name="Handcrafted Silk Dupatta",
                category="Textiles",
                subcategory="Dupatta",
                material="Silk",
                craft_type="Handloom Weaving",
                colors=["Red", "Gold"],
                production_time_days=5,
                description_english="A beautiful silk dupatta.",
                description_hindi="एक सुंदर रेशमी दुपट्टा।",
                tags=["Silk", "Handloom"],
            ),
        )

        dummy_audio = io.BytesIO(b"RIFFdummywavecontent1234567890")
        response = self.client.post(
            "/api/v1/voice/transcribe-and-extract",
            files={"audio": ("recording.wav", dummy_audio, "audio/wav")},
            data={"language_hint": "Hindi"},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["detected_language"], "Hindi")
        self.assertEqual(body["metadata"]["product_name"], "Handcrafted Silk Dupatta")
        self.assertEqual(body["metadata"]["category"], "Textiles")
        self.assertEqual(body["metadata"]["production_time_days"], 5)
        self.assertIn("Silk", body["metadata"]["tags"])

    @patch("backend.app.api.v1.voice.voice_service.process_audio")
    def test_handles_runtime_error_with_502(self, mock_process):
        """Endpoint must return 502 when upstream Gemini service raises RuntimeError."""
        mock_process.side_effect = RuntimeError("Gemini API quota exceeded or unreachable")

        dummy_audio = io.BytesIO(b"RIFFdummywavecontent1234567890")
        response = self.client.post(
            "/api/v1/voice/transcribe-and-extract",
            files={"audio": ("recording.wav", dummy_audio, "audio/wav")},
        )

        self.assertEqual(response.status_code, 502)
        self.assertIn("Gemini API", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
