"""Market Data Collector orchestrator."""

import asyncio
import logging
from typing import List, Optional, Tuple

from backend.app.pricing.providers.base import BaseMarketProvider
from backend.app.pricing.providers.benchmark_provider import BenchmarkMarketProvider
from backend.app.schemas.pricing import ComparableProductItem

logger = logging.getLogger(__name__)


class MarketDataCollector:
    """Orchestrates market research providers with fallback resilience and explicit data-source classification."""

    def __init__(
        self,
        providers: Optional[List[BaseMarketProvider]] = None,
        timeout_seconds: float = 6.0,
    ):
        self.timeout_seconds = timeout_seconds
        if providers is not None:
            self.providers = providers
        else:
            # Authoritative default for SIH MVP: Curated Indian craft category benchmarks
            self.providers = [
                BenchmarkMarketProvider(),
            ]

    async def collect_comparables(
        self,
        product_name: str,
        category: Optional[str] = None,
        material: Optional[str] = None,
        craft_type: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Tuple[List[ComparableProductItem], str]:
        """Collect comparable products across configured providers.

        Returns:
            Tuple of (list_of_comparables, data_source_type).
            data_source_type is one of:
              - 'live_market_data': ONLY if verified HTTP/search retrieval occurred with real URLs.
              - 'craft_benchmark': Curated category price benchmarks.
              - 'cost_only': No market benchmarks available; strictly production costs.
        """
        all_items: List[ComparableProductItem] = []
        source_type = "cost_only"

        for provider in self.providers:
            try:
                items = await asyncio.wait_for(
                    provider.find_comparable_products(
                        product_name=product_name,
                        category=category,
                        material=material,
                        craft_type=craft_type,
                        tags=tags,
                    ),
                    timeout=self.timeout_seconds,
                )
                if items:
                    all_items.extend(items)

                    # Strict rule: 'live_market_data' is ONLY allowed if every item has a verified URL
                    is_verified_live = (
                        provider.provider_name.startswith("live_")
                        and all(item.url and item.url.startswith("http") for item in items)
                    )
                    if is_verified_live:
                        source_type = "live_market_data"
                    else:
                        source_type = "craft_benchmark"
                    break
            except asyncio.TimeoutError:
                logger.warning(f"[MarketDataCollector] Provider '{provider.provider_name}' timed out after {self.timeout_seconds}s.")
            except Exception as e:
                logger.warning(f"[MarketDataCollector] Provider '{provider.provider_name}' failed: {e}")

        # Fallback to Benchmark provider if primary failed or was empty
        if not all_items:
            try:
                fallback = BenchmarkMarketProvider()
                all_items = await fallback.find_comparable_products(
                    product_name=product_name,
                    category=category,
                    material=material,
                    craft_type=craft_type,
                    tags=tags,
                )
                if all_items:
                    source_type = "craft_benchmark"
            except Exception as e:
                logger.warning(f"[MarketDataCollector] Benchmark fallback failed: {e}")

        if not all_items:
            source_type = "cost_only"

        return all_items, source_type
