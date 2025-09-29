-- Migration: Adicionar active_clients ao dashboard_summary_v1
-- Descrição: Adiciona contagem de clientes ativos (com movimentação no período)
-- Data: 2025-10-01

-- Drop da função existente
drop function if exists public.dashboard_summary_v1(uuid, integer);

-- Recria a função com active_clients
create or replace function public.dashboard_summary_v1(
  p_tenant_id uuid,
  p_range_days integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_start_current date;
  v_end_current date;
  v_start_previous date;
  v_end_previous date;
begin
  -- Validação de entrada
  if p_tenant_id is null then
    return jsonb_build_object(
      'status', 'error',
      'message', 'tenant_id é obrigatório'
    );
  end if;

  if p_range_days <= 0 or p_range_days > 365 then
    return jsonb_build_object(
      'status', 'error',
      'message', 'range_days deve estar entre 1 e 365'
    );
  end if;

  -- Calcular períodos
  v_end_current := current_date;
  v_start_current := v_end_current - (p_range_days || ' days')::interval;
  v_end_previous := v_start_current - interval '1 day';
  v_start_previous := v_end_previous - (p_range_days || ' days')::interval;

  -- Construir resultado
  select jsonb_build_object(
    'status', 'success',
    'payload', jsonb_build_object(
      'revenue', jsonb_build_object(
        'current', coalesce((
          select sum(amount)
          from entries e
          where e.tenant_id = p_tenant_id
            and e.entry_type = 'credit'
            and e.entry_date::date between v_start_current and v_end_current
        ), 0),
        'previous', coalesce((
          select sum(amount)
          from entries e
          where e.tenant_id = p_tenant_id
            and e.entry_type = 'credit'
            and e.entry_date::date between v_start_previous and v_end_previous
        ), 0)
      ),
      'expense', jsonb_build_object(
        'current', coalesce((
          select sum(amount)
          from entries e
          where e.tenant_id = p_tenant_id
            and e.entry_type = 'debit'
            and e.entry_date::date between v_start_current and v_end_current
        ), 0),
        'previous', coalesce((
          select sum(amount)
          from entries e
          where e.tenant_id = p_tenant_id
            and e.entry_type = 'debit'
            and e.entry_date::date between v_start_previous and v_end_previous
        ), 0)
      ),
      'active_clients', jsonb_build_object(
        'current', coalesce((
          select count(distinct e.client_id)
          from entries e
          where e.tenant_id = p_tenant_id
            and e.client_id is not null
            and e.entry_date::date between v_start_current and v_end_current
        ), 0),
        'previous', coalesce((
          select count(distinct e.client_id)
          from entries e
          where e.tenant_id = p_tenant_id
            and e.client_id is not null
            and e.entry_date::date between v_start_previous and v_end_previous
        ), 0)
      ),
      'new_clients', jsonb_build_object(
        'current', coalesce((
          select count(*)
          from clients c
          where c.tenant_id = p_tenant_id
            and c.created_at::date between v_start_current and v_end_current
        ), 0),
        'previous', coalesce((
          select count(*)
          from clients c
          where c.tenant_id = p_tenant_id
            and c.created_at::date between v_start_previous and v_end_previous
        ), 0)
      ),
      'bank_transactions', jsonb_build_object(
        'current', coalesce((
          select count(*)
          from bank_transactions bt
          where bt.tenant_id = p_tenant_id
            and bt.transaction_date::date between v_start_current and v_end_current
        ), 0),
        'previous', coalesce((
          select count(*)
          from bank_transactions bt
          where bt.tenant_id = p_tenant_id
            and bt.transaction_date::date between v_start_previous and v_end_previous
        ), 0)
      ),
      'ai_insights', jsonb_build_object(
        'current', coalesce((
          select count(*)
          from ai_insights ai
          where ai.tenant_id = p_tenant_id
            and ai.created_at::date between v_start_current and v_end_current
        ), 0),
        'previous', coalesce((
          select count(*)
          from ai_insights ai
          where ai.tenant_id = p_tenant_id
            and ai.created_at::date between v_start_previous and v_end_previous
        ), 0)
      )
    )
  ) into v_result;

  return v_result;
end;
$$;

-- Comentário da função
comment on function public.dashboard_summary_v1(uuid, integer) is 
  'Retorna métricas consolidadas do dashboard incluindo receita, despesa, clientes ativos, novos clientes, transações bancárias e insights de IA';

-- Grant de execução
grant execute on function public.dashboard_summary_v1(uuid, integer) to authenticated;

