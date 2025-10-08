---
type: "always_apply"
---

# ContabilPRO Architecture Memory

This document captures the machine-readable architecture summary referenced by `AGENTS.md`. Keep it updated whenever structural changes occur.

## High-Level Overview

- **Frontend**: Next.js 15 with the App Router (`src/app`). Uses React functional components, shadcn/ui primitives, Tailwind CSS, Zustand for global state, and TanStack Query for asynchronous data.
- **Backend Services**: Supabase provides authentication, PostgreSQL database, storage, and Edge Functions. All server interactions use the Supabase SDKs located in `src/lib/supabase`.
- **Edge Functions (Deno)**: Located in `supabase/functions`. They encapsulate heavy processing tasks:
  - `parse-xml`: handles fiscal XML parsing, validation, and persistence.
  - `ai-assistant`: orchestrates Retrieval-Augmented Generation (RAG) with the OpenAI Agents SDK.
- **State and Data Flow**:
  1. User authentication occurs through Supabase Auth (server-side helpers in `src/lib/supabase/server.ts` and middleware in `src/lib/supabase/middleware.ts`).
  2. Authenticated requests hit protected App Router segments under `src/app/(dashboard)`.
  3. Components use Zustand stores (`src/stores`) for UI-level state and TanStack Query hooks (`src/hooks`) for data fetching.
  4. Supabase database enforces Row Level Security; client queries must supply `user_id` or `client_id` filters.
  5. Data ingestion (XML, OFX, payroll) flows through upload UIs -> Edge Functions -> Supabase tables.
  6. The AI assistant invokes Edge Functions to retrieve contextual data and call the OpenAI Agents SDK.

## Layered Folder Responsibilities

- `src/app`: route handlers, layouts, and pages. Server components gate access and call services.
- `src/components/ui`: shared UI primitives. Avoid putting business logic in this layer.
- `src/components/features`: feature-specific UI containers. They connect UI primitives to hooks/services.
- `src/lib`: shared logic.
  - `supabase`: client/server helpers, RLS-aware middleware, generated types.
  - `validators`: input validation (Zod schemas for auth and domain entities).
  - `query-client` and `providers`: TanStack Query setup.
  - `utils`: general helpers (`cn`, masks, formatters).
- `src/stores`: Zustand stores for authenticated user data and selected client.
- `src/hooks`: TanStack Query hooks (list, mutate, invalidate).
- `supabase/migrations`: SQL files that create/alter database schema and define triggers/RLS policies.
- `supabase/functions`: Deno Edge Functions packaged with Supabase CLI.

## Key Flows

### Authentication

1. User visits `/`.
2. `src/app/page.tsx` checks `supabase.auth.getUser` (server-side) and redirects to `/dashboard` or `/login`.
3. Middleware (`src/middleware.ts` -> `src/lib/supabase/middleware.ts`) refreshes sessions and protects routes.
4. Login/Register pages use Supabase browser client (`src/lib/supabase/client.ts`) plus React Hook Form and Zod.

### Client Management (Phase 1)

1. Dashboard routes under `src/app/(dashboard)` request data via TanStack Query hooks (`src/hooks/use-clients.ts`).
2. Hooks instantiate Supabase browser client and perform RLS-scoped queries (`from("clients").select("*")`).
3. Mutations insert/update records with the authenticated `user_id`, triggering RLS policies defined in `supabase/migrations/001_initial_schema.sql`.

### Data Import (XML / OFX)

1. User uploads files via dashboard UI (to be implemented in `src/app/(dashboard)/import`).
2. Edge Function `parse-xml` receives the payload, validates schema, normalizes values, and persists standardized entities in the database.
3. Future OFX parser follows a similar flow with banking data validation.

### Reporting and RAG

1. Reports aggregate financial data via TanStack Query hooks or server actions.
2. RAG assistant sends natural-language questions to the `ai-assistant` Edge Function.
3. Function performs secure Supabase queries (filtered by `client_id`) to build context documents.
4. OpenAI Agents SDK generates responses; results return to the frontend via HTTP or Supabase channel.

## External Integrations

- **Supabase**: Auth, Storage, Database, Edge Functions.
- **OpenAI Agents SDK**: used only inside Edge Functions for AI assistance.
- **Shadcn/ui**: UI component library (locally generated).
- **Lucide React**: icons inside UI components.

## Observability and DevOps

- Use Supabase logs + Vercel observability (when deployed) for error tracking.
- Edge Functions should emit structured logs for ingestion statistics and AI costs.
- Future CI/CD pipelines must run the commands listed in `AGENTS.md` to enforce code quality before deployment.

## Pending Tasks / TODO

- Implement the XML and OFX Edge Function logic.
- Add automated RLS integration tests (`npm run test:integration:rls`).
- Expand database schema beyond `clients` (e.g., invoices, ledger entries).
- Document deployment topology (Vercel + Supabase) when stabilized.
