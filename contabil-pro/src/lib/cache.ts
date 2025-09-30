/**
 * Política de Cache do Dashboard - ContabilPRO
 * 
 * DECISÃO: Cache "quase tempo real" com janela de 60s
 * RACIONAL: Dados contábeis não mudam a cada segundo, mas precisam ser atuais
 * IMPLICAÇÕES: Reduz carga no DB, melhora UX, mantém dados relevantes
 */

import { unstable_cache } from 'next/cache'

// Configurações de cache por tipo de dado
export const CACHE_CONFIG = {
  // Dashboard: dados agregados, baixa frequência de mudança
  DASHBOARD_SUMMARY: {
    duration: 60, // 60 segundos
    tags: ['dashboard', 'summary'],
    staleWhileRevalidate: 30, // Serve cache por 30s extras enquanto revalida
  },
  
  // Tendências: dados históricos, mudança ainda menor
  DASHBOARD_TREND: {
    duration: 300, // 5 minutos
    tags: ['dashboard', 'trend'],
    staleWhileRevalidate: 60,
  },
  
  // Atividades recentes: mais dinâmico, cache menor
  RECENT_ACTIVITY: {
    duration: 30, // 30 segundos
    tags: ['dashboard', 'activity'],
    staleWhileRevalidate: 15,
  },
  
  // Listas de clientes: mudança moderada
  CLIENTS_LIST: {
    duration: 120, // 2 minutos
    tags: ['clients', 'list'],
    staleWhileRevalidate: 60,
  },
} as const

// Tipo para configuração de cache
type CacheConfig = typeof CACHE_CONFIG[keyof typeof CACHE_CONFIG]

/**
 * Wrapper para cache com política consciente
 */
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config: CacheConfig,
  keyPrefix: string
) {
  return unstable_cache(
    fn,
    [keyPrefix],
    {
      revalidate: config.duration,
      tags: config.tags ? [...config.tags] : undefined,
    }
  )
}

/**
 * Invalidação de cache por tags
 */
export async function invalidateCache(tags: string[]) {
  const { revalidateTag } = await import('next/cache')
  
  for (const tag of tags) {
    revalidateTag(tag)
  }
}

/**
 * Invalidação específica do dashboard
 */
export async function invalidateDashboardCache(tenantId: string) {
  await invalidateCache([
    'dashboard',
    `dashboard-${tenantId}`,
    'summary',
    'trend',
    'activity'
  ])
}

/**
 * Metadata de cache para debugging
 */
export interface CacheMetadata {
  cachedAt: Date
  expiresAt: Date
  source: 'cache' | 'database'
  tenantId: string
}

/**
 * Wrapper de resposta com metadata de cache
 */
export interface CachedResponse<T> {
  data: T
  metadata: CacheMetadata
}

/**
 * Helper para criar resposta com metadata
 */
export function createCachedResponse<T>(
  data: T,
  tenantId: string,
  cacheDuration: number,
  source: 'cache' | 'database' = 'database'
): CachedResponse<T> {
  const now = new Date()
  
  return {
    data,
    metadata: {
      cachedAt: now,
      expiresAt: new Date(now.getTime() + cacheDuration * 1000),
      source,
      tenantId,
    }
  }
}

/**
 * Verificar se cache está válido
 */
export function isCacheValid(metadata: CacheMetadata): boolean {
  return new Date() < metadata.expiresAt
}

/**
 * Estratégia de fallback para cache
 */
export interface CacheFallbackStrategy {
  useStaleOnError: boolean
  maxStaleAge: number // segundos
  fallbackValue?: any
}

export const DEFAULT_FALLBACK: CacheFallbackStrategy = {
  useStaleOnError: true,
  maxStaleAge: 300, // 5 minutos de dados stale em caso de erro
}
