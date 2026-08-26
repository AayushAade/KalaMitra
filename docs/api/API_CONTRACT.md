DIY-Nest API Contract

All backend APIs use:

/api/v1/


1. Voice Catalog

POST /api/v1/catalog/voice

Input:
- Audio file
- Optional language

Supported languages:
- hi — Hindi
- mr — Marathi
- en — English

Output:

{
  "language": "hi",
  "transcript": "...",
  "product": {
    "name": "...",
    "category": "...",
    "material": "...",
    "color": "...",
    "craft_type": "...",
    "production_time_days": null
  },
  "catalog": {
    "title_en": "...",
    "description_en": "...",
    "title_hi": "...",
    "description_hi": "...",
    "keywords": []
  }
}


2. Image Enhancement

POST /api/v1/image/enhance

Input:
- Product image

Output:

{
  "original_url": "...",
  "enhanced_url": "..."
}


3. Pricing

POST /api/v1/pricing/recommend

Input:
- Product attributes
- Material cost
- Labor cost
- Other pricing inputs

Output:

{
  "recommended_price": 0,
  "minimum_price": 0,
  "maximum_price": 0,
  "explanation": "..."
}


4. Products

POST /api/v1/products

Creates a product listing.


GET /api/v1/products

Returns artisan products.


GET /api/v1/products/{id}

Returns a specific product.
