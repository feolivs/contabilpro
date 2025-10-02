import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getClientTimeline, logTimelineEvent } from '@/actions/timeline';
import type { TimelineFilters } from '@/types/timeline';

// ============================================
// QUERY KEYS
// ============================================
export const timelineKeys = {
  all: ['timeline'] as const,
  lists: () => [...timelineKeys.all, 'list'] as const,
  list: (filters: Partial<TimelineFilters>) =>
    [...timelineKeys.lists(), filters] as const,
};

// ============================================
// HOOK: useClientTimeline (Timeline do Cliente)
// ============================================
export function useClientTimeline(filters: TimelineFilters) {
  return useQuery({
    queryKey: timelineKeys.list(filters),
    queryFn: async () => {
      const result = await getClientTimeline(filters);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar timeline');
      }
      return result.data;
    },
    enabled: !!filters.client_id, // Só executar se tiver client_id
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ============================================
// HOOK: useLogTimelineEvent (Registrar Evento Manual)
// ============================================
export function useLogTimelineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      client_id: string;
      event_type: string;
      title: string;
      description?: string;
      metadata?: Record<string, any>;
    }) => logTimelineEvent(input),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidar timeline do cliente específico
        queryClient.invalidateQueries({
          queryKey: timelineKeys.lists(),
        });
        toast.success('Evento registrado com sucesso');
      } else {
        toast.error(result.error || 'Erro ao registrar evento');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao registrar evento');
    },
  });
}

