# 💻 Exemplos de Código: Tarefas e Timeline

**Complemento ao:** `ANALISE-TAREFAS-TIMELINE.md`

---

## 📋 1. MIGRATION: Adicionar client_id em tasks

**Arquivo:** `infra/migrations/023_add_tasks_client_id.sql`

```sql
-- Adicionar coluna client_id na tabela tasks
ALTER TABLE tasks 
ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX idx_tasks_client_id ON tasks(client_id);

-- Comentário explicativo
COMMENT ON COLUMN tasks.client_id IS 'Cliente vinculado à tarefa (opcional)';
```

---

## 📋 2. MIGRATION: Criar tabela client_timeline

**Arquivo:** `infra/migrations/024_create_client_timeline.sql`

```sql
-- Criar tabela de timeline de atividades do cliente
CREATE TABLE IF NOT EXISTS client_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Tipo e conteúdo do evento
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Relacionamentos opcionais (para rastreabilidade)
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  
  -- Auditoria
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_client_timeline_client_id ON client_timeline(client_id);
CREATE INDEX idx_client_timeline_created_at ON client_timeline(created_at DESC);
CREATE INDEX idx_client_timeline_event_type ON client_timeline(event_type);
CREATE INDEX idx_client_timeline_tenant_id ON client_timeline(tenant_id);

-- Habilitar RLS
ALTER TABLE client_timeline ENABLE ROW LEVEL SECURITY;

-- Política RLS: Usuários podem ver timeline do seu tenant
CREATE POLICY "Users can view timeline from their tenant" ON client_timeline
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Política RLS: Sistema pode inserir eventos
CREATE POLICY "System can insert timeline events" ON client_timeline
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

-- Comentários
COMMENT ON TABLE client_timeline IS 'Timeline de atividades relacionadas aos clientes';
COMMENT ON COLUMN client_timeline.event_type IS 'Tipo do evento (document_uploaded, task_completed, etc.)';
COMMENT ON COLUMN client_timeline.metadata IS 'Dados adicionais específicos do tipo de evento';
```

---

## 📋 3. SCHEMA ZOD: Validação de Tarefas

**Arquivo:** `src/schemas/task.schema.ts`

```typescript
import { z } from 'zod';

// Enums
export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const taskTypeSchema = z.enum([
  'reminder',
  'tax_obligation',
  'document_review',
  'client_meeting',
  'report_generation',
  'other',
]);

// Schema base de tarefa
export const baseTaskSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(255),
  description: z.string().optional(),
  type: taskTypeSchema,
  priority: taskPrioritySchema.default('medium'),
  status: taskStatusSchema.default('pending'),
  due_date: z.string().datetime().optional(),
  client_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
});

// Schema para criar tarefa
export const createTaskSchema = baseTaskSchema;

// Schema para atualizar tarefa
export const updateTaskSchema = baseTaskSchema.partial().extend({
  id: z.string().uuid(),
});

// Schema para filtros
export const taskFiltersSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  type: taskTypeSchema.optional(),
  client_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
  due_date_from: z.string().datetime().optional(),
  due_date_to: z.string().datetime().optional(),
  overdue: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

// Tipos TypeScript inferidos
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type TaskType = z.infer<typeof taskTypeSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;
```

---

## 📋 4. SERVER ACTION: getTasks

**Arquivo:** `src/actions/tasks.ts` (Parte 1)

