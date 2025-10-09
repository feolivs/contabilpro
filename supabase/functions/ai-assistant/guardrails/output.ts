import { OutputGuardrail } from '@openai/agents';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Schema da resposta do assistente
export const AssistantResponseSchema = z.object({
  response: z.string(),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.object({
    type: z.enum(['invoice', 'transaction', 'payroll', 'summary']),
    id: z.string(),
    relevance: z.number()
  }))
});

export type AssistantResponse = z.infer<typeof AssistantResponseSchema>;

// ============================================================================
// 1. DATA LEAK PREVENTION - Evitar vazamento de dados sensíveis
// ============================================================================

export const dataLeakGuardrail: OutputGuardrail<typeof AssistantResponseSchema> = {
  name: 'Data Leak Prevention',
  execute: async ({ agentOutput }) => {
    const sensitivePatterns = [
      { name: 'CPF', pattern: /\d{3}\.\d{3}\.\d{3}-\d{2}/ },
      { name: 'CNPJ', pattern: /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/ },
      { name: 'Credit Card', pattern: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/ },
      { name: 'Bank Account', pattern: /ag[êe]ncia[:\s]*\d{4}.*conta[:\s]*\d+/i },
    ];
    
    const leaks: Array<{ type: string; count: number }> = [];
    let hasLeak = false;
    
    for (const { name, pattern } of sensitivePatterns) {
      const matches = agentOutput.response.match(new RegExp(pattern, 'g'));
      if (matches && matches.length > 0) {
        leaks.push({ type: name, count: matches.length });
        hasLeak = true;
      }
    }
    
    if (hasLeak) {
      console.error('🚨 Data leak detected in output', {
        leaks,
        responsePreview: agentOutput.response.substring(0, 100),
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      outputInfo: { leaks, checked: true },
      tripwireTriggered: hasLeak
    };
  }
};

// ============================================================================
// 2. FINANCIAL ACCURACY - Validar valores mencionados
// ============================================================================

export const financialAccuracyGuardrail: OutputGuardrail<typeof AssistantResponseSchema> = {
  name: 'Financial Accuracy Check',
  execute: async ({ agentOutput, context }) => {
    const { response, sources } = agentOutput;
    const { supabase } = context;
    
    // 1. Extrair valores monetários mencionados com spans
    const valuePattern = /R\$\s*([\d.,]+)/g;
    const matches = [...response.matchAll(valuePattern)];
    
    if (matches.length === 0) {
      return { outputInfo: { checked: false }, tripwireTriggered: false };
    }
    
    const mentionedValues: Array<{
      raw: string;
      value: number;
      position: number;
    }> = matches.map(match => ({
      raw: match[0],
      value: parseFloat(match[1].replace(/\./g, '').replace(',', '.')),
      position: match.index!
    }));
    
    // 2. Validar valores contra fontes citadas
    let hasInaccuracy = false;
    const validations: Array<{
      mentioned: number;
      actual: number;
      diff: number;
      source: string;
      valid: boolean;
    }> = [];
    
    const tolerance = 0.005; // 0.5%
    
    for (const source of sources) {
      let actualValue: number | null = null;
      let sourceLabel = '';
      
      try {
        if (source.type === 'invoice') {
          const { data } = await supabase
            .from('invoices')
            .select('total_amount, invoice_number')
            .eq('id', source.id)
            .single();
          actualValue = data?.total_amount;
          sourceLabel = `NF-e ${data?.invoice_number}`;
        } else if (source.type === 'transaction') {
          const { data } = await supabase
            .from('bank_transactions')
            .select('amount, description')
            .eq('id', source.id)
            .single();
          actualValue = Math.abs(data?.amount || 0);
          sourceLabel = `Transação ${data?.description}`;
        } else if (source.type === 'payroll') {
          const { data } = await supabase
            .from('payroll_summaries')
            .select('total_net_salary, reference_month, reference_year')
            .eq('id', source.id)
            .single();
          actualValue = data?.total_net_salary;
          sourceLabel = `Folha ${data?.reference_month}/${data?.reference_year}`;
        }
        
        if (actualValue !== null && mentionedValues.length > 0) {
          // Encontrar valor mencionado mais próximo
          const closestMention = mentionedValues.reduce((prev, curr) => {
            const prevDiff = Math.abs(prev.value - actualValue!);
            const currDiff = Math.abs(curr.value - actualValue!);
            return currDiff < prevDiff ? curr : prev;
          });
          
          const diff = Math.abs(closestMention.value - actualValue) / actualValue;
          const isValid = diff <= tolerance;
          
          validations.push({
            mentioned: closestMention.value,
            actual: actualValue,
            diff: diff * 100, // em %
            source: sourceLabel,
            valid: isValid
          });
          
          if (!isValid) hasInaccuracy = true;
        }
      } catch (error) {
        console.error('Error validating financial value', {
          sourceId: source.id,
          sourceType: source.type,
          error: error.message
        });
      }
    }
    
    if (hasInaccuracy) {
      console.error('🚨 Financial inaccuracy detected', {
        validations: validations.filter(v => !v.valid),
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      outputInfo: { 
        valuesChecked: mentionedValues.length,
        sourcesValidated: validations.length,
        validations
      },
      tripwireTriggered: hasInaccuracy
    };
  }
};

// ============================================================================
// 3. RESPONSE QUALITY - Verificar qualidade da resposta
// ============================================================================

export const responseQualityGuardrail: OutputGuardrail<typeof AssistantResponseSchema> = {
  name: 'Response Quality Check',
  execute: async ({ agentOutput }) => {
    const { response, confidence } = agentOutput;
    
    // Verificações de qualidade
    const checks = {
      tooShort: response.length < 20,
      tooLong: response.length > 2000,
      lowConfidence: confidence < 0.5,
      noSources: agentOutput.sources.length === 0,
      hasPlaceholders: /\[.*?\]|\{.*?\}|TODO|FIXME/i.test(response),
      wrongLanguage: !/[áàâãéêíóôõúç]/i.test(response) && response.length > 50
    };
    
    const hasQualityIssue = Object.values(checks).some(v => v);
    
    if (hasQualityIssue) {
      console.warn('⚠️ Response quality issue detected', {
        checks,
        confidence,
        responseLength: response.length,
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      outputInfo: { checks, confidence },
      tripwireTriggered: hasQualityIssue
    };
  }
};

