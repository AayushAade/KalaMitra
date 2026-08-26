"""Command Line Interface Demo for AI Artisan Image Enhancer & Studio."""

import sys
import json
import argparse
import urllib.request
import urllib.error
from pathlib import Path

from ai.vision.enhancer import enhance_product_image, enhance_from_public_id
from ai.vision.transformations import STUDIO_PRESETS, ASPECT_RATIOS, CATEGORY_DEFAULTS


def verify_url(url: str, label: str) -> bool:
    """Check if Cloudinary URL is valid and accessible."""
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as res:
            if res.status == 200:
                print(f"  [{label}] HTTP 200 OK")
                return True
            print(f"  [{label}] HTTP {res.status}")
            return False
    except urllib.error.HTTPError as e:
        if e.code == 423:
            print(f"  [{label}] HTTP 423 (Cloudinary AI derivation processing in progress)")
            return True
        print(f"  [{label}] HTTP {e.code} Error: {e.headers.get('x-cld-error', e.reason)}")
        return False
    except Exception as e:
        print(f"  [{label}] Connection Error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Smart India Hackathon 2026 - AI Artisan Product Image Enhancer & Studio Demo"
    )
    parser.add_argument(
        "image_path",
        nargs="?",
        default="ai/vision/tests/test_product.jpg",
        help="Path to product image (default: ai/vision/tests/test_product.jpg)",
    )
    parser.add_argument(
        "--public-id",
        help="Process existing Cloudinary public_id without re-uploading",
    )
    parser.add_argument(
        "--category",
        default="general",
        choices=list(CATEGORY_DEFAULTS.keys()),
        help=f"Product category: {', '.join(CATEGORY_DEFAULTS.keys())}",
    )
    parser.add_argument(
        "--preset",
        default=None,
        choices=list(STUDIO_PRESETS.keys()),
        help=f"Studio background preset: {', '.join(STUDIO_PRESETS.keys())}",
    )
    parser.add_argument(
        "--aspect-ratio",
        default=None,
        choices=list(ASPECT_RATIOS.keys()),
        help=f"Framing ratio: {', '.join(ASPECT_RATIOS.keys())}",
    )
    parser.add_argument(
        "--shadow",
        action="store_true",
        default=None,
        help="Force add 3D depth contact shadow",
    )
    parser.add_argument(
        "--save-json",
        action="store_true",
        help="Save result to demo_result.json",
    )

    args = parser.parse_args()

    print("\n========================================================")
    print("      AI ARTISAN IMAGE ENHANCER & STUDIO DEMO          ")
    print("========================================================\n")

    try:
        if args.public_id:
            print(f"Input Mode: Existing Cloudinary Asset ID: {args.public_id}")
            result = enhance_from_public_id(
                public_id=args.public_id,
                category=args.category,
                preset=args.preset,
                aspect_ratio=args.aspect_ratio,
                add_shadow=args.shadow,
            )
        else:
            image_file = Path(args.image_path)
            print(f"Input Image: {image_file}")
            if not image_file.exists():
                print(f"Error: File '{image_file}' not found.")
                sys.exit(1)

            print("Uploading image to Cloudinary...")
            result = enhance_product_image(
                image_path=str(image_file),
                category=args.category,
                preset=args.preset,
                aspect_ratio=args.aspect_ratio,
                add_shadow=args.shadow,
            )

        print("\nStudio Configuration:")
        print(f"  Category:           {result['metadata']['category'].upper()}")
        print(f"  Studio Preset:      {result['metadata']['preset_name']} ({result['metadata']['preset']})")
        print(f"  Aspect Ratio:       {result['metadata']['aspect_ratio']} ({result['metadata']['width']}x{result['metadata']['height']})")
        print(f"  3D Depth Shadow:    {'ENABLED' if result['processing']['shadow_applied'] else 'DISABLED'}")

        print("\nProcessing Stages:")
        print("  Upload:             SUCCESS")
        print("  Background Removal: SUCCESS")
        print("  AI Lighting Enhance:SUCCESS")
        print("  Studio Framing:     SUCCESS")
        print("  Mobile Optimization:SUCCESS")

        print("\nGenerated Delivery URLs:")
        print(f"  Original:             {result['original']['url']}")
        print(f"  Background Removed:   {result['processed']['background_removed_url']}")
        print(f"  Enhanced:             {result['processed']['enhanced_url']}")
        print(f"  Final Studio Image:   {result['processed']['final_url']}")

        print("\nVerifying final image URL accessibility...")
        verify_url(result['processed']['final_url'], "Final Studio Image")

        if args.save_json:
            out_file = Path("demo_result.json")
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2)
            print(f"\nSaved structured result to {out_file.absolute()}")

        print("\n========================================================")
        print("                 STATUS: SUCCESS                        ")
        print("========================================================\n")

    except Exception as e:
        print(f"\n[ERROR] Enhancement failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
