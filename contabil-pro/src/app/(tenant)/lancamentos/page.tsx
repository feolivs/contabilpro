import { headers } from 'next/headers'
import Link from 'next/link'

import { getEntries } from '@/actions/entries'
import { Button } from '@/components/ui/button'
import { requirePermission } from '@/lib/rbac'
import { buildTenantUrlFromHeaders } from '@/lib/navigation'

import { EntriesTable } from './entries-table'
import { EntryForm } from './entry-form'

export default async function LancamentosPage() {
  await requirePermission('lancamentos.read')

  const headersList = await headers()
  const importUrl = buildTenantUrlFromHeaders(headersList, '/lancamentos/importar')
  const newEntryUrl = buildTenantUrlFromHeaders(headersList, '/lancamentos/novo')

  const result = await getEntries()
  const entries = result.success && Array.isArray(result.data) ? result.data : []

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Lancamentos</h1>
          <p className='text-muted-foreground'>
            Registre e acompanhe lancamentos contabeis do tenant.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button asChild variant='outline' size='sm'>
            <Link href={importUrl}>Importar lancamentos</Link>
          </Button>
          <Button asChild size='sm'>
            <Link href={newEntryUrl}>Novo lancamento</Link>
          </Button>
        </div>
      </div>

      <EntryForm />

      <EntriesTable entries={entries} />
    </div>
  )
}
