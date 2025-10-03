# ContabilPRO — Agent Dev Spec (versão para **contadores autônomos**)

## 1) Missão

Construir um **SaaS contábil focado em contadores autônomos** com Next.js (App Router + Server Actions) e Supabase (Auth, Postgres, Storage). As mutações rodam como Server Actions; tarefas longas (OCR, importadores, conciliação) vão para funções/cron.

---

## 2) Regras e restrições (não‑negociáveis)

**Conta única (single‑user / single office):** o sistema é operado por um único contador(a). Nada de multi‑tenant, sem `tenant_id`.

**Isolamento por usuário (opcional):** manter RLS simples por `user_id` apenas para garantir privacidade caso haja múltiplas sessões/dispositivos do mesmo(a) profissional.

**Storage privado:** buckets privados com políticas por `owner_id = auth.uid()`; upload ≠ overwrite; versionamento lógico por `documents.hash`.

**NFS‑e nacional:** preparar adapter com driver municipal (hoje) e driver nacional (flag) — obrigatória a partir de **jan/2026**.

**Open Finance:** seguir OAuth2/OIDC com FAPI e escopos/consentimentos; **sem scrapers**.

**LGPD:** implementar direitos do titular (export/erase; revogar consentimento) e trilha de auditoria.

---

## 3) Domínio (tabelas núcleo)

**users** (mínimo, 1 proprietário), **clients**, **accounts**, **entries** (ledger imutável), **documents** (storage path + hash), **bank_accounts**, **bank_transactions**, **tax_obligations**, **tasks**, **proposals**, **ai_insights**.

### Invariantes

* **entries não editáveis:** ajustes geram novas linhas.
* **documents.hash** garante idempotência de importações.
* **bank_transactions.external_id** único por provedor.

> Removidos: `tenants`, `user_tenants(role)` e qualquer referência a `tenant_id`.

---

## 4) Superfície de produto (rotas)

`/dashboard`, `/clientes`, `/lancamentos`, `/bancos`, `/fiscal`, `/documentos`, `/tarefas`, `/propostas`, `/relatorios`, `/copiloto`, `/config`.

> Sem escopo/slug de tenant. Toda a UI opera sobre a **conta única** do contador(a).

---

## 5) Ações do agente (Server Actions / Adapters)

### 5.1 Server Actions (síncronas, UI‑coladas)

* `createClient(input)` → cria cliente (Zod valida); retorna row.
* `uploadDocument({ path, entry_id? })` → registra metadados do arquivo.
* `createEntry(input)` → insere lançamento (valida débito=crédito).
* `classifyEntry(entry_id)` → chama `ai/classify`, grava `ai_insights`.
* `reconcileMatch(tx_id, entry_id, score)` → aplica conciliação se `score >= threshold`.
* `importNFe(xml)` → usa adapter NFe, valida assinatura/schema e gera entries + documents. (Validação segue manuais oficiais da NF‑e.)

### 5.2 Jobs/Functions (assíncronas)

* `openfinance/pull-transactions(consent_id, since)` → normaliza e insere `bank_transactions` com idempotência.
* `nfse/import(xml, mode)` → `mode: municipal | nacional` (feature‑flag para 2026).
* `fiscal/run-das(client_id, period)` → calcula DAS/gera tarefa e lembrete.
* `observability/metrics-snapshot()` → coleta métricas (OCR/IA/conciliação).

### 5.3 Adapters (infra ponta‑a‑ponta)

* **Open Finance:** `createConsentRedirect()`, `handleConsentCallback()`, `fetchAccounts()`, `fetchTransactions()`.
* **NFe:** `validateAndParse(xml)` → assinatura + schema → DTO.
* **NFS‑e:** `importNFSe(xml, driver)` → driver municipal | nacional.

---

## 6) Políticas RLS (simples)

* Habilitar RLS **somente por usuário** quando aplicável: `owner_id = auth.uid()`.
* **SEM** filtro por `tenant_id`.
* Storage: política por bucket privado; uploads exigem `INSERT`, overwrite exige `SELECT + UPDATE`.

