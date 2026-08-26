"""Image enhancement orchestration module for artisan product studio.

Coordinates uploading original images to Cloudinary, applying AI background
removal, auto-enhancement, visual filters, customizable studio backdrops,
3D shadows, aspect ratio framing, and OpenCV multi-stage computer vision processing.
"""

import logging
import urllib.request
from typing import Dict, Any, Optional, Union, BinaryIO
import cv2
import numpy as np

from ai.vision.config import configure_cloudinary
from ai.vision.cloudinary_service import upload_image, validate_image_file
from ai.vision.pipeline import process_artisan_image
from ai.vision.transformations import (
    get_original_url,
    get_background_removed_url,
    get_enhanced_url,
    get_ecommerce_base_url,
    get_final_product_url,
    get_studio_product_url,
    ASPECT_RATIOS,
    STUDIO_PRESETS,
    CATEGORY_DEFAULTS,
    FILTER_PRESETS,
)

logger = logging.getLogger(__name__)

# Ensure Cloudinary is initialized
configure_cloudinary()


def enhance_product_image(
    image_path: str,
    category: str = "general",
    preset: Optional[str] = None,
    aspect_ratio: Optional[str] = None,
    add_shadow: Optional[bool] = None,
    filter_name: Optional[str] = None,
    enable_enhancement: bool = True,
) -> Dict[str, Any]:
    """
    Execute end-to-end artisan image studio enhancement pipeline from a local file path.
    """
    validate_image_file(image_path)

    upload_result = upload_image(image_path)
    public_id = upload_result["public_id"]

    return build_enhancement_result(
        public_id=public_id,
        upload_meta=upload_result,
        category=category,
        preset=preset,
        aspect_ratio=aspect_ratio,
        add_shadow=add_shadow,
        filter_name=filter_name,
        enable_enhancement=enable_enhancement,
    )


def enhance_product_image_stream(
    file_stream: Union[BinaryIO, bytes],
    filename: Optional[str] = None,
    category: str = "general",
    preset: Optional[str] = None,
    aspect_ratio: Optional[str] = None,
    add_shadow: Optional[bool] = None,
    filter_name: Optional[str] = None,
    enable_enhancement: bool = True,
) -> Dict[str, Any]:
    """
    Execute end-to-end studio enhancement pipeline from an in-memory stream (FastAPI UploadFile).
    """
    upload_result = upload_image(file_stream, filename=filename)
    public_id = upload_result["public_id"]

    return build_enhancement_result(
        public_id=public_id,
        upload_meta=upload_result,
        category=category,
        preset=preset,
        aspect_ratio=aspect_ratio,
        add_shadow=add_shadow,
        filter_name=filter_name,
        enable_enhancement=enable_enhancement,
    )


