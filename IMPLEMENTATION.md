# KalaMitra (कलाMitra) Master Implementation Plan & Architecture Roadmap

Smart India Hackathon 2026 — AI-Driven Market Linkage and Smart Cataloging Mobile Application for Marginalized Artisans.

---

## 1. Project Overview & Architecture Status

KalaMitra empowers traditional artisans to digitize their craft catalog seamlessly through voice inputs, AI-powered image studio enhancement, dynamic pricing intelligence, and wholesale B2B buyer connections.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React Native Mobile App                         │
│             (Expo SDK 54 / TypeScript / Artisan & Buyer UI)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ HTTP / REST / Multipart
┌────────────────────────────────────────────────────────────────────────┐
│                          FastAPI Gateway                               │
│                         (backend/app/api/)                             │
└───────┬───────────────────────────┬───────────────────────────┬────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   AI Vision &    │      │  AI Voice & ASR  │      │ Supabase / PG DB │
│  Studio Engine   │      │ & Smart Catalog  │      │ & Auth & Storage │
│   (ai/vision/)   │      │  (ai/voice, cat) │      │ (database/, RLS) │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

---

## 2. Multi-Phase Implementation Roadmap

| Phase | Module | Scope & Objectives | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Mobile Foundation** | React Native Expo setup, navigation, UI screens (Wizard, Catalog, Chat, Settings) | ✅ **Completed** |
| **Phase 2** | **Frontend Decoupling** | Abstract data access into service layer (`mobile/src/services/`) with mock fallbacks | ✅ **Completed** |
| **Phase 3** | **Database Foundation** | PostgreSQL schemas, migrations, RLS policies, indexing (`database/`) | ✅ **Completed** |
| **Phase 4** | **AI Vision & Studio** | Cloudinary AI background removal, auto-framing, studio filters, lighting correction | ✅ **Completed** (`feature/image-enhancement`) |
| **Phase 5** | **AI Voice & Catalog** | Multi-lingual voice transcription (Hindi/Marathi/English) & Gemini catalog extraction | ✅ **Completed** (`feature/voice-catalog`) |
| **Phase 6** | **Unified Backend Gateway** | FastAPI server integrating Auth, Database CRUD, AI Vision, Voice, and Pricing | 🔄 **In Progress / Next** |
| **Phase 7** | **Mobile Backend Binding** | Connect mobile service layer to live FastAPI backend & Supabase DB | ⏳ **Upcoming** |
| **Phase 8** | **E2E Testing & Polish** | End-to-end artisan flow verification, offline fallback, performance optimization | ⏳ **Upcoming** |

---

## 3. Detailed Component Breakdown & Implementation Status

### 3.1 AI Vision & Studio Enhancement (`ai/vision/`)
- **Status**: Phase 1, Phase 2, Phase 3A, Phase 3B, Phase 3C, and Phase 3D Complete.
- **Phase 1 Deliverables**:
  - `CloudinarySettings` & `configure_cloudinary()`: Idempotent initialization, strict validation, zero credential leakage.
  - `ImageAsset` & `OriginalImageResult`: Strict Pydantic contracts for raw original artisan photo ingestion.
  - `CloudinaryService`: Multi-input upload (stream, bytes, path), metadata query, and asset deletion under `artisan-ai/originals/`.
- **Phase 2 Deliverables**:
  - `PicsartSettings` & `get_picsart_config()`: Safe configuration boundary and key masking for `PICSART_API_KEY`.
  - `PicsartProvider` (`ai/vision/providers/picsart_provider.py`): Isolated REST client for Picsart Remove Background API (`POST /removebg`) with `output_type="cutout"` and `format="PNG"`.
  - `ProcessedImageResult`: Normalized schema isolating the app from provider-specific payload schemas.
- **Phase 3A Deliverables**:
  - `PersistenceBridge` (`ai/vision/persistence.py`): In-memory orchestration connecting Cloudinary original upload (`artisan-ai/originals/`) -> Picsart background removal -> PNG validation -> Cloudinary persistent cutout upload (`artisan-ai/cutouts/`).
  - `PersistenceBridgeResult`: Exposes typed original and cutout asset links.
- **Phase 3B Deliverables**:
  - `StudioComposer` (`ai/vision/studio.py`): E-commerce studio composition engine with 5 backdrop presets, 4 aspect ratios, contact shadows (`e_shadow`), proportional padding (`c_pad`), and delivery optimization (`f_auto, q_auto`) into `artisan-ai/enhanced/`.
  - `EnhancedImageResult`: Normalized schema with original, cutout, and enhanced assets alongside applied preset and ratio metadata.
- **Phase 3C Deliverables**:
  - Extended `PicsartProvider`: Added `upscale()` (`POST /upscale`), `ultra_enhance()` (`POST /upscale/ultra`), and `adjust()` (`POST /adjust`).
  - `QualityEnhancer` (`ai/vision/enhancer.py`): Quality enhancement layer orchestrating super-resolution, detail sharpening, and lighting correction before cutout extraction with graceful fallback.
- **Phase 3D Deliverables**:
  - Cloudinary AI Quality Analysis & Tiered Enhancement: `analyze_image_quality()` classifying `High`, `Medium`, and `Poor` quality tiers with optimal AI transformations (`e_improve`, `e_enhance`, `e_gen_restore`, `e_sharpen`).
  - Multi-tier pipeline combining Cloudinary quality analysis -> Cloudinary AI restoration -> Picsart fine-tuning -> Picsart cutout -> Studio presentation.
  - Comprehensive test suite (69 tests total, 100% mocked isolation) and live developer runner (`test_cloudinary_quality_manual.py`).

### 3.2 AI Voice & Smart Cataloging (`ai/voice/`, `ai/catalog/`)
- **Status**: Implemented on `feature/voice-catalog` (merged to `main`).
- **Features**:
  - `ai/voice/transcriber.py`: Audio recording ingestion & speech-to-text transcription.
  - `ai/catalog/generator.py`: LLM-based entity extraction (Title, Category, Materials, Dimensions, Description, Tags) in Hindi and English.

### 3.3 Database & Schemas (`database/`)
- **Status**: Schemas & migrations defined in `database/`.
- **Tables**:
  - `users`, `artisan_profiles`, `buyer_profiles`
  - `products`, `product_images`, `categories`
  - `inquiries`, `inquiry_items`, `messages`
  - `price_recommendations`

### 3.4 Mobile Application (`mobile/`)
- **Status**: Foundation & UI completed with typed service interfaces.
- **Service Interfaces**:
  - `authService.ts`, `productService.ts`, `inquiryService.ts`, `chatService.ts`, `aiService.ts`, `profileService.ts`.

---

## 4. Current Work & Next Action Items

1. **Branch Consolidation & Integration**:
   - Merge `feature/image-enhancement` and `feature/mobile-foundation` with `main` to form a unified codebase.
2. **FastAPI Gateway Construction (`backend/app/`)**:
   - Expose unified API routes for `/api/v1/auth`, `/api/v1/products`, `/api/v1/studio`, `/api/v1/catalog`, `/api/v1/inquiries`.
3. **Mobile Live Integration**:
   - Switch mobile service implementations from mock providers to live HTTP client calls pointing to FastAPI backend.
4. **Live Validation & Testing**:
   - Execute unit and integration tests across vision, voice, and mobile workflows.

---

*Last Updated: August 28, 2026*
