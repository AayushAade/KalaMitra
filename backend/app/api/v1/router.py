"""Consolidated API v1 router module."""

from fastapi import APIRouter

from backend.app.api.v1.studio import router as studio_router
from backend.app.api.v1.voice import router as voice_router

api_router = APIRouter()

# Register AI Studio router under /studio prefix
api_router.include_router(studio_router, prefix="/studio", tags=["studio"])

# Register Voice Cataloging router under /voice prefix
api_router.include_router(voice_router, prefix="/voice", tags=["voice"])
