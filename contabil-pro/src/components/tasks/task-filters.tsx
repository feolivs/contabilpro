'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TaskFiltersInput } from '@/schemas/task.schema'
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, TASK_TYPE_LABELS } from '@/types/tasks'

import { Search, X } from 'lucide-react'

interface TaskFiltersProps {
  filters: Partial<TaskFiltersInput>
  onFiltersChange: (filters: Partial<TaskFiltersInput>) => void
  onClearFilters: () => void
}

export function TaskFilters({ filters, onFiltersChange, onClearFilters }: TaskFiltersProps) {
  const hasActiveFilters =
    filters.status || filters.priority || filters.type || filters.search || filters.overdue

  const handleFilterChange = (key: keyof TaskFiltersInput, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='grid gap-4 md:grid-cols-5'>
          {/* Busca */}
          <div className='md:col-span-2'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Buscar tarefas...'
                value={filters.search || ''}
                onChange={e => handleFilterChange('search', e.target.value)}
                className='pl-9'
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <Select
              value={filters.status || 'all'}
              onValueChange={value =>
                handleFilterChange('status', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos os status</SelectItem>
                {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div>
            <Select
              value={filters.priority || 'all'}
              onValueChange={value =>
                handleFilterChange('priority', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Prioridade' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todas as prioridades</SelectItem>
                {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo */}
          <div>
            <Select
              value={filters.type || 'all'}
              onValueChange={value =>
                handleFilterChange('type', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Tipo' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos os tipos</SelectItem>
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Segunda linha: Datas e Limpar */}
        <div className='grid gap-4 md:grid-cols-5 mt-4'>
          {/* Data Início */}
          <div>
            <Input
              type='date'
              value={filters.due_date_from || ''}
              onChange={e => handleFilterChange('due_date_from', e.target.value)}
              placeholder='Data início'
            />
          </div>

          {/* Data Fim */}
          <div>
            <Input
              type='date'
              value={filters.due_date_to || ''}
              onChange={e => handleFilterChange('due_date_to', e.target.value)}
              placeholder='Data fim'
            />
          </div>

          {/* Atrasadas */}
          <div>
            <Select
              value={filters.overdue ? 'true' : 'false'}
              onValueChange={value =>
                handleFilterChange('overdue', value === 'true' ? true : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Atrasadas' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='false'>Todas</SelectItem>
                <SelectItem value='true'>Apenas atrasadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Espaço vazio */}
          <div className='md:col-span-1' />

          {/* Botão Limpar */}
          <div>
            <Button
              variant='outline'
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
              className='w-full'
            >
              <X className='mr-2 h-4 w-4' />
              Limpar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
