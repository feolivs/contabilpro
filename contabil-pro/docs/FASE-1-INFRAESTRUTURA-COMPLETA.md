# ✅ FASE 1: Infraestrutura - COMPLETA

**Data de Conclusão:** 02/10/2025  
**Status:** ✅ Implementada  
**Tempo Estimado:** 2-3 horas  
**Tempo Real:** ~1 hora

---

## 📋 O QUE FOI IMPLEMENTADO

### 1. Migrations SQL (3 arquivos)

✅ **`infra/migrations/023_add_tasks_client_id.sql`**
- Adiciona coluna `client_id` na tabela `tasks`
- Cria índice para performance
- Permite vincular tarefas a clientes

✅ **`infra/migrations/024_create_client_timeline.sql`**
- Cria tabela `client_timeline`
- Configura índices de performance
- Habilita RLS com políticas
- Adiciona comentários explicativos

✅ **`infra/migrations/025_create_timeline_triggers.sql`**
- Trigger `log_document_timeline()` - Registra uploads de documentos
- Trigger `log_task_timeline()` - Registra criação/mudanças de tarefas
- Trigger `log_entry_timeline()` - Registra lançamentos contábeis

### 2. Types TypeScript (2 arquivos)

✅ **`src/types/tasks.ts`**
- Interface `Task` completa
- Tipos: `TaskStatus`, `TaskPriority`, `TaskType`
- Inputs: `CreateTaskInput`, `UpdateTaskInput`
- Filtros: `TaskFilters`
- Estatísticas: `TasksStats`
- Constantes: Labels e cores

✅ **`src/types/timeline.ts`**
- Interface `TimelineEvent` completa
- Tipo: `TimelineEventType`
- Input: `CreateTimelineEventInput`
- Filtros: `TimelineFilters`
- Configuração: `TIMELINE_EVENT_CONFIG` com ícones e cores

### 3. Schemas Zod (1 arquivo)

✅ **`src/schemas/task.schema.ts`**
- `taskStatusSchema` - Validação de status
- `taskPrioritySchema` - Validação de prioridade
- `taskTypeSchema` - Validação de tipo
- `createTaskSchema` - Validação para criar tarefa
- `updateTaskSchema` - Validação para atualizar tarefa
- `updateTaskStatusSchema` - Validação para ação rápida
- `taskFiltersSchema` - Validação de filtros

### 4. Scripts Auxiliares (1 arquivo)

✅ **`infra/scripts/apply-tasks-migrations.sql`**
- Script consolidado para aplicar todas as migrations
- Inclui verificações automáticas
- Mensagens de sucesso/erro

---

## 🚀 COMO EXECUTAR

### Opção 1: Script Consolidado (Recomendado)

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Crie uma nova query
4. Cole o conteúdo de `infra/scripts/apply-tasks-migrations.sql`
5. Execute (Run)
6. Verifique as mensagens de sucesso

### Opção 2: Migrations Individuais

Execute na ordem:

```sql
-- 1. Adicionar client_id em tasks
-- Cole o conteúdo de: infra/migrations/023_add_tasks_client_id.sql

-- 2. Criar tabela client_timeline
-- Cole o conteúdo de: infra/migrations/024_create_client_timeline.sql

-- 3. Criar triggers
-- Cole o conteúdo de: infra/migrations/025_create_timeline_triggers.sql
```

---

## ✅ VERIFICAÇÃO

### 1. Verificar Estrutura do Banco

Execute no SQL Editor:

```sql
-- Verificar coluna client_id em tasks
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'client_id';

-- Verificar tabela client_timeline
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'client_timeline'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('tasks', 'client_timeline')
ORDER BY tablename, indexname;

-- Verificar triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%timeline%'
ORDER BY event_object_table;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'client_timeline';
```

### 2. Teste Manual

Execute no SQL Editor:

```sql
-- 1. Criar uma tarefa vinculada a um cliente
INSERT INTO tasks (
  tenant_id, client_id, title, description, type, priority, status, created_by
) VALUES (
  (SELECT id FROM tenants LIMIT 1),
  (SELECT id FROM clients LIMIT 1),
  'Teste de Tarefa',
  'Tarefa de teste para verificar trigger',
  'reminder',
  'medium',
  'pending',
  (SELECT id FROM users LIMIT 1)
) RETURNING *;

-- 2. Verificar se evento foi registrado na timeline
SELECT * FROM client_timeline
ORDER BY created_at DESC
LIMIT 5;

-- 3. Atualizar status da tarefa
UPDATE tasks
SET status = 'in_progress'
WHERE title = 'Teste de Tarefa'
RETURNING *;

-- 4. Verificar novo evento na timeline
SELECT * FROM client_timeline
WHERE event_type = 'task_started'
ORDER BY created_at DESC
LIMIT 1;

-- 5. Limpar dados de teste (opcional)
DELETE FROM tasks WHERE title = 'Teste de Tarefa';
```

