# FamilyOS

Privacy-first Persian family life management and memory application.

## Stack

- Next.js 15 (App Router), TypeScript (strict)
- PostgreSQL via Supabase, accessed through Drizzle ORM
- Supabase Storage behind a `StorageService` interface (`src/lib/storage`)
- OpenAI behind an `AIService` interface (`src/lib/ai`) for document OCR, classification, and structured extraction
- Tailwind CSS, Vazirmatn (Persian) font, `dir="rtl"` shell

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase + OPENAI_API_KEY
pnpm run db:generate         # generate SQL migrations from src/lib/db/schema.ts
pnpm run db:migrate          # apply migrations to your Postgres instance
pnpm run dev
```

## Current phase

**Phase 3 — AI document processing** is implemented:

- Upload creates a document + `ai_processing_jobs` row and kicks processing via `after()`
- Pipeline: OCR → classify → extract (Zod-validated) → product / purchase / warranty upsert
- Low-confidence extractions are stored for review but do not create authoritative entities
- Document detail shows extraction, linked entities, and retry on failure
- AI token usage is recorded in `ai_usage_events` (internal only)

## Open decisions for later phases

1. Job processing remains DB-polled (no Redis) until volume requires otherwise
2. Ask / timeline / reminders / subscriptions are Phase 4–7
