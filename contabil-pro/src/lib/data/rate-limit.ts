/**
 * Rate limiting utilities
 * Implementa controle de taxa de requisições por usuário/ação
 */

import { createClient } from '@/lib/supabase'

export interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

/**
 * Configurações padrão de rate limit por ação
 */
const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  'search_clients': { maxRequests: 5, windowSeconds: 10 },
  'create_client': { maxRequests: 10, windowSeconds: 60 },
  'import_clients': { maxRequests: 3, windowSeconds: 300 }, // 3 imports a cada 5 minutos
  'export_data': { maxRequests: 5, windowSeconds: 60 },
  'api_call': { maxRequests: 100, windowSeconds: 60 },
}

/**
 * Verifica rate limit usando a função do banco de dados
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase = createClient()
  
  const { maxRequests, windowSeconds } = config || DEFAULT_LIMITS[action] || DEFAULT_LIMITS.api_call
  
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_action: action,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    })
    
    if (error) {
      console.error('[RateLimit] Erro ao verificar rate limit:', error)
      // Em caso de erro, permitir a requisição (fail open)
      return {
        allowed: true,
        remaining: maxRequests,
        resetAt: new Date(Date.now() + windowSeconds * 1000),
      }
    }
    
    const allowed = data as boolean
    
    // Calcular remaining e resetAt (aproximado)
    const resetAt = new Date(Date.now() + windowSeconds * 1000)
    const remaining = allowed ? maxRequests - 1 : 0
    
    return {
      allowed,
      remaining,
      resetAt,
    }
  } catch (error) {
    console.error('[RateLimit] Exceção ao verificar rate limit:', error)
    // Em caso de exceção, permitir a requisição (fail open)
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    }
  }
}

/**
 * Middleware para rate limiting em Server Actions
 * Uso: await requireRateLimit(userId, 'search_clients')
 */
export async function requireRateLimit(
  userId: string,
  action: string,
  config?: RateLimitConfig
): Promise<void> {
  const result = await checkRateLimit(userId, action, config)
  
  if (!result.allowed) {
    const resetIn = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)
    throw new Error(
      `Rate limit excedido. Tente novamente em ${resetIn} segundos.`
    )
  }
}

/**
 * Rate limiter em memória (fallback quando DB não está disponível)
 * Útil para desenvolvimento e testes
 */
class InMemoryRateLimiter {
  private requests = new Map<string, number[]>()
  
  check(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Obter requisições dentro da janela
    const userRequests = this.requests.get(key) || []
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart)
    
    // Verificar se excedeu o limite
    if (validRequests.length >= maxRequests) {
      return false
    }
    
    // Adicionar nova requisição
    validRequests.push(now)
    this.requests.set(key, validRequests)
    
    // Limpar requisições antigas periodicamente
    if (Math.random() < 0.01) {
      this.cleanup(windowStart)
    }
    
    return true
  }
  
  private cleanup(before: number): void {
    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(t => t > before)
      if (valid.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, valid)
      }
    }
  }
  
  clear(): void {
    this.requests.clear()
  }
  
  size(): number {
    return this.requests.size
  }
}

// Instância global do rate limiter em memória
const memoryLimiter = new InMemoryRateLimiter()

/**
 * Rate limiter em memória (para desenvolvimento/testes)
 */
export function checkRateLimitMemory(
  userId: string,
  action: string,
  config?: RateLimitConfig
): RateLimitResult {
  const { maxRequests, windowSeconds } = config || DEFAULT_LIMITS[action] || DEFAULT_LIMITS.api_call
  const windowMs = windowSeconds * 1000
  
  const key = `${userId}:${action}`
  const allowed = memoryLimiter.check(key, maxRequests, windowMs)
  
  return {
    allowed,
    remaining: allowed ? maxRequests - 1 : 0,
    resetAt: new Date(Date.now() + windowMs),
  }
}

/**
 * Limpa o rate limiter em memória
 */
export function clearRateLimitMemory(): void {
  memoryLimiter.clear()
}

/**
 * Retorna o tamanho do rate limiter em memória
 */
export function getRateLimitMemorySize(): number {
  return memoryLimiter.size()
}

/**
 * Decorator para adicionar rate limiting a uma função
 */
export function withRateLimit(
  action: string,
  config?: RateLimitConfig
) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: T
  ): T {
    return (async function (this: any, ...args: any[]) {
      // Assumir que o primeiro argumento contém userId
      const userId = args[0]?.userId || args[0]?.user_id
      
      if (!userId) {
        throw new Error('userId não encontrado para rate limiting')
      }
      
      await requireRateLimit(userId, action, config)
      
      return target.apply(this, args)
    }) as T
  }
}

/**
 * Hook para usar rate limiting em componentes React
 * Retorna uma função que verifica rate limit antes de executar
 */
export function useRateLimit(action: string, config?: RateLimitConfig) {
  return async <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    userId: string
  ): Promise<ReturnType<T>> => {
    const result = await checkRateLimit(userId, action, config)
    
    if (!result.allowed) {
      const resetIn = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)
      throw new Error(
        `Muitas requisições. Aguarde ${resetIn} segundos.`
      )
    }
    
    return fn() as ReturnType<T>
  }
}

/**
 * Utilitário para criar headers de rate limit (padrão HTTP)
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.remaining + (result.allowed ? 1 : 0)),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
  }
}

/**
 * Debounce helper para busca
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * Throttle helper para eventos frequentes
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    
    if (now - lastCall >= delay) {
      lastCall = now
      fn.apply(this, args)
    }
  }
}

