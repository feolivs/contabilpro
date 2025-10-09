Excelente análise! Vou criar o **PLANO AJUSTADO** com todos os pontos de atenção integrados:

---

# 📋 PLANO COMPLETO - PHASE 3: THE INTELLIGENCE LAYER
## **Versão 3.0 - Com Fundações de Segurança e Ajustes Críticos**

---

## 🚨 MUDANÇAS CRÍTICAS NESTA VERSÃO

### **Adicionado: DIA 0 - FUNDAÇÕES DE SEGURANÇA (2 dias)**
- ✅ Autenticação JWT correta (não ANON_KEY)
- ✅ RLS no Edge Function (client pass-through)
- ✅ Multi-tenant com memberships
- ✅ Guardrails refinados (menos falsos positivos)
- ✅ Financial Accuracy implementado completamente
- ✅ LGPD nos logs (sanitização de PII)
- ✅ SSE com reconexão (event IDs)
- ✅ Métricas e observabilidade

### **Estimativa Atualizada: 9-11 dias** (antes: 7-9 dias)

---

## 🔐 DIA 0: FUNDAÇÕES DE SEGURANÇA (PRIORIDADE CRÍTICA)

### **Por que "Dia 0"?**
Estes ajustes são **pré-requisitos de segurança** que devem ser implementados ANTES de qualquer funcionalidade. Sem eles, o sistema fica vulnerável a:
- 🚨 Bypass de RLS (acesso a dados de outros clientes)
- 🚨 Vazamento de PII em logs (violação LGPD)
- 🚨 Falsos positivos em guardrails (UX ruim)
- 🚨 Custos descontrolados (sem métricas)

---

### **DIA 0.1: AUTENTICAÇÃO JWT E RLS NO EDGE FUNCTION** ⚠️ CRÍTICO

#### **Problema Atual:**
```typescript
// ❌ ERRADO - Usa ANON_KEY, não identifica usuário
headers: {
  'Authorization': `Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}`
}

// ❌ ERRADO - Confia em userId do body
const { clientId, question, userId } = await req.json();
```

#### **Solução Correta:**

