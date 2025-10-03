-- Migration 028: Seed de obrigações fiscais para teste
-- Data: 03/10/2025
-- Objetivo: Criar obrigações fiscais de exemplo para o mês atual e próximos meses

-- Função para criar obrigações fiscais de exemplo
CREATE OR REPLACE FUNCTION seed_tax_obligations()
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_current_month INTEGER;
  v_current_year INTEGER;
BEGIN
  -- Pegar o primeiro usuário (para ambiente de desenvolvimento)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Nenhum usuário encontrado. Seed não executado.';
    RETURN;
  END IF;

  -- Obter mês e ano atuais
  v_current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Limpar obrigações existentes (apenas para desenvolvimento)
  DELETE FROM tax_obligations WHERE user_id = v_user_id;

  -- DAS - Simples Nacional (vence dia 20 de cada mês)
  INSERT INTO tax_obligations (user_id, type, period_month, period_year, due_date, amount, status, regime_tributario, recurrence)
  VALUES 
    (v_user_id, 'das', v_current_month, v_current_year, 
     DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '19 days', 
     1250.00, 'pending', 'simples_nacional', 'monthly'),
    (v_user_id, 'das', v_current_month + 1, v_current_year, 
     DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '19 days', 
     1300.00, 'pending', 'simples_nacional', 'monthly'),
    (v_user_id, 'das', v_current_month + 2, v_current_year, 
     DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 months' + INTERVAL '19 days', 
     1280.00, 'pending', 'simples_nacional', 'monthly');

  -- DCTFWeb (vence dia 15 de cada mês)
  INSERT INTO tax_obligations (user_id, type, period_month, period_year, due_date, status, regime_tributario, recurrence)
  VALUES 
    (v_user_id, 'dctfweb', v_current_month, v_current_year, 
     DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '14 days', 
     'done', 'simples_nacional', 'monthly'),
    (v_user_id, 'dctfweb', v_current_month + 1, v_current_year, 
     DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '14 days', 
     'pending', 'simples_nacional', 'monthly');

  -- DEFIS (vence dia 31 de março)
  IF v_current_month <= 3 THEN
    INSERT INTO tax_obligations (user_id, type, period_month, period_year, due_date, status, regime_tributario, recurrence)
    VALUES 
      (v_user_id, 'defis', 3, v_current_year, 
       MAKE_DATE(v_current_year, 3, 31), 
       'pending', 'simples_nacional', 'yearly');
  END IF;

  -- INSS (vence dia 20 de cada mês)
  INSERT INTO tax_obligations (user_id, type, period_month, period_year, due_date, amount, status, recurrence)
  VALUES 
    (v_user_id, 'inss', v_current_month, v_current_year, 
     DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '19 days', 
     850.00, 'pending', 'monthly'),
    (v_user_id, 'inss', v_current_month + 1, v_current_year, 
     DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '19 days', 
     870.00, 'pending', 'monthly');

  -- FGTS (vence dia 7 de cada mês)
  INSERT INTO tax_obligations (user_id, type, period_month, period_year, due_date, amount, status, recurrence)
  VALUES 
    (v_user_id, 'fgts', v_current_month, v_current_year, 
     DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '6 days', 
     450.00, 'paid', 'monthly'),
    (v_user_id, 'fgts', v_current_month + 1, v_current_year, 
     DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '6 days', 
     460.00, 'pending', 'monthly');

  -- ISS (vence dia 10 de cada mês)
  INSERT INTO tax_obligations (user_id, type, period_month, period_year, due_date, amount, status, recurrence)
  VALUES 
    (v_user_id, 'iss', v_current_month, v_current_year, 
     DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '9 days', 
     320.00, 'calculated', 'monthly'),
    (v_user_id, 'iss', v_current_month + 1, v_current_year, 
     DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '9 days', 
     340.00, 'pending', 'monthly');

  -- eSocial (vence dia 15 de cada mês)
  INSERT INTO tax_obligations (user_id, type, period_month, period_year, due_date, status, recurrence)
  VALUES 
    (v_user_id, 'esocial', v_current_month, v_current_year, 
     DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '14 days', 
     'done', 'monthly'),
    (v_user_id, 'esocial', v_current_month + 1, v_current_year, 
     DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '14 days', 
     'pending', 'monthly');

  RAISE NOTICE 'Seed de obrigações fiscais executado com sucesso para o usuário %', v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Executar o seed
SELECT seed_tax_obligations();

-- Remover a função após execução (opcional)
-- DROP FUNCTION IF EXISTS seed_tax_obligations();

