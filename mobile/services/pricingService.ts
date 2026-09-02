import { api } from './api';
import { PricingInput, PricingRecommendation } from '../types';

export const pricingService = {
  /**
   * Deterministic local fallback calculation based on fair artisan labor and cost floor.
   */
  calculateRecommendation: (input: PricingInput): PricingRecommendation => {
    const hours = input.timeSpentHours || (input.laborCost ? input.laborCost / 100 : 4);
    const hourlyRate = input.hourlyRateOverride || (input.craftsmanshipLevel === 'intricate' ? 150 : (input.craftsmanshipLevel === 'basic' ? 75 : 100));
    const labor = hours * hourlyRate;
    const directCost = input.materialCost + labor + (input.otherCost || 0);
    const overhead = directCost * 0.10;
    const totalCost = directCost + overhead;
    const margin = totalCost * 0.20;
    const costFloor = Math.round(totalCost + margin);

    const craftPrem = input.craftsmanshipLevel === 'intricate' ? 0.18 : (input.craftsmanshipLevel === 'basic' ? 0.0 : 0.08);
    const recommendedPrice = Math.round((costFloor * (1.0 + craftPrem + 0.15)) / 10) * 10;
    const minPrice = Math.round(costFloor);
    const maxPrice = Math.round(recommendedPrice * 1.25);

    return {
      recommendedPrice,
      costFloor,
      marketMedian: recommendedPrice,
      minPrice,
      maxPrice,
      confidence: 'cost_only',
      dataSourceType: 'cost_only',
      dataSourceLabel: 'Cost-Based Recommendation',
      dataSourceDescription: 'Market comparison was unavailable, so this recommendation is based on your making costs.',
      comparableCount: 0,
      explanationPoints: [
        `Production cost is ₹${Math.round(totalCost)} (₹${input.materialCost} materials + ${hours}h labor @ ₹${hourlyRate}/hr + ₹${Math.round(overhead)} overhead). Minimum sustainable price is ₹${costFloor}.`,
        `Craftsmanship level: ${input.craftsmanshipLevel || 'skilled'} (+${Math.round(craftPrem * 100)}% handcraft value)`,
        'Calculated from production cost basis; market benchmark comparison was unavailable.'
      ],
      summaryExplanation: `Recommended at ₹${recommendedPrice} based on making cost floor and craft markup.`,
      craftsmanshipAdjustmentPercent: Math.round(craftPrem * 100),
      totalCost: Math.round(totalCost),
      marginPercent: 20,
      explanation: `Cost-based recommendation covering making cost floor of ₹${costFloor} and fair wage for ${hours} hours of craftsmanship.`
    };
  },

  /**
   * Asynchronously calls FastAPI /api/v1/pricing/recommend to obtain
   * real market benchmarks, IQR spread, cost floor, and explainability breakdown.
   */
  getRecommendation: async (input: PricingInput): Promise<PricingRecommendation> => {
    try {
      const payload = {
        product_name: input.productName || 'Handcrafted Artisan Product',
        category: input.category || 'general',
        material: input.material || null,
        craft_type: input.craftType || null,
        material_cost: input.materialCost,
        time_spent_hours: input.timeSpentHours || 4,
        craftsmanship_level: input.craftsmanshipLevel || 'skilled',
        hourly_rate_override: input.hourlyRateOverride || null,
        tags: input.tags || [],
      };

      const res = await api.post<any>('/api/v1/pricing/recommend', payload);

      if (res && res.success && typeof res.suggested_price === 'number') {
        const minPrice = res.market_range?.min || res.cost_floor;
        const maxPrice = res.market_range?.max || Math.round(res.suggested_price * 1.2);

        return {
          recommendedPrice: Math.round(res.suggested_price),
          costFloor: Math.round(res.cost_floor),
          marketMedian: res.market_median ? Math.round(res.market_median) : undefined,
          minPrice: Math.round(minPrice),
          maxPrice: Math.round(maxPrice),
          confidence: res.confidence || 'medium',
          dataSourceType: res.data_source_type || 'craft_benchmark',
          dataSourceLabel: res.data_source_label || 'Craft Category Benchmark',
          dataSourceDescription: res.data_source_description || 'Based on curated Indian handicraft category price benchmarks.',
          comparableCount: res.comparable_count || 0,
          explanationPoints: res.explanation_points || [],
          summaryExplanation: res.summary_explanation || '',
          craftsmanshipAdjustmentPercent: res.craftsmanship_adjustment_percent,
          totalCost: Math.round((res.cost_breakdown?.labor_cost ?? 0) + (res.cost_breakdown?.material_cost ?? 0) + (res.cost_breakdown?.overhead_cost ?? 0) || res.cost_floor * 0.8),
          marginPercent: 20,
          explanation: res.summary_explanation || `Suggested fair price ₹${res.suggested_price} balancing making costs and category benchmarks.`
        };
      }
    } catch (err: any) {
      console.warn('[PricingService] Backend dynamic pricing call failed, using resilient cost-floor fallback:', err.message);
    }

    // Fallback to deterministic local engine if API call fails
    return pricingService.calculateRecommendation(input);
  }
};
