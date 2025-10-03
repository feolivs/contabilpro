'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { IconArrowRight, IconFileInvoice, IconFileText, IconReceipt } from '@tabler/icons-react'

interface InboxItem {
  id: string
  type: 'nfe' | 'nfse' | 'document'
  title: string
  date: string
  count?: number
}

interface AccountingInboxProps {
  items?: InboxItem[]
  overdueReceivables?: {
    total: number
    ranges: Array<{ label: string; amount: number; count: number }>
  }
}

const typeConfig = {
  nfe: {
    icon: IconFileInvoice,
    label: 'NF-e',
    className: 'text-blue-600 dark:text-blue-400',
  },
  nfse: {
    icon: IconReceipt,
    label: 'NFS-e',
    className: 'text-purple-600 dark:text-purple-400',
  },
  document: {
    icon: IconFileText,
    label: 'Documento',
    className: 'text-amber-600 dark:text-amber-400',
  },
}

const mockItems: InboxItem[] = [
  {
    id: '1',
    type: 'nfe',
    title: 'NF-e pendentes de classificação',
    date: '2025-10-01',
    count: 8,
  },
  {
    id: '2',
    type: 'nfse',
    title: 'NFS-e a processar',
    date: '2025-10-02',
    count: 3,
  },
  {
    id: '3',
    type: 'document',
    title: 'Documentos aguardando revisão',
    date: '2025-10-03',
    count: 12,
  },
]

const mockOverdueReceivables = {
  total: 45800.0,
  ranges: [
    { label: '0-30 dias', amount: 18200.0, count: 5 },
    { label: '31-60 dias', amount: 15600.0, count: 3 },
    { label: '60+ dias', amount: 12000.0, count: 2 },
  ],
}

export function AccountingInbox({
  items = mockItems,
  overdueReceivables = mockOverdueReceivables,
}: AccountingInboxProps) {
  const totalPending = items.reduce((sum, item) => sum + (item.count || 0), 0)

  return (
    <div className='grid gap-4 md:grid-cols-2'>
      {/* Inbox de Documentos */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Inbox Contábil</CardTitle>
          <CardDescription className='text-xs'>
            {totalPending} {totalPending === 1 ? 'item pendente' : 'itens pendentes'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          {items.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-6 text-center'>
              <IconFileText className='h-8 w-8 text-muted-foreground/50 mb-2' />
              <p className='text-sm text-muted-foreground'>Inbox vazio</p>
            </div>
          ) : (
            items.map(item => {
              const config = typeConfig[item.type]
              const ItemIcon = config.icon

              return (
                <button
                  key={item.id}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors',
                    'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                >
                  <div className='flex items-center gap-3 min-w-0 flex-1'>
                    <ItemIcon className={cn('h-5 w-5 flex-shrink-0', config.className)} />
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium truncate'>{item.title}</p>
                      <p className='text-xs text-muted-foreground'>
                        {new Date(item.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant='secondary'
                    className='flex-shrink-0 h-6 min-w-[2rem] justify-center'
                  >
                    {item.count}
                  </Badge>
                </button>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Contas a Receber em Atraso */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Contas a Receber</CardTitle>
          <CardDescription className='text-xs'>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(overdueReceivables.total)}{' '}
            em atraso
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          {overdueReceivables.ranges.map((range, index) => {
            const percentage =
              overdueReceivables.total > 0 ? (range.amount / overdueReceivables.total) * 100 : 0

            return (
              <div
                key={index}
                className='flex items-center justify-between gap-3 rounded-lg border p-3'
              >
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between gap-2 mb-1'>
                    <p className='text-sm font-medium'>{range.label}</p>
                    <p className='text-xs text-muted-foreground'>
                      {range.count} {range.count === 1 ? 'cliente' : 'clientes'}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='flex-1 h-1.5 bg-muted rounded-full overflow-hidden'>
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          index === 0 && 'bg-amber-500',
                          index === 1 && 'bg-orange-500',
                          index === 2 && 'bg-red-500'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className='text-xs font-mono font-semibold tabular-nums'>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        notation: 'compact',
                      }).format(range.amount)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          <Button variant='outline' size='sm' className='w-full mt-2'>
            Ver detalhes
            <IconArrowRight className='ml-2 h-4 w-4' />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
