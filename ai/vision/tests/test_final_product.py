import urllib.request
import urllib.error
from ai.vision.transformations import get_final_product_url

PUBLIC_ID = "artisan-ai/originals/ajec1k2rjqxyfppf80g7"


def main():
    print("Generating final e-commerce image...")

    url = get_final_product_url(PUBLIC_ID)

    print("\n========== FINAL PRODUCT ==========")
    print("URL:")
    print(url)
    print("===================================")

    print("\nValidating URL accessibility...")
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as res:
            print(f"HTTP Status: {res.status} OK")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.headers.get('x-cld-error', e.reason)}")
    except Exception as e:
        print(f"Validation error: {e}")


if __name__ == "__main__":
    main()