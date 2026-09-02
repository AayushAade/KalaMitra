# KalaMitra — Phase 3.1: Gemini / Nano Banana Image Enhancement Architecture Audit

**Project:** DIY-Nest / KalaMitra  
**Status:** Audit Completed (Read-Only Inspection)  
**Date:** 2026-08-29  
**Target Next Phase:** Phase 3.2 (Gemini / Nano Banana Primary Engine Implementation)

---

## Executive Summary

This document presents the comprehensive architectural audit of the **KalaMitra AI Artisan Vision & Image Enhancement Engine**. It analyzes the existing multi-stage local pipeline, Cloudinary asset persistence lifecycle, security boundaries, and test coverage, and defines the target integration architecture for **Google Gemini / Nano Banana** as the primary e-commerce studio generation engine while retaining our robust, offline-capable local pipeline as a 100% resilient fallback.

---

## 1. Current Vision Architecture Overview

The vision system is organized cleanly inside `ai/vision/` and wrapped by FastAPI under `backend/app/api/v1/studio.py`:

```
ai/vision/
├── __init__.py                # Package exports and public interface
├── config.py                  # Environment variable validation & secret masking
├── schemas.py                 # Pydantic schemas for assets, results, and telemetry
├── cloudinary_service.py      # Cloudinary storage, upload flows, and URL transformations
├── persistence.py             # Cloudinary -> Cutout -> Cloudinary persistence bridge
├── lighting.py                # AI white balance, CLAHE, and auto-exposure engine
├── studio.py                  # E-commerce studio framing, presets, and contact shadows
├── enhancer.py                # QualityEnhancer: 4-stage master pipeline orchestrator
├── providers/
│   ├── __init__.py            # Provider exports
│   ├── picsart_provider.py    # Picsart REST API client (cloud fallback)
│   ├── rembg_provider.py      # Rembg U2-Net offline background removal
│   └── sr_provider.py         # SuperResolutionProvider (Lanczos-4 + bilateral + unsharp)
└── tests/                     # 78 unit, integration, and manual verification tests
```

---

## 2. Inventory & Inspection of Existing Providers

| Component | File Path | Class / Function | Inputs | Outputs | Env Config | Status & Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cloudinary Service** | `ai/vision/cloudinary_service.py` | `CloudinaryService` | `Path`, `bytes`, stream | `OriginalImageResult`, `ImageAsset` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | **Production-Ready**. Serves as the central immutable media vault. |
| **Lighting Corrector** | `ai/vision/lighting.py` | `LightingCorrector` | `Path`, `bytes`, `np.ndarray` | `Tuple[bytes, Dict]` | None (Local OpenCV) | **Production-Ready**. Gray-World white balance + CLAHE in LAB space. |
| **Super Resolution** | `ai/vision/providers/sr_provider.py` | `SuperResolutionProvider` | `Path`, `bytes`, `np.ndarray` | `Tuple[bytes, Dict]` | None (Local OpenCV/PIL) | **Production-Ready**. Lanczos-4 upscaling with bilateral edge preservation. |
| **Local Background Matting** | `ai/vision/providers/rembg_provider.py` | `RembgProvider` | `Path`, `bytes`, stream | `ProcessedImageResult` (PNG bytes) | None (Local U2-Net ONNX) | **Production-Ready**. Offline transparent cutout extractor. |
| **Picsart Cloud AI** | `ai/vision/providers/picsart_provider.py` | `PicsartProvider` | `Path`, `bytes`, stream, URL | `ProcessedImageResult` (CDN URL) | `PICSART_API_KEY` | **Production-Ready**. Secondary cloud fallback for background removal/ultra-enhance. |
| **Studio Composer** | `ai/vision/studio.py` | `StudioComposer` | `ImageAsset` (cutout) | `EnhancedImageResult` | None (Uses Cloudinary SDK) | **Production-Ready**. Applies 5 e-commerce studio presets + contact shadows. |
| **Master Enhancer** | `ai/vision/enhancer.py` | `QualityEnhancer` | `Path`, `bytes`, stream | `EnhancedImageResult` | Orchestrates all providers | **Production-Ready**. Orchestrates the 4-stage local and cloud pipeline. |

---

## 3. Inspection of Current Gemini Implementation

