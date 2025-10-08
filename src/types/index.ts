// Global types for ContabilPRO

export interface Client {
  id: string
  user_id: string
  name: string
  cnpj: string
  email?: string | null
  phone?: string | null
  address?: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  client_id: string
  number: string
  date: string
  amount: number
  type: 'nfe' | 'nfse' | 'coupon'
  status: 'pending' | 'processed' | 'error'
  xml_data?: Record<string, unknown>
  created_at: string
}

export interface BankStatement {
  id: string
  client_id: string
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  matched: boolean
  created_at: string
}

// Phase 3: AI Assistant types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AgentResponse {
  message: string
  data?: Record<string, unknown>
  suggestions?: string[]
}

