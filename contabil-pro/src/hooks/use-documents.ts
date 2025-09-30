import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getDocuments,
  deleteDocument,
  updateDocument,
  getDocumentDownloadUrl,
} from '@/actions/documents';
import type { DocumentFiltersInput } from '@/schemas/document.schema';
import type { UpdateDocumentInput } from '@/schemas/document.schema';

// ============================================
// QUERY KEYS
// ============================================
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: Partial<DocumentFiltersInput>) =>
    [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

// ============================================
// HOOK: useDocuments (Listagem com Filtros)
// ============================================
export function useDocuments(filters: Partial<DocumentFiltersInput> = {}) {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: () => getDocuments(filters),
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ============================================
// HOOK: useDeleteDocument
// ============================================
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidar todas as listas de documentos
        queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
        toast.success('Documento deletado com sucesso');
      } else {
        toast.error(result.error || 'Erro ao deletar documento');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao deletar documento');
    },
  });
}

// ============================================
// HOOK: useUpdateDocument
// ============================================
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDocumentInput) => updateDocument(input),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidar listas e detalhe específico
        queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: documentKeys.detail(variables.id),
        });
        toast.success('Documento atualizado com sucesso');
      } else {
        toast.error(result.error || 'Erro ao atualizar documento');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar documento');
    },
  });
}

// ============================================
// HOOK: useDocumentDownloadUrl
// ============================================
export function useDocumentDownloadUrl() {
  return useMutation({
    mutationFn: (documentId: string) => getDocumentDownloadUrl(documentId),
    onSuccess: (result) => {
      if (result.success && result.url) {
        // Abrir em nova aba
        window.open(result.url, '_blank');
      } else {
        toast.error(result.error || 'Erro ao gerar URL de download');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao baixar documento');
    },
  });
}

// ============================================
// HOOK: useInvalidateDocuments
// ============================================
export function useInvalidateDocuments() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
  };
}

