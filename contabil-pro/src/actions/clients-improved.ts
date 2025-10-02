/**
 * Server Actions melhoradas para clientes
 * Inclui todos os "parafusos" implementados:
 * - Normalização de documentos
 * - Rate limiting
 * - Busca otimizada
 * - KPIs com views materializadas
 * - CEP server-side
 * - Paginação cursor-based
 */

'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { setRLSContext } from '@/lib/auth/rls'
import { clientSchema } from '@/lib/validations'
import { normalizeDocument, getTipoPessoa } from '@/lib/document-utils'
import { fetchAddressByCEPCached } from '@/lib/cep-utils'
import { requireRateLimit } from '@/lib/rate-limit'
import type { z } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

export interface ClientFormState {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string[]>
  data?: any
}

export interface ClientStats {
  total_clients: number
  ativos: number
  inadimplentes: number
  onboarding: number
  inativos: number
  mei: number
  simples: number
  presumido: number
  real: number
  ultima_atividade_geral: string | null
}

export interface SearchResult {
  id: string
  name: string
  email: string | null
  document: string
  status: string
  regime_tributario: string | null
  similarity: number
}

export interface PaginatedResult<T> {
  data: T[]
  hasNext: boolean
  cursor?: {
    id: string
    name: string
  }
}

// ============================================================================
// CREATE CLIENT (com normalização automática)
// ============================================================================

const createClientSchema = clientSchema.omit({
  id: true,
  tenant_id: true,
  document_norm: true, // Preenchido pelo trigger
  document_type: true, // Inferido pelo trigger
  created_at: true,
  updated_at: true,
})

