# AI Artisan Image Enhancer & Studio

Smart India Hackathon 2026 — AI-Driven Market Linkage and Smart Cataloging Mobile Application for Marginalized Artisans.

This module provides an automated, end-to-end computer vision and studio enhancement engine that transforms everyday artisan product photographs (captured in cluttered workshops, homes, or exhibitions) into professional, e-commerce-ready studio catalog images.

---

## Architecture & Integration

```
[ React Native Mobile App ] (Camera capture / Gallery pick)
       │
       │ HTTP POST /api/v1/studio/enhance (multipart/form-data)
       ▼
[ FastAPI Backend (`ai.vision.api`) ]
       │
       │ In-memory stream
       ▼
[ Upload Service (`cloudinary_service.py`) ] ──> Cloudinary Secure Storage (`artisan-ai/originals/`)
       │
       ▼
[ AI Background Removal ] ──> `e_background_removal` (Segments product precisely)
       │
       ▼
[ Auto-Centering & Trim ] ──> `e_trim` (Snips transparent edges and perfectly centers the object)
       │
       ▼
[ 3D Depth / Contact Shadow ] ──> `e_shadow` (Gives realistic studio presence to pottery/woodcrafts)
       │
       ▼
[ AI Lighting Correction ] ──> `e_auto_enhance` (Optimizes color vibrancy, exposure & contrast)
       │
       ▼
[ Visual Mood Filter ] ──> `crisp_detail`, `vibrant`, `warm_heritage`, `golden_studio`, `vintage`
       │
       ▼
[ Studio Canvas Framing ] ──> `c_pad` on curated studio backdrops (1080x1080, 1080x1350, etc.)
       │
       ▼
[ Delivery Optimization ] ──> `f_auto,q_auto` (Automatic WebP/AVIF format + bandwidth compression)
       │
       ▼
[ JSON Delivery URLs ] ──> Returned to React Native for instant before/after mobile display!
```

---

## Available Studio Filters

| Filter Key | Effect | Recommended For |
| :--- | :--- | :--- |
| **`crisp_detail`** | High-clarity unsharp mask (`e_unsharp_mask:100`) | Intricate wood carvings, jewellery filigree, and fine pottery reliefs |
| **`vibrant`** | Smart color vibrance boost (`e_vibrance:40`) | Sarees, handloom textiles, dupattas, and colorful embroidery |
| **`warm_heritage`** | Soft artisanal tone (`e_art:al_dente`) | Terracotta pottery, clay crafts, and brassware |
| **`golden_studio`** | Golden hour studio glow (`e_tint:equalize:50:gold`) | Festive items, bronze, and copper craft collections |
| **`vintage`** | Vintage artisan sepia (`e_sepia:40`) | Antique handicrafts, vintage brass, and heritage handloom |
| **`soft_blur`** | Gaussian smoothing (`e_blur:200`) | Dreamy catalog backdrops |

---

## Running the FastAPI Server

Start the local server:

```powershell
.venv\Scripts\python.exe -m uvicorn ai.vision.api:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger UI: `http://localhost:8000/docs`

---

## FastAPI Endpoint Reference

### `POST /api/v1/studio/enhance`
Accepts `multipart/form-data`:
- `image`: File (Camera binary)
- `category`: `pottery` | `textiles` | `wooden_crafts` | `jewellery` | `general`
- `preset`: `ecommerce_white` | `warm_neutral` | `minimal_grey` | `terracotta_sand` | `transparent_png`
- `filter_name`: `crisp_detail` | `vibrant` | `warm_heritage` | `golden_studio` | `vintage`
- `aspect_ratio`: `square_1x1` | `portrait_4x5` | `portrait_9x16` | `landscape_16x9`
- `add_shadow`: `true` | `false`

---

## React Native Mobile Integration Example

```javascript
const enhanceArtisanPhoto = async (photoUri, category = "pottery", filterName = "crisp_detail") => {
  const formData = new FormData();
  formData.append('image', {
    uri: photoUri,
    type: 'image/jpeg',
    name: 'artisan_product.jpg',
  });
  formData.append('category', category);
  formData.append('filter_name', filterName);

  const res = await fetch('http://<BACKEND_IP>:8000/api/v1/studio/enhance', {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = await res.json();
  console.log("Final Studio Image:", data.processed.final_url);
  return data;
};
```
