# ✅ Checklist de Implementação: Tarefas e Timeline

**Guia passo a passo para implementação completa**

---

## 📋 FASE 1: Infraestrutura (2-3 horas)

### 1.1 Migrations SQL

- [ ] **Criar:** `infra/migrations/023_add_tasks_client_id.sql`
  ```sql
  ALTER TABLE tasks ADD COLUMN client_id UUID REFERENCES clients(id);
  CREATE INDEX idx_tasks_client_id ON tasks(client_id);
  ```

- [ ] **Criar:** `infra/migrations/024_create_client_timeline.sql`
  - Tabela `client_timeline`
  - Índices de performance
  - Políticas RLS
  - Comentários

- [ ] **Criar:** `infra/migrations/025_create_timeline_triggers.sql`
  - Trigger `log_document_timeline()`
  - Trigger `log_task_timeline()`
  - Trigger `log_entry_timeline()`

- [ ] **Executar migrations** no Supabase
  - Via SQL Editor ou CLI
  - Verificar sucesso

### 1.2 Types TypeScript

- [ ] **Criar:** `src/types/tasks.ts`
  - `Task` interface
  - `TaskStatus` type
  - `TaskPriority` type
  - `TaskType` type
  - `TaskFilters` interface
  - `CreateTaskInput` interface
  - `UpdateTaskInput` interface

- [ ] **Criar:** `src/types/timeline.ts`
  - `TimelineEvent` interface
  - `TimelineEventType` type
  - `TimelineFilters` interface

### 1.3 Schemas Zod

- [ ] **Criar:** `src/schemas/task.schema.ts`
  - `taskStatusSchema`
  - `taskPrioritySchema`
  - `taskTypeSchema`
  - `baseTaskSchema`
  - `createTaskSchema`
  - `updateTaskSchema`
  - `taskFiltersSchema`

### 1.4 Testes de Infraestrutura

- [ ] Verificar tabelas criadas
- [ ] Verificar índices criados
- [ ] Verificar triggers funcionando
- [ ] Verificar RLS ativo
- [ ] Testar inserção manual de tarefa
- [ ] Verificar evento registrado na timeline

---

## 📋 FASE 2: Server Actions e Hooks (3-4 horas)

### 2.1 Server Actions - Tarefas

- [ ] **Criar:** `src/actions/tasks.ts`

**Funções a implementar:**

- [ ] `getTasks(filters)` - Listar com filtros
  - Validar filtros com Zod
  - Construir query dinâmica
  - Aplicar ordenação
  - Aplicar paginação
  - Retornar tasks + total

- [ ] `getTaskById(id)` - Buscar por ID
  - Validar ID
  - Buscar com relacionamentos
  - Retornar task ou erro

- [ ] `createTask(input)` - Criar tarefa
  - Validar input
  - Inserir no banco
  - Revalidar paths
  - Retornar task criada

- [ ] `updateTask(input)` - Atualizar tarefa
  - Validar input
  - Atualizar no banco
  - Revalidar paths
  - Retornar task atualizada

- [ ] `deleteTask(id)` - Deletar tarefa
  - Validar ID
  - Deletar do banco
  - Revalidar paths
  - Retornar sucesso

- [ ] `updateTaskStatus(id, status)` - Ação rápida
  - Validar status
  - Atualizar status
  - Registrar completed_at se concluída
  - Revalidar paths
  - Retornar task atualizada

- [ ] `getTasksStats()` - Estatísticas
  - Contar por status
  - Contar atrasadas
  - Retornar objeto com contadores

### 2.2 Server Actions - Timeline

- [ ] **Criar:** `src/actions/timeline.ts`

**Funções a implementar:**

- [ ] `getClientTimeline(filters)` - Buscar timeline
  - Validar filtros
  - Construir query
  - Aplicar filtros de tipo
  - Aplicar paginação
  - Retornar eventos + total

- [ ] `logTimelineEvent(input)` - Registrar manual (opcional)
  - Validar input
  - Inserir evento
  - Retornar evento criado

### 2.3 Hooks React Query - Tarefas

- [ ] **Criar:** `src/hooks/use-tasks.ts`

**Hooks a implementar:**

- [ ] `useTasks(filters)` - Query de listagem
  - Query key dinâmica
  - staleTime: 30s
  - gcTime: 5min

- [ ] `useTask(id)` - Query de detalhe
  - Query key com ID
  - Enabled condicional

- [ ] `useTasksStats()` - Query de estatísticas
  - Query key fixa
  - staleTime: 1min

- [ ] `useCreateTask()` - Mutation de criação
  - Invalidar listas após sucesso
  - Toast de sucesso/erro

- [ ] `useUpdateTask()` - Mutation de atualização
  - Invalidar listas e detalhe
  - Toast de sucesso/erro

- [ ] `useDeleteTask()` - Mutation de deleção
  - Invalidar listas
  - Toast de sucesso/erro

