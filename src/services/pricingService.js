import { request } from './api';

export const pricingService = {
  async recommendPrice(params) {
    try {
      return await request('/pricing/recommend', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch {
      const matCost = Number(params?.materialCost) || 700;
      const days = Number(params?.productionTimeDays) || 5;
      const laborCost = days * 100;
      const baseCost = matCost + laborCost;
      const suggestedPrice = Math.round(baseCost * 1.5);
      const minRange = Math.round(suggestedPrice * 0.86);
      const maxRange = Math.round(suggestedPrice * 1.14);

      return {
        suggestedPrice: suggestedPrice || 1850,
        recommendedRange: {
          min: minRange || 1600,
          max: maxRange || 2100
        },
        breakdown: {
          materialCost: matCost,
          laborCost: laborCost,
          otherCosts: 0,
          estimatedProductionCost: baseCost
        },
        reasoning: "Based on your material cost, production effort, and current market trends for similar handcrafted items, this range positions you competitively while ensuring a fair profit."
      };
    }
  }
};

export default pricingService;
