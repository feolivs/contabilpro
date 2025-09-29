/**
 * Tipos canônicos para Server Actions
 * Separado dos Server Actions para evitar conflitos com "use server"
 */

/**
 * Resposta padrão para Server Actions
 * Usado para operações síncronas simples (CRUD, validações)
 */
export interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Estado de formulário para Server Actions
 * Usado com useFormState do React
 */
export interface FormState {
  status: 'idle' | 'success' | 'error'
  message: string | null
  fieldErrors?: Record<string, string[]>
}

/**
 * Estado de importação para Server Actions
 * Usado para operações de importação em lote
 */
export interface ImportState {
  status: 'idle' | 'processing' | 'success' | 'error'
  message: string | null
  progress?: number
  summary?: {
    processed: number
    created: number
    updated: number
    skipped: number
    errors: number
  }
  errors?: Array<{
    line: number
    error: string
    data?: any
  }>
}

/**
 * Metadados de resposta para operações resilientes
 * Usado em conjunto com ResilientResponse do sistema de cache
 */
export interface ResponseMetadata {
  source: 'live' | 'cache' | 'fallback'
  lastSuccessAt?: Date
  retryCount: number
  degraded: boolean
  userMessage?: string
}

/**
 * Helpers para criar respostas padronizadas
 */
export const createSuccessResponse = <T>(data: T, message?: string): ActionResponse<T> => ({
  success: true,
  data,
  message,
})

export const createErrorResponse = <T = unknown>(error: string, data?: T): ActionResponse<T> => ({
  success: false,
  error,
  data,
})

/**
 * Type guards para verificar tipos de resposta
 */
export const isSuccessResponse = <T>(response: ActionResponse<T>): response is ActionResponse<T> & { success: true } => {
  return response.success === true
}

export const isErrorResponse = <T>(response: ActionResponse<T>): response is ActionResponse<T> & { success: false } => {
  return response.success === false
}
