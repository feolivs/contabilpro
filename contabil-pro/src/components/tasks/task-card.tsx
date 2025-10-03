'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Task } from '@/types/tasks'
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_TYPE_LABELS,
} from '@/types/tasks'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  MoreVertical,
  Pencil,
  Play,
  Trash2,
} from 'lucide-react'

interface TaskCardProps {
  task: Task
  onStart?: (taskId: string) => void
  onComplete?: (taskId: string) => void
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  showClient?: boolean
}

export function TaskCard({
  task,
  onStart,
  onComplete,
  onEdit,
  onDelete,
  showClient = false,
}: TaskCardProps) {
  // Verificar se está atrasada
  const isOverdue =
    task.status !== 'completed' && task.due_date && new Date(task.due_date) < new Date()

  // Ícone de status
  const StatusIcon = {
    pending: Circle,
    in_progress: Clock,
    completed: CheckCircle2,
    cancelled: AlertCircle,
  }[task.status]

  // Cor do badge de prioridade
  const priorityColor = TASK_PRIORITY_COLORS[task.priority]

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between gap-4'>
          {/* Conteúdo Principal */}
          <div className='flex-1 min-w-0'>
            {/* Cabeçalho */}
            <div className='flex items-start gap-3 mb-2'>
              <StatusIcon
                className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  task.status === 'completed'
                    ? 'text-green-600'
                    : task.status === 'in_progress'
                      ? 'text-blue-600'
                      : task.status === 'cancelled'
                        ? 'text-gray-400'
                        : 'text-muted-foreground'
                }`}
              />
              <div className='flex-1 min-w-0'>
                <h3 className='font-semibold text-sm leading-tight mb-1 truncate'>{task.title}</h3>
                {task.description && (
                  <p className='text-xs text-muted-foreground line-clamp-2'>{task.description}</p>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className='flex flex-wrap items-center gap-2 mb-3'>
              {/* Status */}
              <Badge
                variant={
                  task.status === 'completed'
                    ? 'default'
                    : task.status === 'in_progress'
                      ? 'secondary'
                      : 'outline'
                }
                className='text-xs'
              >
                {TASK_STATUS_LABELS[task.status]}
              </Badge>

              {/* Prioridade */}
              <Badge variant='outline' className={`text-xs ${priorityColor}`}>
                {TASK_PRIORITY_LABELS[task.priority]}
              </Badge>

              {/* Tipo */}
              <Badge variant='outline' className='text-xs'>
                {TASK_TYPE_LABELS[task.type]}
              </Badge>

              {/* Cliente (se showClient) */}
              {showClient && task.client && (
                <Badge variant='secondary' className='text-xs'>
                  {task.client.name}
                </Badge>
              )}

              {/* Atrasada */}
              {isOverdue && (
                <Badge variant='destructive' className='text-xs'>
                  Atrasada
                </Badge>
              )}
            </div>

            {/* Footer */}
            <div className='flex items-center gap-4 text-xs text-muted-foreground'>
              {/* Prazo */}
              {task.due_date && (
                <div className='flex items-center gap-1'>
                  <Clock className='h-3 w-3' />
                  <span>
                    {format(new Date(task.due_date), "dd 'de' MMM", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              )}

              {/* Responsável */}
              {task.assigned_user && (
                <div className='flex items-center gap-1'>
                  <span>👤</span>
                  <span className='truncate max-w-[120px]'>{task.assigned_user.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className='flex items-center gap-1 flex-shrink-0'>
            {/* Botões de ação rápida */}
            {task.status === 'pending' && onStart && (
              <Button
                size='sm'
                variant='ghost'
                onClick={() => onStart(task.id)}
                className='h-8 w-8 p-0'
                title='Iniciar tarefa'
                aria-label='Iniciar tarefa'
              >
                <Play className='h-4 w-4' />
              </Button>
            )}

            {task.status === 'in_progress' && onComplete && (
              <Button
                size='sm'
                variant='ghost'
                onClick={() => onComplete(task.id)}
                className='h-8 w-8 p-0 text-green-600 hover:text-green-700'
                title='Concluir tarefa'
                aria-label='Concluir tarefa'
              >
                <CheckCircle2 className='h-4 w-4' />
              </Button>
            )}

            {/* Menu de opções */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size='sm' variant='ghost' className='h-8 w-8 p-0' aria-label='Mais opções'>
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Pencil className='mr-2 h-4 w-4' />
                    Editar
                  </DropdownMenuItem>
                )}
                {task.status === 'pending' && onStart && (
                  <DropdownMenuItem onClick={() => onStart(task.id)}>
                    <Play className='mr-2 h-4 w-4' />
                    Iniciar
                  </DropdownMenuItem>
                )}
                {task.status === 'in_progress' && onComplete && (
                  <DropdownMenuItem onClick={() => onComplete(task.id)}>
                    <CheckCircle2 className='mr-2 h-4 w-4' />
                    Concluir
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(task.id)}
                      className='text-destructive'
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      Deletar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
