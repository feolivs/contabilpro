'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { TaxObligationWithClient } from '@/types/tax-obligations'
import { TAX_OBLIGATION_STATUS_LABELS, TAX_OBLIGATION_TYPE_LABELS } from '@/types/tax-obligations'

import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface FiscalCalendarProps {
  obligations: TaxObligationWithClient[]
}

export function FiscalCalendar({ obligations }: FiscalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Agrupar obrigações por data
  const obligationsByDate = obligations.reduce(
    (acc, obligation) => {
      const date = format(new Date(obligation.due_date), 'yyyy-MM-dd')
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(obligation)
      return acc
    },
    {} as Record<string, TaxObligationWithClient[]>
  )

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400'
      case 'pending':
      case 'calculated':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400'
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <IconCalendar className='h-5 w-5' />
              Calendário Fiscal
            </CardTitle>
            <CardDescription>{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={handleToday}>
              Hoje
            </Button>
            <Button variant='outline' size='icon' onClick={handlePreviousMonth}>
              <IconChevronLeft className='h-4 w-4' />
            </Button>
            <Button variant='outline' size='icon' onClick={handleNextMonth}>
              <IconChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Cabeçalho dos dias da semana */}
        <div className='grid grid-cols-7 gap-2 mb-2'>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className='text-center text-sm font-medium text-muted-foreground py-2'>
              {day}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className='grid grid-cols-7 gap-2'>
          {daysInMonth.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayObligations = obligationsByDate[dateKey] || []
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, currentDate)

            return (
              <div
                key={dateKey}
                className={cn(
                  'min-h-[100px] p-2 rounded-lg border transition-colors',
                  isCurrentMonth ? 'bg-background' : 'bg-muted/30',
                  isToday && 'ring-2 ring-primary',
                  dayObligations.length > 0 && 'hover:bg-accent/50 cursor-pointer'
                )}
              >
                {/* Número do dia */}
                <div
                  className={cn(
                    'text-sm font-medium mb-1',
                    isToday && 'text-primary font-bold',
                    !isCurrentMonth && 'text-muted-foreground'
                  )}
                >
                  {format(day, 'd')}
                </div>

                {/* Obrigações do dia */}
                <div className='space-y-1'>
                  {dayObligations.slice(0, 3).map(obligation => (
                    <div
                      key={obligation.id}
                      className={cn(
                        'text-xs p-1 rounded border truncate',
                        getStatusColor(obligation.status)
                      )}
                      title={`${TAX_OBLIGATION_TYPE_LABELS[obligation.type]} - ${TAX_OBLIGATION_STATUS_LABELS[obligation.status]}`}
                    >
                      {TAX_OBLIGATION_TYPE_LABELS[obligation.type]}
                    </div>
                  ))}
                  {dayObligations.length > 3 && (
                    <div className='text-xs text-muted-foreground text-center'>
                      +{dayObligations.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legenda */}
        <div className='mt-6 flex flex-wrap gap-4 text-sm'>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded border bg-green-100 border-green-200 dark:bg-green-950/30' />
            <span className='text-muted-foreground'>Pago</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded border bg-amber-100 border-amber-200 dark:bg-amber-950/30' />
            <span className='text-muted-foreground'>Pendente</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded border bg-red-100 border-red-200 dark:bg-red-950/30' />
            <span className='text-muted-foreground'>Atrasado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