````typescript path=src/hooks/use-ai-assistant-stream.ts mode=EXCERPT
// ✅ CORRETO - Frontend envia JWT do usuário
export function useAIAssistantStream() {
  const sendMessage = useCallback(async (clientId: string, question: string) => {
    // 1. Obter sessão autenticada
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session || sessionError) {
      setError('Usuário não autenticado');
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // 2. Enviar JWT do usuário + apikey
    const response = await fetch(
      `${supabaseUrl}/functions/v1/ai-assistant`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`, // ✅ JWT do usuário
          'apikey': supabaseAnonKey,                         // ✅ ANON_KEY como apikey
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          clientId, 
          question
          // ❌ NÃO enviar userId - será extraído do JWT no backend
        })
      }
    );
    // ...
  }, []);
}
````

````typescript path=supabase/functions/ai-assistant/index.ts mode=EXCERPT
// ✅ CORRETO - Edge Function usa client pass-through
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // 1. Extrair Authorization header da requisição
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing Authorization header' }),
      { status: 401, headers: corsHeaders }
    );
  }

  // 2. Criar client pass-through (RLS será aplicado com JWT do usuário)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: {
          Authorization: authHeader // ✅ Passa JWT para Postgres
        }
      }
    }
  );

  // 3. Extrair userId do JWT (não confiar no body)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user || authError) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: corsHeaders }
    );
  }

  const userId = user.id; // ✅ userId autenticado e verificado

  // 4. Extrair apenas clientId e question do body
  const { clientId, question } = await req.json();

  if (!clientId || !question) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: clientId, question' }),
      { status: 422, headers: corsHeaders }
    );
  }

  // 5. Passar userId verificado para o contexto
  const stream = await run(agent, question, {
    stream: true,
    context: { 
      clientId, 
      userId,      // ✅ Do JWT, não do body
      supabase     // ✅ Client com RLS ativo
    }
  });
  // ...
});
````

#### **Checklist:**
- [ ] Frontend obtém `session.access_token` via `supabase.auth.getSession()`
- [ ] Frontend envia `Authorization: Bearer ${access_token}` + `apikey: ${ANON_KEY}`
- [ ] Edge Function cria client pass-through com `Authorization` header
- [ ] Edge Function extrai `userId` via `supabase.auth.getUser()` (não do body)
- [ ] Todas as queries usam o client pass-through (RLS ativo)
- [ ] ❌ NUNCA usar `SUPABASE_SERVICE_ROLE_KEY` para queries de usuário

---

### **DIA 0.2: MULTI-TENANT COM MEMBERSHIPS**

#### **Problema Atual:**
```typescript
// ❌ ERRADO - Assume relação direta user_id -> client_id
const { data: client } = await supabase
  .from('clients')
  .select('id')
  .eq('id', clientId)
  .eq('user_id', userId)
  .single();
```

#### **Solução: Tabela de Memberships**

````sql path=supabase/migrations/003_memberships_schema.sql mode=EXCERPT
-- Tabela de memberships (muitos-para-muitos)
CREATE TABLE public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, client_id)
);

-- Índices para performance
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_client_id ON public.memberships(client_id);
CREATE INDEX idx_memberships_user_client ON public.memberships(user_id, client_id);

-- RLS: usuário só vê seus próprios memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memberships"
    ON public.memberships
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Owners can manage memberships"
    ON public.memberships
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.client_id = memberships.client_id
            AND m.user_id = auth.uid()
            AND m.role = 'owner'
        )
    );

-- Atualizar RLS de clients para usar memberships
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

CREATE POLICY "Users can view clients they are members of"
    ON public.clients
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = clients.id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can manage their clients"
    ON public.clients
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = clients.id
            AND memberships.user_id = auth.uid()
            AND memberships.role = 'owner'
        )
    );

-- Trigger para criar membership automático ao criar cliente
CREATE OR REPLACE FUNCTION public.create_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.memberships (user_id, client_id, role)
    VALUES (NEW.user_id, NEW.id, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_client_created
    AFTER INSERT ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.create_owner_membership();
````

````typescript path=supabase/functions/ai-assistant/guardrails/input.ts mode=EXCERPT
// ✅ CORRETO - Client Access Guardrail com memberships
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
````

#### **Checklist:**
- [ ] Migration `003_memberships_schema.sql` criada e aplicada
- [ ] Tabela `memberships` com roles (owner, admin, member, viewer)
- [ ] RLS de `clients` atualizado para usar memberships
- [ ] Trigger cria membership automático ao criar cliente
- [ ] Client Access Guardrail valida membership
- [ ] RLS é a primeira linha de defesa (guardrail é defense-in-depth)

---

### **DIA 0.3: GUARDRAILS REFINADOS**

#### **1. Security Guardrail - Regex Compostos**

````typescript path=supabase/functions/ai-assistant/guardrails/input.ts mode=EXCERPT
// ✅ CORRETO - Padrões compostos para reduzir falsos positivos
export const securityGuardrail: InputGuardrail = {
  name: 'Security Check',
  execute: async ({ input, context }) => {
    // Padrões compostos (mais específicos)
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
````

#### **2. Date Validation - Normalização Unicode**

````typescript path=supabase/functions/ai-assistant/guardrails/input.ts mode=EXCERPT
// ✅ CORRETO - Suporta múltiplos formatos e normalização
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
````

#### **3. Financial Accuracy - Implementação Completa**

````typescript path=supabase/functions/ai-assistant/guardrails/output.ts mode=EXCERPT
// ✅ CORRETO - Validação real de valores financeiros
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
        
        if (actualValue !== null) {
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
````

#### **Checklist:**
- [ ] Security guardrail usa padrões compostos (menos falsos positivos)
- [ ] Date validation suporta múltiplos formatos (com/sem acento, abreviado)
- [ ] Date validation normaliza Unicode
- [ ] Financial Accuracy implementado completamente
- [ ] Financial Accuracy valida valores contra banco com tolerância
- [ ] Logs não contêm input completo (apenas preview)

---

### **DIA 0.4: LGPD E OBSERVABILIDADE**

#### **1. Sanitização de Logs (LGPD)**

````typescript path=supabase/functions/ai-assistant/utils/sanitize.ts mode=EXCERPT
// ✅ Funções de sanitização para logs
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
      if (['password', 'token', 'secret', 'apiKey'].includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLog(value);
      }
    }
    return sanitized;
  }
  
  return data;
}

// Exemplo de uso
console.log('AI Assistant request', sanitizeForLog({
  clientId,
  userId,
  questionPreview: question.slice(0, 100),
  timestamp: new Date().toISOString()
}));
````

#### **2. SSE com Reconexão (Event IDs)**

````typescript path=supabase/functions/ai-assistant/index.ts mode=EXCERPT
// ✅ CORRETO - SSE com event IDs para reconexão
serve(async (req) => {
  // ... autenticação ...

  // Verificar Last-Event-ID para reconexão
  const lastEventId = req.headers.get('Last-Event-ID');
  let eventCounter = lastEventId ? parseInt(lastEventId) + 1 : 0;

  const stream = await run(agent, question, {
    stream: true,
    context: { clientId, userId, supabase }
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        // Evento de início
        controller.enqueue(
          encoder.encode(`id: ${eventCounter++}\ndata: ${JSON.stringify({ type: 'start' })}\n\n`)
        );

        // Stream de texto com IDs
        for await (const chunk of stream.toTextStream()) {
          const data = `id: ${eventCounter++}\ndata: ${JSON.stringify({ 
            type: 'token', 
            text: chunk 
          })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        await stream.completed;

        // Evento de conclusão
        const finalOutput = stream.state.finalOutput;
        controller.enqueue(
          encoder.encode(`id: ${eventCounter++}\ndata: ${JSON.stringify({ 
            type: 'done',
            confidence: finalOutput?.confidence,
            sources: finalOutput?.sources
          })}\n\n`)
        );

        controller.close();
      } catch (error) {
        console.error("Streaming error", sanitizeForLog(error));
        
        controller.enqueue(
          encoder.encode(`id: ${eventCounter++}\ndata: ${JSON.stringify({ 
            type: 'error',
            error: error.message 
          })}\n\n`)
        );
        
        controller.close();
      }
    }
  });

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
});
````

