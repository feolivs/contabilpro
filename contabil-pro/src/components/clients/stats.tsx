'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { IconCurrencyReal, IconTrendingUp, IconUserCheck, IconUsers } from '@tabler/icons-react'

interface ClientStatsProps {
  stats?: {
    total_clients: number
    active_clients: number
    total_revenue: number
    growth_rate: number
  }
  isLoading?: boolean
}

/**
 * Mini-KPIs de clientes
 *
 * Exibe 4 métricas principais:
 * - Total de clientes
 * - Clientes ativos
 * - Receita total (MRR)
 * - Taxa de crescimento
 *
 * Features:
 * - Loading states com skeleton
 * - Formatação de valores (moeda, porcentagem)
 * - Ícones visuais
 * - Responsivo (grid adaptável)
 */
export function ClientStats({ stats, isLoading }: ClientStatsProps) {
  if (isLoading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <Skeleton className='h-4 w-[100px]' />
              <Skeleton className='h-4 w-4 rounded-full' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-[80px] mb-1' />
              <Skeleton className='h-3 w-[120px]' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const { total_clients = 0, active_clients = 0, total_revenue = 0, growth_rate = 0 } = stats || {}

  const kpis = [
    {
      title: 'Total de Clientes',
      value: total_clients,
      description: 'Clientes cadastrados',
      icon: IconUsers,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Clientes Ativos',
      value: active_clients,
      description: `${total_clients > 0 ? Math.round((active_clients / total_clients) * 100) : 0}% do total`,
      icon: IconUserCheck,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Receita Mensal (MRR)',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
      }).format(total_revenue),
      description: 'Receita recorrente',
      icon: IconCurrencyReal,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Crescimento',
      value: `${growth_rate > 0 ? '+' : ''}${growth_rate.toFixed(1)}%`,
      description: 'Últimos 30 dias',
      icon: IconTrendingUp,
      iconColor: growth_rate >= 0 ? 'text-emerald-600' : 'text-red-600',
      iconBg:
        growth_rate >= 0
          ? 'bg-emerald-100 dark:bg-emerald-900/20'
          : 'bg-red-100 dark:bg-red-900/20',
    },
  ]

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {kpis.map(kpi => {
        const Icon = kpi.icon

        return (
          <Card key={kpi.title}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>{kpi.title}</CardTitle>
              <div className={`rounded-full p-2 ${kpi.iconBg}`}>
                <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{kpi.value}</div>
              <p className='text-xs text-muted-foreground'>{kpi.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/**
 * Versão compacta dos KPIs (para sidebar ou header)
 */
export function ClientStatsCompact({ stats, isLoading }: ClientStatsProps) {
  if (isLoading) {
    return (
      <div className='flex items-center gap-4'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='flex items-center gap-2'>
            <Skeleton className='h-8 w-8 rounded-full' />
            <div>
              <Skeleton className='h-4 w-[60px] mb-1' />
              <Skeleton className='h-3 w-[40px]' />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const { total_clients = 0, active_clients = 0, total_revenue = 0, growth_rate = 0 } = stats || {}

  const kpis = [
    {
      label: 'Total',
      value: total_clients,
      icon: IconUsers,
      color: 'text-blue-600',
    },
    {
      label: 'Ativos',
      value: active_clients,
      icon: IconUserCheck,
      color: 'text-green-600',
    },
    {
      label: 'MRR',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        notation: 'compact',
      }).format(total_revenue),
      icon: IconCurrencyReal,
      color: 'text-purple-600',
    },
    {
      label: 'Crescimento',
      value: `${growth_rate > 0 ? '+' : ''}${growth_rate.toFixed(1)}%`,
      icon: IconTrendingUp,
      color: growth_rate >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
  ]

  return (
    <div className='flex items-center gap-4 overflow-x-auto'>
      {kpis.map(kpi => {
        const Icon = kpi.icon

        return (
          <div key={kpi.label} className='flex items-center gap-2 min-w-fit'>
            <Icon className={`h-5 w-5 ${kpi.color}`} />
            <div>
              <div className='text-sm font-semibold'>{kpi.value}</div>
              <div className='text-xs text-muted-foreground'>{kpi.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
