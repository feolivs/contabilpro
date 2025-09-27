'use client'

import { useActionState } from 'react'

import {
  importBankTransactionsFromCSV,
  initialBankTransactionImportState,
} from '@/actions/bank-accounts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BankTransactionImportFormProps {
  accounts: Array<{ id: string; name: string }>
  defaultAccountId?: string
}

export function BankTransactionImportForm({
  accounts,
  defaultAccountId,
}: BankTransactionImportFormProps) {
  const [state, action, isPending] = useActionState(
    importBankTransactionsFromCSV,
    initialBankTransactionImportState
  )

  return (
    <form action={action} className='grid gap-4 rounded-lg border bg-card p-6 shadow-sm'>
      <div>
        <h2 className='text-lg font-semibold'>Importar transacoes bancarias</h2>
        <p className='text-sm text-muted-foreground'>
          Selecione a conta e envie um CSV com external_id, description, amount, type, date e
          status.
        </p>
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='bank_account_id'>Conta bancaria</Label>
        <Select
          name='bank_account_id'
          defaultValue={defaultAccountId ?? accounts[0]?.id}
          disabled={isPending || accounts.length === 0}
        >
          <SelectTrigger id='bank_account_id'>
            <SelectValue placeholder='Selecione a conta' />
          </SelectTrigger>
          <SelectContent>
            {accounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {accounts.length === 0 && (
          <p className='text-xs text-destructive'>
            Cadastre uma conta antes de importar transacoes.
          </p>
        )}
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='file'>Arquivo CSV</Label>
        <Input
          id='file'
          name='file'
          type='file'
          accept='.csv'
          required
          disabled={isPending || accounts.length === 0}
        />
        <p className='text-xs text-muted-foreground'>
          Valores devem usar ponto decimal. Tipos aceitam debit ou credit. Status aceitam pending,
          reconciled ou ignored.
        </p>
      </div>

      {state.summary && (
        <div className='rounded-md border border-primary/40 bg-primary/5 p-3 text-sm'>
          <p>
            Processados: <span className='font-medium'>{state.summary.processed}</span>
          </p>
          <p>
            Importados:{' '}
            <span className='font-medium text-emerald-600'>{state.summary.imported}</span>
          </p>
          <p>
            Ignorados: <span className='font-medium text-destructive'>{state.summary.skipped}</span>
          </p>
        </div>
      )}

      {state.status === 'error' && state.message && (
        <div className='rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive'>
          {state.message}
        </div>
      )}
      {state.status === 'success' && state.message && (
        <div className='rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-600'>
          {state.message}
        </div>
      )}

      <Button
        type='submit'
        disabled={isPending || accounts.length === 0}
        className='justify-self-start'
      >
        {isPending ? 'Importando...' : 'Importar transacoes'}
      </Button>
    </form>
  )
}
