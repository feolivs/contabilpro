'use client'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ClientTimelineEvent } from '@/types/timeline'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  CheckSquare,
  DollarSign,
  Edit,
  FileText,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'

interface TimelineEventProps {
  event: ClientTimelineEvent
}

const EVENT_CONFIG = {
  document_uploaded: {
    icon: Upload,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Documento adicionado',
  },
  document_deleted: {
    icon: Trash2,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Documento removido',
  },
  task_created: {
    icon: CheckSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Tarefa criada',
  },
  task_started: {
    icon: AlertCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Tarefa iniciada',
  },
  task_completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Tarefa concluída',
  },
  task_cancelled: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Tarefa cancelada',
  },
  task_updated: {
    icon: Edit,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Tarefa atualizada',
  },
  entry_created: {
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    label: 'Lançamento criado',
  },
  entry_updated: {
    icon: Edit,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Lançamento atualizado',
  },
  client_updated: {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Cliente atualizado',
  },
  note_added: {
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    label: 'Nota adicionada',
  },
} as const

export function TimelineEvent({ event }: TimelineEventProps) {
  const config = EVENT_CONFIG[event.event_type]
  const Icon = config?.icon || FileText

  const getResourceLink = () => {
    // Determinar link baseado nos IDs disponíveis
    if (event.document_id) {
      return `/documentos/${event.document_id}`
    }
    if (event.task_id) {
      return `/tarefas`
    }
    if (event.entry_id) {
      return `/lancamentos`
    }
    return null
  }

  const resourceLink = getResourceLink()

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardContent className='p-4'>
        <div className='flex items-start gap-4'>
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              config?.bgColor || 'bg-gray-50'
            )}
            aria-hidden='true'
          >
            <Icon className={cn('w-5 h-5', config?.color || 'text-gray-600')} />
          </div>

          {/* Content */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between gap-2 mb-1'>
              <Badge variant='outline' className='text-xs'>
                {config?.label || event.event_type}
              </Badge>
              <time
                className='text-xs text-muted-foreground flex-shrink-0'
                dateTime={event.created_at}
                title={new Date(event.created_at).toLocaleString('pt-BR')}
              >
                {formatDistanceToNow(new Date(event.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </time>
            </div>

            <h3 className='text-sm font-medium text-foreground mb-1'>{event.title}</h3>

            {event.description && (
              <p className='text-sm text-muted-foreground mb-2'>{event.description}</p>
            )}

            {/* User info */}
            {event.user && (
              <p className='text-xs text-muted-foreground mb-2'>Por: {event.user.name}</p>
            )}

            {/* Metadata */}
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className='text-xs text-muted-foreground space-y-1'>
                {event.metadata.document_name && (
                  <div className='flex items-center gap-1'>
                    <FileText className='w-3 h-3' />
                    <span>{event.metadata.document_name}</span>
                  </div>
                )}
                {event.metadata.task_title && (
                  <div className='flex items-center gap-1'>
                    <CheckSquare className='w-3 h-3' />
                    <span>{event.metadata.task_title}</span>
                  </div>
                )}
                {event.metadata.due_date && (
                  <div className='flex items-center gap-1'>
                    <Calendar className='w-3 h-3' />
                    <span>
                      Vencimento: {new Date(event.metadata.due_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Link to resource */}
            {resourceLink && (
              <Link
                href={resourceLink}
                className='text-xs text-primary hover:underline mt-2 inline-block'
              >
                Ver detalhes →
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
