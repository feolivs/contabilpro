'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { DocumentsStats } from './documents-stats'
import { DocumentsFilters } from './documents-filters'
import { DocumentsTable } from './documents-table'
import { useClientStore } from '@/stores/client-store'

export function ImportHistoryContent() {
  const { selectedClient } = useClientStore()
  const [filters, setFilters] = useState<{ type?: string; status?: string }>({})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/import">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Importações</h1>
          <p className="text-muted-foreground mt-2">
            Visualize e gerencie todos os documentos importados
            {selectedClient && ` para ${selectedClient.name}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <DocumentsStats clientId={selectedClient?.id} />

      {/* Filters */}
      <div className="flex items-center justify-between">
        <DocumentsFilters onFilterChange={setFilters} />
      </div>

      {/* Table */}
      <DocumentsTable
        clientId={selectedClient?.id}
        type={filters.type}
        status={filters.status}
      />
    </div>
  )
}

