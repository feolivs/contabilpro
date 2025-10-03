import Link from 'next/link'

import { ClientImportAdvanced } from '@/components/clients'
import { Button } from '@/components/ui/button'
import { requirePermission } from '@/lib/auth/rbac'

import { IconArrowLeft } from '@tabler/icons-react'

export default async function ImportarClientesPage() {
  await requirePermission('clientes.write')

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Importar clientes</h1>
          <p className='text-muted-foreground'>
            Faça upload de um arquivo CSV para cadastrar clientes em lote com validação e preview.
          </p>
        </div>
        <Button asChild variant='outline'>
          <Link href='/clientes'>
            <IconArrowLeft className='mr-2 h-4 w-4' />
            Voltar para a lista
          </Link>
        </Button>
      </div>

      <ClientImportAdvanced />
    </div>
  )
}
