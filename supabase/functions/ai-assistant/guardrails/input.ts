import { InputGuardrail } from '@openai/agents';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// 1. SECURITY GUARDRAIL - Detectar tentativas maliciosas
// ============================================================================

export const securityGuardrail: InputGuardrail = {
  name: 'Security Check',
  execute: async ({ input, context }) => {
    // Padrões compostos (mais específicos para reduzir falsos positivos)
    const sqlInjectionPatterns = [
      /SELECT\s+.+\s+FROM/i,           // SELECT ... FROM
      /UNION\s+SELECT/i,                // UNION SELECT
      /DROP\s+TABLE/i,                  // DROP TABLE
      /DELETE\s+FROM/i,                 // DELETE FROM
      /INSERT\s+INTO/i,                 // INSERT INTO
      /UPDATE\s+.+\s+SET/i,             // UPDATE ... SET
      /;\s*DROP/i,                      // ; DROP
      /'\s*OR\s+'1'\s*=\s*'1/i,        // ' OR '1'='1
    ];
    
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/i,   // <script>...</script>
      /javascript:\s*[^;]+/i,           // javascript:...
      /on\w+\s*=\s*["'][^"']*["']/i,   // onerror="..."
    ];
    
    const bypassPatterns = [
      /\.\.\//,                         // ../
      /system\s*\(/i,                   // system(
      /exec\s*\(/i,                     // exec(
      /eval\s*\(/i,                     // eval(
    ];
    
    // Detectar tentativas de acessar outros clientes (UUID pattern)
    const clientIdBypassPattern = /client[_\s]?id[:\s]*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    
    const allPatterns = [
      ...sqlInjectionPatterns,
      ...xssPatterns,
      ...bypassPatterns,
      clientIdBypassPattern
    ];
    
    const matchedPatterns: string[] = [];
    for (const pattern of allPatterns) {
      if (pattern.test(input)) {
        matchedPatterns.push(pattern.source);
      }
    }
    
    const isSuspicious = matchedPatterns.length > 0;
    
    if (isSuspicious) {
      console.warn('🚨 Security guardrail triggered', {
        inputPreview: input.substring(0, 100), // ✅ Apenas preview
        userId: context.userId,
        clientId: context.clientId,
        matchedPatterns: matchedPatterns.length,
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      outputInfo: { 
        checked: true, 
        suspicious: isSuspicious,
        patternsMatched: matchedPatterns.length
      },
      tripwireTriggered: isSuspicious
    };
  }
};

// ============================================================================
// 2. DATE VALIDATION GUARDRAIL - Validar competências
// ============================================================================

export const dateValidationGuardrail: InputGuardrail = {
  name: 'Date Validation',
  execute: async ({ input }) => {
    // Normalizar Unicode (remover acentos)
    const normalized = input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    
    // Padrões de data
    const datePatterns = [
      // Numérico: 01/2025, 1/2025, 13/2024
      /(\d{1,2})\/(\d{4})/g,
      // Textual com acento: março de 2025
      /(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|13º)\s*(?:de\s*)?(\d{4})/gi,
      // Textual sem acento: marco de 2025
      /(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|13o)\s*(?:de\s*)?(\d{4})/gi,
      // Abreviado: jan/2025, dez/24
      /(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/(\d{2,4})/gi,
    ];
    
    const monthMap: Record<string, number> = {
      'janeiro': 1, 'jan': 1,
      'fevereiro': 2, 'fev': 2,
      'março': 3, 'marco': 3, 'mar': 3,
      'abril': 4, 'abr': 4,
      'maio': 5, 'mai': 5,
      'junho': 6, 'jun': 6,
      'julho': 7, 'jul': 7,
      'agosto': 8, 'ago': 8,
      'setembro': 9, 'set': 9,
      'outubro': 10, 'out': 10,
      'novembro': 11, 'nov': 11,
      'dezembro': 12, 'dez': 12,
      '13º': 13, '13o': 13
    };
    
    let hasInvalidDate = false;
    const dates: Array<{ month: number; year: number; valid: boolean; raw: string }> = [];
    
    for (const pattern of datePatterns) {
      const matches = [...normalized.matchAll(pattern)];
      for (const match of matches) {
        let month: number;
        let year: number;
        
        if (/^\d+$/.test(match[1])) {
          // Formato numérico
          month = parseInt(match[1]);
          year = parseInt(match[2]);
        } else {
          // Formato textual
          month = monthMap[match[1].toLowerCase()] || 0;
          year = parseInt(match[2]);
          
          // Ano abreviado (24 -> 2024)
          if (year < 100) {
            year += 2000;
          }
        }
        
        const isValid = month >= 1 && month <= 13 && year >= 2020 && year <= 2030;
        dates.push({ month, year, valid: isValid, raw: match[0] });
        
        if (!isValid) hasInvalidDate = true;
      }
    }
    
    if (hasInvalidDate) {
      console.warn('⚠️ Invalid date detected', {
        invalidDates: dates.filter(d => !d.valid),
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      outputInfo: { dates, checked: dates.length > 0 },
      tripwireTriggered: hasInvalidDate
    };
  }
};

// ============================================================================
// 3. CLIENT ACCESS GUARDRAIL - Validar acesso ao cliente (com memberships)
// ============================================================================

export const clientAccessGuardrail: InputGuardrail = {
  name: 'Client Access Validation',
  execute: async ({ input, context }) => {
    const { clientId, userId, supabase } = context;
    
    if (!clientId || !userId || !supabase) {
      return {
        outputInfo: { error: 'Missing required context' },
        tripwireTriggered: true
      };
    }
    
    // ✅ Validar membership (RLS já filtra, mas defense-in-depth)
    const { data: membership, error } = await supabase
      .from('memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('client_id', clientId)
      .single();
    
    const hasAccess = !!membership && !error;
    const role = membership?.role;
    
    if (!hasAccess) {
      console.warn('🚨 Unauthorized client access attempt', {
        userId,
        clientId,
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      outputInfo: { 
        hasAccess, 
        role,
        clientId, 
        userId 
      },
      tripwireTriggered: !hasAccess
    };
  }
};

