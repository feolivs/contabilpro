# 📚 Documentação ContabilPRO

Bem-vindo à documentação do ContabilPRO! Este índice organiza toda a documentação do projeto.

---

## 🚀 Início Rápido

- [**Setup e Instalação**](guides/setup-fases.md) - Guia completo de configuração
- [**Login Implementation**](guides/login-implementation.md) - Implementação de autenticação
- [**Executive Summary**](EXECUTIVE_SUMMARY.md) - Visão geral do projeto

---

## 📦 Componentes e Arquitetura

### Reorganização
- [**Reorganização de Componentes**](guides/REORGANIZACAO-COMPONENTES.md) - Estrutura modular
- [**Guia de Migração de Imports**](guides/MIGRATION-GUIDE-IMPORTS.md) - Como atualizar imports

### Dashboard
- [**Dashboard Redesign**](dashboard/DASHBOARD_REDESIGN.md) - Nova arquitetura do dashboard
- [**Dashboard Visual Guide**](dashboard/DASHBOARD_VISUAL_GUIDE.md) - Guia visual

### KPIs
- [**KPI Spec Implementation**](kpi/KPI_SPEC_IMPLEMENTATION.md) - Especificação de KPIs
- [**KPI Solution Flexbox**](kpi/KPI_SOLUTION_FLEXBOX.md) - Solução de layout
- [**KPI Final Fix**](kpi/KPI_FINAL_FIX.md) - Correções finais
- [**KPI Fixes**](kpi/KPI_FIXES.md) - Histórico de correções
- [**KPI QA Checklist**](kpi/KPI_QA_CHECKLIST.md) - Checklist de qualidade

---

## 🔧 Parafusos (Melhorias Técnicas)

- [**Parafusos Implementados**](parafusos/PARAFUSOS-IMPLEMENTADOS.md) - Lista de melhorias
- [**README Parafusos**](parafusos/README-PARAFUSOS.md) - Guia de uso

---

## 📖 ADRs (Architecture Decision Records)

- [**001 - Parametrizar Tenant ID em RPCs**](adr/001-parametrizar-tenant-id-rpcs.md)
- [**002 - Server Actions Hygiene**](adr/002-server-actions-hygiene.md)
- [**003 - Contrato Canônico Server Actions Dashboard**](adr/003-contrato-canonico-server-actions-dashboard.md)

---

## 📝 Convenções

- [**Folder Naming**](conventions/folder-naming.md) - Convenções de nomenclatura

---

## 🔍 Runbooks (Guias Operacionais)

- [**Dashboard Health Check**](runbooks/dashboard-health-check.md) - Verificação de saúde
- [**Dashboard Validation**](runbooks/dashboard-validation.md) - Validação de dados
- [**Server Actions Troubleshooting**](runbooks/server-actions-troubleshooting.md) - Resolução de problemas

---

## 📋 Tasks e Sprints

### Épicos
- [**EPIC 9 - Ações de Cliente**](tasks/EPIC-9-ACOES-CLIENTE.md)
- [**Epic 2 - Command Palette**](tasks/epic-2-command-palette.md)
- [**Epic 3 - Modal Multi-Step**](tasks/epic-3-modal-multi-step.md)
- [**Epic 4 - Tabela Avançada**](tasks/epic-4-tabela-avancada.md)
- [**Epic 5 - Mini KPIs**](tasks/epic-5-mini-kpis.md)

### Sprints
- [**Sprint 2 Completo**](tasks/SPRINT-2-COMPLETO.md)
- [**Resumo de Implementação**](tasks/RESUMO-IMPLEMENTACAO.md)

### Tasks Individuais
- [**Task 1.1 - Validadores CPF/CNPJ**](tasks/task-1.1-validadores-cpf-cnpj.md)
- [**Task 1.2 - Atualizar Schema Zod**](tasks/task-1.2-atualizar-schema-zod.md)

---

## 🧠 Sistema e Entendimento

- [**Sistema**](sistema-entendimento/sistema.md) - Visão geral do sistema
- [**Sistema Contábil**](sistema-entendimento/sistemacontabil.md) - Detalhes contábeis
- [**Kanban TODO**](sistema-entendimento/kanban-todo.md) - Tarefas pendentes
- [**Próximas Ações**](sistema-entendimento/proximas-ações.md) - Roadmap

---

## 🛡️ Qualidade e Segurança

- [**Blindagem Anti-Regressão**](BLINDAGEM-ANTI-REGRESSAO.md) - Estratégias de prevenção

---

## 📂 Estrutura de Pastas

```
docs/
├── README.md                    # Este arquivo (índice principal)
├── adr/                         # Architecture Decision Records
├── conventions/                 # Convenções de código
├── dashboard/                   # Documentação do dashboard
├── guides/                      # Guias e tutoriais
├── kpi/                         # Documentação de KPIs
├── parafusos/                   # Melhorias técnicas
├── runbooks/                    # Guias operacionais
├── sistema-entendimento/        # Visão geral do sistema
└── tasks/                       # Tasks, épicos e sprints
```

---

## 🔄 Atualizações Recentes

### 2025-09-30
- ✅ Reorganização completa de componentes
- ✅ Consolidação de actions duplicadas
- ✅ Reestruturação de `lib/` com módulos
- ✅ Organização da documentação em pastas

---

## 🤝 Contribuindo

Ao adicionar nova documentação:

1. Coloque na pasta apropriada
2. Atualize este README.md
3. Use formato Markdown
4. Inclua data de criação/atualização
5. Adicione links relevantes

---

## 📞 Suporte

Para dúvidas sobre a documentação:
- Verifique os runbooks para problemas comuns
- Consulte os ADRs para decisões arquiteturais
- Revise os guias para tutoriais passo a passo

---

**Última atualização:** 2025-09-30  
**Mantido por:** Equipe ContabilPRO

