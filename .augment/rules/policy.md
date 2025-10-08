---
type: "always_apply"
---

# ContabilPRO Security Policy

This policy guides every change in the repository. Update it when security posture evolves.

## Secret Management

- Never commit real API keys, database passwords, or service role tokens.
- `.env.local.example` must only contain placeholders. Real credentials live in `.env.local` (ignored by Git) or secret managers (Vercel, Supabase, GitHub Actions).
- Rotate leaked secrets immediately and document the rotation in the incident log.
- Service role keys must only be used from secure server-side environments (Edge Functions or Supabase CLI). They must never be exposed to the browser.

## Authentication & Authorization

- Supabase Auth is mandatory for all user-facing features. Routes under `src/app/(dashboard)` require authenticated sessions enforced via middleware.
- Row Level Security (RLS) must stay enabled for every table holding tenant data. Policies must ensure users access only their own `client_id` records.
- Any new table must ship with RLS policies and supporting indexes before being merged.

## Data Protection & LGPD

- Collect only necessary personal and financial data. Obtain explicit consent where required.
- Provide mechanisms for data access, correction, and deletion in line with LGPD.
- Store PII with encryption at rest (Supabase covers this) and ensure TLS in transit.
- Log data access and changes for auditability. Retain logs according to regulatory requirements.

## Secure Coding Practices

- Validate all user input with Zod or equivalent schema validators before processing.
- Sanitize file uploads. Reject unexpected MIME types, enforce size limits, and scan XML/OFX payloads for threats before parsing.
- Escape or parameterize database queries (Supabase SDK does this by default). Never concatenate SQL strings with user input.
- Handle errors gracefully without leaking stack traces or sensitive metadata to clients.
- Keep dependencies patched. Audit weekly for known vulnerabilities.

## RAG and AI Usage

- AI calls must originate from trusted server environments (Edge Functions). No direct client-to-OpenAI requests.
- Log AI interactions (prompt metadata, cost) for auditing and cost control. Do not store sensitive context in logs.
- Ensure retrieval queries include tenant filters (`client_id`) and respect least-privilege data exposure.

## Incident Response

- Maintain an incident log (internal) with timestamp, impact, and resolution steps.
- In case of data breach, follow LGPD notification timelines and coordinate with stakeholders.
- After every incident, run a postmortem and update this policy or architecture docs accordingly.

## Deployment & Infrastructure

- Production deployments must rely on automated pipelines that run linting, tests, and type checks.
- Enable Supabase backups and monitor storage usage. Test restore procedures periodically.
- Configure Vercel environment variables with the minimum necessary permissions.

Following this policy is a non-negotiable requirement for all contributions.
