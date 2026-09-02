-- ===================================================
-- KalaMitra Migration 06: Product Visibility & Publication RLS
-- ===================================================
-- Adds is_published boolean column to public.products with safe defaults.
-- Replaces wide public read policy with strict visibility-based RLS:
-- - Published products (is_published = true) are visible to all users (public marketplace).
-- - Artisans can read their own products even if unpublished (is_published = false).
-- - Artisans cannot view other artisans' unpublished listings.

-- 1. Add is_published column if not present
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false NOT NULL;

-- 2. Backfill existing listings as published (since existing UI flow publishes upon creation)
UPDATE public.products
SET is_published = true
WHERE is_published = false;

-- 3. Replace broad public read policy with visibility-scoped RLS
DROP POLICY IF EXISTS "Products public read" ON public.products;
DROP POLICY IF EXISTS "Published products public read or artisan read own" ON public.products;

CREATE POLICY "Published products public read or artisan read own" ON public.products
    FOR SELECT
    USING (
        is_published = true
        OR (auth.uid() IS NOT NULL AND auth.uid() = artisan_id)
    );

-- 4. Re-verify artisan management policy for full ownership enforcement
DROP POLICY IF EXISTS "Artisans can manage their own products" ON public.products;

CREATE POLICY "Artisans can manage their own products" ON public.products
    FOR ALL TO authenticated
    USING (auth.uid() = artisan_id)
    WITH CHECK (auth.uid() = artisan_id);
