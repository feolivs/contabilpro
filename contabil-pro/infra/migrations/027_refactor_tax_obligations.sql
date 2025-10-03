-- Migration 027: Refatorar tax_obligations para single-user
-- Data: 03/10/2025
-- Objetivo: Remover tenant_id, adicionar client_id, fortalecer constraints e políticas

-- 1. Remover constraint de tenant_id
ALTER TABLE tax_obligations DROP CONSTRAINT IF EXISTS tax_obligations_tenant_id_fkey;

-- 2. Remover coluna tenant_id
ALTER TABLE tax_obligations DROP COLUMN IF EXISTS tenant_id;

-- 3. Adicionar coluna client_id (opcional - obrigação pode ser geral ou por cliente)
ALTER TABLE tax_obligations ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- 4. Adicionar coluna user_id (obrigatória - quem criou a obrigação)
ALTER TABLE tax_obligations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Adicionar coluna regime_tributario (para cálculo automático)
ALTER TABLE tax_obligations ADD COLUMN IF NOT EXISTS regime_tributario VARCHAR(50);

-- 6. Adicionar coluna recurrence (para obrigações recorrentes)
ALTER TABLE tax_obligations ADD COLUMN IF NOT EXISTS recurrence VARCHAR(20) CHECK (recurrence IN ('once', 'monthly', 'quarterly', 'yearly'));

-- 7. Backfill de user_id para registros existentes
UPDATE tax_obligations o
SET user_id = c.owner_id
FROM clients c
WHERE o.client_id = c.id
  AND o.user_id IS NULL;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE tax_obligations
    SET user_id = v_user_id
    WHERE user_id IS NULL;
  END IF;
END;
$$;

-- 8. Ajustes de defaults e constraints
ALTER TABLE tax_obligations
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL;

UPDATE tax_obligations
SET status = 'pending'
WHERE status IS NULL;

ALTER TABLE tax_obligations
  ADD CONSTRAINT tax_obligations_period_month_check CHECK (period_month BETWEEN 1 AND 12),
  ADD CONSTRAINT tax_obligations_period_year_check CHECK (period_year BETWEEN 2000 AND 2100);

-- 9. Criar índices para performance e unicidade
CREATE INDEX IF NOT EXISTS idx_tax_obligations_user_id ON tax_obligations(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_obligations_client_id ON tax_obligations(client_id);
CREATE INDEX IF NOT EXISTS idx_tax_obligations_due_date ON tax_obligations(due_date);
CREATE INDEX IF NOT EXISTS idx_tax_obligations_status ON tax_obligations(status);
CREATE INDEX IF NOT EXISTS idx_tax_obligations_period ON tax_obligations(period_year, period_month);

CREATE UNIQUE INDEX IF NOT EXISTS uid_tax_obligations_unique_period
  ON tax_obligations (
    user_id,
    type,
    period_year,
    period_month,
    COALESCE(client_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- 10. Habilitar e reforçar RLS
ALTER TABLE tax_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_obligations FORCE ROW LEVEL SECURITY;

-- 11. Remover políticas antigas
DROP POLICY IF EXISTS "Users can view tax obligations from their tenant" ON tax_obligations;
DROP POLICY IF EXISTS "Users can insert tax obligations for their tenant" ON tax_obligations;
DROP POLICY IF EXISTS "Users can update tax obligations from their tenant" ON tax_obligations;
DROP POLICY IF EXISTS "Users can delete tax obligations from their tenant" ON tax_obligations;

-- 12. Criar novas políticas RLS (single-user)
CREATE POLICY "Users can view their tax obligations" ON tax_obligations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their tax obligations" ON tax_obligations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their tax obligations" ON tax_obligations
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their tax obligations" ON tax_obligations
  FOR DELETE
  USING (user_id = auth.uid());

-- 13. Adicionar comentários
COMMENT ON TABLE tax_obligations IS 'Obrigações fiscais (DAS, IRPJ, CSLL, etc.) - single-user';
COMMENT ON COLUMN tax_obligations.client_id IS 'Cliente relacionado (opcional - pode ser obrigação geral)';
COMMENT ON COLUMN tax_obligations.user_id IS 'Usuário que criou a obrigação (obrigatório)';
COMMENT ON COLUMN tax_obligations.regime_tributario IS 'Regime tributário (simples_nacional, lucro_presumido, lucro_real)';
COMMENT ON COLUMN tax_obligations.recurrence IS 'Recorrência da obrigação (once, monthly, quarterly, yearly)';
