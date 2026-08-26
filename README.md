# DIY-Nest

AI-powered digital business manager for marginalized artisans.

## SIH 2026

AI-Driven Market Linkage and Smart Cataloging Mobile Application for Marginalized Artisans.

## Vision

DIY-Nest helps marginalized artisans transform their physical products into professional digital listings with minimal technical knowledge.

## Core MVP

Artisan
→ Product Image + Voice Description
→ AI Product Understanding
→ Image Enhancement
→ Multilingual Catalog
→ Pricing Recommendation
→ Digital Product Listing

## Supported Languages

- Hindi
- Marathi
- English

## Technology Stack

- Mobile: React Native + Expo + JavaScript
- Backend: Python + FastAPI
- AI: Google Gemini API
- Image Processing: Cloudinary
- Database: Supabase PostgreSQL
- Version Control: Git + GitHub

## Repository Structure

```text
DIY-Nest/
├── mobile/                 # React Native application
├── backend/                # FastAPI backend
├── ai/                     # AI pipelines
│   ├── voice/              # Voice processing
│   ├── catalog/            # Catalog generation
│   ├── pricing/            # Pricing intelligence
│   └── vision/             # Image enhancement
├── database/               # Database schemas and migrations
├── docs/                   # Technical documentation
├── scripts/                # Development utilities
└── .github/                # GitHub configuration

Team Responsibilities
Member	Responsibility
Aayush	Backend, AI orchestration, integration
Aryan	Computer Vision, image enhancement
Varad	React Native frontend
Omkar	React Native UI/UX
Riddhi	Presentation, research, documentation
Roshni	Presentation, research, documentation
Core AI Pipeline
Voice

Voice
→ Speech Understanding
→ Product Information
→ Catalog Generation
→ English + Hindi Output

Vision

Product Image
→ Cloudinary
→ Background Removal / Enhancement
→ Professional Product Image

Pricing

Product Information
+
Material Cost
+
Labor
+
Market Data
→ Pricing Engine
→ Recommended Price

API Version

All backend APIs use:

/api/v1/

Planned endpoints:

POST /api/v1/catalog/voice
POST /api/v1/image/enhance
POST /api/v1/pricing/recommend
POST /api/v1/products
GET /api/v1/products
GET /api/v1/products/{id}
Development Rules
Do not push directly to main.
Create a feature branch for every feature.
Keep commits small and descriptive.
Open a Pull Request before merging.
Never commit API keys or secrets.
Update API documentation when an API changes.
MVP Priority
P0 — Must Work
Voice input
Hindi / Marathi / English understanding
Product information extraction
English catalog generation
Hindi catalog generation
Image enhancement
Pricing recommendation
Product listing
Future Expansion
Additional Indian languages
B2B buyer matching
Government marketplace integration
Inventory management
Demand forecasting
Market intelligence
Offline-first support
Analytics
