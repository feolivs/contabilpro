-- Migration: Create notification triggers
-- Description: Funções e triggers para gerar notificações automaticamente
-- Author: Augment Agent
-- Date: 2025-10-03

-- Function to check tax obligations and create notifications
CREATE OR REPLACE FUNCTION check_tax_obligations_due()
RETURNS void AS $$
DECLARE
  v_obligation RECORD;
  v_days_until_due INTEGER;
  v_notification_type VARCHAR(50);
  v_title VARCHAR(255);
  v_message TEXT;
  v_existing_notification_count INTEGER;
BEGIN
  -- Loop through all pending tax obligations
  FOR v_obligation IN
    SELECT 
      id,
      user_id,
      type,
      due_date,
      amount,
      client_id,
      period_month,
      period_year
    FROM tax_obligations
    WHERE status = 'pending'
      AND due_date >= CURRENT_DATE
      AND due_date <= CURRENT_DATE + INTERVAL '7 days'
  LOOP
    -- Calculate days until due
    v_days_until_due := v_obligation.due_date - CURRENT_DATE;
    
    -- Determine notification type and message
    IF v_days_until_due = 7 THEN
      v_notification_type := 'tax_obligation_due_7d';
      v_title := 'Obrigação Fiscal: 7 dias para vencimento';
      v_message := format(
        'A obrigação %s referente a %s/%s vence em 7 dias (%s).',
        CASE v_obligation.type
          WHEN 'das' THEN 'DAS - Simples Nacional'
          WHEN 'dctfweb' THEN 'DCTFWeb'
          WHEN 'inss' THEN 'INSS'
          WHEN 'fgts' THEN 'FGTS'
          WHEN 'iss' THEN 'ISS'
          WHEN 'esocial' THEN 'eSocial'
          ELSE UPPER(v_obligation.type)
        END,
        LPAD(v_obligation.period_month::TEXT, 2, '0'),
        v_obligation.period_year,
        TO_CHAR(v_obligation.due_date, 'DD/MM/YYYY')
      );
    ELSIF v_days_until_due = 3 THEN
      v_notification_type := 'tax_obligation_due_3d';
      v_title := 'ATENÇÃO: Obrigação Fiscal vence em 3 dias';
      v_message := format(
        'A obrigação %s referente a %s/%s vence em 3 dias (%s). Não esqueça!',
        CASE v_obligation.type
          WHEN 'das' THEN 'DAS - Simples Nacional'
          WHEN 'dctfweb' THEN 'DCTFWeb'
          WHEN 'inss' THEN 'INSS'
          WHEN 'fgts' THEN 'FGTS'
          WHEN 'iss' THEN 'ISS'
          WHEN 'esocial' THEN 'eSocial'
          ELSE UPPER(v_obligation.type)
        END,
        LPAD(v_obligation.period_month::TEXT, 2, '0'),
        v_obligation.period_year,
        TO_CHAR(v_obligation.due_date, 'DD/MM/YYYY')
      );
    ELSIF v_days_until_due = 0 THEN
      v_notification_type := 'tax_obligation_due_today';
      v_title := 'URGENTE: Obrigação Fiscal vence HOJE';
      v_message := format(
        'A obrigação %s referente a %s/%s vence HOJE (%s). Pague imediatamente para evitar multas!',
        CASE v_obligation.type
          WHEN 'das' THEN 'DAS - Simples Nacional'
          WHEN 'dctfweb' THEN 'DCTFWeb'
          WHEN 'inss' THEN 'INSS'
          WHEN 'fgts' THEN 'FGTS'
          WHEN 'iss' THEN 'ISS'
          WHEN 'esocial' THEN 'eSocial'
          ELSE UPPER(v_obligation.type)
        END,
        LPAD(v_obligation.period_month::TEXT, 2, '0'),
        v_obligation.period_year,
        TO_CHAR(v_obligation.due_date, 'DD/MM/YYYY')
      );
    ELSE
      -- Skip if not 7, 3, or 0 days
      CONTINUE;
    END IF;
    
    -- Check if notification already exists for this obligation and type
    SELECT COUNT(*) INTO v_existing_notification_count
    FROM notifications
    WHERE user_id = v_obligation.user_id
      AND type = v_notification_type
      AND (data->>'tax_obligation_id')::UUID = v_obligation.id
      AND created_at >= CURRENT_DATE;
    
    -- Only create notification if it doesn't exist yet today
    IF v_existing_notification_count = 0 THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        v_obligation.user_id,
        v_notification_type,
        v_title,
        v_message,
        jsonb_build_object(
          'tax_obligation_id', v_obligation.id,
          'tax_obligation_type', v_obligation.type,
          'due_date', v_obligation.due_date,
          'amount', v_obligation.amount,
          'client_id', v_obligation.client_id,
          'period_month', v_obligation.period_month,
          'period_year', v_obligation.period_year,
          'days_until_due', v_days_until_due
        )
      );
    END IF;
  END LOOP;
  
  -- Check for overdue obligations
  FOR v_obligation IN
    SELECT 
      id,
      user_id,
      type,
      due_date,
      amount,
      client_id,
      period_month,
      period_year
    FROM tax_obligations
    WHERE status = 'pending'
      AND due_date < CURRENT_DATE
  LOOP
    v_notification_type := 'tax_obligation_overdue';
    v_title := 'ALERTA: Obrigação Fiscal ATRASADA';
    v_message := format(
      'A obrigação %s referente a %s/%s está ATRASADA desde %s. Regularize imediatamente para evitar multas maiores!',
      CASE v_obligation.type
        WHEN 'das' THEN 'DAS - Simples Nacional'
        WHEN 'dctfweb' THEN 'DCTFWeb'
        WHEN 'inss' THEN 'INSS'
        WHEN 'fgts' THEN 'FGTS'
        WHEN 'iss' THEN 'ISS'
        WHEN 'esocial' THEN 'eSocial'
        ELSE UPPER(v_obligation.type)
      END,
      LPAD(v_obligation.period_month::TEXT, 2, '0'),
      v_obligation.period_year,
      TO_CHAR(v_obligation.due_date, 'DD/MM/YYYY')
    );
    
    -- Check if notification already exists for this obligation today
    SELECT COUNT(*) INTO v_existing_notification_count
    FROM notifications
    WHERE user_id = v_obligation.user_id
      AND type = v_notification_type
      AND (data->>'tax_obligation_id')::UUID = v_obligation.id
      AND created_at >= CURRENT_DATE;
    
    -- Only create notification if it doesn't exist yet today
    IF v_existing_notification_count = 0 THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        v_obligation.user_id,
        v_notification_type,
        v_title,
        v_message,
        jsonb_build_object(
          'tax_obligation_id', v_obligation.id,
          'tax_obligation_type', v_obligation.type,
          'due_date', v_obligation.due_date,
          'amount', v_obligation.amount,
          'client_id', v_obligation.client_id,
          'period_month', v_obligation.period_month,
          'period_year', v_obligation.period_year,
          'days_overdue', CURRENT_DATE - v_obligation.due_date
        )
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION check_tax_obligations_due() IS 'Verifica obrigações fiscais vencendo em 7, 3 dias, hoje ou atrasadas e cria notificações automaticamente';

