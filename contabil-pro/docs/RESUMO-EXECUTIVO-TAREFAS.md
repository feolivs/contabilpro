# 📊 Resumo Executivo: Tarefas e Timeline

**Data:** 02/10/2025  
**Documentos Relacionados:**
- `ANALISE-TAREFAS-TIMELINE.md` - Análise completa e detalhada
- `EXEMPLOS-CODIGO-TAREFAS.md` - Exemplos de código

---

## 🎯 VISÃO GERAL

Implementação de **gestão de tarefas** e **timeline de atividades** para o ContabilPRO, focado em **usuário único** (contador trabalhando sozinho).

### Três Funcionalidades Principais

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  1️⃣  TAREFAS DO CLIENTE                                     │
│      Seção na página /clientes/[id]                         │
│      Similar à seção de documentos                          │
│                                                              │
│  2️⃣  PÁGINA DE TAREFAS                                      │
│      Visão geral em /tarefas                                │
│      Todas as tarefas de todos os clientes                  │
│                                                              │
│  3️⃣  TIMELINE DO CLIENTE                                    │
│      Histórico de atividades na página /clientes/[id]       │
│      Documentos, tarefas, lançamentos                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 1. TAREFAS DO CLIENTE

### Localização
- **Página:** `/clientes/[id]`
- **Posição:** Após seção de documentos
- **Componente:** `ClientTasksSection`

### Features Principais
✅ Tabs por status (Todas, Pendentes, Em Andamento, Concluídas)  
✅ Cards visuais com prioridade e prazo  
✅ Ações rápidas (Iniciar, Concluir, Editar)  
✅ Botão "Nova Tarefa" com client_id pré-preenchido  
✅ Indicadores visuais de urgência  

### Informações Exibidas
```
┌────────────────────────────────────────────────────────┐
│ 🔴 URGENTE  Calcular DAS de Setembro                   │
│             Vence em 2 dias • 05/10/2025               │
│             [Iniciar] [Editar] [⋮]                     │
└────────────────────────────────────────────────────────┘
```

**Campos:**
- Prioridade (badge colorido)
- Título da tarefa
- Descrição (truncada)
- Data de vencimento
- Dias até vencer
- Status atual
- Ações disponíveis

### Cores de Prioridade
- 🔴 **Urgente** - Vermelho
- 🟠 **Alta** - Laranja
- 🟡 **Média** - Amarelo
- 🟢 **Baixa** - Verde

### Indicadores de Prazo
- **Atrasada** - Vermelho + ícone de alerta
- **Hoje** - Vermelho + ícone de alerta
- **1-2 dias** - Laranja + ícone de relógio
- **3-7 dias** - Amarelo + ícone de relógio
- **> 7 dias** - Cinza + data formatada

---

## 📋 2. PÁGINA DE TAREFAS

### Localização
- **Rota:** `/tarefas`
- **Sidebar:** Grupo "Operações"

### Layout Proposto

