import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTasksStats,
} from '@/actions/tasks';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  TaskFiltersInput,
} from '@/schemas/task.schema';

// ============================================
// QUERY KEYS
// ============================================
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Partial<TaskFiltersInput>) =>
    [...taskKeys.lists(), filters] as const,
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
    queryFn: async () => {
      const result = await getTasks(filters);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar tarefas');
      }
      return result.data;
    },
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ============================================
// HOOK: useTask (Buscar por ID)
// ============================================
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const result = await getTaskById(id);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar tarefa');
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// ============================================
// HOOK: useTasksStats (Estatísticas)
// ============================================
export function useTasksStats() {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: async () => {
      const result = await getTasksStats();
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar estatísticas');
      }
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000,
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
        // Invalidar todas as listas e estatísticas
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
        queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
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
// HOOK: useUpdateTask
// ============================================
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTaskInput) => updateTask(input),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidar listas, detalhe específico e estatísticas
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: taskKeys.detail(variables.id),
        });
        queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
        toast.success('Tarefa atualizada com sucesso');
      } else {
        toast.error(result.error || 'Erro ao atualizar tarefa');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar tarefa');
    },
  });
}

// ============================================
// HOOK: useDeleteTask
// ============================================
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidar todas as listas e estatísticas
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
        queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
        toast.success('Tarefa deletada com sucesso');
      } else {
        toast.error(result.error || 'Erro ao deletar tarefa');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao deletar tarefa');
    },
  });
}

// ============================================
// HOOK: useUpdateTaskStatus (Ação Rápida)
// ============================================
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTaskStatusInput) => updateTaskStatus(input),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidar listas, detalhe específico e estatísticas
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: taskKeys.detail(variables.id),
        });
        queryClient.invalidateQueries({ queryKey: taskKeys.stats() });

        // Mensagem customizada por status
        const messages = {
          pending: 'Tarefa marcada como pendente',
          in_progress: 'Tarefa iniciada',
          completed: 'Tarefa concluída! 🎉',
          cancelled: 'Tarefa cancelada',
        };
        toast.success(messages[variables.status] || 'Status atualizado');
      } else {
        toast.error(result.error || 'Erro ao atualizar status');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });
}

