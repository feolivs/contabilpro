'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'

interface DocumentsFiltersProps {
  onFilterChange: (filters: { type?: string; status?: string }) => void
}

export function DocumentsFilters({ onFilterChange }: DocumentsFiltersProps) {
  const [type, setType] = useState<string>()
  const [status, setStatus] = useState<string>()

  const handleTypeChange = (value: string) => {
    const newType = value === 'all' ? undefined : value
    setType(newType)
    onFilterChange({ type: newType, status })
  }

  const handleStatusChange = (value: string) => {
    const newStatus = value === 'all' ? undefined : value
    setStatus(newStatus)
    onFilterChange({ type, status: newStatus })
  }

  const handleClearFilters = () => {
    setType(undefined)
    setStatus(undefined)
    onFilterChange({})
  }

  const hasActiveFilters = type || status

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Filtros:</span>
        
        {/* Type Filter */}
        <Select value={type || 'all'} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="nfe">NF-e</SelectItem>
            <SelectItem value="nfse">NFSe</SelectItem>
            <SelectItem value="nfce">NFC-e</SelectItem>
            <SelectItem value="ofx">OFX</SelectItem>
            <SelectItem value="payroll">Folha</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={status || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="processing">Processando</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-8 px-2 lg:px-3"
        >
          Limpar
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

