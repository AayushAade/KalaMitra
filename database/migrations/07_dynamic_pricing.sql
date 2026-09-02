-- ===================================================
-- KalaMitra Migration 07: Dynamic Pricing Audit & Metadata
-- ===================================================
-- Adds optional suggested_price and pricing_metadata columns to public.products.
-- These store the AI recommendation and the explainable pricing breakdown
-- without overwriting the artisan's final chosen selling price (stored in 'price').

-- 1. Add suggested_price numeric column
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS suggested_price numeric(10,2) DEFAULT NULL;

-- 2. Add pricing_metadata jsonb column for transparent cost and market analysis
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS pricing_metadata jsonb DEFAULT NULL;

-- 3. Comment explaining separation of suggested_price and final price
COMMENT ON COLUMN public.products.price IS 'Final selling price chosen by the artisan';
COMMENT ON COLUMN public.products.suggested_price IS 'AI dynamic fair price recommendation';
COMMENT ON COLUMN public.products.pricing_metadata IS 'Telemetry including cost floor, market median, confidence, and explainability factors';
