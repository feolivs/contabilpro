---
type: "always_apply"
schema_version: "1.0.0"
primary_language: "TypeScript"
package_manager: "npm"
required_tools:
  - node@20.x
  - supabase-cli
  - deno@1.x
agent_capabilities:
  - read_file
  - write_file
  - run_tests
  - lint_code
  - commit
commands:
  install: "npm install"
  build: "npm run build"
  test: "npm run test"
  lint_fix: "npm run lint --fix"
  type_check: "npm run type-check"
  deploy_functions: "npm run deploy_functions"
  test_rls: "npm run test:integration:rls"
architecture_entry: "./.agent/wiki/architecture.md"
domain_entry: "./.agent/wiki/domain.md"
security_policy: "./.agent/security/policy.md"
---

# ContabilPRO Agent Protocol

This document is always in force. The agent MUST read and follow every section before performing work.

## Setup Commands

1. **Install dependencies**  
   Run `npm install`. If the repository adds or updates dependencies, re-run the command.
2. **Environment variables**  
   Copy `.env.local.example` to `.env.local`. Replace placeholder values with valid secrets. Never commit secrets. Service role keys must stay server-side (Edge Functions or Supabase CLI only).
3. **Supabase backend**  
   - Start local services with `supabase start` when developing offline.  
   - Apply migrations using `supabase migration up` or `npx supabase db push` (prefer the first when migrations exist).
4. **Edge Functions (optional during setup)**  
   When local development requires up-to-date Edge Functions, run `npm run deploy_functions`. If the script is missing, the agent MUST add it to `package.json` before proceeding.

## Build Commands

- **Main app (Next.js)**: `npm run build`
- **Edge Functions deploy**: `npm run deploy_functions`

## Testing Commands

All automated checks MUST pass before concluding a task. If a script is not present, create it as part of the work.

1. **Unit and integration tests**: `npm run test`
2. **Linting and formatting**: `npm run lint --fix`
3. **Type safety**: `npm run type-check`
4. **RLS validation** (database or query changes): `npm run test:integration:rls`

## Code Style & Conventions

- TypeScript in strict mode is mandatory. Fix all type errors.
- Prefer React functional components and hooks. Class components are prohibited.
- Use the Next.js App Router for new pages and layouts.
- Organize code into `data`, `logic`, and `ui` concerns. Business logic lives in services or server utilities, not inside React components.
- Global state: Zustand (`src/stores`). Remote data: TanStack Query (`src/lib/query-client`, `src/hooks`).
- Tailwind + shadcn/ui components are the design system. Reuse existing primitives before adding new ones.

## Project Structure & Context

- `src/app`: Next.js routes using the App Router. Nested folders denote route segments.  
- `src/components/ui`: shadcn/ui primitives with project defaults.  
- `src/components/features`: feature-specific UI.  
- `src/lib`: shared utilities (Supabase clients, validators, parsers, providers).  
- `src/stores`: Zustand stores for authenticated user and selected client.  
- `src/hooks`: TanStack Query hooks (for example `use-clients`).  
- `supabase/migrations`: SQL migrations with RLS policies.  
- `supabase/functions`: Deno Edge Functions (XML/OFX parsing, RAG orchestration).  
- `.agent/wiki/*.md`: machine-readable architecture/domain memory for the agent (see references below).

When adding new functionality, place files in the appropriate directory. Update imports to use the `@/*` alias when possible.

## Security & Dependency Policies

- Never commit real secrets. Replace them with placeholders in examples. If a secret leaks, rotate it immediately.
- Supabase Row Level Security (RLS) must remain enabled. Queries must always scope by `client_id` and authenticated `user_id`.
- API handlers and Edge Functions must follow OWASP best practices (input validation, rate limiting, error hygiene).
- Honor LGPD: collect only necessary personal data, ensure explicit consent, and document retention/erasure policies.
- Dependencies should stay current. Use Dependabot or manual updates to patch vulnerabilities quickly.

## Domain & Accounting Rules

- Use the standard Brazilian chart of accounts supplied by the accounting team. Persist IDs or codes to keep entries SPED-compliant.
- Accounting entries must follow SPED Contabil posting patterns (debits/credits in balance). Document any deviation.
- Payroll-related launches (salaries, INSS, FGTS) must be configurable per client. Default to safe values and expose toggles in services or Edge Functions.
- Financial reports (DRE, Balance Sheet, Cash Flow) must reconcile with imported data. Add automated checks where possible.

## RAG and Edge Function Guidelines

- The RAG orchestration must run in Edge Functions (Deno) or Supabase services. Never call the OpenAI Agents SDK directly from the client.
- Retrieval queries must include `client_id` filters to enforce tenant isolation.
- Pre-process XML/OFX uploads in dedicated Edge Functions. Validate payloads, sanitize strings, and store parsed results in Supabase with RLS.
- Log expensive operations (OpenAI calls, bulk parses) for cost tracking.

## Required Documentation

- **Architecture**: `./.agent/wiki/architecture.md` contains the system diagram, major flows (auth, ingest, RAG), and folder responsibilities.
- **Domain memory**: `./.agent/wiki/domain.md` captures accounting and regulatory context (plan of accounts, SPED, payroll knobs).
- **Security policy**: `./.agent/security/policy.md` defines LGPD posture, secret management, data retention, and incident response.

The agent MUST keep these files up to date when architecture, domain rules, or security posture change.

## Checklist Before Concluding Work

1. Run all commands in the **Testing Commands** section. Fix failures.
2. Ensure new code follows the conventions and directory layout above.
3. Update architecture/domain/security docs when changes modify their content.
4. Rotate or remove any secrets accidentally introduced during development.
5. Prepare commits using Conventional Commits syntax (for example `feat: add client upload form`).
