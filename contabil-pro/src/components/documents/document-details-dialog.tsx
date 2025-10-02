'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FileText, X, Download, Loader2, Eye, Sparkles, Brain, Lightbulb, Building2, User, Calendar, DollarSign, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DocumentWithRelations } from '@/types/document.types';
import { useDocumentDownloadUrl, useDocumentViewUrl } from '@/hooks/use-documents';
import { formatBytes, formatDate } from '@/lib/utils';
import { translateToAccountingLanguage } from '@/actions/documents';

// Importação dinâmica para evitar SSR do react-pdf
const PDFPreviewDialog = dynamic(
  () => import('./pdf-preview-dialog').then((mod) => ({ default: mod.PDFPreviewDialog })),
  { ssr: false }
);

interface DocumentDetailsDialogProps {
  document: DocumentWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentDetailsDialog({
  document,
  open,
  onOpenChange,
}: DocumentDetailsDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [accountingTranslation, setAccountingTranslation] = useState<{
    explanation: string;
    suggestions: string[];
  } | null>(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const downloadMutation = useDocumentDownloadUrl();
  const viewMutation = useDocumentViewUrl();

  // Carregar tradução contábil quando o documento tiver dados extraídos
  useEffect(() => {
    if (document?.type && document?.metadata && Object.keys(document.metadata).length > 0) {
      setLoadingTranslation(true);
      translateToAccountingLanguage(document.type, document.metadata)
        .then((result) => {
          if (result.success) {
            setAccountingTranslation(result.data);
          }
        })
        .catch((error) => {
          console.error('Erro ao carregar tradução contábil:', error);
        })
        .finally(() => {
          setLoadingTranslation(false);
        });
    }
  }, [document?.type, document?.metadata]);

  if (!document) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const result = await downloadMutation.mutateAsync(document.id);
      if (result.success && result.url) {
        window.open(result.url, '_blank');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = async () => {
    // Carregar URL de visualização (sem forçar download)
    if (!viewMutation.data?.url) {
      await viewMutation.mutateAsync(document.id);
    }
    setPreviewOpen(true);
  };

  const getTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      nfe: 'NFe',
      nfse: 'NFSe',
      receipt: 'Recibo',
      invoice: 'Fatura',
      contract: 'Contrato',
      das: 'DAS',
      darf: 'DARF',
      extrato: 'Extrato',
      other: 'Outro',
    };
    return types[type || 'other'] || 'Outro';
  };

  const getStatusBadge = () => {
    if (!document.processed) {
      return <Badge variant="secondary">Aguardando Processamento</Badge>;
    }
    if (document.ocr_confidence && document.ocr_confidence >= 0.85) {
      return <Badge variant="default">Processado</Badge>;
    }
    if (document.ocr_confidence && document.ocr_confidence >= 0.6) {
      return <Badge variant="outline">Revisão Recomendada</Badge>;
    }
    return <Badge variant="destructive">Requer Revisão</Badge>;
  };

  // Função para formatar valores do metadata
  const formatMetadataValue = (key: string, value: any): string => {
    if (value === null || value === undefined) {
      return 'null';
    }

    // Detectar e formatar datas ISO
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      try {
        const date = new Date(value);
        return formatDate(date, 'dd/MM/yyyy');
      } catch {
        return String(value);
      }
    }

    // Formatar valores monetários
    if (key.toLowerCase().includes('valor') && typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    }

    // Outros valores
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {document.name}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Detalhes e dados extraídos do documento
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pr-4">
            {/* Status e Informações Básicas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status</p>
                  {getStatusBadge()}
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-sm font-medium">Tipo</p>
                  <Badge variant="outline">{getTypeLabel(document.type)}</Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Tamanho
                  </p>
                  <p className="text-sm">{formatBytes(document.size)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Data de Upload
                  </p>
                  <p className="text-sm">{formatDate(document.created_at)}</p>
                </div>
                {document.client && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Cliente
                    </p>
                    <p className="text-sm">{document.client.name}</p>
                  </div>
                )}
                {document.uploader && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Enviado por
                    </p>
                    <p className="text-sm">{document.uploader.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Confiança do OCR */}
            {document.ocr_confidence !== null && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Confiança do OCR</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${(document.ocr_confidence || 0) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {((document.ocr_confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Resumo do Documento */}
            {document.metadata && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Resumo</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <p className="text-sm leading-relaxed">
                      {/* Gerar resumo em 1-2 linhas */}
                      {getTypeLabel(document.type)}
                      {document.metadata.pagador && ` de ${document.metadata.pagador}`}
                      {document.metadata.beneficiario && ` para ${document.metadata.beneficiario}`}
                      {document.metadata.valor && ` no valor de ${formatMetadataValue('valor', document.metadata.valor)}`}
                      {document.metadata.data && ` em ${formatMetadataValue('data', document.metadata.data)}`}
                      {document.metadata.descricao && ` - ${document.metadata.descricao}`}
                      .
                    </p>
                  </div>
                </div>
              </>
            )}



            {/* Interpretação Contábil */}
            {accountingTranslation && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Interpretação Contábil</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {accountingTranslation.explanation}
                    </p>

                    {accountingTranslation.suggestions.length > 0 && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                          <p className="text-xs font-medium">Sugestões:</p>
                        </div>
                        <ul className="space-y-1.5 ml-5">
                          {accountingTranslation.suggestions.slice(0, 3).map((suggestion, index) => (
                            <li key={index} className="text-xs text-muted-foreground list-disc">
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Loading Tradução */}
            {loadingTranslation && (
              <>
                <Separator />
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Gerando interpretação contábil...
                  </p>
                </div>
              </>
            )}

            {/* Processamento Pendente */}
            {!document.processed && (
              <>
                <Separator />
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Processamento em andamento
                    </p>
                    <p className="text-xs text-muted-foreground">
                      O documento está sendo processado. Aguarde alguns instantes
                      e recarregue a página.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Ações */}
        <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {document?.mime_type === 'application/pdf' && (
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={viewMutation.isPending}
            >
              {viewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </>
              )}
            </Button>
          )}
          <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Baixando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar
              </>
            )}
          </Button>
        </div>
      </DialogContent>

      {/* PDF Preview Dialog */}
      {document?.mime_type === 'application/pdf' && viewMutation.data?.url && (
        <PDFPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          pdfUrl={viewMutation.data.url}
          fileName={document.name}
        />
      )}
    </Dialog>
  );
}

