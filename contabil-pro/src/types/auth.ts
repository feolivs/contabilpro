/**
 * Tipos de autenticação
 * Separado dos Server Actions para evitar conflitos com "use server"
 */

import type { User } from '@supabase/supabase-js'

export interface AuthSession {
  user: User
  tenant_id: string
  role: string
  tenant_slug?: string
}

export interface TenantClaim {
  tenant_id: string
  role: string
  tenant_slug?: string
}

export interface AuthError {
  message: string
  code?: string
  details?: any
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  full_name: string
  tenant_name?: string
}

export interface AuthState {
  user: User | null
  session: AuthSession | null
  loading: boolean
  error: AuthError | null
}
