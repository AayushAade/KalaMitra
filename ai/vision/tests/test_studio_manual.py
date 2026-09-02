"""Manual developer test utility for Phase 3B Studio Composition Layer.

Usage:
    .venv/Scripts/python.exe ai/vision/tests/test_studio_manual.py [cutout_public_id_or_image_path]

Generates studio presentations for the 4 core backdrops:
- ecommerce_white
- warm_neutral
- minimal_grey
- terracotta_sand

Requires CLOUDINARY_* environment variables.
Does NOT execute automatically during automated CI runs unless LIVE_STUDIO_TEST=true.
"""

import os
from pathlib import Path
import sys
import unittest

# Ensure repo root is on sys.path
_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from ai.vision.schemas import ImageAsset
from ai.vision.studio import StudioComposer


def run_studio_manual_test(target_input: str) -> bool:
    """Execute live Studio Composition test across all backdrop presets."""
    print("=" * 70)
    print("KalaMitra — Phase 3B: Studio Background Composition & Framing")
    print("=" * 70)

    # Check Cloudinary credentials
    for var in ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"):
        if not os.getenv(var):
            print(f"[ERROR] Missing {var} in environment or .env file.")
            return False

    composer = StudioComposer()

    # If target_input is an existing local image file, run end-to-end pipeline first
    target_path = Path(target_input)
    if target_path.exists() and target_path.is_file():
        print(f"Local Image Provided : {target_path}")
        print("Running end-to-end studio pipeline...")
        result = composer.process_studio_pipeline(
            image_input=target_path,
            category="pottery",
            preset="warm_neutral",
            aspect_ratio="square_1x1",
            add_shadow=True,
        )
        if not result.success or not result.cutout:
            print(f"[FAILED] End-to-end execution failed: {result.error}")
            return False
        cutout_asset = result.cutout
        original_asset = result.original
        print(f"Generated Cutout Asset: {cutout_asset.public_id}")
    else:
        # Assume target_input is a Cloudinary cutout public ID
        cutout_public_id = target_input
        print(f"Cutout Public ID Provided : {cutout_public_id}")
        cutout_asset = composer.cloudinary.get_asset_metadata(cutout_public_id)
        if not cutout_asset:
            # Create synthetic cutout ImageAsset for URL generation/upload
            cutout_asset = ImageAsset(
                public_id=cutout_public_id,
                secure_url=f"https://res.cloudinary.com/{os.getenv('CLOUDINARY_CLOUD_NAME')}/image/upload/{cutout_public_id}.png",
                width=1080,
                height=1080,
                format="png",
                bytes=100000,
            )
        original_asset = None

    presets_to_test = [
        ("ecommerce_white", "square_1x1", True),
        ("warm_neutral", "square_1x1", True),
        ("minimal_grey", "square_1x1", True),
        ("terracotta_sand", "square_1x1", True),
    ]

    print("\n" + "-" * 50)
    print("Generating Studio Backdrop Compositions")
    print("-" * 50)

    for preset_name, aspect_ratio, add_shadow in presets_to_test:
        print(f"\n[Preset: {preset_name.upper()}]")
        print(f"  Aspect Ratio   : {aspect_ratio}")
        print(f"  Contact Shadow : {add_shadow}")

        # 1. Dynamic Delivery URL
        studio_url = composer.generate_studio_url(
            cutout_public_id=cutout_asset.public_id,
            preset=preset_name,
            aspect_ratio=aspect_ratio,
            add_shadow=add_shadow,
        )
        print(f"  Dynamic URL    : {studio_url}")

        # 2. Upload persistent studio presentation to artisan-ai/enhanced/
        res = composer.compose_studio_image(
            cutout=cutout_asset,
            original=original_asset,
            category="general",
            preset=preset_name,
            aspect_ratio=aspect_ratio,
            add_shadow=add_shadow,
        )

        if res.success and res.enhanced:
            print(f"  Persistent ID  : {res.enhanced.public_id}")
            print(f"  Secure URL     : {res.enhanced.secure_url}")
            print(f"  Dimensions     : {res.enhanced.width} x {res.enhanced.height} px")
            print(f"  Format         : {res.enhanced.format}")
            print(f"  Status         : SUCCESS")
        else:
            print(f"  Status         : FAILED ({res.error})")
            return False

    print("\n" + "=" * 70)
    print("[SUCCESS] All 4 studio backdrop presentations generated successfully!")
    print("=" * 70)
    return True


class TestStudioLiveIntegration(unittest.TestCase):
    """Live integration test suite skipped by default unless LIVE_STUDIO_TEST=true."""

    @unittest.skipUnless(
        os.getenv("LIVE_STUDIO_TEST") == "true",
        "Set LIVE_STUDIO_TEST=true to run live studio integration tests",
    )
    def test_live_studio_compositions(self):
        sample_img = Path(__file__).parent / "test_product.jpg"
        self.assertTrue(sample_img.exists(), f"Sample image {sample_img} must exist")
        success = run_studio_manual_test(str(sample_img))
        self.assertTrue(success)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = sys.argv[1]
    else:
        # Default to existing verified cutout or sample image
        target = "artisan-ai/cutouts/a1iu31xxtnf6m6vgz6ju"

    ok = run_studio_manual_test(target)
    sys.exit(0 if ok else 1)
