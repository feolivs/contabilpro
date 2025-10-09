-- ContabilPRO AI Metrics Schema
-- Phase 3: Observability and Monitoring
-- OPCIONAL: Esta tabela pode ser usada para persistir métricas
-- Alternativa: usar apenas logs estruturados (console.log)

-- ============================================================================
-- AI METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
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

-- Comentários para documentação
COMMENT ON TABLE public.ai_metrics IS 'Stores metrics and observability data for AI assistant requests';
COMMENT ON COLUMN public.ai_metrics.request_id IS 'Unique identifier for the request';
COMMENT ON COLUMN public.ai_metrics.tokens_used IS 'Total tokens used (input + output)';
COMMENT ON COLUMN public.ai_metrics.cost_usd IS 'Estimated cost in USD';
COMMENT ON COLUMN public.ai_metrics.latency_ms IS 'Total latency in milliseconds';
COMMENT ON COLUMN public.ai_metrics.time_to_first_token IS 'Time to first token (TTFT) in milliseconds';
COMMENT ON COLUMN public.ai_metrics.tool_calls_count IS 'Number of tool calls made during the request';
COMMENT ON COLUMN public.ai_metrics.guardrail_triggered IS 'Whether any guardrail was triggered';
COMMENT ON COLUMN public.ai_metrics.guardrail_type IS 'Type of guardrail that was triggered (if any)';

-- ============================================================================
-- ÍNDICES PARA ANÁLISE
-- ============================================================================

CREATE INDEX idx_ai_metrics_user_id ON public.ai_metrics(user_id);
CREATE INDEX idx_ai_metrics_client_id ON public.ai_metrics(client_id);
CREATE INDEX idx_ai_metrics_created_at ON public.ai_metrics(created_at DESC);
CREATE INDEX idx_ai_metrics_cost ON public.ai_metrics(cost_usd DESC);
CREATE INDEX idx_ai_metrics_latency ON public.ai_metrics(latency_ms DESC);
CREATE INDEX idx_ai_metrics_guardrail ON public.ai_metrics(guardrail_triggered) WHERE guardrail_triggered = true;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.ai_metrics ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias métricas
CREATE POLICY "Users can view their own metrics"
    ON public.ai_metrics
    FOR SELECT
    USING (auth.uid() = user_id);

-- Apenas sistema pode inserir métricas (via Edge Functions)
CREATE POLICY "System can insert metrics"
    ON public.ai_metrics
    FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- VIEWS PARA ANÁLISE
-- ============================================================================

-- View: Métricas agregadas por usuário
CREATE OR REPLACE VIEW public.ai_metrics_by_user AS
SELECT 
    user_id,
    COUNT(*) as total_requests,
    SUM(tokens_used) as total_tokens,
    SUM(cost_usd) as total_cost_usd,
    AVG(latency_ms) as avg_latency_ms,
    AVG(time_to_first_token) as avg_ttft_ms,
    SUM(tool_calls_count) as total_tool_calls,
    SUM(CASE WHEN guardrail_triggered THEN 1 ELSE 0 END) as guardrail_triggers,
    SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as error_count
FROM public.ai_metrics
GROUP BY user_id;

COMMENT ON VIEW public.ai_metrics_by_user IS 'Aggregated AI metrics by user';

-- View: Métricas agregadas por cliente
CREATE OR REPLACE VIEW public.ai_metrics_by_client AS
SELECT 
    client_id,
    COUNT(*) as total_requests,
    SUM(tokens_used) as total_tokens,
    SUM(cost_usd) as total_cost_usd,
    AVG(latency_ms) as avg_latency_ms,
    AVG(time_to_first_token) as avg_ttft_ms,
    SUM(tool_calls_count) as total_tool_calls,
    SUM(CASE WHEN guardrail_triggered THEN 1 ELSE 0 END) as guardrail_triggers,
    SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as error_count
FROM public.ai_metrics
GROUP BY client_id;

COMMENT ON VIEW public.ai_metrics_by_client IS 'Aggregated AI metrics by client';

-- View: Métricas diárias
CREATE OR REPLACE VIEW public.ai_metrics_daily AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    SUM(tokens_used) as total_tokens,
    SUM(cost_usd) as total_cost_usd,
    AVG(latency_ms) as avg_latency_ms,
    AVG(time_to_first_token) as avg_ttft_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY time_to_first_token) as p95_ttft_ms,
    SUM(CASE WHEN guardrail_triggered THEN 1 ELSE 0 END) as guardrail_triggers,
    SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as error_count
FROM public.ai_metrics
GROUP BY DATE(created_at)
ORDER BY date DESC;

COMMENT ON VIEW public.ai_metrics_daily IS 'Daily aggregated AI metrics with percentiles';

-- ============================================================================
-- FUNÇÃO PARA LIMPEZA DE MÉTRICAS ANTIGAS
-- ============================================================================

-- Função para deletar métricas com mais de 90 dias
CREATE OR REPLACE FUNCTION public.cleanup_old_metrics()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.ai_metrics
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_old_metrics() IS 'Deletes AI metrics older than 90 days (LGPD compliance)';

-- ============================================================================
-- NOTA DE USO
-- ============================================================================

-- Esta tabela é OPCIONAL. Você pode escolher entre:
-- 
-- 1. Usar esta tabela para persistir métricas (mais fácil de consultar)
--    - Descomentar código em utils/metrics.ts
--    - Aplicar esta migration
-- 
-- 2. Usar apenas logs estruturados (mais simples)
--    - Não aplicar esta migration
--    - Consultar logs via Supabase Dashboard ou CLI
--    - Exemplo: supabase functions logs ai-assistant --filter "AI_METRICS"
-- 
-- Recomendação: Começar com logs estruturados e migrar para tabela se necessário.

