# 📁 Estrutura de Arquivos: Tarefas e Timeline

**Mapa completo de arquivos a criar/modificar**

---

## 🗂️ VISÃO GERAL

```
contabil-pro/
├── infra/
│   └── migrations/              # 3 novos arquivos
├── src/
│   ├── types/                   # 2 novos arquivos
│   ├── schemas/                 # 1 novo arquivo
│   ├── actions/                 # 2 novos arquivos
│   ├── hooks/                   # 2 novos arquivos
│   ├── components/
│   │   ├── tasks/               # 5 novos arquivos
│   │   ├── clients/             # 2 novos arquivos
│   │   └── timeline/            # 1 novo arquivo
│   └── app/
│       └── (app)/
│           ├── tarefas/         # 1 arquivo modificado
│           └── clientes/[id]/   # 1 arquivo modificado
└── docs/                        # 6 novos arquivos (análise)
```

**Total de Arquivos:**
- ✨ Novos: 19 arquivos
- ✏️ Modificados: 2 arquivos
- 📚 Documentação: 6 arquivos

---

## 📋 1. INFRAESTRUTURA (infra/)

### 1.1 Migrations SQL

```
infra/migrations/
├── 023_add_tasks_client_id.sql          ✨ NOVO
├── 024_create_client_timeline.sql       ✨ NOVO
└── 025_create_timeline_triggers.sql     ✨ NOVO
```

#### 023_add_tasks_client_id.sql
**Propósito:** Adicionar coluna client_id na tabela tasks  
**Conteúdo:**
- ALTER TABLE tasks ADD COLUMN client_id
- CREATE INDEX idx_tasks_client_id
- COMMENT ON COLUMN

**Linhas:** ~10  
**Tempo:** 15 min  

---

#### 024_create_client_timeline.sql
**Propósito:** Criar tabela de timeline de atividades  
**Conteúdo:**
- CREATE TABLE client_timeline
- CREATE INDEX (4 índices)
- ALTER TABLE ENABLE ROW LEVEL SECURITY
- CREATE POLICY (2 políticas)
- COMMENT ON TABLE/COLUMNS

**Linhas:** ~60  
**Tempo:** 30 min  

---

#### 025_create_timeline_triggers.sql
**Propósito:** Criar triggers para registro automático  
**Conteúdo:**
- CREATE FUNCTION log_document_timeline()
- CREATE TRIGGER document_timeline_trigger
- CREATE FUNCTION log_task_timeline()
- CREATE TRIGGER task_timeline_trigger
- CREATE FUNCTION log_entry_timeline()
- CREATE TRIGGER entry_timeline_trigger

**Linhas:** ~120  
**Tempo:** 45 min  

---

## 📋 2. TYPES (src/types/)

```
src/types/
├── tasks.ts                             ✨ NOVO
└── timeline.ts                          ✨ NOVO
```

#### tasks.ts
**Propósito:** Tipos TypeScript para tarefas  
**Conteúdo:**
```typescript
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'reminder' | 'tax_obligation' | 'document_review' | ...;

export interface Task {
  id: string;
  tenant_id: string;
  client_id?: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  assigned_to?: string;
  created_by: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  client?: { id: string; name: string };
  assigned_user?: { id: string; name: string };
  created_user?: { id: string; name: string };
}

export interface TaskFilters { ... }
export interface CreateTaskInput { ... }
export interface UpdateTaskInput { ... }
```

**Linhas:** ~80  
**Tempo:** 20 min  

---

#### timeline.ts
**Propósito:** Tipos TypeScript para timeline  
**Conteúdo:**
```typescript
export type TimelineEventType = 
  | 'document_uploaded'
  | 'document_deleted'
  | 'task_created'
  | 'task_started'
  | 'task_completed'
  | 'task_cancelled'
  | 'entry_created'
  | 'entry_updated'
  | 'client_updated';

export interface TimelineEvent {
  id: string;
  tenant_id: string;
  client_id: string;
  event_type: TimelineEventType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  document_id?: string;
  task_id?: string;
  entry_id?: string;
  user_id: string;
  created_at: string;
  // Relacionamentos
  user?: { id: string; name: string };
}

export interface TimelineFilters { ... }
```

**Linhas:** ~60  
**Tempo:** 15 min  

---

## 📋 3. SCHEMAS (src/schemas/)

