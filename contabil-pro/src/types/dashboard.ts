/**
 * Tipos do dashboard
 * Separado dos Server Actions para evitar conflitos com "use server"
 */

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

export interface DashboardFilters {
  dateRange: {
    from: string
    to: string
  }
  clients?: string[]
  accounts?: string[]
}

export interface DashboardMetrics {
  summary: DashboardSummary
  trend: TrendPoint[]
  recentActivity: RecentActivityItem[]
  lastUpdated: string
}
