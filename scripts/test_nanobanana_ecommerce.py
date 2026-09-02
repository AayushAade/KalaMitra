"""Gemini Nanobanana E-Commerce Studio Catalogue Generation for test1.jpg.

Generates a luxury e-commerce catalogue image preserving the exact product,
uploading to Cloudinary, and saving locally.
"""

from __future__ import annotations

import base64
import io
import os
from pathlib import Path
import sys
import time
from PIL import Image, ImageOps

# Ensure repo root is on sys.path
_repo_root = Path(__file__).resolve().parents[1]
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from dotenv import load_dotenv
load_dotenv(_repo_root / ".env", override=True)

from backend.app.core.product_studio_prompts import (
    ProductCategory,
    VisualStyle,
    build_artisan_studio_prompt,
)
from backend.app.services.image_processing import ImageProcessingService
from ai.vision.cloudinary_service import CloudinaryService


def run_nanobanana_catalogue(
    image_path_str: str = "ai/vision/tests/test1.jpeg",
    category_name: str = "POTTERY",
    style_name: str = "CLEAN_ECOMMERCE",
):
    """Execute e-commerce catalogue enhancement using Gemini / Nanobanana."""
    img_path = Path(image_path_str)
    if not img_path.is_absolute():
        img_path = _repo_root / img_path

    if not img_path.exists():
        print(f"Error: Target image file not found at {img_path}")
        return None

    print("==================================================================")
    print("  GEMINI NANOBANANA E-COMMERCE CATALOGUE STUDIO")
    print("==================================================================")
    print(f"Source Image     : {img_path.name} ({img_path.stat().st_size / 1024:.1f} KB)")
    print(f"Product Category : {category_name}")
    print(f"Visual Style     : {style_name}")
    print(f"API Key Present  : {'Yes' if os.getenv('GEMINI_API_KEY') else 'No'}")
    print("------------------------------------------------------------------")

    # Run complete image processing service (Vertex/Gemini + Local Studio Fallback + Cloudinary)
    service = ImageProcessingService()

    start_t = time.time()
    result = service.enhance_artisan_product_image(
        image_input=img_path,
        product_category=category_name,
        product_name="Artisan Handcrafted Terracotta Clay Matka Pot",
        product_description="Traditional earthen pottery with handcrafted curve and natural clay slip",
        style=style_name,
        aspect_ratio="1:1",
    )
    elapsed_s = time.time() - start_t

    print(f"Processing finished in {elapsed_s:.2f} seconds.")
    print("------------------------------------------------------------------")
    print(f"Status           : {'SUCCESS' if result.get('success') else 'FAILED'}")
    print(f"Provider Active  : {result.get('provider')}")
    print(f"Category Applied : {result.get('category')}")
    print(f"Style Applied    : {result.get('style')}")

    image_url = result.get("imageUrl")
    print(f"Delivered Image  : {image_url}")

    out_dir = _repo_root / "output"
    out_dir.mkdir(exist_ok=True)
    out_file = out_dir / "test1_nanobanana_ecommerce_catalogue.png"

    if image_url and image_url.startswith("http"):
        try:
            import urllib.request
            urllib.request.urlretrieve(image_url, str(out_file))
            print(f"Saved Image To   : {out_file} ({out_file.stat().st_size / 1024:.1f} KB)")
        except Exception as dl_err:
            print(f"Local save note: {dl_err}")
    elif image_url and image_url.startswith("data:image"):
        b64_data = image_url.split(",", 1)[1]
        out_file.write_bytes(base64.b64decode(b64_data))
        print(f"Saved Image To   : {out_file} ({out_file.stat().st_size / 1024:.1f} KB)")

    print("==================================================================\n")
    return result


if __name__ == "__main__":
    run_nanobanana_catalogue()