```
src/schemas/
└── task.schema.ts                       ✨ NOVO
```

#### task.schema.ts
**Propósito:** Validação Zod para tarefas  
**Conteúdo:**
```typescript
import { z } from 'zod';

export const taskStatusSchema = z.enum([...]);
export const taskPrioritySchema = z.enum([...]);
export const taskTypeSchema = z.enum([...]);

export const baseTaskSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  type: taskTypeSchema,
  priority: taskPrioritySchema.default('medium'),
  status: taskStatusSchema.default('pending'),
  due_date: z.string().datetime().optional(),
  client_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
});

export const createTaskSchema = baseTaskSchema;
export const updateTaskSchema = baseTaskSchema.partial().extend({ ... });
export const taskFiltersSchema = z.object({ ... });

export type TaskStatus = z.infer<typeof taskStatusSchema>;
// ... outros tipos inferidos
```

**Linhas:** ~100  
**Tempo:** 30 min  

---

## 📋 4. ACTIONS (src/actions/)

```
src/actions/
├── tasks.ts                             ✨ NOVO
└── timeline.ts                          ✨ NOVO
```

#### tasks.ts
**Propósito:** Server Actions para tarefas  
**Conteúdo:**
```typescript
'use server';

export async function getTasks(filters) { ... }
export async function getTaskById(id) { ... }
export async function createTask(input) { ... }
export async function updateTask(input) { ... }
export async function deleteTask(id) { ... }
export async function updateTaskStatus(id, status) { ... }
export async function getTasksStats() { ... }
```

**Funções:** 7  
**Linhas:** ~400  
**Tempo:** 2 horas  

---

#### timeline.ts
**Propósito:** Server Actions para timeline  
**Conteúdo:**
```typescript
'use server';

export async function getClientTimeline(filters) { ... }
export async function logTimelineEvent(input) { ... } // opcional
```

**Funções:** 2  
**Linhas:** ~100  
**Tempo:** 30 min  

---

## 📋 5. HOOKS (src/hooks/)

```
src/hooks/
├── use-tasks.ts                         ✨ NOVO
└── use-timeline.ts                      ✨ NOVO
```

#### use-tasks.ts
**Propósito:** React Query hooks para tarefas  
**Conteúdo:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const taskKeys = { ... };

export function useTasks(filters) { ... }
export function useTask(id) { ... }
export function useTasksStats() { ... }
export function useCreateTask() { ... }
export function useUpdateTask() { ... }
export function useDeleteTask() { ... }
export function useUpdateTaskStatus() { ... }
```

**Hooks:** 7  
**Linhas:** ~200  
**Tempo:** 1 hora  

---

#### use-timeline.ts
**Propósito:** React Query hooks para timeline  
**Conteúdo:**
```typescript
import { useQuery } from '@tanstack/react-query';

export const timelineKeys = { ... };

