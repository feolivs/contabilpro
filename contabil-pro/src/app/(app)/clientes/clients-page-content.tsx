'use client'

import { useRouter } from 'next/navigation'

import { clientColumns, DataTable } from '@/components/clients-table'
import { EmptyState } from '@/components/empty-state'
import type { Client } from '@/lib/validations'

interface ClientsPageContentProps {
  clients: Client[]
  newClientUrl: string
  importUrl: string
}

export function ClientsPageContent({ clients, newClientUrl, importUrl }: ClientsPageContentProps) {
  const router = useRouter()

  if (clients.length === 0) {
    return (
      <EmptyState
        type='clients'
        action={{
          label: 'Adicionar Cliente',
          onClick: () => router.push(newClientUrl),
        }}
        secondaryAction={{
          label: 'Importar CSV',
          onClick: () => router.push(importUrl),
        }}
      />
    )
  }

  return <DataTable columns={clientColumns} data={clients} />
}
