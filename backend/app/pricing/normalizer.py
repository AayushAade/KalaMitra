"""Market Data Normalization and Outlier Filtering Engine."""

import math
from typing import List, Optional, Tuple
from backend.app.schemas.pricing import ComparableProductItem, MarketStatistics


def normalize_comparables(items: List[ComparableProductItem]) -> List[ComparableProductItem]:
    """Clean, deduplicate, and validate raw comparable product items."""
    seen_titles = set()
    valid_items: List[ComparableProductItem] = []

    for item in items:
        # 1. Price must be a positive number and reasonable for craft items
        if item.price <= 0:
            continue
        # Minimum sensible price for artisan goods is ₹50
        if item.price < 50:
            continue

        # 2. Deduplicate by title key
        norm_title = item.title.lower().strip()
        if norm_title in seen_titles:
            continue
        seen_titles.add(norm_title)

        valid_items.append(item)

    return valid_items


def filter_outliers_iqr(items: List[ComparableProductItem]) -> List[ComparableProductItem]:
    """Remove statistical outliers using Interquartile Range (IQR) rule.

    If sample size is smaller than 4, outlier pruning is skipped to preserve data points.
    """
    if len(items) < 4:
        return items

    prices = sorted(item.price for item in items)
    n = len(prices)

    # Compute Q1 (25th percentile) and Q3 (75th percentile)
    q1_idx = int(n * 0.25)
    q3_idx = int(n * 0.75)
    q1 = prices[q1_idx]
    q3 = prices[q3_idx]
    iqr = q3 - q1

    # Bounds with standard 1.5 * IQR multiplier
    lower_bound = max(50.0, q1 - 1.5 * iqr)
    upper_bound = q3 + 1.5 * iqr

    filtered = [item for item in items if lower_bound <= item.price <= upper_bound]

    # Guard: if filtering removes everything, return original list
    return filtered if filtered else items


def calculate_market_statistics(
    items: List[ComparableProductItem],
    fallback_used: bool = False,
    data_source_type: str = "craft_benchmark",
) -> Optional[MarketStatistics]:
    """Calculate min, max, p25, median, p75 and summary metrics on normalized items."""
    if not items:
        return None

    cleaned = normalize_comparables(items)
    filtered = filter_outliers_iqr(cleaned)

    if not filtered:
        return None

    prices = sorted(item.price for item in filtered)
    n = len(prices)

    min_price = prices[0]
    max_price = prices[-1]

    # Median
    if n % 2 == 1:
        median_price = prices[n // 2]
    else:
        median_price = (prices[n // 2 - 1] + prices[n // 2]) / 2.0

    # Quartiles
    p25_idx = max(0, int(round((n - 1) * 0.25)))
    p75_idx = min(n - 1, int(round((n - 1) * 0.75)))
    p25_price = prices[p25_idx]
    p75_price = prices[p75_idx]

    # Source summary
    sources = list(dict.fromkeys(item.source for item in filtered))
    source_summary = ", ".join(sources[:3])
    if len(sources) > 3:
        source_summary += f" and {len(sources) - 3} others"

    data_source_label = (
        "Live Market Data" if data_source_type == "live_market_data"
        else ("Craft Category Benchmark" if data_source_type == "craft_benchmark"
        else "Cost-Based Recommendation")
    )

    return MarketStatistics(
        min_price=round(min_price, 2),
        max_price=round(max_price, 2),
        median_price=round(median_price, 2),
        p25_price=round(p25_price, 2),
        p75_price=round(p75_price, 2),
        sample_size=n,
        source_summary=source_summary,
        is_fallback=fallback_used,
        data_source_type=data_source_type,
        data_source_label=data_source_label,
    )


def compute_market_confidence(stats: Optional[MarketStatistics]) -> str:
    """Assess confidence score ('high', 'medium', 'low', 'cost_only') based on sample size and spread."""
    if not stats or stats.sample_size == 0:
        return "cost_only"

    n = stats.sample_size
    # Spread metric: Coefficient of variation proxy (IQR / median)
    iqr_ratio = (stats.p75_price - stats.p25_price) / max(1.0, stats.median_price)

    if n >= 5 and iqr_ratio < 0.60:
        return "high"
    elif n >= 2:
        return "medium"
    elif n == 1:
        return "low"
    else:
        return "cost_only"