````typescript path=src/hooks/use-ai-assistant-stream.ts mode=EXCERPT
// ✅ Frontend com reconexão automática
export function useAIAssistantStream() {
  const [lastEventId, setLastEventId] = useState<number>(0);

  const sendMessage = useCallback(async (clientId: string, question: string) => {
    // ... setup ...

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Last-Event-ID': lastEventId.toString() // ✅ Para reconexão
        },
        body: JSON.stringify({ clientId, question })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        let currentEventId: number | null = null;
        let currentData: string | null = null;

        for (const line of lines) {
          if (line.startsWith('id: ')) {
            currentEventId = parseInt(line.slice(4));
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6);
          } else if (line === '' && currentData) {
            // Evento completo
            try {
              const event: StreamEvent = JSON.parse(currentData);
              
              // Atualizar lastEventId
              if (currentEventId !== null) {
                setLastEventId(currentEventId);
              }

              // Processar evento...
              switch (event.type) {
                case 'token':
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + event.text }
                      : msg
                  ));
                  break;
                // ... outros casos
              }
            } catch (parseError) {
              console.error('Error parsing SSE data', parseError);
            }
            
            currentData = null;
          }
        }
      }
    } catch (err) {
      console.error('Streaming error', err);
      // TODO: Implementar retry com exponential backoff
    }
  }, [lastEventId]);

  return { messages, isStreaming, error, sendMessage, clearMessages };
}
````

#### **3. Métricas e Observabilidade**

````typescript path=supabase/functions/ai-assistant/utils/metrics.ts mode=EXCERPT
// ✅ Sistema de métricas simples
interface Metrics {
  requestId: string;
  userId: string;
  clientId: string;
  questionLength: number;
  responseLength: number;
  tokensUsed: number;
  costUSD: number;
  latencyMs: number;
  timeToFirstToken: number;
  toolCallsCount: number;
  guardrailTriggered: boolean;
  guardrailType?: string;
  error?: string;
  timestamp: string;
}

