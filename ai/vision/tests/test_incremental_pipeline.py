import urllib.request
import urllib.error
import cloudinary
import cloudinary.utils
from ai.vision.config import configure_cloudinary

configure_cloudinary()

PUBLIC_ID = "artisan-ai/originals/ajec1k2rjqxyfppf80g7"


def check_url(name: str, url: str) -> bool:
    print(f"\n--- Testing: {name} ---")
    print(f"URL: {url}")
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            status = response.status
            cld_error = response.headers.get("x-cld-error", "None")
            print(f"Status: {status} OK | Cloudinary Error Header: {cld_error}")
            return True
    except urllib.error.HTTPError as e:
        cld_error = e.headers.get("x-cld-error", "None")
        print(f"Status: {e.code} FAILED | Cloudinary Error Header: {cld_error}")
        if e.code == 423:
            print("Note: 423 means Cloudinary AI processing is in progress for this new derivation.")
        return False
    except Exception as e:
        print(f"Request error: {e}")
        return False


def main():
    print("==================================================")
    print("   INCREMENTAL CLOUDINARY TRANSFORMATION TEST     ")
    print("==================================================")
    print(f"Asset Public ID: {PUBLIC_ID}\n")

    # Stage 1: Original asset URL
    url_orig, _ = cloudinary.utils.cloudinary_url(PUBLIC_ID, secure=True)
    check_url("Stage 1: Original Image", url_orig)

    # Stage 2: Background Removal alone
    url_bg, _ = cloudinary.utils.cloudinary_url(
        PUBLIC_ID,
        effect="background_removal",
        secure=True
    )
    check_url("Stage 2: Background Removal alone", url_bg)

    # Stage 3: Auto enhance alone
    url_enh, _ = cloudinary.utils.cloudinary_url(
        PUBLIC_ID,
        effect="auto_enhance",
        secure=True
    )
    check_url("Stage 3: Auto Enhance alone", url_enh)

    # Stage 4: Background Removal + Pad 1080x1080
    url_bg_pad, _ = cloudinary.utils.cloudinary_url(
        PUBLIC_ID,
        transformation=[
            {"effect": "background_removal"},
            {"width": 1080, "height": 1080, "crop": "pad"}
        ],
        secure=True
    )
    check_url("Stage 4: Background Removal + Pad 1080x1080", url_bg_pad)

    # Stage 5: Background Removal + Pad 1080x1080 + White Background
    url_bg_pad_white, _ = cloudinary.utils.cloudinary_url(
        PUBLIC_ID,
        transformation=[
            {"effect": "background_removal"},
            {"width": 1080, "height": 1080, "crop": "pad", "background": "white"}
        ],
        secure=True
    )
    check_url("Stage 5: Background Removal + Pad 1080x1080 + White Background", url_bg_pad_white)

    # Stage 6: Background Removal + Auto Enhance
    url_bg_enh, _ = cloudinary.utils.cloudinary_url(
        PUBLIC_ID,
        transformation=[
            {"effect": "background_removal"},
            {"effect": "auto_enhance"}
        ],
        secure=True
    )
    check_url("Stage 6: Background Removal + Auto Enhance", url_bg_enh)

    # Stage 7: get_final_product_url transformation chain
    from ai.vision.transformations import get_final_product_url
    url_final = get_final_product_url(PUBLIC_ID)
    check_url("Stage 7: get_final_product_url chain", url_final)

    # Stage 8: Alternative Chained structure test (e.g. improve vs auto_enhance, or ordering)
    url_alt_improve, _ = cloudinary.utils.cloudinary_url(
        PUBLIC_ID,
        transformation=[
            {"effect": "background_removal"},
            {"effect": "improve"},
            {"width": 1080, "height": 1080, "crop": "pad", "background": "white"},
            {"fetch_format": "auto", "quality": "auto"}
        ],
        secure=True
    )
    check_url("Stage 8: Alt - Background Removal + Improve + Pad + f_auto/q_auto", url_alt_improve)


if __name__ == "__main__":
    main()
