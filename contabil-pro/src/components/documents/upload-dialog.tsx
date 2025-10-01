'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { generateUploadPath, registerUploadedDocument } from '@/actions/documents';
import { getClientsForDropdown } from '@/actions/clients-simple';
import { calculateFileHash, uploadToStorage } from '@/lib/upload-helper';
import type { DocumentType } from '@/types/document.types';
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from '@/schemas/document.schema';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

interface UploadResult {
  file: string;
  success: boolean;
  error?: string;
  duplicate?: boolean;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'nfe', label: 'Nota Fiscal Eletrônica (NFe)' },
  { value: 'nfse', label: 'Nota Fiscal de Serviço (NFSe)' },
  { value: 'receipt', label: 'Recibo' },
  { value: 'invoice', label: 'Fatura' },
  { value: 'contract', label: 'Contrato' },
  { value: 'other', label: 'Outro' },
];

export function UploadDialog({ open, onOpenChange, onUploadComplete }: UploadDialogProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [type, setType] = useState<DocumentType>('other');
  const [clientId, setClientId] = useState<string>('');
  const [clients, setClients] = useState<Array<{
    id: string;
    name: string;
    document: string;
    document_type: string;
  }>>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [progress, setProgress] = useState(0);

  // Carregar clientes quando o dialog abrir
  useEffect(() => {
    if (open && clients.length === 0) {
      loadClients();
    }
  }, [open]);

  const loadClients = async () => {
    setLoadingClients(true);
    const result = await getClientsForDropdown();
    if (result.success) {
      setClients(result.clients);
    }
    setLoadingClients(false);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setResults([]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 10,
    maxSize: MAX_FILE_SIZE,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/xml': ['.xml'],
      'text/xml': ['.xml'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setResults([]);
    setProgress(0);

    const uploadResults: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // 1. Calcular hash do arquivo (client-side)
        const hash = await calculateFileHash(file);

        // 2. Gerar path no servidor
        const pathResult = await generateUploadPath(file.name, hash, type);
        if (!pathResult.success || !pathResult.path) {
          uploadResults.push({
            file: file.name,
            success: false,
            error: pathResult.error || 'Erro ao gerar path',
          });
          continue;
        }

        // 3. Upload direto ao Storage (client-side, sem limite de 1MB)
        const uploadResult = await uploadToStorage(file, pathResult.path);
        if (!uploadResult.success) {
          uploadResults.push({
            file: file.name,
            success: false,
            error: uploadResult.error || 'Erro no upload',
          });
          continue;
        }

        // 4. Registrar metadados no banco
        const registerResult = await registerUploadedDocument({
          name: file.name,
          path: pathResult.path,
          hash,
          size: file.size,
          mime_type: file.type,
          type,
          client_id: clientId || undefined, // ✨ Vincular cliente se selecionado
        });

        uploadResults.push({
          file: file.name,
          success: registerResult.success,
          error: registerResult.error,
          duplicate: registerResult.duplicate,
        });
      } catch (error) {
        uploadResults.push({
          file: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }

      setProgress(((i + 1) / files.length) * 100);
    }

    setResults(uploadResults);
    setUploading(false);

    // Se todos foram bem-sucedidos, fechar após 2s
    if (uploadResults.every((r) => r.success)) {
      setTimeout(() => {
        onOpenChange(false);
        setFiles([]);
        setResults([]);
        onUploadComplete?.(); // Chamar callback para recarregar lista
      }, 2000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload de Documentos</DialogTitle>
          <DialogDescription>
            Arraste arquivos ou clique para selecionar. Máximo: 10 arquivos, 50MB cada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de Documento */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Documento</Label>
            <Select value={type} onValueChange={(value) => setType(value as DocumentType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((docType) => (
                  <SelectItem key={docType.value} value={docType.value}>
                    {docType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cliente (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="client">
              Cliente (Opcional)
              {loadingClients && (
                <Loader2 className="inline-block ml-2 h-3 w-3 animate-spin" />
              )}
            </Label>
            <Select
              value={clientId || 'none'}
              onValueChange={(value) => setClientId(value === 'none' ? '' : value)}
              disabled={loadingClients}
            >
              <SelectTrigger id="client">
                <SelectValue placeholder="Selecione um cliente..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Nenhum (vincular depois)</span>
                </SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {client.document_type === 'cpf' ? 'CPF' : 'CNPJ'}: {client.document}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clientId && (
              <p className="text-xs text-muted-foreground">
                ✓ Documento será vinculado ao cliente selecionado
              </p>
            )}
          </div>

          {/* Dropzone */}
          {files.length === 0 && (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                hover:border-primary hover:bg-primary/5
              `}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'Solte os arquivos aqui...'
                  : 'Arraste arquivos ou clique para selecionar'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Formatos: {ALLOWED_EXTENSIONS.join(', ').toUpperCase()}
              </p>
            </div>
          )}

          {/* Lista de Arquivos */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Arquivos Selecionados ({files.length})</Label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',');
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files) {
                      setFiles((prev) => [...prev, ...Array.from(target.files!)]);
                    }
                  };
                  input.click();
                }}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Adicionar Mais
              </Button>
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enviando...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Resultados */}
          {results.length > 0 && (
            <div className="space-y-2">
              <Label>Resultados</Label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      result.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.file}</p>
                      {result.duplicate && (
                        <p className="text-xs text-muted-foreground">Arquivo duplicado (já existe)</p>
                      )}
                      {result.error && (
                        <p className="text-xs text-red-600 dark:text-red-400">{result.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={files.length === 0 || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar {files.length > 0 && `(${files.length})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