def enhance_with_opencv_studio(
    public_id: str,
    category: str = "general",
    preset: str = "warm_neutral",
    add_shadow: bool = True,
) -> Dict[str, Any]:
    """
    Execute deep 14-stage OpenCV pipeline on the background-removed PNG from Cloudinary,
    and upload the master enhanced 1080x1080 result back to Cloudinary.
    """
    import cloudinary.utils

    # 1. Fetch background-removed PNG from Cloudinary
    bg_removed_png_url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        transformation=[
            {"effect": "background_removal"},
            {"fetch_format": "png"}
        ],
        secure=True,
    )

    req = urllib.request.Request(bg_removed_png_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as res:
        img_bytes = res.read()

    nparr = np.frombuffer(img_bytes, np.uint8)
    img_bgra = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

    # 2. Process through 14-stage OpenCV pipeline
    cv_result = process_artisan_image(
        input_image_bgra=img_bgra,
        canvas_size=(1080, 1080),
        background_color=preset,
        add_shadow=add_shadow,
    )

    # 3. Encode to JPEG buffer and upload master back to Cloudinary
    _, encoded_jpg = cv2.imencode(".jpg", cv_result["enhanced_image"], [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    upload_res = upload_image(encoded_jpg.tobytes(), folder="artisan-ai/opencv-studio")

    return {
        "success": True,
        "master_opencv_url": upload_res["secure_url"],
        "public_id": upload_res["public_id"],
        "dimensions": [1080, 1080],
        "stages_applied": [
            "Alpha Mask Extraction",
            "Auto-Crop 10% Margin",
            "Conservative White-Balance",
            "Adaptive Gamma Luminance Lift",
            "LAB L-Channel CLAHE Local Contrast",
            "Bilateral Denoising",
            "Unsharp Mask Detail Recovery",
            "Adaptive Saturation Normalization",
            "3D Floor Shadow Synthesis",
            "1080x1080 Studio Canvas Compositing",
        ],
    }


def enhance_from_public_id(
    public_id: str,
    category: str = "general",
    preset: Optional[str] = None,
    aspect_ratio: Optional[str] = None,
    add_shadow: Optional[bool] = None,
    filter_name: Optional[str] = None,
    enable_enhancement: bool = True,
) -> Dict[str, Any]:
    """
    Generate studio enhancement pipeline URLs for an existing Cloudinary asset.
    """
    return build_enhancement_result(
        public_id=public_id,
        upload_meta=None,
        category=category,
        preset=preset,
        aspect_ratio=aspect_ratio,
        add_shadow=add_shadow,
        filter_name=filter_name,
        enable_enhancement=enable_enhancement,
    )


def build_enhancement_result(
    public_id: str,
    upload_meta: Optional[Dict[str, Any]] = None,
    category: str = "general",
    preset: Optional[str] = None,
    aspect_ratio: Optional[str] = None,
    add_shadow: Optional[bool] = None,
    filter_name: Optional[str] = None,
    enable_enhancement: bool = True,
) -> Dict[str, Any]:
    """Construct structured response with all transformed URLs and fallback status."""
    cat_clean = category.lower() if category else "general"
    category_info = CATEGORY_DEFAULTS.get(cat_clean, CATEGORY_DEFAULTS["general"])

    final_preset = preset.lower() if preset else category_info["preset"]
    final_ratio = aspect_ratio.lower() if aspect_ratio else category_info["aspect_ratio"]
    shadow_applied = category_info["add_shadow"] if add_shadow is None else add_shadow
    final_filter = filter_name.lower() if filter_name else category_info.get("default_filter")

    preset_info = STUDIO_PRESETS.get(final_preset, STUDIO_PRESETS["ecommerce_white"])
    width, height = ASPECT_RATIOS.get(final_ratio, ASPECT_RATIOS["square_1x1"])

    original_url = upload_meta["secure_url"] if upload_meta else get_original_url(public_id)
    bg_removed_url = get_background_removed_url(public_id)
    enhanced_url = get_enhanced_url(public_id)

    # Primary final studio catalog URL
    studio_url = get_studio_product_url(
        public_id=public_id,
        category=cat_clean,
        preset=final_preset,
        aspect_ratio=final_ratio,
        add_shadow=shadow_applied,
        filter_name=final_filter,
        enhance=enable_enhancement,
    )

    # Standard fallback base URL
    fallback_url = get_ecommerce_base_url(
        public_id=public_id,
        width=width,
        height=height,
        background="white",
    )

    return {
        "success": True,
        "original": {
            "public_id": public_id,
            "url": original_url,
            "width": upload_meta.get("width") if upload_meta else None,
            "height": upload_meta.get("height") if upload_meta else None,
            "format": upload_meta.get("format") if upload_meta else None,
        },
        "processed": {
            "background_removed_url": bg_removed_url,
            "enhanced_url": enhanced_url,
            "fallback_url": fallback_url,
            "final_url": studio_url,
        },
        "processing": {
            "background_removed": True,
            "enhanced": enable_enhancement,
            "filter_applied": final_filter,
            "shadow_applied": shadow_applied,
            "resized": True,
            "optimized": True,
        },
        "metadata": {
            "category": cat_clean,
            "preset": final_preset,
            "preset_name": preset_info["name"],
            "filter": final_filter,
            "filter_name": FILTER_PRESETS.get(final_filter, {}).get("name") if final_filter else "Standard Auto-Enhance",
            "aspect_ratio": final_ratio,
            "width": width,
            "height": height,
            "format": preset_info["format"],
        },
    }
