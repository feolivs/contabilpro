import { headers } from 'next/headers'
import Link from 'next/link'

import { getClients, getClientStats } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { buildTenantUrlFromHeaders } from '@/lib/navigation'
import { requirePermission } from '@/lib/rbac'
import { ClientStats } from '@/components/client-stats'
import { IconPlus, IconUpload } from '@tabler/icons-react'
import { ClientsPageContent } from './clients-page-content'

export default async function ClientesPage() {
  await requirePermission('clientes.read')

  const headersList = await headers()
  const importUrl = buildTenantUrlFromHeaders(headersList, '/clientes/importar')
  const newClientUrl = buildTenantUrlFromHeaders(headersList, '/clientes/novo')

  // Buscar clientes e estatísticas em paralelo
  const [clientsResult, stats] = await Promise.all([
    getClients(),
    getClientStats(),
  ])

  const clients = clientsResult.success && Array.isArray(clientsResult.data) ? clientsResult.data : []

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Clientes</h1>
          <p className='text-muted-foreground'>Gerencie cadastros e documentos por cliente.</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button asChild variant='outline' size='sm'>
            <Link href={importUrl}>
              <IconUpload className='mr-2 h-4 w-4' />
              Importar clientes
            </Link>
          </Button>
          <Button asChild size='sm'>
            <Link href={newClientUrl}>
              <IconPlus className='mr-2 h-4 w-4' />
              Novo cliente
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <ClientStats stats={stats} />

      {/* Tabela ou Empty State */}
      <ClientsPageContent
        clients={clients}
        newClientUrl={newClientUrl}
        importUrl={importUrl}
      />
    </div>
  )
}
