"""Manual developer test utility for Phase 3C Quality Enhancement & Super-Resolution.

Usage:
    .venv/Scripts/python.exe ai/vision/tests/test_enhancer_manual.py [optional_path_to_image]

Tests live Picsart Ultra-Enhancement / Super-Resolution and executes the full enhanced studio pipeline.
Does NOT execute automatically during automated CI runs unless LIVE_ENHANCER_TEST=true.
"""

import os
from pathlib import Path
import sys
import unittest

# Ensure repo root is on sys.path
_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from ai.vision.enhancer import QualityEnhancer


def run_enhancer_manual_test(image_path: Path) -> bool:
    """Execute live Quality Enhancement test against a local image."""
    print("=" * 70)
    print("KalaMitra — Phase 3C: AI Image Quality Enhancement & Super-Resolution")
    print("=" * 70)
    print(f"Source Image File : {image_path}")
    print(f"Source File Size  : {image_path.stat().st_size:,} bytes")

    if not os.getenv("PICSART_API_KEY"):
        print("[ERROR] PICSART_API_KEY not configured in environment.")
        return False

    enhancer = QualityEnhancer()

    # 1. Test Picsart Ultra-Enhance / Super-Resolution (POST /upscale/enhance)
    print("\n[Step 1: Testing Picsart Ultra-Enhance (POST /upscale/enhance)]")
    enh_res = enhancer.picsart.ultra_enhance(image_path, upscale_factor=2)
    if enh_res.success:
        print(f"  Status        : SUCCESS")
        print(f"  Enhanced URL  : {enh_res.output_url}")
        print(f"  Execution Time: {enh_res.metadata.get('execution_time_ms')} ms")
    else:
        print(f"  Status        : NOTICE ({enh_res.error})")

    # 2. Test adjust / lighting correction
    print("\n[Step 2: Testing Picsart Adjust / Clarity (POST /adjust)]")
    adj_res = enhancer.picsart.adjust(image_path, clarity=20, contrast=10, vibrance=10)
    if adj_res.success:
        print(f"  Status        : SUCCESS")
        print(f"  Adjusted URL  : {adj_res.output_url}")
        print(f"  Execution Time: {adj_res.metadata.get('execution_time_ms')} ms")
    else:
        print(f"  Status        : NOTICE ({adj_res.error})")

    # 3. Test full quality-enhanced studio pipeline with graceful fallback
    print("\n[Step 3: Testing Full Quality-Enhanced Studio Pipeline]")
    full_res = enhancer.process_enhanced_studio_pipeline(
        image_input=image_path,
        category="pottery",
        preset="warm_neutral",
        aspect_ratio="square_1x1",
        add_shadow=True,
        quality_mode="ultra",
        upscale_factor=2,
    )

    if full_res.success and full_res.enhanced:
        print(f"  Overall Status: SUCCESS")
        print(f"  Original URL  : {full_res.original.secure_url if full_res.original else 'N/A'}")
        print(f"  Cutout URL    : {full_res.cutout.secure_url if full_res.cutout else 'N/A'}")
        print(f"  Enhanced URL  : {full_res.enhanced.secure_url}")
        print(f"  Dimensions    : {full_res.enhanced.width} x {full_res.enhanced.height} px")
        print(f"  Format        : {full_res.enhanced.format}")
        print(f"  Total Time    : {full_res.metadata.get('total_execution_time_ms')} ms")
        print(f"  Quality Telemetry: {full_res.metadata.get('quality_enhancement')}")
        print("\n[SUCCESS] Phase 3C Quality Enhancement Pipeline verified successfully!")
        return True
    else:
        print(f"  Overall Status: FAILED ({full_res.error})")
        return False


class TestEnhancerLiveIntegration(unittest.TestCase):
    """Live integration test suite skipped by default unless LIVE_ENHANCER_TEST=true."""

    @unittest.skipUnless(
        os.getenv("LIVE_ENHANCER_TEST") == "true",
        "Set LIVE_ENHANCER_TEST=true to run live enhancer integration tests",
    )
    def test_live_quality_enhancer(self):
        sample_img = Path(__file__).parent / "test_product.jpg"
        self.assertTrue(sample_img.exists(), f"Sample image {sample_img} must exist")
        success = run_enhancer_manual_test(sample_img)
        self.assertTrue(success)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_path = Path(sys.argv[1])
    else:
        target_path = Path(__file__).parent / "test_product.jpg"

    if not target_path.exists():
        print(f"Error: Target image file not found at {target_path}")
        sys.exit(1)

    ok = run_enhancer_manual_test(target_path)
    sys.exit(0 if ok else 1)
