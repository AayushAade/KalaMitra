"""FastAPI REST API server for AI Artisan Image Enhancer & Studio.

Exposes endpoints for the React Native mobile application:
- POST /api/v1/studio/enhance (Multipart camera photo upload + Cloudinary Studio)
- POST /api/v1/studio/opencv-enhance (Deep 14-Stage OpenCV Studio Enhancement Pipeline)
- POST /api/v1/studio/transform-existing (Re-process existing asset with new preset / filter)
- GET  /api/v1/studio/presets (Available backdrops, categories, filters, and aspect ratios)
- GET  /api/v1/health (Health check)
"""

from typing import Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai.vision.enhancer import (
    enhance_product_image_stream,
    enhance_from_public_id,
    enhance_with_opencv_studio,
)
from ai.vision.transformations import (
    STUDIO_PRESETS,
    ASPECT_RATIOS,
    CATEGORY_DEFAULTS,
    FILTER_PRESETS,
)

app = FastAPI(
    title="AI Artisan Image Enhancer & Studio API",
    description="Smart India Hackathon 2026 - AI Cataloging Engine for Marginalized Artisans",
    version="1.0.0",
)

# Enable CORS for React Native mobile app & Web development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TransformExistingRequest(BaseModel):
    public_id: str
    category: Optional[str] = "general"
    preset: Optional[str] = None
    aspect_ratio: Optional[str] = None
    add_shadow: Optional[bool] = None
    filter_name: Optional[str] = None
    enable_enhancement: bool = True


class OpenCVEnhanceRequest(BaseModel):
    public_id: str
    category: Optional[str] = "general"
    preset: Optional[str] = "warm_neutral"
    add_shadow: Optional[bool] = True


@app.get("/", tags=["System"])
@app.get("/api/v1/health", tags=["System"])
async def health_check() -> Dict[str, str]:
    """Health check endpoint for the vision enhancement service."""
    return {
        "status": "healthy",
        "service": "AI Artisan Image Enhancer & Studio",
        "version": "1.0.0",
    }


@app.get("/api/v1/studio/presets", tags=["Studio Options"])
async def get_studio_options() -> Dict[str, Any]:
    """
    Returns available categories, studio backdrops, visual filters, and aspect ratios.
    """
    return {
        "categories": CATEGORY_DEFAULTS,
        "presets": STUDIO_PRESETS,
        "filters": FILTER_PRESETS,
        "aspect_ratios": list(ASPECT_RATIOS.keys()),
    }


@app.post("/api/v1/studio/enhance", tags=["Studio Enhancement"])
async def enhance_image(
    image: UploadFile = File(..., description="Artisan product photograph from camera/gallery"),
    category: str = Form("general", description="Product category: textiles, pottery, wooden_crafts, jewellery, general"),
    preset: Optional[str] = Form(None, description="Studio backdrop preset (optional)"),
    filter_name: Optional[str] = Form(None, description="Visual filter: crisp_detail, vibrant, warm_heritage, golden_studio, vintage, soft_blur"),
    aspect_ratio: Optional[str] = Form(None, description="Framing ratio: square_1x1, portrait_4x5, portrait_9x16, landscape_16x9"),
    add_shadow: Optional[bool] = Form(None, description="Force enable/disable 3D shadow"),
    enable_enhancement: bool = Form(True, description="Enable AI lighting/contrast auto-enhancement"),
) -> Dict[str, Any]:
    """
    Primary endpoint for React Native mobile application.

    Receives camera image upload via multipart/form-data, streams directly to
    Cloudinary, applies AI background removal, auto-centering, lighting correction,
    visual filters, studio framing, and returns high-resolution e-commerce delivery URLs.
    """
    try:
        result = enhance_product_image_stream(
            file_stream=image.file,
            filename=image.filename,
            category=category,
            preset=preset,
            aspect_ratio=aspect_ratio,
            add_shadow=add_shadow,
            filter_name=filter_name,
            enable_enhancement=enable_enhancement,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Studio enhancement failed: {str(e)}",
        )


@app.post("/api/v1/studio/opencv-enhance", tags=["OpenCV Studio Enhancement"])
async def opencv_enhance(req: OpenCVEnhanceRequest) -> Dict[str, Any]:
    """
    Deep 14-Stage OpenCV Computer Vision Pipeline Endpoint:
    - Alpha mask extraction & ghost filtering
    - Intelligent auto-crop (10% margins)
    - Conservative Gray-World white balancing
    - Adaptive Gamma exposure correction
    - LAB L-Channel CLAHE local contrast enhancement
    - Bilateral edge-preserving noise reduction
    - Unsharp mask detail recovery
    - Adaptive mild saturation normalization
    - 3D soft floor shadow synthesis
    - 1080x1080 studio compositing
    """
    try:
        return enhance_with_opencv_studio(
            public_id=req.public_id,
            category=req.category or "general",
            preset=req.preset or "warm_neutral",
            add_shadow=req.add_shadow if req.add_shadow is not None else True,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OpenCV processing failed: {str(e)}",
        )


@app.post("/api/v1/studio/transform-existing", tags=["Studio Enhancement"])
async def transform_existing(req: TransformExistingRequest) -> Dict[str, Any]:
    """
    Re-generate studio delivery URLs for an existing Cloudinary asset
    with a new backdrop or visual filter without re-uploading the image file.
    """
    try:
        return enhance_from_public_id(
            public_id=req.public_id,
            category=req.category or "general",
            preset=req.preset,
            aspect_ratio=req.aspect_ratio,
            add_shadow=req.add_shadow,
            filter_name=req.filter_name,
            enable_enhancement=req.enable_enhancement,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
