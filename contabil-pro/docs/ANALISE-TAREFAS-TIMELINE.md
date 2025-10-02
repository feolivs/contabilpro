# 📋 Análise Completa: Tarefas e Timeline no ContabilPRO

**Data:** 02/10/2025  
**Status:** 📊 Análise Técnica  
**Objetivo:** Planejar implementação de gestão de tarefas e timeline de atividades

---

## 📊 1. ANÁLISE DA ESTRUTURA ATUAL

### 1.1 Tabela `tasks` (Banco de Dados)

**Schema Existente:**
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,              -- reminder, tax_obligation, document_review, etc.
  priority VARCHAR(10) DEFAULT 'medium',  -- low, medium, high, urgent
  status VARCHAR(20) DEFAULT 'pending',   -- pending, in_progress, completed, cancelled
  due_date DATE,
  assigned_to UUID REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices existentes
CREATE INDEX idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

**⚠️ CAMPO FALTANTE CRÍTICO:**
```sql
-- ADICIONAR: Relacionamento com cliente
ALTER TABLE tasks ADD COLUMN client_id UUID REFERENCES clients(id);
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
```

### 1.2 Políticas RLS Existentes

```sql
-- SELECT: Todos os usuários do tenant podem ver tarefas
CREATE POLICY "Users can view tasks from their tenant" ON tasks
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- INSERT: Todos podem criar tarefas
CREATE POLICY "Users can create tasks in their tenant" ON tasks
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

-- UPDATE: Apenas atribuído ou criador pode atualizar
CREATE POLICY "Users can update their assigned tasks or created tasks" ON tasks
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id() AND
    (assigned_to = auth.uid() OR created_by = auth.uid())
  );

-- DELETE: Managers podem deletar
CREATE POLICY "Managers can delete tasks from their tenant" ON tasks
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    (
      created_by = auth.uid() OR
      current_tenant_id() IN (
        SELECT tenant_id FROM user_tenants 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
        AND status = 'active'
      )
    )
  );
```

**✅ Políticas adequadas para usuário único (contador)**

### 1.3 Arquivos Existentes

**Página de Tarefas:**
- ✅ `src/app/(app)/tarefas/page.tsx` - Existe mas está vazia (placeholder)
- ❌ Nenhum componente de tarefa implementado
- ❌ Nenhuma Server Action implementada
- ❌ Nenhum hook React Query implementado

**Componente no Dashboard:**
- ✅ `src/components/dashboard/priority-tasks-panel.tsx` - Existe com dados mock
- ⚠️ Usa dados estáticos, não integrado com banco

**Navegação:**
- ✅ Rota `/tarefas` configurada em `src/config/navigation.ts`
- ✅ Item "Tarefas" na sidebar (grupo "Operações")
- ✅ Permissão `tarefas.read` configurada

---

## 🎯 2. FUNCIONALIDADE 1: Tarefas Vinculadas ao Cliente

### 2.1 Objetivo

Exibir e gerenciar tarefas relacionadas a um cliente específico na página `/clientes/[id]`, similar à seção de documentos recém-implementada.

### 2.2 Wireframe Proposto

