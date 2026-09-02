"""Centralized Luxury E-Commerce Studio Prompt Engine.

Contains the unified, authoritative master prompt for luxury e-commerce product photography.
"""

from __future__ import annotations

from enum import Enum
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class ProductCategory(str, Enum):
    """Supported artisan craft categories."""
    JEWELLERY = "JEWELLERY"
    POTTERY = "POTTERY"
    CERAMICS = "CERAMICS"
    TEXTILE = "TEXTILE"
    CLOTHING = "CLOTHING"
    WOODEN_HANDICRAFT = "WOODEN_HANDICRAFT"
    METAL_HANDICRAFT = "METAL_HANDICRAFT"
    PAINTING = "PAINTING"
    ARTWORK = "ARTWORK"
    BAG = "BAG"
    HOME_DECOR = "HOME_DECOR"
    GENERIC_HANDICRAFT = "GENERIC_HANDICRAFT"


class VisualStyle(str, Enum):
    """Supported e-commerce visual presentation styles."""
    CLEAN_ECOMMERCE = "CLEAN_ECOMMERCE"
    LUXURY_STUDIO = "LUXURY_STUDIO"
    INDIAN_HERITAGE = "INDIAN_HERITAGE"
    NATURAL_ARTISAN = "NATURAL_ARTISAN"


# -----------------------------------------------------------------------------
# Unified Master Luxury E-Commerce Catalogue Prompt
# -----------------------------------------------------------------------------

MASTER_LUXURY_STUDIO_PROMPT = """Transform the uploaded product photograph into a premium luxury e-commerce catalogue image.

First, carefully identify the main product(s) and preserve the exact physical product shown in the original image. Keep the product's original shape, proportions, size, colors, material, texture, patterns, craftsmanship, details, and natural handmade imperfections completely unchanged. Do not redesign, regenerate, replace, reshape, recolor, duplicate, or add anything to the product.

Remove the existing background completely and replace it with a naturally generated, sophisticated professional product-photography studio environment.

Create a realistic luxury e-commerce setting that complements the product. Choose the background and surface intelligently according to the product's material, color, style, and category. Use elegant materials such as subtle marble, travertine, limestone, refined stone, premium wood, linen, or a sophisticated neutral studio surface when appropriate.

The new environment should look like a real professional photography studio, not an artificial digital background. Create realistic depth, perspective, soft directional studio lighting, natural ambient illumination, subtle contact shadows beneath the product, realistic cast shadows, and believable interaction between the product and the surface.

Make the product look naturally placed and physically photographed in the new environment rather than cut out and pasted onto a background.

Create a premium luxury-brand catalogue composition with balanced framing, elegant negative space, accurate perspective, refined lighting, realistic shadows, professional exposure, accurate white balance, natural colors, high detail, excellent sharpness, and high-resolution output.

The product must remain the hero of the image. The background should enhance the product without distracting from it.

Do NOT use a plain white background.
Do NOT use a solid-color background.
Do NOT use a transparent background.
Do NOT create a simple background-removal cutout.
Do NOT leave the original background visible.
Do NOT add people, hands, text, logos, watermarks, or unrelated objects.
Do NOT change the product in any way.

The final result should look like the SAME physical product was professionally photographed by a luxury e-commerce product photographer and is ready to be uploaded directly to a premium online catalogue."""

# Aliases for unified master prompt
UNIVERSAL_PRESERVATION_PROMPT = MASTER_LUXURY_STUDIO_PROMPT
NEGATIVE_CONSTRAINTS_PROMPT = MASTER_LUXURY_STUDIO_PROMPT
CATEGORY_RULES: Dict[ProductCategory, str] = {cat: MASTER_LUXURY_STUDIO_PROMPT for cat in ProductCategory}
STYLE_DIRECTIVES: Dict[VisualStyle, str] = {style: MASTER_LUXURY_STUDIO_PROMPT for style in VisualStyle}




