"""Cloudinary -> Picsart -> Cloudinary Persistence Bridge.

Coordinates the end-to-end ingestion and cutout isolation workflow:
1. Ingests raw artisan product photograph into persistent Cloudinary storage (artisan-ai/originals/).
2. Requests background removal from Picsart Remove Background REST API.
3. Validates and downloads the transparent PNG cutout from temporary CDN.
4. Stores the cutout into persistent Cloudinary storage (artisan-ai/cutouts/) with alpha transparency preserved.
5. Returns a normalized PersistenceBridgeResult maintaining strict artifact safety.
"""

import io
import os
from pathlib import Path
import time
from typing import Any, BinaryIO, Dict, List, Optional, Union
import urllib.error
import urllib.request

from ai.vision.cloudinary_service import CloudinaryService
from ai.vision.providers.picsart_provider import PicsartProvider
from ai.vision.schemas import ImageAsset, PersistenceBridgeResult


class PersistenceBridge:
    """Orchestrates persistent storage and AI cutout generation."""

    PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

    def __init__(
        self,
        cloudinary_service: Optional[CloudinaryService] = None,
        picsart_provider: Optional[PicsartProvider] = None,
    ) -> None:
        """Initialize persistence bridge with required storage and AI providers."""
        self.cloudinary = cloudinary_service or CloudinaryService()
        self.picsart = picsart_provider or PicsartProvider()

    def process_original_to_cutout(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        original_public_id: Optional[str] = None,
        cutout_public_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        allow_fallback: bool = False,
    ) -> PersistenceBridgeResult:
        """Execute Cloudinary -> Picsart -> Cloudinary persistence bridge."""
        start_time = time.time()

        # 1. Normalize image input into memory-safe byte buffer for multi-consumer dispatch
        image_bytes: bytes
        filename: str = "artisan_product.jpg"

        if isinstance(image_input, (str, Path)):
            path_obj = Path(image_input)
            if not path_obj.exists():
                return PersistenceBridgeResult(
                    success=False,
                    provider="picsart",
                    operation="remove_background",
                    error=f"Source image file not found: {path_obj}",
                    error_code="FILE_NOT_FOUND",
                )
            image_bytes = path_obj.read_bytes()
            filename = path_obj.name
        elif isinstance(image_input, bytes):
            image_bytes = image_input
        elif hasattr(image_input, "read"):
            image_bytes = image_input.read()
            raw_name = getattr(image_input, "name", "artisan_product.jpg")
            filename = Path(raw_name).name if isinstance(raw_name, (str, Path)) else "artisan_product.jpg"
        else:
            return PersistenceBridgeResult(
                success=False,
                provider="picsart",
                operation="remove_background",
                error=f"Unsupported image input type: {type(image_input)}",
                error_code="INVALID_INPUT_TYPE",
            )

        if not image_bytes:
            return PersistenceBridgeResult(
                success=False,
                provider="picsart",
                operation="remove_background",
                error="Provided image payload is empty (0 bytes)",
                error_code="EMPTY_IMAGE",
            )

        # 2. Upload raw original photograph to Cloudinary (artisan-ai/originals/)
        orig_upload_res = self.cloudinary.upload_original_image(
            image_input=image_bytes,
            public_id=original_public_id,
            tags=tags,
        )

        if not orig_upload_res.success or not orig_upload_res.asset:
            return PersistenceBridgeResult(
                success=False,
                provider="picsart",
                operation="remove_background",
                error=f"Cloudinary original upload failed: {orig_upload_res.error}",
                error_code="ORIGINAL_UPLOAD_FAILED",
                metadata={"execution_time_ms": round((time.time() - start_time) * 1000, 2)},
            )

        original_asset = orig_upload_res.asset

        # 3. Call Picsart Remove Background API with seamless local Rembg fallback
        cutout_bytes = None
        picsart_metadata = {}
        provider_name = "picsart"

        picsart_res = self.picsart.remove_background(
            image_input=image_bytes,
            output_format="PNG",
        )

        if picsart_res.success and picsart_res.output_url:
            try:
                req = urllib.request.Request(
                    url=picsart_res.output_url,
                    headers={"User-Agent": "KalaMitra-PersistenceBridge/1.0"},
                )
                with urllib.request.urlopen(req, timeout=30) as cdn_response:
                    if cdn_response.status == 200:
                        dl_bytes = cdn_response.read()
                        if len(dl_bytes) >= 8 and dl_bytes[:8] == self.PNG_SIGNATURE:
                            cutout_bytes = dl_bytes
                            picsart_metadata = picsart_res.metadata or {}
                        else:
                            if not allow_fallback:
                                return PersistenceBridgeResult(
                                    success=False,
                                    provider="picsart",
                                    operation="remove_background",
                                    original=original_asset,
                                    cutout=None,
                                    error="Downloaded cutout payload is not a valid PNG image format",
                                    error_code="INVALID_CUTOUT_FORMAT",
                                    metadata={"execution_time_ms": round((time.time() - start_time) * 1000, 2)},
                                )
                    else:
                        if not allow_fallback:
                            return PersistenceBridgeResult(
                                success=False,
                                provider="picsart",
                                operation="remove_background",
                                original=original_asset,
                                cutout=None,
                                error=f"Failed to fetch cutout from CDN (HTTP {cdn_response.status})",
                                error_code="CUTOUT_DOWNLOAD_FAILED",
                                metadata={"execution_time_ms": round((time.time() - start_time) * 1000, 2)},
                            )
            except Exception as exc:
                if not allow_fallback:
                    return PersistenceBridgeResult(
                        success=False,
                        provider="picsart",
                        operation="remove_background",
                        original=original_asset,
                        cutout=None,
                        error=f"Failed to download cutout from CDN: {str(exc)}",
                        error_code="CUTOUT_DOWNLOAD_FAILED",
                        metadata={"execution_time_ms": round((time.time() - start_time) * 1000, 2)},
                    )
        else:
            if not allow_fallback:
                return PersistenceBridgeResult(
                    success=False,
                    provider="picsart",
                    operation="remove_background",
                    original=original_asset,
                    cutout=None,
                    error=picsart_res.error or "Picsart background removal failed",
                    error_code=picsart_res.error_code or "PICSART_PROCESSING_FAILED",
                    metadata={
                        "picsart_metadata": picsart_res.metadata,
                        "execution_time_ms": round((time.time() - start_time) * 1000, 2),
                    },
                )

        # Fallback to local AI background removal (rembg)
        if cutout_bytes is None:
            try:
                from ai.vision.providers.rembg_provider import RembgProvider
                rembg_prov = RembgProvider()
                cutout_bytes = rembg_prov.extract_cutout_bytes(image_bytes)
                provider_name = "rembg"
            except Exception as rembg_err:
                return PersistenceBridgeResult(
                    success=False,
                    provider="rembg",
                    operation="remove_background",
                    original=original_asset,
                    cutout=None,
                    error=f"Background removal failed across all providers: {str(rembg_err)}",
                    error_code="BACKGROUND_REMOVAL_FAILED",
                    metadata={"execution_time_ms": round((time.time() - start_time) * 1000, 2)},
                )



        # 5. Upload persistent cutout PNG to Cloudinary (artisan-ai/cutouts/)
        cutout_tags = list(tags) if tags else []
        cutout_tags.append("cutout")

        cutout_upload_res = self.cloudinary.upload_cutout_image(
            image_input=cutout_bytes,
            public_id=cutout_public_id,
            tags=cutout_tags,
        )

        if not cutout_upload_res.success or not cutout_upload_res.asset:
            return PersistenceBridgeResult(
                success=False,
                provider=provider_name,
                operation="remove_background",
                original=original_asset,
                cutout=None,
                error=f"Cloudinary cutout upload failed: {cutout_upload_res.error}",
                error_code="CUTOUT_UPLOAD_FAILED",
                metadata={"execution_time_ms": round((time.time() - start_time) * 1000, 2)},
            )

        cutout_asset = cutout_upload_res.asset
        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        return PersistenceBridgeResult(
            success=True,
            provider=provider_name,
            operation="remove_background",
            original=original_asset,
            cutout=cutout_asset,
            metadata={
                "execution_time_ms": elapsed_ms,
                "provider_used": provider_name,
                "picsart_metadata": picsart_metadata,
                "cutout_bytes": len(cutout_bytes),
                "original_public_id": original_asset.public_id,
                "cutout_public_id": cutout_asset.public_id,
            },
        )



def process_original_to_cutout(
    image_input: Union[str, Path, bytes, BinaryIO],
    original_public_id: Optional[str] = None,
    cutout_public_id: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> PersistenceBridgeResult:
    """Convenience function for processing an image through the persistence bridge."""
    bridge = PersistenceBridge()
    return bridge.process_original_to_cutout(
        image_input=image_input,
        original_public_id=original_public_id,
        cutout_public_id=cutout_public_id,
        tags=tags,
    )
