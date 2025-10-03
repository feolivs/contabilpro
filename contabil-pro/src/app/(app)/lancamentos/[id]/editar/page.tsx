import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getEntryById } from '@/actions/entries'
import { Button } from '@/components/ui/button'
import { requirePermission } from '@/lib/auth/rbac'

import { EntryEditForm } from '../../entry-edit-form'

interface EditarLancamentoProps {
  params: Promise<{ id: string }>
}

export default async function EditarLancamentoPage({ params }: EditarLancamentoProps) {
  const { id } = await params

  await requirePermission('lancamentos.write')

  const result = await getEntryById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Editar lancamento</h1>
          <p className='text-muted-foreground'>
            Atualize valores, tipo ou vinculacoes deste lancamento.
          </p>
        </div>
        <Button asChild variant='outline'>
          <Link href={`/lancamentos/${id}`}>Voltar para detalhes</Link>
        </Button>
      </div>

      <EntryEditForm entry={result.data} />
    </div>
  )
}