```typescript
'use server';

import { requireAuth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase';
import { taskFiltersSchema } from '@/schemas/task.schema';
import type { TaskFiltersInput } from '@/schemas/task.schema';
import type { Task } from '@/types/tasks';

export async function getTasks(
  filters: Partial<TaskFiltersInput> = {}
): Promise<{ success: boolean; tasks?: Task[]; total?: number; error?: string }> {
  try {
    const session = await requireAuth();
    const supabase = await createServerClient();

    // Validar filtros
    const validated = taskFiltersSchema.parse({
      ...filters,
      page: filters.page || 1,
      pageSize: filters.pageSize || 20,
    });

    // Construir query base
    let query = supabase
      .from('tasks')
      .select(
        `
        *,
        client:clients(id, name),
        assigned_user:users!tasks_assigned_to_fkey(id, name),
        created_user:users!tasks_created_by_fkey(id, name)
      `,
        { count: 'exact' }
      );

    // Aplicar filtros
    if (validated.status) {
      query = query.eq('status', validated.status);
    }

    if (validated.priority) {
      query = query.eq('priority', validated.priority);
    }

    if (validated.type) {
      query = query.eq('type', validated.type);
    }

    if (validated.client_id) {
      query = query.eq('client_id', validated.client_id);
    }

    if (validated.assigned_to) {
      query = query.eq('assigned_to', validated.assigned_to);
    }

    if (validated.created_by) {
      query = query.eq('created_by', validated.created_by);
    }

    if (validated.due_date_from) {
      query = query.gte('due_date', validated.due_date_from);
    }

    if (validated.due_date_to) {
      query = query.lte('due_date', validated.due_date_to);
    }

    if (validated.overdue) {
      query = query.lt('due_date', new Date().toISOString().split('T')[0]);
      query = query.neq('status', 'completed');
    }

    if (validated.search) {
      query = query.or(
        `title.ilike.%${validated.search}%,description.ilike.%${validated.search}%`
      );
    }

    // Ordenação: prioridade > prazo > criação
    query = query
      .order('priority', { ascending: true }) // urgent=0, high=1, medium=2, low=3
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    // Paginação
    const from = (validated.page - 1) * validated.pageSize;
    const to = from + validated.pageSize - 1;
    query = query.range(from, to);

    // Executar query
    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar tarefas:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      tasks: data as Task[],
      total: count || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
```

---

## 📋 5. SERVER ACTION: createTask

**Arquivo:** `src/actions/tasks.ts` (Parte 2)

```typescript
import { revalidatePath } from 'next/cache';
import { createTaskSchema } from '@/schemas/task.schema';
import type { CreateTaskInput } from '@/schemas/task.schema';

export async function createTask(
  input: CreateTaskInput
): Promise<{ success: boolean; task?: Task; error?: string }> {
  try {
    const session = await requireAuth();
    const supabase = await createServerClient();

    // Validar input
    const validated = createTaskSchema.parse(input);

    // Inserir tarefa
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...validated,
        created_by: session.user.id,
        assigned_to: validated.assigned_to || session.user.id, // Auto-atribuir se não especificado
      })
      .select(
        `
        *,
        client:clients(id, name),
        assigned_user:users!tasks_assigned_to_fkey(id, name),
        created_user:users!tasks_created_by_fkey(id, name)
      `
      )
      .single();

    if (error) {
      console.error('Erro ao criar tarefa:', error);
      return { success: false, error: error.message };
    }

    // Revalidar caches
    revalidatePath('/tarefas');
    if (validated.client_id) {
      revalidatePath(`/clientes/${validated.client_id}`);
    }

    return { success: true, task: data as Task };
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
```

---

## 📋 6. SERVER ACTION: updateTaskStatus (Ação Rápida)

**Arquivo:** `src/actions/tasks.ts` (Parte 3)

```typescript
export async function updateTaskStatus(
  id: string,
  status: TaskStatus
): Promise<{ success: boolean; task?: Task; error?: string }> {
  try {
    const session = await requireAuth();
    const supabase = await createServerClient();

    // Preparar dados de atualização
    const updateData: any = { status };

    // Se concluindo, registrar timestamp
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    // Atualizar tarefa
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        client:clients(id, name),
        assigned_user:users!tasks_assigned_to_fkey(id, name),
        created_user:users!tasks_created_by_fkey(id, name)
      `
      )
      .single();

    if (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      return { success: false, error: error.message };
    }

    // Revalidar caches
    revalidatePath('/tarefas');
    if (data.client_id) {
      revalidatePath(`/clientes/${data.client_id}`);
    }

    return { success: true, task: data as Task };
  } catch (error) {
    console.error('Erro ao atualizar status da tarefa:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
```

---

## 📋 7. HOOK: useTasks

**Arquivo:** `src/hooks/use-tasks.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
} from '@/actions/tasks';
import type { TaskFiltersInput, CreateTaskInput, UpdateTaskInput } from '@/schemas/task.schema';
import type { TaskStatus } from '@/types/tasks';

// ============================================
// QUERY KEYS
// ============================================
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Partial<TaskFiltersInput>) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  stats: () => [...taskKeys.all, 'stats'] as const,
};

