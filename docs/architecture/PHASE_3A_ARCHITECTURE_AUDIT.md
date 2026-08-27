# KalaMitra Phase 3A Architecture Audit

This document audits the repository structure of KalaMitra (कलाMitra), analyzing existing structures, planned integrations, and missing production requirements.

---

## 1. Current Repository Architecture

The project has the following base layout:

* **`mobile/`**: The active frontend built with React Native, TypeScript, and Expo SDK 54. Wires all screens, forms, contexts, and dynamic mock services.
* **`backend/`**: An empty Python/FastAPI template under `backend/app/` (`core/`, `api/`, `models/`, `schemas/`, `services/`, `utils/`) containing only `.gitkeep` files.
* **`database/`**: An empty migrations and schemas directory containing only `.gitkeep` files.
* **`ai/`**: Placeholder directories for voice, vision, catalog, and pricing pipelines containing only `.gitkeep` files.
* **`docs/`**: Holds API contracts and documentation assets.

---

## 2. Component Audits

### Existing vs. Missing Backend Components

| Component | Status | Existing Details | Missing / Planned Details |
| :--- | :--- | :--- | :--- |
| **Authentication** | **MISSING** | Local simulated auth state inside `login.tsx`/`register.tsx`. | Supabase Auth Integration for JWT verification and session storage. |
| **B2B Product Catalog** | **MOCKED** | Local in-memory React state context synced via mock product services. | Supabase PostgreSQL database tables with public read and artisan write permissions. |
| **B2B Inquiry Proposals** | **MOCKED** | Wires quantities and messages into mock arrays. | Database tables storing inquiry state lifecycles and messaging. |
| **Media Storage** | **MISSING** | Renders static assets or temporary web links. | Cloudinary or Supabase Storage buckets for raw and enhanced product photos. |
| **Voice Cataloger** | **MOCKED** | Predetermined Hindi transcription sets matching preset images. | Integration with Gemini Speech or Whisper ASR pipelines on the backend. |
| **AI Catalog Generation** | **MOCKED** | Returns static descriptions and tags. | Gemini LLM parsing raw transcripts into structured JSON outputs. |
| **Background Removal** | **MOCKED** | Simulates processing delay and updates toggles. | Integration with Cloudinary AI background removal or OpenCV vision pipelines. |
| **AI Pricing Assistant** | **MOCKED** | Applies a flat 35% margin equation. | Pricing service evaluating pricing history and Pune market indices. |
| **Wholesale Chat** | **MOCKED** | Local messages map with simulated responses. | Real-time chat integration using WebSockets or Supabase Realtime channels. |

---

## 3. Architecture & Data Boundaries

To prevent security vulnerabilities and keep the client lightweight, we establish clear responsibility separations:

```
Mobile (Expo Client) 
    ↓ [Raw Media, Speeches]
Backend API (FastAPI Gateway) 
    ├── AI Pipeline Services (Gemini / Cloudinary) [ASR, GenAI, Vision]
    └── Supabase Database (PostgreSQL / RLS / Storage Buckets) [Structured Storage]
```

### Responsibility Matrix

1. **Mobile (Client)**:
   * Responsible *only* for rendering the user interface, managing the multi-step listing wizard context (`ProductCreationContext`), capturing raw photos/voice inputs from device hardware, and invoking API endpoints.
   * **Must NOT** contain private API keys, database connection strings, or direct SDK connections to Gemini or Cloudinary.
2. **Backend API (Gateway)**:
   * Responsible for routing mobile client requests, verifying authorization headers (JWT tokens), orchestrating AI pipelines, and writing transactions to the database.
   * Serves as the security gatekeeper for Cloudinary and Gemini API integrations.
3. **AI Services**:
   * Responsible for receiving raw audio/images, transcribing speech (Hindi, Marathi, English), removing backgrounds, generating bilingual titles/descriptions, and computing pricing index estimates.
4. **Database (Supabase / PostgreSQL)**:
   * Responsible for structured relational data storage, validating Row-Level Security (RLS) policies, and maintaining indexes for search queries.
5. **Storage (Cloudinary / Supabase S3)**:
   * Responsible for hosting raw and enhanced product media files.

---

## 4. Environment & Secrets Boundaries

Based on the `.env.example` configurations, secrets are restricted to the following boundaries:

* **Mobile Client Configs (Public)**:
  * `SUPABASE_URL`: Public endpoint for client data connection.
  * `SUPABASE_ANON_KEY`: Public anonymous key.
* **Backend API / Cloud Configs (Private - Server-Side Only)**:
  * `GEMINI_API_KEY`: Server-side secret key to query Gemini models.
  * `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Server-side credentials to upload, enhance, and fetch images.
  * `SUPABASE_SERVICE_ROLE_KEY`: Server-side high-privilege key to bypass RLS policies for administrative operations.

> [!WARNING]
> Never place backend service role keys, Gemini API keys, or Cloudinary secrets inside the `mobile/` directory or bundle them in application client distributions.