- [ ] `useUpdateTaskStatus()` - Mutation de status
  - Invalidar listas
  - Toast personalizado por status

### 2.4 Hooks React Query - Timeline

- [ ] **Criar:** `src/hooks/use-timeline.ts`

**Hooks a implementar:**

- [ ] `useClientTimeline(filters)` - Query de timeline
  - Query key dinâmica
  - staleTime: 1min
  - gcTime: 10min

### 2.5 Testes de Actions e Hooks

- [ ] Testar getTasks sem filtros
- [ ] Testar getTasks com filtros
- [ ] Testar createTask
- [ ] Testar updateTaskStatus
- [ ] Testar getClientTimeline
- [ ] Verificar invalidação de cache
- [ ] Verificar toasts

---

## 📋 FASE 3: Tarefas do Cliente (3-4 horas)

### 3.1 Componentes Base

- [ ] **Criar:** `src/components/tasks/task-card.tsx`
  - Props: task, onStart, onComplete, onEdit, showClient
  - Badges de prioridade e status
  - Indicador de prazo
  - Botões de ação
  - Responsivo

- [ ] **Criar:** `src/components/tasks/task-dialog.tsx`
  - Formulário com react-hook-form
  - Validação com Zod
  - Campos: título, descrição, tipo, prioridade, prazo, cliente
  - Modo criar/editar
  - Loading states

### 3.2 Seção do Cliente

- [ ] **Criar:** `src/components/clients/client-tasks-section.tsx`
  - Props: clientId, clientName
  - useTasks com filtro client_id
  - Tabs por status (Todas, Pendentes, Em Andamento, Concluídas)
  - Badges com contadores
  - Lista de TaskCards
  - Botão "Nova Tarefa"
  - Empty states por tab
  - Loading states
  - Error states

### 3.3 Integração na Página

- [ ] **Modificar:** `src/app/(app)/clientes/[id]/page.tsx`
  - Importar ClientTasksSection
  - Adicionar após ClientDocumentsSection
  - Passar clientId e clientName

### 3.4 Testes de UI

- [ ] Verificar renderização da seção
- [ ] Testar tabs
- [ ] Testar criação de tarefa
- [ ] Testar ação "Iniciar"
- [ ] Testar ação "Concluir"
- [ ] Testar edição
- [ ] Verificar empty states
- [ ] Verificar loading states
- [ ] Testar responsividade

---

## 📋 FASE 4: Página de Tarefas (4-5 horas)

### 4.1 Componentes de Estatísticas

- [ ] **Criar:** `src/components/tasks/tasks-stats.tsx`
  - useTasksStats hook
  - 4 cards: Pendentes, Em Andamento, Concluídas, Atrasadas
  - Ícones e cores
  - Loading skeleton

### 4.2 Componentes de Lista

- [ ] **Criar:** `src/components/tasks/tasks-list.tsx`
  - Props: tasks, onPageChange, etc.
  - Tabs por status
  - Lista de TaskCards
  - Paginação
  - Empty states

### 4.3 Componentes de Filtros

- [ ] **Criar:** `src/components/tasks/task-filters.tsx`
  - Filtro por cliente (combobox)
  - Filtro por status (select)
  - Filtro por prioridade (select)
  - Filtro por prazo (date range)
  - Busca textual (input)
  - Botão "Limpar filtros"

### 4.4 Página Principal

- [ ] **Reescrever:** `src/app/(app)/tarefas/page.tsx`
  - Layout com header
  - TasksStats
  - TaskFilters
  - TasksList
  - TaskDialog
  - Gerenciar estado de filtros
  - Botão "Nova Tarefa"

### 4.5 Testes de Página

- [ ] Verificar KPIs corretos
- [ ] Testar todos os filtros
- [ ] Testar busca textual
- [ ] Testar paginação
- [ ] Testar criação de tarefa
- [ ] Testar link para cliente
- [ ] Verificar performance

---

## 📋 FASE 5: Timeline do Cliente (2-3 horas)

### 5.1 Componentes de Timeline

- [ ] **Criar:** `src/components/timeline/timeline-event.tsx`
  - Props: event
  - Ícone por tipo
  - Cor por tipo
  - Timestamp formatado
  - Título e descrição
  - Link para recurso (se aplicável)

### 5.2 Seção de Timeline

- [ ] **Criar:** `src/components/clients/client-timeline-section.tsx`
  - Props: clientId
  - useClientTimeline hook
  - Tabs por tipo (Todas, Documentos, Tarefas, Lançamentos)
  - Lista de TimelineEvents
  - Scroll infinito ou paginação
  - Empty states
  - Loading states

### 5.3 Integração na Página

- [ ] **Modificar:** `src/app/(app)/clientes/[id]/page.tsx`
  - Importar ClientTimelineSection
  - Adicionar após ClientTasksSection
  - Passar clientId

