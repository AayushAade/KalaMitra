-- ===================================================
-- KalaMitra Migration 09: Hardened Persistent Artisan Reviews & Rating Security
-- ===================================================

-- 1. Remove hardcoded default 5.00 rating from artisan_profiles and add rating_count
ALTER TABLE public.artisan_profiles ALTER COLUMN rating DROP DEFAULT;
ALTER TABLE public.artisan_profiles ALTER COLUMN rating DROP NOT NULL;
ALTER TABLE public.artisan_profiles ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0 NOT NULL;

-- 2. Reset existing ratings with zero reviews to NULL
UPDATE public.artisan_profiles
SET rating = NULL, rating_count = 0;

-- 3. Create persistent artisan_reviews table with strict relational integrity
CREATE TABLE IF NOT EXISTS public.artisan_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    artisan_id uuid REFERENCES public.artisan_profiles(id) ON DELETE CASCADE NOT NULL,
    buyer_id uuid REFERENCES public.buyer_profiles(id) ON DELETE CASCADE NOT NULL,
    inquiry_id uuid REFERENCES public.inquiries(id) ON DELETE CASCADE NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_artisan_reviews_buyer_inquiry UNIQUE (buyer_id, inquiry_id),
    CONSTRAINT uq_artisan_reviews_inquiry UNIQUE (inquiry_id),
    CONSTRAINT chk_no_self_rating CHECK (buyer_id <> artisan_id)
);

-- 4. Indexing for fast search and relations resolution
CREATE INDEX IF NOT EXISTS idx_artisan_reviews_artisan_id ON public.artisan_reviews(artisan_id);
CREATE INDEX IF NOT EXISTS idx_artisan_reviews_buyer_id ON public.artisan_reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_artisan_reviews_inquiry_id ON public.artisan_reviews(inquiry_id);

-- 5. Immutability trigger on UPDATE for artisan_reviews relationship fields
CREATE OR REPLACE FUNCTION public.prevent_review_relationship_mutation()
RETURNS trigger AS $$
BEGIN
    IF NEW.artisan_id <> OLD.artisan_id OR NEW.buyer_id <> OLD.buyer_id OR NEW.inquiry_id <> OLD.inquiry_id THEN
        RAISE EXCEPTION 'artisan_id, buyer_id, and inquiry_id are immutable once created.';
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_review_relationship_mutation ON public.artisan_reviews;
CREATE TRIGGER trg_prevent_review_relationship_mutation
BEFORE UPDATE ON public.artisan_reviews
FOR EACH ROW
EXECUTE FUNCTION public.prevent_review_relationship_mutation();

-- 6. Trigger to automatically recalculate artisan_profiles.rating and rating_count
CREATE OR REPLACE FUNCTION public.recalculate_artisan_rating()
RETURNS trigger AS $$
DECLARE
    target_artisan_id uuid;
    new_avg numeric(3,2);
    new_count integer;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_artisan_id := OLD.artisan_id;
    ELSE
        target_artisan_id := NEW.artisan_id;
    END IF;

    SELECT 
        ROUND(AVG(rating)::numeric, 2),
        COUNT(*)::integer
    INTO new_avg, new_count
    FROM public.artisan_reviews
    WHERE artisan_id = target_artisan_id;

    UPDATE public.artisan_profiles
    SET 
        rating = new_avg,
        rating_count = COALESCE(new_count, 0)
    WHERE id = target_artisan_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_recalculate_artisan_rating ON public.artisan_reviews;
CREATE TRIGGER trg_recalculate_artisan_rating
AFTER INSERT OR UPDATE OR DELETE ON public.artisan_reviews
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_artisan_rating();

-- 7. Trigger to prevent direct client modification of rating and rating_count on artisan_profiles
CREATE OR REPLACE FUNCTION public.protect_artisan_profile_rating()
RETURNS trigger AS $$
BEGIN
    -- Only allow changes initiated from trigger cascades (pg_trigger_depth > 1)
    IF pg_trigger_depth() = 1 THEN
        IF NEW.rating IS DISTINCT FROM OLD.rating THEN
            NEW.rating := OLD.rating;
        END IF;
        IF NEW.rating_count IS DISTINCT FROM OLD.rating_count THEN
            NEW.rating_count := OLD.rating_count;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_artisan_profile_rating ON public.artisan_profiles;
CREATE TRIGGER trg_protect_artisan_profile_rating
BEFORE UPDATE ON public.artisan_profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_artisan_profile_rating();

-- 8. Enable Row-Level Security
ALTER TABLE public.artisan_reviews ENABLE ROW LEVEL SECURITY;

-- 9. Grant Permissions (least-privilege)
GRANT SELECT ON public.artisan_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.artisan_reviews TO authenticated;

-- 10. Row-Level Security Policies
DROP POLICY IF EXISTS "Public read for artisan reviews" ON public.artisan_reviews;
CREATE POLICY "Public read for artisan reviews" ON public.artisan_reviews
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Buyers can submit reviews for their inquiries" ON public.artisan_reviews;
CREATE POLICY "Buyers can submit reviews for their inquiries" ON public.artisan_reviews
    FOR INSERT TO authenticated
    WITH CHECK (
        buyer_id = auth.uid()
        AND buyer_id <> artisan_id
        AND inquiry_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.inquiries inq
            JOIN public.products prod ON prod.id = inq.product_id
            WHERE inq.id = artisan_reviews.inquiry_id
              AND inq.buyer_id = auth.uid()
              AND prod.artisan_id = artisan_reviews.artisan_id
        )
    );

DROP POLICY IF EXISTS "Buyers can update their own review" ON public.artisan_reviews;
CREATE POLICY "Buyers can update their own review" ON public.artisan_reviews
    FOR UPDATE TO authenticated
    USING (buyer_id = auth.uid())
    WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "Buyers can delete their own review" ON public.artisan_reviews;
CREATE POLICY "Buyers can delete their own review" ON public.artisan_reviews
    FOR DELETE TO authenticated
    USING (buyer_id = auth.uid());
