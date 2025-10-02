'use client';

import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadDialog } from '@/components/documents/upload-dialog';
import { DocumentsTable } from '@/components/documents/documents-table';
import { DocumentsFilters, type DocumentFiltersState } from '@/components/documents/documents-filters';
import { useDocuments, useInvalidateDocuments } from '@/hooks/use-documents';

export default function DocumentosPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<DocumentFiltersState>({});

  // React Query hook
  const { data, isLoading, error } = useDocuments({
    ...filters,
    page: currentPage,
    pageSize,
  });

  const invalidateDocuments = useInvalidateDocuments();

  const handleFiltersChange = (newFilters: DocumentFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handleUploadComplete = () => {
    invalidateDocuments(); // Invalidar cache para recarregar lista
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">
            Central de arquivos, uploads e gestão documental.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload de Arquivo
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <DocumentsFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground animate-pulse mb-4" />
            <p className="text-sm text-muted-foreground">Carregando documentos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar documentos</h3>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
        </div>
      ) : (
        <DocumentsTable
          documents={data?.documents || []}
          totalCount={data?.total || 0}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
