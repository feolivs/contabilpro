'use client'

import { useActionState } from 'react'

import { importClientsFromCSV, initialClientImportState } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ClientImportForm() {
  const [state, action, isPending] = useActionState(importClientsFromCSV, initialClientImportState)

  return (
    <form action={action} className='grid gap-4 rounded-lg border bg-card p-6 shadow-sm'>
      <div>
        <h2 className='text-lg font-semibold'>Importar clientes via CSV</h2>
        <p className='text-sm text-muted-foreground'>
          Envie um arquivo com colunas nome, document, email, phone e address para cadastrar em
          lote.
        </p>
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='file'>Arquivo CSV</Label>
        <Input id='file' name='file' type='file' accept='.csv' required disabled={isPending} />
        <p className='text-xs text-muted-foreground'>
          O arquivo deve possuir cabecalho. Linhas invalidas serao ignoradas.
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
        {isPending ? 'Importando...' : 'Importar clientes'}
      </Button>
    </form>
  )
}
