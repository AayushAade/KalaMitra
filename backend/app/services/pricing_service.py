"""Pricing Service managing market research, normalization, and fair price generation."""

import logging
import time
from typing import Optional

from backend.app.pricing.engine import (
    calculate_cost_floor,
    compute_fair_price_recommendation,
)
from backend.app.pricing.market_collector import MarketDataCollector
from backend.app.pricing.normalizer import (
    calculate_market_statistics,
    compute_market_confidence,
)
from backend.app.schemas.pricing import (
    PricingRecommendRequest,
    PricingRecommendResponse,
)

logger = logging.getLogger(__name__)


class PricingService:
    """Service orchestrating AI Dynamic Fair Pricing calculations."""

    def __init__(self, collector: Optional[MarketDataCollector] = None):
        self.collector = collector or MarketDataCollector()

    async def generate_recommendation(
        self,
        request: PricingRecommendRequest,
    ) -> PricingRecommendResponse:
        """Generate a production-ready dynamic pricing recommendation."""
        start_time = time.time()

        # 1. Compute deterministic cost floor
        cost_floor = calculate_cost_floor(
            material_cost=request.material_cost,
            time_spent_hours=request.time_spent_hours,
            craftsmanship_level=request.craftsmanship_level,
            hourly_rate_override=request.hourly_rate_override,
        )

        # 2. Collect market research comparables
        try:
            comparables, source_type = await self.collector.collect_comparables(
                product_name=request.product_name,
                category=request.category,
                material=request.material,
                craft_type=request.craft_type,
                tags=request.tags,
            )
        except Exception as e:
            logger.warning(f"[PricingService] Market collection failed: {e}")
            comparables, source_type = [], "cost_only"

        # 3. Normalize prices and compute statistics
        market_stats = calculate_market_statistics(
            comparables,
            fallback_used=False,
            data_source_type=source_type,
        )
        confidence = compute_market_confidence(market_stats)

        # 4. Execute explainable pricing engine
        suggested_price, craft_premium, explanation_points, summary_text = compute_fair_price_recommendation(
            cost_floor=cost_floor,
            market_stats=market_stats,
            craftsmanship_level=request.craftsmanship_level,
            product_name=request.product_name,
            category=request.category or "",
            material=request.material or "",
        )

        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        # 5. Build market range dict
        market_range = None
        market_median = None
        if market_stats:
            market_median = market_stats.median_price
            market_range = {
                "min": market_stats.p25_price,  # Use interquartile range for realistic spread
                "max": market_stats.p75_price,
                "absolute_min": market_stats.min_price,
                "absolute_max": market_stats.max_price,
            }

        # Data source descriptions
        if source_type == "live_market_data":
            source_label = "Live Market Data"
            source_desc = "Based on verified live marketplace product listings."
        elif source_type == "craft_benchmark":
            source_label = "Craft Category Benchmark"
            source_desc = "Based on curated Indian handicraft category price benchmarks."
        else:
            source_label = "Cost-Based Recommendation"
            source_desc = "Market comparison was unavailable, so this recommendation is based on your making costs."

        return PricingRecommendResponse(
            success=True,
            suggested_price=suggested_price,
            cost_floor=cost_floor.cost_floor,
            market_median=market_median,
            market_range=market_range,
            confidence=confidence,
            data_source_type=source_type,
            data_source_label=source_label,
            data_source_description=source_desc,
            comparable_count=len(comparables),
            craftsmanship_level=request.craftsmanship_level,
            craftsmanship_adjustment_percent=round(craft_premium * 100, 1),
            cost_breakdown=cost_floor,
            comparables=comparables[:6],
            explanation_points=explanation_points,
            summary_explanation=summary_text,
            metadata={
                "execution_time_ms": elapsed_ms,
                "data_source_type": source_type,
                "data_source_label": source_label,
                "source_summary": market_stats.source_summary if market_stats else "Cost floor calculation",
                "hourly_rate": cost_floor.hourly_rate,
            },
        )


_default_pricing_service: Optional[PricingService] = None


def get_pricing_service() -> PricingService:
    """Dependency provider for PricingService."""
    global _default_pricing_service
    if _default_pricing_service is None:
        _default_pricing_service = PricingService()
    return _default_pricing_service
