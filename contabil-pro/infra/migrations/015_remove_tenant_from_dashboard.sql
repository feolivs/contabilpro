-- ============================================
-- MIGRATION 015: Remover dependência de tenant_id das funções de dashboard
-- ============================================
-- Remove multi-tenancy das funções RPC do dashboard

-- Drop das funções antigas
DROP FUNCTION IF EXISTS public.dashboard_summary_v1(uuid, integer);
DROP FUNCTION IF EXISTS public.dashboard_trend(uuid, integer);
DROP FUNCTION IF EXISTS public.dashboard_recent_activity(uuid, integer);

-- Recria dashboard_summary_v1 SEM tenant_id
CREATE OR REPLACE FUNCTION public.dashboard_summary_v1(
  p_range_days integer DEFAULT 30
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
  v_days integer := greatest(p_range_days, 1);
  v_start_current date := current_date - (v_days - 1);
  v_end_current date := current_date;
  v_start_previous date := v_start_current - v_days;
  v_end_previous date := v_end_current - v_days;
BEGIN
  -- Construir resultado
  SELECT jsonb_build_object(
    'status', 'success',
    'payload', jsonb_build_object(
      'revenue', jsonb_build_object(
        'current', COALESCE((
          SELECT sum(amount)
          FROM entries e
          WHERE e.entry_type = 'credit'
            AND e.entry_date::date BETWEEN v_start_current AND v_end_current
        ), 0),
        'previous', COALESCE((
          SELECT sum(amount)
          FROM entries e
          WHERE e.entry_type = 'credit'
            AND e.entry_date::date BETWEEN v_start_previous AND v_end_previous
        ), 0)
      ),
      'expense', jsonb_build_object(
        'current', COALESCE((
          SELECT sum(amount)
          FROM entries e
          WHERE e.entry_type = 'debit'
            AND e.entry_date::date BETWEEN v_start_current AND v_end_current
        ), 0),
        'previous', COALESCE((
          SELECT sum(amount)
          FROM entries e
          WHERE e.entry_type = 'debit'
            AND e.entry_date::date BETWEEN v_start_previous AND v_end_previous
        ), 0)
      ),
      'active_clients', jsonb_build_object(
        'current', COALESCE((
          SELECT count(DISTINCT c.id)
          FROM clients c
          INNER JOIN entries e ON e.client_id = c.id
          WHERE e.entry_date::date BETWEEN v_start_current AND v_end_current
        ), 0),
        'previous', COALESCE((
          SELECT count(DISTINCT c.id)
          FROM clients c
          INNER JOIN entries e ON e.client_id = c.id
          WHERE e.entry_date::date BETWEEN v_start_previous AND v_end_previous
        ), 0)
      ),
      'new_clients', jsonb_build_object(
        'current', COALESCE((
          SELECT count(*)
          FROM clients c
          WHERE c.created_at::date BETWEEN v_start_current AND v_end_current
        ), 0),
        'previous', COALESCE((
          SELECT count(*)
          FROM clients c
          WHERE c.created_at::date BETWEEN v_start_previous AND v_end_previous
        ), 0)
      ),
      'bank_transactions', jsonb_build_object(
        'current', COALESCE((
          SELECT count(*)
          FROM bank_transactions bt
          WHERE bt.transaction_date::date BETWEEN v_start_current AND v_end_current
        ), 0),
        'previous', COALESCE((
          SELECT count(*)
          FROM bank_transactions bt
          WHERE bt.transaction_date::date BETWEEN v_start_previous AND v_end_previous
        ), 0)
      ),
      'ai_insights', jsonb_build_object(
        'current', COALESCE((
          SELECT count(*)
          FROM ai_insights ai
          WHERE ai.created_at::date BETWEEN v_start_current AND v_end_current
        ), 0),
        'previous', COALESCE((
          SELECT count(*)
          FROM ai_insights ai
          WHERE ai.created_at::date BETWEEN v_start_previous AND v_end_previous
        ), 0)
      )
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Recria dashboard_trend SEM tenant_id
CREATE OR REPLACE FUNCTION public.dashboard_trend(
  range_days integer DEFAULT 90
)
RETURNS TABLE (
  bucket date,
  revenue numeric,
  expense numeric
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  days integer := greatest(range_days, 1);
BEGIN
  RETURN QUERY
  WITH series AS (
    SELECT generate_series(current_date - (days - 1), current_date, interval '1 day')::date AS bucket
  ),
  data AS (
    SELECT
      e.entry_date::date AS bucket,
      sum(CASE WHEN e.entry_type = 'credit' THEN e.amount ELSE 0 END) AS revenue,
      sum(CASE WHEN e.entry_type = 'debit' THEN e.amount ELSE 0 END) AS expense
    FROM entries e
    WHERE e.entry_date::date >= current_date - (days - 1)
    GROUP BY e.entry_date::date
  )
  SELECT
    s.bucket,
    COALESCE(d.revenue, 0)::numeric AS revenue,
    COALESCE(d.expense, 0)::numeric AS expense
  FROM series s
  LEFT JOIN data d ON d.bucket = s.bucket
  ORDER BY s.bucket;
END;
$$;

-- Recria dashboard_recent_activity SEM tenant_id
CREATE OR REPLACE FUNCTION public.dashboard_recent_activity(
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  source text,
  title text,
  description text,
  created_at timestamptz,
  reference text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  limit_value integer := greatest(limit_count, 1);
BEGIN
  RETURN QUERY
  SELECT * FROM (
    SELECT
      'entry'::text,
      COALESCE(c.name, 'Sem cliente'),
      'Lançamento de ' || e.entry_type,
      e.created_at,
      e.id::text
    FROM entries e
    LEFT JOIN clients c ON c.id = e.client_id

    UNION ALL

    SELECT
      'client'::text,
      c.name,
      'Cliente ' || COALESCE(c.status, 'ativo'),
      c.created_at,
      c.id::text
    FROM clients c

    UNION ALL

    SELECT
      'document'::text,
      d.name,
      'Documento ' || COALESCE(d.type, 'other'),
      d.created_at,
      d.id::text
    FROM documents d

    UNION ALL

    SELECT
      'bank_transaction'::text,
      bt.description,
      'Transação bancária',
      bt.created_at,
      bt.id::text
    FROM bank_transactions bt

    UNION ALL

    SELECT
      'task'::text,
      t.title,
      'Tarefa ' || COALESCE(t.status, 'pending'),
      t.created_at,
      t.id::text
    FROM tasks t

    UNION ALL

    SELECT
      'ai_insight'::text,
      ai.type,
      'Insight ' || COALESCE(ai.status, 'pending'),
      ai.created_at,
      ai.id::text
    FROM ai_insights ai
  ) events
  ORDER BY created_at DESC
  LIMIT limit_value;
END;
$$;

-- Comentários das funções
COMMENT ON FUNCTION public.dashboard_summary_v1(integer) IS 
  'Retorna métricas consolidadas do dashboard sem dependência de tenant';

COMMENT ON FUNCTION public.dashboard_trend(integer) IS 
  'Retorna tendência de receita e despesa ao longo do tempo sem dependência de tenant';

COMMENT ON FUNCTION public.dashboard_recent_activity(integer) IS 
  'Retorna atividades recentes do sistema sem dependência de tenant';

-- Grant de execução
GRANT EXECUTE ON FUNCTION public.dashboard_summary_v1(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_trend(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_recent_activity(integer) TO authenticated;

