/**
 * Types para o módulo de Tarefas
 * Gerenciamento de tarefas vinculadas a clientes
 */

// ============================================================================
// Enums e Tipos Base
// ============================================================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TaskType =
  | 'reminder'
  | 'tax_obligation'
  | 'document_review'
  | 'client_meeting'
  | 'report_generation'
  | 'other'

// ============================================================================
// Interface Principal
// ============================================================================

export interface Task {
  id: string
  tenant_id: string
  client_id?: string
  title: string
  description?: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  due_date?: string
  assigned_to?: string
  created_by: string
  completed_at?: string
  created_at: string
  updated_at: string

  // Relacionamentos (quando incluídos na query)
  client?: {
    id: string
    name: string
  }
  assigned_user?: {
    id: string
    name: string
  }
  created_user?: {
    id: string
    name: string
  }
}

// ============================================================================
// Inputs para Mutations
// ============================================================================

export interface CreateTaskInput {
  title: string
  description?: string
  type: TaskType
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string
  client_id?: string
  assigned_to?: string
}

export interface UpdateTaskInput {
  id: string
  title?: string
  description?: string
  type?: TaskType
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string
  client_id?: string
  assigned_to?: string
}

// ============================================================================
// Filtros e Queries
// ============================================================================

export interface TaskFilters {
  // Filtros básicos
  status?: TaskStatus
  priority?: TaskPriority
  type?: TaskType

  // Filtros por relacionamento
  client_id?: string
  assigned_to?: string
  created_by?: string

  // Filtros por data
  due_date_from?: string
  due_date_to?: string
  overdue?: boolean

  // Busca textual
  search?: string

  // Paginação
  page?: number
  pageSize?: number
}

// ============================================================================
// Estatísticas
// ============================================================================

export interface TasksStats {
  pending: number
  in_progress: number
  completed: number
  overdue: number
  total: number
}

// ============================================================================
// Helpers e Utilitários
// ============================================================================

export interface TaskWithDaysUntilDue extends Task {
  daysUntilDue?: number
  isOverdue: boolean
  isToday: boolean
  isUrgent: boolean
}

// ============================================================================
// Constantes
// ============================================================================

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  reminder: 'Lembrete',
  tax_obligation: 'Obrigação Fiscal',
  document_review: 'Revisão de Documentos',
  client_meeting: 'Reunião com Cliente',
  report_generation: 'Geração de Relatório',
  other: 'Outro',
}

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-green-100 text-green-800 border-green-300',
}

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-800 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
}
