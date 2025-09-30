'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import type { DocumentType } from '@/types/document.types';

export interface DocumentFiltersState {
  search?: string;
  type?: DocumentType;
  processed?: boolean;
  date_from?: string;
  date_to?: string;
}

interface DocumentsFiltersProps {
  filters: DocumentFiltersState;
  onFiltersChange: (filters: DocumentFiltersState) => void;
  clientsOptions?: Array<{ id: string; name: string }>;
}

const DOCUMENT_TYPES: Array<{ value: DocumentType; label: string }> = [
  { value: 'nfe', label: 'NFe' },
  { value: 'nfse', label: 'NFSe' },
  { value: 'receipt', label: 'Recibo' },
  { value: 'invoice', label: 'Fatura' },
  { value: 'contract', label: 'Contrato' },
  { value: 'other', label: 'Outro' },
];

export function DocumentsFilters({
  filters,
  onFiltersChange,
}: DocumentsFiltersProps) {
  const [localFilters, setLocalFilters] = useState<DocumentFiltersState>(filters);
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = Object.keys(filters).filter(
    (key) => key !== 'search' && filters[key as keyof DocumentFiltersState] !== undefined
  ).length;

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: DocumentFiltersState = { search: filters.search };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    setIsOpen(false);
  };

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value || undefined };
    onFiltersChange(newFilters);
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Busca */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar documentos..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtros Avançados */}
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtros Avançados</h4>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Limpar tudo
                  </Button>
                )}
              </div>

              {/* Tipo de Documento */}
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select
                  value={localFilters.type || 'all'}
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      type: value === 'all' ? undefined : (value as DocumentType),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status de Processamento */}
              <div className="space-y-2">
                <Label>Status de Processamento</Label>
                <Select
                  value={
                    localFilters.processed === undefined
                      ? 'all'
                      : localFilters.processed
                      ? 'processed'
                      : 'pending'
                  }
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      processed:
                        value === 'all'
                          ? undefined
                          : value === 'processed'
                          ? true
                          : false,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="processed">Processados</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Inicial */}
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={localFilters.date_from || ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      date_from: e.target.value || undefined,
                    })
                  }
                />
              </div>

              {/* Data Final */}
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={localFilters.date_to || ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      date_to: e.target.value || undefined,
                    })
                  }
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleApplyFilters} className="flex-1">
                  Aplicar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Badges de Filtros Ativos */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.type && (
              <Badge variant="secondary" className="gap-1">
                Tipo: {DOCUMENT_TYPES.find((t) => t.value === filters.type)?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    onFiltersChange({ ...filters, type: undefined })
                  }
                />
              </Badge>
            )}
            {filters.processed !== undefined && (
              <Badge variant="secondary" className="gap-1">
                {filters.processed ? 'Processados' : 'Pendentes'}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    onFiltersChange({ ...filters, processed: undefined })
                  }
                />
              </Badge>
            )}
            {filters.date_from && (
              <Badge variant="secondary" className="gap-1">
                De: {new Date(filters.date_from).toLocaleDateString('pt-BR')}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    onFiltersChange({ ...filters, date_from: undefined })
                  }
                />
              </Badge>
            )}
            {filters.date_to && (
              <Badge variant="secondary" className="gap-1">
                Até: {new Date(filters.date_to).toLocaleDateString('pt-BR')}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    onFiltersChange({ ...filters, date_to: undefined })
                  }
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

