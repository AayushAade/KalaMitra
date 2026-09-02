"""Voice Service adapter module integrating Google GenAI multimodal speech understanding."""

import json
import logging
import os
import re
import tempfile
from pathlib import Path
from typing import Optional

from google import genai
from google.genai.errors import APIError

from backend.app.schemas.voice import VoiceExtractionMetadata, VoiceTranscribeResponse

logger = logging.getLogger("kalamitra.voice")

PROMPT_VOICE_UNDERSTANDING = """
You are an expert AI assistant designed for Indian artisans and handicraft sellers on KalaMitra.

Listen to the artisan's speech and extract all useful catalog and craft information about the product being described.

Return ONLY a valid JSON object with exactly these fields:
{
  "transcript": "<verbatim transcript in the original spoken vernacular language>",
  "detected_language": "<Hindi, Marathi, English, Gujarati, etc.>",
  "product_name": "<concise professional English product name>",
  "category": "<top-level category, e.g. Textiles, Pottery, Bamboo, Woodwork, Metalcraft, Jewelry, Home Decor>",
  "subcategory": "<e.g. Dupatta, Basket, Vase, Saree, Diya, Wall Hanging>",
  "material": "<primary materials mentioned, e.g. Pure Silk, Clay, Natural Bamboo>",
  "craft_type": "<traditional craft technique, e.g. Handloom Weaving, Wheel Pottery, Hand-braided Weaving>",
  "colors": ["<color1>", "<color2>"],
  "production_time_days": <integer number of days, or null if not mentioned>,
  "size": "<dimensions or sizing, e.g. 2.5 meters, Medium, or empty string>",
  "description_english": "<professional, appealing 2-3 sentence English catalog description>",
  "description_hindi": "<professional, appealing 2-3 sentence Hindi catalog description>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>"],
  "additional_details": []
}

Rules:
1. Understand the vernacular language automatically (Hindi, Marathi, English, Gujarati, Tamil, etc.).
2. Keep the transcript strictly in the original spoken language.
3. Extract accurate facts from speech without inventing unmentioned attributes.
4. product_name should be an attractive e-commerce title.
5. If an attribute is not mentioned in speech, use null, empty array [], or empty string "".
"""


class VoiceService:
    """Service wrapping Google Gemini multimodal audio transcription & product extraction."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("[VoiceService] GEMINI_API_KEY is not set in environment.")

    def _get_client(self) -> genai.Client:
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is required for voice transcription and catalog extraction.")
        return genai.Client(api_key=self.api_key)

    def process_audio(self, audio_bytes: bytes, filename: str = "audio.wav") -> VoiceTranscribeResponse:
        """Uploads audio bytes to Gemini and extracts speech transcript + product metadata."""
        if not audio_bytes or len(audio_bytes) == 0:
            raise ValueError("Audio payload is empty (0 bytes).")

        client = self._get_client()

        # Determine audio extension for temp file
        ext = Path(filename).suffix.lower() or ".wav"
        if ext not in [".wav", ".m4a", ".mp3", ".aac", ".ogg", ".webm", ".flac"]:
            ext = ".wav"

        tmp_path = None
        uploaded_file = None
        try:
            # Write bytes to temporary file for Gemini files API upload
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            logger.info(f"[VoiceService] Uploading audio ({len(audio_bytes)} bytes) to Gemini Files API...")
            uploaded_file = client.files.upload(file=tmp_path)
            logger.info(f"[VoiceService] Audio uploaded successfully: {uploaded_file.uri}")

            # Call Gemini model for multimodal transcription & extraction
            logger.info("[VoiceService] Invoking Gemini model for transcription & understanding...")
            interaction = client.interactions.create(
                model="gemini-3.6-flash",
                input=[
                    {"type": "text", "text": PROMPT_VOICE_UNDERSTANDING},
                    {"type": "audio", "uri": uploaded_file.uri, "mime_type": uploaded_file.mime_type},
                ],
            )

            raw_text = interaction.output_text or ""
            logger.info(f"[VoiceService] Model response received ({len(raw_text)} chars).")

            # Parse JSON from model output (stripping code block fences if present)
            json_str = raw_text.strip()
            if json_str.startswith("```"):
                json_str = re.sub(r"^```(?:json)?\n", "", json_str)
                json_str = re.sub(r"\n```$", "", json_str)

            parsed = json.loads(json_str)

            metadata = VoiceExtractionMetadata(
                product_name=parsed.get("product_name") or "Handcrafted Product",
                category=parsed.get("category") or "General",
                subcategory=parsed.get("subcategory"),
                material=parsed.get("material"),
                craft_type=parsed.get("craft_type"),
                colors=parsed.get("colors") or [],
                production_time_days=parsed.get("production_time_days"),
                size=parsed.get("size"),
                description_english=parsed.get("description_english"),
                description_hindi=parsed.get("description_hindi"),
                tags=parsed.get("tags") or [],
                additional_details=parsed.get("additional_details") or [],
            )

            return VoiceTranscribeResponse(
                success=True,
                transcript=parsed.get("transcript") or "",
                detected_language=parsed.get("detected_language") or "Hindi",
                metadata=metadata,
            )

        except json.JSONDecodeError as jde:
            logger.error(f"[VoiceService] Failed to parse model output as JSON: {jde}. Raw: {raw_text}")
            return VoiceTranscribeResponse(
                success=True,
                transcript=raw_text.strip(),
                detected_language="Hindi",
                metadata=VoiceExtractionMetadata(
                    product_name="Handcrafted Artisan Product",
                    category="Handicraft",
                    description_english=raw_text.strip(),
                ),
            )
        except APIError as api_err:
            logger.error(f"[VoiceService] Gemini API Error: {api_err}")
            raise RuntimeError(f"Gemini API speech processing failed: {api_err.message}") from api_err
        except Exception as e:
            logger.error(f"[VoiceService] Unexpected error processing voice: {e}")
            raise
        finally:
            # Clean up local temporary audio file
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass


voice_service = VoiceService()