export class MetricsCollector {
  private startTime: number;
  private firstTokenTime: number | null = null;
  private metrics: Partial<Metrics> = {};

  constructor(requestId: string, userId: string, clientId: string) {
    this.startTime = Date.now();
    this.metrics = {
      requestId,
      userId,
      clientId,
      timestamp: new Date().toISOString()
    };
  }

  recordFirstToken() {
    if (!this.firstTokenTime) {
      this.firstTokenTime = Date.now();
      this.metrics.timeToFirstToken = this.firstTokenTime - this.startTime;
    }
  }

  recordToolCall() {
    this.metrics.toolCallsCount = (this.metrics.toolCallsCount || 0) + 1;
  }

  recordGuardrailTrigger(type: string) {
    this.metrics.guardrailTriggered = true;
    this.metrics.guardrailType = type;
  }

  async finalize(response: string, tokensUsed: number) {
    const endTime = Date.now();
    
    this.metrics.responseLength = response.length;
    this.metrics.tokensUsed = tokensUsed;
    this.metrics.latencyMs = endTime - this.startTime;
    
    // Custo estimado (GPT-4o: $2.50/1M input, $10/1M output)
    const inputCost = (tokensUsed * 0.5) * 2.50 / 1_000_000;
    const outputCost = (tokensUsed * 0.5) * 10 / 1_000_000;
    this.metrics.costUSD = inputCost + outputCost;

    // Persistir métricas (Supabase ou log estruturado)
    await this.persist();
  }

  private async persist() {
    // Opção 1: Tabela de métricas no Supabase
    // await supabase.from('ai_metrics').insert(this.metrics);
    
    // Opção 2: Log estruturado (Supabase Functions Logs)
    console.log('AI_METRICS', JSON.stringify(this.metrics));
  }

  getMetrics(): Partial<Metrics> {
    return { ...this.metrics };
  }
}

// Uso na Edge Function
const metrics = new MetricsCollector(requestId, userId, clientId);

for await (const chunk of stream.toTextStream()) {
  metrics.recordFirstToken();
  // ... enviar chunk
}

await metrics.finalize(fullResponse, tokensUsed);
````

````sql path=supabase/migrations/005_metrics_schema.sql mode=EXCERPT
-- Tabela de métricas (opcional - pode usar apenas logs)
CREATE TABLE public.ai_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    question_length INTEGER,
    response_length INTEGER,
    tokens_used INTEGER,
    cost_usd DECIMAL(10, 6),
    latency_ms INTEGER,
    time_to_first_token INTEGER,
    tool_calls_count INTEGER DEFAULT 0,
    guardrail_triggered BOOLEAN DEFAULT false,
    guardrail_type TEXT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para análise
CREATE INDEX idx_ai_metrics_user_id ON public.ai_metrics(user_id);
CREATE INDEX idx_ai_metrics_client_id ON public.ai_metrics(client_id);
CREATE INDEX idx_ai_metrics_created_at ON public.ai_metrics(created_at DESC);
CREATE INDEX idx_ai_metrics_cost ON public.ai_metrics(cost_usd DESC);

-- RLS
ALTER TABLE public.ai_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metrics"
    ON public.ai_metrics
    FOR SELECT
    USING (auth.uid() = user_id);
````

#### **4. Padronizar Lista de Tools**

````typescript path=supabase/functions/ai-assistant/tools/index.ts mode=EXCERPT
// ✅ Lista padronizada de tools (remover calculateTaxes por enquanto)
export const tools = [
  queryInvoicesTool,
  queryBankTransactionsTool,
  queryPayrollTool,
  queryFinancialSummaryTool
  // ❌ calculateTaxes - Implementar em Phase 4
];

// Atualizar agent
const agent = new Agent({
  name: 'Assistente Contábil ContabilPRO',
  model: 'gpt-4o',
  instructions: `...`,
  tools: tools, // ✅ Lista padronizada
  // ...
});
````

