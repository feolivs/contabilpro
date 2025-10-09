import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Agent } from '@openai/agents';
import { createAgentRunner } from './adapters/agent-runner.ts';
import {
  securityGuardrail,
  dateValidationGuardrail,
  clientAccessGuardrail
} from './guardrails/input.ts';
import {
  dataLeakGuardrail,
  financialAccuracyGuardrail,
  responseQualityGuardrail,
  AssistantResponseSchema
} from './guardrails/output.ts';
import { sanitizeForLog, createSafePreview } from './utils/sanitize.ts';
import { MetricsCollector } from './utils/metrics.ts';
import { tools } from './tools/index.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, last-event-id",
};

interface AssistantPayload {
  clientId: string;
  question: string;
  context?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST requests are supported." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ✅ CRÍTICO: Extrair Authorization header da requisição
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing Authorization header' }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  // ✅ CRÍTICO: Criar client pass-through (RLS será aplicado com JWT do usuário)
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

  // ✅ CRÍTICO: Extrair userId do JWT (não confiar no body)
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('Authentication failed', authError);
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const userId = user.id; // ✅ userId autenticado e verificado

  // Parse payload
  let payload: AssistantPayload;

  try {
    payload = await req.json();
  } catch (error) {
    console.error("Invalid JSON payload", error);
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload." }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ✅ Validar apenas clientId e question (userId vem do JWT)
  if (!payload.clientId || !payload.question) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields: clientId, question.",
      }),
      {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ✅ Gerar requestId único
  const requestId = crypto.randomUUID();

  // ✅ Iniciar coleta de métricas
  const metrics = new MetricsCollector(
    requestId,
    userId,
    payload.clientId,
    payload.question.length
  );

  // ✅ Log sanitizado
  console.log(
    "AI Assistant request",
    sanitizeForLog({
      requestId,
      clientId: payload.clientId,
      userId: userId,
      questionPreview: createSafePreview(payload.question),
      timestamp: new Date().toISOString()
    }),
  );

  // ✅ Verificar Last-Event-ID para reconexão
  const lastEventId = req.headers.get('Last-Event-ID');
  let eventCounter = lastEventId ? parseInt(lastEventId) + 1 : 0;

  try {
    // ============================================================================
    // CONFIGURAR AGENT COM GUARDRAILS
    // ============================================================================

    const agent = new Agent({
      name: 'Assistente Contábil ContabilPRO',
      model: 'gpt-4o',
      instructions: `
        Você é um assistente contábil brasileiro especializado.

        CONTEXTO:
        - Você trabalha com dados de empresas brasileiras
        - Sempre use terminologia contábil brasileira (DRE, Balanço Patrimonial, etc.)
        - Formate valores em Real (R$) com separador de milhares
        - Cite sempre as fontes dos dados (tipo de documento e período)

        FERRAMENTAS DISPONÍVEIS:
        - queryInvoices: buscar notas fiscais (NF-e, NFSe)
        - queryBankTransactions: buscar transações bancárias (OFX)
        - queryPayroll: buscar dados de folha de pagamento
        - queryFinancialSummary: obter resumos financeiros

        IMPORTANTE:
        - Sempre filtre por client_id para segurança
        - Seja preciso com valores e datas
        - Se não tiver certeza, diga que não sabe
        - Explique cálculos complexos passo a passo
      `,
      tools: tools, // ✅ Tools RAG implementadas
      inputGuardrails: [
        securityGuardrail,
        dateValidationGuardrail,
        clientAccessGuardrail
      ],
      outputGuardrails: [
        dataLeakGuardrail,
        financialAccuracyGuardrail,
        responseQualityGuardrail
      ],
      outputType: AssistantResponseSchema
    });

    // ============================================================================
    // EXECUTAR AGENT COM STREAMING
    // ============================================================================

    const runner = createAgentRunner(agent);
    const context = {
      clientId: payload.clientId,
      userId: userId,
      supabase: supabase
    };

    // ✅ Criar ReadableStream para SSE com event IDs
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Evento de início
          controller.enqueue(
            encoder.encode(`id: ${eventCounter++}\ndata: ${JSON.stringify({ type: 'start' })}\n\n`)
          );

          let fullResponse = '';

          // Stream de texto com IDs
          for await (const chunk of runner.runStream(payload.question, context)) {
            metrics.recordFirstToken();
            fullResponse += chunk;

            const data = `id: ${eventCounter++}\ndata: ${JSON.stringify({
              type: 'token',
              text: chunk
            })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          // Obter output final
          const finalOutput = runner.getCompletedOutput();

          if (!finalOutput) {
            throw new Error('No final output from agent');
          }

          // Finalizar métricas (estimativa de tokens)
          const estimatedTokens = Math.ceil((payload.question.length + fullResponse.length) / 4);
          await metrics.finalize(fullResponse, estimatedTokens);

          // Evento de conclusão com metadados
          controller.enqueue(
            encoder.encode(`id: ${eventCounter++}\ndata: ${JSON.stringify({
              type: 'done',
              confidence: finalOutput.confidence,
              sources: finalOutput.sources,
              metrics: metrics.getSummary()
            })}\n\n`)
          );

          controller.close();

        } catch (error) {
          console.error("Streaming error", sanitizeForLog(error));
          metrics.recordError(error.message);

          // Enviar erro via SSE
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
        'X-Accel-Buffering': 'no' // Disable nginx buffering
      }
    });

  } catch (error) {
    console.error("AI Assistant error", sanitizeForLog(error));
    metrics.recordError(error.message);

    return new Response(
      JSON.stringify({
        error: error.message,
        type: error.constructor.name,
        requestId: requestId
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
