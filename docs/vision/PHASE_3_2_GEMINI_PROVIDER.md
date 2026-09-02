# KalaMitra — Phase 3.2: Gemini / Nano Banana Studio Provider Implementation

**Module:** `ai/vision/providers/gemini_studio.py`  
**Prompt Engine:** `ai/vision/prompts/studio_prompt.py`  
**Status:** Completed & Verified  
**Date:** 2026-08-30  

---

## 1. Executive Summary

In Phase 3.2, we established the production-ready **Gemini / Nano Banana Image Editing Provider** (`GeminiStudioProvider`) and the **Master E-Commerce Studio Staging Prompt Engine** (`build_studio_edit_prompt`). This implementation conforms strictly to the project's `ProcessedImageResult` contract, provides robust secret masking, supports category-aware studio rendering, and enforces the **Zero-Alteration Product Preservation Policy**.

> [!IMPORTANT]
> **Product Preservation Disclaimer:**
> Gemini generative restyling alone cannot mathematically guarantee 100% pixel-level preservation of fine artisan details across all inputs. In accordance with the KalaMitra architecture, **Product Fidelity Validation** will be implemented as a separate verification layer in Phase 3.3, and the **Local Fallback Pipeline** remains active and untouched as a 100% resilient offline fallback.

---

## 2. Provider Architecture & Contract

### Contract Definition (`ProcessedImageResult`)
```python
ProcessedImageResult(
    success=True,
    provider="gemini_nano_banana",
    operation="studio_restyling",
    output_url=None,
    output_format="PNG",
    metadata={
        "image_bytes": b"...",          # Raw generated PNG/JPEG bytes
        "model": "gemini-3.1-flash-image",
        "execution_time_ms": 1240.5,
        "category": "jewellery",
        "preset": "travertine_podium",
        "aspect_ratio": "1:1",
        "studio_prompt": "...",
    },
    error=None,
    error_code=None,
)
```

---

## 3. Configured Model & SDK Strategy

- **Environment Variable:** `GEMINI_IMAGE_MODEL` (configured server-side in `.env`).
- **Primary Model Default:** `gemini-3.1-flash-image` (Nano Banana 2).
- **Fallback Models Sequence:**
  1. `gemini-3.1-flash-image`
  2. `gemini-3-pro-image`
  3. `gemini-2.5-flash-image`
  4. `imagen-3.0-generate-002`
- **SDK Method:** `client.models.generate_content(model=model, contents=[pil_img, prompt])` via the official `google-genai` SDK.

---

## 4. Master Prompt Architecture (`ai/vision/prompts/studio_prompt.py`)

The prompt builder dynamically constructs modular instructions containing:

1. **System Role:** Commercial product photographer & luxury e-commerce art director.
2. **Product Category Directives:**
   - `pottery`: Architectural honed cream travertine / limestone pedestal, sand limewash studio wall.
   - `textiles`: Minimal warm ivory platform, soft neutral background, even exposure across drape and natural dyes.
   - `jewellery`: Refined matte ivory stone slab, controlled 45-degree directional light for filigree, enamel, and stones.
   - `wooden_crafts`: Natural oak platform, warm earth-toned studio backdrop, soft side lighting for wood grain.
   - `general`: Clean warm-white / soft beige luxury studio stage.
3. **Zero-Alteration Directive:** Treats input photo as immutable reference geometry. Prohibits reshaping, recoloring, or inventing beads/carvings/stones.
4. **Environment Editing Directive:** Eliminates workshop clutter, creates clean studio backdrops, and computes physical contact drop shadows.
5. **Composition Constraints:** 1 product only, centered, marketplace framing, zero watermarks/text/hands/CGI artifacts.

---

## 5. Structured Error Boundaries

| Error Code | Trigger Condition |
| :--- | :--- |
| `CONFIG_ERROR` | `GEMINI_API_KEY` is missing or empty in the server environment. |
| `FILE_NOT_FOUND` | Provided image path does not exist on disk. |
| `INVALID_IMAGE_INPUT` | Payload is empty (0 bytes), exceeds 20 MB, or cannot be parsed by PIL. |
| `NO_IMAGE_RETURNED` | Gemini returned a text-only description without image bytes. |
| `BLOCKED_SAFETY` | Output was flagged/blocked by Gemini safety/moderation filters. |
| `RATE_LIMIT_ERROR` | 429 Quota Exhausted / ResourceExhausted exception received. |
| `TIMEOUT_ERROR` | Request took longer than `timeout_seconds` (default 45s). |
| `API_ERROR` | Unhandled network or SDK communication failure. |

---

## 6. Unit & Integration Testing Strategy

The test suite in `ai/vision/tests/test_gemini_studio.py` contains **14 tests**:

- **Mocked Unit Tests (Zero API Credit Consumption):**
  - Default initialization and configuration.
  - Missing API key graceful failure (`CONFIG_ERROR`).
  - Secret masking in `__repr__` (e.g. `AIza...`).
  - Prompt structure and category customization verification.
  - Successful image byte extraction from response candidates.
  - Text-only rejection (`NO_IMAGE_RETURNED`).
  - Empty response handling.
  - Safety filter rejection (`BLOCKED_SAFETY`).
  - Rate limit (429) mapping (`RATE_LIMIT_ERROR`).
  - Timeout error mapping (`TIMEOUT_ERROR`).
  - Empty / corrupted input validation (`INVALID_IMAGE_INPUT`).
  - File not found handling (`FILE_NOT_FOUND`).
- **Opt-In Live Integration Test:**
  - Guarded with `os.getenv("LIVE_GEMINI_TEST") == "1"`. Skipped by default to prevent unexpected credit usage during CI/CD.

**Test Results:** **14 tests ran, 13 passed, 1 skipped (live test), 0 errors, 0 failures (100% OK)**.
