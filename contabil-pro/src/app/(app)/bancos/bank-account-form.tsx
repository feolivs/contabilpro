'use client'

import { useActionState } from 'react'

import { createBankAccountFromForm } from '@/actions/bank-accounts'
import { initialBankAccountFormState } from '@/types/bank-accounts'
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

export function BankAccountForm() {
  const [state, action, isPending] = useActionState(
    createBankAccountFromForm,
    initialBankAccountFormState
  )

  return (
    <form action={action} className='grid gap-4 rounded-lg border bg-card p-6 shadow-sm'>
      <div>
        <h2 className='text-lg font-semibold'>Adicionar conta bancaria</h2>
        <p className='text-sm text-muted-foreground'>
          Informe dados da conta para acompanhar saldos e conciliacoes.
        </p>
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='name'>Nome interno</Label>
        <Input
          id='name'
          name='name'
          placeholder='Conta corrente principal'
          required
          disabled={isPending}
        />
        {state.fieldErrors?.name && (
          <p className='text-sm text-destructive'>{state.fieldErrors.name.join(', ')}</p>
        )}
      </div>

      <div className='grid gap-2 md:grid-cols-2 md:gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='bank_code'>Codigo do banco</Label>
          <Input id='bank_code' name='bank_code' placeholder='001' required disabled={isPending} />
          {state.fieldErrors?.bank_code && (
            <p className='text-sm text-destructive'>{state.fieldErrors.bank_code.join(', ')}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='bank_name'>Nome do banco</Label>
          <Input
            id='bank_name'
            name='bank_name'
            placeholder='Banco do Brasil'
            required
            disabled={isPending}
          />
          {state.fieldErrors?.bank_name && (
            <p className='text-sm text-destructive'>{state.fieldErrors.bank_name.join(', ')}</p>
          )}
        </div>
      </div>

      <div className='grid gap-2 md:grid-cols-2 md:gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='agency'>Agencia</Label>
          <Input id='agency' name='agency' placeholder='1234-5' required disabled={isPending} />
          {state.fieldErrors?.agency && (
            <p className='text-sm text-destructive'>{state.fieldErrors.agency.join(', ')}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='account_number'>Conta</Label>
          <Input
            id='account_number'
            name='account_number'
            placeholder='12345-6'
            required
            disabled={isPending}
          />
          {state.fieldErrors?.account_number && (
            <p className='text-sm text-destructive'>
              {state.fieldErrors.account_number.join(', ')}
            </p>
          )}
        </div>
      </div>

      <div className='grid gap-2 md:grid-cols-2 md:gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='account_type'>Tipo de conta</Label>
          <Select name='account_type' defaultValue='checking' disabled={isPending}>
            <SelectTrigger id='account_type'>
              <SelectValue placeholder='Selecione o tipo' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='checking'>Conta corrente</SelectItem>
              <SelectItem value='savings'>Poupanca</SelectItem>
              <SelectItem value='investment'>Investimento</SelectItem>
            </SelectContent>
          </Select>
          {state.fieldErrors?.account_type && (
            <p className='text-sm text-destructive'>{state.fieldErrors.account_type.join(', ')}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='balance'>Saldo inicial</Label>
          <Input
            id='balance'
            name='balance'
            type='number'
            step='0.01'
            placeholder='0.00'
            disabled={isPending}
          />
          {state.fieldErrors?.balance && (
            <p className='text-sm text-destructive'>{state.fieldErrors.balance.join(', ')}</p>
          )}
        </div>
      </div>

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

      <Button type='submit' disabled={isPending} className='justify-self-start'>
        {isPending ? 'Registrando...' : 'Registrar conta'}
      </Button>
    </form>
  )
}
