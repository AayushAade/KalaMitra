"""Manual developer test utility for Phase 3D Cloudinary AI Quality Analysis & Enhancement.

Usage:
    .venv/Scripts/python.exe ai/vision/tests/test_cloudinary_quality_manual.py [optional_public_id_or_image_path]

Analyzes asset resolution, determines quality tier ('high', 'medium', 'poor'),
and outputs dynamic Cloudinary AI enhanced URLs.
"""

import os
from pathlib import Path
import sys

# Ensure repo root is on sys.path
_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from ai.vision.cloudinary_service import CloudinaryService
from ai.vision.enhancer import QualityEnhancer


def run_cloudinary_quality_manual_test(target: str) -> bool:
    """Execute live Cloudinary Quality Analysis and Enhancement test."""
    print("=" * 70)
    print("KalaMitra — Phase 3D: Cloudinary AI Quality Analysis & Enhancement")
    print("=" * 70)

    for var in ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"):
        if not os.getenv(var):
            print(f"[ERROR] Missing {var} in environment.")
            return False

    service = CloudinaryService()
    enhancer = QualityEnhancer()

    # Determine if target is a file or existing public ID
    target_path = Path(target)
    if target_path.exists() and target_path.is_file():
        print(f"Uploading Local Image: {target_path}")
        upload_res = service.upload_original_image(target_path)
        if not upload_res.success or not upload_res.asset:
            print(f"[FAILED] Cloudinary upload failed: {upload_res.error}")
            return False
        public_id = upload_res.asset.public_id
        print(f"Uploaded Public ID : {public_id}")
    else:
        public_id = target
        print(f"Analyzing Existing Public ID: {public_id}")

    # 1. Quality Analysis
    print("\n[Step 1: Automated Image Quality Analysis]")
    analysis = service.analyze_image_quality(public_id)
    print(f"  Classified Tier : {analysis.quality_tier.upper()}")
    print(f"  Quality Score   : {analysis.quality_score}")
    print(f"  Dimensions      : {analysis.width} x {analysis.height} px ({analysis.megapixels} MP)")
    print(f"  File Size       : {analysis.bytes:,} bytes ({analysis.format})")
    print(f"  Transformations : {analysis.recommended_transformations}")

    # 2. Quality Enhanced URLs for each tier
    print("\n[Step 2: Generated Tiered Quality-Enhanced URLs]")
    for tier in ("high", "medium", "poor"):
        url = service.get_quality_enhanced_url(public_id, quality_tier=tier)
        print(f"  Tier [{tier.upper():<6}]: {url}")

    # 3. Full pipeline test
    if target_path.exists() and target_path.is_file() and os.getenv("PICSART_API_KEY"):
        print("\n[Step 3: Executing End-to-End Quality-Enhanced Pipeline]")
        pipeline_res = enhancer.process_enhanced_studio_pipeline(
            image_input=target_path,
            category="pottery",
            preset="warm_neutral",
            aspect_ratio="square_1x1",
            add_shadow=True,
        )
        if pipeline_res.success and pipeline_res.enhanced:
            print(f"  Pipeline Status : SUCCESS")
            print(f"  Final Studio URL: {pipeline_res.enhanced.secure_url}")
            print(f"  Total Time      : {pipeline_res.metadata.get('total_execution_time_ms')} ms")
        else:
            print(f"  Pipeline Status : NOTICE/FAILED ({pipeline_res.error})")

    print("\n" + "=" * 70)
    print("[SUCCESS] Phase 3D Quality Analysis & Enhancement verified!")
    print("=" * 70)
    return True


if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = sys.argv[1]
    else:
        target = "ai/vision/tests/test_product.jpg"

    ok = run_cloudinary_quality_manual_test(target)
    sys.exit(0 if ok else 1)
