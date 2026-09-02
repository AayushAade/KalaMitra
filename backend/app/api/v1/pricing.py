"""API router for AI Dynamic Fair Pricing endpoints."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.schemas.pricing import (
    PricingRecommendRequest,
    PricingRecommendResponse,
)
from backend.app.services.pricing_service import (
    PricingService,
    get_pricing_service,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/recommend",
    response_model=PricingRecommendResponse,
    summary="Generate Fair Dynamic Pricing Recommendation",
    description="Calculates fair selling price combining artisan making costs (material + labor wage), market research benchmarks, and craftsmanship complexity.",
)
async def recommend_price(
    request: PricingRecommendRequest,
    service: PricingService = Depends(get_pricing_service),
) -> PricingRecommendResponse:
    """Generate dynamic pricing recommendation."""
    try:
        response = await service.generate_recommendation(request)
        return response
    except Exception as exc:
        logger.exception(f"Failed to generate pricing recommendation: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate pricing recommendation: {str(exc)}",
        )
