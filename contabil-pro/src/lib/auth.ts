'use server'

import { redirect } from 'next/navigation'

import type { AuthSession } from '@/types/auth'

import { createServerClient } from './supabase'

// Verificar sessao (simplificado - sem multi-tenant)
export async function verifySession(): Promise<AuthSession | null> {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Retornar apenas dados básicos do usuário
    return {
      user: user,
      tenant_id: '', // Mantido para compatibilidade, mas não usado
      role: 'user',
      tenant_slug: '',
    }
  } catch (error) {
    console.error('Erro ao verificar sessao:', error)
    return null
  }
}

// Funções removidas - não mais necessárias sem multi-tenant
// getCurrentTenantId() - REMOVIDO
// verifyTenantAccess() - REMOVIDO

// Middleware de autenticacao para Server Actions
export async function requireAuth(): Promise<AuthSession> {
  const session = await verifySession()

  if (!session) {
    redirect('/login')
  }

  return session
}

// Funções RLS removidas - não mais necessárias sem multi-tenant
// setRLSContext() - REMOVIDO
// createTenantClaim() - REMOVIDO

// Helper para logout
export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
