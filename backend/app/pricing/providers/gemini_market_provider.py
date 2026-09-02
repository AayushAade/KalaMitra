"""Experimental Non-Live Gemini Market Estimator.

WARNING: This provider uses ungrounded LLM completions. It DOES NOT perform live web search,
grounding, or HTTP retrieval against e-commerce websites.
It is NOT a verified live market-data provider and is DISABLED by default in the production/MVP
market collection path. It exists solely for research/experimental simulation.
"""

import json
import logging
import os
import re
from typing import List, Optional
from google import genai

from backend.app.pricing.providers.base import BaseMarketProvider
from backend.app.schemas.pricing import ComparableProductItem

logger = logging.getLogger(__name__)


class GeminiMarketProvider(BaseMarketProvider):
    """Experimental LLM price estimator (Non-live, disabled in default production path)."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (api_key or os.getenv("GEMINI_API_KEY", "")).strip()
        self._client = None
        if self.api_key:
            try:
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"[GeminiMarketProvider] Failed to configure Gemini client: {e}")

    @property
    def provider_name(self) -> str:
        return "experimental_gemini_estimator"

    async def find_comparable_products(
        self,
        product_name: str,
        category: Optional[str] = None,
        material: Optional[str] = None,
        craft_type: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> List[ComparableProductItem]:
        """Experimental synthetic estimates. NOT verified live market data."""
        if not self._client or not self.api_key:
            return []

        prompt = f"""You are an Indian Handicraft Pricing Research Analyst.
Generate realistic synthetic price baselines for the following craft:
- Product Name: {product_name}
- Category: {category or 'General Handicraft'}
- Material: {material or 'Natural Materials'}
- Craft Tradition: {craft_type or 'Handcrafted'}
- Keywords: {', '.join(tags or [])}

Respond ONLY with valid JSON with 3 synthetic reference baselines:
{{
  "comparables": [
    {{
      "title": "Descriptive category benchmark title",
      "price": 1850.0,
      "similarity_reason": "Synthetic craft category benchmark"
    }}
  ]
}}
"""
        try:
            response = self._client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            raw_text = (response.text or "").strip()
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```(?:json)?\n", "", raw_text)
                raw_text = re.sub(r"\n```$", "", raw_text)

            data = json.loads(raw_text)
            raw_items = data.get("comparables", [])

            results = []
            for item in raw_items:
                price = float(item.get("price", 0))
                if price > 0:
                    results.append(
                        ComparableProductItem(
                            title=str(item.get("title", "Category Benchmark")),
                            price=price,
                            currency="INR",
                            source="AI Synthetic Estimate (Non-live)",
                            url=None,  # Never fabricate URLs
                            similarity_reason=str(item.get("similarity_reason", "Synthetic category benchmark")),
                        )
                    )
            return results
        except Exception as e:
            logger.warning(f"[GeminiMarketProvider] Experimental generation failed: {e}")
            return []
