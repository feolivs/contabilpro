'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, RefreshCw, Trash2, Eye, Loader2 } from 'lucide-react'
import { useDocuments, useDeleteDocument, useReprocessDocument } from '@/hooks/use-documents'
import { toast } from 'sonner'
import { DocumentDetails } from './document-details'

interface DocumentsTableProps {
  clientId?: string
  type?: string
  status?: string
}

export function DocumentsTable({ clientId, type, status }: DocumentsTableProps) {
  const { data: documents, isLoading } = useDocuments({ clientId, type, status })
  const deleteDocument = useDeleteDocument()
  const reprocessDocument = useReprocessDocument()
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!documentToDelete) return

    try {
      await deleteDocument.mutateAsync(documentToDelete)
      toast.success('Documento excluído com sucesso')
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    } catch (error) {
      toast.error(`Erro ao excluir documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const handleReprocess = async (documentId: string, clientId: string, type: string) => {
    try {
      await reprocessDocument.mutateAsync({ documentId, clientId, type })
      toast.success('Documento reenviado para processamento')
    } catch (error) {
      toast.error(`Erro ao reprocessar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Pendente' },
      processing: { variant: 'default', label: 'Processando' },
      completed: { variant: 'outline', label: 'Concluído' },
      failed: { variant: 'destructive', label: 'Falhou' },
    }

    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      nfe: 'NF-e',
      nfse: 'NFSe',
      nfce: 'NFC-e',
      ofx: 'OFX',
      payroll: 'Folha',
    }

    return <Badge variant="outline">{labels[type] || type}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum documento encontrado</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Arquivo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Upload</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {doc.filename}
                </TableCell>
                <TableCell>{doc.clients?.name || 'N/A'}</TableCell>
                <TableCell>{getTypeBadge(doc.type)}</TableCell>
                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                <TableCell>
                  {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(doc.uploaded_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedDocumentId(doc.id)
                          setDetailsOpen(true)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      {(doc.status === 'failed' || doc.status === 'completed') && (
                        <DropdownMenuItem
                          onClick={() => handleReprocess(doc.id, doc.client_id, doc.type)}
                          disabled={reprocessDocument.isPending}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reprocessar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          setDocumentToDelete(doc.id)
                          setDeleteDialogOpen(true)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
              O arquivo será removido do armazenamento e todos os dados relacionados serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDocument.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Details Dialog */}
      {selectedDocumentId && (
        <DocumentDetails
          documentId={selectedDocumentId}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </>
  )
}

