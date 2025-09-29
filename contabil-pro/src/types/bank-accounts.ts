/**
 * Tipos e constantes para Bank Accounts
 * Separado dos Server Actions para evitar conflitos com "use server"
 */

export type BankAccountFormState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  fieldErrors?: Record<string, string[]>
}

export const initialBankAccountFormState: BankAccountFormState = {
  status: 'idle',
  message: null,
  fieldErrors: {},
}

export type BankTransactionImportState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  summary?: {
    processed: number
    imported: number
    skipped: number
  }
}

export const initialBankTransactionImportState: BankTransactionImportState = {
  status: 'idle',
  message: null,
}

export interface BankAccount {
  id: string
  tenant_id: string
  name: string
  bank_code: string
  agency: string
  account_number: string
  account_type: 'checking' | 'savings' | 'investment'
  balance: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BankTransaction {
  id: string
  tenant_id: string
  bank_account_id: string
  external_id: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  date: string
  category?: string
  reference?: string
  reconciled: boolean
  reconciled_entry_id?: string
  created_at: string
}

export interface BankTransactionWithAccount extends BankTransaction {
  bank_account?: {
    id: string
    name: string
    bank_code: string
    agency: string
    account_number: string
  }
}

export interface BankTransactionFilters {
  bank_account_id?: string
  type?: 'debit' | 'credit'
  date_from?: string
  date_to?: string
  reconciled?: boolean
  search?: string
}

export interface BankTransactionImportRow {
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  external_id?: string
  category?: string
  reference?: string
}

export interface BankTransactionImportResult {
  success: boolean
  importedCount: number
  skippedCount: number
  errorCount: number
  errors: Array<{
    line: number
    error: string
    data?: BankTransactionImportRow
  }>
  message: string
}

export interface ReconciliationMatch {
  bank_transaction_id: string
  entry_id: string
  score: number
  auto_match: boolean
  matched_at?: string
}

export interface ReconciliationSuggestion {
  bank_transaction: BankTransaction
  suggested_entries: Array<{
    entry_id: string
    description: string
    amount: number
    date: string
    score: number
    reasons: string[]
  }>
}