export async function createClientImproved(
  input: z.infer<typeof createClientSchema>
) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Não foi possível preparar o contexto de segurança.')
    }

    // Rate limiting: 10 criações por minuto
    await requireRateLimit(session.user.id, 'create_client', {
      maxRequests: 10,
      windowSeconds: 60,
    })

    // Validar dados
    const validatedData = createClientSchema.parse(input)

    // Inferir tipo_pessoa se não foi fornecido
    if (!validatedData.tipo_pessoa && validatedData.document) {
      validatedData.tipo_pessoa = getTipoPessoa(validatedData.document) || undefined
    }

    // Inserir cliente (trigger vai normalizar document_norm automaticamente)
    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...validatedData,
        tenant_id: session.tenant_id,
      })
      .select()
      .single()

    if (error) {
      // Tratar erro de duplicação
      if (error.code === '23505') {
        throw new Error('Já existe um cliente com este documento.')
      }
      throw new Error(`Erro ao criar cliente: ${error.message}`)
    }

    // Revalidar cache
    revalidatePath('/clientes')

    // Notificar para refresh de stats (assíncrono)
    try {
      await supabase.rpc('pg_notify', {
        channel: 'refresh_client_stats',
        payload: session.tenant_id,
      })
    } catch {
      // Ignorar erro de notificação
    }

    return { success: true, data }
  } catch (error) {
    console.error('[createClientImproved] Erro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// ============================================================================
// CREATE CLIENT FROM FORM (multi-step)
// ============================================================================

export async function createClientFromFormImproved(
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  try {
    // Parse tags (separadas por vírgula)
    const tagsString = formData.get('tags')?.toString() || ''
    const tags = tagsString
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    // Parse form data
    const input = {
      name: formData.get('name')?.toString() || '',
      email: formData.get('email')?.toString() || undefined,
      document: formData.get('document')?.toString() || '',
      phone: formData.get('phone')?.toString() || undefined,
      address: formData.get('address')?.toString() || undefined,
      city: formData.get('city')?.toString() || undefined,
      state: formData.get('state')?.toString() || undefined,
      zip_code: formData.get('zip_code')?.toString() || undefined,
      notes: formData.get('notes')?.toString() || undefined,

      // Campos fiscais
      tipo_pessoa: formData.get('tipo_pessoa')?.toString() as 'PF' | 'PJ' | undefined,
      regime_tributario: formData.get('regime_tributario')?.toString() as any,
      inscricao_estadual: formData.get('inscricao_estadual')?.toString() || undefined,
      inscricao_municipal: formData.get('inscricao_municipal')?.toString() || undefined,

      // Campos de contato
      cep: formData.get('cep')?.toString() || undefined,
      responsavel_nome: formData.get('responsavel_nome')?.toString() || undefined,
      responsavel_telefone: formData.get('responsavel_telefone')?.toString() || undefined,

      // Campos financeiros
      dia_vencimento: formData.get('dia_vencimento')
        ? Number(formData.get('dia_vencimento'))
        : undefined,
      valor_plano: formData.get('valor_plano')
        ? Number(formData.get('valor_plano'))
        : undefined,
      forma_cobranca: formData.get('forma_cobranca')?.toString() || undefined,

      // Campos de gestão
      tags,
      status: (formData.get('status')?.toString() || 'onboarding') as any,
    }

    // Validar
    const parsed = createClientSchema.safeParse(input)

    if (!parsed.success) {
      return {
        status: 'error',
        message: 'Dados inválidos. Verifique os campos e tente novamente.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    // Criar cliente
    const result = await createClientImproved(parsed.data)

    if (!result.success) {
      return {
        status: 'error',
        message: result.error || 'Erro ao criar cliente.',
      }
    }

    return {
      status: 'success',
      message: 'Cliente criado com sucesso!',
      data: result.data,
    }
  } catch (error) {
    console.error('[createClientFromFormImproved] Erro:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// ============================================================================
// GET CLIENT STATS (usando view materializada)
// ============================================================================

export async function getClientStats(): Promise<ClientStats | null> {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Não foi possível preparar o contexto de segurança.')
    }

    // Buscar da view materializada (muito mais rápido que COUNT(*))
    const { data, error } = await supabase
      .from('client_stats_by_tenant')
      .select('*')
      .eq('tenant_id', session.tenant_id)
      .single()

    if (error) {
      console.error('[getClientStats] Erro:', error)
      return null
    }

    return data as ClientStats
  } catch (error) {
    console.error('[getClientStats] Erro:', error)
    return null
  }
}

// ============================================================================
// SEARCH CLIENTS (com rate limiting e FTS)
// ============================================================================

export async function searchClients(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Não foi possível preparar o contexto de segurança.')
    }

    // Rate limiting: 5 buscas a cada 10 segundos
    await requireRateLimit(session.user.id, 'search_clients', {
      maxRequests: 5,
      windowSeconds: 10,
    })

    // Usar função de busca otimizada do banco
    const { data, error } = await supabase.rpc('search_clients', {
      p_tenant_id: session.tenant_id,
      p_query: query,
      p_limit: limit,
      p_offset: 0,
    })

    if (error) {
      console.error('[searchClients] Erro:', error)
      return []
    }

    return data as SearchResult[]
  } catch (error) {
    console.error('[searchClients] Erro:', error)
    return []
  }
}

// ============================================================================
// GET CLIENTS PAGINATED (cursor-based para >10k clientes)
// ============================================================================

export async function getClientsPaginated(
  cursor?: { id: string; name: string },
  limit: number = 20,
  filters?: {
    status?: string
    regime?: string
  }
): Promise<PaginatedResult<any>> {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Não foi possível preparar o contexto de segurança.')
    }

    // Usar função de paginação cursor-based
    const { data, error } = await supabase.rpc('get_clients_paginated', {
      p_tenant_id: session.tenant_id,
      p_cursor_id: cursor?.id || null,
      p_cursor_name: cursor?.name || null,
      p_limit: limit,
      p_status: filters?.status || null,
      p_regime: filters?.regime || null,
    })

    if (error) {
      console.error('[getClientsPaginated] Erro:', error)
      return { data: [], hasNext: false }
    }

    const results = data as any[]
    const hasNext = results.length > 0 && results[0].has_next

    return {
      data: results,
      hasNext,
      cursor:
        results.length > 0
          ? {
              id: results[results.length - 1].id,
              name: results[results.length - 1].name,
            }
          : undefined,
    }
  } catch (error) {
    console.error('[getClientsPaginated] Erro:', error)
    return { data: [], hasNext: false }
  }
}

// ============================================================================
// FETCH ADDRESS BY CEP (server-side)
// ============================================================================

export async function fetchAddressByCEP(cep: string) {
  try {
    const session = await requireAuth()

    // Rate limiting
    await requireRateLimit(session.user.id, 'fetch_cep', {
      maxRequests: 10,
      windowSeconds: 60,
    })

    // Buscar endereço (com cache)
    const address = await fetchAddressByCEPCached(cep)

    if (!address) {
      return {
        success: false,
        error: 'CEP não encontrado ou inválido.',
      }
    }

    return {
      success: true,
      data: address,
    }
  } catch (error) {
    console.error('[fetchAddressByCEP] Erro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar CEP',
    }
  }
}

