"""KalaMitra FastAPI Backend Application Entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=settings.app_description,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for local development and mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from backend.app.api.v1.products import router as products_router
from backend.app.api.v1.router import api_router

# Include API v1 routes (/api/v1)
app.include_router(api_router, prefix=settings.api_v1_str)

# Direct root alias for /api/products
app.include_router(products_router, prefix="/api/products", tags=["products"])



@app.get("/health", tags=["health"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
