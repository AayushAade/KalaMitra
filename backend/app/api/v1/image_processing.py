"""Vertex AI Image Processing Test Endpoint.

Provides a verification route to test Google Cloud authentication,
Vertex AI connectivity, and real image generation responses.
"""

from __future__ import annotations

import base64
import logging
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.services.image_processing import (
    ImageProcessingService,
    get_image_processing_service,
)

logger = logging.getLogger(__name__)

router = APIRouter()


class VertexTestRequest(BaseModel):
    """Request payload for Vertex AI test endpoint."""
    prompt: str = Field(
        default="A luxury handcrafted Indian terracotta vase on a minimalist stone podium, soft warm studio lighting, 8k e-commerce photo",
        description="Text prompt to generate a test image.",
    )
    aspect_ratio: str = Field(
        default="1:1",
        description="Aspect ratio for generated visual (e.g. 1:1, 4:3, 16:9).",
    )
    verify_only: bool = Field(
        default=False,
        description="If True, only tests authentication and connectivity without generating an image.",
    )


class VertexTestResponse(BaseModel):
    """Response payload for Vertex AI test endpoint."""
    status: str
    provider: str
    project_id: Optional[str] = None
    location: str
    model: str
    authenticated: bool
    image_received: bool = False
    image_byte_count: int = 0
    image_base64_preview: Optional[str] = None
    execution_time_ms: float
    diagnostics: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None
    error_code: Optional[str] = None


@router.post(
    "/test",
    response_model=VertexTestResponse,
    summary="Test Vertex AI image model connectivity and generation",
    description="Validates Google Cloud ADC authentication and executes a real Vertex AI image request.",
)
def test_vertex_ai(
    payload: VertexTestRequest,
    service: ImageProcessingService = Depends(get_image_processing_service),
) -> VertexTestResponse:
    """Execute Vertex AI backend foundation test."""
    conn_info = service.verify_provider_connection()

    if not conn_info.get("is_configured"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": "Vertex AI is not configured on the backend.",
                "error_code": conn_info.get("error_code", "CONFIG_ERROR"),
                "hint": "Set GOOGLE_CLOUD_PROJECT or run 'gcloud auth application-default login'.",
            },
        )

    if payload.verify_only:
        return VertexTestResponse(
            status="ok" if conn_info.get("authenticated") else "error",
            provider=conn_info.get("provider", "vertex_ai"),
            project_id=conn_info.get("project_id"),
            location=conn_info.get("location", "us-central1"),
            model=conn_info.get("model", "imagen-3.0-generate-002"),
            authenticated=conn_info.get("authenticated", False),
            image_received=False,
            execution_time_ms=conn_info.get("execution_time_ms", 0.0),
            diagnostics=conn_info,
            error=conn_info.get("error"),
            error_code=conn_info.get("error_code"),
        )

    # Execute Real Vertex AI request
    result = service.test_generate_image(
        prompt=payload.prompt,
        aspect_ratio=payload.aspect_ratio,
    )

    image_bytes = result.metadata.get("image_bytes") if result.metadata else None
    image_b64 = None
    if image_bytes and isinstance(image_bytes, bytes):
        # Truncate preview for API response efficiency (first 256 chars of base64)
        full_b64 = base64.b64encode(image_bytes).decode("utf-8")
        image_b64 = f"data:image/png;base64,{full_b64[:200]}...({len(full_b64)} chars total)"

    if not result.success:
        return VertexTestResponse(
            status="error",
            provider=result.provider,
            project_id=conn_info.get("project_id"),
            location=conn_info.get("location", "us-central1"),
            model=result.metadata.get("model", conn_info.get("model", "")),
            authenticated=conn_info.get("authenticated", False),
            image_received=False,
            image_byte_count=0,
            execution_time_ms=result.metadata.get("execution_time_ms", 0.0) if result.metadata else 0.0,
            diagnostics={"conn_info": conn_info, "result_metadata": result.metadata},
            error=result.error,
            error_code=result.error_code,
        )

    return VertexTestResponse(
        status="success",
        provider=result.provider,
        project_id=conn_info.get("project_id"),
        location=conn_info.get("location", "us-central1"),
        model=result.metadata.get("model", conn_info.get("model", "")),
        authenticated=True,
        image_received=True,
        image_byte_count=result.metadata.get("byte_count", len(image_bytes) if image_bytes else 0),
        image_base64_preview=image_b64,
        execution_time_ms=result.metadata.get("execution_time_ms", 0.0),
        diagnostics=result.metadata,
    )
