Stack ContabilPRO Decisões de arquitetura Minha recomendação: Next.js (App Router) + Supabase Por quê? Velocidade e menos fricção: Auth, Postgres, Storage, Row-Level Security (RLS), triggers e funções — tudo pronto. Você foca no produto, não em boilerplate. Multi-tenant seguro: Contadores autônomos precisam isolar dados por cliente/escritório. RLS do Supabase resolve isso elegantemente. Server Actions e Edge Functions: Use Server Actions do Next para lógica “colada” à UI (criar lançamento, anexar recibo). Para jobs longos (OCR, conciliação, importações), Supabase Edge Functions ou cron. Híbrido ideal (prático) 80% Supabase (auth, DB, storage, RLS, realtime). 20% Next API/Server Actions para endpoints específicos, webhooks (NFe, bancos), e orquestrações. Modelo de dados (núcleo enxuto, escalável) tenants (escritórios/contadores) users (vinculados a tenant, roles: owner, contador, assistente) clients (CNPJ/CPF, regime, CNAE, calendário fiscal) accounts (contas contábeis + plano de contas por tenant) bank_accounts, bank_transactions (extratos, conciliação) entries (lançamentos): débito, crédito, centro de custo, anexos documents (XML NFe/NFSe, recibos, PDFs) tax_obligations (INSS, DARF, DAS, ICMS etc., status, vencimentos) tasks (checklists mensais, SLA, responsável) proposals & clients_pipeline (pipeline comercial simples) ai_insights (explicações, classificações, riscos, logs de IA) RLS: todas as tabelas com tenant_id = auth.uid() (via mapeamento) e policies “select/insert/update where tenant_id = current_setting('request.jwt.claims.tenant_id')::uuid”. Frontend (mapa de páginas enxuto e útil) /dashboard – visão do dia: obrigações próximas, guias a emitir, caixa/saldo, alertas de conformidade, pendências dos clientes. /clientes – cadastro, documentos pendentes, status fiscal, chat/whatsapp, “solicitar documento” 1-clique. /lancamentos – grid inteligente com: anexos, OCR, categorização por IA, regras contábeis, validação dupla. /bancos – integração e conciliação assistida (match IA por descrição, valor, data). /fiscal – NFe/NFSe, importação de XML, apuração (PIS/COFINS/ICMS/ISS/DAS), geração de guias e lembretes. /documentos – drive do cliente/tenant com OCR, tags e versão; busca semântica. /tarefas – checklists mensais (fechamento), templates por regime, SLA e prazos. /propostas – CRM simples, propostas, honorários, assinatura. /relatorios – DRE, fluxo de caixa, dashboard por cliente, export Excel/PDF. /copiloto – assistente de IA: “explique este lançamento”, “gere carta de exigências”, “resuma a NFe”. /config – times, plano de contas, integrações (bancos, prefeituras, NF-e, WhatsApp), permissões. UI: Next.js + React Server Components, TanStack Table (edição in-row), Upload com Dropzone, shadcn/ui, Zod + react-hook-form, otimista com Server Actions. Onde a IA muda o jogo (diferente dos convencionais) Classificação automática de lançamentos a partir de anexos/extratos (few-shot + regras do tenant). Conciliação bancária smart: matching probabilístico (descrição, valor, data) com explicação e confiança. OCR + Leitura de XML/Nota: extrai campos, sugere contas contábeis, detecta exceções (CFOP estranho, CST incoerente). Agenda fiscal autônoma: gera obrigações por cliente/regime, calcula guias, dispara lembretes ao cliente. Busca semântica em documentos: “nota do fornecedor X de março com frete > R$ 500”. Explicabilidade: cada sugestão vem com “por que” (regra, exemplo similar, fonte). Copiloto contábil: comandos em linguagem natural: “apure o DAS do João MEI e gere o boleto”, “liste despesas que podem virar crédito de PIS/COFINS”. Detecção de risco: anomalias de lançamento, variações sazonais atípicas, CFOP/CST incompatíveis. BDD na prática (pacote inicial de cenários) Abaixo, Gherkin em PT-BR. Copie para features/*.feature. Cada feature ataca um uso crítico. 1) Classificação de lançamento por IA com validação humana Feature: Classificação assistida por IA de lançamentos Como contador Quero que a IA sugira a conta contábil e centro de custo Para acelerar o lançamento sem perder controle Background: Dado que pertenço ao tenant "Escritório Alfa" E que o plano de contas inclui "Despesas: Telefonia" Scenario: Sugestão aceita com confiança alta Dado que envio um recibo "Vivo Fatura 08-2025.pdf" de R$ 320,00 Quando a IA processa o documento Então deve sugerir "Despesas: Telefonia" com confiança >= 0.85 E o lançamento deve ficar em estado "Aguardando confirmação" Quando eu confirmo a sugestão Então o lançamento é gravado como "Despesas: Telefonia" Scenario: Confiança baixa dispara revisão obrigatória Dado um recibo "Compra Diversa.pdf" de R$ 97,00 Quando a IA processa o documento Então se a confiança < 0.6 o sistema marca "Revisão obrigatória" E exige seleção manual de conta antes de gravar 2) Conciliação bancária inteligente Feature: Conciliação bancária assistida Para manter a contabilidade alinhada ao extrato A IA propõe matches entre transações e lançamentos Scenario: Match automático com tolerância de data Dado uma transação bancária "Mercado ABC" de R$ 150,00 em 05/09/2025 E um lançamento "Compras Mercado ABC" de R$ 150,00 em 04/09/2025 Quando a IA calcula o match Então deve propor conciliação com confiança >= 0.9 considerando tolerância de ±2 dias E ao aceitar, ambos ficam marcados como "Conciliados" 3) Importação de XML de NFe e geração de lançamentos Feature: Importar NFe e gerar lançamentos Para evitar digitação manual e erros Scenario: XML válido gera lançamento e anexa documento Dado que importo o XML "NFe-552233.xml" Quando o sistema valida a assinatura e schema Então cria um lançamento com fornecedor, CFOP, CST e valores corretos E anexa o XML e o DANFE ao lançamento 4) Agenda fiscal e geração de guias Feature: Obrigações fiscais por cliente O sistema calcula prazos e guia a emitir Scenario: DAS para MEI com lembrete automático Dado o cliente "Padaria Sol" com regime MEI E período de apuração 08/2025 Quando fecho o mês do cliente Então o sistema calcula o DAS devido E gera tarefa "Emitir DAS 08/2025" com vencimento correto E envia lembrete ao cliente se faltarem documentos 5) Busca semântica de documentos Feature: Busca inteligente de documentos Para encontrar rapidamente notas e recibos Scenario: Consulta por fornecedor e mês Dado que existem documentos da "Vivo" em agosto de 2025 Quando pesquiso "notas vivo agosto 2025 com valor > 300" Então devo ver a lista de notas que atendem ao filtro E cada item deve permitir abrir o lançamento relacionado 6) Auditoria e explicabilidade Feature: Explicabilidade das sugestões de IA Para confiança e conformidade Scenario: Mostrar por que a IA sugeriu uma conta Dado um lançamento sugerido como "Despesas: Telefonia" Quando abro "Ver explicação" Então devo ver exemplos similares dos últimos 3 meses E as regras/indicadores (palavras-chave, CFOP, fornecedor) usados na decisão Definições de pronto (Definition of Ready) para nova feature Regra de negócio clara + exceções. Eventos de domínio definidos (ex.: DocumentoAnexado, LoteImportado, GuiaGerada). Cenários BDD criados (como acima). Métrica de sucesso (ex.: % de lançamentos auto-classificados com acurácia > X; tempo médio de conciliação). Definições de pronto (Definition of Done) Todos os cenários BDD passando no CI. Logs/telemetria: latência de OCR/IA, taxa de erros de importação. RLS validado com testes de segurança (usuário A não enxerga dados do tenant B). A11y básica e loading states.



Fase 0 — Setup vibe (1–2 dias)

Objetivo: criar um ambiente onde você “conversa” e o código aparece, sem virar bagunça.

Editor/stack: Next.js (App Router + Server Actions) + Supabase (Auth, Postgres, Storage, RLS). Garanta projeto limpo com ESLint/Prettier, tsconfig rígido, Zod no boundary. 
Next.js
+1

Prática de vibe coding: escreva briefs em linguagem natural (funcional + restrições), gere o esqueleto, revise como arquiteto e cubra com testes/BDD. Vibe ≠ mágica; é mudança de interface de programação. 
Google Cloud
+2
IBM
+2

CI/CD: Vercel para deploy de preview por PR, GitHub Actions para testes e lint.

Fase 1 — Núcleo de domínio + Multi-tenant (3–5 dias)

Objetivo: base imutável, segura e versionável.

Modelagem mínima viável: tenants, users, clients, accounts, entries, documents.

RLS sério: policies por tenant_id usando auth.uid()/claims; testes negativos (usuário A não vê B). RLS é pilar no Supabase; habilite e teste cedo. 
Supabase
+1

Ledger imutável: sem “editar lançamento”; faça ajustes. Constraint CHECK(debits = credits) por lote/período.

Fase 2 — Frontend esqueleto navegável (2–3 dias)

Objetivo: mapa de páginas clicável para validar fluxo.

/dashboard, /clientes, /lancamentos, /documentos, /fiscal, /bancos, /tarefas, /copiloto, /config.

Server Actions para mutações próximas da UI (criar cliente, anexar documento). Form Actions e revalidação. 
Next.js
+1

Storage com ACL: uploads versionados em buckets com policies alinhadas ao RLS. 
Supabase

Fase 3 — Integrações que destravam valor (1–2 semanas)

Open Finance (extratos)

Comece pelo consentimento OAuth2/FAPI → captura de transações → normalização. Evite scrapers; Open Finance no Brasil está maduro e com governança definida. 
Banco Central do Brasil
+1

Modele bank_accounts/bank_transactions com idempotência por bank_tx_id.
NFe/NFS-e

Pipeline: upload/import → validação de assinatura+schema → mapeamento para entries → anexos (XML+DANFE).

NFS-e nacional obrigatória em jan/2026: projete um adaptador (municipal hoje / nacional amanhã) para trocar endpoint sem reescrever. 
Serviços e Informações do Brasil
+2
Serviços e Informações do Brasil
+2

Fase 4 — IA que reduz cliques (1–2 semanas)

Objetivo: acelerar lançamentos sem “caixa-preta”.

Classificação de lançamentos (anexo/descrição → conta/centro de custo) com score de confiança e “por quê” (palavras-chave, CFOP/CST, similaridade).

Conciliação probabilística (descrição+valor+data com tolerância ±2 dias).

Copiloto contábil: prompts curtos e determinísticos (ex.: “Explique o lançamento X para leigo”); sempre registrar reason exibível.

Vibe coding escala isso: você descreve a regra → gera o matcher → cobre com BDD. Forte para solitário e low-headcount. 
Business Insider
+1

Fase 5 — BDD + Qualidade contínua (contínuo)

Objetivo: cada feature nasce com teste de aceitação.

Escreva ou adapte os cenários Gherkin que você já tem (classificação, conciliação, import NFe, agenda fiscal, busca semântica, explicabilidade).

No Next: e2e (Playwright) + unit/integration (Vitest/Testing Library).

PR só mergeia com todos os cenários passando no CI.

Fase 6 — Segurança, LGPD e Auditoria (3–5 dias)

Objetivo: produto “pronto para produção” e para fiscalização.

Papéis LGPD (Controlador/Operador/DPO), base legal explícita, registro de consentimentos, data minimization. Crie /auditoria (quem acessou o quê) e endpoint de export/erase por titular. 
Banco Central do Brasil

Logs/fraudes: trilhas por lançamento e acesso a documento.

Fase 7 — Observabilidade & Confiabilidade (2–3 dias)

Métricas: latência OCR/IA, taxa de erro de importação, % auto-classificados, tempo de conciliação.

Jobs longos: mover para Edge Functions/cron; Server Actions só para interações de baixa latência. 
Next.js

Backups + DR do Postgres e Storage.

Estrutura de repositório sugerida
apps/web/            # Next.js (App Router)
  app/               # rotas, RSC, Server Actions
  lib/               # db client, auth, utils
  components/        # UI (shadcn/ui)
  features/          # casos de uso (lancamentos, bancos, fiscal, etc.)
  tests/             # unit/integration
packages/domain/     # entidades, validadores, regras contábeis
packages/ai/         # prompts, chamadores de LLM, explained reasons
packages/adapters/   # open-finance, nfe/nfse (municipal/nacional), storage
packages/bdd/        # .feature + step definitions
infra/               # migrações SQL, seeds, scripts supabase

Roadmap de entrega (cru e eficiente)

Dia 1–2: repo, CI, Supabase conectado, RLS ligado, Auth pronto. 
Supabase

Dia 3–5: páginas base, Server Actions CRUD de clients/documents + upload com policy. 
Next.js
+1

Semana 2: import NFe/NFSe (validação + mapeamento) com idempotência; adapter preparando virada para padrão nacional. 
Serviços e Informações do Brasil
+1

Semana 3: Open Finance (consent → fetch transações → normalização); conciliação simples. 
Banco Central do Brasil

Semana 4: IA de classificação + explicabilidade; copiloto com comandos úteis. 
TechRadar

Semana 5: LGPD + auditoria + export/erase; hardening de policies e testes e2e. 
Banco Central do Brasil

Semana 6: métricas/observabilidade, DR, polishing de UX e lançamento beta.




Briefs (funcional + restrições)
0) Diretrizes globais

Stack: Next.js App Router + Server Actions para mutações perto da UI; jobs longos em functions. 
Next.js
+2
Next.js
+2

Dados: Postgres do Supabase com RLS habilitado em todas as tabelas expostas. Políticas por tenant_id. 
Supabase

Arquivos: Supabase Storage com policies mínimas para upload/overwrite; versionamento lógico. 
Supabase

Compliance BR: NFe (XML + assinatura/schema), NFS-e padrão nacional (virada obrigatória em jan/2026, preparar adaptador), Open Finance Brasil para extratos (consent FAPI/OAuth2), LGPD (papéis, base legal, direitos do titular). 
Serviços e Informações do Brasil
+5
MOC SPED
+5
Serviços e Informações do Brasil
+5

1) Autenticação & multi-tenant

Funcional: usuário entra, pertence a 1..N tenants; tudo que ele vê/edita é filtrado por tenant_id.
Restrições: RLS ativo; política “select/insert/update/delete where row.tenant_id = jwt.tenant_id”. Testes negativos (A não vê dados de B). Observação: auth.uid() ≠ tenant_id; use claim customizada ou tabela de vínculo. 
Supabase
+1

2) Documentos & Storage

Funcional: upload (XML, PDF, imagem), OCR opcional, vínculo a entries/clients; busca por metadados.
Restrições: policy mínima de INSERT em storage.objects no bucket do tenant; upsert exige SELECT/UPDATE. Guardar hash para idempotência. 
Supabase

3) NFe / NFS-e

Funcional: importar XML, validar assinatura e schema, mapear CFOP/CST, anexar DANFE/HTML; NFSe com driver municipal hoje e driver nacional amanhã.
Restrições: schemas oficiais; feature flag para “NFSe Nacional”. Atualizações por Reforma Tributária exigem manter tabelas/schemas em dia. 
MOC SPED
+1

Fato-chave: NFS-e nacional obrigatória a partir de jan/2026. 
Serviços e Informações do Brasil

4) Open Finance (extratos)

Funcional: fluxo de consentimento (escopos, expiração), coleta de contas/transações, normalização, idempotência por bank_tx_id.
Restrições: OAuth2/OIDC + FAPI; Consent API granular (escopos e dados). Evitar scrapers. 
openfinancebrasil.atlassian.net
+1

Atalho prático: provedores como Belvo aceleram (contas, transações, pagamentos, campos padronizados). 
developers.belvo.com
+2
developers.belvo.com
+2

5) Lançamentos (ledger imutável)

Funcional: criação de entries (débito/crédito), anexos, centros de custo; ajustes ao invés de edição direta.
Restrições: constraints de balanço por lote/período; idempotência nos importadores.

6) Conciliação bancária

Funcional: matching probabilístico (descrição+valor+data com tolerância), score e explicação; aceitação em massa.
Restrições: não conciliar sem confirmação se score < limiar; log de decisão.

7) Classificação por IA + explicabilidade

Funcional: sugerir conta/centro a partir de anexo/descrição; exibir “por quê” (palavras-chave, CFOP/CST, similaridade).
Restrições: thresholds (>=0.85 auto-sugere, <0.6 força revisão), registrar ai_insights auditável.

8) Agenda fiscal (ex.: DAS)

Funcional: gerar obrigações por cliente/regime, calcular valores, tarefas e lembretes.
Restrições: codificar regras de data e acomodar prorrogações oficiais; manter fonte única de calendários. (Apoiado por docs oficiais e comunicados recentes do portal NFe/Receita; trate prazos como dados versionados.) 
Nota Fiscal Eletrônica

9) LGPD & Auditoria

Funcional: registrar papéis (Controlador/Operador/DPO), base legal (“execução de contrato/obrigação legal”), export/erase por titular, trilha de acesso a docs.
Restrições: seguir guias ANPD e material de apoio; UI para consentimentos e relatórios de auditoria. 
Serviços e Informações do Brasil
+1

10) Observabilidade

Funcional: métricas (latência OCR/IA, % auto-classificados, tempo de conciliação), logs estruturados, retries.
Restrições: SLOs por job; alarms em falhas de importadores.

Esqueleto do sistema (pronto para colar)
Estrutura de pastas
contabilpro/
  apps/web/                 # Next.js (App Router)
    app/
      (dashboard)/page.tsx
      clientes/page.tsx
      lancamentos/page.tsx
      bancos/page.tsx
      fiscal/page.tsx
      documentos/page.tsx
      tarefas/page.tsx
      copiloto/page.tsx
      config/page.tsx
      api/open-finance/consents/route.ts   # webhooks/callbacks
    lib/
      db.ts                 # supabase server client
      auth.ts               # getUser + tenant claims
      rls.ts                # helpers de policies/claims
    actions/
      clients.ts            # Server Actions CRUD
      documents.ts          # upload + vínculo
      entries.ts            # criação/ajustes
      nfe.ts                # import/validate/map
      conciliation.ts       # matching
      ai.ts                 # classificação/explicabilidade
    components/             # UI (shadcn/ui)
    tests/                  # unit/integration/e2e
  packages/domain/          # entidades, validadores (zod)
  packages/adapters/
    openfinance/            # consent + fetch + normalização
    nfe/                    # validação XML + mapeamento
    nfse/                   # municipal + nacional (feature-flag)
  packages/ai/              # prompts, parsers, reasons
  packages/bdd/             # .feature + steps
  infra/
    migrations/             # SQL (DDL)
    policies/               # RLS/Storage SQL
    seeds/



BDD — features iniciais

packages/bdd/features/classificacao.feature

Funcionalidade: Classificação assistida de lançamentos
  Como contador, quero sugestões com explicação e confiança.

  Contexto:
    Dado que pertenço ao tenant "Alpha"
    E o plano de contas contém "Despesas: Telefonia"

  Cenário: Sugestão aceita (confiança alta)
    Dado que envio "Vivo-08-2025.pdf" de R$ 320,00
    Quando a IA processa o documento
    Então sugere "Despesas: Telefonia" com confiança >= 0.85
    E o lançamento fica "Aguardando confirmação"
    Quando confirmo
    Então grava como "Despesas: Telefonia"


packages/bdd/features/conciliacao.feature

Funcionalidade: Conciliação bancária inteligente
  Cenário: Match com tolerância de 2 dias
    Dado transação "Mercado ABC" R$150,00 em 05/09/2025
    E lançamento "Compras Mercado ABC" R$150,00 em 04/09/2025
    Quando calculo o match
    Então proponho conciliação com confiança >= 0.9


packages/bdd/features/nfe.feature

Funcionalidade: Importar NFe e gerar lançamentos
  Cenário: XML válido
    Dado que importo "NFe-552233.xml"
    Quando valido assinatura e schema
    Então crio lançamento com CFOP/CST/valores corretos
    E anexo XML e DANFE


packages/bdd/features/openfinance.feature

Funcionalidade: Consentimentos do Open Finance
  Cenário: Criar, autorizar e coletar transações
    Dado que crio um consentimento com escopos padrão
    Quando o usuário autoriza no AS
    Então recebo callback com status "AUTHORISED"
    E capturo transações sem duplicar por external_id


packages/bdd/features/lgpd.feature

Funcionalidade: LGPD - direitos do titular
  Cenário: Exportação de dados por cliente
    Dado o titular "João" solicita acesso
    Quando executo export
    Então entrego pacotes de dados em formato aberto










    Plano De Ataque

Kickoff (Dia 0): alinhar visão com stakeholders; definir KPIs (ex.: % auto-classificados, tempo conciliação); confirmar stack (Next.js App Router + Supabase) e governança (branching, PR review, convenções commit).
Infra Básica (Dia 1-3): gerar monorepo contabilpro/ (apps/web, packages/*, infra/); configurar ESLint/Prettier/tsconfig estrito; instalar shadcn/ui e TanStack; conectar Supabase (project, .env, db client).
Pipelines (Dia 2-4): GitHub Actions (install deps, lint, test, supabase migrations); CI com desdobramento em Vercel; preparar scripts pnpm lint/test/db:reset.
Modelagem & RLS (Dia 3-6): definir migrações SQL para tenants, users, clients, accounts, entries, documents; carregar seeds de exemplo; habilitar RLS e policies com tenant_id; testes negativos garantindo isolamento.
BDD & QA (Dia 4-6): adicionar cenários Gherkin iniciais em packages/bdd/features; configurar step definitions (Playwright + Vitest); rodar pipeline para garantir green.
Esqueleto Frontend (Dia 6-8): criar rotas Next (/dashboard, /clientes, etc.) com layout base, loading/skeletons, auth guard; configurar Server Actions e Supabase auth (tenant claim).
CRUD Inicial (Dia 8-12): implementar ações e UI de tenants/clients/documents; upload para Supabase Storage com policies; Zod + react-hook-form; testes de integração.
Ledger & Lançamentos (Dia 10-14): criar domínio em packages/domain (entries imutáveis, ajustes, checks de débito=crédito); Server Actions para criação/importação manual; logging básico.
Importador NFe (Semana 3): desenvolver adapter packages/adapters/nfe: validação assinatura/schema, parse CFOP/CST, geração de lançamentos e anexos; cobrir BDD “XML válido”.
Open Finance MVP (Semana 3-4): estruturar adapter consent/transações (mock ou provider externo); normalizar bank_transactions, idempotência; implementar conciliação com score inicial e aceitação manual.
IA Classificação (Semana 4-5): montar packages/ai (prompt templates, parser, scoring); integrar com lançamentos (limiares 0.85/0.6); UI de explicabilidade; logs em ai_insights.
Agenda Fiscal (Semana 5): modelar tax_obligations e regras de cálculo (DAS MEI MVP); gerar tarefas e lembretes; cenários BDD correspondentes.
LGPD & Auditoria (Semana 5-6): implementar trilhas de acesso, export/erase pipelines, gerenciamento de consentimentos; revisar policies Storage/Postgres; checklist ANPD.
Observabilidade & Hardening (Semana 6): instrumentar métricas (latência OCR/IA, conciliação); configurar alertas; revisão RLS com testes fuzz; preparar backups/DR Supabase.
Beta Prep (Semana 7): usability pass, docs internas (readme, runbooks), set de dados demo; planejar onboarding contadores piloto e roadmap pós-beta.