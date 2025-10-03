import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getClientTimeline, logTimelineEvent } from '@/actions/timeline';
import type { TimelineFilters, TimelineCategory, ClientTimelineEvent, TimelineEventType } from '@/types/timeline';

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
interface UseClientTimelineOptions {
  category?: TimelineCategory;
  limit?: number;
}

export function useClientTimeline(
  clientId: string,
  options: UseClientTimelineOptions = {}
) {
  const { category, limit = 20 } = options;

  // Construir filtros baseado na categoria
  const getEventTypes = (cat?: TimelineCategory): TimelineEventType[] | undefined => {
    if (!cat) return undefined;

    const categoryMap: Record<TimelineCategory, TimelineEventType[]> = {
      documents: ['document_uploaded', 'document_deleted'],
      tasks: ['task_created', 'task_started', 'task_completed', 'task_cancelled', 'task_updated'],
      entries: ['entry_created', 'entry_updated'],
      other: ['client_updated', 'note_added'],
    };

    return categoryMap[cat];
  };

  const filters: TimelineFilters = {
    client_id: clientId,
    event_type: getEventTypes(category),
    pageSize: limit,
  };

  const query = useQuery({
    queryKey: timelineKeys.list(filters),
    queryFn: async () => {
      const result = await getClientTimeline(filters);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar timeline');
      }
      return result.data;
    },
    enabled: !!clientId,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    events: (query.data?.events || []) as ClientTimelineEvent[],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    error: query.error,
    hasMore: (query.data?.events?.length || 0) < (query.data?.total || 0),
    loadMore: () => {
      // Implementação simples - pode ser melhorada com paginação real
      console.log('Load more not fully implemented yet');
    },
    isLoadingMore: false,
  };
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

