'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface TaxObligation {
  id: string
  name: string
  dueDate: string
  status: 'pending' | 'done' | 'overdue'
  amount?: number
}

interface TaxObligationsPanelProps {
  obligations?: TaxObligation[]
}

const statusConfig = {
  done: {
    label: 'Em dia',
    icon: IconCheck,
    variant: 'default' as const,
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400',
  },
  pending: {
    label: 'Pendente',
    icon: IconClock,
    variant: 'secondary' as const,
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400',
  },
  overdue: {
    label: 'Atrasado',
    icon: IconAlertCircle,
    variant: 'destructive' as const,
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400',
  },
}

const mockObligations: TaxObligation[] = [
  {
    id: '1',
    name: 'DAS - Simples Nacional',
    dueDate: '2025-10-20',
    status: 'pending',
    amount: 1250.0,
  },
  {
    id: '2',
    name: 'DCTFWeb',
    dueDate: '2025-10-15',
    status: 'done',
  },
  {
    id: '3',
    name: 'DEFIS',
    dueDate: '2025-10-31',
    status: 'pending',
  },
]

export function TaxObligationsPanel({ obligations = mockObligations }: TaxObligationsPanelProps) {
  const sortedObligations = [...obligations].sort((a, b) => {
    const statusOrder = { overdue: 0, pending: 1, done: 2 }
    return statusOrder[a.status] - statusOrder[b.status]
  })

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Obrigações Fiscais</CardTitle>
        <CardDescription className="text-xs">Próximos 30 dias</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedObligations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <IconCheck className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma obrigação pendente
            </p>
          </div>
        ) : (
          sortedObligations.map((obligation) => {
            const config = statusConfig[obligation.status]
            const StatusIcon = config.icon
            const dueDate = new Date(obligation.dueDate)
            const formattedDate = dueDate.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            })

            return (
              <div
                key={obligation.id}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors',
                  'hover:bg-accent/50'
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <StatusIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{obligation.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Venc. {formattedDate}
                      {obligation.amount && (
                        <span className="ml-2 font-mono">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(obligation.amount)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn('flex-shrink-0 text-[10px] h-5 px-2', config.className)}
                >
                  {config.label}
                </Badge>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

