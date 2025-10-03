'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import type { ActionResponse } from '@/types/actions'
import type {
  TaxObligation,
  TaxObligationWithClient,
  TaxObligationFormData,
  TaxObligationFilters,
  TaxObligationStats,
} from '@/types/tax-obligations'

// Schema de validação
const taxObligationSchema = z.object({
  client_id: z.string().uuid().optional().nullable(),
  type: z.enum([
    'das',
    'irpj',
    'csll',
    'pis',
    'cofins',
    'icms',
    'iss',
    'inss',
    'fgts',
    'dctfweb',
    'defis',
    'dmed',
    'dirf',
    'rais',
    'caged',
    'esocial',
    'efd_contribuicoes',
    'sped_fiscal',
    'other',
  ]),
  period_month: z.number().int().min(1).max(12),
  period_year: z.number().int().min(2020).max(2100),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive().optional().nullable(),
  status: z.enum(['pending', 'calculated', 'paid', 'overdue']).optional(),
  regime_tributario: z.enum(['simples_nacional', 'lucro_presumido', 'lucro_real', 'mei']).optional().nullable(),
  recurrence: z.enum(['once', 'monthly', 'quarterly', 'yearly']).optional().nullable(),
  notes: z.string().optional().nullable(),
})

/**
 * Listar obrigações fiscais com filtros
 */
export async function getTaxObligations(
  filters?: TaxObligationFilters
): Promise<ActionResponse<TaxObligationWithClient[]>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    let query = supabase
      .from('tax_obligations')
      .select(
        `
        *,
        client:clients(id, name)
      `
      )
      .eq('user_id', session.user.id)
      .order('due_date', { ascending: true })

    // Aplicar filtros
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id)
    }
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.regime_tributario) {
      query = query.eq('regime_tributario', filters.regime_tributario)
    }
    if (filters?.period_month) {
      query = query.eq('period_month', filters.period_month)
    }
    if (filters?.period_year) {
      query = query.eq('period_year', filters.period_year)
    }
    if (filters?.from_date) {
      query = query.gte('due_date', filters.from_date)
    }
    if (filters?.to_date) {
      query = query.lte('due_date', filters.to_date)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getTaxObligations] Error:', error)
      return {
        success: false,
        error: 'Erro ao buscar obrigações fiscais',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('[getTaxObligations] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Buscar obrigação fiscal por ID
 */
export async function getTaxObligationById(id: string): Promise<ActionResponse<TaxObligationWithClient>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('tax_obligations')
      .select(
        `
        *,
        client:clients(id, name)
      `
      )
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      console.error('[getTaxObligationById] Error:', error)
      return {
        success: false,
        error: 'Obrigação fiscal não encontrada',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[getTaxObligationById] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Criar nova obrigação fiscal
 */
export async function createTaxObligation(
  input: TaxObligationFormData
): Promise<ActionResponse<TaxObligation>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    // Validar input
    const validated = taxObligationSchema.parse(input)

    // Inserir no banco
    const { data, error } = await supabase
      .from('tax_obligations')
      .insert({
        ...validated,
        user_id: session.user.id,
        status: validated.status || 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('[createTaxObligation] Error:', error)
      return {
        success: false,
        error: 'Erro ao criar obrigação fiscal',
      }
    }

    revalidatePath('/fiscal')
    revalidatePath('/dashboard')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[createTaxObligation] Exception:', error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos: ' + error.errors.map((e) => e.message).join(', '),
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Atualizar obrigação fiscal
 */
export async function updateTaxObligation(
  id: string,
  input: Partial<TaxObligationFormData>
): Promise<ActionResponse<TaxObligation>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    // Validar input parcial
    const validated = taxObligationSchema.partial().parse(input)

    // Atualizar no banco
    const { data, error } = await supabase
      .from('tax_obligations')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('[updateTaxObligation] Error:', error)
      return {
        success: false,
        error: 'Erro ao atualizar obrigação fiscal',
      }
    }

    revalidatePath('/fiscal')
    revalidatePath('/dashboard')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[updateTaxObligation] Exception:', error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Dados inválidos: ' + error.errors.map((e) => e.message).join(', '),
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Deletar obrigação fiscal
 */
export async function deleteTaxObligation(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('tax_obligations')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('[deleteTaxObligation] Error:', error)
      return {
        success: false,
        error: 'Erro ao deletar obrigação fiscal',
      }
    }

    revalidatePath('/fiscal')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('[deleteTaxObligation] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Obter estatísticas de obrigações fiscais
 */
export async function getTaxObligationStats(): Promise<ActionResponse<TaxObligationStats>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('tax_obligations')
      .select('status, amount')
      .eq('user_id', session.user.id)

    if (error) {
      console.error('[getTaxObligationStats] Error:', error)
      return {
        success: false,
        error: 'Erro ao buscar estatísticas',
      }
    }

    const stats: TaxObligationStats = {
      total: data.length,
      pending: data.filter((o) => o.status === 'pending').length,
      calculated: data.filter((o) => o.status === 'calculated').length,
      paid: data.filter((o) => o.status === 'paid').length,
      overdue: data.filter((o) => o.status === 'overdue').length,
      total_amount: data.reduce((sum, o) => sum + (o.amount || 0), 0),
      pending_amount: data.filter((o) => o.status === 'pending').reduce((sum, o) => sum + (o.amount || 0), 0),
      overdue_amount: data.filter((o) => o.status === 'overdue').reduce((sum, o) => sum + (o.amount || 0), 0),
    }

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    console.error('[getTaxObligationStats] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

