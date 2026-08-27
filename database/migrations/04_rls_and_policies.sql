-- Enable Row-Level Security (RLS) on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. Users Metadata Table Policies
CREATE POLICY "Users can view and edit their own metadata" ON public.users
    FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Artisan Profiles Table Policies
CREATE POLICY "Artisan profiles public read" ON public.artisan_profiles
    FOR SELECT USING (true);

CREATE POLICY "Artisans can edit their own profile" ON public.artisan_profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. Buyer Profiles Table Policies
CREATE POLICY "Buyer profiles public read" ON public.buyer_profiles
    FOR SELECT USING (true);

CREATE POLICY "Buyers can edit their own profile" ON public.buyer_profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. Products Table Policies
CREATE POLICY "Products public read" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Artisans can manage their own products" ON public.products
    FOR ALL TO authenticated USING (auth.uid() = artisan_id) WITH CHECK (auth.uid() = artisan_id);

-- 5. Product Images Table Policies
CREATE POLICY "Product images public read" ON public.product_images
    FOR SELECT USING (true);

CREATE POLICY "Artisans can manage images of their products" ON public.product_images
    FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_images.product_id AND products.artisan_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_images.product_id AND products.artisan_id = auth.uid()));

-- 6. Product Translations Table Policies
CREATE POLICY "Product translations public read" ON public.product_translations
    FOR SELECT USING (true);

CREATE POLICY "Artisans can manage translations of their products" ON public.product_translations
    FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_translations.product_id AND products.artisan_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_translations.product_id AND products.artisan_id = auth.uid()));

-- 7. Product Tags Table Policies
CREATE POLICY "Product tags public read" ON public.product_tags
    FOR SELECT USING (true);

CREATE POLICY "Artisans can manage tags of their products" ON public.product_tags
    FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_tags.product_id AND products.artisan_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_tags.product_id AND products.artisan_id = auth.uid()));

-- 8. Inquiries Table Policies
CREATE POLICY "Inquiry participants can read their inquiries" ON public.inquiries
    FOR SELECT TO authenticated
    USING (buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.products WHERE products.id = inquiries.product_id AND products.artisan_id = auth.uid()));

CREATE POLICY "Buyers can submit inquiries" ON public.inquiries
    FOR INSERT TO authenticated
    WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Inquiry participants can edit statuses" ON public.inquiries
    FOR UPDATE TO authenticated
    USING (buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.products WHERE products.id = inquiries.product_id AND products.artisan_id = auth.uid()));

-- 9. Chat Messages Table Policies
CREATE POLICY "Participants can read messages in conversation" ON public.messages
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.inquiries 
        WHERE inquiries.id = messages.inquiry_id 
        AND (inquiries.buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.products WHERE products.id = inquiries.product_id AND products.artisan_id = auth.uid()))
    ));

CREATE POLICY "Participants can send messages in conversation" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM public.inquiries 
            WHERE inquiries.id = messages.inquiry_id 
            AND (inquiries.buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.products WHERE products.id = inquiries.product_id AND products.artisan_id = auth.uid()))
        )
    );
