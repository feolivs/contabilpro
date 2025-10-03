-- Migration 028: Seed de obrigações fiscais para teste
-- Data: 03/10/2025
-- Objetivo: Criar obrigações fiscais de exemplo para o mês atual e próximos meses

-- Função para criar obrigações fiscais de exemplo
CREATE OR REPLACE FUNCTION seed_tax_obligations()
RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Pegar o primeiro usuário (para ambiente de desenvolvimento)
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Nenhum usuário encontrado. Seed não executado.';
    RETURN;
  END IF;

  -- Limpar obrigações existentes (apenas para desenvolvimento)
  DELETE FROM tax_obligations WHERE user_id = v_user_id;

  WITH base AS (
    SELECT DATE_TRUNC('month', CURRENT_DATE) AS month_start
  )
  -- DAS - Simples Nacional (vence dia 20 de cada mês)
  INSERT INTO tax_obligations (user_id, type, period_month, period_year, due_date, amount, status, regime_tributario, recurrence)
  SELECT
    v_user_id,
    data.type,
    EXTRACT(MONTH FROM data.due_date)::INT,
    EXTRACT(YEAR FROM data.due_date)::INT,
    data.due_date,
    data.amount,
    data.status,
    data.regime,
    data.recurrence
  FROM base
  CROSS JOIN LATERAL (
    SELECT
      entry.type,
      (base.month_start + (entry.offset_months || ' months')::interval + (entry.due_day - 1) * INTERVAL '1 day')::date AS due_date,
      entry.amount,
      entry.status,
      entry.regime,
      entry.recurrence
    FROM (
      VALUES
        ('das', 0, 20, 1250.00, 'pending', 'simples_nacional', 'monthly'),
        ('das', 1, 20, 1300.00, 'pending', 'simples_nacional', 'monthly'),
        ('das', 2, 20, 1280.00, 'pending', 'simples_nacional', 'monthly')
    ) AS entry(type, offset_months, due_day, amount, status, regime, recurrence)
  ) AS data;

  -- DCTFWeb (vence dia 15 de cada mês)
  WITH base AS (
    SELECT DATE_TRUNC('month', CURRENT_DATE) AS month_start
  )
  INSERT INTO tax_obligations (user_id, type, period_month, period_year, due_date, status, regime_tributario, recurrence)
  SELECT
    v_user_id,
    data.type,
    EXTRACT(MONTH FROM data.due_date)::INT,
    EXTRACT(YEAR FROM data.due_date)::INT,
    data.due_date,
    data.status,
    data.regime,
    data.recurrence
  FROM base
  CROSS JOIN LATERAL (
    SELECT
      entry.type,
      (base.month_start + (entry.offset_months || ' months')::interval + (entry.due_day - 1) * INTERVAL '1 day')::date AS due_date,
      entry.status,
      entry.regime,
      entry.recurrence
    FROM (
      VALUES
        ('dctfweb', 0, 15, 'paid', 'simples_nacional', 'monthly'),
        ('dctfweb', 1, 15, 'pending', 'simples_nacional', 'monthly')
    ) AS entry(type, offset_months, due_day, status, regime, recurrence)
  ) AS data;

  -- DEFIS (vence dia 31 de março)
  IF EXTRACT(MONTH FROM CURRENT_DATE) <= 3 THEN
    INSERT INTO tax_obligations (user_id, type, period_month, period_year, due_date, status, regime_tributario, recurrence)
    SELECT
      v_user_id,
      'defis',
      EXTRACT(MONTH FROM due_date)::INT,
      EXTRACT(YEAR FROM due_date)::INT,
      due_date,
      'pending',
      'simples_nacional',
      'yearly'
    FROM (
      SELECT MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INT, 3, 31) AS due_date
    ) defis_dates;
  END IF;

  -- INSS (vence dia 20 de cada mês)
  WITH base AS (
    SELECT DATE_TRUNC('month', CURRENT_DATE) AS month_start
  )
  INSERT INTO tax_obligations (user_id, type, period_month, period_year, due_date, amount, status, recurrence)
  SELECT
    v_user_id,
    data.type,
    EXTRACT(MONTH FROM data.due_date)::INT,
    EXTRACT(YEAR FROM data.due_date)::INT,
    data.due_date,
    data.amount,
    data.status,
    data.recurrence
  FROM base
  CROSS JOIN LATERAL (
    SELECT
      entry.type,
      (base.month_start + (entry.offset_months || ' months')::interval + (entry.due_day - 1) * INTERVAL '1 day')::date AS due_date,
      entry.amount,
      entry.status,
      entry.recurrence
    FROM (
      VALUES
        ('inss', 0, 20, 850.00, 'pending', 'monthly'),
        ('inss', 1, 20, 870.00, 'pending', 'monthly')
    ) AS entry(type, offset_months, due_day, amount, status, recurrence)
  ) AS data;

  -- FGTS (vence dia 7 de cada mês)
  WITH base AS (
    SELECT DATE_TRUNC('month', CURRENT_DATE) AS month_start
  )
  INSERT INTO tax_obligations (user_id, type, period_month, period_year, due_date, amount, status, recurrence)
  SELECT
    v_user_id,
    data.type,
    EXTRACT(MONTH FROM data.due_date)::INT,
    EXTRACT(YEAR FROM data.due_date)::INT,
    data.due_date,
    data.amount,
    data.status,
    data.recurrence
  FROM base
  CROSS JOIN LATERAL (
    SELECT
      entry.type,
      (base.month_start + (entry.offset_months || ' months')::interval + (entry.due_day - 1) * INTERVAL '1 day')::date AS due_date,
      entry.amount,
      entry.status,
      entry.recurrence
    FROM (
      VALUES
        ('fgts', 0, 7, 450.00, 'paid', 'monthly'),
        ('fgts', 1, 7, 460.00, 'pending', 'monthly')
    ) AS entry(type, offset_months, due_day, amount, status, recurrence)
  ) AS data;

  -- ISS (vence dia 10 de cada mês)
  WITH base AS (
    SELECT DATE_TRUNC('month', CURRENT_DATE) AS month_start
  )
  INSERT INTO tax_obligations (user_id, type, period_month, period_year, due_date, amount, status, recurrence)
  SELECT
    v_user_id,
    data.type,
    EXTRACT(MONTH FROM data.due_date)::INT,
    EXTRACT(YEAR FROM data.due_date)::INT,
    data.due_date,
    data.amount,
    data.status,
    data.recurrence
  FROM base
  CROSS JOIN LATERAL (
    SELECT
      entry.type,
      (base.month_start + (entry.offset_months || ' months')::interval + (entry.due_day - 1) * INTERVAL '1 day')::date AS due_date,
      entry.amount,
      entry.status,
      entry.recurrence
    FROM (
      VALUES
        ('iss', 0, 10, 320.00, 'calculated', 'monthly'),
        ('iss', 1, 10, 340.00, 'pending', 'monthly')
    ) AS entry(type, offset_months, due_day, amount, status, recurrence)
  ) AS data;

  -- eSocial (vence dia 15 de cada mês)
  WITH base AS (
    SELECT DATE_TRUNC('month', CURRENT_DATE) AS month_start
  )
  INSERT INTO tax_obligations (user_id, type, period_month, period_year, due_date, status, recurrence)
  SELECT
    v_user_id,
    data.type,
    EXTRACT(MONTH FROM data.due_date)::INT,
    EXTRACT(YEAR FROM data.due_date)::INT,
    data.due_date,
    data.status,
    data.recurrence
  FROM base
  CROSS JOIN LATERAL (
    SELECT
      entry.type,
      (base.month_start + (entry.offset_months || ' months')::interval + (entry.due_day - 1) * INTERVAL '1 day')::date AS due_date,
      entry.status,
      entry.recurrence
    FROM (
      VALUES
        ('esocial', 0, 15, 'paid', 'monthly'),
        ('esocial', 1, 15, 'pending', 'monthly')
    ) AS entry(type, offset_months, due_day, status, recurrence)
  ) AS data;

  RAISE NOTICE 'Seed de obrigações fiscais executado com sucesso para o usuário %', v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Executar o seed
SELECT seed_tax_obligations();

-- Remover a função após execução (opcional)
-- DROP FUNCTION IF EXISTS seed_tax_obligations();
