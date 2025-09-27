import Link from 'next/link'

import { requirePermission } from '@/lib/rbac'
import { Button } from '@/components/ui/button'

import { EntryForm } from '../entry-form'

export default async function NovoLancamentoPage() {
  await requirePermission('lancamentos.write')

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Novo lancamento</h1>
          <p className='text-muted-foreground'>Preencha os campos para registrar um lancamento manual.</p>
        </div>
        <Button asChild variant='outline'>
          <Link href='/lancamentos'>Voltar para a lista</Link>
        </Button>
      </div>

      <EntryForm />
    </div>
  )
}