'use client'

import { useActionState } from 'react'

import { createEntryFromForm, initialEntryFormState } from '@/actions/entries'
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

export function EntryForm() {
  const [state, action, isPending] = useActionState(createEntryFromForm, initialEntryFormState)

  return (
    <form action={action} className='grid gap-4 rounded-lg border bg-card p-6 shadow-sm'>
      <div>
        <h2 className='text-lg font-semibold'>Novo lancamento manual</h2>
        <p className='text-sm text-muted-foreground'>
          Informe os identificadores de cliente e conta para registrar um lancamento.
        </p>
      </div>

      <div className='grid gap-2 md:grid-cols-2 md:gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='client_id'>ID do cliente</Label>
          <Input
            id='client_id'
            name='client_id'
            required
            disabled={isPending}
            placeholder='UUID do cliente'
          />
          {state.fieldErrors?.client_id && (
            <p className='text-sm text-destructive'>{state.fieldErrors.client_id.join(', ')}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='account_id'>ID da conta</Label>
          <Input
            id='account_id'
            name='account_id'
            required
            disabled={isPending}
            placeholder='UUID da conta'
          />
          {state.fieldErrors?.account_id && (
            <p className='text-sm text-destructive'>{state.fieldErrors.account_id.join(', ')}</p>
          )}
        </div>
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='description'>Descricao</Label>
        <Input
          id='description'
          name='description'
          required
          disabled={isPending}
          placeholder='Servicos prestados'
        />
        {state.fieldErrors?.description && (
          <p className='text-sm text-destructive'>{state.fieldErrors.description.join(', ')}</p>
        )}
      </div>

      <div className='grid gap-2 md:grid-cols-3 md:gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='amount'>Valor</Label>
          <Input
            id='amount'
            name='amount'
            type='number'
            step='0.01'
            min='0'
            required
            disabled={isPending}
          />
          {state.fieldErrors?.amount && (
            <p className='text-sm text-destructive'>{state.fieldErrors.amount.join(', ')}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='type'>Tipo</Label>
          <Select name='type' defaultValue='debit' disabled={isPending}>
            <SelectTrigger id='type'>
              <SelectValue placeholder='Selecione o tipo' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='debit'>Debito</SelectItem>
              <SelectItem value='credit'>Credito</SelectItem>
            </SelectContent>
          </Select>
          {state.fieldErrors?.type && (
            <p className='text-sm text-destructive'>{state.fieldErrors.type.join(', ')}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='date'>Data</Label>
          <Input id='date' name='date' type='date' required disabled={isPending} />
          {state.fieldErrors?.date && (
            <p className='text-sm text-destructive'>{state.fieldErrors.date.join(', ')}</p>
          )}
        </div>
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='document_id'>Documento vinculado (opcional)</Label>
        <Input id='document_id' name='document_id' disabled={isPending} />
        {state.fieldErrors?.document_id && (
          <p className='text-sm text-destructive'>{state.fieldErrors.document_id.join(', ')}</p>
        )}
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
        {isPending ? 'Registrando...' : 'Registrar lancamento'}
      </Button>
    </form>
  )
}
