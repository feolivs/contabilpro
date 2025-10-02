import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { requirePermission } from '@/lib/auth/rbac'

import { EntryImportForm } from '../entry-import-form'

export default async function ImportarLancamentosPage() {
  await requirePermission('lancamentos.write')

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Importar lancamentos</h1>
          <p className='text-muted-foreground'>
            Carregue um CSV para inserir lancamentos em lote com validacao padrao.
          </p>
        </div>
        <Button asChild variant='outline'>
          <Link href='/lancamentos'>Voltar para a lista</Link>
        </Button>
      </div>

      <EntryImportForm />
    </div>
  )
}
