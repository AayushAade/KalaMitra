"""KalaMitra E-Commerce Studio Staging Master Prompt Module.

Unified, authoritative master prompt for luxury e-commerce product photography.
"""

from typing import Optional

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


CATEGORY_STAGING_DIRECTIVES = {cat: MASTER_LUXURY_STUDIO_PROMPT for cat in ("pottery", "textiles", "jewellery", "wooden_crafts", "general")}
BACKGROUND_PRESET_DIRECTIVES = {preset: MASTER_LUXURY_STUDIO_PROMPT for preset in ("ecommerce_white", "warm_neutral", "terracotta_sand", "minimal_grey", "travertine_podium")}


def build_studio_edit_prompt(
    category: str = "general",
    preset: str = "warm_neutral",
    aspect_ratio: str = "1:1",
    lighting_style: Optional[str] = None,
) -> str:
    """Construct the unified master luxury e-commerce studio enhancement prompt."""
    return MASTER_LUXURY_STUDIO_PROMPT

