import Link from 'next/link'

import { getBankAccounts } from '@/actions/bank-accounts'
import { Button } from '@/components/ui/button'
import { requirePermission } from '@/lib/rbac'

import { BankAccountForm } from './bank-account-form'
import { BankAccountsTable } from './bank-accounts-table'

export default async function BancosPage() {
  await requirePermission('bancos.read')

  const result = await getBankAccounts()
  const accounts = result.success && Array.isArray(result.data) ? result.data : []

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Contas bancarias</h1>
          <p className='text-muted-foreground'>
            Controle saldos, status e integracoes bancarias por conta.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button asChild variant='outline' size='sm'>
            <Link href='/bancos/importar'>Importar transacoes</Link>
          </Button>
          <Button asChild size='sm'>
            <Link href='/bancos/novo'>Nova conta</Link>
          </Button>
        </div>
      </div>

      <BankAccountForm />

      <BankAccountsTable accounts={accounts} />
    </div>
  )
}
