'use client'

import { useState } from 'react'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, X } from 'lucide-react'

interface TimelineFiltersProps {
  onDateRangeChange: (range: DateRange | undefined) => void
  onPresetSelect: (preset: string) => void
  className?: string
}

const PRESETS = [
  { label: 'Hoje', value: 'today' },
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
  { label: 'Este mês', value: 'month' },
  { label: '3 meses', value: '3m' },
  { label: 'Este ano', value: 'year' },
] as const

export function TimelineFilters({
  onDateRangeChange,
  onPresetSelect,
  className,
}: TimelineFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isOpen, setIsOpen] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const handlePresetClick = (preset: string) => {
    setActivePreset(preset)
    setDateRange(undefined) // Limpa seleção customizada
    onPresetSelect(preset)
  }

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    setActivePreset(null) // Limpa preset ativo
    onDateRangeChange(range)

    // Fecha o popover se ambas as datas foram selecionadas
    if (range?.from && range?.to) {
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setDateRange(undefined)
    setActivePreset(null)
    onDateRangeChange(undefined)
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return 'Selecionar período'

    if (!dateRange.to) {
      return format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
    }

    return `${format(dateRange.from, 'dd/MM', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`
  }

  const hasActiveFilter = dateRange?.from || activePreset

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Label */}
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-medium text-muted-foreground'>Filtrar por período</h3>
        {hasActiveFilter && (
          <Button variant='ghost' size='sm' onClick={handleClear} className='h-7 px-2 text-xs'>
            <X className='h-3 w-3 mr-1' />
            Limpar
          </Button>
        )}
      </div>

      {/* Presets Rápidos */}
      <div className='flex flex-wrap gap-2'>
        {PRESETS.map(preset => (
          <Button
            key={preset.value}
            variant={activePreset === preset.value ? 'default' : 'outline'}
            size='sm'
            onClick={() => handlePresetClick(preset.value)}
            className='h-8'
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Seletor de Data Customizado */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={dateRange?.from ? 'default' : 'outline'}
            size='sm'
            className={cn(
              'w-full justify-start gap-2 h-9',
              !dateRange?.from && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className='h-4 w-4' />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='range'
            selected={dateRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            locale={ptBR}
            defaultMonth={dateRange?.from}
          />
        </PopoverContent>
      </Popover>

      {/* Indicador de Filtro Ativo */}
      {hasActiveFilter && (
        <div className='text-xs text-muted-foreground'>
          {activePreset && (
            <span>
              Exibindo: <strong>{PRESETS.find(p => p.value === activePreset)?.label}</strong>
            </span>
          )}
          {dateRange?.from && !activePreset && <span>Período customizado selecionado</span>}
        </div>
      )}
    </div>
  )
}
