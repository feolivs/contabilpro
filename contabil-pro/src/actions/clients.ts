'use server'

import { revalidatePath } from 'next/cache'

import { type z } from 'zod'

import { requireAuth, setRLSContext } from '@/lib/auth'
import { clientSchema } from '@/lib/validations'

const baseClientSchema = clientSchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
})

const updateClientSchema = baseClientSchema.partial()

export type ClientFormState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  fieldErrors?: Record<string, string[]>
}

export const initialClientFormState: ClientFormState = {
  status: 'idle',
  message: null,
  fieldErrors: {},
}

export async function createClient(input: z.infer<typeof baseClientSchema>) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Nao foi possivel preparar o contexto de seguranca.')
    }

    const validatedData = baseClientSchema.parse(input)

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...validatedData,
        tenant_id: session.tenant_id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar cliente: ${error.message}`)
    }

    revalidatePath('/clientes')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function createClientFromForm(
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const input = {
    name: (formData.get('name') ?? '').toString(),
    email: formData.get('email') ? formData.get('email')!.toString() : undefined,
    document: (formData.get('document') ?? '').toString(),
    phone: formData.get('phone') ? formData.get('phone')!.toString() : undefined,
    address: formData.get('address') ? formData.get('address')!.toString() : undefined,
  }

  const parsed = baseClientSchema.safeParse(input)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Nao foi possivel validar os dados do cliente.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const result = await createClient(parsed.data)

  if (!result.success) {
    return {
      status: 'error',
      message: result.error ?? 'Erro desconhecido ao criar cliente.',
    }
  }

  return {
    status: 'success',
    message: 'Cliente criado com sucesso.',
  }
}

export async function getClients() {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Nao foi possivel preparar o contexto de seguranca.')
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar clientes: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function updateClient(id: string, input: z.infer<typeof updateClientSchema>) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Nao foi possivel preparar o contexto de seguranca.')
    }

    const validatedData = updateClientSchema.parse(input)

    const { data, error } = await supabase
      .from('clients')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar cliente: ${error.message}`)
    }

    revalidatePath('/clientes')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function deleteClient(id: string) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Nao foi possivel preparar o contexto de seguranca.')
    }

    const { error } = await supabase.from('clients').delete().eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir cliente: ${error.message}`)
    }

    revalidatePath('/clientes')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}