```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Tarefas do Cliente [8]                      [Nova Tarefa]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [Todas 8] [Pendentes 3] [Em Andamento 2] [Concluídas 3]    │
│ ─────────                                                    │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 🔴 URGENTE  Calcular DAS de Setembro                   │  │
│ │             Vence em 2 dias • 05/10/2025               │  │
│ │             [Iniciar] [Editar] [⋮]                     │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ 🟡 ALTA     Revisar lançamentos do mês                 │  │
│ │             Vence em 5 dias • 08/10/2025               │  │
│ │             [Iniciar] [Editar] [⋮]                     │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ 🟢 MÉDIA    Enviar relatório mensal                    │  │
│ │             Vence em 10 dias • 13/10/2025              │  │
│ │             [Iniciar] [Editar] [⋮]                     │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Componente Proposto

**Arquivo:** `src/components/clients/client-tasks-section.tsx`

**Props:**
```typescript
interface ClientTasksSectionProps {
  clientId: string;
  clientName: string;
}
```

**Features:**
- ✅ Tabs por status (Todas, Pendentes, Em Andamento, Concluídas)
- ✅ Badges com contadores por status
- ✅ Cards de tarefa com informações visuais
- ✅ Indicadores de prioridade (cores)
- ✅ Indicadores de prazo (urgente, próximo, normal)
- ✅ Ações rápidas (Iniciar, Concluir, Editar, Excluir)
- ✅ Botão "Nova Tarefa" com client_id pré-preenchido
- ✅ Empty states por tab
- ✅ Loading states

### 2.4 Informações a Exibir

**Card de Tarefa:**
```typescript
interface TaskCard {
  // Cabeçalho
  priority: 'low' | 'medium' | 'high' | 'urgent';  // Badge colorido
  title: string;                                    // Título principal
  
  // Corpo
  description?: string;                             // Descrição (truncada)
  type: string;                                     // Tipo (badge secundário)
  
  // Rodapé
  due_date?: Date;                                  // Data de vencimento
  daysUntil: number;                                // Dias até vencer
  status: 'pending' | 'in_progress' | 'completed';  // Status atual
  
