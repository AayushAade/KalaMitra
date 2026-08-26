from ai.vision.cloudinary_service import upload_image


IMAGE_PATH = "ai/vision/tests/test_product.jpg"


def main():
    print("Starting Cloudinary upload...")

    result = upload_image(IMAGE_PATH)

    print("\n========== CLOUDINARY ==========")
    print("Public ID:", result["public_id"])
    print("URL:", result["secure_url"])
    print("Dimensions:", result["width"], "x", result["height"])
    print("Format:", result["format"])
    print("================================\n")


if __name__ == "__main__":
    main()
    