import { getEntries } from '@/actions/entries'
import { requirePermission } from '@/lib/rbac'

import { EntryForm } from './entry-form'
import { EntriesTable } from './entries-table'

export default async function LancamentosPage() {
  await requirePermission('lancamentos.read')

  const result = await getEntries()
  const entries = result.success && Array.isArray(result.data) ? result.data : []

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Lancamentos</h1>
        <p className='text-muted-foreground'>Registre e acompanhe lancamentos contabeis do tenant.</p>
      </div>

      <EntryForm />

      <EntriesTable entries={entries} />
    </div>
  )
}
