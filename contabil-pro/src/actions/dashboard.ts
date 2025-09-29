'use server'

import { requireAuth, setRLSContext } from '@/lib/auth'

export interface DashboardMetricDelta {
  current: number
  previous: number
}

export interface DashboardSummary {
  revenue: DashboardMetricDelta
  expense: DashboardMetricDelta
  newClients: DashboardMetricDelta
  bankTransactions: DashboardMetricDelta
  aiInsights: DashboardMetricDelta
}

export interface TrendPoint {
  bucket: string
  revenue: number
  expense: number
}

export interface RecentActivityItem {
  source: string
  title: string
  description: string
  created_at: string
  reference: string | null
}

interface ActionResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export async function getDashboardSummary(
  rangeDays = 30
): Promise<ActionResponse<DashboardSummary>> {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Nao foi possivel preparar o contexto de seguranca.')
    }

    const { data, error } = await supabase.rpc('dashboard_summary', {
      range_days: rangeDays,
    })

    if (error) {
      throw new Error(error.message)
    }

    const record = Array.isArray(data) ? data[0] : data

    const summary: DashboardSummary = {
      revenue: {
        current: Number(record?.revenue_current ?? 0),
        previous: Number(record?.revenue_previous ?? 0),
      },
      expense: {
        current: Number(record?.expense_current ?? 0),
        previous: Number(record?.expense_previous ?? 0),
      },
      newClients: {
        current: Number(record?.new_clients_current ?? 0),
        previous: Number(record?.new_clients_previous ?? 0),
      },
      bankTransactions: {
        current: Number(record?.bank_transactions_current ?? 0),
        previous: Number(record?.bank_transactions_previous ?? 0),
      },
      aiInsights: {
        current: Number(record?.ai_insights_current ?? 0),
        previous: Number(record?.ai_insights_previous ?? 0),
      },
    }

    return { success: true, data: summary }
  } catch (error) {
    console.error('Erro ao carregar resumo do dashboard:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao carregar resumo.',
    }
  }
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
