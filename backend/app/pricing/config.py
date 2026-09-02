"""Configurable parameters and economic baselines for the Pricing Engine."""

import os
from typing import Dict

# 1. Configurable Labour-Rate Baseline (INR per hour)
# Application configuration assumptions: Basic (₹75/hr), Skilled (₹100/hr), Intricate (₹150/hr).
# Artisans can override these rates with their own custom hourly wage.
DEFAULT_HOURLY_LABOUR_RATE = float(os.getenv("ARTISAN_DEFAULT_HOURLY_RATE", "100.0"))

HOURLY_RATE_TIERS: Dict[str, float] = {
    "basic": float(os.getenv("ARTISAN_HOURLY_RATE_BASIC", "75.0")),
    "skilled": float(os.getenv("ARTISAN_HOURLY_RATE_SKILLED", "100.0")),
    "intricate": float(os.getenv("ARTISAN_HOURLY_RATE_INTRICATE", "150.0")),
}

# 2. Production Overhead Percentage (tools, workshop fuel/kiln, wrapping, packaging)
OVERHEAD_PERCENTAGE = float(os.getenv("PRICING_OVERHEAD_PERCENTAGE", "0.10"))

# 3. Minimum Sustainable Living Margin (essential markup above raw costs)
MINIMUM_MARGIN_PERCENTAGE = float(os.getenv("PRICING_MINIMUM_MARGIN_PERCENTAGE", "0.20"))

# 4. Craftsmanship / Complexity Value Premiums
CRAFTSMANSHIP_PREMIUMS: Dict[str, float] = {
    "basic": 0.0,
    "skilled": 0.08,     # +8% premium for skilled handwork
    "intricate": 0.18,   # +18% premium for master/intricate artistry
}

# 5. Composite Pricing Weights (must sum to 1.0)
WEIGHT_COST_FLOOR = float(os.getenv("PRICING_WEIGHT_COST_FLOOR", "0.40"))
WEIGHT_MARKET_MEDIAN = float(os.getenv("PRICING_WEIGHT_MARKET_MEDIAN", "0.50"))
WEIGHT_CRAFTSMANSHIP = float(os.getenv("PRICING_WEIGHT_CRAFTSMANSHIP", "0.10"))

# 6. Safety Bounds
MAX_MARKET_MULTIPLE = 1.35   # Suggested price cannot exceed 1.35x market median without explicit justification
MIN_PRICE_FLOOR_FACTOR = 1.0 # Suggested price must never drop below 100% of the cost floor
