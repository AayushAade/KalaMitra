from ai.vision.transformations import get_background_removed_url


PUBLIC_ID = "artisan-ai/originals/ajec1k2rjqxyfppf80g7"


def main():
    print("Testing background removal...")

    url = get_background_removed_url(PUBLIC_ID)

    print("\nURL:")
    print(url)


if __name__ == "__main__":
    main()