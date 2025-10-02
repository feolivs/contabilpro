'use client'

import { useActionState } from 'react'

import { createClientFromForm } from '@/actions/clients'
import { initialClientFormState } from '@/actions/clients-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ClientForm() {
  const [state, action, isPending] = useActionState(createClientFromForm, initialClientFormState)

  return (
    <form action={action} className='grid gap-4 rounded-lg border bg-card p-6 shadow-sm'>
      <div>
        <h2 className='text-lg font-semibold'>Cadastrar cliente</h2>
        <p className='text-sm text-muted-foreground'>
          Preencha os dados abaixo para adicionar um novo cliente ao tenant atual.
        </p>
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='name'>Nome</Label>
        <Input id='name' name='name' placeholder='Empresa Alfa' required disabled={isPending} />
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
            placeholder='CNPJ ou CPF'
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
            placeholder='contato@empresa.com'
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
          <Input id='phone' name='phone' placeholder='(11) 99999-9999' disabled={isPending} />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='address'>Endereco</Label>
          <Input id='address' name='address' placeholder='Rua Exemplo, 123' disabled={isPending} />
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
        {isPending ? 'Salvando...' : 'Salvar cliente'}
      </Button>
    </form>
  )
}
