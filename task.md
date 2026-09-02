# KalaMitra AI Artisan Vision — Project Roadmap & Task Status

## Phase 3.1 — Gemini / Nano Banana Architecture Audit (COMPLETED)
- [x] **Task 1:** Inspect current vision architecture (`ai/vision/`, `backend/app/api/v1/studio.py`, schemas, configs).
- [x] **Task 2:** Inspect and document existing providers (`CloudinaryService`, `LightingCorrector`, `SuperResolutionProvider`, `RembgProvider`, `PicsartProvider`, `StudioComposer`, `QualityEnhancer`).
- [x] **Task 3:** Inspect current Gemini implementation, SDK configuration, and models.
- [x] **Task 4:** Audit Cloudinary asset lifecycle, immutability, and folder structure.
- [x] **Task 5:** Verify local fallback pipeline integrity (Lighting $\rightarrow$ SuperResolution $\rightarrow$ Rembg $\rightarrow$ StudioComposer).
- [x] **Task 6:** Audit image quality and fidelity capabilities (Laplacian variance, SNR, exposure, SSIM/IoU gap analysis).
- [x] **Task 7:** Produce comprehensive Architecture Gap Analysis.
- [x] **Task 8:** Propose Target Architecture with primary Gemini studio engine & strict product-fidelity validation.
- [x] **Task 9:** Conduct security audit on API keys, environment boundaries, and logging masking.
- [x] **Task 10:** Conduct test audit across 78 unit, integration, and manual test suites.
- [x] **Deliverable:** Created `docs/vision/PHASE_3_1_GEMINI_ARCHITECTURE_AUDIT.md`.

---

## Phase 3.2 — Gemini / Nano Banana Studio Provider (COMPLETED)
- [x] **Task 1:** Inspect existing provider contracts (`ProcessedImageResult`, input types, output metadata, timing).
- [x] **Task 2:** Implement `GeminiStudioProvider` (`ai/vision/providers/gemini_studio.py`) using `google-genai` SDK.
- [x] **Task 3:** Configure `GEMINI_IMAGE_MODEL` (default: `gemini-3.1-flash-image` / Nano Banana 2) with fallback sequence.
- [x] **Task 4 & 5:** Create modular, category-aware prompt engine (`ai/vision/prompts/studio_prompt.py`) enforcing Zero-Alteration product policy.
- [x] **Task 6:** Implement robust image input handling & format validation.
- [x] **Task 7:** Implement response parser extracting image bytes and explicitly rejecting text-only responses.
- [x] **Task 8:** Implement structured error handling (`CONFIG_ERROR`, `INVALID_IMAGE_INPUT`, `NO_IMAGE_RETURNED`, `BLOCKED_SAFETY`, `RATE_LIMIT_ERROR`, `TIMEOUT_ERROR`, `API_ERROR`).
- [x] **Task 9:** Enforce clean Cloudinary separation boundary.
- [x] **Task 10:** Implement mocked unit test suite (`ai/vision/tests/test_gemini_studio.py` — 14 tests, 100% passing).
- [x] **Task 11:** Implement opt-in live test (`LIVE_GEMINI_TEST=1`).
- [x] **Task 12:** Preserved Enhancer, local fallback pipeline, and existing providers without modification.
- [x] **Task 13:** Created `docs/vision/PHASE_3_2_GEMINI_PROVIDER.md`.

---

## Phase 3.3 — Product Fidelity Validation Engine (COMPLETED)
- [x] **Task 1:** Inspect existing image utilities, segmentation, and metrics.
- [x] **Task 2:** Implement `ProductFidelityValidator` in `ai/vision/fidelity.py` and schemas in `ai/vision/schemas.py`.
- [x] **Task 3:** Implement product mask extraction and canonical coordinate space normalization (`_crop_and_canonicalize`).
- [x] **Task 4:** Implement Silhouette / Mask IoU computation with configurable thresholds.
- [x] **Task 5:** Implement Masked SSIM on aligned product region intersection.
- [x] **Task 6:** Implement CIELAB Color Delta E ($\Delta E_{76}$) computation on isolated product pixels.
- [x] **Task 7:** Implement Product Geometry checks (aspect ratio deviation and area coverage ratio).
- [x] **Task 8:** Implement category-aware weighting matrices for `pottery`, `textiles`, `jewellery`, `wooden_crafts`, `general`.
- [x] **Task 9:** Implement `PASS` / `REVIEW` / `FAIL` decision engine.
- [x] **Task 10:** Enforce explicit separation between Image Quality vs Product Fidelity.
- [x] **Task 11:** Build high-performance, dual-engine resilient execution (pure Python / PIL + NumPy support).
- [x] **Task 12 & 13:** Implement test suite in `ai/vision/tests/test_fidelity.py` (12 tests, 100% passing).
- [x] **Task 14:** Centralize configurable thresholds in `ai/vision/config.py` (`FidelitySettings`).
- [x] **Task 15:** Preserved Enhancer and local fallback pipeline without modification.
- [x] **Task 16:** Created `docs/vision/PHASE_3_3_PRODUCT_FIDELITY.md`.

---

## Phase 3.4 — Production Pipeline Integration (COMPLETED)
- [x] **Task 1:** Inspect all vision providers and FastAPI endpoint bindings.
- [x] **Task 2:** Implement unified pipeline architecture in `QualityEnhancer.process_enhanced_studio_pipeline()`:
  - Ingest raw image to `artisan-ai/originals/` (immutable).
  - Gemini / Nano Banana Primary Engine.
  - Product Fidelity Validation Gate.
  - Decision Router: If `PASS` $\rightarrow$ upload to `artisan-ai/enhanced/`; If `FAIL`/`REVIEW`/Timeout/Error $\rightarrow$ execute Local Fallback Pipeline.
- [x] **Task 3:** Implemented resilient failover to offline Local Fallback Pipeline (`LightingCorrector` $\rightarrow$ `SuperResolutionProvider` $\rightarrow$ `RembgProvider` $\rightarrow$ `StudioComposer`).
- [x] **Task 4:** Preserved `PicsartProvider` as secondary cloud provider.
- [x] **Task 5:** Guaranteed backward-compatible FastAPI `/api/v1/studio/enhance` responses with full fidelity telemetry.
- [x] **Task 6:** Created comprehensive integration tests (`ai/vision/tests/test_enhancer.py` — 10 tests, 100% passing).
- [x] **Task 7:** Verified 87 unit and integration tests across the complete vision package (100% OK).
- [x] **Task 8:** Verified mobile React Native app compatibility (`npx tsc --noEmit` clean pass with 0 errors).
- [x] **Task 9:** Created `docs/vision/PHASE_3_4_GEMINI_FIDELITY_PIPELINE.md`.