#### **Checklist:**
- [ ] Função `sanitizePII` implementada e testada
- [ ] Todos os logs usam `sanitizeForLog`
- [ ] SSE com event IDs implementado
- [ ] Frontend suporta reconexão com Last-Event-ID
- [ ] Sistema de métricas implementado
- [ ] Métricas incluem: tokens, custo, latência, TTFT, tool calls, guardrails
- [ ] Tabela `ai_metrics` criada (ou logs estruturados)
- [ ] Lista de tools padronizada (sem calculateTaxes)
- [ ] Documentação atualizada

---

### **DIA 0.5: PLANO B E INTERFACE ABSTRATA**

#### **Problema: OpenAI Agents SDK pode mudar**

````typescript path=supabase/functions/ai-assistant/adapters/agent-runner.ts mode=EXCERPT
// ✅ Interface abstrata para trocar backend
export interface IAgentRunner {
  run(
    question: string,
    context: AgentContext
  ): Promise<AgentResponse>;
  
  runStream(
    question: string,
    context: AgentContext
  ): AsyncIterable<string>;
}

export interface AgentContext {
  clientId: string;
  userId: string;
  supabase: SupabaseClient;
}

export interface AgentResponse {
  response: string;
  confidence: number;
  sources: Array<{
    type: string;
    id: string;
    relevance: number;
  }>;
}

// Implementação com OpenAI Agents SDK
export class OpenAIAgentsRunner implements IAgentRunner {
  private agent: Agent;

  constructor() {
    this.agent = new Agent({
      name: 'Assistente Contábil',
      model: 'gpt-4o',
      instructions: '...',
      tools: tools,
      inputGuardrails: inputGuardrails,
      outputGuardrails: outputGuardrails,
      outputType: AssistantResponseSchema
    });
  }

  async run(question: string, context: AgentContext): Promise<AgentResponse> {
    const result = await run(this.agent, question, { context });
    return result.finalOutput;
  }

  async *runStream(question: string, context: AgentContext): AsyncIterable<string> {
    const stream = await run(this.agent, question, {
      stream: true,
      context
    });

    for await (const chunk of stream.toTextStream()) {
      yield chunk;
    }
  }
}

// Plano B: Implementação com Responses API
export class OpenAIResponsesRunner implements IAgentRunner {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });
  }

  async run(question: string, context: AgentContext): Promise<AgentResponse> {
    // Implementar com chat.completions.create + tool_choice
    // ...
  }

  async *runStream(question: string, context: AgentContext): AsyncIterable<string> {
    // Implementar com stream: true
    // ...
  }
}

// Factory para trocar implementação
export function createAgentRunner(): IAgentRunner {
  const backend = Deno.env.get('AGENT_BACKEND') || 'openai-agents';
  
  switch (backend) {
    case 'openai-agents':
      return new OpenAIAgentsRunner();
    case 'openai-responses':
      return new OpenAIResponsesRunner();
    default:
      throw new Error(`Unknown agent backend: ${backend}`);
  }
}
````

#### **Checklist:**
- [ ] Interface `IAgentRunner` criada
- [ ] Implementação `OpenAIAgentsRunner` funcional
- [ ] (Opcional) Implementação `OpenAIResponsesRunner` como backup
- [ ] Factory `createAgentRunner` permite trocar backend via env var
- [ ] Edge Function usa factory (não instancia Agent diretamente)

---

## 📅 CRONOGRAMA ATUALIZADO

### **TOTAL: 9-11 dias**

#### **DIA 0: FUNDAÇÕES DE SEGURANÇA** (2 dias) ⚠️ CRÍTICO
- **Dia 0.1:** Autenticação JWT + RLS no Edge Function
- **Dia 0.2:** Multi-tenant com memberships
- **Dia 0.3:** Guardrails refinados + Financial Accuracy
- **Dia 0.4:** LGPD (sanitização) + SSE reconexão + Métricas
- **Dia 0.5:** Plano B (interface abstrata)

#### **FASE 1: FOLHA DE PAGAMENTO** (2-3 dias)
- **Dia 1:** Database + Backend (migration, Edge Function)
- **Dia 2:** Validação + Cálculos + Deploy
- **Dia 3:** Frontend (upload, hooks, UI)

