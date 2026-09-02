import { PricingInput, PricingRecommendation } from '../types';

export const pricingService = {
  calculateRecommendation: (input: PricingInput): PricingRecommendation => {
    const totalCost = input.materialCost + input.laborCost + input.otherCost;
    const recommendedPrice = Math.round(totalCost * 1.35);
    const minPrice = Math.round(recommendedPrice * 0.9);
    const maxPrice = Math.round(recommendedPrice * 1.15);
    const marginPercent = 35;

    return {
      totalCost,
      recommendedPrice,
      minPrice,
      maxPrice,
      marginPercent,
      explanation: `AI Pricing formula covers cost of goods sold (COGS) at ₹${totalCost} and appends a standard local artisan group margin of ${marginPercent}% for sustainability and wholesale buffers.`
    };
  }
};
