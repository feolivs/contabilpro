# ContabilPRO Architecture Memory

This document captures the machine-readable architecture summary referenced by `AGENTS.md`. Keep it updated whenever structural changes occur.

**Last Updated**: 2025-01-08 (FASE 7 - Documentation Complete)

## High-Level Overview

- **Frontend**: Next.js 15.5 with the App Router (`src/app`). Uses React 19.1 functional components, shadcn/ui primitives, Tailwind CSS, Zustand for global state, and TanStack Query 5 for asynchronous data.
- **Backend Services**: Supabase provides authentication, PostgreSQL database with RLS, storage, and Edge Functions. All server interactions use the Supabase SDKs located in `src/lib/supabase`.
- **Edge Functions (Deno)**: Located in `supabase/functions`. They encapsulate heavy processing tasks:
  - `parse-xml`: ✅ **IMPLEMENTED** - Handles NF-e XML parsing, validation, and persistence to `invoices` and `invoice_items` tables.
  - `parse-ofx`: ✅ **IMPLEMENTED** - Handles OFX bank statement parsing and persistence to `bank_transactions` table.
  - `ai-assistant`: ⏳ **PLANNED** - Will orchestrate Retrieval-Augmented Generation (RAG) with the OpenAI Agents SDK.
- **State and Data Flow**:
  1. User authentication occurs through Supabase Auth (server-side helpers in `src/lib/supabase/server.ts` and middleware in `src/lib/supabase/middleware.ts`).
  2. Authenticated requests hit protected App Router segments under `src/app/dashboard`.
  3. Components use Zustand stores (`src/stores`) for UI-level state (auth user, selected client) and TanStack Query hooks (`src/hooks`) for data fetching.
  4. Supabase database enforces Row Level Security; all queries are automatically scoped by `user_id` or `client_id` filters.
  5. Data ingestion (XML, OFX) flows through upload UIs (`/dashboard/import`) -> Storage -> Edge Functions -> Database tables.
  6. Document management (`/dashboard/import/history`) provides full CRUD operations with filters, statistics, and reprocessing capabilities.

## Layered Folder Responsibilities

- `src/app`: route handlers, layouts, and pages. Server components gate access and call services.
- `src/components/ui`: shared UI primitives. Avoid putting business logic in this layer.
- `src/components/features`: feature-specific UI containers. They connect UI primitives to hooks/services.
- `src/lib`: shared logic.
  - `supabase`: client/server helpers, RLS-aware middleware, generated types.
  - `validators`: input validation (Zod schemas for auth and domain entities).
  - `providers`: TanStack Query setup with QueryClient instantiated per component mount to prevent state update errors.
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

### Client Management ✅ COMPLETE

1. Dashboard routes under `src/app/dashboard/clients` request data via TanStack Query hooks (`src/hooks/use-clients.ts`).
2. Hooks instantiate Supabase browser client and perform RLS-scoped queries (`from("clients").select("*")`).
3. Mutations insert/update records with the authenticated `user_id`, triggering RLS policies defined in `supabase/migrations/001_initial_schema.sql`.
4. Full CRUD operations: Create, Read, Update, Delete with CNPJ validation.
5. Client selector in Zustand store (`useClientStore`) for multi-tenant context.

### Data Import (XML / OFX) ✅ COMPLETE

1. User uploads files via dashboard UI at `src/app/dashboard/import`.
2. **FileUploadZone** component (`src/components/features/import/file-upload-zone.tsx`):
   - Drag-and-drop interface using react-dropzone
   - Client selection validation
   - File type validation (XML, OFX)
   - Size limit validation (10MB)
   - Progress tracking with real-time feedback
3. Files are uploaded to Supabase Storage at path: `documents/{user_id}/{client_id}/{type}/{filename}`
4. Document metadata is created in `documents` table with status `pending`
5. Frontend automatically triggers appropriate Edge Function:
   - `parse-xml` for NF-e documents
   - `parse-ofx` for bank statements
6. Edge Functions:
   - Download file from Storage
   - Parse and validate content
   - Extract structured data
   - Persist to database tables (`invoices`, `invoice_items`, `bank_transactions`)
   - Update document status to `completed` or `failed`
7. Frontend polls or receives real-time updates on processing status

### Document Management ✅ COMPLETE

1. History page at `src/app/dashboard/import/history` displays all uploaded documents
2. **DocumentsTable** component (`src/components/features/import/documents-table.tsx`):
   - Paginated list with file name, client, type, status, size, date
   - Status badges: pending, processing, completed, failed
   - Type badges: NF-e, NFSe, NFC-e, OFX, Folha
   - Actions menu: View details, Reprocess, Delete
3. **DocumentsFilters** component:
   - Filter by type (all, nfe, nfse, nfce, ofx, folha)
   - Filter by status (all, pending, processing, completed, failed)
   - Date range filtering (planned)
4. **DocumentsStats** component:
   - Real-time statistics: Total, Completed, Failed, Processing, Pending
   - Visual cards with icons and counts
