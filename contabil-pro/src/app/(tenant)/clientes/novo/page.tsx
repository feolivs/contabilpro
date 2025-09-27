import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { requirePermission } from '@/lib/rbac'

import { ClientForm } from '../client-form'

export default async function NovoClientePage() {
  await requirePermission('clientes.write')

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Cadastrar cliente</h1>
          <p className='text-muted-foreground'>
            Informe os dados essenciais para criar um novo registro de cliente.
          </p>
        </div>
        <Button asChild variant='outline'>
          <Link href='/clientes'>Voltar para a lista</Link>
        </Button>
      </div>

      <ClientForm />
    </div>
  )
}
