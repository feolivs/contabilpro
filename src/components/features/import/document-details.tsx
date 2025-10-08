'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, FileText, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface DocumentDetailsProps {
  documentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocumentDetails({ documentId, open, onOpenChange }: DocumentDetailsProps) {
  const supabase = createClient()

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          clients:client_id (
            id,
            name,
            cnpj
          )
        `)
        .eq('id', documentId)
        .single()

      if (error) throw error
      return data
    },
    enabled: open && !!documentId,
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-destructive" />
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      processing: 'Processando',
      completed: 'Concluído',
      failed: 'Falhou',
    }
    return labels[status] || status
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      nfe: 'Nota Fiscal Eletrônica (NF-e)',
      nfse: 'Nota Fiscal de Serviços Eletrônica (NFSe)',
      nfce: 'Nota Fiscal de Consumidor Eletrônica (NFC-e)',
      ofx: 'Extrato Bancário (OFX)',
      payroll: 'Folha de Pagamento',
    }
    return labels[type] || type
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Documento
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre o documento importado
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : document ? (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(document.status)}
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">
                    {getStatusLabel(document.status)}
                  </p>
                </div>
              </div>
              <Badge variant={document.status === 'completed' ? 'outline' : document.status === 'failed' ? 'destructive' : 'default'}>
                {getStatusLabel(document.status)}
              </Badge>
            </div>

            <Separator />

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Arquivo</p>
                <p className="text-sm mt-1">{document.filename}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                <p className="text-sm mt-1">{getTypeLabel(document.type)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                <p className="text-sm mt-1">{document.clients?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                <p className="text-sm mt-1">{document.clients?.cnpj || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tamanho</p>
                <p className="text-sm mt-1">
                  {document.file_size ? `${(document.file_size / 1024).toFixed(2)} KB` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo MIME</p>
                <p className="text-sm mt-1">{document.mime_type || 'N/A'}</p>
              </div>
            </div>

            <Separator />

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Upload</p>
                <p className="text-sm mt-1">
                  {format(new Date(document.uploaded_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              {document.processed_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Processamento</p>
                  <p className="text-sm mt-1">
                    {format(new Date(document.processed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {document.status === 'failed' && document.error_message && (
              <>
                <Separator />
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro no Processamento</AlertTitle>
                  <AlertDescription className="mt-2">
                    {document.error_message}
                  </AlertDescription>
                </Alert>
              </>
            )}

            {/* Metadata */}
            {document.metadata && Object.keys(document.metadata).length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-3">Informações Adicionais</p>
                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    {Object.entries(document.metadata as Record<string, any>).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Storage Path */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Caminho de Armazenamento</p>
              <p className="text-xs mt-1 font-mono bg-muted p-2 rounded">
                {document.storage_path}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Documento não encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

