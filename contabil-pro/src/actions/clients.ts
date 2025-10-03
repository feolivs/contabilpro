'use server'

import { revalidatePath } from 'next/cache'

import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { clientSchema } from '@/lib/validation'
import type { ClientFormState, ClientImportState } from '@/types/clients'

import { type z } from 'zod'

const baseClientSchema = clientSchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
})

const updateClientSchema = baseClientSchema.partial()

export async function createClient(input: z.infer<typeof baseClientSchema>) {
  try {
    await requireAuth()
    const supabase = await createServerClient()

    const validatedData = baseClientSchema.parse(input)

    const { data, error } = await supabase.from('clients').insert(validatedData).select().single()

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
    console.log('[getClients] Session:', {
      userId: session.user.id,
      role: session.role,
    })

    const supabase = await createServerClient()

    // Buscar clientes (RLS simplificado filtra automaticamente)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('[getClients] Query result:', {
      dataCount: data?.length || 0,
      error: error?.message,
    })

    if (error) {
      console.error('[getClients] Supabase error:', error)
      throw new Error(`Erro ao buscar clientes: ${error.message}`)
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('[getClients] Erro completo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: [],
    }
  }
}

export async function getClientById(id: string) {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

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
    const supabase = await createServerClient()

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
    const supabase = await createServerClient()

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
    const supabase = await createServerClient()

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

/**
 * Busca estatísticas de clientes da view materializada
 * Usa a view client_stats_by_tenant (implementada na migration 012)
 *
 * @returns Estatísticas agregadas de clientes
 */
export async function getClientStats() {
  try {
    const session = await requireAuth()

    // TEMPORÁRIO: Usar createServerClient diretamente
    const { createServerClient } = await import('@/lib/supabase')
    const supabase = await createServerClient()

    // Buscar da view materializada (RLS simplificado filtra automaticamente)
    const { data, error } = await supabase
      .from('client_stats_by_tenant')
      .select('*')
      .limit(1)
      .maybeSingle()

    console.log('[getClientStats] Result:', { data, error: error?.message })

    if (error) {
      console.error('[getClientStats] Erro ao buscar estatísticas:', error)
      // Retornar valores padrão em caso de erro
      return {
        total_clients: 0,
        active_clients: 0,
        total_revenue: 0,
        growth_rate: 0,
      }
    }

    // A view tem campos: total_clients, ativos, inadimplentes, etc.
    // Mapear para o formato esperado pelo frontend
    return {
      total_clients: data?.total_clients || 0,
      active_clients: data?.ativos || 0, // Campo correto da view
      total_revenue: 0, // TODO: calcular receita (valor_plano * clientes ativos)
      growth_rate: 0, // TODO: calcular crescimento
    }
  } catch (error) {
    console.error('[getClientStats] Erro completo:', error)
    return {
      total_clients: 0,
      active_clients: 0,
      total_revenue: 0,
      growth_rate: 0,
    }
  }
}

/**
 * Busca clientes por nome, documento ou email
 * Usa a função search_clients() do banco (implementada na migration 012)
 *
 * @param query - Termo de busca
 * @returns Array de clientes encontrados (máximo 10)
 */
export async function searchClients(query: string) {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    // Validar query
    if (!query || query.trim().length < 2) {
      return []
    }

    const cleanQuery = query.trim()

    // Usar a função search_clients() do banco (migration 012)
    // Ela já implementa FTS e ranking por similaridade
    const { data, error } = await supabase.rpc('search_clients', {
      search_query: cleanQuery,
      result_limit: 10,
    })

    if (error) {
      console.error('Erro ao buscar clientes:', error)
      return []
    }

    // Mapear para o formato esperado pelo CommandPalette
    return (data || []).map((client: any) => ({
      id: client.id,
      name: client.name,
      document: client.document,
      email: client.email,
      type: 'client' as const,
    }))
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return []
  }
}

/**
 * Ativar múltiplos clientes
 */
export async function bulkActivateClients(clientIds: string[]) {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    const { error } = await supabase.from('clients').update({ status: 'ativo' }).in('id', clientIds)

    if (error) {
      throw new Error(`Erro ao ativar clientes: ${error.message}`)
    }

    revalidatePath('/clientes')
    return { success: true }
  } catch (error) {
    console.error('Erro ao ativar clientes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Inativar múltiplos clientes
 */
export async function bulkDeactivateClients(clientIds: string[]) {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('clients')
      .update({ status: 'inativo' })
      .in('id', clientIds)

    if (error) {
      throw new Error(`Erro ao inativar clientes: ${error.message}`)
    }

    revalidatePath('/clientes')
    return { success: true }
  } catch (error) {
    console.error('Erro ao inativar clientes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Excluir múltiplos clientes
 */
export async function bulkDeleteClients(clientIds: string[]) {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    const { error } = await supabase.from('clients').delete().in('id', clientIds)

    if (error) {
      throw new Error(`Erro ao excluir clientes: ${error.message}`)
    }

    revalidatePath('/clientes')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir clientes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}
