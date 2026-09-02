"""Integration and endpoint unit tests for the Pricing API."""

import unittest
from fastapi.testclient import TestClient

from backend.app.main import app


class TestPricingAPI(unittest.TestCase):
    """Test suite for /api/v1/pricing/recommend endpoint."""

    def setUp(self):
        self.client = TestClient(app)

    def test_pricing_recommend_valid_craft_input(self):
        """1. Test valid pricing recommendation request for handcrafted bamboo lamp."""
        payload = {
            "product_name": "Handmade Bamboo Table Lamp",
            "category": "bamboo",
            "material": "Bamboo Cane",
            "craft_type": "Handwoven Cane",
            "material_cost": 450.0,
            "time_spent_hours": 5.0,
            "craftsmanship_level": "intricate",
            "tags": ["bamboo", "lamp", "handwoven", "eco-friendly"],
        }
        response = self.client.post("/api/v1/pricing/recommend", json=payload)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("suggested_price", data)
        self.assertIn("cost_floor", data)
        self.assertIn("cost_breakdown", data)
        self.assertIn("confidence", data)
        self.assertIn("explanation_points", data)

        # Data source type verification
        self.assertEqual(data["data_source_type"], "craft_benchmark")
        self.assertEqual(data["data_source_label"], "Craft Category Benchmark")

        # Price safety check
        self.assertGreaterEqual(data["suggested_price"], data["cost_floor"])
        # Cost breakdown check
        breakdown = data["cost_breakdown"]
        self.assertEqual(breakdown["material_cost"], 450.0)
        self.assertEqual(breakdown["time_spent_hours"], 5.0)
        # Intricate rate is ₹150/hr -> labor cost ₹750
        self.assertEqual(breakdown["hourly_rate"], 150.0)
        self.assertEqual(breakdown["labor_cost"], 750.0)

        # Explanations present
        self.assertTrue(len(data["explanation_points"]) >= 2)

        # Comparables have no fake URLs
        for comp in data["comparables"]:
            self.assertEqual(comp["source"], "Craft Category Benchmark")
            self.assertIsNone(comp["url"])

    def test_pricing_recommend_validation_error_negative_cost(self):
        """2. Test validation failure when negative material cost is submitted."""
        payload = {
            "product_name": "Invalid Pottery",
            "material_cost": -200.0,
            "time_spent_hours": 3.0,
        }
        response = self.client.post("/api/v1/pricing/recommend", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_pricing_recommend_empty_name_validation(self):
        """3. Test validation failure when product name is empty."""
        payload = {
            "product_name": "",
            "material_cost": 200.0,
            "time_spent_hours": 3.0,
        }
        response = self.client.post("/api/v1/pricing/recommend", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_regression_handmade_bamboo_table_lamp_is_explicitly_benchmark(self):
        """4. Regression Test: Sample input must be explicitly identified as craft benchmark data."""
        payload = {
            "product_name": "Handmade Bamboo Table Lamp",
            "category": "bamboo",
            "material": "Natural Bamboo Cane",
            "craft_type": "Handwoven Cane & Bamboo",
            "material_cost": 600.0,
            "time_spent_hours": 6.0,
            "craftsmanship_level": "intricate",
            "tags": ["bamboo", "lamp", "handwoven", "bedside", "home decor"],
        }
        response = self.client.post("/api/v1/pricing/recommend", json=payload)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        # Explicit data source classification
        self.assertEqual(data["data_source_type"], "craft_benchmark")
        self.assertEqual(data["data_source_label"], "Craft Category Benchmark")

        # Numerical verification
        # Material: 600, Labor: 6 * 150 = 900, Direct: 1500, Overhead (10%): 150, Margin (20%): 330
        self.assertEqual(data["cost_floor"], 1980.0)
        self.assertGreaterEqual(data["suggested_price"], 1980.0)

        # No fabricated URLs or platform sources
        for comp in data["comparables"]:
            self.assertEqual(comp["source"], "Craft Category Benchmark")
            self.assertIsNone(comp["url"])


if __name__ == "__main__":
    unittest.main()
