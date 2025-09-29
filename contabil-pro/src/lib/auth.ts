'use server'

import { redirect } from 'next/navigation'

import { createAdminClient, createServerClient } from './supabase'
import type { AuthSession } from '@/types/auth'

// Verificar sessao e obter tenant_id do JWT
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

    const claims = (user.app_metadata ?? {}) as Record<string, unknown>
    let tenantId = typeof claims.tenant_id === 'string' ? claims.tenant_id : ''
    let role = typeof claims.role === 'string' ? claims.role : 'user'
    let tenantSlug = typeof claims.tenant_slug === 'string' ? claims.tenant_slug : ''

    if (!tenantId) {
      try {
        const admin = createAdminClient()
        const { data, error: adminError } = await admin
          .from('user_tenants')
          .select('tenant_id, role, tenants!inner(slug)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (!adminError && data) {
          tenantId = typeof data.tenant_id === 'string' ? data.tenant_id : tenantId
          role = typeof data.role === 'string' ? data.role : role
          tenantSlug = typeof data.tenants?.slug === 'string' ? data.tenants.slug : tenantSlug
        }
      } catch (lookupError) {
        console.error('Nao foi possivel resolver tenant do usuario.', lookupError)
      }
    }

    if (!tenantId) {
      console.error('Usuario sem tenant_id no contexto de autenticacao.')
      return null
    }

    return {
      user: user,
      tenant_id: tenantId,
      role,
      tenant_slug: tenantSlug,
    }
  } catch (error) {
    console.error('Erro ao verificar sessao:', error)
    return null
  }
}

// Helper para obter tenant_id atual
export async function getCurrentTenantId(): Promise<string | null> {
  const session = await verifySession()
  return session?.tenant_id || null
}

// Helper para verificar se usuario tem acesso ao tenant
export async function verifyTenantAccess(tenant_id: string): Promise<boolean> {
  const session = await verifySession()
  return session?.tenant_id === tenant_id
}

// Middleware de autenticacao para Server Actions
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

  const supabase = await createServerClient()

  try {
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
  } catch (error) {
    console.error('Error setting RLS context:', error)
    throw error
  }

  return supabase
}

// Funcao para criar tenant_id claim no JWT (para uso em auth hooks)
export async function createTenantClaim(tenant_id: string) {
  return {
    tenant_id,
    role: 'user',
  }
}

// Helper para logout
export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