#### **FASE 2: ASSISTENTE IA** (4-5 dias)
- **Dia 4:** Tools + Guardrails de Input
- **Dia 5:** Guardrails de Output + Structured Outputs
- **Dia 6:** Streaming Backend
- **Dia 7:** Frontend do Assistente
- **Dia 8:** Integração + Polish

#### **FASE 3: TESTES E DOCUMENTAÇÃO** (1 dia)
- **Dia 9:** Testes finais + Documentação

---

## ✅ CHECKLIST DE CONCLUSÃO ATUALIZADO

### **DIA 0: Fundações de Segurança** ⚠️
- [ ] **Autenticação:**
  - [ ] Frontend envia JWT via `session.access_token`
  - [ ] Edge Function cria client pass-through
  - [ ] Edge Function extrai `userId` do JWT (não do body)
  - [ ] Todas as queries usam client com RLS ativo
  - [ ] Service role key NUNCA usado para queries de usuário

- [ ] **Multi-tenant:**
  - [ ] Migration `003_memberships_schema.sql` aplicada
  - [ ] Tabela `memberships` criada com roles
  - [ ] RLS de `clients` atualizado para memberships
  - [ ] Trigger cria membership automático
  - [ ] Client Access Guardrail valida membership

- [ ] **Guardrails Refinados:**
  - [ ] Security guardrail usa padrões compostos
  - [ ] Date validation suporta múltiplos formatos
  - [ ] Financial Accuracy implementado completamente
  - [ ] Logs sanitizados (sem PII)

- [ ] **Observabilidade:**
  - [ ] SSE com event IDs implementado
  - [ ] Frontend suporta reconexão
  - [ ] Sistema de métricas implementado
  - [ ] Métricas incluem: tokens, custo, latência, TTFT
  - [ ] Lista de tools padronizada

- [ ] **Plano B:**
  - [ ] Interface `IAgentRunner` criada
  - [ ] Factory permite trocar backend

### **Folha de Pagamento**
- [ ] Migration aplicada e testada
- [ ] Edge Function `parse-payroll` funcionando
- [ ] Upload de CSV/Excel funcional
- [ ] Dados persistidos corretamente
- [ ] RLS validado
- [ ] Cálculos de encargos corretos

### **Assistente IA**
- [ ] Tools implementadas e testadas
- [ ] Agent configurado corretamente
- [ ] Edge Function funcionando
- [ ] Interface de chat funcional
- [ ] Respostas contextualizadas
- [ ] Segurança validada (RLS + guardrails)
- [ ] Streaming funcional
- [ ] Métricas coletadas

### **Geral**
- [ ] Todos os testes passando
- [ ] Linting sem erros
- [ ] Type checking sem erros
- [ ] Documentação atualizada
- [ ] Commit seguindo Conventional Commits

---

## 📊 MÉTRICAS DE SUCESSO

### **Segurança:**
- ✅ 0 vazamentos de dados entre clientes (RLS + guardrails)
- ✅ 0 PII em logs (sanitização)
- ✅ 100% de queries com RLS ativo

### **Performance:**
- ✅ Time to First Token (TTFT) < 2s (P95)
- ✅ Latência total < 10s (P95)
- ✅ Reconexão SSE < 1s

### **Custo:**
- ✅ Custo médio por pergunta < $0.10
- ✅ Tokens por pergunta < 5000 (input + output)

### **Qualidade:**
- ✅ Confidence média > 0.7
- ✅ Taxa de guardrail trigger < 5%
- ✅ Taxa de erro < 1%

---

## 🎉 RESULTADO ESPERADO

Ao final da Phase 3 (com Dia 0), teremos:

✅ **Sistema 100% seguro e LGPD-compliant**
✅ **Autenticação JWT correta com RLS ativo**
✅ **Multi-tenant robusto com memberships**
✅ **Guardrails refinados (menos falsos positivos)**
✅ **Observabilidade completa (métricas + logs)**
✅ **Sistema de folha de pagamento funcional**
✅ **Assistente IA conversacional com RAG**
✅ **Streaming em tempo real com reconexão**
✅ **Respostas confiáveis e tipadas**

**ContabilPRO estará pronto para produção com segurança enterprise! 🚀🔒**

---

**Aprovado para começar pelo DIA 0?** 💪
