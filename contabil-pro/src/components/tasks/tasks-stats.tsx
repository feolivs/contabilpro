'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTasksStats } from '@/hooks/use-tasks'

import { AlertCircle, CheckCircle2, Clock, ListTodo } from 'lucide-react'

export function TasksStats() {
  const { data: stats, isLoading, error } = useTasksStats()

  if (isLoading) {
    return (
      <div className='grid gap-4 md:grid-cols-4'>
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-4 rounded-full' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-16 mb-1' />
              <Skeleton className='h-3 w-32' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-sm text-muted-foreground'>Erro ao carregar estatísticas</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statsConfig = [
    {
      title: 'Pendentes',
      value: stats.pending,
      description: 'Aguardando início',
      icon: ListTodo,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
    {
      title: 'Em Andamento',
      value: stats.in_progress,
      description: 'Sendo executadas',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Concluídas',
      value: stats.completed,
      description: 'Finalizadas',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Atrasadas',
      value: stats.overdue,
      description: 'Prazo vencido',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  return (
    <div className='grid gap-4 md:grid-cols-4'>
      {statsConfig.map(stat => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>{stat.title}</CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stat.value}</div>
              <p className='text-xs text-muted-foreground'>{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
