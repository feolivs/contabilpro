import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Tables } from '@/lib/supabase/database.types'

type Document = Tables<'documents'>

interface UseDocumentsFilters {
  clientId?: string
  type?: string
  status?: string
}

export function useDocuments(filters?: UseDocumentsFilters) {
  const { user } = useAuthStore()
  const supabase = createClient()

  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from('documents')
        .select(`
          *,
          clients:client_id (
            id,
            name,
            cnpj
          )
        `)
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })

      // Apply filters
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId)
      }
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) throw error
      return data as (Document & { clients: { id: string; name: string; cnpj: string } })[]
    },
    enabled: !!user,
  })
}

export function useDocumentStats(clientId?: string) {
  const { user } = useAuthStore()
  const supabase = createClient()

  return useQuery({
    queryKey: ['document-stats', clientId],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from('documents')
        .select('status, type')
        .eq('user_id', user.id)

      if (clientId) {
        query = query.eq('client_id', clientId)
      }

      const { data, error } = await query

      if (error) throw error

      // Calculate stats
      const total = data.length
      const completed = data.filter((d) => d.status === 'completed').length
      const failed = data.filter((d) => d.status === 'failed').length
      const processing = data.filter((d) => d.status === 'processing').length
      const pending = data.filter((d) => d.status === 'pending').length

      const byType = data.reduce((acc, doc) => {
        acc[doc.type] = (acc[doc.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        total,
        completed,
        failed,
        processing,
        pending,
        byType,
        successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    },
    enabled: !!user,
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (documentId: string) => {
      // 1. Get document to get storage path
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('storage_path')
        .eq('id', documentId)
        .single()

      if (fetchError) throw fetchError

      // 2. Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.storage_path])

      if (storageError) {
        console.error('Failed to delete from storage:', storageError)
        // Continue anyway - database cleanup is more important
      }

      // 3. Delete from database (cascade will delete related records)
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (deleteError) throw deleteError

      return documentId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document-stats'] })
    },
  })
}

export function useReprocessDocument() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ documentId, clientId, type }: { documentId: string; clientId: string; type: string }) => {
      // 1. Update document status to pending
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'pending',
          error_message: null,
          processed_at: null,
        })
        .eq('id', documentId)

      if (updateError) throw updateError

      // 2. Trigger Edge Function
      const edgeFunctionName = type === 'ofx' ? 'parse-ofx' : 'parse-xml'
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      const response = await fetch(
        `${supabaseUrl}/functions/v1/${edgeFunctionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            documentId,
            clientId,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Reprocessing failed')
      }

      return documentId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document-stats'] })
    },
  })
}