export function useClientTimeline(filters) { ... }
```

**Hooks:** 1  
**Linhas:** ~50  
**Tempo:** 15 min  

---

## 📋 6. COMPONENTES - TAREFAS (src/components/tasks/)

```
src/components/tasks/
├── task-card.tsx                        ✨ NOVO
├── task-dialog.tsx                      ✨ NOVO
├── tasks-list.tsx                       ✨ NOVO
├── tasks-stats.tsx                      ✨ NOVO
└── task-filters.tsx                     ✨ NOVO
```

#### task-card.tsx
**Propósito:** Card visual de tarefa  
**Props:** task, onStart, onComplete, onEdit, showClient  
**Features:**
- Badges de prioridade e status
- Indicador de prazo com cores
- Botões de ação
- Responsivo

**Linhas:** ~150  
**Tempo:** 1 hora  

---

#### task-dialog.tsx
**Propósito:** Dialog para criar/editar tarefa  
**Props:** open, onOpenChange, task?, clientId?  
**Features:**
- Formulário com react-hook-form
- Validação Zod
- Modo criar/editar
- Loading states

**Linhas:** ~200  
**Tempo:** 1.5 horas  

---

#### tasks-list.tsx
**Propósito:** Lista de tarefas com tabs  
**Props:** tasks, filters, onFilterChange  
**Features:**
- Tabs por status
- Badges com contadores
- Paginação
- Empty states

**Linhas:** ~180  
**Tempo:** 1 hora  

---

#### tasks-stats.tsx
**Propósito:** Cards de estatísticas  
**Props:** stats  
**Features:**
- 4 KPIs
- Ícones e cores
- Loading skeleton

**Linhas:** ~100  
**Tempo:** 30 min  

---

#### task-filters.tsx
**Propósito:** Filtros avançados  
**Props:** filters, onFiltersChange  
**Features:**
- Filtro por cliente
- Filtro por status/prioridade
- Filtro por prazo
- Busca textual

**Linhas:** ~150  
**Tempo:** 1 hora  

---

## 📋 7. COMPONENTES - CLIENTE (src/components/clients/)

```
src/components/clients/
├── client-tasks-section.tsx             ✨ NOVO
└── client-timeline-section.tsx          ✨ NOVO
```

#### client-tasks-section.tsx
**Propósito:** Seção de tarefas na página do cliente  
**Props:** clientId, clientName  
**Features:**
- useTasks com filtro client_id
- Tabs por status
- Lista de TaskCards
- Botão "Nova Tarefa"
- Empty/Loading/Error states

**Linhas:** ~250  
**Tempo:** 2 horas  

---

#### client-timeline-section.tsx
**Propósito:** Seção de timeline na página do cliente  
**Props:** clientId  
**Features:**
- useClientTimeline hook
- Tabs por tipo de evento
- Lista de TimelineEvents
- Paginação
- Empty/Loading states

**Linhas:** ~200  
**Tempo:** 1.5 horas  

---

## 📋 8. COMPONENTES - TIMELINE (src/components/timeline/)

```
src/components/timeline/
└── timeline-event.tsx                   ✨ NOVO
```

#### timeline-event.tsx
**Propósito:** Card de evento da timeline  
**Props:** event  
**Features:**
- Ícone por tipo
- Cor por tipo
- Timestamp formatado
- Link para recurso

**Linhas:** ~120  
**Tempo:** 45 min  

---

## 📋 9. PÁGINAS (src/app/(app)/)

```
src/app/(app)/
├── tarefas/
│   └── page.tsx                         ✏️ MODIFICAR
└── clientes/[id]/
    └── page.tsx                         ✏️ MODIFICAR