### 5.4 Testes de Timeline

- [ ] Verificar eventos registrados automaticamente
- [ ] Testar filtros por tipo
- [ ] Verificar ordem cronológica
- [ ] Testar paginação/scroll
- [ ] Verificar ícones e cores
- [ ] Testar links para recursos

---

## 📋 FASE 6: Polimento e Melhorias (2-3 horas)

### 6.1 Notificações

- [ ] Badge na sidebar com contador de tarefas urgentes
- [ ] Implementar email diário (opcional)
- [ ] Toast ao criar/atualizar tarefa

### 6.2 Atalhos de Teclado

- [ ] `N` - Nova tarefa
- [ ] `F` - Focar busca
- [ ] `Esc` - Fechar dialogs
- [ ] `/` - Focar busca global

### 6.3 Responsividade

- [ ] Testar em mobile (< 640px)
- [ ] Testar em tablet (640-1024px)
- [ ] Testar em desktop (> 1024px)
- [ ] Ajustar breakpoints
- [ ] Verificar scroll horizontal

### 6.4 Animações

- [ ] Transições suaves entre tabs
- [ ] Fade in/out de cards
- [ ] Loading skeletons
- [ ] Toast animations

### 6.5 Acessibilidade

- [ ] Labels em todos os inputs
- [ ] ARIA labels em botões
- [ ] Navegação por teclado
- [ ] Contraste adequado
- [ ] Focus visible

### 6.6 Documentação

- [ ] Comentários em código complexo
- [ ] README com instruções
- [ ] Exemplos de uso
- [ ] Troubleshooting

---

## 📋 TESTES FINAIS

### Funcionalidade

- [ ] Criar tarefa sem cliente
- [ ] Criar tarefa com cliente
- [ ] Editar tarefa
- [ ] Deletar tarefa
- [ ] Iniciar tarefa
- [ ] Concluir tarefa
- [ ] Cancelar tarefa
- [ ] Filtrar por status
- [ ] Filtrar por prioridade
- [ ] Filtrar por cliente
- [ ] Filtrar por prazo
- [ ] Buscar por texto
- [ ] Ver timeline do cliente
- [ ] Filtrar timeline por tipo

### Performance

- [ ] Carregamento inicial < 1s
- [ ] Filtros client-side < 100ms
- [ ] Criar tarefa < 500ms
- [ ] Atualizar status < 300ms
- [ ] Carregar timeline < 800ms

### Segurança

- [ ] RLS bloqueia acesso cross-tenant
- [ ] Validação de inputs funciona
- [ ] Apenas criador pode deletar
- [ ] Apenas atribuído pode atualizar

### UX

- [ ] Indicadores visuais claros
- [ ] Feedback em todas as ações
- [ ] Empty states informativos
- [ ] Loading states suaves
- [ ] Erros tratados graciosamente

---

## 📊 MÉTRICAS DE SUCESSO

### Quantitativas

- [ ] 100% das funcionalidades implementadas
- [ ] 0 erros de TypeScript
- [ ] 0 warnings de ESLint
- [ ] Performance targets atingidos
- [ ] Cobertura de testes > 80% (se aplicável)

### Qualitativas

- [ ] Código limpo e organizado
- [ ] Componentes reutilizáveis
- [ ] Padrões consistentes
- [ ] Documentação adequada
- [ ] UX intuitiva

---

## 🚀 DEPLOY

### Pré-Deploy

- [ ] Revisar todas as migrations
- [ ] Testar em ambiente de staging
- [ ] Backup do banco de dados
- [ ] Verificar variáveis de ambiente

### Deploy

- [ ] Executar migrations em produção
- [ ] Deploy do código
- [ ] Verificar logs
- [ ] Testar funcionalidades críticas

### Pós-Deploy

- [ ] Monitorar erros
- [ ] Coletar feedback do usuário
- [ ] Ajustar conforme necessário
- [ ] Documentar lições aprendidas

---

## 📝 NOTAS FINAIS

### Priorização

**Essencial (MVP):**
- ✅ FASE 1 - Infraestrutura
- ✅ FASE 2 - Actions e Hooks
- ✅ FASE 3 - Tarefas do Cliente

**Importante:**
- ⚠️ FASE 4 - Página de Tarefas

**Desejável:**
- 🟢 FASE 5 - Timeline
- 🟢 FASE 6 - Polimento

### Tempo Estimado

- **MVP:** 8-11 horas (Fases 1-3)
- **Completo:** 16-22 horas (Todas as fases)

### Próximos Passos

Após implementação completa:
1. Coletar feedback do usuário
2. Iterar baseado no uso real
3. Considerar features avançadas:
   - Kanban board
   - Calendário
   - Recorrência de tarefas
   - Templates de tarefas
   - Relatórios de produtividade

---

**BOA IMPLEMENTAÇÃO! 🚀**


