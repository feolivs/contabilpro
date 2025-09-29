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
