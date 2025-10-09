// ============================================================================
// SISTEMA DE MÉTRICAS E OBSERVABILIDADE
// ============================================================================

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

/**
 * Coletor de métricas para requisições do assistente IA
 */
export class MetricsCollector {
  private startTime: number;
  private firstTokenTime: number | null = null;
  private metrics: Partial<Metrics> = {};

  constructor(requestId: string, userId: string, clientId: string, questionLength: number) {
    this.startTime = Date.now();
    this.metrics = {
      requestId,
      userId,
      clientId,
      questionLength,
      timestamp: new Date().toISOString(),
      toolCallsCount: 0,
      guardrailTriggered: false
    };
  }

  /**
   * Registra o primeiro token recebido (para calcular TTFT)
   */
  recordFirstToken() {
    if (!this.firstTokenTime) {
      this.firstTokenTime = Date.now();
      this.metrics.timeToFirstToken = this.firstTokenTime - this.startTime;
    }
  }

  /**
   * Registra uma chamada de tool
   */
  recordToolCall() {
    this.metrics.toolCallsCount = (this.metrics.toolCallsCount || 0) + 1;
  }

  /**
   * Registra que um guardrail foi acionado
   */
  recordGuardrailTrigger(type: string) {
    this.metrics.guardrailTriggered = true;
    this.metrics.guardrailType = type;
  }

  /**
   * Registra um erro
   */
  recordError(error: string) {
    this.metrics.error = error;
  }

  /**
   * Finaliza a coleta de métricas
   */
  async finalize(response: string, tokensUsed: number) {
    const endTime = Date.now();
    
    this.metrics.responseLength = response.length;
    this.metrics.tokensUsed = tokensUsed;
    this.metrics.latencyMs = endTime - this.startTime;
    
    // Custo estimado (GPT-4o: $2.50/1M input, $10/1M output)
    // Assumindo 50/50 split entre input e output
    const inputCost = (tokensUsed * 0.5) * 2.50 / 1_000_000;
    const outputCost = (tokensUsed * 0.5) * 10 / 1_000_000;
    this.metrics.costUSD = inputCost + outputCost;

    // Persistir métricas
    await this.persist();
  }

  /**
   * Persiste as métricas (log estruturado)
   */
  private async persist() {
    // Opção 1: Log estruturado (Supabase Functions Logs)
    // Pode ser consultado via Supabase Dashboard ou CLI
    console.log('AI_METRICS', JSON.stringify(this.metrics));
    
    // Opção 2: Persistir em tabela (descomentar se necessário)
    // const supabase = createClient(
    //   Deno.env.get('SUPABASE_URL')!,
    //   Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    // );
    // 
    // await supabase.from('ai_metrics').insert(this.metrics);
  }

  /**
   * Retorna as métricas coletadas
   */
  getMetrics(): Partial<Metrics> {
    return { ...this.metrics };
  }

  /**
   * Retorna um resumo das métricas para o cliente
   */
  getSummary() {
    return {
      latencyMs: this.metrics.latencyMs,
      timeToFirstToken: this.metrics.timeToFirstToken,
      tokensUsed: this.metrics.tokensUsed,
      costUSD: this.metrics.costUSD,
      toolCallsCount: this.metrics.toolCallsCount
    };
  }
}

/**
 * Exemplo de uso:
 * 
 * const metrics = new MetricsCollector(requestId, userId, clientId, question.length);
 * 
 * // Durante streaming
 * for await (const chunk of stream.toTextStream()) {
 *   metrics.recordFirstToken();
 *   // ... enviar chunk
 * }
 * 
 * // Ao finalizar
 * await metrics.finalize(fullResponse, tokensUsed);
 * 
 * // Retornar resumo ao cliente
 * return { ...response, metrics: metrics.getSummary() };
 */