// ============================================
// HOOK: useTasks (Listagem com Filtros)
// ============================================
export function useTasks(filters: Partial<TaskFiltersInput> = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => getTasks(filters),
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ============================================
// HOOK: useCreateTask
// ============================================
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidar todas as listas de tarefas
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
        toast.success('Tarefa criada com sucesso');
      } else {
        toast.error(result.error || 'Erro ao criar tarefa');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar tarefa');
    },
  });
}

// ============================================
// HOOK: useUpdateTaskStatus (Ação Rápida)
// ============================================
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(id, status),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
        
        const statusMessages = {
          pending: 'Tarefa marcada como pendente',
          in_progress: 'Tarefa iniciada',
          completed: 'Tarefa concluída! 🎉',
          cancelled: 'Tarefa cancelada',
        };
        
        toast.success(statusMessages[result.task!.status]);
      } else {
        toast.error(result.error || 'Erro ao atualizar tarefa');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar tarefa');
    },
  });
}
```

---

## 📋 8. COMPONENTE: TaskCard

**Arquivo:** `src/components/tasks/task-card.tsx`

```typescript
'use client';

import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/tasks';

interface TaskCardProps {
  task: Task;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showClient?: boolean;
}

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800 border-red-300' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  medium: { label: 'Média', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  low: { label: 'Baixa', color: 'bg-green-100 text-green-800 border-green-300' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
};

export function TaskCard({
  task,
  onStart,
  onComplete,
  onEdit,
  onDelete,
  showClient = false,
}: TaskCardProps) {
  // Calcular status do prazo
  const getDueDateStatus = () => {
    if (!task.due_date) return null;
    
    const dueDate = new Date(task.due_date);
    const daysUntil = differenceInDays(dueDate, new Date());
    
    if (daysUntil < 0) {
      return { label: 'Atrasada', color: 'text-red-600', icon: AlertTriangle, urgent: true };
    }
    if (daysUntil === 0) {
      return { label: 'Hoje', color: 'text-red-600', icon: AlertTriangle, urgent: true };
    }
    if (daysUntil <= 2) {
      return { label: `${daysUntil}d`, color: 'text-orange-600', icon: Clock, urgent: true };
    }
    if (daysUntil <= 7) {
      return { label: `${daysUntil}d`, color: 'text-yellow-600', icon: Clock, urgent: false };
    }
    return { 
      label: format(dueDate, 'dd/MM', { locale: ptBR }), 
      color: 'text-muted-foreground', 
      icon: Clock, 
      urgent: false 
    };
  };

  const dueDateStatus = getDueDateStatus();
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const statusConfig = STATUS_CONFIG[task.status];

  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      dueDateStatus?.urgent && 'border-l-4 border-l-red-500'
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-1 truncate">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <Badge className={priorityConfig.color} variant="outline">
            {priorityConfig.label}
          </Badge>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
          <Badge className={statusConfig.color} variant="secondary">
            {statusConfig.label}
          </Badge>
          
          {dueDateStatus && (
            <div className={cn('flex items-center gap-1', dueDateStatus.color)}>
              <dueDateStatus.icon className="h-4 w-4" />
              <span className="font-medium">{dueDateStatus.label}</span>
            </div>
          )}
          
          {showClient && task.client && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{task.client.name}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {task.status === 'pending' && onStart && (
            <Button size="sm" variant="default" onClick={() => onStart(task.id)}>
              Iniciar
            </Button>
          )}
          
          {task.status === 'in_progress' && onComplete && (
            <Button size="sm" variant="default" onClick={() => onComplete(task.id)}>
              Concluir
            </Button>
          )}
          
          {onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(task.id)}>
              Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

**Continua em:** `EXEMPLOS-CODIGO-TAREFAS-PARTE-2.md`


