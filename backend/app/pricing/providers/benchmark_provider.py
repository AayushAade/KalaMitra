"""Curated Indian Craft Benchmark Provider.

Provides authentic price distribution baselines across major Indian artisan craft clusters
(Terracotta, Bamboo, Handloom, Dhokra, Woodcarving, Blue Pottery, Brassware, Jute).
Acts as the authoritative, reliable market benchmark provider for the MVP.
"""

from typing import Any, Dict, List, Optional
from backend.app.pricing.providers.base import BaseMarketProvider
from backend.app.schemas.pricing import ComparableProductItem


# Curated category price benchmarks across Indian artisan handicraft traditions
CRAFT_BENCHMARKS: Dict[str, List[Dict[str, Any]]] = {
    "pottery": [
        {"title": "Terracotta Earthenware Water Jug Benchmark", "price": 850.0, "source": "Craft Category Benchmark", "similarity": "Traditional terracotta pottery baseline"},
        {"title": "Handmade Clay Cooking Handi Benchmark", "price": 1200.0, "source": "Craft Category Benchmark", "similarity": "Earthen cooking ware baseline"},
        {"title": "Artisanal Terracotta Table Vase Benchmark", "price": 1450.0, "source": "Craft Category Benchmark", "similarity": "Decorative terracotta craft baseline"},
        {"title": "Jaipur Blue Pottery Planter Benchmark", "price": 1850.0, "source": "Craft Category Benchmark", "similarity": "Glazed artisan pottery craft baseline"},
        {"title": "Terracotta Engraved Floor Urn Benchmark", "price": 2400.0, "source": "Craft Category Benchmark", "similarity": "Intricate decorative terracotta craft baseline"},
    ],
    "bamboo": [
        {"title": "Handwoven Bamboo Utility Basket Benchmark", "price": 650.0, "source": "Craft Category Benchmark", "similarity": "Woven bamboo utility craft baseline"},
        {"title": "Handcrafted Bamboo Lighting Fixture Benchmark", "price": 1950.0, "source": "Craft Category Benchmark", "similarity": "Artisan bamboo lighting category baseline"},
        {"title": "Bamboo & Cane Table Lamp Benchmark", "price": 2350.0, "source": "Craft Category Benchmark", "similarity": "Handmade bamboo bedside light category baseline"},
        {"title": "Handmade Bamboo Floor Storage Basket Benchmark", "price": 2800.0, "source": "Craft Category Benchmark", "similarity": "Large hand-plaited bamboo craft baseline"},
        {"title": "Bamboo Desktop Organizer Set Benchmark", "price": 1400.0, "source": "Craft Category Benchmark", "similarity": "Eco-friendly bamboo office craft baseline"},
    ],
    "textiles": [
        {"title": "Handloom Cotton Mulmul Dupatta Benchmark", "price": 1250.0, "source": "Craft Category Benchmark", "similarity": "Handcrafted natural cotton textile baseline"},
        {"title": "Handwoven Heritage Silk Saree Benchmark", "price": 4800.0, "source": "Craft Category Benchmark", "similarity": "Traditional Indian handloom weave baseline"},
        {"title": "Block Printed Cotton Table Linen Benchmark", "price": 950.0, "source": "Craft Category Benchmark", "similarity": "Artisanal hand-block print category baseline"},
        {"title": "Handwoven Silk-Cotton Kurta Fabric Benchmark", "price": 2200.0, "source": "Craft Category Benchmark", "similarity": "Artisan handloom fabric category baseline"},
        {"title": "Handspun Khadi Shawl Benchmark", "price": 1650.0, "source": "Craft Category Benchmark", "similarity": "Handspun heritage textile category baseline"},
    ],
    "wooden_crafts": [
        {"title": "Hand-carved Hardwood Tableware Benchmark", "price": 750.0, "source": "Craft Category Benchmark", "similarity": "Carved wooden tableware baseline"},
        {"title": "Artisan Wooden Jewellery Box Benchmark", "price": 2100.0, "source": "Craft Category Benchmark", "similarity": "Artisan woodwork with inlay category baseline"},
        {"title": "Traditional Hand-carved Wall Bracket Benchmark", "price": 1850.0, "source": "Craft Category Benchmark", "similarity": "Floral wood carving craft baseline"},
        {"title": "Hardwood Cutwork Serving Tray Benchmark", "price": 2650.0, "source": "Craft Category Benchmark", "similarity": "Premium hardwood joinery craft baseline"},
        {"title": "Natural Lacquer Turned Wood Figurine Benchmark", "price": 1100.0, "source": "Craft Category Benchmark", "similarity": "Turned woodcraft with natural lacquer baseline"},
    ],
    "jewellery": [
        {"title": "Cast Dokra Tribal Pendant Benchmark", "price": 1650.0, "source": "Craft Category Benchmark", "similarity": "Lost-wax cast tribal metal jewellery baseline"},
        {"title": "Artisan Metallic Filigree Earrings Benchmark", "price": 3200.0, "source": "Craft Category Benchmark", "similarity": "Intricate metallic wire filigree baseline"},
        {"title": "Hand-painted Terracotta Jewellery Benchmark", "price": 950.0, "source": "Craft Category Benchmark", "similarity": "Artisan clay jewellery craft baseline"},
        {"title": "Handcrafted Beaded Thread Jewellery Benchmark", "price": 780.0, "source": "Craft Category Benchmark", "similarity": "Artisanal bead and thread jewellery baseline"},
        {"title": "Bell Metal Cast Bangle Benchmark", "price": 1400.0, "source": "Craft Category Benchmark", "similarity": "Traditional cast brass tribal jewellery baseline"},
    ],
    "general": [
        {"title": "Handcrafted Indian Artisan Decor Benchmark", "price": 1200.0, "source": "Craft Category Benchmark", "similarity": "General handmade artisan craft baseline"},
        {"title": "Traditional Indian Handicraft Showcase Benchmark", "price": 1950.0, "source": "Craft Category Benchmark", "similarity": "Artisan creation category baseline"},
        {"title": "Handmade Eco-friendly Living Accessory Benchmark", "price": 2400.0, "source": "Craft Category Benchmark", "similarity": "Artisan home decor category baseline"},
        {"title": "Traditional Finish Craft Gift Article Benchmark", "price": 1600.0, "source": "Craft Category Benchmark", "similarity": "Decorative handicraft category baseline"},
    ],
}


