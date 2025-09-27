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

export type ClientImportState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  summary?: {
    processed: number
    created: number
    skipped: number
  }
}

export const initialClientImportState: ClientImportState = {
  status: 'idle',
  message: null,
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

export async function getClientById(id: string) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Nao foi possivel preparar o contexto de seguranca.')
    }

    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()

    if (error) {
      throw new Error(`Erro ao buscar cliente: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
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
    revalidatePath(`/clientes/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function updateClientFromForm(
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const id = (formData.get('id') ?? '').toString()

  if (!id) {
    return {
      status: 'error',
      message: 'Cliente nao encontrado para edicao.',
    }
  }

  const input = {
    name: formData.get('name') ? formData.get('name')!.toString() : undefined,
    email: formData.get('email') ? formData.get('email')!.toString() : undefined,
    document: formData.get('document') ? formData.get('document')!.toString() : undefined,
    phone: formData.get('phone') ? formData.get('phone')!.toString() : undefined,
    address: formData.get('address') ? formData.get('address')!.toString() : undefined,
  }

  const parsed = updateClientSchema.safeParse(input)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Nao foi possivel validar os dados do cliente.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value !== undefined && value !== null)
  )

  if (Object.keys(cleanData).length === 0) {
    return {
      status: 'error',
      message: 'Nenhum dado informado para atualizacao.',
    }
  }

  const result = await updateClient(id, cleanData)

  if (!result.success) {
    return {
      status: 'error',
      message: result.error ?? 'Erro desconhecido ao atualizar cliente.',
    }
  }

  return {
    status: 'success',
    message: 'Cliente atualizado com sucesso.',
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
    revalidatePath(`/clientes/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

const allowedImportFields = new Set(['name', 'email', 'document', 'phone', 'address'])

export async function importClientsFromCSV(
  _prevState: ClientImportState,
  formData: FormData
): Promise<ClientImportState> {
  const file = formData.get('file')

  if (!(file instanceof File) || file.size === 0) {
    return {
      status: 'error',
      message: 'Selecione um arquivo CSV valido.',
    }
  }

  try {
    const raw = await file.text()
    const lines = raw
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (lines.length < 2) {
      return {
        status: 'error',
        message: 'Arquivo CSV vazio ou sem cabecalho.',
      }
    }

    const headers = lines[0].split(',').map(header => header.trim().toLowerCase())

    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Nao foi possivel preparar o contexto de seguranca.')
    }

    let processed = 0
    let created = 0
    let skipped = 0

    const payload: Array<Record<string, unknown>> = []

    for (const line of lines.slice(1)) {
      processed += 1
      const values = line.split(',').map(value => value.trim())
      const row: Record<string, string> = {}

      headers.forEach((header, index) => {
        if (allowedImportFields.has(header)) {
          row[header] = values[index] ?? ''
        }
      })

      const candidate = {
        name: row.name ?? '',
        document: row.document ?? '',
        email: row.email ? row.email : undefined,
        phone: row.phone ? row.phone : undefined,
        address: row.address ? row.address : undefined,
      }

      const parsed = baseClientSchema.safeParse(candidate)

      if (!parsed.success) {
        skipped += 1
        continue
      }

      payload.push({
        ...parsed.data,
        tenant_id: session.tenant_id,
      })
      created += 1
    }

    if (payload.length > 0) {
      const { error } = await supabase.from('clients').insert(payload)

      if (error) {
        throw new Error(`Erro ao importar clientes: ${error.message}`)
      }

      revalidatePath('/clientes')
    }

    return {
      status: 'success',
      message: 'Importacao concluida.',
      summary: {
        processed,
        created,
        skipped,
      },
    }
  } catch (error) {
    console.error('Erro ao importar clientes:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido ao importar clientes.',
    }
  }
}
