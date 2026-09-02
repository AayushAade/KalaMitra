-- ===================================================
-- KalaMitra Migration 05: User & Profile Auto-Provisioning
-- ===================================================
-- Automatically provisions public.users and role-specific profile records
-- (artisan_profiles or buyer_profiles) whenever a new auth.users account is created.
-- Preserves the least-privilege security model by keeping profile creation server-side.

-- 1. Unified trigger function for auth.users lifecycle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role varchar(20);
    user_phone text;
    user_lang varchar(10);
BEGIN
    -- Determine role from auth metadata, default to 'artisan'
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'artisan');
    IF user_role NOT IN ('artisan', 'buyer') THEN
        user_role := 'artisan';
    END IF;

    user_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '');
    user_lang := COALESCE(NEW.raw_user_meta_data->>'language', 'Hindi');

    -- 1. Automatically insert corresponding public.users metadata
    INSERT INTO public.users (id, email, phone, role)
    VALUES (
        NEW.id,
        NEW.email,
        user_phone,
        user_role
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.users.phone END;

    -- 2. Automatically insert role-specific profile
    IF user_role = 'artisan' THEN
        INSERT INTO public.artisan_profiles (
            id,
            shop_name,
            owner_name,
            craft_specialization,
            location,
            language
        )
        VALUES (
            NEW.id,
            COALESCE(NULLIF(NEW.raw_user_meta_data->>'shop_name', ''), NULLIF(NEW.raw_user_meta_data->>'name', ''), SPLIT_PART(NEW.email, '@', 1) || '''s Store', 'Artisan Store'),
            COALESCE(NULLIF(NEW.raw_user_meta_data->>'owner_name', ''), SPLIT_PART(NEW.email, '@', 1), 'Artisan'),
            NULLIF(NEW.raw_user_meta_data->>'craft', ''),
            NULLIF(NEW.raw_user_meta_data->>'location', ''),
            user_lang
        )
        ON CONFLICT (id) DO NOTHING;
    ELSIF user_role = 'buyer' THEN
        INSERT INTO public.buyer_profiles (
            id,
            company_name,
            business_type,
            location
        )
        VALUES (
            NEW.id,
            NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
            NULLIF(NEW.raw_user_meta_data->>'business_type', ''),
            NULLIF(NEW.raw_user_meta_data->>'location', '')
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Attach single trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Idempotent Backfill for Existing auth.users
-- 3a. Backfill public.users for existing accounts
INSERT INTO public.users (id, email, phone, role)
SELECT 
    au.id, 
    au.email, 
    COALESCE(au.phone, au.raw_user_meta_data->>'phone', ''), 
    COALESCE(au.raw_user_meta_data->>'role', 'artisan')
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3b. Backfill public.artisan_profiles for existing artisan accounts
INSERT INTO public.artisan_profiles (id, shop_name, owner_name, language)
SELECT 
    pu.id,
    COALESCE(SPLIT_PART(pu.email, '@', 1) || '''s Store', 'Artisan Store'),
    COALESCE(SPLIT_PART(pu.email, '@', 1), 'Artisan'),
    'Hindi'
FROM public.users pu
LEFT JOIN public.artisan_profiles ap ON ap.id = pu.id
WHERE pu.role = 'artisan' AND ap.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3c. Backfill public.buyer_profiles for existing buyer accounts
INSERT INTO public.buyer_profiles (id)
SELECT 
    pu.id
FROM public.users pu
LEFT JOIN public.buyer_profiles bp ON bp.id = pu.id
WHERE pu.role = 'buyer' AND bp.id IS NULL
ON CONFLICT (id) DO NOTHING;
