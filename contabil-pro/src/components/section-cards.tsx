import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'

import type { DashboardSummary } from '@/actions/dashboard'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface SectionCardsProps {
  summary: DashboardSummary
}

interface MetricDefinition {
  key: keyof DashboardSummary
  title: string
  description: string
  format: 'currency' | 'number'
  invert?: boolean
}

const METRICS: MetricDefinition[] = [
  {
    key: 'revenue',
    title: 'Receita (30 dias)',
    description: 'Soma das receitas registradas no periodo atual.',
    format: 'currency',
  },
  {
    key: 'expense',
    title: 'Despesas (30 dias)',
    description: 'Soma das despesas registradas no periodo atual.',
    format: 'currency',
    invert: true,
  },
  {
    key: 'newClients',
    title: 'Novos clientes',
    description: 'Clientes cadastrados no periodo atual.',
    format: 'number',
  },
  {
    key: 'aiInsights',
    title: 'Insights de IA',
    description: 'Insights gerados pela IA no periodo atual.',
    format: 'number',
  },
]

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

export function SectionCards({ summary }: SectionCardsProps) {
  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
      {METRICS.map(metric => {
        const metricValue = summary[metric.key]
        const { percent, absolute } = calculateDelta(metricValue.current, metricValue.previous)
        const safePercent = Number.isFinite(percent) ? percent : 0
        const isImprovement = metric.invert ? absolute <= 0 : absolute >= 0
        const Icon = isImprovement ? IconTrendingUp : IconTrendingDown
        const formattedValue = formatValue(metricValue.current, metric.format)
        const formattedPercent = percentFormatter.format(Math.abs(safePercent))
        const sign = safePercent === 0 ? '' : safePercent > 0 ? '+' : '-'
        const trendLabel = buildTrendLabel(isImprovement, metric.invert, safePercent)

        return (
          <Card key={metric.key} className='@container/card'>
            <CardHeader>
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {formattedValue}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <Icon className='size-4' />
                  {`${sign}${formattedPercent}%`}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>{trendLabel}</div>
              <div className='text-muted-foreground'>{metric.description}</div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}

function formatValue(value: number, format: MetricDefinition['format']): string {
  if (format === 'currency') {
    return currencyFormatter.format(value)
  }

  return numberFormatter.format(value)
}

function calculateDelta(current: number, previous: number) {
  const absolute = current - previous
  const percent = previous === 0 ? (current > 0 ? 100 : 0) : (absolute / previous) * 100
  return { absolute, percent }
}

function buildTrendLabel(isImprovement: boolean, invert: boolean | undefined, percent: number) {
  if (percent === 0) {
    return 'Estavel em relacao ao periodo anterior'
  }

  if (isImprovement) {
    return invert ? 'Queda positiva no periodo' : 'Crescimento no periodo'
  }

  return invert ? 'Alta requer atencao' : 'Queda requer atencao'
}
