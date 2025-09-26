import { getClients } from '@/actions/clients'
import { requirePermission } from '@/lib/rbac'

import { ClientForm } from './client-form'
import { ClientsTable } from './clients-table'

export default async function ClientesPage() {
  await requirePermission('clientes.read')

  const result = await getClients()
  const clients = result.success && Array.isArray(result.data) ? result.data : []

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Clientes</h1>
        <p className='text-muted-foreground'>Gerencie cadastros e documentos por cliente.</p>
      </div>

      <ClientForm />

      <ClientsTable clients={clients} />
    </div>
  )
}
