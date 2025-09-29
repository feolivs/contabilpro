/**
 * Sistema de Resiliência - ContabilPRO
 * 
 * OBJETIVO: Degradação elegante quando RPCs falham
 * ESTRATÉGIA: Fallback para dados em cache + estado claro para o usuário
 */

import { CachedResponse, CacheMetadata } from './cache'

export interface ResilienceConfig {
  maxRetries: number
  retryDelayMs: number
  fallbackToCache: boolean
  maxCacheAgeMs: number
  showErrorToUser: boolean
}

export const DEFAULT_RESILIENCE_CONFIG: ResilienceConfig = {
  maxRetries: 2,
  retryDelayMs: 1000,
  fallbackToCache: true,
  maxCacheAgeMs: 5 * 60 * 1000, // 5 minutos
  showErrorToUser: true,
}

export interface ResilientResponse<T> {
  data: T | null
  success: boolean
  error?: string
  metadata: {
    source: 'live' | 'cache' | 'fallback'
    lastSuccessAt?: Date
    retryCount: number
    degraded: boolean
    userMessage?: string
  }
}

/**
 * Wrapper resiliente para funções que podem falhar
 */
export async function withResilience<T>(
  operation: () => Promise<T>,
  fallbackData: T | null = null,
  config: Partial<ResilienceConfig> = {}
): Promise<ResilientResponse<T>> {
  const finalConfig = { ...DEFAULT_RESILIENCE_CONFIG, ...config }
  let lastError: Error | null = null
  
  // Tentar operação principal com retries
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      const data = await operation()
      
      return {
        data,
        success: true,
        metadata: {
          source: 'live',
          retryCount: attempt,
          degraded: false,
        }
      }
    } catch (error) {
      lastError = error as Error
      
      if (attempt < finalConfig.maxRetries) {
        await sleep(finalConfig.retryDelayMs * (attempt + 1)) // Backoff exponencial
      }
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  console.error('Operation failed after retries:', lastError)
  
  // Tentar fallback para cache/dados estáticos
  if (finalConfig.fallbackToCache && fallbackData !== null) {
    return {
      data: fallbackData,
      success: false,
      error: lastError?.message,
      metadata: {
        source: 'fallback',
        retryCount: finalConfig.maxRetries,
        degraded: true,
        userMessage: 'Exibindo dados em cache. Alguns dados podem estar desatualizados.',
      }
    }
  }
  
  // Falha total
  return {
    data: null,
    success: false,
    error: lastError?.message,
    metadata: {
      source: 'fallback',
      retryCount: finalConfig.maxRetries,
      degraded: true,
      userMessage: 'Não foi possível carregar os dados. Tente novamente em alguns minutos.',
    }
  }
}

/**
 * Dados de fallback para o dashboard
 */
export const DASHBOARD_FALLBACK_DATA = {
  summary: {
    revenue: { current: 0, previous: 0 },
    expense: { current: 0, previous: 0 },
    newClients: { current: 0, previous: 0 },
    bankTransactions: { current: 0, previous: 0 },
    aiInsights: { current: 0, previous: 0 },
  },
  trend: [],
  recentActivity: [],
} as const

/**
 * Verificar se dados em cache ainda são válidos para fallback
 */
export function isCacheValidForFallback(
  metadata: CacheMetadata,
  maxAgeMs: number = 5 * 60 * 1000
): boolean {
  const ageMs = Date.now() - metadata.cachedAt.getTime()
  return ageMs <= maxAgeMs
}

/**
 * Criar mensagem de estado para o usuário
 */
export function createUserStateMessage(
  source: 'live' | 'cache' | 'fallback',
  lastSuccessAt?: Date,
  error?: string
): string {
  switch (source) {
    case 'live':
      return 'Dados atualizados'
    
    case 'cache':
      const timeAgo = lastSuccessAt 
        ? formatTimeAgo(lastSuccessAt)
        : 'há alguns minutos'
      return `Dados de ${timeAgo}`
    
    case 'fallback':
      return error 
        ? 'Erro ao carregar dados. Tente novamente.'
        : 'Dados indisponíveis temporariamente'
    
    default:
      return 'Estado desconhecido'
  }
}

/**
 * Formatar tempo relativo
 */
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (diffMinutes < 1) return 'agora'
  if (diffMinutes < 60) return `há ${diffMinutes} min`
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `há ${diffHours}h`
  
  const diffDays = Math.floor(diffHours / 24)
  return `há ${diffDays} dias`
}

/**
 * Sleep helper para delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Circuit breaker simples
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  constructor(
    private threshold = 5,
    private timeoutMs = 60000 // 1 minuto
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeoutMs) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }
    
    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }
  
  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.threshold) {
      this.state = 'open'
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    }
  }
}
