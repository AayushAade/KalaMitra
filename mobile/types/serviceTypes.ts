export interface PricingInput {
  productName?: string;
  category?: string;
  material?: string;
  craftType?: string;
  materialCost: number;
  timeSpentHours?: number;
  craftsmanshipLevel?: 'basic' | 'skilled' | 'intricate';
  hourlyRateOverride?: number;
  tags?: string[];
  laborCost?: number;
  otherCost?: number;
}

export interface PricingRecommendation {
  recommendedPrice: number;
  costFloor: number;
  marketMedian?: number;
  minPrice: number;
  maxPrice: number;
  confidence: 'high' | 'medium' | 'low' | 'cost_only';
  dataSourceType: 'live_market_data' | 'craft_benchmark' | 'cost_only';
  dataSourceLabel: string;
  dataSourceDescription: string;
  comparableCount: number;
  explanationPoints: string[];
  summaryExplanation: string;
  craftsmanshipAdjustmentPercent?: number;
  totalCost: number;
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

export interface VoiceExtractionMetadata {
  product_name: string;
  category: string;
  subcategory?: string | null;
  material?: string | null;
  craft_type?: string | null;
  colors?: string[];
  production_time_days?: number | null;
  size?: string | null;
  description_english?: string | null;
  description_hindi?: string | null;
  tags?: string[];
  additional_details?: string[];
}

export interface VoiceTranscribeResponse {
  success: boolean;
  transcript: string;
  detected_language: string;
  metadata: VoiceExtractionMetadata;
  error?: string | null;
}

export interface ImageAssetResponse {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at?: string | null;
}

export interface StudioEnhanceResponse {
  success: boolean;
  provider: string;
  original?: ImageAssetResponse | null;
  cutout?: ImageAssetResponse | null;
  enhanced?: ImageAssetResponse | null;
  category: string;
  preset: string;
  aspect_ratio: string;
  shadow_enabled: boolean;
  metadata?: Record<string, any> | null;
  error?: string | null;
  error_code?: string | null;
}

export interface ImageEnhanceOptions {
  category?: string;
  preset?: string;
  aspect_ratio?: string;
  add_shadow?: boolean;
  quality_mode?: string;
  upscale_factor?: number;
  enable_lighting_correction?: boolean;
  enable_super_resolution?: boolean;
  enable_quality_enhancement?: boolean;
}

export interface ImageProcessingResult {
  originalUrl: string;
  enhancedUrl: string;
  cutoutUrl?: string;
  backgroundRemoved: boolean;
  lightingAdjusted: boolean;
  provider?: string;
  metadata?: Record<string, any>;
  error?: string;
  errorCode?: string;
}
