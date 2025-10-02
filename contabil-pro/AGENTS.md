ContabilPRO — Agent Dev Spec
1) Missão

Construir um SaaS contábil multi-tenant com Next.js (App Router + Server Actions) e Supabase (Auth, Postgres, Storage, RLS). As mutações rodam como Server Actions; tarefas longas (OCR, importadores, conciliação) vão para funções/cron. 


2) Regras e restrições (não-negociáveis)

Multi-tenant por RLS: cada tabela exposta tem RLS ativo; acesso filtrado por tenant_id vindo do JWT/claim. Políticas escritas em SQL. 


Storage com policies: buckets por tenant; criar políticas de SELECT/INSERT/UPDATE/DELETE específicas (upload ≠ overwrite). Usar helpers do Storage nas policies quando útil. 


NFS-e nacional: preparar adapter com driver municipal (hoje) e driver nacional (flag) — obrigatória a partir de jan/2026. 


Open Finance: seguir OAuth2/OIDC com FAPI e escopos/consentimentos; nada de scrapers. 


LGPD: implementar direitos do titular (export/erase; revogar consentimento) e trilha de auditoria. 


3) Domínio (tabelas núcleo)

tenants, users, user_tenants(role), clients, accounts, entries(ledger imutável), documents(storage path + hash), bank_accounts, bank_transactions, tax_obligations, tasks, proposals, ai_insights.

Invariantes

entries não editáveis: ajustes geram novas linhas.

documents.hash garante idempotência de importações.

bank_transactions.external_id único por provedor.

4) Superfície de produto (rotas)

/dashboard, /clientes, /lancamentos, /bancos, /fiscal, /documentos, /tarefas, /propostas, /relatorios, /copiloto, /config.

5) Ações do agente (Server Actions / Adapters)
5.1 Server Actions (sincronas, UI-coladas)

createClient(input) → cria cliente (Zod valida); retorna row.

uploadDocument({path, entry_id?}) → registra metadados do arquivo.

createEntry(input) → insere lançamento (valida débito=crédito).

classifyEntry(entry_id) → chama ai/classify, grava ai_insights.

reconcileMatch(tx_id, entry_id, score) → aplica conciliação se score>=threshold.

importNFe(xml) → usa adapter NFe, valida assinatura/schema e gera entries + documents. (Validação de XML/assinatura segue manuais oficiais da NF-e.) 


5.2 Jobs/Functions (assíncronas)

openfinance/pull-transactions(consent_id, since) → normaliza e insere bank_transactions com idempotência. (FAPI/escopos por consent.) 


nfse/import(xml, mode) → mode: municipal|nacional (flag para 2026). 


fiscal/run-das(client_id, period) → calcula DAS/gera tarefa e lembrete.

observability/metrics-snapshot() → coleta métricas (OCR/IA/conciliação).

5.3 Adapters (infra ponta-a-ponta)

Open Finance: createConsentRedirect(), handleConsentCallback(), fetchAccounts(), fetchTransactions(). (Padrão BACEN; alternativa: agregador Belvo para acelerar POC e padronização). 


NFe: validateAndParse(xml) → assinatura + schema → DTO. 


NFS-e: importNFSe(xml, driver) → driver municipal | nacional. 

6) Políticas RLS (padrão)

Habilitar RLS em todas as tabelas expostas.

SELECT/INSERT/UPDATE/DELETE condicionados a tenant_id = current_setting('request.jwt.claims')::jsonb->>'tenant_id'. (Ou função current_tenant().)

Storage: política por bucket/tenant folder; uploads exigem INSERT, overwrite exige SELECT+UPDATE. 

7) Critérios de aceitação (BDD condensado)

Classificação IA: se conf>=0.85, estado “Aguardando confirmação”; <0.6 força revisão — com explicação exibível (palavras-chave/CFOP/CST/similaridade).

Conciliação: matching descrição+valor+data±2d com score>=0.9 propõe conciliar; ação confirma e marca ambos como “Conciliados”.

NFe: ao importar XML válido, sistema valida assinatura e schema, cria lançamento com fornecedor/CFOP/CST/valores e anexa XML + DANFE. 
Nota Fiscal Eletrônica

Open Finance: fluxo consent → callback → fetch transações; transações não podem duplicar (external_id único). 
openfinancebrasil.atlassian.net

LGPD: endpoint de export/erase por titular e trilha de acesso a documentos. 


8) Estrutura de repositório (monorepo)
apps/web/            # Next.js (App Router + Server Actions)
  app/               # rotas + RSC
  actions/           # Server Actions (CRUD/IA/conciliacao/NFe)
  lib/               # supabase client, auth, rls helpers
  components/        # UI (shadcn/ui, TanStack Table)
  tests/             # unit, integration, e2e
packages/domain/     # entidades, zod, regras contábeis
packages/adapters/   # openfinance, nfe, nfse
packages/ai/         # prompts, parsers, explainability
packages/bdd/        # .feature + steps
infra/               # migrations SQL, policies RLS/Storage, seeds

9) Variáveis de ambiente

NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

OPENFINANCE_CLIENT_ID, OPENFINANCE_CLIENT_SECRET, OPENFINANCE_PROVIDER_URL

NFSE_MODE=municipal|nacional (feature-flag 2026). 


10) Roadmap orientado a agente (ordem de execução)

Bootstrap: criar app Next (App Router) + configurar Server Actions. 


DB & RLS: criar tabelas núcleo + ENABLE RLS + policies por tenant_id. Testes negativos. 


Storage: criar bucket por tenant + policies (INSERT/SELECT/UPDATE/DELETE separados). 

UI esqueleto: rotas listadas; forms com Server Actions (CRUD de clients/documents). 

Adapter NFe: validação assinatura/schema + mapeamento; BDD “XML válido”. 

Open Finance: consent → callback → fetchTransactions; idempotência; preparar certificação/conformidade. 


IA classificação: serviço de sugestão + explicabilidade + limiares.

Conciliação: matcher probabilístico com tolerância de data.

LGPD: export/erase + auditoria de acessos. 


NFS-e nacional: manter driver e feature-flag para a virada/obrigatoriedade 2026. 

11) Dicionário de comandos para o agente

make:table <name> → cria migration SQL com tenant_id, timestamps e índices.

make:policy <table> tenant → gera ENABLE RLS + policy tenant_id = current_tenant(). 
Supabase

make:storage-policy <bucket> <op> → cria policy de Storage (op: select|insert|update|delete). 
Supabase

gen:server-action <name> → cria arquivo em apps/web/actions/<name>.ts com "use server". 
Next.js

gen:adapter nfe|nfse|openfinance <method> → stubs com TODO e referências normativas.

bdd:add <feature> → cria .feature e steps vazios em packages/bdd.

12) Critérios de “Pronto” e “Feito”

DoR: regra de negócio + exceções; eventos de domínio; cenário .feature; métrica alvo.

DoD: cenários BDD passando no CI; políticas RLS testadas; Storage policies verificadas; a11y básico e loading states.