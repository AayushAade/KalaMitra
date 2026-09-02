"""Explainable AI Pricing Engine for Indian Artisan Handicrafts."""

import math
from typing import List, Optional, Tuple

from backend.app.pricing.config import (
    CRAFTSMANSHIP_PREMIUMS,
    DEFAULT_HOURLY_LABOUR_RATE,
    HOURLY_RATE_TIERS,
    MAX_MARKET_MULTIPLE,
    MIN_PRICE_FLOOR_FACTOR,
    MINIMUM_MARGIN_PERCENTAGE,
    OVERHEAD_PERCENTAGE,
    WEIGHT_COST_FLOOR,
    WEIGHT_CRAFTSMANSHIP,
    WEIGHT_MARKET_MEDIAN,
)
from backend.app.schemas.pricing import (
    CostFloorBreakdown,
    MarketStatistics,
)


def calculate_cost_floor(
    material_cost: float,
    time_spent_hours: float,
    craftsmanship_level: str = "skilled",
    hourly_rate_override: Optional[float] = None,
) -> CostFloorBreakdown:
    """Calculate the non-negotiable cost floor protecting artisan fair wage and investment.

    Cost Floor = (Material Cost + Labour Cost + Overhead) * (1 + Minimum Margin)
    where Labour Cost = Hours Spent * Fair Hourly Wage Rate.
    """
    clean_mat = max(0.0, float(material_cost))
    clean_hours = max(0.0, float(time_spent_hours))

    # Determine hourly labor rate
    if hourly_rate_override is not None and hourly_rate_override > 0:
        hourly_rate = float(hourly_rate_override)
    else:
        tier_key = (craftsmanship_level or "skilled").lower()
        hourly_rate = HOURLY_RATE_TIERS.get(tier_key, DEFAULT_HOURLY_LABOUR_RATE)

    labor_cost = clean_hours * hourly_rate
    direct_cost = clean_mat + labor_cost

    # 10% production overhead for studio tools, kiln fuel, packaging, transit wear
    overhead_cost = direct_cost * OVERHEAD_PERCENTAGE
    total_cost_basis = direct_cost + overhead_cost

    # 20% minimum sustainable artisan margin
    minimum_margin = total_cost_basis * MINIMUM_MARGIN_PERCENTAGE
    cost_floor = total_cost_basis + minimum_margin

    return CostFloorBreakdown(
        material_cost=round(clean_mat, 2),
        time_spent_hours=round(clean_hours, 2),
        hourly_rate=round(hourly_rate, 2),
        labor_cost=round(labor_cost, 2),
        overhead_cost=round(overhead_cost, 2),
        minimum_margin=round(minimum_margin, 2),
        cost_floor=round(cost_floor, 2),
    )


def compute_fair_price_recommendation(
    cost_floor: CostFloorBreakdown,
    market_stats: Optional[MarketStatistics],
    craftsmanship_level: str = "skilled",
    product_name: str = "",
    category: str = "",
    material: str = "",
) -> Tuple[float, float, List[str], str]:
    """Compute explainable fair price recommendation and structured explanation.

    Returns:
        Tuple of (suggested_price, craftsmanship_premium_percent, explanation_points, summary_text)
    """
    tier = (craftsmanship_level or "skilled").lower()
    craft_premium_pct = CRAFTSMANSHIP_PREMIUMS.get(tier, CRAFTSMANSHIP_PREMIUMS["skilled"])

    explanation_points: List[str] = []

    # 1. Base Cost Floor point (Production cost + Minimum margin)
    hours_display = f"{cost_floor.time_spent_hours:g}"
    production_cost = cost_floor.material_cost + cost_floor.labor_cost + cost_floor.overhead_cost
    explanation_points.append(
        f"Production cost is ₹{production_cost:,.0f} (₹{cost_floor.material_cost:,.0f} materials + {hours_display} hrs labor @ ₹{cost_floor.hourly_rate:,.0f}/hr baseline + ₹{cost_floor.overhead_cost:,.0f} overhead). Minimum sustainable price is ₹{cost_floor.cost_floor:,.0f}."
    )

    # 2. Craftsmanship point
    tier_name = "Highly Intricate Craftsmanship" if tier == "intricate" else ("Skilled Handcrafted Work" if tier == "skilled" else "Standard Handmade Craft")
    if craft_premium_pct > 0:
        explanation_points.append(
            f"{tier_name} (+{int(craft_premium_pct * 100)}% value premium for artistic complexity)"
        )
    else:
        explanation_points.append(f"{tier_name} (standard craft complexity)")

    # 3. Benchmark or Market comparison
    category_display = category.replace("_", " ").title() if category else "Craft"
    if market_stats and market_stats.sample_size > 0:
        market_median = market_stats.median_price
        p25 = market_stats.p25_price
        p75 = market_stats.p75_price

        if getattr(market_stats, "data_source_type", "craft_benchmark") == "live_market_data":
            benchmark_label = "Verified live marketplace listings"
        else:
            benchmark_label = f"Comparable {category_display.lower()} category benchmark"

        explanation_points.append(
            f"{benchmark_label}: ₹{p25:,.0f} – ₹{p75:,.0f} (Benchmark Median: ₹{market_median:,.0f})"
        )

        # Weighted composite: Cost Floor (40%) + Market Median (50%) + Craftsmanship (10%)
        craft_component = cost_floor.cost_floor * (1.0 + craft_premium_pct)
        raw_suggested = (
            (WEIGHT_COST_FLOOR * cost_floor.cost_floor)
            + (WEIGHT_MARKET_MEDIAN * market_median)
            + (WEIGHT_CRAFTSMANSHIP * craft_component)
        )

        # Upper bounding: Cannot exceed 1.35x market median unless cost floor requires it
        max_market_allowed = market_median * MAX_MARKET_MULTIPLE
        if raw_suggested > max_market_allowed:
            raw_suggested = max(cost_floor.cost_floor, max_market_allowed)

        # Non-negotiable safety rule: Suggested price must NEVER fall below cost floor
        safe_price = max(cost_floor.cost_floor * MIN_PRICE_FLOOR_FACTOR, raw_suggested)

        if safe_price <= cost_floor.cost_floor:
            explanation_points.append(
                "Price set to protect your minimum sustainable price floor despite lower competing benchmark listings."
            )
        elif safe_price > market_median:
            explanation_points.append(
                f"Positioned above benchmark median due to {hours_display} hours of direct handcrafting."
            )
    else:
        # Fallback when no market data exists
        explanation_points.append(
            "Market benchmark data unavailable; recommendation derived from production cost floor and craft markup."
        )
        safe_price = cost_floor.cost_floor * (1.0 + craft_premium_pct + 0.15)

    # Round to clean retail denomination (nearest ₹10 or ₹50)
    if safe_price >= 1000:
        suggested_price = round(safe_price / 50.0) * 50.0
    else:
        suggested_price = round(safe_price / 10.0) * 10.0

    # Strict safety check: Never allow rounding to dip below cost floor
    if suggested_price < cost_floor.cost_floor:
        suggested_price = math.ceil(cost_floor.cost_floor / 10.0) * 10.0

    # Summary text
    summary_text = (
        f"Recommended at ₹{suggested_price:,.0f} based on ₹{cost_floor.cost_floor:,.0f} minimum sustainable price "
        f"and {tier_name.lower()}."
    )

    return suggested_price, craft_premium_pct, explanation_points, summary_text