CATEGORY_KEYWORDS: Dict[ProductCategory, List[str]] = {
    ProductCategory.JEWELLERY: [
        "jewel", "necklace", "ring", "earring", "bracelet", "bangle", "pendant", "jhumka",
        "gold", "silver", "kundan", "meenakari", "gemstone", "beads", "choker", "anklet",
    ],
    ProductCategory.POTTERY: [
        "pottery", "pot", "matka", "clay", "terracotta", "earthen", "pitcher", "soil", "mud",
    ],
    ProductCategory.CERAMICS: [
        "ceramic", "porcelain", "glazed", "mug", "plate", "bowl", "vase", "crockery",
    ],
    ProductCategory.TEXTILE: [
        "textile", "fabric", "weave", "sari", "saree", "dupatta", "shawl", "handloom", "khadi",
        "cotton", "silk", "ikat", "bandhani", "chanderi", "kantha", "linen", "runner", "stole",
    ],
    ProductCategory.CLOTHING: [
        "cloth", "dress", "kurta", "kurti", "shirt", "pant", "lehenga", "jacket", "tunic",
        "apparel", "garment", "wear", "suit",
    ],
    ProductCategory.WOODEN_HANDICRAFT: [
        "wood", "wooden", "timber", "teak", "sheesham", "carved", "carving", "sculpture",
        "wooden toy", "wooden box", "wooden tray",
    ],
    ProductCategory.METAL_HANDICRAFT: [
        "metal", "brass", "bronze", "copper", "dhokra", "dokra", "bell metal", "iron",
        "metallic", "diya", "idol", "statue", "utensil",
    ],
    ProductCategory.PAINTING: [
        "painting", "madhubani", "warli", "pattachitra", "tanjore", "miniature", "canvas",
        "acrylic", "oil painting", "watercolor",
    ],
    ProductCategory.ARTWORK: [
        "artwork", "folk art", "art", "craft", "wall hanging", "tapestry", "papier-mache",
    ],
    ProductCategory.BAG: [
        "bag", "tote", "handbag", "purse", "pouch", "clutch", "backpack", "jute bag",
    ],
    ProductCategory.HOME_DECOR: [
        "decor", "lamp", "cushion", "candle", "candleholder", "clock", "mirror", "planter",
        "vase", "tabletop", "coaster", "rug",
    ],
}


def resolve_product_category(
    explicit_category: Optional[str] = None,
    product_name: Optional[str] = None,
    product_description: Optional[str] = None,
) -> ProductCategory:
    """Resolve product category."""
    import re

    if explicit_category:
        clean = explicit_category.strip().upper().replace(" ", "_").replace("-", "_")
        for cat in ProductCategory:
            if cat.value == clean or clean in cat.value:
                return cat

    combined_text = f"{product_name or ''} {product_description or ''}".lower()
    if combined_text.strip():
        for cat, keywords in CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if re.search(r"\b" + re.escape(kw) + r"\b", combined_text):
                    return cat

    return ProductCategory.GENERIC_HANDICRAFT


def resolve_visual_style(
    explicit_style: Optional[str] = None,
    category: Optional[ProductCategory] = None,
) -> VisualStyle:
    """Resolve visual style."""
    if explicit_style:
        clean = explicit_style.strip().upper().replace(" ", "_").replace("-", "_")
        for style in VisualStyle:
            if style.value == clean or clean in style.value:
                return style

    if category in (ProductCategory.JEWELLERY, ProductCategory.METAL_HANDICRAFT):
        return VisualStyle.LUXURY_STUDIO
    if category in (ProductCategory.TEXTILE, ProductCategory.POTTERY):
        return VisualStyle.INDIAN_HERITAGE

    return VisualStyle.CLEAN_ECOMMERCE



def build_artisan_studio_prompt(
    category: Optional[ProductCategory] = None,
    style: Optional[VisualStyle] = None,
    product_name: Optional[str] = None,
    product_description: Optional[str] = None,
) -> str:
    """Return the unified master luxury e-commerce catalogue prompt."""
    prompt = MASTER_LUXURY_STUDIO_PROMPT
    context_parts = []
    if product_name:
        context_parts.append(f"Product: {product_name.strip()}")
    if product_description:
        context_parts.append(f"Details: {product_description.strip()}")

    if context_parts:
        prompt += f"\n\nContext:\n" + "\n".join(context_parts)

    return prompt
