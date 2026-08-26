"""Cloudinary upload service for original artisan product images.

Supports uploading from:
- Local filesystem paths (str)
- In-memory file streams (BinaryIO / BytesIO / SpooledTemporaryFile) from FastAPI
- Raw byte buffers (bytes)
"""

import os
from typing import Dict, Any, Union, BinaryIO, Optional
import cloudinary.uploader

from ai.vision.config import configure_cloudinary

# Ensure Cloudinary is initialized
configure_cloudinary()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def validate_image_extension(filename: str) -> None:
    """Validate that the filename has a supported image extension."""
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported image format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )


def validate_image_file(file_path: str) -> None:
    """Validate that the local file exists and has a supported image extension."""
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"Image file not found: {file_path}")
    validate_image_extension(file_path)


def upload_image(
    file_input: Union[str, BinaryIO, bytes],
    folder: str = "artisan-ai/originals",
    filename: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Upload an artisan product image to Cloudinary storage.

    Parameters:
        file_input: Local file path string, in-memory file stream, or raw bytes.
        folder: Cloudinary destination folder (default: 'artisan-ai/originals').
        filename: Optional filename for extension validation when streaming.

    Returns:
        Dictionary containing public_id, secure_url, width, height, and format.
    """
    if isinstance(file_input, str):
        validate_image_file(file_input)
    elif filename:
        validate_image_extension(filename)

    result = cloudinary.uploader.upload(
        file_input,
        folder=folder,
        resource_type="image",
    )

    return {
        "public_id": result["public_id"],
        "secure_url": result["secure_url"],
        "width": result.get("width"),
        "height": result.get("height"),
        "format": result.get("format"),
        "bytes": result.get("bytes"),
    }