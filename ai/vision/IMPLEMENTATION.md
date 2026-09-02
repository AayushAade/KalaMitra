# KalaMitra AI Vision — Implementation & Technical Reference

This document tracks the technical implementation of the AI Vision and Image Enhancement module of the **KalaMitra (कलाMitra)** project for Smart India Hackathon 2026.

---

## Non-Negotiable Artifact Safety Rule

The artisan's genuine product is sacred:
- **No Generative Redesign**: The system will never redraw, retexture, replace, or hallucinate the product.
- **Background-Only AI**: Picsart is used **only** for isolating the foreground product cutout (`removebg`).
- **Cloudinary Studio Engine**: Cloudinary is used for deterministic backdrop framing, contact shadows, and canvas composition.
- **Transparency Preservation**: The cutout is strictly saved and stored as a lossless transparent PNG.

---

## Phase 3A — Cloudinary / Picsart Persistence Bridge

### 1. Architecture & Request Flow

```
[ Incoming Raw Photograph (Stream / Bytes / File Path) ]
                          │
                          ▼
             [ Step 1: Cloudinary Ingestion ]
               Folder: artisan-ai/originals/
               Asset: ImageAsset (public_id, secure_url, width, height, format, bytes)
                          │
                          ▼
             [ Step 2: Picsart AI Cutout ]
               Provider: PicsartProvider.remove_background(...)
               Endpoint: POST https://api.picsart.io/tools/1.0/removebg
               Header: X-Picsart-API-Key
               Payload: format=PNG, output_type=cutout
                          │
                          ▼
             [ Step 3: Cutout Validation & Fetch ]
               Downloads temporary PNG from Picsart CDN URL
               Validates PNG signature bytes (0x89 0x50 0x4E 0x47 ...)
                          │
                          ▼
             [ Step 4: Persistent Cutout Storage ]
               Folder: artisan-ai/cutouts/
               Asset: ImageAsset (public_id, secure_url, width, height, format="png", bytes)
                          │
                          ▼
        [ Step 5: Normalized PersistenceBridgeResult ]
          ├── success: True
          ├── provider: "picsart"
          ├── operation: "remove_background"
          ├── original: ImageAsset (artisan-ai/originals/...)
          ├── cutout: ImageAsset (artisan-ai/cutouts/...)
          └── metadata: Execution timings & telemetry
```

---

## Phase 3B — Studio Background Composition & E-commerce Presentation

### 1. Studio Composition Flow

```
[ Cutout Asset (artisan-ai/cutouts/...) ]
                   │
                   ▼
  [ StudioComposer (ai/vision/studio.py) ]
    ├── Auto-trim transparent boundary (e_trim)
    ├── Contact drop shadow beneath product (e_shadow:40, co_rgb:202020, x_0, y_15)
    ├── Canvas padding & backdrop (c_pad, w_{W}, h_{H}, b_{BG})
    └── Automatic format & quality optimization (f_auto, q_auto)
                   │
                   ▼
  [ Persistent Enhanced Asset in Cloudinary ]
    ├── Folder: artisan-ai/enhanced/
    ├── Format: webp / png (auto-optimized)
    └── Emits: EnhancedImageResult (original, cutout, enhanced)
```

---

### 2. Studio Presets & Aspect Ratios

#### Backdrop Presets

| Preset Key | Color Hex | Cloudinary Value | Recommended Craft Types |
| :--- | :--- | :--- | :--- |
| **`ecommerce_white`** | `#FFFFFF` | `rgb:FFFFFF` | Amazon/Flipkart standard white for general handicrafts & textiles |
| **`warm_neutral`** | `#F7F4EE` | `rgb:F7F4EE` | Soft artisanal beige for terracotta pottery, ceramics, and clay crafts |
| **`minimal_grey`** | `#F5F5F7` | `rgb:F5F5F7` | Contemporary studio light grey for silver jewellery, metalwork, & stone |
| **`terracotta_sand`** | `#F4EBE1` | `rgb:F4EBE1` | Warm earthy clay tone for wooden carvings, brassware, and rustic decor |
| **`transparent_png`** | Transparent | `None` | Transparent cutout asset for marketing banners and custom collaterals |