```
┌─────────────────────────────────────────────────────────────┐
│ Tarefas                                                      │
│ [Filtros ▼] [Ordenar ▼]                      [Nova Tarefa] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 📊 RESUMO                                                    │
│ ┌──────────┬──────────┬──────────┬──────────┐              │
│ │ Pendentes│ Em Andam.│Concluídas│ Atrasadas│              │
│ │    12    │     5    │    23    │     3    │              │
│ └──────────┴──────────┴──────────┴──────────┘              │
│                                                              │
│ [Todas] [Pendentes] [Em Andamento] [Concluídas]            │
│                                                              │
│ Lista de tarefas...                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Componentes

**1. TasksStats** - 4 KPIs
- Pendentes
- Em Andamento
- Concluídas
- Atrasadas

**2. TasksList** - Lista com tabs
- Filtro por status
- Cards de tarefa
- Paginação

**3. TaskFilters** - Filtros avançados
- Cliente
- Status
- Prioridade
- Prazo
- Busca textual

**4. TaskDialog** - Criar/Editar
- Formulário completo
- Validação Zod

### Filtros Disponíveis

```typescript
interface TaskFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  client_id?: string;
  due_date_from?: Date;
  due_date_to?: Date;
  overdue?: boolean;
  search?: string;
}
```

### Ordenação Padrão
1. **Prioridade** (urgent → high → medium → low)
2. **Data de vencimento** (mais próximo primeiro)
3. **Data de criação** (mais recente primeiro)

---

## 📋 3. TIMELINE DO CLIENTE

### Localização
- **Página:** `/clientes/[id]`
- **Posição:** Após tarefas
- **Componente:** `ClientTimelineSection`

### Layout Proposto

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Timeline de Atividades                                   │
│ [Todas] [Documentos] [Tarefas] [Lançamentos]               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 📄 02/10/2025 17:32                                         │
│    Documento adicionado                                     │
│    Recibo de Pagamento 202410.pdf                           │
│    por Você                                                 │
│                                                              │
│ ✅ 02/10/2025 14:15                                         │
│    Tarefa concluída                                         │
│    Calcular DAS de Setembro                                 │
│    por Você                                                 │
│                                                              │
│ 💰 01/10/2025 09:00                                         │
│    Lançamento registrado                                    │
│    Pagamento de fornecedor - R$ 1.500,00                    │
│    por Você                                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tipos de Eventos

| Tipo | Ícone | Cor | Descrição |
|------|-------|-----|-----------|
| `document_uploaded` | 📄 | Azul | Documento adicionado |
| `document_deleted` | 🗑️ | Vermelho | Documento removido |
| `task_created` | 📋 | Verde | Tarefa criada |
| `task_started` | ▶️ | Amarelo | Tarefa iniciada |
| `task_completed` | ✅ | Verde | Tarefa concluída |
| `task_cancelled` | ❌ | Vermelho | Tarefa cancelada |
| `entry_created` | 💰 | Roxo | Lançamento criado |
| `entry_updated` | ✏️ | Laranja | Lançamento editado |
| `client_updated` | 👤 | Azul | Cliente atualizado |

### Implementação

**Opção 1: Tabela Dedicada (Recomendado)**
```sql
CREATE TABLE client_timeline (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB,
  user_id UUID NOT NULL,
  created_at TIMESTAMP
);
```

**Opção 2: View Agregada**
- Agrega eventos de múltiplas tabelas
- Mais complexo, mas sem duplicação de dados

### Registro Automático

**Triggers SQL:**
- Documentos → `log_document_timeline()`
- Tarefas → `log_task_timeline()`
- Lançamentos → `log_entry_timeline()`

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Modificações Necessárias

**1. Adicionar client_id em tasks**
```sql
ALTER TABLE tasks ADD COLUMN client_id UUID REFERENCES clients(id);
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
```

**2. Criar tabela client_timeline**
```sql
CREATE TABLE client_timeline (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB,
  document_id UUID,
  task_id UUID,
  entry_id UUID,
  user_id UUID NOT NULL,
  created_at TIMESTAMP
);
```

**3. Criar triggers de auditoria**
- Trigger para documentos
- Trigger para tarefas
- Trigger para lançamentos

### Políticas RLS

**Tasks:**
- ✅ SELECT: Todos do tenant
- ✅ INSERT: Todos do tenant
- ✅ UPDATE: Atribuído ou criador
- ✅ DELETE: Criador ou managers

**Timeline:**
- ✅ SELECT: Todos do tenant
- ✅ INSERT: Sistema (via triggers)

---

## 💻 ARQUITETURA TÉCNICA

### Camadas da Aplicação

```
┌─────────────────────────────────────────────────────────────┐
│                         UI LAYER                             │
│  Components: TaskCard, TaskDialog, ClientTasksSection       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      HOOKS LAYER                             │
│  React Query: useTasks, useCreateTask, useTimeline          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   SERVER ACTIONS LAYER                       │
│  Actions: getTasks, createTask, updateTask, getTimeline     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                           │
│  Supabase: tasks, client_timeline + RLS policies            │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

**Criar Tarefa:**
```
UI (TaskDialog)
  → useCreateTask()
    → createTask() [Server Action]
      → Supabase INSERT
        → RLS valida tenant_id
          → Trigger registra timeline
            → React Query invalida cache
              → UI atualiza
```

**Listar Tarefas:**
```
UI (ClientTasksSection)
  → useTasks({ client_id })
    → getTasks() [Server Action]
      → Supabase SELECT com filtros
        → RLS filtra por tenant_id
          → React Query cacheia
            → UI renderiza
```

---

## 📦 ARQUIVOS A CRIAR/MODIFICAR

### Migrations (3 arquivos)
- `023_add_tasks_client_id.sql`
- `024_create_client_timeline.sql`
- `025_create_timeline_triggers.sql`

### Types (2 arquivos)
- `src/types/tasks.ts`
- `src/types/timeline.ts`

### Schemas (1 arquivo)
- `src/schemas/task.schema.ts`

### Actions (2 arquivos)
- `src/actions/tasks.ts` (~400 linhas)
- `src/actions/timeline.ts` (~100 linhas)

### Hooks (2 arquivos)
- `src/hooks/use-tasks.ts` (~150 linhas)
- `src/hooks/use-timeline.ts` (~50 linhas)

