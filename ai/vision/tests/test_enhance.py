from ai.vision.transformations import get_enhanced_url


PUBLIC_ID = "artisan-ai/originals/ajec1k2rjqxyfppf80g7"


def main():
    print("Testing auto enhancement...")

    url = get_enhanced_url(PUBLIC_ID)

    print("\n========== AUTO ENHANCE ==========")
    print(url)
    print("==================================")


if __name__ == "__main__":
    main()