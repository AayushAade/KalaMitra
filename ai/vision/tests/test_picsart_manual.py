"""Manual developer test utility for verifying real Picsart API background removal.

Usage:
    .venv/Scripts/python.exe ai/vision/tests/test_picsart_manual.py [optional_path_to_image]

Requires PICSART_API_KEY to be set in environment or root .env file.
Does NOT execute automatically as part of automated CI test runs.
"""

import os
from pathlib import Path
import sys
import unittest

# Ensure repo root is on sys.path
_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from ai.vision.providers.picsart_provider import PicsartProvider


def run_manual_test(image_path: Path):
    """Execute live Picsart background removal test against a local image."""
    print("=" * 60)
    print("KalaMitra — Picsart Live API Background Removal Proof of Concept")
    print("=" * 60)
    print(f"Source Image : {image_path}")
    print(f"File Size    : {image_path.stat().st_size:,} bytes")

    if not os.getenv("PICSART_API_KEY"):
        print("\n[ERROR] PICSART_API_KEY environment variable is not set.")
        print("Please configure PICSART_API_KEY in your local .env file.")
        return False

    provider = PicsartProvider()
    print("Connecting to Picsart API (https://api.picsart.io/tools/1.0/removebg)...")

    result = provider.remove_background(image_path)

    print("\n--- Result Summary ---")
    print(f"Success        : {result.success}")
    print(f"Provider       : {result.provider}")
    print(f"Operation      : {result.operation}")
    print(f"Output Format  : {result.output_format}")

    if result.success:
        print(f"Cutout URL     : {result.output_url}")
        if result.metadata:
            print("Execution Meta :")
            for k, v in result.metadata.items():
                print(f"  - {k}: {v}")
        print("\n[SUCCESS] Background removal completed successfully without modifying the product.")
        return True
    else:
        print(f"Error Code     : {result.error_code}")
        print(f"Error Message  : {result.error}")
        print("\n[FAILED] Live processing failed.")
        return False


class TestPicsartManualIntegration(unittest.TestCase):
    """Integration test suite skipped by default unless LIVE_PICSART_TEST=true."""

    @unittest.skipUnless(
        os.getenv("LIVE_PICSART_TEST") == "true",
        "Set LIVE_PICSART_TEST=true to run live Picsart integration tests",
    )
    def test_live_picsart_remove_bg(self):
        sample_img = Path(__file__).parent / "test_product.jpg"
        self.assertTrue(sample_img.exists(), f"Sample image {sample_img} must exist")
        success = run_manual_test(sample_img)
        self.assertTrue(success)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_path = Path(sys.argv[1])
    else:
        target_path = Path(__file__).parent / "test_product.jpg"

    if not target_path.exists():
        print(f"Error: Target image file not found at {target_path}")
        sys.exit(1)

    ok = run_manual_test(target_path)
    sys.exit(0 if ok else 1)
