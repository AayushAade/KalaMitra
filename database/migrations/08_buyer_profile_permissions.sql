-- ===================================================
-- KalaMitra Migration 08: Universal Buyer Profile Provisioning & Permissions
-- ===================================================
-- Ensures every authenticated user (including artisans acting as marketplace buyers)
-- has a valid buyer_profiles record and permissions to create/update their buyer profile.

-- 1. Grant INSERT on buyer_profiles to authenticated users
GRANT INSERT ON public.buyer_profiles TO authenticated;

-- 2. Add RLS policy allowing authenticated users to create their own buyer profile
DROP POLICY IF EXISTS "Users can create their own buyer profile" ON public.buyer_profiles;
CREATE POLICY "Users can create their own buyer profile" ON public.buyer_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- 3. Update handle_new_user trigger to always provision buyer_profiles for all accounts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role varchar(20);
    user_phone text;
    user_lang varchar(10);
    user_name text;
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'artisan');
    IF user_role NOT IN ('artisan', 'buyer') THEN
        user_role := 'artisan';
    END IF;

    user_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '');
    user_lang := COALESCE(NEW.raw_user_meta_data->>'language', 'Hindi');
    user_name := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
        NULLIF(NEW.raw_user_meta_data->>'name', ''),
        NULLIF(NEW.raw_user_meta_data->>'owner_name', ''),
        SPLIT_PART(NEW.email, '@', 1),
        'User'
    );

    -- 1. Automatically insert public.users metadata
    INSERT INTO public.users (id, email, phone, role)
    VALUES (NEW.id, NEW.email, user_phone, user_role)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.users.phone END;

    -- 2. Always provision a buyer_profile so every user can purchase/inquire in marketplace
    INSERT INTO public.buyer_profiles (id, company_name, business_type, location)
    VALUES (
        NEW.id,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), user_name),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'business_type', ''), 'Wholesale Buyer'),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'location', ''), 'India')
    )
    ON CONFLICT (id) DO NOTHING;

    -- 3. If role is artisan, also provision artisan_profile
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
            COALESCE(NULLIF(NEW.raw_user_meta_data->>'shop_name', ''), user_name || '''s Store', 'Artisan Store'),
            user_name,
            NULLIF(NEW.raw_user_meta_data->>'craft', ''),
            NULLIF(NEW.raw_user_meta_data->>'location', ''),
            user_lang
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4. Backfill buyer_profiles for all existing users (including all existing artisan accounts)
INSERT INTO public.buyer_profiles (id, company_name, business_type, location)
SELECT 
    pu.id,
    COALESCE(ap.owner_name, SPLIT_PART(pu.email, '@', 1), 'Verified Buyer'),
    'Wholesale Buyer',
    COALESCE(ap.location, 'India')
FROM public.users pu
LEFT JOIN public.artisan_profiles ap ON ap.id = pu.id
LEFT JOIN public.buyer_profiles bp ON bp.id = pu.id
WHERE bp.id IS NULL
ON CONFLICT (id) DO NOTHING;