### Components - Tarefas (5 arquivos)
- `src/components/tasks/task-card.tsx`
- `src/components/tasks/task-dialog.tsx`
- `src/components/tasks/tasks-list.tsx`
- `src/components/tasks/tasks-stats.tsx`
- `src/components/tasks/task-filters.tsx`

### Components - Cliente (2 arquivos)
- `src/components/clients/client-tasks-section.tsx`
- `src/components/clients/client-timeline-section.tsx`

### Components - Timeline (1 arquivo)
- `src/components/timeline/timeline-event.tsx`

### Pages (2 arquivos)
- `src/app/(app)/tarefas/page.tsx` (reescrever)
- `src/app/(app)/clientes/[id]/page.tsx` (modificar)

**Total:** ~20 arquivos

---

## ⏱️ ESTIMATIVA DE TEMPO

### Por Fase

| Fase | Descrição | Tempo | Prioridade |
|------|-----------|-------|------------|
| 1 | Infraestrutura (DB + Types) | 2-3h | 🔴 Alta |
| 2 | Server Actions + Hooks | 3-4h | 🔴 Alta |
| 3 | Tarefas do Cliente | 3-4h | 🟠 Média |
| 4 | Página de Tarefas | 4-5h | 🟡 Baixa |
| 5 | Timeline | 2-3h | 🟢 Opcional |
| 6 | Polimento | 2-3h | 🟢 Opcional |

**Total:** 16-22 horas (~3-4 dias)

### Ordem Recomendada

1. **FASE 1** - Infraestrutura (obrigatória)
2. **FASE 2 + 3** - Tarefas do Cliente (mais útil)
3. **FASE 4** - Página de Tarefas (complementar)
4. **FASE 5** - Timeline (nice to have)
5. **FASE 6** - Polimento (quando tiver tempo)

---

## 🎯 SIMPLIFICAÇÕES PARA USUÁRIO ÚNICO

### O que REMOVER

❌ **Atribuição de tarefas**
- Campo `assigned_to` sempre será o próprio usuário
- Remove seletor de usuário da UI
- Simplifica lógica

❌ **Notificações complexas**
- Sem push notifications
- Apenas email diário simples
- Badge na sidebar

❌ **Permissões granulares**
- Usuário único tem acesso total
- RLS apenas por tenant_id

### O que MANTER

✅ **Prioridades** (urgent, high, medium, low)  
✅ **Status** (pending, in_progress, completed, cancelled)  
✅ **Tipos** (das, report, review, meeting, other)  
✅ **Vinculação com cliente**  
✅ **Timeline de atividades**  

---

## ✅ CRITÉRIOS DE SUCESSO

### Funcional
- [ ] Usuário cria tarefa vinculada ao cliente
- [ ] Usuário vê tarefas do cliente na página dele
- [ ] Usuário filtra tarefas por status
- [ ] Usuário inicia/conclui tarefa com 1 clique
- [ ] Usuário vê todas as tarefas em /tarefas
- [ ] Usuário filtra tarefas por cliente/prazo/prioridade
- [ ] Timeline registra eventos automaticamente
- [ ] Timeline exibe eventos em ordem cronológica

### Performance
- [ ] Carregamento < 1s
- [ ] Filtros instantâneos (client-side)
- [ ] Paginação funcional

### UX
- [ ] Indicadores visuais claros
- [ ] Ações rápidas acessíveis
- [ ] Empty states informativos
- [ ] Loading states suaves
- [ ] Feedback em todas as ações

---

## 🚀 PRÓXIMOS PASSOS

### Imediatos
1. ✅ Revisar esta análise
2. ✅ Aprovar escopo e prioridades
3. ✅ Iniciar FASE 1 (Infraestrutura)

### Após Implementação
- Coletar feedback do usuário
- Ajustar prioridades e filtros
- Considerar features avançadas:
  - Kanban board
  - Calendário de tarefas
  - Notificações por email
  - Recorrência de tarefas
  - Templates de tarefas

---

## 📚 REFERÊNCIAS

### Documentos
- `ANALISE-TAREFAS-TIMELINE.md` - Análise completa
- `EXEMPLOS-CODIGO-TAREFAS.md` - Exemplos de código
- `PLANO-INTEGRACAO-DOCUMENTOS-CLIENTES.md` - Padrão similar

### Componentes Existentes
- `ClientDocumentsSection` - Padrão de seção
- `DocumentsTable` - Padrão de tabela
- `PriorityTasksPanel` - Componente de tarefas (mock)

### Tecnologias
- Next.js 14 (App Router + Server Actions)
- Supabase (Postgres + RLS)
- React Query (Cache + Sincronização)
- shadcn/ui (Componentes)
- Zod (Validação)

---

**FIM DO RESUMO EXECUTIVO** ✅


