"""Abstract base class for market data research providers."""

from abc import ABC, abstractmethod
from typing import List, Optional
from backend.app.schemas.pricing import ComparableProductItem


class BaseMarketProvider(ABC):
    """Abstract interface for all market pricing research providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider identifier."""
        pass

    @abstractmethod
    async def find_comparable_products(
        self,
        product_name: str,
        category: Optional[str] = None,
        material: Optional[str] = None,
        craft_type: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> List[ComparableProductItem]:
        """Search and return comparable craft products from this provider's data source."""
        pass
