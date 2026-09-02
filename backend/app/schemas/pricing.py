"""Pydantic schemas for the AI Dynamic Pricing Recommendation engine."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PricingRecommendRequest(BaseModel):
    """Input payload for generating a dynamic pricing recommendation."""
    product_name: str = Field(..., description="Product title/name", min_length=1)
    category: Optional[str] = Field("general", description="Craft category (e.g. pottery, textiles, bamboo)")
    material: Optional[str] = Field(None, description="Primary material used")
    craft_type: Optional[str] = Field(None, description="Craft technique or tradition")
    material_cost: float = Field(..., ge=0, description="Artisan raw material expenses in INR")
    time_spent_hours: float = Field(..., ge=0, description="Production time spent by artisan in hours")
    craftsmanship_level: str = Field("skilled", description="Craft complexity level: 'basic', 'skilled', 'intricate'")
    hourly_rate_override: Optional[float] = Field(None, ge=0, description="Custom artisan hourly labor rate in INR")
    image_url: Optional[str] = Field(None, description="Product image URL for visual context")
    tags: List[str] = Field(default_factory=list, description="Keywords or tags describing the product")


class ComparableProductItem(BaseModel):
    """Normalized comparable product item discovered in market research."""
    title: str
    price: float
    currency: str = "INR"
    source: str
    url: Optional[str] = None
    similarity_reason: Optional[str] = None


class MarketStatistics(BaseModel):
    """Statistical summary of comparable products found in market research."""
    min_price: float
    max_price: float
    median_price: float
    p25_price: float
    p75_price: float
    sample_size: int
    source_summary: str
    is_fallback: bool = False
    data_source_type: str = "craft_benchmark"  # 'live_market_data', 'craft_benchmark', 'cost_only'
    data_source_label: str = "Craft Category Benchmark"


class CostFloorBreakdown(BaseModel):
    """Transparent cost-basis floor breakdown."""
    material_cost: float
    time_spent_hours: float
    hourly_rate: float
    labor_cost: float
    overhead_cost: float
    minimum_margin: float
    cost_floor: float


class PricingRecommendResponse(BaseModel):
    """Complete dynamic pricing recommendation response."""
    success: bool = True
    suggested_price: float
    cost_floor: float
    market_median: Optional[float] = None
    market_range: Optional[Dict[str, float]] = None  # min, max, p25, p75
    confidence: str = Field("medium", description="'high', 'medium', 'low', 'cost_only'")
    data_source_type: str = Field("craft_benchmark", description="'live_market_data', 'craft_benchmark', 'cost_only'")
    data_source_label: str = Field("Craft Category Benchmark", description="Human-readable source badge")
    data_source_description: str = Field(
        "Based on curated Indian handicraft category price benchmarks.",
        description="Transparent explanation of the data origin"
    )
    comparable_count: int = 0
    craftsmanship_level: str = "skilled"
    craftsmanship_adjustment_percent: float = 0.0
    cost_breakdown: CostFloorBreakdown
    comparables: List[ComparableProductItem] = Field(default_factory=list)
    explanation_points: List[str] = Field(default_factory=list)
    summary_explanation: str = ""
    error: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
