"""API router for AI Studio vision operations."""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from backend.app.schemas.studio import StudioEnhanceResponse
from backend.app.services.vision_service import VisionService, get_vision_service

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "application/octet-stream",  # Mobile clients sometimes send binary stream
}


@router.post(
    "/enhance",
    response_model=StudioEnhanceResponse,
    summary="Enhance Artisan Product Photo",
    description="Processes raw product photos through AI lighting correction, super-resolution, background isolation, and studio backdrop composition.",
)
async def enhance_studio_image(
    image: UploadFile = File(..., description="Raw artisan product image file"),
    category: str = Form("general", description="Craft category: pottery, textiles, wooden_crafts, jewellery, general"),
    preset: Optional[str] = Form(None, description="Studio backdrop preset: ecommerce_white, warm_neutral, terracotta_sand, minimal_grey, transparent_png"),
    aspect_ratio: Optional[str] = Form(None, description="Canvas aspect ratio: square_1x1, portrait_4x5, portrait_9x16, landscape_16x9"),
    add_shadow: Optional[bool] = Form(None, description="Apply contact shadow (default True for non-transparent presets)"),
    quality_mode: str = Form("auto", description="Processing engine mode ('auto', 'local_ai', 'cloud')"),
    upscale_factor: int = Form(2, description="Super-resolution upscale factor (2 or 4)"),
    enable_lighting_correction: bool = Form(True, description="Enable CLAHE lighting and color balance correction"),
    enable_super_resolution: bool = Form(True, description="Enable pixel super-resolution restoration"),
    enable_quality_enhancement: bool = Form(True, description="Master quality engine toggle"),
    service: VisionService = Depends(get_vision_service),
) -> StudioEnhanceResponse:
    """Handle multipart image upload and execute the AI vision studio pipeline."""
    # 1. Validate content type if declared
    if image.content_type and image.content_type.lower() not in ALLOWED_IMAGE_CONTENT_TYPES:
        if not image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{image.content_type}'. Please upload an image (JPEG, PNG, WebP).",
            )

    # 2. Validate upscale factor
    if upscale_factor not in (2, 4):
        raise HTTPException(
            status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422),
            detail=f"Invalid upscale_factor {upscale_factor}. Supported values are 2 or 4.",
        )

    # 3. Read image payload
    try:
        image_bytes = await image.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded image stream: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read the uploaded image payload.",
        )

    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    # 4. Verify genuine image structure
    is_valid, error_msg, _ = service.validate_image_bytes(image_bytes)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg or "Uploaded file is not a valid image.",
        )

    # 5. Execute vision service pipeline
    result = service.enhance_studio_image(
        image_bytes=image_bytes,
        category=category,
        preset=preset,
        aspect_ratio=aspect_ratio,
        add_shadow=add_shadow,
        quality_mode=quality_mode,
        upscale_factor=upscale_factor,
        enable_lighting_correction=enable_lighting_correction,
        enable_super_resolution=enable_super_resolution,
        enable_quality_enhancement=enable_quality_enhancement,
        tags=["fastapi_backend", f"cat_{category}"],
    )

    return result
