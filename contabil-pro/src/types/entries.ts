/**
 * Tipos e constantes para Entries
 * Separado dos Server Actions para evitar conflitos com "use server"
 */

export type EntryFormState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  fieldErrors?: Record<string, string[]>
}

export const initialEntryFormState: EntryFormState = {
  status: 'idle',
  message: null,
  fieldErrors: {},
}

export type EntryImportState = {
  status: 'idle' | 'processing' | 'success' | 'error'
  message: string | null
  progress?: number
  importedCount?: number
  errorCount?: number
  errors?: Array<{
    line: number
    error: string
    data?: any
  }>
  summary?: {
    processed: number
    created: number
    skipped: number
    errors: number
  }
}

export const initialEntryImportState: EntryImportState = {
  status: 'idle',
  message: null,
  progress: 0,
  importedCount: 0,
  errorCount: 0,
  errors: [],
}

export interface Entry {
  id: string
  tenant_id: string
  account_id: string
  client_id?: string
  description: string
  amount: number
  date: string
  type: 'debit' | 'credit'
  reference?: string
  created_at: string
  updated_at: string
}

export interface EntryWithRelations extends Entry {
  account?: {
    id: string
    name: string
    code: string
    type: string
  }
  client?: {
    id: string
    name: string
    email: string
  }
}

export interface EntryFilters {
  account_id?: string
  client_id?: string
  type?: 'debit' | 'credit'
  date_from?: string
  date_to?: string
  search?: string
}

export interface EntryImportRow {
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  account_code?: string
  account_name?: string
  client_name?: string
  client_document?: string
  reference?: string
}

export interface EntryImportResult {
  success: boolean
  importedCount: number
  errorCount: number
  errors: Array<{
    line: number
    error: string
    data?: EntryImportRow
  }>
  message: string
}
