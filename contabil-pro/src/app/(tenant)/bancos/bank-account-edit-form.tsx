'use client'

import { useActionState } from 'react'

import { initialBankAccountFormState, updateBankAccountFromForm } from '@/actions/bank-accounts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { BankAccount } from '@/lib/validations'

interface BankAccountEditFormProps {
  account: BankAccount
}

export function BankAccountEditForm({ account }: BankAccountEditFormProps) {
  const [state, action, isPending] = useActionState(updateBankAccountFromForm, initialBankAccountFormState)

  return (
    <form action={action} className='grid gap-4 rounded-lg border bg-card p-6 shadow-sm'>
      <input type='hidden' name='id' value={account.id} />

      <div>
        <h2 className='text-lg font-semibold'>Editar conta bancaria</h2>
        <p className='text-sm text-muted-foreground'>Atualize apelidos, saldos e status da conta conectada.</p>
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='name'>Nome interno</Label>
        <Input id='name' name='name' defaultValue={account.name} disabled={isPending} />
        {state.fieldErrors?.name && (
          <p className='text-sm text-destructive'>{state.fieldErrors.name.join(', ')}</p>
        )}
      </div>

      <div className='grid gap-2 md:grid-cols-2 md:gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='bank_code'>Codigo do banco</Label>
          <Input id='bank_code' name='bank_code' defaultValue={account.bank_code} disabled={isPending} />
          {state.fieldErrors?.bank_code && (
            <p className='text-sm text-destructive'>{state.fieldErrors.bank_code.join(', ')}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='bank_name'>Nome do banco</Label>
          <Input id='bank_name' name='bank_name' defaultValue={account.bank_name} disabled={isPending} />
          {state.fieldErrors?.bank_name && (
            <p className='text-sm text-destructive'>{state.fieldErrors.bank_name.join(', ')}</p>
          )}
        </div>
      </div>

      <div className='grid gap-2 md:grid-cols-2 md:gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='agency'>Agencia</Label>
          <Input id='agency' name='agency' defaultValue={account.agency} disabled={isPending} />
          {state.fieldErrors?.agency && (
            <p className='text-sm text-destructive'>{state.fieldErrors.agency.join(', ')}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='account_number'>Conta</Label>
          <Input id='account_number' name='account_number' defaultValue={account.account_number} disabled={isPending} />
          {state.fieldErrors?.account_number && (
            <p className='text-sm text-destructive'>{state.fieldErrors.account_number.join(', ')}</p>
          )}
        </div>
      </div>

      <div className='grid gap-2 md:grid-cols-3 md:gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='account_type'>Tipo de conta</Label>
          <Select name='account_type' defaultValue={account.account_type ?? 'checking'} disabled={isPending}>
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
          <Label htmlFor='balance'>Saldo atual</Label>
          <Input
            id='balance'
            name='balance'
            type='number'
            step='0.01'
            defaultValue={account.balance !== undefined && account.balance !== null ? account.balance.toString() : ''}
            disabled={isPending}
          />
          {state.fieldErrors?.balance && (
            <p className='text-sm text-destructive'>{state.fieldErrors.balance.join(', ')}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='is_active'>Status</Label>
          <Select name='is_active' defaultValue={account.is_active ? 'true' : 'false'} disabled={isPending}>
            <SelectTrigger id='is_active'>
              <SelectValue placeholder='Selecione o status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='true'>Ativa</SelectItem>
              <SelectItem value='false'>Inativa</SelectItem>
            </SelectContent>
          </Select>
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
        {isPending ? 'Salvando...' : 'Salvar conta'}
      </Button>
    </form>
  )
}