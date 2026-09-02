"""Unit tests for the AI Dynamic Pricing Engine, Benchmark Provider, and Normalizer."""

import asyncio
import unittest
from backend.app.pricing.config import (
    DEFAULT_HOURLY_LABOUR_RATE,
    HOURLY_RATE_TIERS,
    MIN_PRICE_FLOOR_FACTOR,
)
from backend.app.pricing.engine import (
    calculate_cost_floor,
    compute_fair_price_recommendation,
)
from backend.app.pricing.market_collector import MarketDataCollector
from backend.app.pricing.normalizer import (
    calculate_market_statistics,
    compute_market_confidence,
    filter_outliers_iqr,
    normalize_comparables,
)
from backend.app.pricing.providers.benchmark_provider import BenchmarkMarketProvider
from backend.app.pricing.providers.gemini_market_provider import GeminiMarketProvider
from backend.app.schemas.pricing import (
    ComparableProductItem,
    CostFloorBreakdown,
    MarketStatistics,
)


class TestPricingEngine(unittest.TestCase):
    """Test suite for deterministic pricing engine, data source classification, and normalizer."""

    def test_cost_floor_calculation_default_rate(self):
        """1. Test cost floor calculation using default skilled labor rate baseline (₹100/hr)."""
        # Material: ₹500, Hours: 5, Skilled tier: ₹100/hr
        # Labor: 5 * 100 = ₹500. Direct: ₹1,000. Overhead (10%): ₹100. Basis: ₹1,100.
        # Margin (20%): ₹220. Cost Floor: ₹1,320.
        floor = calculate_cost_floor(
            material_cost=500.0,
            time_spent_hours=5.0,
            craftsmanship_level="skilled",
        )
        self.assertEqual(floor.material_cost, 500.0)
        self.assertEqual(floor.time_spent_hours, 5.0)
        self.assertEqual(floor.hourly_rate, 100.0)
        self.assertEqual(floor.labor_cost, 500.0)
        self.assertEqual(floor.overhead_cost, 100.0)
        self.assertEqual(floor.minimum_margin, 220.0)
        self.assertEqual(floor.cost_floor, 1320.0)

    def test_cost_floor_hourly_rate_override(self):
        """2. Test cost floor when artisan specifies a custom hourly labor rate."""
        floor = calculate_cost_floor(
            material_cost=300.0,
            time_spent_hours=4.0,
            hourly_rate_override=150.0,
        )
        self.assertEqual(floor.hourly_rate, 150.0)
        self.assertEqual(floor.labor_cost, 600.0)
        # Direct = 900. Overhead = 90. Basis = 990. Margin = 198. Floor = 1188.
        self.assertEqual(floor.cost_floor, 1188.0)

    def test_cost_floor_intricate_craftsmanship_tier(self):
        """3. Test cost floor calculation for intricate tier wage (₹150/hr)."""
        floor = calculate_cost_floor(
            material_cost=400.0,
            time_spent_hours=6.0,
            craftsmanship_level="intricate",
        )
        self.assertEqual(floor.hourly_rate, HOURLY_RATE_TIERS["intricate"])
        self.assertEqual(floor.labor_cost, 900.0)

    def test_normalize_comparables_deduplication_and_filtering(self):
        """4. Test that invalid prices (<₹50) and duplicate titles are filtered."""
        items = [
            ComparableProductItem(title="Handmade Vase", price=1200.0, source="Source A"),
            ComparableProductItem(title="handmade vase", price=1500.0, source="Source B"),
            ComparableProductItem(title="Free Sample", price=0.0, source="Source C"),
            ComparableProductItem(title="Cheap Trinket", price=25.0, source="Source D"),
            ComparableProductItem(title="Artisan Bowl", price=850.0, source="Source E"),
        ]
        cleaned = normalize_comparables(items)
        self.assertEqual(len(cleaned), 2)
        titles = [c.title for c in cleaned]
        self.assertIn("Handmade Vase", titles)
        self.assertIn("Artisan Bowl", titles)

    def test_filter_outliers_iqr(self):
        """5. Test statistical IQR outlier pruning removes extreme prices."""
        items = [
            ComparableProductItem(title="Item 1", price=1000.0, source="A"),
            ComparableProductItem(title="Item 2", price=1100.0, source="A"),
            ComparableProductItem(title="Item 3", price=1200.0, source="A"),
            ComparableProductItem(title="Item 4", price=1300.0, source="A"),
            ComparableProductItem(title="Item 5", price=1400.0, source="A"),
            ComparableProductItem(title="Item Outlier High", price=15000.0, source="B"),
        ]
        filtered = filter_outliers_iqr(items)
        prices = [f.price for f in filtered]
        self.assertNotIn(15000.0, prices)
        self.assertEqual(len(filtered), 5)

    def test_market_statistics_median_and_quartiles(self):
        """6. Test calculation of median, p25, and p75 with craft benchmark attribution."""
        items = [
            ComparableProductItem(title="Item 1", price=800.0, source="Craft Category Benchmark"),
            ComparableProductItem(title="Item 2", price=1200.0, source="Craft Category Benchmark"),
            ComparableProductItem(title="Item 3", price=1600.0, source="Craft Category Benchmark"),
            ComparableProductItem(title="Item 4", price=2000.0, source="Craft Category Benchmark"),
            ComparableProductItem(title="Item 5", price=2400.0, source="Craft Category Benchmark"),
        ]
        stats = calculate_market_statistics(items, data_source_type="craft_benchmark")
        self.assertIsNotNone(stats)
        self.assertEqual(stats.min_price, 800.0)
        self.assertEqual(stats.max_price, 2400.0)
        self.assertEqual(stats.median_price, 1600.0)
        self.assertEqual(stats.sample_size, 5)
        self.assertEqual(stats.data_source_type, "craft_benchmark")
        self.assertEqual(stats.data_source_label, "Craft Category Benchmark")

    def test_confidence_scoring(self):
        """7. Test confidence evaluation based on sample size and variance."""
        stats_high = MarketStatistics(
            min_price=1000, max_price=1400, median_price=1200, p25_price=1100, p75_price=1300,
            sample_size=6, source_summary="Test", is_fallback=False
        )
        self.assertEqual(compute_market_confidence(stats_high), "high")

        stats_none = None
        self.assertEqual(compute_market_confidence(stats_none), "cost_only")

    def test_fair_price_never_falls_below_cost_floor(self):
        """8. Test Price Safety Rule: Recommended price NEVER falls below cost floor."""
        cost_floor = CostFloorBreakdown(
            material_cost=1500.0,
            time_spent_hours=10.0,
            hourly_rate=100.0,
            labor_cost=1000.0,
            overhead_cost=250.0,
            minimum_margin=550.0,
            cost_floor=3300.0,
        )
        market_stats = MarketStatistics(
            min_price=800, max_price=1500, median_price=1200, p25_price=1000, p75_price=1400,
            sample_size=5, source_summary="Test", is_fallback=False, data_source_type="craft_benchmark"
        )
        suggested, _, explanation_points, _ = compute_fair_price_recommendation(
            cost_floor=cost_floor,
            market_stats=market_stats,
            craftsmanship_level="skilled",
        )
        self.assertGreaterEqual(suggested, cost_floor.cost_floor)
        self.assertTrue(any("protect your minimum sustainable price floor" in p for p in explanation_points))

    def test_fair_price_with_intricate_craftsmanship(self):
        """9. Test craftsmanship value premium adjustment for intricate handcrafts."""
        cost_floor = CostFloorBreakdown(
            material_cost=400.0,
            time_spent_hours=5.0,
            hourly_rate=150.0,
            labor_cost=750.0,
            overhead_cost=115.0,
            minimum_margin=253.0,
            cost_floor=1518.0,
        )
        market_stats = MarketStatistics(
            min_price=1800, max_price=2600, median_price=2200, p25_price=1900, p75_price=2400,
            sample_size=5, source_summary="Test", is_fallback=False, data_source_type="craft_benchmark"
        )
        suggested, craft_prem, explanation_points, _ = compute_fair_price_recommendation(
            cost_floor=cost_floor,
            market_stats=market_stats,
            craftsmanship_level="intricate",
        )
        self.assertEqual(craft_prem, 0.18)
        self.assertGreater(suggested, cost_floor.cost_floor)
        self.assertTrue(any("Highly Intricate Craftsmanship" in p for p in explanation_points))

    def test_fair_price_fallback_when_market_data_empty(self):
        """10. Test recommendation computation when no market data is available."""
        cost_floor = CostFloorBreakdown(
            material_cost=600.0,
            time_spent_hours=6.0,
            hourly_rate=100.0,
            labor_cost=600.0,
            overhead_cost=120.0,
            minimum_margin=264.0,
            cost_floor=1584.0,
        )
        suggested, _, explanation_points, _ = compute_fair_price_recommendation(
            cost_floor=cost_floor,
            market_stats=None,
            craftsmanship_level="skilled",
        )
        self.assertGreater(suggested, cost_floor.cost_floor)
        self.assertTrue(any("Market benchmark data unavailable" in p for p in explanation_points))

    def test_benchmark_provider_honest_attribution_and_no_fake_urls(self):
        """11. Test that BenchmarkMarketProvider returns honest benchmark attribution and no fabricated URLs."""
        provider = BenchmarkMarketProvider()
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        items = loop.run_until_complete(
            provider.find_comparable_products("Handmade Bamboo Table Lamp", category="bamboo")
        )
        loop.close()

        self.assertGreater(len(items), 0)
        for item in items:
            self.assertEqual(item.source, "Craft Category Benchmark")
            self.assertIsNone(item.url, "Benchmark provider must not fabricate URLs")
            self.assertIn("Benchmark", item.title)

    def test_market_collector_defaults_to_benchmark_provider(self):
        """12. Test that MarketDataCollector defaults to BenchmarkMarketProvider with craft_benchmark type."""
        collector = MarketDataCollector()
        self.assertEqual(len(collector.providers), 1)
        self.assertIsInstance(collector.providers[0], BenchmarkMarketProvider)

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        items, source_type = loop.run_until_complete(
            collector.collect_comparables("Handmade Bamboo Table Lamp", category="bamboo")
        )
        loop.close()

        self.assertEqual(source_type, "craft_benchmark")
        self.assertGreater(len(items), 0)


if __name__ == "__main__":
    unittest.main()
