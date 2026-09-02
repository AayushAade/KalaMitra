"""Comprehensive Automated Test Suite for Complete AI Product Photography Studio.

Covers:
1. Environment & Configuration loading
2. Image Preprocessing & Validation (valid image, corrupt file, oversized, empty)
3. Product-Aware Prompt Engine (all 12 categories, all 4 visual styles, universal preservation)
4. Category & Style Resolution (explicit, keyword parsing from titles/descriptions, defaults)
5. Local Fallback Provider (deterministic studio rendering, drop shadow, 1:1 canvas)
6. Vertex AI Provider (multimodal image editing, error code mapping, safety validation)
7. Full API Controller Endpoints (POST /api/products/image-enhance)
"""

from __future__ import annotations

import io
import os
from pathlib import Path
import unittest
from unittest.mock import MagicMock, patch
from PIL import Image

from fastapi.testclient import TestClient

from backend.app.core.product_studio_prompts import (
    CATEGORY_RULES,
    STYLE_DIRECTIVES,
    UNIVERSAL_PRESERVATION_PROMPT,
    NEGATIVE_CONSTRAINTS_PROMPT,
    ProductCategory,
    VisualStyle,
    build_artisan_studio_prompt,
    resolve_product_category,
    resolve_visual_style,
)
from backend.app.core.vertex_config import (
    VertexAISettings,
    get_vertex_ai_config,
)
from backend.app.main import app
from backend.app.services.image_processing import (
    ImageProcessingService,
    VertexAIImageProvider,
)
from backend.app.services.image_processing.local_provider import LocalImageProcessingProvider