5. **DocumentDetails** dialog:
   - Full document metadata
   - Processing logs and error messages
   - Download original file
6. **Reprocess** functionality:
   - Resets document status to `pending`
   - Re-triggers appropriate Edge Function
   - Useful for failed documents after bug fixes
7. **Delete** functionality:
   - Removes document from database
   - Deletes file from Storage
   - Cascade deletes related records (invoices, transactions)

### Reporting and RAG ⏳ PLANNED

1. Reports will aggregate financial data via TanStack Query hooks or server actions.
2. RAG assistant will send natural-language questions to the `ai-assistant` Edge Function.
3. Function will perform secure Supabase queries (filtered by `client_id`) to build context documents.
4. OpenAI Agents SDK will generate responses; results return to the frontend via HTTP or Supabase channel.

## External Integrations

- **Supabase**: Auth, Storage, Database, Edge Functions.
- **OpenAI Agents SDK**: used only inside Edge Functions for AI assistance.
- **Shadcn/ui**: UI component library (locally generated).
- **Lucide React**: icons inside UI components.

## Testing Infrastructure ✅ COMPLETE

- **Jest** configured with Next.js integration (`jest.config.js`)
- **Testing Library** for React component testing
- **Global mocks** for Supabase, Next.js router, Zustand stores, Sonner toast (`jest.setup.js`)
- **Test suites**:
  - Unit tests for hooks (`src/__tests__/hooks/`)
  - Unit tests for components (`src/__tests__/components/`)
  - RLS policy tests (`tests/rls/`)
- **Coverage thresholds**: 50% for branches, functions, lines, statements
- **Scripts**:
  - `npm test` - Run all tests
  - `npm run test:watch` - Watch mode
  - `npm run test:coverage` - With coverage report
  - `npm run test:integration:rls` - RLS-specific tests
- **Documentation**: Comprehensive testing guide in `tests/README.md`

## Observability and DevOps

- Use Supabase logs + Vercel observability (when deployed) for error tracking.
- Edge Functions emit structured logs for ingestion statistics and processing metrics.
- CI/CD pipelines should run the commands listed in `AGENTS.md` to enforce code quality before deployment:
  - `npm run lint` - ESLint validation
  - `npm run type-check` - TypeScript type checking
  - `npm test` - Full test suite
  - `npm run build` - Production build verification

## Database Schema ✅ COMPLETE

### Tables

1. **clients** - Client records with CNPJ, name, contact info
   - RLS: Users can only access their own clients
   - Indexes: user_id, cnpj

2. **documents** - Uploaded document metadata
   - RLS: Users can only access their own documents
   - Indexes: user_id, client_id, status, type
   - Storage path reference for file location

3. **invoices** - Parsed NF-e data (header)
   - RLS: Scoped by client_id (which is scoped by user_id)
   - Indexes: client_id, document_id, xml_key, issue_date
   - Contains: emitter, recipient, totals, taxes

4. **invoice_items** - Parsed NF-e line items
   - RLS: Scoped by invoice_id (which is scoped by client_id)
   - Indexes: invoice_id, product_code
   - Contains: product details, quantities, values, taxes

5. **bank_transactions** - Parsed OFX transactions
   - RLS: Scoped by client_id (which is scoped by user_id)
   - Indexes: client_id, document_id, transaction_date, account_id
   - Unique constraint: client_id + account_id + transaction_id (prevents duplicates)
   - Contains: account info, transaction details, amounts

### Storage Buckets

- **documents** - Stores uploaded XML and OFX files
  - Path structure: `{user_id}/{client_id}/{type}/{filename}`
  - RLS policies: Users can only upload/download their own files
  - Max file size: 10MB
  - Allowed types: XML, OFX

## Completed Features (v1.0)

✅ **Authentication & Authorization**
- Supabase Auth integration
- JWT-based sessions
- Protected routes with middleware
- RLS policies on all tables

✅ **Client Management**
- Full CRUD operations
- CNPJ validation
- Multi-tenant isolation

✅ **Document Upload**
- Drag-and-drop interface
- File validation (type, size)
- Progress tracking
- Storage integration

✅ **Document Processing**
- NF-e XML parsing (parse-xml Edge Function)
- OFX bank statement parsing (parse-ofx Edge Function)
- Automatic data extraction
- Error handling and retry

✅ **Document Management**
- History view with filters
- Statistics dashboard
- Reprocess failed documents
- Delete with cascade cleanup

✅ **Testing**
- Unit tests for hooks and components
- RLS policy tests
- Coverage reporting
- Comprehensive documentation

## Pending Tasks / TODO

⏳ **Phase 8: Advanced Features**
- Implement RAG assistant with OpenAI Agents SDK
- Add financial reports (DRE, Balance Sheet, Cash Flow)
- Implement bank reconciliation
- Add tax calculations (PIS, COFINS, ICMS, ISS)
- Create audit trail for all operations

⏳ **Phase 9: Production Deployment**
- Configure Vercel deployment
- Set up environment variables
- Configure custom domain
- Enable monitoring and alerts
- Document deployment topology
