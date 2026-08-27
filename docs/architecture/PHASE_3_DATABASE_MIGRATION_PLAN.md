# KalaMitra Phase 3 Database & API Integration Plan

This document maps out the incremental sequence for integrating the production database schema and backend API layer with the existing mobile frontend without causing application regressions.

---

## 1. Integration Sequence & Dependencies

We will follow a structured top-down dependency sequence:

```
[1. Schema Foundation] ──> [2. Client Configs] ──> [3. Auth Binds]
                                                        │
[5. Products Table] <── [4. Profile Tables] <───────────┘
        │
        ├──> [6. Storage Buckets]
        │
[7. Inquiries Table] ──> [8. Chat Channels] ──> [9. AI Pipelines]
```

### Phase Details

#### Step 1: Database Schema Foundation
* **Goal**: Execute relational tables, primary/foreign keys, indices, and check constraints on Supabase PostgreSQL editor.
* **Dependencies**: None.

#### Step 2: Supabase Project/Client Configuration
* **Goal**: Install `@supabase/supabase-js` package inside `mobile/` workspace and set public environment variables.
* **Dependencies**: Step 1.

#### Step 3: Authentication & Sign-in
* **Goal**: Map `authService.login` and registration queries to Supabase Auth endpoints. Set session tokens and persist logins on device.
* **Dependencies**: Step 2.

#### Step 4: Profile Tables
* **Goal**: Link `artisan_profiles` and `buyer_profiles` queries. Update Settings saves to write to database.
* **Dependencies**: Step 3.

#### Step 5: Product Listings
* **Goal**: Pull marketplace items dynamically from the products database and publish new listings.
* **Dependencies**: Step 4.

#### Step 6: Product Images & Storage Buckets
* **Goal**: Create the `product-images` storage bucket, upload captured photos from mobile, and write public URL coordinates to `product_images` table.
* **Dependencies**: Step 5.

#### Step 7: Wholesale Inquiry Proposals
* **Goal**: Link B2B forms to create proposal entries, listing active inquiries on dashboards.
* **Dependencies**: Step 5.

#### Step 8: Messaging & Communication Channels
* **Goal**: Enable dialog logs loading and chat delivery between buyer/artisan communication channels.
* **Dependencies**: Step 7.

#### Step 9: AI Voice, Catalog, & pricing Pipelines
* **Goal**: Connect Gemini LLM prompt parsers, Speech-to-Text transcribers, and Cloudinary background removal models.
* **Dependencies**: Steps 6 & 8.

---

## 2. Rationale for Dependency Order

1. **Auth Before Profiles**: Profiles hold foreign key references (`users.id`) mapping back to the auth records. So, auth validation must be established first.
2. **Products Before Inquiries**: Wholesale inquiry proposals reference a target `product_id`. Catalog items must reside in the database before inquiries can be generated.
3. **Inquiries Before Messages**: Messages are associated with an active conversation session (`inquiry_id`). Inquiries must exist to hold messaging logs.
4. **AI Pipelines Last**: AI endpoints depend on transcribing media assets (stored in buckets) and inserting parsed results (saved as product/translation models) into the database. Basic CRUD operations must compile cleanly before automating AI generations.
