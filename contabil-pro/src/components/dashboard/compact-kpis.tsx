'use client'

import type { DashboardSummary, SparklineData } from '@/types/dashboard'

import { CompactKPICard } from './compact-kpi-card'
import { IconAlertCircle, IconCash, IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'

interface CompactKPIsProps {
  summary: DashboardSummary
  sparklines?: {
    revenue?: SparklineData[]
    expense?: SparklineData[]
    netIncome?: SparklineData[]
    overdue?: SparklineData[]
  }
  onKPIClick?: (kpi: string) => void
  overdueAmount?: number
  overdueCount?: number
}

/**
 * Formata valores monetários com abreviação
 * Spec: "R$ 18,2 mil" / "R$ 1,8 mi" (nunca mais que 6-7 caracteres visíveis)
 */
function formatCurrency(value: number): string {
  const absValue = Math.abs(value)

  if (absValue >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)} mi`
  }

  if (absValue >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)} mil`
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function CompactKPIs({
  summary,
  sparklines = {},
  onKPIClick,
  overdueAmount = 0,
  overdueCount = 0,
}: CompactKPIsProps) {
  // Cálculos dos KPIs
  const netIncome = summary.revenue.current - summary.expense.current
  const netIncomePrevious = summary.revenue.previous - summary.expense.previous

  const netIncomeChange = calculateChange(netIncome, netIncomePrevious)
  const revenueChange = calculateChange(summary.revenue.current, summary.revenue.previous)
  const expenseChange = calculateChange(summary.expense.current, summary.expense.previous)

  // Estados vazios
  const hasRevenue = summary.revenue.current > 0 || summary.revenue.previous > 0
  const hasExpense = summary.expense.current > 0 || summary.expense.previous > 0
  const hasNetIncome = netIncome !== 0 || netIncomePrevious !== 0
  const hasOverdue = overdueAmount > 0

  return (
    <div className='flex flex-wrap gap-3'>
      {/* KPI 1: Resultado (30d) - Principal */}
      <CompactKPICard
        title='Resultado (30d)'
        value={formatCurrency(netIncome)}
        change={netIncomeChange}
        trend={netIncome >= 0 ? 'up' : 'down'}
        sparklineData={sparklines.netIncome}
        icon={<IconCash className='h-5 w-5' />}
        onClick={() => onKPIClick?.('netIncome')}
        variant={netIncome >= 0 ? 'success' : 'danger'}
        tooltip='Receita menos Despesas no período de 30 dias'
        isEmpty={!hasNetIncome}
        emptyHint='Sem movimentação'
      />

      {/* KPI 2: Receita (30d) */}
      <CompactKPICard
        title='Receita (30d)'
        value={formatCurrency(summary.revenue.current)}
        change={revenueChange}
        trend='up'
        sparklineData={sparklines.revenue}
        icon={<IconTrendingUp className='h-5 w-5' />}
        onClick={() => onKPIClick?.('revenue')}
        variant='success'
        tooltip='Total de receitas registradas nos últimos 30 dias'
        isEmpty={!hasRevenue}
        emptyHint='Importe extrato'
      />

      {/* KPI 3: Despesas (30d) */}
      <CompactKPICard
        title='Despesas (30d)'
        value={formatCurrency(summary.expense.current)}
        change={expenseChange}
        trend='down'
        sparklineData={sparklines.expense}
        icon={<IconTrendingDown className='h-5 w-5' />}
        onClick={() => onKPIClick?.('expense')}
        variant='danger'
        tooltip='Total de despesas registradas nos últimos 30 dias'
        isEmpty={!hasExpense}
        emptyHint='Importe extrato'
      />

      {/* KPI 4: Inadimplência */}
      <CompactKPICard
        title='Inadimplência'
        value={formatCurrency(overdueAmount)}
        change={0}
        trend='down'
        sparklineData={sparklines.overdue}
        icon={<IconAlertCircle className='h-5 w-5' />}
        onClick={() => onKPIClick?.('overdue')}
        variant='warning'
        tooltip={`${overdueCount} clientes com contas em atraso`}
        isEmpty={!hasOverdue}
        emptyHint='Nenhuma pendência'
      />
    </div>
  )
}
