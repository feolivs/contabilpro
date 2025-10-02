'use client'

import { useActionState } from 'react'

import { updateEntryFromForm } from '@/actions/entries'
import { initialEntryFormState } from '@/types/entries'
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
import type { Entry } from '@/lib/validations'

interface EntryEditFormProps {
  entry: Entry & {
    client?: { name?: string | null }
    account?: { name?: string | null; code?: string | null }
  }
}

function formatDateInput(value: string | Date | null | undefined) {
  if (!value) {
    return ''
  }

  const date = typeof value === 'string' ? new Date(value) : value

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

export function EntryEditForm({ entry }: EntryEditFormProps) {
  const [state, action, isPending] = useActionState(updateEntryFromForm, initialEntryFormState)

  return (
    <form action={action} className='grid gap-4 rounded-lg border bg-card p-6 shadow-sm'>
      <input type='hidden' name='id' value={entry.id} />

      <div>
        <h2 className='text-lg font-semibold'>Editar lancamento</h2>
        <p className='text-sm text-muted-foreground'>
          Ajuste identificadores, valores ou tipo do lancamento conforme necessario.
        </p>
      </div>

      <div className='grid gap-2 md:grid-cols-2 md:gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='client_id'>ID do cliente</Label>
          <Input
            id='client_id'
            name='client_id'
            defaultValue={entry.client_id}
            required
            disabled={isPending}
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
            defaultValue={entry.account_id}
            required
            disabled={isPending}
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
          defaultValue={entry.description}
          required
          disabled={isPending}
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
            defaultValue={entry.amount?.toString() ?? ''}
            disabled={isPending}
          />
          {state.fieldErrors?.amount && (
            <p className='text-sm text-destructive'>{state.fieldErrors.amount.join(', ')}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='type'>Tipo</Label>
          <Select name='type' defaultValue={entry.type ?? 'debit'} disabled={isPending}>
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
          <Input
            id='date'
            name='date'
            type='date'
            defaultValue={formatDateInput(entry.date)}
            disabled={isPending}
          />
          {state.fieldErrors?.date && (
            <p className='text-sm text-destructive'>{state.fieldErrors.date.join(', ')}</p>
          )}
        </div>
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='document_id'>Documento vinculado (opcional)</Label>
        <Input
          id='document_id'
          name='document_id'
          defaultValue={entry.document_id ?? ''}
          disabled={isPending}
        />
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
        {isPending ? 'Salvando...' : 'Salvar lancamento'}
      </Button>
    </form>
  )
}
