/**
 * Tipos e constantes para Clients
 * Separado dos Server Actions para evitar conflitos com "use server"
 */

export type ClientFormState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  fieldErrors?: Record<string, string[]>
}

export const initialClientFormState: ClientFormState = {
  status: 'idle',
  message: null,
  fieldErrors: {},
}

export type ClientImportState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  summary?: {
    processed: number
    created: number
    skipped: number
  }
}

export const initialClientImportState: ClientImportState = {
  status: 'idle',
  message: null,
}

export interface Client {
  id: string
  tenant_id: string
  name: string
  email: string
  phone?: string
  document?: string
  document_type?: 'cpf' | 'cnpj'
  address?: string
  city?: string
  state?: string
  zip_code?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ClientWithStats extends Client {
  total_entries: number
  total_revenue: number
  total_expense: number
  last_entry_date?: string
}

export interface ClientFilters {
  search?: string
  document_type?: 'cpf' | 'cnpj'
  is_active?: boolean
  city?: string
  state?: string
}

export interface ClientImportRow {
  name: string
  email: string
  phone?: string
  document?: string
  document_type?: 'cpf' | 'cnpj'
  address?: string
  city?: string
  state?: string
  zip_code?: string
}

export interface ClientImportResult {
  success: boolean
  createdCount: number
  skippedCount: number
  errorCount: number
  errors: Array<{
    line: number
    error: string
    data?: ClientImportRow
  }>
  message: string
}
