'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useDocumentUpload } from '@/hooks/use-document-upload'
import { useClientStore } from '@/stores/client-store'
import { toast } from 'sonner'

interface FileUploadZoneProps {
  documentType: 'nfe' | 'nfse' | 'nfce' | 'ofx' | 'payroll'
  acceptedFileTypes: Record<string, string[]>
  maxSize: number
  description: string
}

export function FileUploadZone({
  documentType,
  acceptedFileTypes,
  maxSize,
  description,
}: FileUploadZoneProps) {
  const { selectedClient } = useClientStore()
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map())
  const { uploadDocument } = useDocumentUpload()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!selectedClient) {
        toast.error('Selecione um cliente primeiro')
        return
      }

      for (const file of acceptedFiles) {
        const fileId = `${file.name}-${Date.now()}`
        
        try {
          // Add to uploading files
          setUploadingFiles((prev) => new Map(prev).set(fileId, 0))

          // Upload file
          await uploadDocument({
            file,
            clientId: selectedClient.id,
            documentType,
            onProgress: (progress) => {
              setUploadingFiles((prev) => new Map(prev).set(fileId, progress))
            },
          })

          // Remove from uploading files
          setUploadingFiles((prev) => {
            const newMap = new Map(prev)
            newMap.delete(fileId)
            return newMap
          })

          toast.success(`${file.name} enviado com sucesso!`)
        } catch (error) {
          setUploadingFiles((prev) => {
            const newMap = new Map(prev)
            newMap.delete(fileId)
            return newMap
          })

          toast.error(`Erro ao enviar ${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        }
      }
    },
    [selectedClient, documentType, uploadDocument]
  )

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections,
  } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize,
    multiple: true,
  })

  const hasUploadingFiles = uploadingFiles.size > 0

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-12 text-center transition-colors cursor-pointer',
          isDragActive && !isDragReject && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          !isDragActive && 'border-muted-foreground/25 hover:border-muted-foreground/50',
          hasUploadingFiles && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {isDragActive && !isDragReject ? (
            <>
              <Upload className="h-12 w-12 text-primary" />
              <div>
                <p className="text-lg font-medium">Solte os arquivos aqui</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Os arquivos serão enviados automaticamente
                </p>
              </div>
            </>
          ) : isDragReject ? (
            <>
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <p className="text-lg font-medium text-destructive">Arquivo não suportado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Verifique o tipo e tamanho do arquivo
                </p>
              </div>
            </>
          ) : (
            <>
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">{description}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tamanho máximo: {(maxSize / 1024 / 1024).toFixed(0)}MB
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm">
                Selecionar Arquivos
              </Button>
            </>
          )}
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-destructive">
                Alguns arquivos não puderam ser enviados:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {fileRejections.map(({ file, errors }) => (
                  <li key={file.name}>
                    <strong>{file.name}</strong>:{' '}
                    {errors.map((e) => e.message).join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Files */}
      {hasUploadingFiles && (
        <div className="space-y-3">
          {Array.from(uploadingFiles.entries()).map(([fileId, progress]) => {
            const fileName = fileId.split('-')[0]
            return (
              <div
                key={fileId}
                className="rounded-lg border bg-card p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {progress === 100 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {progress === 100 ? 'Processando...' : 'Enviando...'}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )
          })}
        </div>
      )}

      {/* Client Warning */}
      {!selectedClient && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Nenhum cliente selecionado
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                Selecione um cliente antes de fazer upload de documentos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

