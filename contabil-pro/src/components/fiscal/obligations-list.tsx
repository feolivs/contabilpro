'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { TaxObligationWithClient } from '@/types/tax-obligations'
import { TAX_OBLIGATION_TYPE_LABELS } from '@/types/tax-obligations'

import { IconAlertCircle, IconCheck, IconClock, IconCurrencyReal } from '@tabler/icons-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ObligationsListProps {
  obligations: TaxObligationWithClient[]
  title?: string
  description?: string
}

const statusConfig = {
  paid: {
    label: 'Pago',
    icon: IconCheck,
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400',
  },
  pending: {
    label: 'Pendente',
    icon: IconClock,
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400',
  },
  calculated: {
    label: 'Calculado',
    icon: IconClock,
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400',
  },
  overdue: {
    label: 'Atrasado',
    icon: IconAlertCircle,
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400',
  },
}

export function ObligationsList({
  obligations,
  title = 'Próximas Obrigações',
  description = 'Obrigações fiscais dos próximos 30 dias',
}: ObligationsListProps) {
  // Ordenar por data de vencimento
  const sortedObligations = [...obligations].sort((a, b) => {
    // Priorizar atrasadas
    if (a.status === 'overdue' && b.status !== 'overdue') return -1
    if (a.status !== 'overdue' && b.status === 'overdue') return 1
    // Depois por data
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  if (sortedObligations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <IconCheck className='h-12 w-12 text-muted-foreground/50 mb-3' />
            <p className='text-sm font-medium'>Nenhuma obrigação pendente</p>
            <p className='text-xs text-muted-foreground mt-1'>
              Todas as obrigações fiscais estão em dia
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {sortedObligations.map(obligation => {
          const config = statusConfig[obligation.status]
          const StatusIcon = config.icon
          const dueDate = new Date(obligation.due_date)
          const formattedDate = format(dueDate, "dd 'de' MMMM", { locale: ptBR })

          return (
            <div
              key={obligation.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                'hover:bg-accent/50'
              )}
            >
              {/* Ícone de status */}
              <div className='flex-shrink-0 mt-0.5'>
                <StatusIcon className='h-5 w-5 text-muted-foreground' />
              </div>

              {/* Conteúdo principal */}
              <div className='flex-1 min-w-0 space-y-1'>
                {/* Título e tipo */}
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium truncate'>
                      {TAX_OBLIGATION_TYPE_LABELS[obligation.type]}
                    </p>
                    {obligation.client && (
                      <p className='text-xs text-muted-foreground truncate'>
                        Cliente: {obligation.client.name}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant='outline'
                    className={cn('flex-shrink-0 text-[10px] h-5 px-2', config.className)}
                  >
                    {config.label}
                  </Badge>
                </div>

                {/* Data de vencimento */}
                <p className='text-xs text-muted-foreground'>Vencimento: {formattedDate}</p>

                {/* Valor */}
                {obligation.amount && (
                  <div className='flex items-center gap-1 text-xs font-mono'>
                    <IconCurrencyReal className='h-3 w-3' />
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(obligation.amount)}
                  </div>
                )}

                {/* Notas */}
                {obligation.notes && (
                  <p className='text-xs text-muted-foreground line-clamp-2'>{obligation.notes}</p>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
