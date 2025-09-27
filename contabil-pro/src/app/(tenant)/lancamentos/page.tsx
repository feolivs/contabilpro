import Link from 'next/link'

import { getEntries } from '@/actions/entries'
import { requirePermission } from '@/lib/rbac'
import { Button } from '@/components/ui/button'

import { EntriesTable } from './entries-table'
import { EntryForm } from './entry-form'

export default async function LancamentosPage() {
  await requirePermission('lancamentos.read')

  const result = await getEntries()
  const entries = result.success && Array.isArray(result.data) ? result.data : []

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Lancamentos</h1>
          <p className='text-muted-foreground'>Registre e acompanhe lancamentos contabeis do tenant.</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button asChild variant='outline' size='sm'>
            <Link href='/lancamentos/importar'>Importar lancamentos</Link>
          </Button>
          <Button asChild size='sm'>
            <Link href='/lancamentos/novo'>Novo lancamento</Link>
          </Button>
        </div>
      </div>

      <EntryForm />

      <EntriesTable entries={entries} />
    </div>
  )
}