#### Aspect Ratios

| Key | Dimensions | Ratio | Recommended Use Case |
| :--- | :--- | :--- | :--- |
| **`square_1x1`** | 1080 × 1080 | 1:1 | Standard marketplace catalog grid (Instagram, WhatsApp store, Shopify) |
| **`portrait_4x5`** | 1080 × 1350 | 4:5 | Apparel, sarees, dupattas, shawls, and vertical wall hangings |
| **`portrait_9x16`** | 1080 × 1920 | 9:16 | Full-screen mobile stories, reels, and vertical showcase cards |
| **`landscape_16x9`** | 1920 × 1080 | 16:9 | Web desktop hero banners and horizontal display galleries |

---

### 3. Category Default Behaviors

| Category | Default Preset | Default Aspect Ratio | Shadow Enabled |
| :--- | :--- | :--- | :--- |
| **`pottery`** | `warm_neutral` | `square_1x1` | `True` |
| **`textiles`** | `ecommerce_white` | `portrait_4x5` | `False` |
| **`wooden_crafts`** | `terracotta_sand` | `square_1x1` | `True` |
| **`jewellery`** | `minimal_grey` | `square_1x1` | `True` |
| **`general`** | `ecommerce_white` | `square_1x1` | `True` |

---

### 4. Normalized Studio Response Model

```python
class EnhancedImageResult(BaseModel):
    success: bool
    provider: str = "cloudinary"
    original: Optional[ImageAsset] = None
    cutout: Optional[ImageAsset] = None
    enhanced: Optional[ImageAsset] = None
    category: str = "general"
    preset: str = "ecommerce_white"
    aspect_ratio: str = "square_1x1"
    shadow_enabled: bool = True
    metadata: Optional[Dict[str, Any]] = {}
    error: Optional[str] = None
    error_code: Optional[str] = None
```

---

### 5. Cloudinary Storage Hierarchy

```text
artisan-ai/
├── originals/                      # Raw, unedited artisan captures (untouched)
├── cutouts/                        # Lossless transparent PNG cutouts (untouched)
└── enhanced/                       # Final studio-composed e-commerce presentations
```

---

---

## Phase 3C — AI Image Quality Enhancement & Super-Resolution

### 1. Architecture & Flow

```
[ Raw Artisan Photograph ]
            │
            ▼
  [ CloudinaryService: Original Ingestion ]
    └── Folder: artisan-ai/originals/
            │
            ▼
  [ PicsartProvider Quality Enhancement ]
    ├── Mode: 'ultra' -> POST /upscale/ultra (Super-Resolution + Denoising)
    ├── Mode: 'upscale' -> POST /upscale (2x / 4x Resolution multiplier)
    └── Mode: 'standard' -> POST /adjust (Clarity, Contrast, Vibrance)
    └── Note: Graceful fallback to raw original if quality endpoint is unavailable.
            │
            ▼
  [ Picsart AI Cutout (POST /removebg) ]
    └── Transparent PNG extraction from enhanced image
            │
            ▼
  [ Persistent Cutout in Cloudinary ]
    └── Folder: artisan-ai/cutouts/
            │
            ▼
  [ StudioComposer Canvas Presentation ]
    └── Folder: artisan-ai/enhanced/
```

### 2. Provider Capabilities Added

| Method | Endpoint | Primary Use Case | Artifact Safety |
| :--- | :--- | :--- | :--- |
| **`upscale()`** | `POST /upscale` | 2x / 4x resolution multiplier | Zero shape alteration; mathematical interpolation & edge sharpening |
| **`ultra_enhance()`** | `POST /upscale/ultra` | Super-resolution + sensor denoising | Detail recovery for noisy, low-light phone photos |
| **`adjust()`** | `POST /adjust` | Lighting, clarity, & vibrance tuning | Color & exposure balance without generative texture changes |

