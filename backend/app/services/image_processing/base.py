"""Base Image Processing Provider Interface.

Defines the abstract contract for cloud and local image processing providers.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, BinaryIO, Dict, List, Optional, Union
from PIL import Image

from ai.vision.schemas import ProcessedImageResult


class BaseImageProcessingProvider(ABC):
    """Abstract base class defining the contract for all image processing providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Unique identifier for the image processing provider."""
        raise NotImplementedError

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider dependencies and credentials are configured."""
        raise NotImplementedError

    @abstractmethod
    def verify_connection(self) -> Dict[str, Any]:
        """Verify provider authentication and cloud connectivity.

        Returns:
            Dict containing connection status, provider name, model, and diagnostic details.
        """
        raise NotImplementedError

    @abstractmethod
    def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        number_of_images: int = 1,
        **kwargs: Any,
    ) -> ProcessedImageResult:
        """Generate a new image from a text prompt using the provider model.

        Args:
            prompt: Text prompt describing the image to generate.
            aspect_ratio: Desired aspect ratio (e.g. '1:1', '4:3', '16:9').
            number_of_images: Number of image variations to generate (default: 1).
            **kwargs: Provider-specific configuration options.

        Returns:
            ProcessedImageResult containing image bytes or structured error metadata.
        """
        raise NotImplementedError

    # -------------------------------------------------------------------------
    # Interface contracts for future phases (Phase 2+)
    # -------------------------------------------------------------------------

    def enhance_product_image(
        self,
        image_input: Union[str, Path, bytes, BinaryIO, Image.Image],
        **kwargs: Any,
    ) -> ProcessedImageResult:
        """Enhance product photo lighting, sharpness, and resolution (Future Phase)."""
        raise NotImplementedError(f"{self.provider_name} does not implement enhance_product_image in Phase 1.")

    def generate_background(
        self,
        image_input: Union[str, Path, bytes, BinaryIO, Image.Image],
        prompt: str,
        **kwargs: Any,
    ) -> ProcessedImageResult:
        """Replace product background with an AI-generated scene (Future Phase)."""
        raise NotImplementedError(f"{self.provider_name} does not implement generate_background in Phase 1.")

    def edit_product_image(
        self,
        image_input: Union[str, Path, bytes, BinaryIO, Image.Image],
        prompt: str,
        **kwargs: Any,
    ) -> ProcessedImageResult:
        """Edit product photograph with multimodal text instructions (Future Phase)."""
        raise NotImplementedError(f"{self.provider_name} does not implement edit_product_image in Phase 1.")
