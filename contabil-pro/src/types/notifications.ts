/**
 * Types for Notifications System
 * Defines types for push notifications, in-app notifications, and subscriptions
 */

/**
 * Notification types
 */
export type NotificationType =
  | 'tax_obligation_due_7d' // Obrigação fiscal vence em 7 dias
  | 'tax_obligation_due_3d' // Obrigação fiscal vence em 3 dias
  | 'tax_obligation_due_today' // Obrigação fiscal vence hoje
  | 'tax_obligation_overdue' // Obrigação fiscal atrasada
  | 'task_reminder' // Lembrete de tarefa
  | 'document_uploaded' // Documento enviado
  | 'client_message' // Mensagem de cliente
  | 'system' // Notificação do sistema

/**
 * Notification interface
 */
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  read_at?: string
  created_at: string
  updated_at: string
}

/**
 * Notification subscription interface (Web Push API)
 */
export interface NotificationSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent?: string
  created_at: string
  last_used_at: string
}

/**
 * Notification filters for queries
 */
export interface NotificationFilters {
  read?: boolean
  type?: NotificationType
  from_date?: string
  to_date?: string
  limit?: number
  offset?: number
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  total: number
  unread: number
  read: number
  by_type: Record<NotificationType, number>
}

/**
 * Notification form data for creating notifications
 */
export interface NotificationFormData {
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
}

/**
 * Subscription form data for Web Push API
 */
export interface SubscriptionFormData {
  endpoint: string
  p256dh: string
  auth: string
  user_agent?: string
}

/**
 * Notification labels for display
 */
export const notificationTypeLabels: Record<NotificationType, string> = {
  tax_obligation_due_7d: 'Obrigação Fiscal - 7 dias',
  tax_obligation_due_3d: 'Obrigação Fiscal - 3 dias',
  tax_obligation_due_today: 'Obrigação Fiscal - Hoje',
  tax_obligation_overdue: 'Obrigação Fiscal - Atrasada',
  task_reminder: 'Lembrete de Tarefa',
  document_uploaded: 'Documento Enviado',
  client_message: 'Mensagem de Cliente',
  system: 'Sistema',
}

/**
 * Notification icons for display
 */
export const notificationTypeIcons: Record<NotificationType, string> = {
  tax_obligation_due_7d: 'calendar',
  tax_obligation_due_3d: 'alert-circle',
  tax_obligation_due_today: 'alert-triangle',
  tax_obligation_overdue: 'x-circle',
  task_reminder: 'check-circle',
  document_uploaded: 'file-upload',
  client_message: 'message-circle',
  system: 'info-circle',
}

/**
 * Notification colors for display
 */
export const notificationTypeColors: Record<NotificationType, string> = {
  tax_obligation_due_7d: 'blue',
  tax_obligation_due_3d: 'yellow',
  tax_obligation_due_today: 'orange',
  tax_obligation_overdue: 'red',
  task_reminder: 'green',
  document_uploaded: 'purple',
  client_message: 'cyan',
  system: 'gray',
}

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * Get notification priority based on type
 */
export function getNotificationPriority(type: NotificationType): NotificationPriority {
  switch (type) {
    case 'tax_obligation_due_today':
    case 'tax_obligation_overdue':
      return 'urgent'
    case 'tax_obligation_due_3d':
      return 'high'
    case 'tax_obligation_due_7d':
    case 'task_reminder':
      return 'normal'
    default:
      return 'low'
  }
}

/**
 * Get notification URL based on type and data
 */
export function getNotificationUrl(notification: Notification): string {
  const { type, data } = notification

  switch (type) {
    case 'tax_obligation_due_7d':
    case 'tax_obligation_due_3d':
    case 'tax_obligation_due_today':
    case 'tax_obligation_overdue':
      return '/fiscal'
    case 'task_reminder':
      return '/tarefas'
    case 'document_uploaded':
      if (data?.client_id) {
        return `/clientes/${data.client_id}`
      }
      return '/documentos'
    case 'client_message':
      if (data?.client_id) {
        return `/clientes/${data.client_id}`
      }
      return '/clientes'
    default:
      return '/dashboard'
  }
}

/**
 * Format notification time (relative)
 */
export function formatNotificationTime(createdAt: string): string {
  const now = new Date()
  const created = new Date(createdAt)
  const diffMs = now.getTime() - created.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) {
    return 'agora'
  } else if (diffMins < 60) {
    return `há ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
  } else if (diffHours < 24) {
    return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  } else if (diffDays < 7) {
    return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
  } else {
    return created.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }
}
