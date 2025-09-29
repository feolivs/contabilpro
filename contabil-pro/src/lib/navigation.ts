/**
 * Helpers para construção de URLs com tenant
 */

/**
 * Constrói uma URL com tenant no formato /t/<tenant-slug>/path
 */
export function buildTenantUrl(tenantSlug: string | null | undefined, path: string): string {
  if (!tenantSlug) {
    // Fallback para path direto se não houver tenant
    return path
  }

  // Remove leading slash se existir
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Constrói URL com tenant
  return `/t/${tenantSlug}/${cleanPath}`
}

/**
 * Extrai o path base de uma URL com tenant
 * /t/meu-escritorio/clientes -> /clientes
 */
export function extractPathFromTenantUrl(url: string): string {
  if (!url.startsWith('/t/')) {
    return url
  }

  const segments = url.split('/').filter(Boolean)
  if (segments.length < 3) {
    return '/'
  }

  // Remove 't' e tenant-slug, mantém o resto
  const pathSegments = segments.slice(2)
  return `/${pathSegments.join('/')}`
}

/**
 * Verifica se um path está ativo considerando URLs com tenant
 */
export function isPathActiveWithTenant(currentPath: string, targetHref: string): boolean {
  // Extrair path base de ambas as URLs
  const currentBasePath = extractPathFromTenantUrl(currentPath)
  const targetBasePath = extractPathFromTenantUrl(targetHref)

  // Lógica de comparação padrão
  if (targetBasePath === '/') {
    return currentBasePath === '/'
  }

  if (currentBasePath === targetBasePath) {
    return true
  }

  const normalizedTarget = targetBasePath.endsWith('/') ? targetBasePath : targetBasePath + '/'
  return currentBasePath.startsWith(normalizedTarget)
}

/**
 * Normaliza um tenant slug
 */
export function normalizeTenantSlug(slug: string | null | undefined): string | null {
  if (!slug) {
    return null
  }

  const trimmed = slug.trim().toLowerCase()
  // Validação básica de slug
  const isValid = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/.test(trimmed)
  return isValid ? trimmed : null
}

/**
 * Helper para obter tenant slug do contexto de headers (Server Components)
 */
export function getTenantSlugFromHeaders(headers: Headers): string | null {
  return headers.get('x-tenant')
}

/**
 * Constrói URL com tenant usando headers (para Server Components)
 */
export function buildTenantUrlFromHeaders(headers: Headers, path: string): string {
  const tenantSlug = getTenantSlugFromHeaders(headers)
  return buildTenantUrl(tenantSlug, path)
}
