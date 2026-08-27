-- KalaMitra Local Development Seed Script
-- NOTE: This script is intended for local database setups and development testing.
-- It assumes that local developer auth.users are already provisioned in the auth schema.

-- 1. Insert Mock Metadata into public.users
-- Replace these UUIDs with local auth.users.id values provisioned on your dev database.
INSERT INTO public.users (id, email, phone, role)
VALUES 
  ('00000000-0000-0000-0000-000000000101', 'savita@diynest.org', '+91 98765 43210', 'artisan'),
  ('00000000-0000-0000-0000-000000000202', 'raj@traders.com', '+91 88888 88888', 'buyer')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Artisan Profiles
INSERT INTO public.artisan_profiles (id, shop_name, owner_name, craft_specialization, location, language, bio, rating, store_verified)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  'Savita Handicrafts',
  'Savita Devi',
  'Traditional Bamboo & Textile Crafts',
  'Pune, Maharashtra',
  'Hindi',
  'Master artisan with 18+ years of experience in traditional handloom weaving and eco-friendly bamboo handicraft creations.',
  4.90,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Buyer Profiles
INSERT INTO public.buyer_profiles (id, company_name, business_type, location)
VALUES (
  '00000000-0000-0000-0000-000000000202',
  'Raj Traders',
  'Retail Distributor',
  'Mumbai, Maharashtra'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Products
INSERT INTO public.products (id, artisan_id, price, material, production_time, craft, stock, min_order_quantity)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000101',
    1850.00,
    'Pure Silk & Gold Zari Thread',
    '5 days',
    'Traditional Handloom Weaving',
    5,
    5
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000101',
    899.00,
    'Natural Treated Bamboo Strip',
    '2 days',
    'Hand-braided Weaving',
    10,
    10
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Product Translations
INSERT INTO public.product_translations (product_id, language, name, description, voice_transcript)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'en',
    'Handwoven Red and Gold Silk Dupatta',
    'Masterfully woven by skilled artisans in Maharashtra, this silk dupatta showcases intricate traditional handloom craft. Soft, lustrous pure silk intertwined with delicate zari highlights.',
    'This is a handwoven red and gold silk dupatta.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'hi',
    'हस्तनिर्मित लाल और सुनहरी जरी वाला सिल्क दुपट्टा',
    'महाराष्ट्र के कुशल कारीगरों द्वारा हस्तनिर्मित, यह रेशमी दुपट्टा पारंपरिक हथकरघा कला की अनूठी मिसाल है। शुद्ध शहतूत रेशम और जरी की कारीगरी से सजा।',
    'यह एक हाथ से बुना हुआ लाल और सुनहरी जरी वाला सिल्क दुपट्टा है।'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'en',
    'Bamboo Storage Basket',
    'Eco-friendly, durable bamboo basket hand-woven with precision. Perfect for household storage, hamper gifting, or home decor accent.',
    'This is a hand-woven bamboo storage basket.'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'hi',
    'बांस की टोकरी',
    'पर्यावरण-अनुकूल और टिकाऊ बांस की टोकरी जिसे बड़ी कुशलता से हाथ से बुना गया है।',
    'बांस की बनी सुंदर टोकरी है, घरेलू उपयोग के लिए टिकाऊ है।'
  )
ON CONFLICT (product_id, language) DO NOTHING;

-- 6. Insert Product Tags
INSERT INTO public.product_tags (product_id, tag_name)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Silk'),
  ('00000000-0000-0000-0000-000000000001', 'Handloom'),
  ('00000000-0000-0000-0000-000000000001', 'Red & Gold'),
  ('00000000-0000-0000-0000-000000000002', 'Bamboo'),
  ('00000000-0000-0000-0000-000000000002', 'Eco-friendly');

-- 7. Insert Inquiries
INSERT INTO public.inquiries (id, buyer_id, product_id, quantity, expected_delivery, status)
VALUES (
  '00000000-0000-0000-0000-000000001001',
  '00000000-0000-0000-0000-000000000202',
  '00000000-0000-0000-0000-000000000002',
  100,
  '2026-09-20',
  'New'
)
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Chat Messages
INSERT INTO public.messages (id, inquiry_id, sender_id, sender_role, text)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000001001',
  '00000000-0000-0000-0000-000000000202',
  'Buyer',
  'Namaste! Interested in purchasing 100 units of Bamboo Storage Basket for our retail chain in Mumbai. Please confirm bulk discount and estimated timeline.'
)
ON CONFLICT (id) DO NOTHING;
