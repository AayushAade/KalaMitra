# KalaMitra Phase 3 API Contract Specification

This document details the API endpoints mapping `/api/v1/` routes to the mobile service interfaces, identifying authorization structures, payload models, and interface compatibility rules.

---

## 1. API Endpoint Details

### Authentication (AUTH)

#### `POST /api/v1/auth/login`
* **Purpose**: Sign in a user.
* **Headers**: `Content-Type: application/json`
* **Request**:
  ```json
  {
    "identifier": "+91 98765 43210",
    "password": "password123",
    "role": "artisan"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "access_token": "jwt-token-string",
    "role": "artisan",
    "user_id": "uuid-1"
  }
  ```
* **Error (401 Unauthorized)**:
  ```json
  { "error": "Invalid phone number or password" }
  ```
* **Auth Requirement**: Public.

#### `POST /api/v1/auth/register`
* **Purpose**: Create an artisan/buyer account.
* **Headers**: `Content-Type: application/json`
* **Request**:
  ```json
  {
    "phone": "+91 98765 43210",
    "password": "password123",
    "role": "artisan",
    "name": "Savita Handicrafts",
    "owner_name": "Savita Devi",
    "location": "Pune, Maharashtra",
    "craft": "Traditional Bamboo Crafts",
    "language": "Hindi"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "access_token": "jwt-token-string",
    "user_id": "uuid-1"
  }
  ```
* **Auth Requirement**: Public.

---

### Artisan Profiles (ARTISANS)

#### `GET /api/v1/artisans/me`
* **Purpose**: Load the current logged-in artisan's profile.
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
  ```json
  {
    "id": "uuid-1",
    "name": "Savita Handicrafts",
    "owner_name": "Savita Devi",
    "location": "Pune, Maharashtra",
    "craft": "Traditional Bamboo Crafts",
    "language": "Hindi",
    "bio": "Traditional handloom crafts master.",
    "rating": 4.90,
    "avatar_url": "https://avatar-link.jpg",
    "store_verified": true
  }
  ```
* **Auth Requirement**: Authenticated (Artisan).

#### `PUT /api/v1/artisans/me`
* **Purpose**: Update artisan details.
* **Headers**: `Authorization: Bearer <token>`
* **Request**:
  ```json
  {
    "name": "Savita Handicrafts Edited",
    "bio": "New bio update"
  }
  ```
* **Response (200 OK)**: Profile object updated.
* **Auth Requirement**: Authenticated (Artisan).

---

### Catalog Listings (PRODUCTS)

#### `GET /api/v1/products`
* **Purpose**: Fetch all listed crafts (supports category & search query filters).
* **Parameters**: `?category=Textiles&search=silk`
* **Response (200 OK)**:
  ```json
  [
    {
      "id": "prod-uuid-1",
      "name": "Handwoven Red Silk Dupatta",
      "imageUrl": "https://image-link.jpg",
      "material": "Pure Silk",
      "price": 1850.00,
      "artisanName": "Savita Handicrafts",
      "craft": "Traditional Handloom Weaving",
      "productionTime": "5 days"
    }
  ]
  ```
* **Auth Requirement**: Public (Read).

#### `POST /api/v1/products`
* **Purpose**: Publish a new catalog item.
* **Headers**: `Authorization: Bearer <token>`
* **Request**:
  ```json
  {
    "name": "Bamboo Storage Basket",
    "imageUrl": "https://image-link.jpg",
    "material": "Bamboo Strip",
    "price": 899.00,
    "craft": "Hand-braided Weaving",
    "productionTime": "2 days"
  }
  ```
* **Response (201 Created)**: Created product listing object.
* **Auth Requirement**: Authenticated (Artisan).

---

### Wholesale Proposals (INQUIRIES)

#### `POST /api/v1/inquiries`
* **Purpose**: Create wholesale inquiry.
* **Headers**: `Authorization: Bearer <token>`
* **Request**:
  ```json
  {
    "product_id": "prod-uuid-1",
    "quantity": 100,
    "expected_delivery": "2026-09-20",
    "message": "Namaste! Please confirm wholesale rates."
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": "inq-uuid-1",
    "product_id": "prod-uuid-1",
    "quantity": 100,
    "expected_delivery": "2026-09-20",
    "status": "New",
    "created_at": "timestamp"
  }
  ```
