'use client'

import { useMemo, useState } from 'react'

import { DocumentsTable } from '@/components/documents/documents-table'
import { UploadDialog } from '@/components/documents/upload-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDocuments } from '@/hooks/use-documents'
import type { DocumentType } from '@/types/document.types'

import { FileText, Loader2, Upload } from 'lucide-react'

interface ClientDocumentsSectionProps {
  clientId: string
  clientName: string
}

export function ClientDocumentsSection({ clientId, clientName }: ClientDocumentsSectionProps) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<DocumentType | 'all'>('all')

  // Buscar documentos do cliente
  const { data, isLoading, error } = useDocuments({
    client_id: clientId,
    page: currentPage,
    pageSize: 10,
  })

  // Calcular contadores por tipo
  const counts = useMemo(() => {
    if (!data?.documents) return {}

    return data.documents.reduce(
      (acc, doc) => {
        const type = doc.type || 'other'
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }, [data?.documents])

  // Filtrar documentos por tab ativa
  const filteredDocuments = useMemo(() => {
    if (!data?.documents) return []
    if (activeTab === 'all') return data.documents
    return data.documents.filter(doc => (doc.type || 'other') === activeTab)
  }, [data?.documents, activeTab])

  // Handler para quando upload completar
  const handleUploadComplete = () => {
    setUploadOpen(false)
    // React Query invalida automaticamente o cache
  }

  // Loading State
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <FileText className='h-5 w-5 text-muted-foreground' />
              <CardTitle>Documentos do Cliente</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-12'>
            <Loader2 className='h-8 w-8 text-muted-foreground animate-spin mb-4' />
            <p className='text-sm text-muted-foreground'>Carregando documentos...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error State
  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <FileText className='h-5 w-5 text-muted-foreground' />
              <CardTitle>Documentos do Cliente</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <FileText className='h-12 w-12 text-destructive mb-4' />
            <h3 className='text-lg font-semibold mb-2'>Erro ao carregar documentos</h3>
            <p className='text-sm text-muted-foreground mb-4'>
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
            <Button variant='outline' onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalDocuments = data?.total || 0
  const documents = data?.documents || []

  // Empty State
  if (totalDocuments === 0) {
    return (
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <FileText className='h-5 w-5 text-muted-foreground' />
              <CardTitle>Documentos do Cliente</CardTitle>
              <Badge variant='secondary'>0</Badge>
            </div>
            <Button onClick={() => setUploadOpen(true)} size='sm'>
              <Upload className='mr-2 h-4 w-4' />
              Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='rounded-full bg-muted p-4 mb-4'>
              <FileText className='h-8 w-8 text-muted-foreground' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>Nenhum documento vinculado</h3>
            <p className='text-sm text-muted-foreground mb-6 max-w-sm'>
              Faça upload de documentos para vincular ao cliente <strong>{clientName}</strong>
            </p>
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className='mr-2 h-4 w-4' />
              Upload Documento
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Success State (com documentos)
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <FileText className='h-5 w-5 text-muted-foreground' />
            <CardTitle>Documentos do Cliente</CardTitle>
            <Badge variant='secondary'>{totalDocuments}</Badge>
          </div>
          <Button onClick={() => setUploadOpen(true)} size='sm'>
            <Upload className='mr-2 h-4 w-4' />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as DocumentType | 'all')}>
          <TabsList className='w-full justify-start overflow-x-auto flex-wrap h-auto'>
            <TabsTrigger value='all' className='gap-2'>
              Todos
              <Badge variant='secondary' className='ml-1'>
                {totalDocuments}
              </Badge>
            </TabsTrigger>

            {counts.nfe && (
              <TabsTrigger value='nfe' className='gap-2'>
                NFe
                <Badge variant='secondary' className='ml-1'>
                  {counts.nfe}
                </Badge>
              </TabsTrigger>
            )}

            {counts.nfse && (
              <TabsTrigger value='nfse' className='gap-2'>
                NFSe
                <Badge variant='secondary' className='ml-1'>
                  {counts.nfse}
                </Badge>
              </TabsTrigger>
            )}

            {counts.receipt && (
              <TabsTrigger value='receipt' className='gap-2'>
                Recibos
                <Badge variant='secondary' className='ml-1'>
                  {counts.receipt}
                </Badge>
              </TabsTrigger>
            )}

            {counts.invoice && (
              <TabsTrigger value='invoice' className='gap-2'>
                Faturas
                <Badge variant='secondary' className='ml-1'>
                  {counts.invoice}
                </Badge>
              </TabsTrigger>
            )}

            {counts.contract && (
              <TabsTrigger value='contract' className='gap-2'>
                Contratos
                <Badge variant='secondary' className='ml-1'>
                  {counts.contract}
                </Badge>
              </TabsTrigger>
            )}

            {counts.other && (
              <TabsTrigger value='other' className='gap-2'>
                Outros
                <Badge variant='secondary' className='ml-1'>
                  {counts.other}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value={activeTab} className='mt-4'>
            {filteredDocuments.length === 0 ? (
              <div className='text-center py-8'>
                <p className='text-sm text-muted-foreground'>
                  Nenhum documento do tipo <strong>{getTypeLabel(activeTab)}</strong> encontrado
                </p>
              </div>
            ) : (
              <DocumentsTable
                documents={filteredDocuments}
                totalCount={filteredDocuments.length}
                currentPage={1}
                pageSize={filteredDocuments.length}
                onPageChange={() => {}}
                onPageSizeChange={() => {}}
                hideClientColumn={true}
                showUnlinkAction={true}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={handleUploadComplete}
        defaultValues={{
          client_id: clientId,
        }}
      />
    </Card>
  )
}

// Helper para labels dos tipos
function getTypeLabel(type: DocumentType | 'all'): string {
  const labels: Record<DocumentType | 'all', string> = {
    all: 'Todos',
    nfe: 'NFe',
    nfse: 'NFSe',
    receipt: 'Recibo',
    invoice: 'Fatura',
    contract: 'Contrato',
    other: 'Outro',
  }
  return labels[type] || type
}
