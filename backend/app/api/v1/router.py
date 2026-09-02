"""Consolidated API v1 router module."""

from fastapi import APIRouter

from backend.app.api.v1.pricing import router as pricing_router
from backend.app.api.v1.studio import router as studio_router
from backend.app.api.v1.voice import router as voice_router

api_router = APIRouter()

# Register AI Studio router under /studio prefix
api_router.include_router(studio_router, prefix="/studio", tags=["studio"])

# Register Voice Cataloging router under /voice prefix
api_router.include_router(voice_router, prefix="/voice", tags=["voice"])

# Register AI Dynamic Pricing router under /pricing prefix
api_router.include_router(pricing_router, prefix="/pricing", tags=["pricing"])
