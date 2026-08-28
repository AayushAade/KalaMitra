"""Image asset and processing result schemas for AI Vision module."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ImageAsset(BaseModel):
    """Metadata for an image asset stored in Cloudinary."""
    public_id: str = Field(..., description="Cloudinary public ID / asset identifier")
    secure_url: str = Field(..., description="HTTPS delivery URL for the asset")
    width: int = Field(..., description="Width of the asset in pixels")
    height: int = Field(..., description="Height of the asset in pixels")
    format: str = Field(..., description="Image format extension (e.g. jpg, png, webp)")
    bytes: int = Field(..., description="File size in bytes")
    created_at: Optional[str] = Field(None, description="ISO timestamp or creation date")


class QualityAnalysisResult(BaseModel):
    """Result of automated image quality analysis and enhancement recommendation."""
    quality_tier: str = Field(..., description="Classified quality tier: 'high', 'medium', or 'poor'")
    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")
    megapixels: float = Field(..., description="Total image resolution in megapixels")
    bytes: int = Field(..., description="File size in bytes")
    format: str = Field(..., description="Image file format")
    recommended_transformations: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Recommended Cloudinary AI transformation layers",
    )
    quality_score: Optional[float] = Field(None, description="Heuristic quality score between 0.0 and 1.0")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Detailed quality heuristics and telemetry")


class OriginalImageResult(BaseModel):
    """Contract for raw/original product image uploads."""
    success: bool = Field(True, description="Whether the operation succeeded")
    provider: str = Field("cloudinary", description="Underlying storage provider")
    stage: str = Field("original_upload", description="Processing lifecycle stage")
    asset: Optional[ImageAsset] = Field(None, description="Uploaded asset details")
    error: Optional[str] = Field(None, description="Error message if upload failed")


class ProcessedImageResult(BaseModel):
    """Normalized project-level contract for AI image processing operations."""
    success: bool = Field(..., description="Whether the processing operation succeeded")
    provider: str = Field("picsart", description="AI service provider")
    operation: str = Field("remove_background", description="Executed vision operation")
    output_url: Optional[str] = Field(None, description="URL of the generated/processed image output")
    output_format: str = Field("PNG", description="Format of the output asset")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Execution metadata and performance metrics")
    error: Optional[str] = Field(None, description="Error message if processing failed")
    error_code: Optional[str] = Field(None, description="Standardized error code")


class PersistenceBridgeResult(BaseModel):
    """Normalized contract for Cloudinary -> Picsart -> Cloudinary persistence bridge."""
    success: bool = Field(..., description="Whether the entire persistence bridge pipeline succeeded")
    provider: str = Field("picsart", description="AI service provider")
    operation: str = Field("remove_background", description="Executed vision operation")
    original: Optional[ImageAsset] = Field(None, description="Original asset stored in Cloudinary (artisan-ai/originals/)")
    cutout: Optional[ImageAsset] = Field(None, description="Persistent cutout asset stored in Cloudinary (artisan-ai/cutouts/)")
    error: Optional[str] = Field(None, description="Error description if any step failed")
    error_code: Optional[str] = Field(None, description="Standardized error code")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Pipeline telemetry and timing metadata")


class EnhancedImageResult(BaseModel):
    """Normalized contract for Studio composition output."""
    success: bool = Field(..., description="Whether the studio enhancement succeeded")
    provider: str = Field("cloudinary", description="Underlying studio engine provider")
    original: Optional[ImageAsset] = Field(None, description="Raw original product asset (artisan-ai/originals/)")
    cutout: Optional[ImageAsset] = Field(None, description="Isolated cutout product asset (artisan-ai/cutouts/)")
    enhanced: Optional[ImageAsset] = Field(None, description="Final studio-composed asset (artisan-ai/enhanced/)")
    category: str = Field("general", description="Artisan craft category")
    preset: str = Field("ecommerce_white", description="Studio backdrop preset used")
    aspect_ratio: str = Field("square_1x1", description="Canvas aspect ratio used")
    shadow_enabled: bool = Field(True, description="Whether contact shadow was applied")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Pipeline timing and transformation parameters")
    error: Optional[str] = Field(None, description="Error description if any step failed")
    error_code: Optional[str] = Field(None, description="Standardized error code")


class AssetDeleteResult(BaseModel):
    """Contract for asset deletion operations."""
    success: bool = Field(..., description="Whether deletion was successful")
    public_id: str = Field(..., description="Target asset public ID")
    result: str = Field(..., description="Provider response status (e.g., 'ok' or 'not found')")