### Current Findings:
- **API Key Configuration:** `GEMINI_API_KEY` is present in `.env` and `.env.example`.
- **SDK Installation:** `google-genai` (v1.x) and `google-generativeai` (v0.8.x) are installed in `.venv`.
- **Active Gemini Provider File:** No standalone `GeminiProvider` or `NanoBananaProvider` currently resides in `ai/vision/providers/`.
- **Current State:** Gemini vision generation has been tested via exploratory scripts using `google-genai` client, but is not yet wrapped as a formal project provider implementing the `ProcessedImageResult` contract.
- **Model Target for Phase 3.2:** `gemini-3.1-flash-image` (Nano Banana 2) / `gemini-3-pro-image` (Nano Banana Pro) with multimodal image input and studio prompt staging.

---

## 4. Cloudinary Lifecycle & Asset Vault Inspection

The Cloudinary architecture enforces strict asset separation and immutability:

```
Cloudinary Account (dyqdsvh2i)
└── artisan-ai/
    ├── originals/           # Raw immutable artisan uploads (never overwritten or modified)
    ├── cutouts/             # Pure transparent alpha PNG cutouts (high-res)
    ├── enhanced/            # Final 1:1 / 4:5 commercial studio assets (WebP/Auto)
    └── quality-enhanced/   # Intermediate cloud-upscaled assets
```

### Key Lifecycle Attributes:
1. **Immutability:** Original images are tagged `original` and stored with unique UUIDs. They are never overwritten by downstream transformations.
2. **Secure HTTPS Delivery:** All returned URLs are constructed using `secure=True` HTTPS CDN endpoints.
3. **Format Optimization:** Studio compositions automatically convert to WebP / Auto format with dynamic quality optimization (`f_auto, q_auto`).

---

## 5. Inspection of the Local Fallback Pipeline

The existing local pipeline in `QualityEnhancer.process_enhanced_studio_pipeline()` executes seamlessly without internet or external API dependencies:

1. **Ingest & Quality Analysis:** Validates dimensions and checks for blur/underexposure.
2. **Stage 1 (Lighting Correction):** Fixes yellow tungsten casts and underexposed shadows via `LightingCorrector`.
3. **Stage 2 (Super-Resolution):** Reconstructs 2x/4x micro-textures and sharpens edges via `SuperResolutionProvider`.
4. **Stage 3 (Rembg Cutout):** Extracts pure transparent PNG cutouts via `RembgProvider`.
5. **Stage 4 (Studio Framing):** Composites cutouts onto curated backdrops (`ecommerce_white`, `warm_neutral`, `terracotta_sand`, `minimal_grey`) with physical contact shadows via `StudioComposer`.

**Fallback Entry Point:** `QualityEnhancer.process_enhanced_studio_pipeline()` serves as the ideal fallback router if Gemini API encounters rate limits, timeouts, or fidelity check rejections.

---

## 6. Inspection of Quality & Fidelity Capabilities

### What Already Exists:
- **Laplacian Variance:** Heuristic blur detection (`laplacian_var < 100.0` flags blurry shots).
- **Mean Luminance:** Underexposure (`< 60`) and overexposure (`> 210`) detection.
- **Color Contrast:** Standard deviation of gray intensities (`contrast < 35.0` flags low contrast).
- **Heuristic Quality Score:** 0.0 to 100.0 scoring classifying images into `poor`, `medium`, and `high`.

### What is Missing (To be Implemented in Phase 3.2):
- **Structural Similarity Metric (SSIM / MS-SSIM):** Compares product structure before and after AI editing.
- **Product Alpha Mask Overlap (IoU / Silhouette Delta):** Ensures the AI generator did not alter outer geometry, earring hooks, or pottery outlines.
- **Color Histogram Delta (CIELAB ΔE):** Validates that authentic gemstone, dye, and enamel colors were not artificially altered.
- **Component Count / Saliency Check:** Ensures items (e.g. 2 earrings) were not deleted or duplicated.

---

## 7. Architecture Gap Analysis

| Requirement | Current Status | Gap / Required Action in Phase 3.2 |
| :--- | :--- | :--- |
| **Gemini API Integration** | Key in `.env`; SDK installed | Create `GeminiStudioProvider` (`ai/vision/providers/gemini_studio.py`) implementing `ProcessedImageResult` |
| **KalaMitra Master Prompt** | Documented in specs | Embed strict zero-alteration system prompt and category art directives into provider |
| **Product Fidelity Validator** | Basic blur/exposure checks | Build `ProductFidelityValidator` (`ai/vision/fidelity.py`) with SSIM and mask IoU checks |
| **Automated Fallback Router** | QualityEnhancer orchestrates local/cloud | Update `QualityEnhancer` to route: Gemini Primary $\rightarrow$ Fidelity Check $\rightarrow$ Local Fallback on failure |
| **FastAPI REST Endpoint** | Mounted at `/api/v1/studio/enhance` | Ensure response schema carries `provider` (`gemini_nano_banana` vs `local_fallback`) and telemetry |

