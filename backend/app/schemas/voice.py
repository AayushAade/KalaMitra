"""Pydantic schemas for the Voice transcription & product understanding endpoint."""

from typing import List, Optional
from pydantic import BaseModel, Field


class VoiceExtractionMetadata(BaseModel):
    """Structured product understanding metadata extracted from speech."""
    product_name: str = Field(..., description="Concise professional English product name")
    category: str = Field("General", description="Top-level catalog category (e.g. Textiles, Pottery, Bamboo)")
    subcategory: Optional[str] = Field(None, description="Subcategory or craft classification")
    material: Optional[str] = Field(None, description="Primary craft materials mentioned")
    craft_type: Optional[str] = Field(None, description="Craft technique or tradition")
    colors: List[str] = Field(default_factory=list, description="Color palette mentioned")
    production_time_days: Optional[int] = Field(None, description="Production time in days if mentioned")
    size: Optional[str] = Field(None, description="Physical dimensions or sizing")
    description_english: Optional[str] = Field(None, description="Professional English catalog description")
    description_hindi: Optional[str] = Field(None, description="Professional Hindi catalog description")
    tags: List[str] = Field(default_factory=list, description="Search and catalog keywords")
    additional_details: List[str] = Field(default_factory=list, description="Other specific artisan details")


class VoiceTranscribeResponse(BaseModel):
    """Response returned by the /api/v1/voice/transcribe-and-extract endpoint."""
    success: bool = True
    transcript: str = Field(..., description="Verbatim speech transcript in the original spoken language")
    detected_language: str = Field("Hindi", description="Detected spoken vernacular language")
    metadata: VoiceExtractionMetadata = Field(..., description="Extracted structured product metadata")
    error: Optional[str] = None
