-- Create products table
CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    artisan_id uuid REFERENCES public.artisan_profiles(id) ON DELETE CASCADE NOT NULL,
    price numeric(10,2) NOT NULL,
    material text,
    production_time text,
    craft text,
    stock integer DEFAULT 1 NOT NULL,
    min_order_quantity integer DEFAULT 1 NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create product images table
CREATE TABLE public.product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    original_url text NOT NULL,
    enhanced_url text,
    is_primary boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create product translations table for multilingual support (English, Hindi, Marathi)
CREATE TABLE public.product_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    language varchar(10) NOT NULL, -- e.g. 'en', 'hi', 'mr'
    name text NOT NULL,
    description text,
    voice_transcript text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_product_language UNIQUE (product_id, language)
);

-- Create product tags table for indexing search terms
CREATE TABLE public.product_tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    tag_name varchar(50) NOT NULL
);

-- Indexing for optimized catalog reads and search lookups
CREATE INDEX idx_products_artisan_id ON public.products(artisan_id);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX idx_product_translations_product_id ON public.product_translations(product_id);
CREATE INDEX idx_product_tags_product_id ON public.product_tags(product_id);
CREATE INDEX idx_product_tags_name ON public.product_tags(tag_name);
