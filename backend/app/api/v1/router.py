"""Consolidated API v1 router module."""

from fastapi import APIRouter

from backend.app.api.v1.image_processing import router as image_processing_router
from backend.app.api.v1.pricing import router as pricing_router
from backend.app.api.v1.products import router as products_router
from backend.app.api.v1.studio import router as studio_router
from backend.app.api.v1.voice import router as voice_router

api_router = APIRouter()

# Register Product Image Enhancement router under /products prefix
api_router.include_router(products_router, prefix="/products", tags=["products"])

# Register Image Processing / Vertex AI router under /image-processing prefix
api_router.include_router(image_processing_router, prefix="/image-processing", tags=["image-processing"])

# Register AI Studio router under /studio prefix
api_router.include_router(studio_router, prefix="/studio", tags=["studio"])

# Register Voice Cataloging router under /voice prefix
api_router.include_router(voice_router, prefix="/voice", tags=["voice"])

# Register AI Dynamic Pricing router under /pricing prefix
api_router.include_router(pricing_router, prefix="/pricing", tags=["pricing"])
