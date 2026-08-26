"""Cloudinary URL generation module for artisan product image transformations.

Provides functions to generate valid Cloudinary transformation URLs for:
- AI background removal
- Lighting & color enhancement
- Visual mood filters (crisp_detail, vibrant, warm_heritage, golden_studio, vintage, soft_blur)
- Studio background presets (e-commerce white, warm neutral, minimal grey, terracotta sand, transparent PNG)
- Category-aware framing & aspect ratios (1:1 square, 4:5 textile portrait, 16:9 landscape banner)
- 3D depth / contact shadows
- Automatic format & delivery optimization
"""

from typing import Dict, Tuple, Optional, List, Any
import cloudinary
import cloudinary.utils
from ai.vision.config import configure_cloudinary

# Ensure Cloudinary is configured
configure_cloudinary()

# Dimension mappings for standard e-commerce and mobile catalog aspect ratios
ASPECT_RATIOS: Dict[str, Tuple[int, int]] = {
    "square_1x1": (1080, 1080),      # Standard e-commerce (Amazon, Flipkart, ONDC, Meesho)
    "portrait_4x5": (1080, 1350),    # Sarees, textiles, apparel, Instagram/catalog feeds
    "portrait_9x16": (1080, 1920),   # Mobile fullscreen / story view
    "landscape_16x9": (1920, 1080),  # Web banners and hero displays
}

# Studio background color configurations
STUDIO_PRESETS: Dict[str, Dict[str, Any]] = {
    "ecommerce_white": {
        "name": "E-Commerce Pure White",
        "background": "white",
        "format": "auto",
        "description": "Standard pure white background for Amazon, Flipkart, ONDC, and GeM",
    },
    "warm_neutral": {
        "name": "Warm Neutral Studio",
        "background": "rgb:F7F4EE",
        "format": "auto",
        "description": "Soft luxury cream backdrop ideal for pottery, clay, and handmade crafts",
    },
    "minimal_grey": {
        "name": "Minimal Studio Grey",
        "background": "rgb:F5F5F7",
        "format": "auto",
        "description": "Contemporary studio light grey for premium modern handicrafts",
    },
    "terracotta_sand": {
        "name": "Terracotta & Sand",
        "background": "rgb:F4EBE1",
        "format": "auto",
        "description": "Warm earthy tone complementary to terracotta, brass, and wooden crafts",
    },
    "transparent_png": {
        "name": "Transparent Cutout",
        "background": None,
        "format": "png",
        "description": "Transparent background PNG for marketing collaterals and custom banners",
    },
}

# Visual filters and mood effects
FILTER_PRESETS: Dict[str, Dict[str, Any]] = {
    "crisp_detail": {
        "name": "Crisp Detail & Edge Sharpening",
        "effects": [{"effect": "unsharp_mask:100"}],
        "description": "High-clarity unsharp mask for fine carvings, filigree, and jewelry",
    },
    "vibrant": {
        "name": "Vibrant Color Boost",
        "effects": [{"effect": "vibrance:40"}],
        "description": "Enhances rich colors without over-saturation, ideal for sarees and textiles",
    },
    "warm_heritage": {
        "name": "Warm Heritage Studio",
        "effects": [{"effect": "art:al_dente"}],
        "description": "Warm artisanal tone for brassware, wooden crafts, and terracotta",
    },
    "golden_studio": {
        "name": "Golden Hour Glow",
        "effects": [{"effect": "tint:equalize:50:gold"}],
        "description": "Warm golden studio lighting for festive items and copper/brassware",
    },
    "vintage": {
        "name": "Artisan Vintage Sepia",
        "effects": [{"effect": "sepia:40"}],
        "description": "Timeless vintage tone for traditional handloom & antiques",
    },
    "soft_blur": {
        "name": "Soft Gaussian Smooth",
        "effects": [{"effect": "blur:200"}],
        "description": "Soft smoothing for backgrounds and dreamy aesthetic",
    },
}

# Category defaults tailored to specific artisan craft requirements
CATEGORY_DEFAULTS: Dict[str, Dict[str, Any]] = {
    "textiles": {
        "aspect_ratio": "portrait_4x5",
        "preset": "ecommerce_white",
        "add_shadow": False,
        "default_filter": "vibrant",
        "description": "Sarees, dupattas, shawls, and apparel requiring tall framing to show full drape",
    },
    "pottery": {
        "aspect_ratio": "square_1x1",
        "preset": "warm_neutral",
        "add_shadow": True,
        "default_filter": "warm_heritage",
        "description": "Terracotta, ceramics, and clay items with 3D depth shadow",
    },
    "wooden_crafts": {
        "aspect_ratio": "square_1x1",
        "preset": "terracotta_sand",
        "add_shadow": True,
        "default_filter": "crisp_detail",
        "description": "Hand-carved woodwork and rustic home decor",
    },
    "jewellery": {
        "aspect_ratio": "square_1x1",
        "preset": "ecommerce_white",
        "add_shadow": False,
        "default_filter": "crisp_detail",
        "description": "Metalwork, silver filigree, and beadwork with high clarity",
    },
    "general": {
        "aspect_ratio": "square_1x1",
        "preset": "ecommerce_white",
        "add_shadow": False,
        "default_filter": None,
        "description": "General artisan handicrafts and home accessories",
    },
}


