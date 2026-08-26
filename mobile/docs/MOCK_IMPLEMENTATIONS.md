# Mock Implementations and Future Backend Migration Mapping

This document lists the core features of the KalaMitra mobile application that are currently simulated in the service boundaries, detailing how they function now versus how they will be integrated with real backend components in the future.

---

## Simulated Feature Registry

| Feature | Current Mock Implementation | Future Real Backend Component |
| :--- | :--- | :--- |
| **Authentication & Sign-in** | `authService.login` accepts any credentials and simulated inputs, returning `true` to permit portal routing. | **Supabase Auth** / JWT validation endpoints on the backend API layer. |
| **Store Registration** | `authService.registerStore` accepts shop parameters and creates an in-memory `Artisan` profile. | **Supabase Database** (inserts a new record into `artisans` table via API POST). |
| **Product presets** | `productService.getProductPresets` returns hardcoded presets (Silk Dupatta, Bamboo Basket, Pottery Vase) for catalog creation wizard steps. | **PostgreSQL (Supabase)**: Preset catalogs fetched from database. |
| **Image background removal** | `imageService.processMockImage` simulates background cleanup and returns the original URL as "enhanced" after 1.5s. | **Cloudinary API** / OpenCV backend services performing real-time background subtraction. |
| **Vernacular Voice Transcription** | `voiceService.processMockVoice` returns predetermined transcription strings matching selected presets after 1.5s. | **Gemini Speech API** (Whisper ASR or Google Cloud STT transcription). |
| **AI Catalog Draft Generation** | `catalogService.generateMockCatalog` parses transcription text and extracts category, material, draft descriptions in English/Hindi, and tags. | **Gemini AI Prompt Engine** (structured JSON schema model extraction). |
| **Pricing Markup Recommendations** | `pricingService.calculateRecommendation` receives material, labor, and other costs and applies a flat `35%` margin formula. | **Backend AI Pricing Engine** analyzing historical sales volume and local marketplace price indices. |
| **Catalog Persistence** | Context writes new listings into local in-memory catalog arrays. Resets on app reload. | **Supabase PostgreSQL**: product records saved via B2B catalog write API. |
| **B2B Inquiry Proposals** | `inquiryService.createInquiry` appends buyer requirements to in-memory inquiry list. | **PostgreSQL**: Records written to `inquiries` table, triggering push alerts to the artisan. |
| **Simulated Chat Replies** | `chatService.getSimulatedReply` appends a response after 1.5s of buyer message delivery. | **Real-time WebSockets / Supabase Realtime Channels** sending active notifications between buyer and artisan chats. |
