# KalaMitra Backend API

FastAPI backend integration layer for the **KalaMitra (कलाMitra)** platform, exposing the multi-stage AI Vision & Studio enhancement pipeline, health monitoring, and modular microservices.

---

## 1. Overview & Architecture

The backend layer serves as a decoupled API gateway that accepts multipart image uploads from the React Native / Expo mobile app, performs input validation, and delegates processing to the underlying AI Vision pipeline (`ai.vision.enhancer.QualityEnhancer`) without duplicating image-processing logic.

```
Client (Expo Mobile App / API Consumer)
        │
        │ multipart/form-data (UploadFile + Form fields)
        ▼
FastAPI Application (`backend/app/main.py`)
        │
        ▼
API Router (`backend/app/api/v1/studio.py`)
        │ Validates Content-Type, image headers & form parameters
        ▼
Vision Service Adapter (`backend/app/services/vision_service.py`)
        │ Translates API models & interfaces with QualityEnhancer
        ▼
QualityEnhancer (`ai/vision/enhancer.py`)
        │ 1. Lighting Correction (CLAHE + Gray-World)
        │ 2. Pixel Super-Resolution (2x/4x)
        │ 3. Offline U2-Net / Rembg Background Cutout
        │ 4. Studio Composition (Backdrops + Shadows)
        │ 5. Cloudinary Asset Persistence
        ▼
Normalized JSON Response (`backend/app/schemas/studio.py`)
```

---

## 2. Directory Structure

```
backend/
├── README.md                      # Backend documentation
├── requirements.txt               # Backend dependencies
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI entrypoint, middleware & root routes
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py          # API v1 router aggregator
│   │       └── studio.py          # POST /api/v1/studio/enhance endpoint
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py              # Application settings & CORS configuration
│   ├── models/
│   │   └── __init__.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── studio.py              # Pydantic request/response schemas
│   ├── services/
│   │   ├── __init__.py
│   │   └── vision_service.py      # Adapter interfacing with QualityEnhancer
│   └── utils/
│       └── __init__.py
└── tests/
    ├── __init__.py
    └── test_studio_api.py         # Mocked unit and integration tests
```

---

## 3. Environment Setup & Starting the Server

### Virtual Environment
Activate the repository virtual environment:

```bash
# From repository root:
source venv/bin/activate
```

### Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### Environment Variables
Configure the required Cloudinary credentials in `.env` at the repository root:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional Backend Settings
CORS_ORIGINS=*
```

### Start the FastAPI Server
Run Uvicorn from the repository root:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## 4. API Endpoints

### 1. Health Check
* **Route**: `GET /health`
* **Response**: `{"status": "ok"}`

### 2. Studio Image Enhancement
* **Route**: `POST /api/v1/studio/enhance`
* **Content-Type**: `multipart/form-data`

#### Request Parameters (Form Fields)

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `image` | `File` | **Yes** | — | Raw image file (JPEG, PNG, WebP, HEIC). |
| `category` | `string` | No | `"general"` | Craft category: `pottery`, `textiles`, `wooden_crafts`, `jewellery`, `general`. |
| `preset` | `string` | No | `None` (auto) | Backdrop preset: `ecommerce_white`, `warm_neutral`, `terracotta_sand`, `minimal_grey`, `transparent_png`. |
| `aspect_ratio` | `string` | No | `None` (auto) | Canvas ratio: `square_1x1` (1080x1080), `portrait_4x5` (1080x1350), `portrait_9x16` (1080x1920), `landscape_16x9` (1920x1080). |
| `add_shadow` | `boolean` | No | `None` (auto) | Contact drop shadow toggle (defaults to `True` for opaque backdrops). |
| `quality_mode` | `string` | No | `"auto"` | Processing mode: `auto`, `local_ai`, `cloud`. |
| `upscale_factor`| `integer`| No | `2` | Super-resolution multiplier (`2` or `4`). |
| `enable_lighting_correction` | `boolean` | No | `True` | CLAHE exposure & color balance correction toggle. |
| `enable_super_resolution` | `boolean` | No | `True` | Pixel super-resolution restoration toggle. |
| `enable_quality_enhancement` | `boolean` | No | `True` | Master quality engine toggle. |

#### Example `curl` Request

```bash
curl -X POST "http://localhost:8000/api/v1/studio/enhance" \
  -F "image=@ai/vision/tests/test_product.jpg" \
  -F "category=pottery" \
  -F "preset=warm_neutral" \
  -F "aspect_ratio=square_1x1" \
  -F "add_shadow=true" \
  -F "upscale_factor=2"
```

#### Example JSON Response

```json
{
  "success": true,
  "provider": "cloudinary",
  "original": {
    "public_id": "artisan-ai/originals/wrfo3crwxw4gpfatlfw1",
    "secure_url": "https://res.cloudinary.com/demo/image/upload/v1787985140/artisan-ai/originals/wrfo3crwxw4gpfatlfw1.jpg",
    "width": 335,
    "height": 597,
    "format": "jpg",
    "bytes": 32664,
    "created_at": "2026-08-29T06:32:20Z"
  },
  "cutout": {
    "public_id": "artisan-ai/cutouts/tkbmz6vzrz1f333lrlfg",
    "secure_url": "https://res.cloudinary.com/demo/image/upload/v1787985148/artisan-ai/cutouts/tkbmz6vzrz1f333lrlfg.png",
    "width": 670,
    "height": 1194,
    "format": "png",
    "bytes": 307544,
    "created_at": "2026-08-29T06:32:28Z"
  },
  "enhanced": {
    "public_id": "artisan-ai/enhanced/jd4hsg37rdkuemupy6ca",
    "secure_url": "https://res.cloudinary.com/demo/image/upload/v1787985149/artisan-ai/enhanced/jd4hsg37rdkuemupy6ca.webp",
    "width": 1080,
    "height": 1080,
    "format": "webp",
    "bytes": 69466,
    "created_at": "2026-08-29T06:32:29Z"
  },
  "category": "pottery",
  "preset": "warm_neutral",
  "aspect_ratio": "square_1x1",
  "shadow_enabled": true,
  "metadata": {
    "execution_time_ms": 1330.09,
    "total_execution_time_ms": 10864.69,
    "pipeline_telemetry": {
      "quality_tier": "poor",
      "quality_score": 0.35,
      "stages_applied": [
        "lighting_correction",
        "super_resolution_2x",
        "background_removal_local",
        "studio_composition"
      ]
    }
  },
  "error": null,
  "error_code": null
}
```

---

## 5. Testing

### Backend Unit & Integration Tests (Mocked AI Pipeline)
Runs fast unit tests verifying route validations, error handling, status codes, and service mappings without external network calls:

```bash
python -m unittest discover -s backend/tests -p "test_*.py" -v
```

### Full AI Vision Pipeline Tests
Runs the complete 73-test AI vision suite across Cloudinary, Rembg, SuperResolution, Lighting, and Studio composers:

```bash
python -m unittest discover -s ai/vision/tests -p "test_*.py" -v
```
