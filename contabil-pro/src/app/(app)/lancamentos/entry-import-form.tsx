'use client'

import { useActionState } from 'react'

import { importEntriesFromCSV } from '@/actions/entries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { initialEntryImportState } from '@/types/entries'

export function EntryImportForm() {
  const [state, action, isPending] = useActionState(importEntriesFromCSV, initialEntryImportState)

  return (
    <form action={action} className='grid gap-4 rounded-lg border bg-card p-6 shadow-sm'>
      <div>
        <h2 className='text-lg font-semibold'>Importar lancamentos via CSV</h2>
        <p className='text-sm text-muted-foreground'>
          Cada linha deve conter client_id, account_id, description, amount, type, date e
          document_id (opcional).
        </p>
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='file'>Arquivo CSV</Label>
        <Input id='file' name='file' type='file' accept='.csv' required disabled={isPending} />
        <p className='text-xs text-muted-foreground'>
          Campos type aceitam debit ou credit. Datas devem estar no formato ISO (YYYY-MM-DD).
        </p>
      </div>

      {state.summary && (
        <div className='rounded-md border border-primary/40 bg-primary/5 p-3 text-sm'>
          <p>
            Processados: <span className='font-medium'>{state.summary.processed}</span>
          </p>
          <p>
            Importados:{' '}
            <span className='font-medium text-emerald-600'>{state.summary.created}</span>
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

      <Button type='submit' disabled={isPending} className='justify-self-start'>
        {isPending ? 'Importando...' : 'Importar lancamentos'}
      </Button>
    </form>
  )
}
