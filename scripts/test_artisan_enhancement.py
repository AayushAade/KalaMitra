"""Artisan Studio Image Enhancement Test Runner.

Tests real image enhancement with the user's uploaded product image (image copy.png).
"""

from __future__ import annotations

import base64
import json
import os
from pathlib import Path
import sys
import time

# Ensure repo root is on sys.path
_repo_root = Path(__file__).resolve().parents[1]
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from dotenv import load_dotenv
load_dotenv(_repo_root / ".env", override=True)

from backend.app.services.image_processing import ImageProcessingService


def run_test(
    image_path_str: str,
    category: str = "POTTERY",
    style: str = "LUXURY_STUDIO",
    output_filename: str = "enhanced_output.png",
):
    """Run full image enhancement test."""
    image_path = Path(image_path_str)
    if not image_path.exists():
        print(f"Error: Test image not found at {image_path}")
        return 1

    print("==================================================================")
    print("  AI ARTISAN PRODUCT PHOTOGRAPHY STUDIO — REAL TEST RUNNER")
    print("==================================================================")
    print(f"Input Image     : {image_path.name} ({image_path.stat().st_size / 1024:.1f} KB)")
    print(f"Product Category: {category}")
    print(f"Visual Style    : {style}")
    print(f"GCP Project     : {os.getenv('GOOGLE_CLOUD_PROJECT', 'sih-aryan')}")
    print(f"Location        : {os.getenv('GOOGLE_CLOUD_LOCATION', 'us-central1')}")
    print("------------------------------------------------------------------")

    service = ImageProcessingService()

    start_t = time.time()
    result = service.enhance_artisan_product_image(
        image_input=image_path,
        product_category=category,
        product_name="Handcrafted Indian Terracotta Earthen Matka",
        product_description="Artisan clay pottery with traditional handcrafted slip",
        style=style,
        aspect_ratio="1:1",
    )
    duration = time.time() - start_t

    print("------------------------------------------------------------------")
    print(f"EXECUTION COMPLETED in {duration:.2f} seconds")
    print("------------------------------------------------------------------")
    print(f"Success         : {result.get('success')}")
    print(f"Provider Used   : {result.get('provider')}")
    print(f"Fallback Used   : {result.get('fallbackUsed')}")
    print(f"Resolved Cat    : {result.get('category')}")
    print(f"Applied Style   : {result.get('style')}")

    out_dir = _repo_root / "output"
    out_dir.mkdir(exist_ok=True)
    out_file = out_dir / output_filename

    image_url = result.get("imageUrl")
    if image_url:
        print(f"Delivered Asset : {image_url}")
        if image_url.startswith("data:image"):
            # Extract and save data uri
            b64_data = image_url.split(",", 1)[1]
            out_file.write_bytes(base64.b64decode(b64_data))
            print(f"Saved Image to  : {out_file} ({out_file.stat().st_size / 1024:.1f} KB)")
        elif image_url.startswith("http"):
            print(f"Cloudinary URL  : {image_url}")

    if result.get("telemetry"):
        print("\nPipeline Stages Applied:")
        for stage in result["telemetry"].get("stages_applied", []):
            print(f"  [OK] {stage}")

    # Also download and save the output image locally for immediate viewing
    if image_url and image_url.startswith("http"):
        try:
            import urllib.request
            urllib.request.urlretrieve(image_url, str(out_file))
            print(f"\nSaved Enhanced Image Locally to: {out_file} ({out_file.stat().st_size / 1024:.1f} KB)")
        except Exception as dl_err:
            pass

    print("==================================================================\n")
    return 0 if result.get("success") else 1



if __name__ == "__main__":
    test_img = _repo_root / "ai" / "vision" / "tests" / "image copy.png"
    sys.exit(run_test(str(test_img), category="POTTERY", style="LUXURY_STUDIO"))