* **Auth Requirement**: Authenticated (Buyer).

#### `GET /api/v1/inquiries`
* **Purpose**: Fetch received/sent proposals.
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**: Array of inquiries.
* **Auth Requirement**: Authenticated (Artisan/Buyer).

---

### Chat Communications (CHAT)

#### `GET /api/v1/inquiries/{inquiryId}/messages`
* **Purpose**: Retrieve dialog messages chronological logs.
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**: Array of messages.
* **Auth Requirement**: Participant (Artisan/Buyer).

#### `POST /api/v1/inquiries/{inquiryId}/messages`
* **Purpose**: Send a message.
* **Headers**: `Authorization: Bearer <token>`
* **Request**:
  ```json
  {
    "text": "Sounds good! Proceeding."
  }
  ```
* **Response (201 Created)**: Message object.
* **Auth Requirement**: Participant (Artisan/Buyer).

---

### AI Pipelines (AI)

#### `POST /api/v1/catalog/voice`
* **Purpose**: Transcribe speech input and extract structured catalog draft data (English/Hindi).
* **Headers**: `Authorization: Bearer <token>`
* **Request**: `Multipart/form-data` with `file: audio_blob` and `language: string`.
* **Response (200 OK)**:
  ```json
  {
    "language": "hi",
    "transcript": "यह एक हाथ से बुना हुआ...",
    "product": {
      "name": "Red Silk Dupatta",
      "category": "Textiles",
      "material": "Pure Silk",
      "craft_type": "Handloom",
      "production_time_days": 5
    },
    "catalog": {
      "title_en": "Handwoven Red Silk Dupatta",
      "description_en": "Traditional handloom dupatta...",
      "title_hi": "हस्तनिर्मित सिल्क दुपट्टा",
      "description_hi": "पारंपरिक रेशमी दुपट्टा...",
      "keywords": ["Silk", "Handloom"]
    }
  }
  ```
* **Auth Requirement**: Authenticated (Artisan).

#### `POST /api/v1/image/enhance`
* **Purpose**: Enhanced background removal.
* **Headers**: `Authorization: Bearer <token>`
* **Request**: `Multipart/form-data` with `image: image_blob`.
* **Response (200 OK)**:
  ```json
  {
    "original_url": "https://original-link.jpg",
    "enhanced_url": "https://background-removed-link.jpg"
  }
  ```
* **Auth Requirement**: Authenticated (Artisan).

---

## 2. Mobile Service Signature Compatibility

We mapped each service inside `mobile/services/` against the future API contract endpoints:

| Mobile Service | Current Local Inputs | Future API Call | Mismatch Analysis / Interface Decoupling |
| :--- | :--- | :--- | :--- |
| **`authService.login`** | `(identifier, role)` | `POST /api/v1/auth/login` | **Compatible**. The mobile UI handles text inputs and role states which map to request body key-values. |
| **`authService.registerStore`** | `(storeData)` | `POST /api/v1/auth/register` | **Compatible**. UI form states align with register schema properties. |
| **`productService.getProducts`** | None | `GET /api/v1/products` | **Compatible**. Global context loads this asynchronously, avoiding screen freezes. |
| **`productService.createProduct`** | `(product)` | `POST /api/v1/products` | **Compatible**. Catalog wizard inputs are formatted as JSON requests. |
| **`artisanService.getCurrentArtisan`**| None | `GET /api/v1/artisans/me` | **Compatible**. Fetches values on dashboard load. |
| **`inquiryService.createInquiry`** | `(inquiryData)` | `POST /api/v1/inquiries` | **Compatible**. Input maps to `product_id`, `quantity`, and `message`. |
| **`chatService.sendMessage`** | `(inquiryId, msg)` | `POST /api/v1/inquiries/{id}/messages`| **Compatible**. Wires chat inputs directly. |
| **`voiceService.processMockVoice`** | `(presetName, lang)`| `POST /api/v1/catalog/voice` | **Decoupled**. In mock, we map preset parameters. In prod, the service will receive raw `.wav` blobs recorded from Expo Audio recorder. UI doesn't need to change. |
| **`pricingService.calculateRecommendation`** | `(costInput)` | `POST /api/v1/pricing/recommend`| **Compatible**. Submits COGS figures and returns margins. |
