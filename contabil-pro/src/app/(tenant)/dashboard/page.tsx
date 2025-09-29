import type { DashboardSummary } from '@/actions/dashboard'
import { getDashboardSummary, getDashboardTrend, getRecentActivity } from '@/actions/dashboard'
import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { RecentActivityList } from '@/components/recent-activity-list'
import { SectionCards } from '@/components/section-cards'
import { requirePermission } from '@/lib/rbac'

const EMPTY_SUMMARY: DashboardSummary = {
  revenue: { current: 0, previous: 0 },
  expense: { current: 0, previous: 0 },
  newClients: { current: 0, previous: 0 },
  bankTransactions: { current: 0, previous: 0 },
  aiInsights: { current: 0, previous: 0 },
}

export default async function DashboardPage() {
  await requirePermission('dashboard.read')

  const [summaryResult, trendResult, activityResult] = await Promise.all([
    getDashboardSummary(),
    getDashboardTrend(),
    getRecentActivity(),
  ])

  const summary = summaryResult.success && summaryResult.data ? summaryResult.data : EMPTY_SUMMARY
  const trend = trendResult.success && trendResult.data ? trendResult.data : []
  const activities = activityResult.success && activityResult.data ? activityResult.data : []

  return (
    <div className='space-y-6 p-6'>
      <header className='space-y-1'>
        <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
        <p className='text-sm text-muted-foreground'>
          Visao consolidada das metricas do escritorio no periodo recente.
        </p>
      </header>

      <SectionCards summary={summary} />

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <div className='md:col-span-2 lg:col-span-2'>
          <ChartAreaInteractive data={trend} />
        </div>
        <aside className='space-y-3 rounded-lg border p-4'>
          <h2 className='font-semibold'>Atividades recentes</h2>
          <RecentActivityList items={activities} />
        </aside>
      </div>
    </div>
  )
}
