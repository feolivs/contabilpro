import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getClientById } from '@/actions/clients'
import { requirePermission } from '@/lib/rbac'
import { Button } from '@/components/ui/button'

import { ClientEditForm } from '../../client-edit-form'

interface EditarClienteProps {
  params: { id: string }
}

export default async function EditarClientePage({ params }: EditarClienteProps) {
  await requirePermission('clientes.write')

  const result = await getClientById(params.id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Editar cliente</h1>
          <p className='text-muted-foreground'>Ajuste os dados cadastrais e salve para manter o historico atualizado.</p>
        </div>
        <Button asChild variant='outline'>
          <Link href={`/clientes/${params.id}`}>Voltar para detalhes</Link>
        </Button>
      </div>

      <ClientEditForm client={result.data} />
    </div>
  )
}