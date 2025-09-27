'use server'

import { redirect } from 'next/navigation'

import type { User } from '@supabase/supabase-js'

import { createServerClient } from './supabase'

export interface AuthSession {
  user: User
  tenant_id: string
  role: string
}

// Verificar sessÃ£o e obter tenant_id do JWT
export async function verifySession(): Promise<AuthSession | null> {
  try {
    const supabase = createServerClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session?.user) {
      return null
    }

    // Extrair tenant_id do JWT claims
    const claims = session.user.app_metadata || {}
    const tenant_id = claims.tenant_id as string
    const role = (claims.role as string) || 'user'

    if (!tenant_id) {
      console.error('UsuÃ¡rio sem tenant_id no JWT')
      return null
    }

    return {
      user: session.user,
      tenant_id,
      role,
    }
  } catch (error) {
    console.error('Erro ao verificar sessÃ£o:', error)
    return null
  }
}

// Helper para obter tenant_id atual
export async function getCurrentTenantId(): Promise<string | null> {
  const session = await verifySession()
  return session?.tenant_id || null
}

// Helper para verificar se usuÃ¡rio tem acesso ao tenant
export async function verifyTenantAccess(tenant_id: string): Promise<boolean> {
  const session = await verifySession()
  return session?.tenant_id === tenant_id
}

// Middleware de autenticaÃ§Ã£o para Server Actions
export async function requireAuth(): Promise<AuthSession> {
  const session = await verifySession()

  if (!session) {
    redirect('/login')
  }

  return session
}

// Helper para configurar RLS context no Supabase
export async function setRLSContext(session?: AuthSession) {
  const activeSession = session ?? (await verifySession())

  if (!activeSession) {
    return null
  }

  const supabase = createServerClient()

  await Promise.all([
    supabase.rpc('set_claim', {
      claim: 'tenant_id',
      value: activeSession.tenant_id,
    }),
    supabase.rpc('set_claim', {
      claim: 'role',
      value: activeSession.role,
    }),
  ])

  return supabase
}

// FunÃ§Ã£o para criar tenant_id claim no JWT (para uso em auth hooks)
export function createTenantClaim(tenant_id: string) {
  return {
    tenant_id,
    role: 'user',
  }
}

// Helper para logout
export async function signOut() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
