"""Pydantic schemas for AI Studio enhancement API."""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ImageAssetResponse(BaseModel):
    """Client-facing metadata for an image asset stored in Cloudinary."""
    public_id: str = Field(..., description="Cloudinary public ID / asset identifier")
    secure_url: str = Field(..., description="HTTPS delivery URL for the asset")
    width: int = Field(..., description="Width of the asset in pixels")
    height: int = Field(..., description="Height of the asset in pixels")
    format: str = Field(..., description="Image format extension (e.g. jpg, png, webp)")
    bytes: int = Field(..., description="File size in bytes")
    created_at: Optional[str] = Field(None, description="ISO timestamp or creation date")


class StudioEnhanceResponse(BaseModel):
    """Client-facing contract for Studio image enhancement output."""
    success: bool = Field(..., description="Whether the studio enhancement succeeded")
    provider: str = Field("cloudinary", description="Underlying studio engine provider")
    original: Optional[ImageAssetResponse] = Field(None, description="Raw original product asset")
    cutout: Optional[ImageAssetResponse] = Field(None, description="Isolated transparent cutout product asset")
    enhanced: Optional[ImageAssetResponse] = Field(None, description="Final studio-composed asset")
    category: str = Field("general", description="Artisan craft category")
    preset: str = Field("ecommerce_white", description="Studio backdrop preset used")
    aspect_ratio: str = Field("square_1x1", description="Canvas aspect ratio used")
    shadow_enabled: bool = Field(True, description="Whether contact drop shadow was applied")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Pipeline telemetry and timing parameters")
    error: Optional[str] = Field(None, description="Error description if processing failed")
    error_code: Optional[str] = Field(None, description="Standardized error code")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field("ok", description="Server operational status")
