import Link from 'next/link'

import { getClients } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { requirePermission } from '@/lib/rbac'

import { ClientForm } from './client-form'
import { ClientsTable } from './clients-table'

export default async function ClientesPage() {
  await requirePermission('clientes.read')

  const result = await getClients()
  const clients = result.success && Array.isArray(result.data) ? result.data : []

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Clientes</h1>
          <p className='text-muted-foreground'>Gerencie cadastros e documentos por cliente.</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button asChild variant='outline' size='sm'>
            <Link href='/clientes/importar'>Importar clientes</Link>
          </Button>
          <Button asChild size='sm'>
            <Link href='/clientes/novo'>Novo cliente</Link>
          </Button>
        </div>
      </div>

      <ClientForm />

      <ClientsTable clients={clients} />
    </div>
  )
}
