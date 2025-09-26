-- Criar tabela de contas contabeis (plano de contas)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL, -- Codigo da conta (ex: 1.1.01.001)
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  subtype VARCHAR(50), -- Subtipo especifico (ex: 'current_asset', 'fixed_asset')
  parent_id UUID REFERENCES accounts(id), -- Para hierarquia de contas
  level INTEGER NOT NULL DEFAULT 1, -- Nivel na hierarquia
  is_active BOOLEAN DEFAULT true,
  accepts_entries BOOLEAN DEFAULT true, -- Se aceita lancamentos diretos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_accounts_tenant_id ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_parent_id ON accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_accounts_level ON accounts(level);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);

-- Constraint para evitar codigos duplicados por tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_tenant_code 
  ON accounts(tenant_id, code);

-- Trigger para updated_at
CREATE TRIGGER update_accounts_updated_at 
  BEFORE UPDATE ON accounts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE accounts IS 'Plano de contas contabeis por tenant';
COMMENT ON COLUMN accounts.tenant_id IS 'Referencia para o tenant (RLS)';
COMMENT ON COLUMN accounts.code IS 'Codigo unico da conta contabil';
COMMENT ON COLUMN accounts.type IS 'Tipo da conta: asset, liability, equity, revenue, expense';
COMMENT ON COLUMN accounts.subtype IS 'Subtipo especifico da conta';
COMMENT ON COLUMN accounts.parent_id IS 'Conta pai para hierarquia';
COMMENT ON COLUMN accounts.level IS 'Nivel na hierarquia (1=raiz)';
COMMENT ON COLUMN accounts.accepts_entries IS 'Se a conta aceita lancamentos diretos';
