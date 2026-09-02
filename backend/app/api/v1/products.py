"""Product Image Enhancement API Router.

Implements the official endpoint for the AI Artisan Product Photography Studio:
POST /api/products/image-enhance and POST /api/v1/products/image-enhance
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from backend.app.services.image_processing import (
    ImageProcessingService,
    get_image_processing_service,
)

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/octet-stream",
}


class ProductImageEnhanceResponse(BaseModel):
    """Standardized response schema for AI Product Photography Studio."""
    success: bool = Field(..., description="Whether enhancement succeeded.")
    imageUrl: Optional[str] = Field(None, description="URL of final professional catalogue asset.")
    originalImageUrl: Optional[str] = Field(None, description="URL of immutable original photo.")
    publicId: Optional[str] = Field(None, description="Storage asset identifier.")
    provider: str = Field(..., description="Active engine: VERTEX_AI or LOCAL_FALLBACK.")
    fallbackUsed: bool = Field(False, description="Whether fallback engine was used.")
    category: str = Field(..., description="Resolved artisan craft category.")
    style: str = Field(..., description="Applied e-commerce visual presentation style.")
    executionTimeMs: float = Field(0.0, description="Processing duration in milliseconds.")
    telemetry: Dict[str, Any] = Field(default_factory=dict, description="Pipeline diagnostic details.")
    error: Optional[str] = Field(None, description="Error message if enhancement failed.")
    error_code: Optional[str] = Field(None, description="Structured error code.")


@router.post(
    "/image-enhance",
    response_model=ProductImageEnhanceResponse,
    summary="Enhance Product Photograph into Professional E-Commerce Catalogue Photo",
    description="Transforms an ordinary artisan smartphone photo into a luxury e-commerce catalogue asset using Vertex AI Gemini Image Editing with deterministic local fallback.",
)
async def enhance_product_image(
    image: UploadFile = File(..., description="Raw product photograph (JPEG, PNG, WebP)"),
    productCategory: Optional[str] = Form(None, description="Craft category: JEWELLERY, POTTERY, TEXTILE, CLOTHING, etc."),
    productName: Optional[str] = Form(None, description="Product title / name for context-aware staging"),
    productDescription: Optional[str] = Form(None, description="Product description / material details"),
    style: Optional[str] = Form(None, description="Visual style: CLEAN_ECOMMERCE, LUXURY_STUDIO, INDIAN_HERITAGE, NATURAL_ARTISAN"),
    service: ImageProcessingService = Depends(get_image_processing_service),
) -> ProductImageEnhanceResponse:
    """Execute complete AI Product Photography Studio transformation."""
    # 1. Basic Content Type check
    if image.content_type and image.content_type.lower() not in ALLOWED_MIME_TYPES:
        if not image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{image.content_type}'. Please upload an image (JPEG, PNG, WebP).",
            )

    # 2. Read bytes
    try:
        image_bytes = await image.read()
    except Exception as read_err:
        logger.error("Failed to read uploaded image stream: %s", read_err)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read the uploaded image payload.",
        )

    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    # 3. Execute Image Processing Pipeline
    result = service.enhance_artisan_product_image(
        image_input=image_bytes,
        product_category=productCategory,
        product_name=productName,
        product_description=productDescription,
        style=style,
        aspect_ratio="1:1",
    )

    if not result.get("success"):
        error_code = result.get("error_code", "ENHANCEMENT_FAILED")
        if error_code == "VALIDATION_ERROR":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Image validation failed."),
            )
        # Return structured error response
        return ProductImageEnhanceResponse(
            success=False,
            imageUrl=None,
            originalImageUrl=result.get("originalImageUrl"),
            provider=result.get("provider", "NONE"),
            fallbackUsed=result.get("fallbackUsed", True),
            category=result.get("category", "GENERIC_HANDICRAFT"),
            style=result.get("style", "CLEAN_ECOMMERCE"),
            executionTimeMs=result.get("executionTimeMs", 0.0),
            telemetry=result.get("telemetry", {}),
            error=result.get("error"),
            error_code=error_code,
        )

    return ProductImageEnhanceResponse(
        success=True,
        imageUrl=result.get("imageUrl"),
        originalImageUrl=result.get("originalImageUrl"),
        publicId=result.get("publicId"),
        provider=result.get("provider", "VERTEX_AI"),
        fallbackUsed=result.get("fallbackUsed", False),
        category=result.get("category", "GENERIC_HANDICRAFT"),
        style=result.get("style", "CLEAN_ECOMMERCE"),
        executionTimeMs=result.get("executionTimeMs", 0.0),
        telemetry=result.get("telemetry", {}),
    )
