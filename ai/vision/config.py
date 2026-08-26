import os

import cloudinary
from dotenv import load_dotenv


load_dotenv()


class CloudinaryConfigError(Exception):
    """Raised when required Cloudinary environment variables are missing."""
    pass


def configure_cloudinary() -> None:
    """Load environment variables and initialize Cloudinary configuration."""
    load_dotenv()

    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    missing = []
    if not cloud_name:
        missing.append("CLOUDINARY_CLOUD_NAME")
    if not api_key:
        missing.append("CLOUDINARY_API_KEY")
    if not api_secret:
        missing.append("CLOUDINARY_API_SECRET")

    if missing:
        raise CloudinaryConfigError(
            f"Missing required Cloudinary environment variables: {', '.join(missing)}. "
            "Please check your .env file."
        )

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )