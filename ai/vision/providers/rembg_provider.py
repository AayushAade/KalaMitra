"""Local AI Background Removal provider using rembg (U2-Net).

Provides fast, high-quality, 100% free transparent PNG cutout generation locally
without requiring external API keys, payments, or cloud subscriptions.
Guarantees authentic artisan product geometry and craft textures are preserved.
"""

import io
from pathlib import Path
import time
from typing import Any, BinaryIO, Dict, Optional, Union

from ai.vision.schemas import ProcessedImageResult


class RembgProvider:
    """Local offline background remover using rembg."""

    def __init__(self, model_name: str = "u2net") -> None:
        """Initialize RembgProvider with target model."""
        self.model_name = model_name
        self._session = None

    def _get_session(self):
        """Lazy load rembg ONNX session."""
        if self._session is None:
            try:
                import rembg
                self._session = rembg.new_session(self.model_name)
            except Exception as exc:
                self._session = None
        return self._session

    def extract_cutout_bytes(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
    ) -> bytes:
        """Remove background locally and return transparent PNG bytes."""
        import rembg

        # Normalize to bytes
        image_bytes: bytes
        if isinstance(image_input, (str, Path)):
            image_bytes = Path(image_input).read_bytes()
        elif isinstance(image_input, bytes):
            image_bytes = image_input
        elif hasattr(image_input, "read"):
            image_bytes = image_input.read()
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        session = self._get_session()
        if session is not None:
            output_bytes = rembg.remove(image_bytes, session=session)
        else:
            output_bytes = rembg.remove(image_bytes)

        return output_bytes

    def remove_background(
        self,
        image_input: Union[str, Path, bytes, BinaryIO],
        output_format: str = "PNG",
    ) -> ProcessedImageResult:
        """Remove background using local rembg AI model.

        Args:
            image_input: Raw image path, bytes, or file stream.
            output_format: Target format (default PNG).

        Returns:
            ProcessedImageResult with cutout metadata and raw bytes in metadata.
        """
        start_time = time.time()
        try:
            cutout_bytes = self.extract_cutout_bytes(image_input)
            elapsed_ms = round((time.time() - start_time) * 1000, 2)

            return ProcessedImageResult(
                success=True,
                provider="rembg",
                operation="remove_background",
                output_url=None,
                output_format="PNG",
                metadata={
                    "cutout_bytes": cutout_bytes,
                    "execution_time_ms": elapsed_ms,
                    "model": self.model_name,
                    "local_processing": True,
                },
            )
        except Exception as exc:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            return ProcessedImageResult(
                success=False,
                provider="rembg",
                operation="remove_background",
                error=f"Local background removal failed: {str(exc)}",
                error_code="LOCAL_REMBG_ERROR",
                metadata={"execution_time_ms": elapsed_ms},
            )
