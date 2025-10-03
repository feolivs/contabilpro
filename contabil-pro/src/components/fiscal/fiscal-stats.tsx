'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TaxObligationStats } from '@/types/tax-obligations'

import { IconAlertCircle, IconCheck, IconClock, IconCurrencyReal } from '@tabler/icons-react'

interface FiscalStatsProps {
  stats: TaxObligationStats
}

export function FiscalStats({ stats }: FiscalStatsProps) {
  const cards = [
    {
      title: 'Total de Obrigações',
      value: stats.total,
      icon: IconCurrencyReal,
      description: 'Obrigações cadastradas',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      title: 'Pendentes',
      value: stats.pending,
      icon: IconClock,
      description: `R$ ${stats.pending_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      title: 'Pagas',
      value: stats.paid,
      icon: IconCheck,
      description: 'Obrigações quitadas',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      title: 'Atrasadas',
      value: stats.overdue,
      icon: IconAlertCircle,
      description: `R$ ${stats.overdue_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
    },
  ]

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {cards.map(card => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>{card.title}</CardTitle>
              <div className={`rounded-full p-2 ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{card.value}</div>
              <p className='text-xs text-muted-foreground'>{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
