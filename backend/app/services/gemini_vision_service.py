"""Isolated Gemini Nano Banana Image Enhancement Service."""

import io
import logging
import os
from typing import Optional, Tuple
from PIL import Image

from google import genai
from google.genai import types
from google.genai.errors import APIError

logger = logging.getLogger("kalamitra.gemini_vision")

PROMPT_STUDIO_ENHANCEMENT = """
You are an expert commercial product photographer and studio enhancer for Indian handicraft e-commerce catalogs.

Enhance this product image into a clean, premium, high-resolution e-commerce catalog photo.

Strict Requirements:
1. Preserve the actual artisan product faithfully. Do NOT alter product colors, patterns, embroidery, shape, or materials.
2. Place the product centered in a square 1:1 composition on a clean, minimal, warm neutral studio background (soft off-white / light beige).
3. Apply realistic, soft, diffused studio lighting.
4. Add subtle, realistic contact shadows beneath the product.
5. High clarity, photorealistic, professional product photography.
6. NO text, NO logos, NO watermarks, NO artificial borders, NO invented background clutter.
"""


class GeminiVisionService:
    """Service wrapping Google Gemini Nano Banana (gemini-2.5-flash-image) product enhancement."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model_name = "gemini-2.5-flash-image"

    def _get_client(self) -> genai.Client:
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured in environment.")
        return genai.Client(api_key=self.api_key)

    def enhance_product_image(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        custom_prompt: Optional[str] = None,
    ) -> Tuple[bytes, str, Tuple[int, int]]:
        """Enhances raw artisan photo into a studio catalog photo using Nano Banana.

        Returns:
            Tuple of (enhanced_image_bytes, mime_type, (width, height))
        """
        if not image_bytes:
            raise ValueError("Input image bytes cannot be empty.")

        client = self._get_client()
        prompt = custom_prompt or PROMPT_STUDIO_ENHANCEMENT

        logger.info(f"[GeminiVision] Invoking {self.model_name} for image enhancement ({len(image_bytes)} bytes)...")

        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=[
                    prompt,
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                ],
            )

            # Extract inline image from response candidates
            for candidate in response.candidates or []:
                for part in candidate.content.parts:
                    if part.inline_data and part.inline_data.data:
                        out_bytes = part.inline_data.data
                        out_mime = part.inline_data.mime_type or "image/jpeg"
                        img = Image.open(io.BytesIO(out_bytes))
                        logger.info(f"[GeminiVision] Received enhanced image: {img.size}, format: {img.format}")
                        return out_bytes, out_mime, img.size

            raise RuntimeError("Gemini Nano Banana response did not contain an inline image part.")

        except APIError as api_err:
            logger.error(f"[GeminiVision] Gemini API Error: {api_err}")
            raise RuntimeError(f"Gemini Nano Banana enhancement failed: {api_err.message}") from api_err
        except Exception as exc:
            logger.error(f"[GeminiVision] Unexpected error: {exc}")
            raise


gemini_vision_service = GeminiVisionService()
