"""Manual developer test utility for the Cloudinary -> Picsart -> Cloudinary Persistence Bridge.

Usage:
    .venv/Scripts/python.exe ai/vision/tests/test_persistence_manual.py [optional_path_to_image]

Requires CLOUDINARY_* and PICSART_API_KEY to be set in environment or root .env file.
Does NOT execute automatically during automated CI runs unless LIVE_PERSISTENCE_TEST=true.
"""

import os
from pathlib import Path
import sys
import unittest

# Ensure repo root is on sys.path
_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from ai.vision.persistence import PersistenceBridge


def run_persistence_manual_test(image_path: Path) -> bool:
    """Execute live Cloudinary -> Picsart -> Cloudinary pipeline against a local image."""
    print("=" * 70)
    print("KalaMitra — Phase 3A: Cloudinary -> Picsart -> Cloudinary Persistence Bridge")
    print("=" * 70)
    print(f"Source Image File : {image_path}")
    print(f"Source File Size  : {image_path.stat().st_size:,} bytes")

    # Check credentials
    missing = []
    for var in ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "PICSART_API_KEY"):
        if not os.getenv(var):
            missing.append(var)

    if missing:
        print(f"\n[ERROR] Missing environment variables: {', '.join(missing)}")
        print("Please configure these in your local .env file before running live tests.")
        return False

    bridge = PersistenceBridge()
    print("\nExecuting Pipeline:")
    print("  1. Uploading raw photograph to Cloudinary (artisan-ai/originals/)...")
    print("  2. Requesting AI cutout from Picsart API (POST /removebg)...")
    print("  3. Downloading transparent PNG cutout from temporary CDN...")
    print("  4. Uploading persistent cutout PNG to Cloudinary (artisan-ai/cutouts/)...")

    result = bridge.process_original_to_cutout(
        image_input=image_path,
        tags=["manual-test", "phase-3a", "artisan-craft"],
    )

    print("\n" + "-" * 40)
    print("Pipeline Execution Summary")
    print("-" * 40)
    print(f"Overall Success      : {result.success}")
    print(f"Provider             : {result.provider}")
    print(f"Operation            : {result.operation}")

    if result.original:
        print("\n[Original Asset in Cloudinary]")
        print(f"  Public ID          : {result.original.public_id}")
        print(f"  Secure URL         : {result.original.secure_url}")
        print(f"  Dimensions         : {result.original.width} x {result.original.height} px")
        print(f"  Format             : {result.original.format}")
        print(f"  Size               : {result.original.bytes:,} bytes")

    if result.cutout:
        print("\n[Persistent Cutout in Cloudinary]")
        print(f"  Public ID          : {result.cutout.public_id}")
        print(f"  Secure URL         : {result.cutout.secure_url}")
        print(f"  Dimensions         : {result.cutout.width} x {result.cutout.height} px")
        print(f"  Format             : {result.cutout.format} (alpha transparency preserved)")
        print(f"  Size               : {result.cutout.bytes:,} bytes")

    if result.metadata:
        print("\n[Telemetry & Timing]")
        print(f"  Total Elapsed Time : {result.metadata.get('execution_time_ms')} ms")
        if "picsart_metadata" in result.metadata and result.metadata["picsart_metadata"]:
            picsart_meta = result.metadata["picsart_metadata"]
            print(f"  Picsart Time       : {picsart_meta.get('execution_time_ms')} ms")

    if result.success:
        print("\n[SUCCESS] Phase 3A persistence bridge executed successfully with zero artifact distortion!")
        return True
    else:
        print(f"\n[FAILED] Error Code: {result.error_code}")
        print(f"Error Message: {result.error}")
        return False


class TestPersistenceLiveIntegration(unittest.TestCase):
    """Live integration test suite skipped by default unless LIVE_PERSISTENCE_TEST=true."""

    @unittest.skipUnless(
        os.getenv("LIVE_PERSISTENCE_TEST") == "true",
        "Set LIVE_PERSISTENCE_TEST=true to run live persistence integration tests",
    )
    def test_live_persistence_bridge(self):
        sample_img = Path(__file__).parent / "test_product.jpg"
        self.assertTrue(sample_img.exists(), f"Sample image {sample_img} must exist")
        success = run_persistence_manual_test(sample_img)
        self.assertTrue(success)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_path = Path(sys.argv[1])
    else:
        target_path = Path(__file__).parent / "test_product.jpg"

    if not target_path.exists():
        print(f"Error: Target image file not found at {target_path}")
        sys.exit(1)

    ok = run_persistence_manual_test(target_path)
    sys.exit(0 if ok else 1)
