'use server'

import { requireAuth } from '@/lib/auth'
import { setRLSContext } from '@/lib/auth/rls'
import type { ResilientResponse } from '@/lib/resilience'
import { DASHBOARD_FALLBACK_DATA, withResilience } from '@/lib/resilience'
import type { ActionResponse } from '@/types/actions'
import type { DashboardSummary, RecentActivityItem, TrendPoint } from '@/types/dashboard'

export async function getDashboardSummary(
  rangeDays = 30
): Promise<ResilientResponse<DashboardSummary>> {
  const operation = async (): Promise<DashboardSummary> => {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Nao foi possivel preparar o contexto de seguranca.')
    }

    const { data, error } = await supabase.rpc('dashboard_summary_v1', {
      p_range_days: rangeDays,
    })

    if (error) {
      throw new Error(error.message)
    }

    // Verificar resposta canônica
    if (!data || data.status !== 'success') {
      throw new Error(data?.message || 'Erro desconhecido ao carregar métricas')
    }

    const payload = data.payload

    const revenueCurrent = Number(payload?.revenue?.current ?? 0)
    const revenuePrevious = Number(payload?.revenue?.previous ?? 0)
    const expenseCurrent = Number(payload?.expense?.current ?? 0)
    const expensePrevious = Number(payload?.expense?.previous ?? 0)

    return {
      revenue: {
        current: revenueCurrent,
        previous: revenuePrevious,
      },
      expense: {
        current: expenseCurrent,
        previous: expensePrevious,
      },
      netIncome: {
        current: revenueCurrent - expenseCurrent,
        previous: revenuePrevious - expensePrevious,
      },
      activeClients: {
        current: Number(payload?.active_clients?.current ?? 0),
        previous: Number(payload?.active_clients?.previous ?? 0),
      },
      newClients: {
        current: Number(payload?.new_clients?.current ?? 0),
        previous: Number(payload?.new_clients?.previous ?? 0),
      },
      bankTransactions: {
        current: Number(payload?.bank_transactions?.current ?? 0),
        previous: Number(payload?.bank_transactions?.previous ?? 0),
      },
      aiInsights: {
        current: Number(payload?.ai_insights?.current ?? 0),
        previous: Number(payload?.ai_insights?.previous ?? 0),
      },
    }
  }

  return await withResilience(operation, DASHBOARD_FALLBACK_DATA.summary, {
    maxRetries: 2,
    fallbackToCache: true,
    showErrorToUser: true,
  })
}

export async function getDashboardTrend(rangeDays = 90): Promise<ActionResponse<TrendPoint[]>> {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Nao foi possivel preparar o contexto de seguranca.')
    }

    const { data, error } = await supabase.rpc('dashboard_trend', {
      range_days: rangeDays,
    })

    if (error) {
      throw new Error(error.message)
    }

    const points: TrendPoint[] = Array.isArray(data)
      ? data.map(point => ({
          bucket: String(point.bucket),
          revenue: Number(point.revenue ?? 0),
          expense: Number(point.expense ?? 0),
        }))
      : []

    return { success: true, data: points }
  } catch (error) {
    console.error('Erro ao carregar tendencia do dashboard:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao carregar tendencia.',
    }
  }
}

export async function getRecentActivity(limit = 10): Promise<ActionResponse<RecentActivityItem[]>> {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Nao foi possivel preparar o contexto de seguranca.')
    }

    const { data, error } = await supabase.rpc('dashboard_recent_activity', {
      limit_count: limit,
    })

    if (error) {
      throw new Error(error.message)
    }

    const items: RecentActivityItem[] = Array.isArray(data)
      ? data.map(item => ({
          source: String(item.source ?? 'unknown'),
          title: String(item.title ?? 'Sem titulo'),
          description: String(item.description ?? ''),
          created_at: new Date(item.created_at ?? new Date()).toISOString(),
          reference: item.reference ? String(item.reference) : null,
        }))
      : []

    return { success: true, data: items }
  } catch (error) {
    console.error('Erro ao carregar atividades recentes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao carregar atividades.',
    }
  }
}
