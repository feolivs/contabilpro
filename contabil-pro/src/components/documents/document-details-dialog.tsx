'use client';

import { useState, useEffect } from 'react';
import { FileText, X, Download, Loader2, Eye, Sparkles, Brain, Lightbulb } from 'lucide-react';
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
import { useDocumentDownloadUrl } from '@/hooks/use-documents';
import { formatBytes, formatDate } from '@/lib/utils';
import { translateToAccountingLanguage } from '@/actions/documents';

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
  const [accountingTranslation, setAccountingTranslation] = useState<{
    explanation: string;
    suggestions: string[];
  } | null>(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const downloadMutation = useDocumentDownloadUrl();

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
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

        <ScrollArea className="max-h-[calc(90vh-120px)]">
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

            {/* Dados Extraídos (Metadata) */}
            {document.metadata && Object.keys(document.metadata).length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Dados Extraídos</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg">
                    {Object.entries(document.metadata).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm font-mono">
                          {typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Texto Extraído (OCR) */}
            {document.ocr_text && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Texto Extraído</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {document.ocr_text.substring(0, 1000)}
                      {document.ocr_text.length > 1000 && '...'}
                    </pre>
                  </div>
                </div>
              </>
            )}

            {/* Tradução Contábil */}
            {accountingTranslation && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Interpretação Contábil</p>
                  </div>
                  <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                    <div className="space-y-2">
                      <p className="text-sm text-blue-900">
                        {accountingTranslation.explanation}
                      </p>
                    </div>

                    {accountingTranslation.suggestions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-3 w-3 text-amber-600" />
                          <p className="text-xs font-medium text-amber-800">
                            Sugestões para o Contador:
                          </p>
                        </div>
                        <ul className="space-y-1 ml-5">
                          {accountingTranslation.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-xs text-amber-700 list-disc">
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
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
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
    </Dialog>
  );
}

