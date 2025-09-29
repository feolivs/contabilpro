'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface PriorityTask {
  id: string
  title: string
  deadline: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
}

interface PriorityTasksPanelProps {
  tasks?: PriorityTask[]
  onToggleTask?: (taskId: string) => void
}

const priorityConfig = {
  high: {
    label: 'Alta',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400',
  },
  medium: {
    label: 'Média',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400',
  },
  low: {
    label: 'Baixa',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400',
  },
}

const mockTasks: PriorityTask[] = [
  {
    id: '1',
    title: 'Revisar lançamentos de setembro',
    deadline: '2025-10-05',
    priority: 'high',
    completed: false,
  },
  {
    id: '2',
    title: 'Conciliar extrato Banco XYZ',
    deadline: '2025-10-08',
    priority: 'high',
    completed: false,
  },
  {
    id: '3',
    title: 'Enviar relatório mensal - Cliente ABC',
    deadline: '2025-10-10',
    priority: 'medium',
    completed: false,
  },
]

export function PriorityTasksPanel({ tasks = mockTasks, onToggleTask }: PriorityTasksPanelProps) {
  const sortedTasks = [...tasks]
    .filter((t) => !t.completed)
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    .slice(0, 5)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Tarefas Prioritárias</CardTitle>
        <CardDescription className="text-xs">
          {sortedTasks.length} tarefas pendentes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <IconCircleCheck className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Todas as tarefas concluídas!
            </p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const config = priorityConfig[task.priority]
            const deadline = new Date(task.deadline)
            const today = new Date()
            const daysUntil = Math.ceil(
              (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )
            const isUrgent = daysUntil <= 2

            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                  'hover:bg-accent/50'
                )}
              >
                <Checkbox
                  id={task.id}
                  checked={task.completed}
                  onCheckedChange={() => onToggleTask?.(task.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={task.id}
                    className="text-sm font-medium leading-tight cursor-pointer"
                  >
                    {task.title}
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {deadline.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                      {isUrgent && (
                        <span className="ml-1 text-red-600 dark:text-red-400 font-medium">
                          • {daysUntil === 0 ? 'Hoje' : `${daysUntil}d`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isUrgent && (
                    <IconAlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] h-5 px-2', config.className)}
                  >
                    {config.label}
                  </Badge>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

