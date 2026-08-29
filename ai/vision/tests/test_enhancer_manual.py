"""Manual developer test utility for Local AI Image Enhancer & Studio Pipeline.

Usage:
    .venv/Scripts/python.exe ai/vision/tests/test_enhancer_manual.py [optional_path_to_image]

Tests the complete 4-stage pipeline:
1. AI Lighting & White-Balance Correction
2. AI Pixel Super-Resolution & Detail Reconstructor (2x/4x)
3. AI Background Removal (Local offline Rembg)
4. E-Commerce Studio Framing & Contact Drop Shadows
"""

import json
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
    """Execute live 4-stage Local AI Quality Enhancement & Studio test."""
    print("=" * 75)
    print("KalaMitra — Local AI Image Enhancer & Studio Pipeline")
    print("=" * 75)
    print(f"Source Image File : {image_path}")
    print(f"Source File Size  : {image_path.stat().st_size:,} bytes")

    enhancer = QualityEnhancer()

    # 1. Test Stage 1: Lighting & Color Correction
    print("\n[Stage 1: Testing AI Lighting & Color Balance Correction]")
    light_bytes, light_meta = enhancer.lighting.correct_lighting(
        image_path,
        enable_white_balance=True,
        enable_clahe=True,
        enable_auto_exposure=True,
    )
    print(f"  Status            : SUCCESS")
    print(f"  Luminance Shift   : {light_meta['original_luminance']} -> {light_meta['enhanced_luminance']} ({light_meta['luminance_boost_percent']}%)")
    print(f"  Execution Time    : {light_meta['execution_time_ms']} ms")

    # 2. Test Stage 2: Super-Resolution
    print("\n[Stage 2: Testing AI Pixel Restoration & Super-Resolution (2x)]")
    sr_bytes, sr_meta = enhancer.sr.upscale_image(light_bytes, scale=2)
    print(f"  Status            : SUCCESS")
    print(f"  Resolution Shift  : {sr_meta['original_resolution']} -> {sr_meta['enhanced_resolution']}")
    print(f"  Megapixels Shift  : {sr_meta['megapixels_before']} MP -> {sr_meta['megapixels_after']} MP")
    print(f"  Execution Time    : {sr_meta['execution_time_ms']} ms")

    # 3. Test Full 4-Stage End-to-End Pipeline
    print("\n[Full Pipeline: Executing End-to-End AI Enhancer & Studio Sequence]")
    full_res = enhancer.process_enhanced_studio_pipeline(
        image_input=image_path,
        category="pottery",
        preset="warm_neutral",
        aspect_ratio="square_1x1",
        add_shadow=True,
        upscale_factor=2,
        enable_lighting_correction=True,
        enable_super_resolution=True,
    )

    if full_res.success and full_res.enhanced:
        print(f"  Overall Status    : SUCCESS")
        print(f"  Original URL      : {full_res.original.secure_url if full_res.original else 'N/A'}")
        print(f"  Cutout URL        : {full_res.cutout.secure_url if full_res.cutout else 'N/A'}")
        print(f"  Final Studio URL  : {full_res.enhanced.secure_url}")
        print(f"  Final Dimensions  : {full_res.enhanced.width} x {full_res.enhanced.height} px")
        print(f"  Format            : {full_res.enhanced.format}")
        print(f"  Total Pipeline Time: {full_res.metadata.get('total_execution_time_ms')} ms")
        print("\n  Stages Executed   : " + ", ".join(full_res.metadata.get("pipeline_telemetry", {}).get("stages_applied", [])))
        print("\n" + "=" * 75)
        print("[SUCCESS] All 4 stages executed successfully with zero API fees!")
        print("=" * 75)
        return True
    else:
        print(f"  Overall Status    : FAILED ({full_res.error})")
        return False


class TestEnhancerLiveIntegration(unittest.TestCase):
    """Live integration test suite."""

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
