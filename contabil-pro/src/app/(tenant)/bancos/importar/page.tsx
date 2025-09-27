import Link from 'next/link'

import { getBankAccounts } from '@/actions/bank-accounts'
import { Button } from '@/components/ui/button'
import { requirePermission } from '@/lib/rbac'

import { BankTransactionImportForm } from '../bank-transaction-import-form'

interface ImportarTransacoesPageProps {
  searchParams?: { account?: string }
}

export default async function ImportarTransacoesPage({
  searchParams,
}: ImportarTransacoesPageProps) {
  await requirePermission('bancos.write')

  const result = await getBankAccounts()
  const accountsList = result.success && Array.isArray(result.data) ? result.data : []
  const accounts = accountsList
    .filter(account => Boolean(account.id))
    .map(account => ({ id: account.id as string, name: account.name }))

  const requestedAccount = searchParams?.account
  const defaultAccountId = accounts.some(account => account.id === requestedAccount)
    ? requestedAccount
    : accounts[0]?.id

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Importar transacoes bancarias</h1>
          <p className='text-muted-foreground'>
            Selecione a conta e envie o arquivo com as movimentacoes para conciliacao.
          </p>
        </div>
        <Button asChild variant='outline'>
          <Link href='/bancos'>Voltar para a lista</Link>
        </Button>
      </div>

      <BankTransactionImportForm accounts={accounts} defaultAccountId={defaultAccountId} />
    </div>
  )
}