class BenchmarkMarketProvider(BaseMarketProvider):
    """Provides categorized Indian handicraft market benchmarks."""

    @property
    def provider_name(self) -> str:
        return "craft_benchmark_database"

    async def find_comparable_products(
        self,
        product_name: str,
        category: Optional[str] = None,
        material: Optional[str] = None,
        craft_type: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> List[ComparableProductItem]:
        """Match product against curated craft benchmarks based on category, material, and keywords."""
        cat_key = (category or "general").lower()
        if cat_key not in CRAFT_BENCHMARKS:
            # Fallback search by material or craft
            text_to_search = f"{product_name} {material or ''} {craft_type or ''}".lower()
            if any(k in text_to_search for k in ("clay", "terracotta", "pottery", "ceramic")):
                cat_key = "pottery"
            elif any(k in text_to_search for k in ("bamboo", "cane", "wicker", "rattan")):
                cat_key = "bamboo"
            elif any(k in text_to_search for k in ("silk", "cotton", "saree", "shawl", "dupatta", "textile")):
                cat_key = "textiles"
            elif any(k in text_to_search for k in ("wood", "carving", "rosewood", "sheesham")):
                cat_key = "wooden_crafts"
            elif any(k in text_to_search for k in ("jewel", "necklace", "earring", "brass", "silver")):
                cat_key = "jewellery"
            else:
                cat_key = "general"

        items = CRAFT_BENCHMARKS.get(cat_key, CRAFT_BENCHMARKS["general"])
        result = []
        for item in items:
            result.append(
                ComparableProductItem(
                    title=item["title"],
                    price=item["price"],
                    currency="INR",
                    source=item["source"],
                    url=None,  # Benchmarks do not fabricate URLs
                    similarity_reason=item.get("similarity", "Comparable craft category benchmark"),
                )
            )
        return result
