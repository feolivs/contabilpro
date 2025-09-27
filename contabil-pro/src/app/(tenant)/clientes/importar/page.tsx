import Link from 'next/link'

import { requirePermission } from '@/lib/rbac'
import { Button } from '@/components/ui/button'

import { ClientImportForm } from '../client-import-form'

export default async function ImportarClientesPage() {
  await requirePermission('clientes.write')

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Importar clientes</h1>
          <p className='text-muted-foreground'>Faca upload de um arquivo CSV para cadastrar clientes em lote.</p>
        </div>
        <Button asChild variant='outline'>
          <Link href='/clientes'>Voltar para a lista</Link>
        </Button>
      </div>

      <ClientImportForm />
    </div>
  )
}