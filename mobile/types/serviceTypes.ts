export interface PricingInput {
  materialCost: number;
  laborCost: number;
  otherCost: number;
}

export interface PricingRecommendation {
  totalCost: number;
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  marginPercent: number;
  explanation: string;
}

export interface CatalogDraft {
  name: string;
  category: string;
  material: string;
  craft: string;
  productionTime: string;
  descriptionEnglish: string;
  descriptionHindi: string;
  tags: string[];
}

export interface VoiceResult {
  transcript: string;
  detectedLanguage: string;
}

export interface ImageProcessingResult {
  originalUrl: string;
  enhancedUrl: string;
  backgroundRemoved: boolean;
  lightingAdjusted: boolean;
}
