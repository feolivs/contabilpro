/**
 * Utilitários para busca e validação de CEP
 * Usa ViaCEP como provedor principal
 */

export interface CEPData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
}

export interface AddressData {
  cep: string
  street: string
  complement: string
  neighborhood: string
  city: string
  state: string
  fullAddress: string
}

/**
 * Normaliza CEP removendo caracteres não-numéricos
 */
export function normalizeCEP(cep: string): string {
  return cep.replace(/\D/g, '')
}

/**
 * Valida formato de CEP (8 dígitos)
 */
export function validateCEP(cep: string): boolean {
  const cleaned = normalizeCEP(cep)
  return cleaned.length === 8 && /^\d{8}$/.test(cleaned)
}

/**
 * Formata CEP: 12345678 -> 12345-678
 */
export function formatCEP(cep: string): string {
  const cleaned = normalizeCEP(cep)

  if (cleaned.length !== 8) return cep

  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
}

/**
 * Busca dados de endereço pelo CEP usando ViaCEP
 * Retorna null se CEP não for encontrado ou houver erro
 */
export async function fetchAddressByCEP(cep: string): Promise<AddressData | null> {
  try {
    const cleaned = normalizeCEP(cep)

    if (!validateCEP(cleaned)) {
      console.error('[CEP] CEP inválido:', cep)
      return null
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      // Timeout de 5 segundos
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.error('[CEP] Erro na resposta da API:', response.status)
      return null
    }

    const data: CEPData = await response.json()

    // ViaCEP retorna { erro: true } quando CEP não existe
    if ('erro' in data && data.erro) {
      console.warn('[CEP] CEP não encontrado:', cleaned)
      return null
    }

    // Montar endereço completo
    const fullAddress = [data.logradouro, data.complemento, data.bairro, data.localidade, data.uf]
      .filter(Boolean)
      .join(', ')

    return {
      cep: formatCEP(data.cep),
      street: data.logradouro || '',
      complement: data.complemento || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
      fullAddress,
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[CEP] Timeout ao buscar CEP:', cep)
      } else {
        console.error('[CEP] Erro ao buscar CEP:', error.message)
      }
    }
    return null
  }
}

/**
 * Busca dados de endereço pelo CEP com retry
 * Tenta até 3 vezes em caso de falha
 */
export async function fetchAddressByCEPWithRetry(
  cep: string,
  maxRetries: number = 3
): Promise<AddressData | null> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchAddressByCEP(cep)

      if (result !== null) {
        return result
      }

      // Se retornou null mas não foi erro de rede, não tentar novamente
      if (attempt === 1) {
        return null
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Erro desconhecido')
      console.warn(`[CEP] Tentativa ${attempt}/${maxRetries} falhou:`, lastError.message)

      // Aguardar antes de tentar novamente (backoff exponencial)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
      }
    }
  }

  console.error('[CEP] Todas as tentativas falharam:', lastError?.message)
  return null
}

/**
 * Busca múltiplos CEPs em paralelo
 */
export async function fetchMultipleCEPs(ceps: string[]): Promise<Map<string, AddressData | null>> {
  const results = await Promise.allSettled(
    ceps.map(async cep => ({
      cep,
      data: await fetchAddressByCEP(cep),
    }))
  )

  const map = new Map<string, AddressData | null>()

  results.forEach((result, index) => {
    const cep = ceps[index]

    if (result.status === 'fulfilled') {
      map.set(cep, result.value.data)
    } else {
      console.error(`[CEP] Erro ao buscar ${cep}:`, result.reason)
      map.set(cep, null)
    }
  })

  return map
}

/**
 * Cache simples em memória para CEPs (evita requisições duplicadas)
 */
class CEPCache {
  private cache = new Map<string, { data: AddressData | null; timestamp: number }>()
  private ttl = 1000 * 60 * 60 // 1 hora

  get(cep: string): AddressData | null | undefined {
    const cleaned = normalizeCEP(cep)
    const cached = this.cache.get(cleaned)

    if (!cached) return undefined

    // Verificar se expirou
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(cleaned)
      return undefined
    }

    return cached.data
  }

  set(cep: string, data: AddressData | null): void {
    const cleaned = normalizeCEP(cep)
    this.cache.set(cleaned, {
      data,
      timestamp: Date.now(),
    })
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Instância global do cache
const cepCache = new CEPCache()

/**
 * Busca CEP com cache
 */
export async function fetchAddressByCEPCached(cep: string): Promise<AddressData | null> {
  const cleaned = normalizeCEP(cep)

  // Verificar cache
  const cached = cepCache.get(cleaned)
  if (cached !== undefined) {
    console.log('[CEP] Cache hit:', cleaned)
    return cached
  }

  // Buscar da API
  console.log('[CEP] Cache miss, buscando da API:', cleaned)
  const data = await fetchAddressByCEP(cleaned)

  // Salvar no cache
  cepCache.set(cleaned, data)

  return data
}

/**
 * Limpa o cache de CEPs
 */
export function clearCEPCache(): void {
  cepCache.clear()
}

/**
 * Retorna o tamanho do cache
 */
export function getCEPCacheSize(): number {
  return cepCache.size()
}

/**
 * Máscara de input para CEP
 */
export function applyCEPMask(value: string): string {
  const cleaned = normalizeCEP(value)

  if (cleaned.length === 0) return ''
  if (cleaned.length <= 5) return cleaned

  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`
}
