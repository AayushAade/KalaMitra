import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const PricingAssistantPage = () => {
  const { products } = useApp();

  const [materialCost, setMaterialCost] = useState(700);
  const [productionDays, setProductionDays] = useState(5);
  const [targetMargin, setTargetMargin] = useState(30);

  const calculateRecommendation = () => {
    const laborCost = productionDays * 100;
    const baseCost = Number(materialCost) + laborCost;
    const recommended = Math.round(baseCost * (1 + targetMargin / 100));
    const minRange = Math.round(recommended * 0.88);
    const maxRange = Math.round(recommended * 1.12);
    return { baseCost, laborCost, recommended, minRange, maxRange };
  };

  const calc = calculateRecommendation();

  return (
    <div className="bg-background min-h-screen pb-24 pt-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl soft-shadow border border-outline-variant/30 text-center sm:text-left">
        <span className="text-xs font-bold text-tertiary uppercase bg-tertiary-fixed px-3 py-1 rounded-full">
          Fair Profit Calculator
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-display-lg text-on-surface mt-2">
          AI Pricing Assistant
        </h1>
        <p className="text-sm text-on-surface-variant">Calculate fair market pricing based on material costs and labor hours.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl soft-shadow border border-surface-variant space-y-4">
          <h3 className="font-bold text-on-surface text-lg">Product Cost Inputs</h3>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              Raw Material Cost (₹)
            </label>
            <input
              type="number"
              value={materialCost}
              onChange={(e) => setMaterialCost(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-low border rounded-xl font-bold text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              Production Effort (Days)
            </label>
            <input
              type="number"
              value={productionDays}
              onChange={(e) => setProductionDays(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-low border rounded-xl font-bold text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              Desired Profit Margin ({targetMargin}%)
            </label>
            <input
              type="range"
              min="10"
              max="60"
              value={targetMargin}
              onChange={(e) => setTargetMargin(e.target.value)}
              className="w-full accent-primary"
            />
          </div>
        </div>

        {/* AI Output Card */}
        <div className="bg-surface-bright p-6 rounded-3xl soft-shadow border-2 border-primary space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-xs font-bold text-primary uppercase bg-primary-fixed px-3 py-1 rounded-full">
              Recommended Selling Price
            </span>
            <div className="text-4xl font-bold text-primary font-display-lg">
              ₹{calc.recommended}
            </div>
            <p className="text-xs text-on-surface-variant">
              Competitive Market Range: <strong>₹{calc.minRange} – ₹{calc.maxRange}</strong>
            </p>
          </div>

          <div className="bg-surface-container-low p-4 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Material Cost:</span>
              <span className="font-bold">₹{materialCost}</span>
            </div>
            <div className="flex justify-between">
              <span>Labor Fair Wage:</span>
              <span className="font-bold">₹{calc.laborCost}</span>
            </div>
            <div className="flex justify-between font-bold text-primary pt-2 border-t text-sm">
              <span>Total Estimated Cost:</span>
              <span>₹{calc.baseCost}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingAssistantPage;
