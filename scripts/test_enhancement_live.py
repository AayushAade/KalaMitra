"""Live Artisan Photo Enhancement Test Runner.

Executes the production KalaMitra Vision Pipeline:
Raw Image -> Cloudinary Original Vault -> Gemini Studio Primary -> Fidelity Validation -> Local Fallback -> Cloudinary Enhanced
"""

import argparse
import json
import os
from pathlib import Path
import sys
import time

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure repo root is on sys.path
_repo_root = Path(__file__).resolve().parents[1]
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from dotenv import load_dotenv
load_dotenv(_repo_root / ".env", override=True)

from ai.vision.enhancer import QualityEnhancer


def run_live_test(image_path: str, category: str = "pottery", preset: str = "warm_neutral"):
    img_p = Path(image_path)
    if not img_p.is_absolute():
        img_p = _repo_root / image_path

    if not img_p.exists():
        print(f"\n[ERROR] Image file not found at: {img_p}")
        print(f"Please place your image in the project root or provide the exact path.")
        return 1

    print(f"\n========================================================")
    print(f"  KALAMITRA AI ARTISAN IMAGE ENHANCEMENT LIVE TEST")
    print(f"========================================================")
    print(f"Input Image : {img_p.name} ({img_p.stat().st_size / 1024:.1f} KB)")
    print(f"Category    : {category}")
    print(f"Studio Preset: {preset}")
    print(f"Gemini Key  : {'Configured' if os.getenv('GEMINI_API_KEY') else 'Missing'}")
    print(f"Cloudinary  : {'Configured' if os.getenv('CLOUDINARY_CLOUD_NAME') else 'Local Fallback'}")
    print(f"--------------------------------------------------------")
    print(f"Executing pipeline (Raw Ingest -> Gemini Primary -> Fidelity Check -> Cloudinary/Fallback)...")

    start_t = time.time()
    enhancer = QualityEnhancer()

    result = enhancer.process_enhanced_studio_pipeline(
        image_input=str(img_p),
        category=category,
        preset=preset,
        aspect_ratio="square_1x1",
    )

    elapsed_s = time.time() - start_t
    print(f"\n--------------------------------------------------------")
    print(f"PIPELINE EXECUTION RESULTS ({elapsed_s:.2f}s total)")
    print(f"--------------------------------------------------------")
    print(f"Success         : {result.success}")
    print(f"Active Provider : {result.provider}")
    print(f"Preset Used     : {result.preset}")

    if result.original:
        print(f"\n[Original Asset - Immutable]:")
        print(f"   Public ID : {result.original.public_id}")
        print(f"   URL       : {result.original.secure_url}")
        print(f"   Dimensions: {result.original.width}x{result.original.height} ({result.original.format})")

    if result.enhanced:
        print(f"\n[Final Enhanced E-Commerce Asset]:")
        print(f"   Public ID : {result.enhanced.public_id}")
        print(f"   URL       : {result.enhanced.secure_url}")
        print(f"   Dimensions: {result.enhanced.width}x{result.enhanced.height} ({result.enhanced.format})")

    if result.metadata:
        fidelity = result.metadata.get("fidelity")
        if fidelity:
            print(f"\n[Product Fidelity Validation]:")
            print(f"   Decision              : {fidelity.get('decision')}")
            print(f"   Confidence Score      : {fidelity.get('score')}")
            metrics = fidelity.get("metrics", {})
            print(f"   Silhouette Mask IoU   : {metrics.get('mask_iou')}")
            print(f"   Contour Similarity    : {metrics.get('silhouette_similarity')}")
            print(f"   Texture SSIM          : {metrics.get('ssim')}")
            print(f"   CIELAB Color Delta E  : {metrics.get('color_delta_e')}")
            print(f"   Aspect Ratio Delta    : {metrics.get('aspect_ratio_delta')}")
            if fidelity.get("warnings"):
                print(f"   Warnings: {fidelity.get('warnings')}")

        if result.metadata.get("fallback_used"):
            print(f"\n[Fallback Info]:")
            print(f"   Fallback Used   : True")
            print(f"   Fallback Reason : {result.metadata.get('pipeline_telemetry', {}).get('fallback_reason')}")

    if result.error:
        print(f"\n[ERROR Details]: {result.error} (code: {result.error_code})")

    print(f"========================================================\n")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="KalaMitra Live Image Enhancement Test")
    parser.add_argument("image_path", nargs="?", default="test.jpg", help="Path to artisan image file (default: test.jpg)")
    parser.add_argument("--category", default="pottery", help="Craft category (pottery, textiles, wooden_crafts, jewellery, general)")
    parser.add_argument("--preset", default="warm_neutral", help="Studio preset (warm_neutral, travertine_podium, ecommerce_white, minimal_grey, terracotta_sand)")
    args = parser.parse_args()

    sys.exit(run_live_test(args.image_path, args.category, args.preset))
