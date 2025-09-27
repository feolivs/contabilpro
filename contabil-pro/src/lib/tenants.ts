import { createServerClient } from '@supabase/ssr'

export interface Tenant {
  id: string
  name: string
  slug: string
  document: string
  email?: string
  phone?: string
  address?: string
  settings: Record<string, unknown>
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
}

interface CacheEntry {
  tenant: Tenant
  timestamp: number
}

const CACHE_TTL_MS = 5 * 60 * 1000
const tenantCache = new Map<string, CacheEntry>()

export function resolveTenantFromHost(host: string | null): string | null {
  if (!host) {
    return null
  }

  const normalizedHost = host.toLowerCase()
  const denyList = ['www', 'api']

  if (normalizedHost.includes('localhost')) {
    return null
  }

  const parts = normalizedHost.split('.')
  if (parts.length < 3) {
    return null
  }

  const subdomain = parts[0]
  if (!subdomain || denyList.includes(subdomain)) {
    return null
  }

  return normalizeTenantSlug(subdomain)
}

export function extractTenantFromPath(pathname: string): string | null {
  if (!pathname.startsWith('/t/')) {
    return null
  }

  const segments = pathname.split('/').filter(Boolean)
  const slug = segments[1]
  return normalizeTenantSlug(slug)
}

export function normalizeTenantSlug(slug: string | null | undefined): string | null {
  if (!slug) {
    return null
  }

  const trimmed = slug.trim().toLowerCase()
  return isValidTenantSlug(trimmed) ? trimmed : null
}

export function resolveTenantSlug(host: string | null, pathname: string): string | null {
  return resolveTenantFromHost(host) ?? extractTenantFromPath(pathname)
}

export function isValidTenantSlug(slug: string): boolean {
  const pattern = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/
  return pattern.test(slug)
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const normalized = normalizeTenantSlug(slug)
  if (!normalized) {
    return null
  }

  const cacheKey = `tenant:slug:${normalized}`
  const cached = tenantCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.tenant
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // noop - middleware will set cookies on the response side
        },
      },
    },
  )

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', normalized)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const tenant = data as Tenant
  tenantCache.set(cacheKey, { tenant, timestamp: Date.now() })
  tenantCache.set(`tenant:id:${tenant.id}`, { tenant, timestamp: Date.now() })
  return tenant
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const cacheKey = `tenant:id:${id}`
  const cached = tenantCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.tenant
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    },
  )

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const tenant = data as Tenant
  tenantCache.set(cacheKey, { tenant, timestamp: Date.now() })
  tenantCache.set(`tenant:slug:${tenant.slug}`, { tenant, timestamp: Date.now() })
  return tenant
}

export function invalidateTenantCache(slug: string, id?: string) {
  tenantCache.delete(`tenant:slug:${slug}`)
  if (id) {
    tenantCache.delete(`tenant:id:${id}`)
  }
}

export function clearTenantCache() {
  tenantCache.clear()
}

export function getTenantFromHeaders(headers: Headers): { slug: string; id: string } | null {
  const slug = headers.get('x-tenant')
  const id = headers.get('x-tenant-id')
  if (!slug || !id) {
    return null
  }

  return { slug, id }
}
