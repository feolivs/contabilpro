-- Funcoes auxiliares para o dashboard

create or replace function public.dashboard_summary(range_days integer default 30)
returns table (
  revenue_current numeric,
  revenue_previous numeric,
  expense_current numeric,
  expense_previous numeric,
  new_clients_current integer,
  new_clients_previous integer,
  bank_transactions_current integer,
  bank_transactions_previous integer,
  ai_insights_current integer,
  ai_insights_previous integer
)
security definer
set search_path = public
language plpgsql
as 
declare
  tenant_id uuid := nullif(current_setting('request.jwt.claim.tenant_id', true), '')::uuid;
  days integer := greatest(range_days, 1);
  start_current date := current_date - (days - 1);
  start_previous date := current_date - (days * 2 - 1);
  end_previous date := start_current - 1;
begin
  if tenant_id is null then
    raise exception 'Tenant context not found';
  end if;

  return query
  select
    coalesce((
      select sum(e.amount)
      from entries e
      join accounts a on a.id = e.account_id
      where e.tenant_id = tenant_id
        and a.type = 'revenue'
        and e.date >= start_current
    ), 0)::numeric as revenue_current,
    coalesce((
      select sum(e.amount)
      from entries e
      join accounts a on a.id = e.account_id
      where e.tenant_id = tenant_id
        and a.type = 'revenue'
        and e.date between start_previous and end_previous
    ), 0)::numeric as revenue_previous,
    coalesce((
      select sum(e.amount)
      from entries e
      join accounts a on a.id = e.account_id
      where e.tenant_id = tenant_id
        and a.type = 'expense'
        and e.date >= start_current
    ), 0)::numeric as expense_current,
    coalesce((
      select sum(e.amount)
      from entries e
      join accounts a on a.id = e.account_id
      where e.tenant_id = tenant_id
        and a.type = 'expense'
        and e.date between start_previous and end_previous
    ), 0)::numeric as expense_previous,
    coalesce((
      select count(*)
      from clients c
      where c.tenant_id = tenant_id
        and c.created_at::date >= start_current
    ), 0)::integer as new_clients_current,
    coalesce((
      select count(*)
      from clients c
      where c.tenant_id = tenant_id
        and c.created_at::date between start_previous and end_previous
    ), 0)::integer as new_clients_previous,
    coalesce((
      select count(*)
      from bank_transactions bt
      where bt.tenant_id = tenant_id
        and bt.created_at::date >= start_current
    ), 0)::integer as bank_transactions_current,
    coalesce((
      select count(*)
      from bank_transactions bt
      where bt.tenant_id = tenant_id
        and bt.created_at::date between start_previous and end_previous
    ), 0)::integer as bank_transactions_previous,
    coalesce((
      select count(*)
      from ai_insights ai
      where ai.tenant_id = tenant_id
        and ai.created_at::date >= start_current
    ), 0)::integer as ai_insights_current,
    coalesce((
      select count(*)
      from ai_insights ai
      where ai.tenant_id = tenant_id
        and ai.created_at::date between start_previous and end_previous
    ), 0)::integer as ai_insights_previous;
end;
;

create or replace function public.dashboard_trend(range_days integer default 90)
returns table (
  bucket date,
  revenue numeric,
  expense numeric
)
security definer
set search_path = public
language plpgsql
as 
declare
  tenant_id uuid := nullif(current_setting('request.jwt.claim.tenant_id', true), '')::uuid;
  days integer := greatest(range_days, 1);
begin
  if tenant_id is null then
    raise exception 'Tenant context not found';
  end if;

  return query
  with series as (
    select generate_series(current_date - (days - 1), current_date, interval '1 day')::date as bucket
  ),
  data as (
    select
      e.date as bucket,
      sum(case when a.type = 'revenue' then e.amount else 0 end) as revenue,
      sum(case when a.type = 'expense' then e.amount else 0 end) as expense
    from entries e
    join accounts a on a.id = e.account_id
    where e.tenant_id = tenant_id
      and e.date >= current_date - (days - 1)
    group by e.date
  )
  select
    s.bucket,
    coalesce(d.revenue, 0)::numeric as revenue,
    coalesce(d.expense, 0)::numeric as expense
  from series s
  left join data d on d.bucket = s.bucket
  order by s.bucket;
end;
;

create or replace function public.dashboard_recent_activity(limit_count integer default 10)
returns table (
  source text,
  title text,
  description text,
  created_at timestamptz,
  reference text
)
security definer
set search_path = public
language plpgsql
as 
declare
  tenant_id uuid := nullif(current_setting('request.jwt.claim.tenant_id', true), '')::uuid;
  limit_value integer := greatest(limit_count, 1);
begin
  if tenant_id is null then
    raise exception 'Tenant context not found';
  end if;

  return query
  select source, title, description, created_at, reference
  from (
    select
      'entry'::text as source,
      e.description as title,
      format('Lancamento %s de %s', e.type, to_char(e.amount, 'FM999G999D00')) as description,
      e.created_at,
      e.id::text as reference
    from entries e
    where e.tenant_id = tenant_id

    union all

    select
      'bank_transaction'::text,
      bt.description,
      format('Transacao %s de %s', bt.type, to_char(bt.amount, 'FM999G999D00')),
      bt.created_at,
      bt.id::text
    from bank_transactions bt
    where bt.tenant_id = tenant_id

    union all

    select
      'document'::text,
      d.name,
      coalesce(d.type, 'Documento') || ' enviado',
      d.created_at,
      d.id::text
    from documents d
    where d.tenant_id = tenant_id

    union all

    select
      'task'::text,
      t.title,
      'Tarefa ' || coalesce(t.status, 'pending'),
      t.created_at,
      t.id::text
    from tasks t
    where t.tenant_id = tenant_id

    union all

    select
      'ai_insight'::text,
      ai.type,
      'Insight ' || coalesce(ai.status, 'pending'),
      ai.created_at,
      ai.id::text
    from ai_insights ai
    where ai.tenant_id = tenant_id
  ) events
  order by created_at desc
  limit limit_value;
end;
;

grant execute on function public.dashboard_summary(integer) to anon, authenticated, service_role;
grant execute on function public.dashboard_trend(integer) to anon, authenticated, service_role;
grant execute on function public.dashboard_recent_activity(integer) to anon, authenticated, service_role;