---

## Phase 3D — Cloudinary AI Image Quality Enhancement & Quality Analysis

### 1. Multi-Tier Image Quality Architecture

```
                       [ RAW ARTISAN PHOTOGRAPH ]
                                   │
                                   ▼
          [ Step 1: Cloudinary Ingestion (artisan-ai/originals/) ]
                                   │
                                   ▼
        [ Step 2: Cloudinary Image Quality Analysis ]
          ├── Analyzes resolution, megapixels, compression, and fidelity
          └── Determines Quality Tier:
               ├── High Quality   (>= 1080p, sharp)       -> Light polish (e_improve, e_sharpen:50)
               ├── Medium Quality (500p–1080p, mild noise)-> AI enhance (e_enhance, e_improve:indoor)
               └── Poor Quality   (< 500p, blurry/dark)   -> AI restore & sharpen (e_gen_restore, e_enhance)
                                   │
                                   ▼
     [ Step 3: Cloudinary Quality-Enhanced Asset Generation ]
                                   │
                                   ▼
               [ Step 4: Picsart Clarity & Lighting Tuning ]
                 └── POST https://api.picsart.io/tools/1.0/adjust
                                   │
                                   ▼
               [ Step 5: Picsart Transparent Cutout Isolation ]
                 └── POST https://api.picsart.io/tools/1.0/removebg (format=PNG)
                                   │
                                   ▼
          [ Step 6: Persistent Cutout Storage (artisan-ai/cutouts/) ]
                                   │
                                   ▼
      [ Step 7: Cloudinary Studio Composition (artisan-ai/enhanced/) ]
        └── Backdrop presets (white, warm, grey, terracotta), contact shadows, 1080x1080 canvas
```

### 2. Tiered Transformation Matrix

| Quality Tier | Dimension / Size Heuristics | Cloudinary Transformations | Goal |
| :--- | :--- | :--- | :--- |
| **High** | $\min(W, H) \ge 1080\text{px}$, $\text{size} \ge 200\text{KB}$ | `e_improve`, `e_sharpen:50`, `f_auto, q_auto` | Balanced exposure & crisp edge definition |
| **Medium** | $\min(W, H) \ge 500\text{px}$, $\text{size} \ge 40\text{KB}$ | `e_enhance`, `e_improve:indoor`, `e_sharpen:80` | AI shadow lift, noise reduction, & clarity boost |
| **Poor** | $\min(W, H) < 500\text{px}$ or $\text{size} < 40\text{KB}$ | `e_gen_restore`, `e_enhance`, `e_sharpen:100` | Deep sensor restoration & super-resolution recovery |

---

### 3. Test Suite & Coverage

* **Total Tests in Module**: 69 tests (64 automated unit tests passing in 0.061s, 5 live integration tests).
  - [`test_cloudinary_service.py`](file:///c:/Users/hp/Desktop/Projects/image/DIY-Nest/ai/vision/tests/test_cloudinary_service.py): 8 tests
  - [`test_picsart_provider.py`](file:///c:/Users/hp/Desktop/Projects/image/DIY-Nest/ai/vision/tests/test_picsart_provider.py): 14 tests
  - [`test_persistence.py`](file:///c:/Users/hp/Desktop/Projects/image/DIY-Nest/ai/vision/tests/test_persistence.py): 12 tests
  - [`test_studio.py`](file:///c:/Users/hp/Desktop/Projects/image/DIY-Nest/ai/vision/tests/test_studio.py): 17 tests
  - [`test_enhancer.py`](file:///c:/Users/hp/Desktop/Projects/image/DIY-Nest/ai/vision/tests/test_enhancer.py): 7 tests
  - [`test_cloudinary_quality.py`](file:///c:/Users/hp/Desktop/Projects/image/DIY-Nest/ai/vision/tests/test_cloudinary_quality.py): 6 tests

