import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getBankAccountById } from '@/actions/bank-accounts'
import { Button } from '@/components/ui/button'
import { requirePermission } from '@/lib/auth/rbac'

import { BankAccountEditForm } from '../../bank-account-edit-form'

interface EditarContaBancariaProps {
  params: Promise<{ id: string  }>
}

export default async function EditarContaBancariaPage({ params }: EditarContaBancariaProps) {
  await requirePermission('bancos.write')

  const result = await getBankAccountById((await params).id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Editar conta bancaria</h1>
          <p className='text-muted-foreground'>
            Atualize apelidos, status ou saldo de abertura conforme necessario.
          </p>
        </div>
        <Button asChild variant='outline'>
          <Link href={`/bancos/${params.id}`}>Voltar para detalhes</Link>
        </Button>
      </div>

      <BankAccountEditForm account={result.data.account} />
    </div>
  )
}
