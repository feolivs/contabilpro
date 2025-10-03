'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import {
  IconAlertTriangle,
  IconArrowRight,
  IconCircleCheck,
  IconSparkles,
  IconX,
} from '@tabler/icons-react'

interface SmartAlert {
  id: string
  type: 'anomaly' | 'suggestion' | 'missing' | 'risk'
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
}

interface SmartAlertsPanelProps {
  alerts?: SmartAlert[]
  onDismiss?: (alertId: string) => void
}

const alertConfig = {
  anomaly: {
    icon: IconAlertTriangle,
    className: 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20',
    iconClassName: 'text-amber-600 dark:text-amber-400',
  },
  suggestion: {
    icon: IconSparkles,
    className: 'border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20',
    iconClassName: 'text-blue-600 dark:text-blue-400',
  },
  missing: {
    icon: IconAlertTriangle,
    className: 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20',
    iconClassName: 'text-red-600 dark:text-red-400',
  },
  risk: {
    icon: IconAlertTriangle,
    className: 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20',
    iconClassName: 'text-red-600 dark:text-red-400',
  },
}

const mockAlerts: SmartAlert[] = [
  {
    id: '1',
    type: 'anomaly',
    title: 'Despesa atípica detectada',
    description: 'Despesa de "Serviços" +75% vs. média 3 meses. Verificar.',
    dismissible: true,
  },
  {
    id: '2',
    type: 'suggestion',
    title: 'Conciliações pendentes',
    description: '12 transações com match >95% aguardando confirmar',
    action: {
      label: 'Revisar',
      onClick: () => console.log('Navigate to reconciliation'),
    },
    dismissible: true,
  },
  {
    id: '3',
    type: 'missing',
    title: 'Documentos faltantes',
    description: '17 lançamentos sem comprovante',
    action: {
      label: 'Solicitar',
      onClick: () => console.log('Request documents'),
    },
    dismissible: false,
  },
]

export function SmartAlertsPanel({ alerts = mockAlerts, onDismiss }: SmartAlertsPanelProps) {
  return (
    <Card className='h-full'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base'>Alertas Inteligentes</CardTitle>
        <CardDescription className='text-xs'>
          {alerts.length} {alerts.length === 1 ? 'alerta ativo' : 'alertas ativos'}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-2'>
        {alerts.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <IconCircleCheck className='h-8 w-8 text-muted-foreground/50 mb-2' />
            <p className='text-sm text-muted-foreground'>Nenhum alerta no momento</p>
          </div>
        ) : (
          alerts.map(alert => {
            const config = alertConfig[alert.type]
            const AlertIcon = config.icon

            return (
              <div
                key={alert.id}
                className={cn(
                  'relative flex gap-3 rounded-lg border p-3 transition-colors',
                  config.className
                )}
              >
                <AlertIcon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconClassName)} />
                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between gap-2'>
                    <h4 className='text-sm font-semibold leading-tight'>{alert.title}</h4>
                    {alert.dismissible && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-5 w-5 p-0 hover:bg-background/50'
                        onClick={() => onDismiss?.(alert.id)}
                      >
                        <IconX className='h-3 w-3' />
                        <span className='sr-only'>Dispensar</span>
                      </Button>
                    )}
                  </div>
                  <p className='mt-1 text-xs text-muted-foreground leading-relaxed'>
                    {alert.description}
                  </p>
                  {alert.action && (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='mt-2 h-7 px-2 text-xs font-medium'
                      onClick={alert.action.onClick}
                    >
                      {alert.action.label}
                      <IconArrowRight className='ml-1 h-3 w-3' />
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
