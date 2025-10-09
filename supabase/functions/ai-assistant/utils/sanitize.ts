// ============================================================================
// SANITIZAÇÃO DE LOGS - LGPD COMPLIANCE
// ============================================================================

/**
 * Sanitiza PII (Personally Identifiable Information) de strings
 * Remove ou mascara: CPF, CNPJ, email, telefone, cartão de crédito
 */
export function sanitizePII(text: string): string {
  return text
    // CPF: 123.456.789-01 -> ***.***.***-**
    .replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, '***.***.***-**')
    // CNPJ: 12.345.678/0001-90 -> **.***.***/****-**
    .replace(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g, '**.***.***/****-**')
    // Cartão de crédito: 1234 5678 9012 3456 -> **** **** **** ****
    .replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '**** **** **** ****')
    // Email: user@example.com -> u***@e***.com
    .replace(/([a-zA-Z])[a-zA-Z0-9._-]*@([a-zA-Z])[a-zA-Z0-9.-]*/g, '$1***@$2***')
    // Telefone: (11) 98765-4321 -> (11) *****-****
    .replace(/\(\d{2}\)\s*\d{4,5}-\d{4}/g, (match) => {
      const ddd = match.match(/\((\d{2})\)/)?.[1];
      return `(${ddd}) *****-****`;
    });
}

/**
 * Sanitiza objetos recursivamente para logs
 * Remove campos sensíveis e aplica sanitizePII em strings
 */
export function sanitizeForLog(data: any): any {
  if (typeof data === 'string') {
    return sanitizePII(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeForLog);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Campos sensíveis: nunca logar
      if (['password', 'token', 'secret', 'apiKey', 'access_token', 'refresh_token'].includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLog(value);
      }
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Cria um preview seguro de texto (limita tamanho e sanitiza)
 */
export function createSafePreview(text: string, maxLength: number = 100): string {
  const preview = text.slice(0, maxLength);
  return sanitizePII(preview) + (text.length > maxLength ? '...' : '');
}

/**
 * Exemplo de uso:
 * 
 * console.log('AI Assistant request', sanitizeForLog({
 *   clientId,
 *   userId,
 *   questionPreview: createSafePreview(question),
 *   timestamp: new Date().toISOString()
 * }));
 */

