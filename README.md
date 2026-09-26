# FamilyOS — Phase 0

Foundation scaffold: project structure, DB connection, storage abstraction,
AI abstraction, RTL UI shell. No auth, household, or document features yet —
those are Phase 1+.

## Stack

- Next.js 15 (App Router), TypeScript (strict)
- PostgreSQL via Supabase, accessed through Drizzle ORM
- Supabase Storage behind a `StorageService` interface (`src/lib/storage`)
- AI behind an `AIService` interface (`src/lib/ai`) — **not yet wired to a
  real provider**; calls currently throw until a provider is chosen (Phase 3)
- Tailwind CSS, Vazirmatn (Persian) font, `dir="rtl"` shell

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project details
npm run db:generate          # generate SQL migrations from src/lib/db/schema.ts
npm run db:migrate           # apply migrations to your Postgres instance
npm run dev
```

This was scaffolded in a sandbox with no network access, so none of the
above has been run or verified end-to-end yet — please run through this
setup once and flag anything that doesn't work.

## What's in scope right now (Phase 0)

- `src/lib/db/schema.ts` — tables for `users`, `households`,
  `household_members`, `people` (the Phase 1 entities)
- `src/lib/storage` — `StorageService` interface + a working Supabase
  Storage implementation
- `src/lib/ai` — `AIService` interface + an unconfigured placeholder that
  throws instead of faking results
- `src/config/plans.ts` — config-driven subscription plan definitions
- `src/app` — RTL app shell with Persian font, no real pages yet

## Open decisions still needed

1. Final choice of LLM/OCR provider for the real `AIService` implementation
2. Job processing approach for Phase 3 (default plan: a DB-polled
   `AIProcessingJob` table, no queue infra yet)
3. Deployment target (affects whether background jobs can be long-running
   or must stay serverless-friendly)

## Definition of done for Phase 0

The app runs locally (`npm run dev`) against a real Supabase Postgres
instance. Auth, household creation, and the dashboard are Phase 1.
