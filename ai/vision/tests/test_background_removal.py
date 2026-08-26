from ai.vision.transformations import get_background_removed_url


PUBLIC_ID = "artisan-ai/originals/ajec1k2rjqxyfppf80g7"


def main():
    print("Starting background removal test...")

    print("Public ID:")
    print(PUBLIC_ID)

    url = get_background_removed_url(PUBLIC_ID)

    print("\n========== BACKGROUND REMOVAL ==========")
    print("Generated URL:")
    print(url)
    print("========================================")


if __name__ == "__main__":
    main()