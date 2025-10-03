/**
 * Types para o módulo de Timeline
 * Timeline de atividades relacionadas aos clientes
 */

// ============================================================================
// Enums e Tipos Base
// ============================================================================

export type TimelineEventType =
  | 'document_uploaded'
  | 'document_deleted'
  | 'task_created'
  | 'task_started'
  | 'task_completed'
  | 'task_cancelled'
  | 'task_updated'
  | 'entry_created'
  | 'entry_updated'
  | 'client_updated'
  | 'note_added'

// ============================================================================
// Interface Principal
// ============================================================================

export interface TimelineEvent {
  id: string
  client_id: string
  event_type: TimelineEventType
  title: string
  description?: string
  metadata?: Record<string, any>
  document_id?: string
  task_id?: string
  entry_id?: string
  user_id: string
  created_at: string

  // Relacionamentos (quando incluídos na query)
  user?: {
    id: string
    name: string
  }
  client?: {
    id: string
    name: string
  }
  document?: {
    id: string
    name: string
  }
  task?: {
    id: string
    title: string
  }
  entry?: {
    id: string
    description?: string
  }
}

// ============================================================================
// Inputs para Mutations
// ============================================================================

export interface CreateTimelineEventInput {
  client_id: string
  event_type: TimelineEventType
  title: string
  description?: string
  metadata?: Record<string, any>
  document_id?: string
  task_id?: string
  entry_id?: string
}

// ============================================================================
// Filtros e Queries
// ============================================================================

export interface TimelineFilters {
  client_id: string
  event_type?: TimelineEventType | TimelineEventType[]
  from_date?: string
  to_date?: string
  page?: number
  pageSize?: number
}

// ============================================================================
// Configuração de Eventos
// ============================================================================

export interface TimelineEventConfig {
  icon: string
  color: string
  label: string
}

export const TIMELINE_EVENT_CONFIG: Record<TimelineEventType, TimelineEventConfig> = {
  document_uploaded: {
    icon: '📄',
    color: 'text-blue-600',
    label: 'Documento adicionado',
  },
  document_deleted: {
    icon: '🗑️',
    color: 'text-red-600',
    label: 'Documento removido',
  },
  task_created: {
    icon: '📋',
    color: 'text-green-600',
    label: 'Tarefa criada',
  },
  task_started: {
    icon: '▶️',
    color: 'text-yellow-600',
    label: 'Tarefa iniciada',
  },
  task_completed: {
    icon: '✅',
    color: 'text-green-600',
    label: 'Tarefa concluída',
  },
  task_cancelled: {
    icon: '❌',
    color: 'text-red-600',
    label: 'Tarefa cancelada',
  },
  task_updated: {
    icon: '✏️',
    color: 'text-orange-600',
    label: 'Tarefa atualizada',
  },
  entry_created: {
    icon: '💰',
    color: 'text-purple-600',
    label: 'Lançamento criado',
  },
  entry_updated: {
    icon: '✏️',
    color: 'text-orange-600',
    label: 'Lançamento atualizado',
  },
  client_updated: {
    icon: '👤',
    color: 'text-blue-600',
    label: 'Cliente atualizado',
  },
  note_added: {
    icon: '📝',
    color: 'text-gray-600',
    label: 'Nota adicionada',
  },
}

// ============================================================================
// Filtros de Categoria
// ============================================================================

export const TIMELINE_CATEGORY_FILTERS = [
  { value: 'all', label: 'Todas', icon: '📊' },
  {
    value: 'documents',
    label: 'Documentos',
    icon: '📄',
    types: ['document_uploaded', 'document_deleted'],
  },
  {
    value: 'tasks',
    label: 'Tarefas',
    icon: '📋',
    types: ['task_created', 'task_started', 'task_completed', 'task_cancelled', 'task_updated'],
  },
  { value: 'entries', label: 'Lançamentos', icon: '💰', types: ['entry_created', 'entry_updated'] },
  { value: 'other', label: 'Outros', icon: '📝', types: ['client_updated', 'note_added'] },
] as const

// ============================================================================
// Tipos Adicionais para Componentes
// ============================================================================

export type TimelineCategory = 'documents' | 'tasks' | 'entries' | 'other'

// Alias para compatibilidade com componentes existentes
export type ClientTimelineEvent = TimelineEvent
