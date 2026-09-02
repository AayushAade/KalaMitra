"""AI Vision module initialization."""

from ai.vision.config import (
    CloudinarySettings,
    FidelitySettings,
    PicsartSettings,
    configure_cloudinary,
    get_cloudinary_config,
    get_fidelity_config,
    get_picsart_config,
)
from ai.vision.schemas import (
    AssetDeleteResult,
    EnhancedImageResult,
    FidelityMetrics,
    FidelityValidationResult,
    ImageAsset,
    OriginalImageResult,
    PersistenceBridgeResult,
    ProcessedImageResult,
    QualityAnalysisResult,
)
from ai.vision.cloudinary_service import CloudinaryService
from ai.vision.fidelity import ProductFidelityValidator
from ai.vision.providers.picsart_provider import PicsartProvider
from ai.vision.persistence import PersistenceBridge, process_original_to_cutout
from ai.vision.studio import (
    ASPECT_RATIOS,
    CATEGORY_DEFAULTS,
    STUDIO_PRESETS,
    StudioComposer,
    get_studio_composer,
)
try:
    from ai.vision.enhancer import QualityEnhancer, get_quality_enhancer
except ImportError:
    QualityEnhancer, get_quality_enhancer = None, None

__all__ = [
    "CloudinarySettings",
    "FidelitySettings",
    "PicsartSettings",
    "configure_cloudinary",
    "get_cloudinary_config",
    "get_fidelity_config",
    "get_picsart_config",
    "ImageAsset",
    "OriginalImageResult",
    "ProcessedImageResult",
    "PersistenceBridgeResult",
    "EnhancedImageResult",
    "QualityAnalysisResult",
    "AssetDeleteResult",
    "FidelityMetrics",
    "FidelityValidationResult",
    "ProductFidelityValidator",
    "CloudinaryService",
    "PicsartProvider",
    "PersistenceBridge",
    "process_original_to_cutout",
    "STUDIO_PRESETS",
    "ASPECT_RATIOS",
    "CATEGORY_DEFAULTS",
    "StudioComposer",
    "get_studio_composer",
    "QualityEnhancer",
    "get_quality_enhancer",
]
