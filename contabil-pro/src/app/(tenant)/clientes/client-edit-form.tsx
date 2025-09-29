'use client'

import { useActionState } from 'react'

import { updateClientFromForm } from '@/actions/clients'
import { initialClientFormState } from '@/actions/clients-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Client } from '@/lib/validations'

interface ClientEditFormProps {
  client: Client
}

export function ClientEditForm({ client }: ClientEditFormProps) {
  const [state, action, isPending] = useActionState(updateClientFromForm, initialClientFormState)

  return (
    <form action={action} className='grid gap-4 rounded-lg border bg-card p-6 shadow-sm'>
      <input type='hidden' name='id' value={client.id} />

      <div>
        <h2 className='text-lg font-semibold'>Editar dados do cliente</h2>
        <p className='text-sm text-muted-foreground'>
          Atualize as informacoes cadastrais abaixo e salve para aplicar.
        </p>
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='name'>Nome</Label>
        <Input id='name' name='name' defaultValue={client.name} required disabled={isPending} />
        {state.fieldErrors?.name && (
          <p className='text-sm text-destructive'>{state.fieldErrors.name.join(', ')}</p>
        )}
      </div>

      <div className='grid gap-2 md:grid-cols-2 md:gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='document'>Documento</Label>
          <Input
            id='document'
            name='document'
            defaultValue={client.document}
            required
            disabled={isPending}
          />
          {state.fieldErrors?.document && (
            <p className='text-sm text-destructive'>{state.fieldErrors.document.join(', ')}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            name='email'
            type='email'
            defaultValue={client.email ?? ''}
            disabled={isPending}
          />
          {state.fieldErrors?.email && (
            <p className='text-sm text-destructive'>{state.fieldErrors.email.join(', ')}</p>
          )}
        </div>
      </div>

      <div className='grid gap-2 md:grid-cols-2 md:gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='phone'>Telefone</Label>
          <Input id='phone' name='phone' defaultValue={client.phone ?? ''} disabled={isPending} />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='address'>Endereco</Label>
          <Input
            id='address'
            name='address'
            defaultValue={client.address ?? ''}
            disabled={isPending}
          />
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
        {isPending ? 'Salvando...' : 'Salvar alteracoes'}
      </Button>
    </form>
  )
}
