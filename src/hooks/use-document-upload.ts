import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

interface UploadDocumentParams {
  file: File
  clientId: string
  documentType: 'nfe' | 'nfse' | 'nfce' | 'ofx' | 'payroll'
  onProgress?: (progress: number) => void
}

interface DocumentUploadResult {
  documentId: string
  storagePath: string
}

export function useDocumentUpload() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const supabase = createClient()

  const uploadDocument = async ({
    file,
    clientId,
    documentType,
    onProgress,
  }: UploadDocumentParams): Promise<DocumentUploadResult> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    // 1. Generate storage path: {user_id}/{client_id}/{type}/{filename}
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${user.id}/${clientId}/${documentType}/${timestamp}_${sanitizedFileName}`

    // 2. Upload file to Supabase Storage
    onProgress?.(10)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    onProgress?.(50)

    // 3. Create document metadata in database
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        client_id: clientId,
        user_id: user.id,
        type: documentType,
        filename: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending',
      })
      .select()
      .single()

    if (docError) {
      // Cleanup: delete uploaded file if database insert fails
      await supabase.storage.from('documents').remove([storagePath])
      throw new Error(`Database insert failed: ${docError.message}`)
    }

    onProgress?.(75)

    // 4. Trigger Edge Function for processing
    const edgeFunctionName = documentType === 'ofx' ? 'parse-ofx' : 'parse-xml'
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/${edgeFunctionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            documentId: document.id,
            clientId,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Edge Function call failed')
      }

      onProgress?.(100)

      return {
        documentId: document.id,
        storagePath,
      }
    } catch (error) {
      // Update document status to failed if Edge Function call fails
      await supabase
        .from('documents')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', document.id)

      throw error
    }
  }

  const mutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      // Invalidate documents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  return {
    uploadDocument: mutation.mutateAsync,
    isUploading: mutation.isPending,
    error: mutation.error,
  }
}