def get_original_url(public_id: str) -> str:
    """Generate secure URL for original uploaded asset without transformations."""
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        secure=True,
    )
    return url


def get_background_removed_url(public_id: str) -> str:
    """Generate URL with AI background removal applied."""
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        effect="background_removal",
        secure=True,
    )
    return url


def get_enhanced_url(public_id: str) -> str:
    """Generate URL with AI auto enhancement and format/quality optimization."""
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        transformation=[
            {"effect": "auto_enhance"},
            {"fetch_format": "auto", "quality": "auto"},
        ],
        secure=True,
    )
    return url


def get_ecommerce_base_url(
    public_id: str,
    width: int = 1080,
    height: int = 1080,
    background: str = "white",
) -> str:
    """
    Generate URL for background-removed product fitted and centered to e-commerce canvas.
    """
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        transformation=[
            {"effect": "background_removal"},
            {"effect": "trim"},
            {
                "width": width,
                "height": height,
                "crop": "pad",
                "background": background,
            },
            {"fetch_format": "auto", "quality": "auto"},
        ],
        secure=True,
    )
    return url


def get_studio_product_url(
    public_id: str,
    category: str = "general",
    preset: str = "ecommerce_white",
    aspect_ratio: str = "square_1x1",
    add_shadow: Optional[bool] = None,
    filter_name: Optional[str] = None,
    enhance: bool = True,
) -> str:
    """
    Generate professional studio catalog image URL with customizable presets,
    aspect ratios, shadows, visual filters, and category optimizations.
    """
    category_cfg = CATEGORY_DEFAULTS.get(category.lower(), CATEGORY_DEFAULTS["general"])
    preset_cfg = STUDIO_PRESETS.get(preset.lower(), STUDIO_PRESETS["ecommerce_white"])

    # Determine dimensions
    width, height = ASPECT_RATIOS.get(aspect_ratio.lower(), ASPECT_RATIOS["square_1x1"])

    # Determine shadow
    should_add_shadow = category_cfg["add_shadow"] if add_shadow is None else add_shadow

    # Build layered transformation pipeline
    transformation_layers: List[Dict[str, Any]] = [
        {"effect": "background_removal"},
        {"effect": "trim"},  # Auto-crop transparent boundaries to perfectly center the product
    ]

    # Optional 3D contact shadow
    if should_add_shadow:
        transformation_layers.append({
            "effect": "shadow:40",
            "color": "rgb:202020",
            "x": 0,
            "y": 15,
        })

    # AI Lighting & Color Auto-Enhancement
    if enhance:
        transformation_layers.append({"effect": "auto_enhance"})

    # Visual Mood Filter (if specified)
    if filter_name and filter_name.lower() in FILTER_PRESETS:
        transformation_layers.extend(FILTER_PRESETS[filter_name.lower()]["effects"])

    # Canvas framing and background
    pad_layer: Dict[str, Any] = {
        "width": width,
        "height": height,
        "crop": "pad",
    }
    if preset_cfg["background"]:
        pad_layer["background"] = preset_cfg["background"]

    transformation_layers.append(pad_layer)

    # Format & compression optimization
    opt_layer: Dict[str, Any] = {"quality": "auto"}
    if preset_cfg["format"] == "png":
        opt_layer["fetch_format"] = "png"
    else:
        opt_layer["fetch_format"] = "auto"

    transformation_layers.append(opt_layer)

    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        transformation=transformation_layers,
        secure=True,
    )
    return url


def get_final_product_url(
    public_id: str,
    width: int = 1080,
    height: int = 1080,
    background: str = "white",
    enhance: bool = True,
) -> str:
    """
    Backwards-compatible helper for 1:1 square centered e-commerce product image URL.
    """
    transformation_layers = [
        {"effect": "background_removal"},
        {"effect": "trim"},
    ]

    if enhance:
        transformation_layers.append({"effect": "auto_enhance"})

    transformation_layers.extend([
        {
            "width": width,
            "height": height,
            "crop": "pad",
            "background": background,
        },
        {
            "fetch_format": "auto",
            "quality": "auto",
        },
    ])

    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        transformation=transformation_layers,
        secure=True,
    )
    return url