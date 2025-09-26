import type { NextRequest } from 'next/server'

import { createServerClient } from '@supabase/ssr'

export interface Tenant {
  id: string
  name: string
  slug: string
  document: string
  email?: string
  phone?: string
  address?: string
  settings: Record<string, any>
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
}

// Cache em memória para tenants (em produção, usar Redis)
const tenantCache = new Map<string, Tenant>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

interface CacheEntry {
  tenant: Tenant
  timestamp: number
}

/**
 * Resolve tenant a partir do request (subdomínio ou path-based)
 */
export async function resolveTenant(request: NextRequest): Promise<Tenant | null> {
  const host = request.headers.get('host') || ''
  const { pathname } = request.nextUrl

  let tenantSlug: string | null = null

  // 1. Tentar resolver por subdomínio (empresa.contabilpro.com)
  if (host.includes('.') && !host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
    const subdomain = host.split('.')[0]
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      tenantSlug = subdomain
    }
  }

  // 2. Tentar resolver por path (/t/empresa/...)
  if (!tenantSlug && pathname.startsWith('/t/')) {
    const segments = pathname.split('/')
    if (segments.length >= 3) {
      tenantSlug = segments[2]
    }
  }

  if (!tenantSlug) {
    return null
  }

  // Verificar cache
  const cacheKey = `tenant:${tenantSlug}`
  const cached = tenantCache.get(cacheKey) as CacheEntry | undefined

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.tenant
  }

  // Buscar no banco
  try {
    const tenant = await getTenantBySlug(tenantSlug)

    if (tenant) {
      // Atualizar cache
      tenantCache.set(cacheKey, {
        tenant,
        timestamp: Date.now(),
      })
    }

    return tenant
  } catch (error) {
    console.error('Erro ao resolver tenant:', error)
    return null
  }
}

/**
 * Buscar tenant por slug no banco
 */
async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return undefined
        },
        set() {},
        remove() {},
      },
    }
  )

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error || !data) {
    return null
  }

  return data as Tenant
}

/**
 * Buscar tenant por ID
 */
export async function getTenantById(id: string): Promise<Tenant | null> {
  const cacheKey = `tenant:id:${id}`
  const cached = tenantCache.get(cacheKey) as CacheEntry | undefined

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.tenant
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return undefined
        },
        set() {},
        remove() {},
      },
    }
  )

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (error || !data) {
    return null
  }

  const tenant = data as Tenant

  // Atualizar cache
  tenantCache.set(cacheKey, {
    tenant,
    timestamp: Date.now(),
  })

  return tenant
}

/**
 * Invalidar cache de tenant
 */
export function invalidateTenantCache(slug: string, id?: string) {
  tenantCache.delete(`tenant:${slug}`)
  if (id) {
    tenantCache.delete(`tenant:id:${id}`)
  }
}

/**
 * Limpar todo o cache de tenants
 */
export function clearTenantCache() {
  tenantCache.clear()
}

/**
 * Obter tenant do contexto de headers (para Server Actions/BFF)
 */
export function getTenantFromHeaders(headers: Headers): { slug: string; id: string } | null {
  const tenantSlug = headers.get('x-tenant')
  const tenantId = headers.get('x-tenant-id')

  if (!tenantSlug || !tenantId) {
    return null
  }

  return {
    slug: tenantSlug,
    id: tenantId,
  }
}

/**
 * Validar se um slug de tenant é válido
 */
export function isValidTenantSlug(slug: string): boolean {
  // Slug deve ter entre 2-50 caracteres, apenas letras, números e hífens
  const slugRegex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/
  return slugRegex.test(slug)
}

/**
 * Gerar URL canônica para tenant
 */
export function getTenantUrl(tenant: Tenant, path = ''): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Em produção, usar subdomínio
  if (process.env.NODE_ENV === 'production') {
    const url = new URL(baseUrl)
    url.hostname = `${tenant.slug}.${url.hostname}`
    url.pathname = path
    return url.toString()
  }

  // Em desenvolvimento, usar path-based
  return `${baseUrl}/t/${tenant.slug}${path}`
}