```

#### tarefas/page.tsx
**Propósito:** Página principal de tarefas  
**Modificação:** Reescrever completamente  
**Conteúdo:**
```typescript
export default function TasksPage() {
  return (
    <div>
      <TasksStats />
      <TaskFilters />
      <TasksList />
      <TaskDialog />
    </div>
  );
}
```

**Linhas:** ~150  
**Tempo:** 1 hora  

---

#### clientes/[id]/page.tsx
**Propósito:** Página de detalhes do cliente  
**Modificação:** Adicionar seções de tarefas e timeline  
**Conteúdo:**
```typescript
export default function ClientPage({ params }) {
  return (
    <div>
      {/* ... conteúdo existente ... */}
      <ClientDocumentsSection /> {/* já existe */}
      <ClientTasksSection />     {/* ADICIONAR */}
      <ClientTimelineSection />  {/* ADICIONAR */}
    </div>
  );
}
```

**Linhas Adicionadas:** ~20  
**Tempo:** 15 min  

---

## 📋 10. DOCUMENTAÇÃO (docs/)

```
docs/
├── RESUMO-EXECUTIVO-TAREFAS.md          ✅ CRIADO
├── ANALISE-TAREFAS-TIMELINE.md          ✅ CRIADO
├── EXEMPLOS-CODIGO-TAREFAS.md           ✅ CRIADO
├── DIAGRAMAS-FLUXOS-TAREFAS.md          ✅ CRIADO
├── CHECKLIST-IMPLEMENTACAO-TAREFAS.md   ✅ CRIADO
├── INDICE-DOCUMENTACAO-TAREFAS.md       ✅ CRIADO
└── ESTRUTURA-ARQUIVOS-TAREFAS.md        ✅ CRIADO (este arquivo)
```

---

## 📊 RESUMO ESTATÍSTICO

### Por Categoria

| Categoria | Novos | Modificados | Total | Linhas | Tempo |
|-----------|-------|-------------|-------|--------|-------|
| Migrations | 3 | 0 | 3 | ~190 | 1.5h |
| Types | 2 | 0 | 2 | ~140 | 35min |
| Schemas | 1 | 0 | 1 | ~100 | 30min |
| Actions | 2 | 0 | 2 | ~500 | 2.5h |
| Hooks | 2 | 0 | 2 | ~250 | 1.25h |
| Componentes | 8 | 0 | 8 | ~1350 | 8.25h |
| Páginas | 0 | 2 | 2 | ~170 | 1.25h |
| Docs | 7 | 0 | 7 | ~3000 | - |
| **TOTAL** | **25** | **2** | **27** | **~5700** | **~16h** |

### Por Prioridade

**Alta Prioridade (MVP):**
- Migrations: 3 arquivos
- Types: 2 arquivos
- Schemas: 1 arquivo
- Actions: 2 arquivos
- Hooks: 2 arquivos
- ClientTasksSection: 1 arquivo
- TaskCard: 1 arquivo
- TaskDialog: 1 arquivo

**Média Prioridade:**
- Página de Tarefas: 1 arquivo
- TasksList: 1 arquivo
- TasksStats: 1 arquivo
- TaskFilters: 1 arquivo

**Baixa Prioridade:**
- Timeline: 3 arquivos

---

## 🎯 ORDEM DE CRIAÇÃO RECOMENDADA

### FASE 1: Fundação (2-3h)
1. `infra/migrations/023_add_tasks_client_id.sql`
2. `infra/migrations/024_create_client_timeline.sql`
3. `infra/migrations/025_create_timeline_triggers.sql`
4. `src/types/tasks.ts`
5. `src/types/timeline.ts`
6. `src/schemas/task.schema.ts`

### FASE 2: Backend (3-4h)
7. `src/actions/tasks.ts`
8. `src/actions/timeline.ts`
9. `src/hooks/use-tasks.ts`
10. `src/hooks/use-timeline.ts`

### FASE 3: Componentes Base (3-4h)
11. `src/components/tasks/task-card.tsx`
12. `src/components/tasks/task-dialog.tsx`
13. `src/components/clients/client-tasks-section.tsx`
14. Modificar `src/app/(app)/clientes/[id]/page.tsx`

### FASE 4: Página Completa (4-5h)
15. `src/components/tasks/tasks-stats.tsx`
16. `src/components/tasks/tasks-list.tsx`
17. `src/components/tasks/task-filters.tsx`
18. Reescrever `src/app/(app)/tarefas/page.tsx`

### FASE 5: Timeline (2-3h)
19. `src/components/timeline/timeline-event.tsx`
20. `src/components/clients/client-timeline-section.tsx`
21. Modificar `src/app/(app)/clientes/[id]/page.tsx` (adicionar timeline)

---

## 🔍 DEPENDÊNCIAS ENTRE ARQUIVOS

```
Migrations
  └─> Types
      └─> Schemas
          └─> Actions
              └─> Hooks
                  └─> Componentes
                      └─> Páginas
```

**Regra:** Não avançar para próxima camada sem completar anterior.

---

## ✅ CHECKLIST DE CRIAÇÃO

### Infraestrutura
- [ ] 023_add_tasks_client_id.sql
- [ ] 024_create_client_timeline.sql
- [ ] 025_create_timeline_triggers.sql
- [ ] Executar migrations

### Types e Schemas
- [ ] src/types/tasks.ts
- [ ] src/types/timeline.ts
- [ ] src/schemas/task.schema.ts

### Backend
- [ ] src/actions/tasks.ts
- [ ] src/actions/timeline.ts
- [ ] src/hooks/use-tasks.ts
- [ ] src/hooks/use-timeline.ts

### Componentes - Tarefas
- [ ] src/components/tasks/task-card.tsx
- [ ] src/components/tasks/task-dialog.tsx
- [ ] src/components/tasks/tasks-list.tsx
- [ ] src/components/tasks/tasks-stats.tsx
- [ ] src/components/tasks/task-filters.tsx

### Componentes - Cliente
- [ ] src/components/clients/client-tasks-section.tsx
- [ ] src/components/clients/client-timeline-section.tsx

### Componentes - Timeline
- [ ] src/components/timeline/timeline-event.tsx

### Páginas
- [ ] Modificar src/app/(app)/clientes/[id]/page.tsx
- [ ] Reescrever src/app/(app)/tarefas/page.tsx

---

**FIM DA ESTRUTURA DE ARQUIVOS** ✅


