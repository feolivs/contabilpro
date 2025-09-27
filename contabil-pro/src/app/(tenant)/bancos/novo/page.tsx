import Link from 'next/link'

import { requirePermission } from '@/lib/rbac'
import { Button } from '@/components/ui/button'

import { BankAccountForm } from '../bank-account-form'

export default async function NovaContaBancariaPage() {
  await requirePermission('bancos.write')

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Nova conta bancaria</h1>
          <p className='text-muted-foreground'>Cadastre uma conta para acompanhar extratos e conciliacoes.</p>
        </div>
        <Button asChild variant='outline'>
          <Link href='/bancos'>Voltar para a lista</Link>
        </Button>
      </div>

      <BankAccountForm />
    </div>
  )
}