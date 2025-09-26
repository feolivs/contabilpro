-- Criar tabelas adicionais do sistema

-- Tabela de contas bancarias
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  bank_code VARCHAR(10) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  agency VARCHAR(20) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_type VARCHAR(20) DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings', 'investment')),
  balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transacoes bancarias
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL, -- ID unico do provedor (Open Finance)
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('debit', 'credit')),
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reconciled', 'ignored')),
  entry_id UUID REFERENCES entries(id), -- Lancamento conciliado
  reconciled_at TIMESTAMP WITH TIME ZONE,
  reconciled_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de obrigacoes fiscais
CREATE TABLE IF NOT EXISTS tax_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- DAS, IRPJ, CSLL, etc.
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'calculated', 'paid', 'overdue')),
  calculated_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tarefas/lembretes
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- reminder, tax_obligation, document_review, etc.
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  assigned_to UUID REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de propostas comerciais
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until DATE,
  sent_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de insights de IA
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES entries(id),
  type VARCHAR(50) NOT NULL, -- classification, reconciliation, anomaly, etc.
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  data JSONB NOT NULL, -- Dados especificos do insight
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_confirmation', 'confirmed', 'rejected', 'needs_review')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para todas as tabelas
CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant_id ON bank_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_tenant_id ON bank_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_external_id ON bank_transactions(external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_transactions_tenant_external 
  ON bank_transactions(tenant_id, external_id);

CREATE INDEX IF NOT EXISTS idx_tax_obligations_tenant_id ON tax_obligations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tax_obligations_due_date ON tax_obligations(due_date);
CREATE INDEX IF NOT EXISTS idx_tax_obligations_status ON tax_obligations(status);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_proposals_tenant_id ON proposals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

CREATE INDEX IF NOT EXISTS idx_ai_insights_tenant_id ON ai_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_entry_id ON ai_insights(entry_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON ai_insights(status);

-- Triggers para updated_at
CREATE TRIGGER update_bank_accounts_updated_at 
  BEFORE UPDATE ON bank_accounts FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_transactions_updated_at 
  BEFORE UPDATE ON bank_transactions FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_obligations_updated_at 
  BEFORE UPDATE ON tax_obligations FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at 
  BEFORE UPDATE ON proposals FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