  // Ações
  actions: ['start', 'complete', 'edit', 'delete']; // Botões de ação
}
```

**Cores de Prioridade:**
```typescript
const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-green-100 text-green-800 border-green-300',
};
```

**Indicadores de Prazo:**
```typescript
const getDueDateStatus = (dueDate: Date) => {
  const daysUntil = differenceInDays(dueDate, new Date());
  
  if (daysUntil < 0) return { label: 'Atrasada', color: 'text-red-600', icon: '🔴' };
  if (daysUntil === 0) return { label: 'Hoje', color: 'text-red-600', icon: '🔴' };
  if (daysUntil <= 2) return { label: `${daysUntil}d`, color: 'text-orange-600', icon: '🟠' };
  if (daysUntil <= 7) return { label: `${daysUntil}d`, color: 'text-yellow-600', icon: '🟡' };
  return { label: format(dueDate, 'dd/MM'), color: 'text-muted-foreground', icon: '📅' };
};
```

### 2.5 Ações Disponíveis

**1. Iniciar Tarefa** (pending → in_progress)
```typescript
const handleStartTask = async (taskId: string) => {
  await updateTask({
    id: taskId,
    status: 'in_progress',
  });
  toast.success('Tarefa iniciada');
};
```

**2. Concluir Tarefa** (in_progress → completed)
```typescript
const handleCompleteTask = async (taskId: string) => {
  await updateTask({
    id: taskId,
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
  toast.success('Tarefa concluída! 🎉');
};
```

**3. Editar Tarefa**
- Abre dialog com formulário
- Campos editáveis: título, descrição, tipo, prioridade, prazo

**4. Excluir Tarefa**
- Dialog de confirmação
- Soft delete ou hard delete (a definir)

**5. Desvincular do Cliente**
- Remove `client_id` (tarefa continua existindo)
- Similar ao desvincular documento

### 2.6 Filtros e Ordenação

**Tabs (Filtro por Status):**
```typescript
const TASK_TABS = [
  { value: 'all', label: 'Todas', filter: null },
  { value: 'pending', label: 'Pendentes', filter: { status: 'pending' } },
  { value: 'in_progress', label: 'Em Andamento', filter: { status: 'in_progress' } },
  { value: 'completed', label: 'Concluídas', filter: { status: 'completed' } },
];
```

**Ordenação Padrão:**
```typescript
const sortTasks = (tasks: Task[]) => {
  return tasks.sort((a, b) => {
    // 1. Prioridade (urgent > high > medium > low)
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // 2. Data de vencimento (mais próximo primeiro)
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    
    // 3. Data de criação (mais recente primeiro)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};
```

---

## 🎯 3. FUNCIONALIDADE 2: Página de Tarefas (/tarefas)

### 3.1 Objetivo

Criar uma página completa de gestão de tarefas, com visão geral de todas as tarefas (não apenas de um cliente específico).

### 3.2 Wireframe Proposto

```
┌─────────────────────────────────────────────────────────────┐
│ Tarefas                                                      │
│ Execução e acompanhamento de prazos e responsabilidades     │
│                                                              │
│ [Filtros ▼] [Ordenar ▼]                      [Nova Tarefa] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 📊 Resumo                                                    │
│ ┌──────────┬──────────┬──────────┬──────────┐              │
│ │ Pendentes│ Em Andam.│Concluídas│ Atrasadas│              │
│ │    12    │     5    │    23    │     3    │              │
│ └──────────┴──────────┴──────────┴──────────┘              │
│                                                              │
│ [Todas] [Pendentes] [Em Andamento] [Concluídas] [Atrasadas]│
│ ─────                                                        │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 🔴 URGENTE  Calcular DAS - Cliente ABC                 │  │
│ │             Vence hoje • Cliente: Maria Santos          │  │
│ │             [Iniciar] [Ver Cliente] [⋮]                │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ 🟡 ALTA     Revisar lançamentos - Cliente XYZ          │  │
│ │             Vence em 2 dias • Cliente: João Silva      │  │
│ │             [Iniciar] [Ver Cliente] [⋮]                │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Mostrando 1-10 de 40 tarefas    [Anterior] [Próxima]       │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Componentes Necessários

**1. TasksPage** (`src/app/(app)/tarefas/page.tsx`)
- Layout principal
- Integração com Server Actions
- Filtros e ordenação

**2. TasksStats** (`src/components/tasks/tasks-stats.tsx`)
- 4 cards com KPIs
- Pendentes, Em Andamento, Concluídas, Atrasadas

**3. TasksList** (`src/components/tasks/tasks-list.tsx`)
- Lista de tarefas com tabs
- Cards de tarefa
- Paginação

**4. TaskCard** (`src/components/tasks/task-card.tsx`)
- Card individual de tarefa
- Informações visuais
- Ações rápidas

**5. TaskDialog** (`src/components/tasks/task-dialog.tsx`)
- Criar/Editar tarefa
- Formulário completo
- Validação com Zod

**6. TaskFilters** (`src/components/tasks/task-filters.tsx`)
- Filtros avançados
- Cliente, Status, Prioridade, Prazo

### 3.4 Filtros Avançados

```typescript
interface TaskFilters {
  // Filtros básicos
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  
  // Filtros por relacionamento
  client_id?: string;              // Tarefas de um cliente específico
  assigned_to?: string;            // Tarefas atribuídas a um usuário
  created_by?: string;             // Tarefas criadas por um usuário
  
  // Filtros por data
  due_date_from?: Date;            // Vence a partir de
  due_date_to?: Date;              // Vence até
  overdue?: boolean;               // Apenas atrasadas
  
  // Filtros por tipo
  type?: string;                   // reminder, tax_obligation, etc.
  
  // Busca textual
  search?: string;                 // Busca em título e descrição
  
  // Paginação
  page?: number;
  pageSize?: number;
}
```

### 3.5 Visões Alternativas (Futuro)

**Kanban Board:**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Pendentes  │ Em Andamento│  Concluídas │  Canceladas │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │             │
│ │ Tarefa 1│ │ │ Tarefa 4│ │ │ Tarefa 7│ │             │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │             │
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │             │
│ │ Tarefa 2│ │ │ Tarefa 5│ │ │ Tarefa 8│ │             │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │             │
│ ┌─────────┐ │ ┌─────────┐ │             │             │
│ │ Tarefa 3│ │ │ Tarefa 6│ │             │             │
│ └─────────┘ │ └─────────┘ │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Calendário:**
```
┌─────────────────────────────────────────────────────────────┐
│ Outubro 2025                                    [Hoje]      │
├─────────────────────────────────────────────────────────────┤
│ Dom  Seg  Ter  Qua  Qui  Sex  Sáb                          │
│                  1    2    3    4    5                      │
│  6    7    8    9   10   11   12                           │
│                     🔴   🟡                                  │
│ 13   14   15   16   17   18   19                           │
│ 🟢                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 4. FUNCIONALIDADE 3: Timeline do Cliente

### 4.1 Objetivo

Exibir um histórico cronológico de todas as atividades relacionadas ao cliente (documentos, tarefas, lançamentos).

### 4.2 Wireframe Proposto

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Timeline de Atividades                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [Todas] [Documentos] [Tarefas] [Lançamentos]               │
│ ─────                                                        │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 📄 02/10/2025 17:32                                     │  │
│ │    Documento adicionado                                 │  │
│ │    Recibo de Pagamento 202410.pdf                       │  │
│ │    por Você                                             │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ ✅ 02/10/2025 14:15                                     │  │
│ │    Tarefa concluída                                     │  │
│ │    Calcular DAS de Setembro                             │  │
│ │    por Você                                             │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ 💰 01/10/2025 09:00                                     │  │
│ │    Lançamento registrado                                │  │
│ │    Pagamento de fornecedor - R$ 1.500,00                │  │
│ │    por Você                                             │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ 📋 29/09/2025 16:45                                     │  │
│ │    Tarefa criada                                        │  │
│ │    Revisar lançamentos do mês                           │  │
│ │    por Você                                             │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ [Carregar mais]                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Tipos de Eventos

```typescript
type TimelineEventType =
  | 'document_uploaded'
  | 'document_deleted'
  | 'task_created'
  | 'task_started'
  | 'task_completed'
  | 'task_cancelled'
  | 'entry_created'
  | 'entry_updated'
  | 'client_updated'
  | 'note_added';

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  icon: string;
  color: string;
  timestamp: Date;
  user_name: string;
  metadata?: Record<string, any>;

  // Relacionamentos
  document_id?: string;
  task_id?: string;
  entry_id?: string;
}
```

### 4.4 Ícones e Cores por Tipo

```typescript
const EVENT_CONFIG: Record<TimelineEventType, { icon: string; color: string }> = {
  document_uploaded: { icon: '📄', color: 'text-blue-600' },
  document_deleted: { icon: '🗑️', color: 'text-red-600' },
  task_created: { icon: '📋', color: 'text-green-600' },
  task_started: { icon: '▶️', color: 'text-yellow-600' },
  task_completed: { icon: '✅', color: 'text-green-600' },
  task_cancelled: { icon: '❌', color: 'text-red-600' },
  entry_created: { icon: '💰', color: 'text-purple-600' },
  entry_updated: { icon: '✏️', color: 'text-orange-600' },
  client_updated: { icon: '👤', color: 'text-blue-600' },
  note_added: { icon: '📝', color: 'text-gray-600' },
};
```

### 4.5 Implementação: Tabela de Auditoria

**Opção 1: Tabela Dedicada (Recomendado)**

```sql
CREATE TABLE client_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Relacionamentos opcionais
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,

  -- Auditoria
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_client_timeline_client_id ON client_timeline(client_id);
CREATE INDEX idx_client_timeline_created_at ON client_timeline(created_at DESC);
CREATE INDEX idx_client_timeline_event_type ON client_timeline(event_type);
```

**Opção 2: View Agregada (Alternativa)**

```sql
-- View que agrega eventos de múltiplas tabelas
CREATE VIEW client_timeline_view AS
SELECT
  d.id,
  d.client_id,
  'document_uploaded' as event_type,
  d.name as title,
  d.created_at as timestamp,
  u.name as user_name
FROM documents d
JOIN users u ON d.uploaded_by = u.id
WHERE d.client_id IS NOT NULL

UNION ALL

SELECT
  t.id,
  t.client_id,
  CASE
    WHEN t.status = 'completed' THEN 'task_completed'
    WHEN t.status = 'in_progress' THEN 'task_started'
    ELSE 'task_created'
  END as event_type,
  t.title,
  t.updated_at as timestamp,
  u.name as user_name
FROM tasks t
JOIN users u ON t.created_by = u.id
WHERE t.client_id IS NOT NULL

UNION ALL

SELECT
  e.id,
  e.client_id,
  'entry_created' as event_type,
  e.description as title,
  e.created_at as timestamp,
  u.name as user_name
FROM entries e
JOIN users u ON e.created_by = u.id
WHERE e.client_id IS NOT NULL

ORDER BY timestamp DESC;
```

### 4.6 Triggers para Registro Automático

```sql
-- Trigger para documentos
CREATE OR REPLACE FUNCTION log_document_timeline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    INSERT INTO client_timeline (
      tenant_id, client_id, event_type, title,
      document_id, user_id, metadata
    ) VALUES (
      NEW.tenant_id,
      NEW.client_id,
      'document_uploaded',
      'Documento adicionado: ' || NEW.name,
      NEW.id,
      NEW.uploaded_by,
      jsonb_build_object('file_size', NEW.size, 'mime_type', NEW.mime_type)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_timeline_trigger
AFTER INSERT ON documents
FOR EACH ROW
EXECUTE FUNCTION log_document_timeline();

-- Trigger para tarefas
CREATE OR REPLACE FUNCTION log_task_timeline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    -- Detectar tipo de evento
    IF TG_OP = 'INSERT' THEN
      INSERT INTO client_timeline (
        tenant_id, client_id, event_type, title,
        task_id, user_id
      ) VALUES (
        NEW.tenant_id,
        NEW.client_id,
        'task_created',
        'Tarefa criada: ' || NEW.title,
        NEW.id,
        NEW.created_by
      );
    ELSIF OLD.status != NEW.status THEN
      INSERT INTO client_timeline (
        tenant_id, client_id, event_type, title,
        task_id, user_id
      ) VALUES (
        NEW.tenant_id,
        NEW.client_id,
        CASE NEW.status
          WHEN 'in_progress' THEN 'task_started'
          WHEN 'completed' THEN 'task_completed'
          WHEN 'cancelled' THEN 'task_cancelled'
          ELSE 'task_updated'
        END,
        CASE NEW.status
          WHEN 'in_progress' THEN 'Tarefa iniciada: ' || NEW.title
          WHEN 'completed' THEN 'Tarefa concluída: ' || NEW.title
          WHEN 'cancelled' THEN 'Tarefa cancelada: ' || NEW.title
          ELSE 'Tarefa atualizada: ' || NEW.title
        END,
        NEW.id,
        COALESCE(NEW.assigned_to, NEW.created_by)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_timeline_trigger
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION log_task_timeline();
```

### 4.7 Componente Timeline

**Arquivo:** `src/components/clients/client-timeline-section.tsx`

```typescript
interface ClientTimelineSectionProps {
  clientId: string;
}

export function ClientTimelineSection({ clientId }: ClientTimelineSectionProps) {
  const [activeFilter, setActiveFilter] = useState<TimelineEventType | 'all'>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useClientTimeline({
    client_id: clientId,
    event_type: activeFilter === 'all' ? undefined : activeFilter,
    page,
    pageSize: 20,
  });

  // Renderização com scroll infinito ou paginação
}
```

### 4.8 Filtros de Timeline

```typescript
const TIMELINE_FILTERS = [
  { value: 'all', label: 'Todas', icon: '📊' },
  { value: 'documents', label: 'Documentos', icon: '📄' },
  { value: 'tasks', label: 'Tarefas', icon: '📋' },
  { value: 'entries', label: 'Lançamentos', icon: '💰' },
];
```

---

## 📋 5. SERVER ACTIONS NECESSÁRIAS

### 5.1 Tarefas

**Arquivo:** `src/actions/tasks.ts`

```typescript
// 1. Listar tarefas com filtros
export async function getTasks(
  filters: TaskFilters
): Promise<ActionResponse<{ tasks: Task[]; total: number }>>

// 2. Buscar tarefa por ID
export async function getTaskById(
  id: string
): Promise<ActionResponse<Task>>

// 3. Criar tarefa
export async function createTask(
  input: CreateTaskInput
): Promise<ActionResponse<Task>>

// 4. Atualizar tarefa
export async function updateTask(
  input: UpdateTaskInput
): Promise<ActionResponse<Task>>

// 5. Deletar tarefa
export async function deleteTask(
  id: string
): Promise<ActionResponse<void>>

// 6. Mudar status da tarefa (ação rápida)
export async function updateTaskStatus(
  id: string,
  status: TaskStatus
): Promise<ActionResponse<Task>>

// 7. Estatísticas de tarefas
export async function getTasksStats(): Promise<ActionResponse<{
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
}>>
```

### 5.2 Timeline

**Arquivo:** `src/actions/timeline.ts`

```typescript
// 1. Buscar timeline do cliente
export async function getClientTimeline(
  filters: TimelineFilters
): Promise<ActionResponse<{ events: TimelineEvent[]; total: number }>>

// 2. Registrar evento manual (opcional)
export async function logTimelineEvent(
  input: CreateTimelineEventInput
): Promise<ActionResponse<TimelineEvent>>
```

---

## 🎨 6. HOOKS REACT QUERY

### 6.1 Tarefas

**Arquivo:** `src/hooks/use-tasks.ts`

```typescript
// Query Keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Partial<TaskFilters>) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  stats: () => [...taskKeys.all, 'stats'] as const,
};

// Hooks
export function useTasks(filters: Partial<TaskFilters> = {})
export function useTask(id: string)
export function useTasksStats()
export function useCreateTask()
export function useUpdateTask()
export function useDeleteTask()
export function useUpdateTaskStatus()
```

### 6.2 Timeline

**Arquivo:** `src/hooks/use-timeline.ts`

```typescript
// Query Keys
export const timelineKeys = {
  all: ['timeline'] as const,
  lists: () => [...timelineKeys.all, 'list'] as const,
  list: (filters: Partial<TimelineFilters>) => [...timelineKeys.lists(), filters] as const,
};

// Hooks
export function useClientTimeline(filters: Partial<TimelineFilters> = {})
```

---

## 🗂️ 7. TIPOS TYPESCRIPT

### 7.1 Tarefas

**Arquivo:** `src/types/tasks.ts`

```typescript
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType =
  | 'reminder'
  | 'tax_obligation'
  | 'document_review'
  | 'client_meeting'
  | 'report_generation'
  | 'other';

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
  client?: {
    id: string;
    name: string;
  };
  assigned_user?: {
    id: string;
    name: string;
  };
  created_user?: {
    id: string;
    name: string;
  };
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  client_id?: string;
  assigned_to?: string;
  created_by?: string;
  due_date_from?: string;
  due_date_to?: string;
  overdue?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  type: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
  client_id?: string;
  assigned_to?: string;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
  client_id?: string;
  assigned_to?: string;
}
```

### 7.2 Timeline

**Arquivo:** `src/types/timeline.ts`

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
  | 'client_updated'
  | 'note_added';

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
  user?: {
    id: string;
    name: string;
  };
}

export interface TimelineFilters {
  client_id: string;
  event_type?: TimelineEventType | TimelineEventType[];
  from_date?: string;
  to_date?: string;
  page?: number;
  pageSize?: number;
}
```

---

## 📅 8. PLANO DE IMPLEMENTAÇÃO POR FASES

### **FASE 1: Infraestrutura (2-3 horas)**

**Objetivo:** Preparar banco de dados e estrutura base

**Tasks:**
1. ✅ Adicionar coluna `client_id` na tabela `tasks`
2. ✅ Criar índice para `client_id`
3. ✅ Criar tabela `client_timeline`
4. ✅ Criar triggers de auditoria
5. ✅ Criar tipos TypeScript (`tasks.ts`, `timeline.ts`)
6. ✅ Criar schemas Zod para validação

**Arquivos:**
- `infra/migrations/023_add_tasks_client_id.sql`
- `infra/migrations/024_create_client_timeline.sql`
- `infra/migrations/025_create_timeline_triggers.sql`
- `src/types/tasks.ts`
- `src/types/timeline.ts`
- `src/schemas/task.schema.ts`

---

### **FASE 2: Server Actions e Hooks (3-4 horas)**

**Objetivo:** Implementar lógica de negócio

**Tasks:**
1. ✅ Criar Server Actions de tarefas (`src/actions/tasks.ts`)
2. ✅ Criar Server Actions de timeline (`src/actions/timeline.ts`)
3. ✅ Criar hooks React Query (`src/hooks/use-tasks.ts`)
4. ✅ Criar hooks React Query (`src/hooks/use-timeline.ts`)
5. ✅ Testar actions com dados mock

**Arquivos:**
- `src/actions/tasks.ts` (~300 linhas)
- `src/actions/timeline.ts` (~100 linhas)
- `src/hooks/use-tasks.ts` (~150 linhas)
- `src/hooks/use-timeline.ts` (~50 linhas)

---

### **FASE 3: Tarefas do Cliente (3-4 horas)**

**Objetivo:** Implementar seção de tarefas na página do cliente

**Tasks:**
1. ✅ Criar `ClientTasksSection` component
2. ✅ Implementar tabs por status
3. ✅ Criar `TaskCard` component
4. ✅ Implementar ações (iniciar, concluir, editar, excluir)
5. ✅ Criar `TaskDialog` para criar/editar
6. ✅ Integrar na página `/clientes/[id]`
7. ✅ Testar fluxo completo

**Arquivos:**
- `src/components/clients/client-tasks-section.tsx` (~350 linhas)
- `src/components/tasks/task-card.tsx` (~150 linhas)
- `src/components/tasks/task-dialog.tsx` (~200 linhas)
- `src/app/(app)/clientes/[id]/page.tsx` (modificar)

---

### **FASE 4: Página de Tarefas (4-5 horas)**

**Objetivo:** Implementar página completa de gestão de tarefas

**Tasks:**
1. ✅ Criar `TasksStats` component (KPIs)
2. ✅ Criar `TasksList` component
3. ✅ Criar `TaskFilters` component
4. ✅ Implementar paginação
5. ✅ Implementar busca textual
6. ✅ Atualizar página `/tarefas`
7. ✅ Testar todos os filtros

**Arquivos:**
- `src/components/tasks/tasks-stats.tsx` (~100 linhas)
- `src/components/tasks/tasks-list.tsx` (~250 linhas)
- `src/components/tasks/task-filters.tsx` (~200 linhas)
- `src/app/(app)/tarefas/page.tsx` (reescrever ~150 linhas)

---

### **FASE 5: Timeline do Cliente (2-3 horas)**

**Objetivo:** Implementar timeline de atividades

**Tasks:**
1. ✅ Criar `ClientTimelineSection` component
2. ✅ Criar `TimelineEvent` component
3. ✅ Implementar filtros por tipo
4. ✅ Implementar scroll infinito ou paginação
5. ✅ Integrar na página `/clientes/[id]`
6. ✅ Testar registro automático de eventos

**Arquivos:**
- `src/components/clients/client-timeline-section.tsx` (~200 linhas)
- `src/components/timeline/timeline-event.tsx` (~100 linhas)
- `src/app/(app)/clientes/[id]/page.tsx` (modificar)

---

### **FASE 6: Melhorias e Polimento (2-3 horas)**

**Objetivo:** Refinar UX e adicionar features extras

**Tasks:**
1. ✅ Adicionar notificações de tarefas próximas ao vencimento
2. ✅ Implementar atalhos de teclado
3. ✅ Melhorar responsividade mobile
4. ✅ Adicionar animações de transição
5. ✅ Criar documentação de uso
6. ✅ Testes de integração

---

## ⏱️ ESTIMATIVA TOTAL

**Tempo Total:** 16-22 horas (~3-4 dias de trabalho)

**Distribuição:**
- Infraestrutura: 2-3h
- Backend (Actions/Hooks): 3-4h
- Tarefas do Cliente: 3-4h
- Página de Tarefas: 4-5h
- Timeline: 2-3h
- Polimento: 2-3h

---

## 🎯 9. PRIORIZAÇÃO PARA USUÁRIO ÚNICO (CONTADOR)

### Simplificações Recomendadas

**1. Remover Atribuição de Tarefas**
- Campo `assigned_to` sempre será o próprio usuário
- Simplifica UI (sem seletor de usuário)
- Reduz complexidade

**2. Tipos de Tarefa Simplificados**
```typescript
type TaskType =
  | 'das'              // Cálculo de DAS
  | 'report'           // Relatório mensal
  | 'review'           // Revisão de lançamentos
  | 'meeting'          // Reunião com cliente
  | 'other';           // Outros
```

**3. Notificações Simples**
- Email diário com tarefas do dia
- Badge no ícone da sidebar
- Sem push notifications complexas

**4. Timeline Simplificada**
- Apenas eventos principais
- Sem detalhamento excessivo
- Foco em ações do usuário

---

## 🚀 10. PRÓXIMOS PASSOS RECOMENDADOS

### Ordem de Implementação Sugerida

**1º - Infraestrutura (FASE 1)**
- Preparar banco de dados
- Criar tipos e schemas
- **Motivo:** Base para tudo

**2º - Tarefas do Cliente (FASE 2 + 3)**
- Implementar actions e hooks
- Criar seção na página do cliente
- **Motivo:** Feature mais útil primeiro

**3º - Página de Tarefas (FASE 4)**
- Visão geral de todas as tarefas
- **Motivo:** Complementa a seção do cliente

**4º - Timeline (FASE 5)**
- Histórico de atividades
- **Motivo:** Feature "nice to have"

**5º - Polimento (FASE 6)**
- Melhorias de UX
- **Motivo:** Após funcionalidades core

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

### Tarefas do Cliente
- [ ] Usuário vê todas as tarefas do cliente
- [ ] Usuário pode filtrar por status
- [ ] Usuário pode criar tarefa vinculada ao cliente
- [ ] Usuário pode iniciar/concluir tarefa
- [ ] Usuário pode editar/excluir tarefa
- [ ] Indicadores visuais de prioridade e prazo funcionam
- [ ] Empty states apropriados

### Página de Tarefas
- [ ] Usuário vê todas as tarefas (todos os clientes)
- [ ] KPIs mostram estatísticas corretas
- [ ] Filtros funcionam (status, prioridade, cliente, prazo)
- [ ] Busca textual funciona
- [ ] Paginação funciona
- [ ] Usuário pode criar tarefa sem cliente
- [ ] Link para cliente funciona

### Timeline
- [ ] Usuário vê histórico cronológico
- [ ] Eventos são registrados automaticamente
- [ ] Filtros por tipo funcionam
- [ ] Scroll infinito ou paginação funciona
- [ ] Ícones e cores corretos por tipo
- [ ] Performance adequada (< 1s carregamento)

---

## 📚 REFERÊNCIAS

### Componentes Similares Existentes
- `ClientDocumentsSection` - Padrão de seção vinculada ao cliente
- `DocumentsTable` - Padrão de tabela com ações
- `PriorityTasksPanel` - Componente de tarefas no dashboard (mock)

### Bibliotecas Úteis
- `date-fns` - Manipulação de datas (já instalado)
- `@tanstack/react-query` - Cache e sincronização (já instalado)
- `zod` - Validação de schemas (já instalado)
- `sonner` - Toasts (já instalado)

### Padrões do Projeto
- Server Actions para mutações
- React Query para queries
- RLS para segurança
- shadcn/ui para componentes
- Zod para validação

---

**FIM DA ANÁLISE** ✅


