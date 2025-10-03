/**
 * Utilitários para manipulação de documentos (CPF/CNPJ)
 * Inclui normalização, validação e formatação
 */

/**
 * Normaliza um documento removendo todos os caracteres não-numéricos
 * Exemplo: "123.456.789-00" -> "12345678900"
 */
export function normalizeDocument(document: string): string {
  return document.replace(/\D/g, '')
}

/**
 * Valida CPF usando algoritmo de dígitos verificadores
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = normalizeDocument(cpf)

  if (cleaned.length !== 11) return false

  // Rejeitar CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false

  // Validar primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleaned.charAt(9))) return false

  // Validar segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleaned.charAt(10))) return false

  return true
}

/**
 * Valida CNPJ usando algoritmo de dígitos verificadores
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = normalizeDocument(cnpj)

  if (cleaned.length !== 14) return false

  // Rejeitar CNPJs com todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(cleaned)) return false

  // Validar primeiro dígito verificador
  let sum = 0
  let weight = 5
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleaned.charAt(12))) return false

  // Validar segundo dígito verificador
  sum = 0
  weight = 6
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleaned.charAt(13))) return false

  return true
}

/**
 * Valida documento (CPF ou CNPJ) automaticamente
 */
export function validateDocument(document: string): boolean {
  const cleaned = normalizeDocument(document)

  if (cleaned.length === 11) {
    return validateCPF(cleaned)
  }

  if (cleaned.length === 14) {
    return validateCNPJ(cleaned)
  }

  return false
}

/**
 * Formata CPF: 12345678900 -> 123.456.789-00
 */
export function formatCPF(cpf: string): string {
  const cleaned = normalizeDocument(cpf)

  if (cleaned.length !== 11) return cpf

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Formata CNPJ: 12345678000100 -> 12.345.678/0001-00
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = normalizeDocument(cnpj)

  if (cleaned.length !== 14) return cnpj

  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Formata documento (CPF ou CNPJ) automaticamente
 */
export function formatDocument(document: string): string {
  const cleaned = normalizeDocument(document)

  if (cleaned.length === 11) {
    return formatCPF(cleaned)
  }

  if (cleaned.length === 14) {
    return formatCNPJ(cleaned)
  }

  return document
}

/**
 * Detecta o tipo de documento
 */
export function getDocumentType(document: string): 'cpf' | 'cnpj' | null {
  const cleaned = normalizeDocument(document)

  if (cleaned.length === 11) return 'cpf'
  if (cleaned.length === 14) return 'cnpj'

  return null
}

/**
 * Detecta o tipo de pessoa baseado no documento
 */
export function getTipoPessoa(document: string): 'PF' | 'PJ' | null {
  const type = getDocumentType(document)

  if (type === 'cpf') return 'PF'
  if (type === 'cnpj') return 'PJ'

  return null
}

/**
 * Máscara de input para CPF/CNPJ
 * Retorna a máscara apropriada baseada no tamanho do input
 */
export function getDocumentMask(value: string): string {
  const cleaned = normalizeDocument(value)

  if (cleaned.length <= 11) {
    // Máscara de CPF: 999.999.999-99
    return '999.999.999-99'
  }

  // Máscara de CNPJ: 99.999.999/9999-99
  return '99.999.999/9999-99'
}

/**
 * Aplica máscara de CPF/CNPJ conforme o usuário digita
 */
export function applyDocumentMask(value: string): string {
  const cleaned = normalizeDocument(value)

  if (cleaned.length === 0) return ''

  if (cleaned.length <= 11) {
    // Aplicar máscara de CPF
    let formatted = cleaned
    if (cleaned.length > 3) {
      formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`
    }
    if (cleaned.length > 6) {
      formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`
    }
    if (cleaned.length > 9) {
      formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`
    }
    return formatted
  }

  // Aplicar máscara de CNPJ
  let formatted = cleaned
  if (cleaned.length > 2) {
    formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`
  }
  if (cleaned.length > 5) {
    formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`
  }
  if (cleaned.length > 8) {
    formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`
  }
  if (cleaned.length > 12) {
    formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`
  }

  return formatted
}

/**
 * Gera um CPF válido aleatório (apenas para testes)
 */
export function generateRandomCPF(): string {
  const random = (n: number) => Math.floor(Math.random() * n)

  const n1 = random(10)
  const n2 = random(10)
  const n3 = random(10)
  const n4 = random(10)
  const n5 = random(10)
  const n6 = random(10)
  const n7 = random(10)
  const n8 = random(10)
  const n9 = random(10)

  let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10
  d1 = 11 - (d1 % 11)
  if (d1 >= 10) d1 = 0

  let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11
  d2 = 11 - (d2 % 11)
  if (d2 >= 10) d2 = 0

  return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`
}

/**
 * Gera um CNPJ válido aleatório (apenas para testes)
 */
export function generateRandomCNPJ(): string {
  const random = (n: number) => Math.floor(Math.random() * n)

  const n = Array.from({ length: 12 }, () => random(10))

  let d1 = 0
  let weight = 5
  for (let i = 0; i < 12; i++) {
    d1 += n[i] * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  d1 = d1 % 11 < 2 ? 0 : 11 - (d1 % 11)

  let d2 = 0
  weight = 6
  for (let i = 0; i < 12; i++) {
    d2 += n[i] * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  d2 += d1 * 2
  d2 = d2 % 11 < 2 ? 0 : 11 - (d2 % 11)

  return `${n.join('')}${d1}${d2}`
}