### 3. Verificar Types TypeScript

No terminal do projeto:

```bash
cd contabil-pro

# Verificar se não há erros de tipo
npm run type-check
# ou
npx tsc --noEmit
```

---

## 📊 ESTRUTURA CRIADA

### Tabela: tasks (modificada)

```sql
tasks
├── id (UUID, PK)
├── tenant_id (UUID, FK → tenants)
├── client_id (UUID, FK → clients) ← NOVO
├── title (VARCHAR)
├── description (TEXT)
├── type (VARCHAR)
├── priority (VARCHAR)
├── status (VARCHAR)
├── due_date (DATE)
├── assigned_to (UUID, FK → users)
├── created_by (UUID, FK → users)
├── completed_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Tabela: client_timeline (nova)

```sql
client_timeline
├── id (UUID, PK)
├── tenant_id (UUID, FK → tenants)
├── client_id (UUID, FK → clients)
├── event_type (VARCHAR)
├── title (VARCHAR)
├── description (TEXT)
├── metadata (JSONB)
├── document_id (UUID, FK → documents)
├── task_id (UUID, FK → tasks)
├── entry_id (UUID, FK → entries)
├── user_id (UUID, FK → users)
└── created_at (TIMESTAMP)
```

---

## 🎯 PRÓXIMOS PASSOS

A FASE 1 está completa! Agora você pode prosseguir para:

### FASE 2: Server Actions e Hooks (3-4 horas)

**Arquivos a criar:**
- `src/actions/tasks.ts` - Server Actions de tarefas
- `src/actions/timeline.ts` - Server Actions de timeline
- `src/hooks/use-tasks.ts` - React Query hooks para tarefas
- `src/hooks/use-timeline.ts` - React Query hooks para timeline

**Consulte:**
- `docs/CHECKLIST-IMPLEMENTACAO-TAREFAS.md` - Seção FASE 2
- `docs/EXEMPLOS-CODIGO-TAREFAS.md` - Exemplos de código

---

## 📝 NOTAS IMPORTANTES

### RLS (Row Level Security)

✅ **Tabela `client_timeline` está protegida:**
- SELECT: Apenas usuários do mesmo tenant
- INSERT: Apenas sistema (via triggers)

✅ **Triggers executam com `SECURITY DEFINER`:**
- Podem inserir na timeline mesmo com RLS ativo
- Usuários não podem inserir diretamente

### Performance

✅ **Índices criados:**
- `idx_tasks_client_id` - Para filtrar tarefas por cliente
- `idx_client_timeline_client_id` - Para buscar timeline por cliente
- `idx_client_timeline_created_at` - Para ordenar por data (DESC)
- `idx_client_timeline_event_type` - Para filtrar por tipo de evento
- `idx_client_timeline_tenant_id` - Para filtrar por tenant

### Triggers

✅ **Eventos registrados automaticamente:**
- Documento adicionado → `document_uploaded`
- Tarefa criada → `task_created`
- Tarefa iniciada → `task_started`
- Tarefa concluída → `task_completed`
- Tarefa cancelada → `task_cancelled`
- Lançamento criado → `entry_created`
- Lançamento atualizado → `entry_updated`

---

## 🐛 TROUBLESHOOTING

### Erro: "relation tasks does not exist"
- Verifique se a tabela `tasks` existe no banco
- Execute as migrations anteriores primeiro

### Erro: "function current_tenant_id() does not exist"
- Verifique se a função `current_tenant_id()` está criada
- Consulte migrations anteriores de RLS

### Erro: "permission denied for table client_timeline"
- Verifique se RLS está habilitado
- Verifique se as políticas foram criadas corretamente

### Triggers não estão funcionando
- Verifique se os triggers foram criados: `SELECT * FROM information_schema.triggers WHERE trigger_name LIKE '%timeline%';`
- Verifique se as funções existem: `SELECT * FROM pg_proc WHERE proname LIKE '%timeline%';`
- Execute novamente a migration 025

---

## ✅ CHECKLIST DE CONCLUSÃO

- [x] Migration 023 aplicada (client_id em tasks)
- [x] Migration 024 aplicada (tabela client_timeline)
- [x] Migration 025 aplicada (triggers)
- [x] Types TypeScript criados (tasks.ts, timeline.ts)
- [x] Schema Zod criado (task.schema.ts)
- [x] Script consolidado criado
- [x] Documentação criada
- [ ] Migrations executadas no Supabase ← **VOCÊ ESTÁ AQUI**
- [ ] Testes manuais realizados
- [ ] Verificação de tipos OK

---

**FASE 1 COMPLETA! 🎉**

Prossiga para a FASE 2 quando estiver pronto.