---

## 8. Proposed Target Architecture for Phase 3.2

```
                                RAW ARTISAN IMAGE
                                        │
                                        ▼
                            CLOUDINARY STORAGE VAULT
                           (artisan-ai/originals/)
                                        │
                                        ▼
                           IMAGE QUALITY PRE-ANALYSIS
                        (Blur, Resolution, Craft Category)
                                        │
                                        ▼
                         GEMINI / NANO BANANA STUDIO ENGINE
                      (gemini-3.1-flash-image / Master Prompt)
                                        │
                                        ▼
                          PRODUCT FIDELITY VALIDATOR
                       (SSIM > 0.85, Mask IoU > 0.90, ΔE < 12)
                                  │            │
                                [PASS]       [FAIL / TIMEOUT]
                                  │            │
                                  ▼            ▼
                             CLOUDINARY    LOCAL FALLBACK PIPELINE
                            FINAL ASSET    (Lighting → SR → Rembg → Studio)
                                  │            │
                                  └─────┬──────┘
                                        ▼
                            FINAL E-COMMERCE CATALOG ASSET
                             (artisan-ai/enhanced/)
```

---

## 9. Security Audit Findings

1. **Server-Side Key Isolation:** All API credentials (`GEMINI_API_KEY`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `PICSART_API_KEY`) are read strictly server-side in Python via `ai/vision/config.py`.
2. **Secret Masking:** `CloudinarySettings.__repr__()` and `PicsartSettings.__repr__()` explicitly mask secrets (`******` and `prefix...`) to prevent leakage in logs and exception traces.
3. **No Client Leakage:** No API secrets are bundled in mobile or frontend React Native source code.
4. **Git Protection:** `.env` is correctly excluded via `.gitignore`. `.env.example` contains only empty template keys.

---

## 10. Test Audit Breakdown

The test suite contains **78 tests** across unit, integration, and manual suites:

- **Unit Tests (Mocked API):**
  - `test_cloudinary_service.py` (14 tests) — Uploads, transforms, tags, deletions.
  - `test_picsart_provider.py` (12 tests) — Multipart encoding, payload prep, error handling.
  - `test_studio.py` (15 tests) — Presets, aspect ratios, shadow geometry.
  - `test_enhancer.py` (10 tests) — Mode dispatch, input normalization, pipeline routing.
  - `test_lighting.py` (6 tests) — White balance, CLAHE, luminance shifts.
  - `test_super_resolution.py` (5 tests) — 2x/4x scaling, bilateral filtering, unsharp mask.
- **Integration Tests (Live with local files):**
  - `test_persistence.py` (8 tests) — Cloudinary $\leftrightarrow$ Cutout roundtrips.
  - `test_cloudinary_quality.py` (5 tests) — Quality analysis & transform recommendations.
  - `test_enhancer_manual.py` (3 tests) — Live end-to-end multi-stage pipeline run on real photo.
- **Pass Rate:** **78 / 78 Passing (100% OK)**.

---

## 11. Proposed Files for Phase 3.2

In Phase 3.2, the following modules will be created or updated:

1. **`ai/vision/providers/gemini_studio.py` (NEW):**  
   Implements `GeminiStudioProvider` using `google-genai` SDK with Nano Banana image generation / editing models and master system prompt.
2. **`ai/vision/fidelity.py` (NEW):**  
   Implements `ProductFidelityValidator` measuring SSIM, silhouette mask IoU, and CIELAB color delta.
3. **`ai/vision/enhancer.py` (UPDATE):**  
   Integrates `GeminiStudioProvider` as primary engine with automatic validation and seamless local pipeline fallback.
4. **`ai/vision/tests/test_gemini_studio.py` (NEW):**  
   Unit tests for Gemini studio provider with mocked API responses.
5. **`ai/vision/tests/test_fidelity.py` (NEW):**  
   Unit tests for product fidelity validation metrics.
