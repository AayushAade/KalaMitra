-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create public.users metadata table referencing Supabase auth.users(id)
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    phone text,
    role varchar(20) NOT NULL CHECK (role IN ('artisan', 'buyer')),
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create artisan profiles table
CREATE TABLE public.artisan_profiles (
    id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    shop_name text NOT NULL,
    owner_name text NOT NULL,
    craft_specialization text,
    location text,
    language varchar(10) DEFAULT 'Hindi' NOT NULL,
    bio text,
    rating numeric(3,2) DEFAULT 5.00 NOT NULL,
    avatar_url text,
    store_verified boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create buyer profiles table
CREATE TABLE public.buyer_profiles (
    id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    company_name text,
    business_type text,
    location text,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for fast search and relations resolution
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_artisan_profiles_location ON public.artisan_profiles(location);
CREATE INDEX idx_buyer_profiles_location ON public.buyer_profiles(location);