---

## 7) Critérios de aceitação (BDD condensado)

**Classificação IA:**

* `conf >= 0.85` → estado “Aguardando confirmação”.
* `< 0.6` → força revisão (explicação exibível: palavras‑chave/CFOP/CST/similaridade).

**Conciliação:**

* Matching `descrição + valor + data±2d` com `score >= 0.9` propõe conciliar; ação confirma e marca ambos como “Conciliados”.

**NFe:**

* Ao importar XML válido, sistema valida assinatura e schema, cria lançamento com fornecedor/CFOP/CST/valores e anexa XML + DANFE.

**Open Finance:**

* Fluxo consent → callback → fetch transações; transações não duplicam (`external_id` único).

**LGPD:**

* Endpoint de export/erase por titular e trilha de acesso a documentos.

---

## 8) Estrutura de repositório (monorepo)

```
apps/web/            # Next.js (App Router + Server Actions)
  app/               # rotas + RSC
  actions/           # Server Actions (CRUD/IA/conciliacao/NFe)
  lib/               # supabase client, auth, rls helpers (por user_id)
  components/        # UI (shadcn/ui, TanStack Table)
  tests/             # unit, integration, e2e
packages/domain/     # entidades, zod, regras contábeis
packages/adapters/   # openfinance, nfe, nfse
packages/ai/         # prompts, parsers, explainability
packages/bdd/        # .feature + steps
infra/               # migrations SQL, policies RLS/Storage, seeds
```

> Observação: helpers e migrations não devem referenciar `tenant_id`.

---

## 9) Variáveis de ambiente

* `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `OPENFINANCE_CLIENT_ID`, `OPENFINANCE_CLIENT_SECRET`, `OPENFINANCE_PROVIDER_URL`
* `NFSE_MODE=municipal|nacional` (feature‑flag 2026)

---

## 10) Roadmap orientado a agente (ordem de execução)

1. **Bootstrap:** criar app Next (App Router) + configurar Server Actions.
2. **DB & RLS:** criar tabelas núcleo; **habilitar RLS por `owner_id`** (quando aplicável). Testes negativos.
3. **Storage:** criar bucket privado + policies (INSERT/SELECT/UPDATE/DELETE separados).
4. **UI esqueleto:** rotas listadas; forms com Server Actions (CRUD de clients/documents).
5. **Adapter NFe:** validação assinatura/schema + mapeamento; BDD “XML válido”.
6. **Open Finance:** consent → callback → `fetchTransactions`; idempotência; preparar certificação/conformidade.
7. **IA classificação:** serviço de sugestão + explicabilidade + limiares.
8. **Conciliação:** matcher probabilístico com tolerância de data.
9. **LGPD:** export/erase + auditoria de acessos.
10. **NFS‑e nacional:** manter driver e feature‑flag para a virada/obrigatoriedade 2026.

---

## 11) Dicionário de comandos para o agente

* `make:table <name>` → cria migration SQL com `owner_id`, timestamps e índices.
* `make:policy <table> owner` → gera ENABLE RLS + policy `owner_id = auth.uid()`.
* `make:storage-policy <bucket> <op>` → policy de Storage (op: `select|insert|update|delete`).
* `gen:server-action <name>` → cria arquivo em `apps/web/actions/<name>.ts` com `"use server"`.
* `gen:adapter nfe|nfse|openfinance <method>` → stubs com TODO e referências normativas.
* `bdd:add <feature>` → cria `.feature` e steps vazios em `packages/bdd`.

> Removido o comando `make:policy <table> tenant` e qualquer gerador que inclua `tenant_id`.

---

## 12) Critérios de “Pronto” e “Feito”

**DoR:** regra de negócio + exceções; eventos de domínio; cenário `.feature`; métrica alvo.

**DoD:** cenários BDD passando no CI; policies RLS por usuário verificadas; Storage policies verificadas; a11y básico e loading states.
