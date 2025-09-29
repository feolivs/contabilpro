import type { DashboardSummary } from '@/types/dashboard'
import { getDashboardSummary, getDashboardTrend, getRecentActivity } from '@/actions/dashboard'
import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { CompactKPIs } from '@/components/dashboard/compact-kpis'
import { TaxObligationsPanel } from '@/components/dashboard/tax-obligations-panel'
import { PriorityTasksPanel } from '@/components/dashboard/priority-tasks-panel'
import { SmartAlertsPanel } from '@/components/dashboard/smart-alerts-panel'
import { AccountingInbox } from '@/components/dashboard/accounting-inbox'
import { CashFlowProjection } from '@/components/dashboard/cash-flow-projection'
import { requirePermission } from '@/lib/rbac'

const EMPTY_SUMMARY: DashboardSummary = {
  revenue: { current: 0, previous: 0 },
  expense: { current: 0, previous: 0 },
  netIncome: { current: 0, previous: 0 },
  activeClients: { current: 0, previous: 0 },
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

  // Mock de inadimplência (TODO: buscar dados reais)
  const overdueAmount = 45800
  const overdueCount = 10

  return (
    <div className='space-y-4 p-4 lg:p-6'>
      {/* Header compacto */}
      <header className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <p className='text-xs text-muted-foreground'>
            Visão consolidada • Atualizado agora
          </p>
        </div>
      </header>

      {/* KPIs Compactos - Faixa Superior */}
      <CompactKPIs
        summary={summary}
        overdueAmount={overdueAmount}
        overdueCount={overdueCount}
      />

      {/* Grid Principal: Gráfico + Painel Lateral */}
      <div className='grid gap-4 lg:grid-cols-12'>
        {/* Coluna Principal: Gráficos */}
        <div className='space-y-4 lg:col-span-8'>
          <ChartAreaInteractive data={trend} />
          <CashFlowProjection />
        </div>

        {/* Coluna Lateral Direita: Painéis de Ação */}
        <aside className='space-y-4 lg:col-span-4'>
          <TaxObligationsPanel />
          <PriorityTasksPanel />
          <SmartAlertsPanel />
        </aside>
      </div>

      {/* Rodapé: Inbox Contábil + Contas a Receber */}
      <AccountingInbox />
    </div>
  )
}
