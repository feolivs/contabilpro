---
type: "always_apply"
---

# ContabilPRO Domain Memory

This file codifies the accounting and business rules that shape development. Update it whenever requirements evolve.

## Personas and Goals

- **Primary user**: Brazilian accountant responsible for multiple small and medium businesses.
- **Pain point**: Manual data entry, reconciliation, and reporting consume most of the workday, delaying advisory tasks.
- **Product promise**: Automate ingestion, posting, and reporting so the accountant can focus on strategic insights.

## Core Modules

1. **Client Management**  
   CRUD for client records (CNPJ, contact info, tax regime). Each client is tied to a Supabase `user_id`.
2. **Data Import**  
   - XML (NF-e, NFSe, fiscal coupons).  
   - OFX bank statements.  
   - Payroll summaries from third-party systems.  
   Each import triggers normalization and posting logic to keep ledgers balanced.
3. **Accounting Engine**  
   Generates double-entry postings that follow SPED Contabil charts and ensures inventory movements are mirrored in financial ledgers.
4. **Financial Module**  
   Accounts payable/receivable, cash flow, bank reconciliation with suggestion engine.
5. **Tax Analysis**  
   Calculates PIS, COFINS, ICMS, ISS, and simulates regimes (Simples, Presumido, Real).
6. **Reporting**  
   DRE, balance sheet, cash flow, trial balance, profitability by product/service. Export options (SPED, CSV) must respect LGPD.
7. **AI Assistant (RAG)**  
   Answers business questions by combining Supabase data with contextual knowledge, respecting tenant isolation.

## Accounting Rules & Standards

- Adopt the standardized chart of accounts delivered by the accounting team. Store canonical codes to remain SPED-compatible.
- Enforce double-entry bookkeeping: every transaction must have balanced debit and credit sides.
- Inventory movements must adjust both stock quantities and related financial accounts.
- Payroll entries require configurable parameters (e.g., optional INSS patronal). Defaults should match conservative compliance.
- Tax calculations must reference official tables. Extract rates from environment configuration or database tables, not hard-coded constants.

## Data Governance

- All data is multi-tenant. Tables must include `client_id` (or equivalent) and have RLS enabled.
- Sensitive documents (XML, payroll) are stored in Supabase Storage with row-level access policies.
- Personally identifiable information (PII) needs encryption at rest and secure transmission. Where possible, store hashed or tokenized identifiers.
- Define retention periods for uploaded documents and audit logs to comply with LGPD.

## Future Enhancements

- Build automated anomaly detection (e.g., missing invoices, unmatched bank transactions).
- Add audit trails for edits and deletions to support compliance.
- Provide parameterized tax simulations per client profile (size, regime, sector).
- Support multi-currency clients with currency conversion tables and FX gains/losses tracking.
