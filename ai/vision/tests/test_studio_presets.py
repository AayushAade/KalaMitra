import urllib.request
import urllib.error
import cloudinary.utils
from ai.vision.config import configure_cloudinary

configure_cloudinary()

PUBLIC_ID = "artisan-ai/originals/ajec1k2rjqxyfppf80g7"


def check(name, url):
    print(f"\n--- Testing {name} ---")
    print(f"URL: {url}")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as res:
            print(f"Status: {res.status} OK")
            return True
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code} Error: {e.headers.get('x-cld-error', e.reason)}")
        return False


def test_presets():
    # 1. Square (1:1) White E-commerce
    url1, _ = cloudinary.utils.cloudinary_url(
        PUBLIC_ID,
        transformation=[
            {"effect": "background_removal"},
            {"effect": "auto_enhance"},
            {"width": 1080, "height": 1080, "crop": "pad", "background": "white"},
            {"fetch_format": "auto", "quality": "auto"}
        ],
        secure=True
    )
    check("1. Square 1:1 White E-commerce", url1)

    # 2. Portrait (4:5) for Textiles / Sarees (1080x1350)
    url2, _ = cloudinary.utils.cloudinary_url(
        PUBLIC_ID,
        transformation=[
            {"effect": "background_removal"},
            {"effect": "auto_enhance"},
            {"width": 1080, "height": 1350, "crop": "pad", "background": "white"},
            {"fetch_format": "auto", "quality": "auto"}
        ],
        secure=True
    )
    check("2. Portrait 4:5 for Textiles (1080x1350)", url2)

    # 3. Warm Neutral Studio Background (rgb:F7F4EE)
    url3, _ = cloudinary.utils.cloudinary_url(
        PUBLIC_ID,
        transformation=[
            {"effect": "background_removal"},
            {"effect": "auto_enhance"},
            {"width": 1080, "height": 1080, "crop": "pad", "background": "rgb:F7F4EE"},
            {"fetch_format": "auto", "quality": "auto"}
        ],
        secure=True
    )
    check("3. Warm Neutral Studio (rgb:F7F4EE)", url3)

    # 4. Shadow / Depth Effect with Background
    url4, _ = cloudinary.utils.cloudinary_url(
        PUBLIC_ID,
        transformation=[
            {"effect": "background_removal"},
            {"effect": "shadow:40", "color": "rgb:202020", "x": 0, "y": 15},
            {"effect": "auto_enhance"},
            {"width": 1080, "height": 1080, "crop": "pad", "background": "rgb:F5F5F7"},
            {"fetch_format": "auto", "quality": "auto"}
        ],
        secure=True
    )
    check("4. Shadow with Minimal Studio Background", url4)

    # 5. Transparent PNG for Catalog Cutouts
    url5, _ = cloudinary.utils.cloudinary_url(
        PUBLIC_ID,
        transformation=[
            {"effect": "background_removal"},
            {"effect": "auto_enhance"},
            {"width": 1080, "height": 1080, "crop": "pad"},
            {"fetch_format": "png", "quality": "auto"}
        ],
        secure=True
    )
    check("5. Transparent PNG Cutout (1080x1080)", url5)


if __name__ == "__main__":
    test_presets()