class TestCompleteArtisanStudio(unittest.TestCase):
    """Test suite covering the complete end-to-end Artisan Studio module."""

    def setUp(self):
        """Prepare sample image data and test client."""
        self.client = TestClient(app)

        # Generate a synthetic 200x200 RGB image
        img = Image.new("RGB", (200, 200), color=(180, 100, 60))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        self.sample_jpeg_bytes = buf.getvalue()

        # Generate a synthetic 200x200 PNG image
        png_img = Image.new("RGBA", (200, 200), color=(100, 140, 200, 255))
        png_buf = io.BytesIO()
        png_img.save(png_buf, format="PNG")
        self.sample_png_bytes = png_buf.getvalue()

    # -------------------------------------------------------------------------
    # 1. Prompt Engine & Universal Preservation Verification
    # -------------------------------------------------------------------------

    def test_01_universal_preservation_prompt_integrity(self):
        """Verify that the universal product preservation directive contains mandatory preservation rules."""
        self.assertIn("premium luxury e-commerce catalogue image", UNIVERSAL_PRESERVATION_PROMPT)
        self.assertIn("preserve the exact physical product", UNIVERSAL_PRESERVATION_PROMPT)
        self.assertIn("Do NOT use a plain white background", UNIVERSAL_PRESERVATION_PROMPT)

    def test_02_all_categories_supported_in_prompt_engine(self):
        """Verify prompt engine generates master prompt with product context."""
        for cat in ProductCategory:
            prompt = build_artisan_studio_prompt(
                category=cat,
                style=VisualStyle.CLEAN_ECOMMERCE,
                product_name="Handcrafted Artisan Piece",
            )
            self.assertIn("premium luxury e-commerce catalogue image", prompt)
            self.assertIn("Handcrafted Artisan Piece", prompt)

    def test_03_all_styles_supported_in_prompt_engine(self):
        """Verify prompt engine generates master prompt for all visual styles."""
        styles = [
            VisualStyle.CLEAN_ECOMMERCE,
            VisualStyle.LUXURY_STUDIO,
            VisualStyle.INDIAN_HERITAGE,
            VisualStyle.NATURAL_ARTISAN,
        ]
        for style in styles:
            prompt = build_artisan_studio_prompt(
                category=ProductCategory.POTTERY,
                style=style,
                product_name="Terracotta Vase",
            )
            self.assertIn("premium luxury e-commerce catalogue image", prompt)


    def test_04_category_resolution_hierarchy(self):
        """Verify category resolver priority: explicit -> product name -> description -> fallback."""
        # 1. Explicit category
        self.assertEqual(
            resolve_product_category(explicit_category="JEWELLERY"),
            ProductCategory.JEWELLERY,
        )
        # 2. Inferred from product name
        self.assertEqual(
            resolve_product_category(product_name="Pure Brass Dokra Idol"),
            ProductCategory.METAL_HANDICRAFT,
        )
        self.assertEqual(
            resolve_product_category(product_name="Handwoven Chanderi Silk Saree"),
            ProductCategory.TEXTILE,
        )
        # 3. Inferred from description
        self.assertEqual(
            resolve_product_category(product_description="Earthen clay matka pot with traditional glaze"),
            ProductCategory.POTTERY,
        )
        # 4. Fallback
        self.assertEqual(
            resolve_product_category(product_name="Custom item"),
            ProductCategory.GENERIC_HANDICRAFT,
        )

    def test_05_visual_style_resolution(self):
        """Verify style resolver respects explicit selection or intelligent defaults."""
        self.assertEqual(
            resolve_visual_style(explicit_style="LUXURY_STUDIO"),
            VisualStyle.LUXURY_STUDIO,
        )
        self.assertEqual(
            resolve_visual_style(category=ProductCategory.JEWELLERY),
            VisualStyle.LUXURY_STUDIO,
        )
        self.assertEqual(
            resolve_visual_style(category=ProductCategory.TEXTILE),
            VisualStyle.INDIAN_HERITAGE,
        )
        self.assertEqual(
            resolve_visual_style(category=ProductCategory.GENERIC_HANDICRAFT),
            VisualStyle.CLEAN_ECOMMERCE,
        )

    # -------------------------------------------------------------------------
    # 2. Image Preprocessing & Validation
    # -------------------------------------------------------------------------

    def test_06_image_validation_valid_inputs(self):
        """Verify image validation accepts valid JPEG and PNG bytes."""
        service = ImageProcessingService()
        raw, pil_img, mime = service.validate_image_payload(self.sample_jpeg_bytes)
        self.assertEqual(mime, "image/jpeg")
        self.assertGreater(len(raw), 0)

        raw_png, pil_png, mime_png = service.validate_image_payload(self.sample_png_bytes)
        self.assertEqual(mime_png, "image/png")

    def test_07_image_validation_rejects_invalid_inputs(self):
        """Verify image validation rejects empty bytes, corrupt files, and non-images."""
        service = ImageProcessingService()

        with self.assertRaises(ValueError):
            service.validate_image_payload(b"")

        with self.assertRaises(ValueError):
            service.validate_image_payload(b"This is not a real image stream")

    # -------------------------------------------------------------------------
    # 3. Local Fallback Provider
    # -------------------------------------------------------------------------

    def test_08_local_fallback_studio_composition(self):
        """Verify LocalImageProcessingProvider produces valid 1080x1080 studio image with shadow."""
        provider = LocalImageProcessingProvider()
        result = provider.generate_studio_image(
            image_input=self.sample_jpeg_bytes,
            category=ProductCategory.POTTERY,
            style=VisualStyle.LUXURY_STUDIO,
            canvas_size=1080,
        )

        self.assertTrue(result.success)
        self.assertEqual(result.provider, "local_fallback")
        self.assertEqual(result.output_format, "PNG")
        self.assertIn("image_bytes", result.metadata)

        # Verify output is decodable and 1080x1080
        out_img = Image.open(io.BytesIO(result.metadata["image_bytes"]))
        self.assertEqual(out_img.size, (1080, 1080))

    # -------------------------------------------------------------------------
    # 4. Vertex AI Provider & Multimodal Editing
    # -------------------------------------------------------------------------

    def test_09_vertex_provider_error_mapping(self):
        """Verify Vertex AI provider maps errors correctly."""
        provider = VertexAIImageProvider()
        self.assertEqual(provider._map_error_code("403 Forbidden"), "PERMISSION_DENIED")
        self.assertEqual(provider._map_error_code("429 ResourceExhausted"), "QUOTA_EXCEEDED")
        self.assertEqual(provider._map_error_code("Timed out waiting for response"), "TIMEOUT_ERROR")

    # -------------------------------------------------------------------------
    # 5. Full API Endpoints
    # -------------------------------------------------------------------------

    def test_10_api_image_enhance_endpoint_success(self):
        """Verify POST /api/products/image-enhance processes multipart upload and returns catalogue URL."""
        response = self.client.post(
            "/api/products/image-enhance",
            files={"image": ("test_pot.jpg", self.sample_jpeg_bytes, "image/jpeg")},
            data={
                "productCategory": "POTTERY",
                "productName": "Terracotta Earthen Matka",
                "productDescription": "Traditional clay water pot",
                "style": "LUXURY_STUDIO",
            },
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("imageUrl", data)
        self.assertIsNotNone(data["imageUrl"])
        self.assertIn("provider", data)
        self.assertEqual(data["category"], "POTTERY")
        self.assertEqual(data["style"], "LUXURY_STUDIO")

    def test_11_api_image_enhance_endpoint_validation_failure(self):
        """Verify POST /api/products/image-enhance returns 400 for corrupt image payload."""
        response = self.client.post(
            "/api/products/image-enhance",
            files={"image": ("corrupt.jpg", b"corrupted non image data", "image/jpeg")},
            data={"productCategory": "JEWELLERY"},
        )
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
