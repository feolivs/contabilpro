-- Criar tabela de lancamentos contabeis (ledger imutavel)
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  account_id UUID NOT NULL REFERENCES accounts(id),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  type VARCHAR(10) NOT NULL CHECK (type IN ('debit', 'credit')),
  date DATE NOT NULL,
  reference VARCHAR(100), -- Referencia externa (ex: numero da NF)
  batch_id UUID, -- Para agrupar lancamentos relacionados
  document_id UUID, -- Referencia para documento anexo
  reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  reconciled_by UUID REFERENCES users(id),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Entries sao imutaveis - nao ha updated_at
  CONSTRAINT entries_immutable CHECK (true) -- Placeholder para regra de imutabilidade
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_entries_tenant_id ON entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entries_client_id ON entries(client_id);
CREATE INDEX IF NOT EXISTS idx_entries_account_id ON entries(account_id);
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
CREATE INDEX IF NOT EXISTS idx_entries_batch_id ON entries(batch_id);
CREATE INDEX IF NOT EXISTS idx_entries_document_id ON entries(document_id);
CREATE INDEX IF NOT EXISTS idx_entries_reconciled ON entries(reconciled);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);
CREATE INDEX IF NOT EXISTS idx_entries_reference ON entries(reference);

-- Indice composto para relatorios
CREATE INDEX IF NOT EXISTS idx_entries_tenant_date_type 
  ON entries(tenant_id, date, type);

-- Comentarios
COMMENT ON TABLE entries IS 'Lancamentos contabeis imutaveis (ledger)';
COMMENT ON COLUMN entries.tenant_id IS 'Referencia para o tenant (RLS)';
COMMENT ON COLUMN entries.amount IS 'Valor sempre positivo';
COMMENT ON COLUMN entries.type IS 'Tipo do lancamento: debit ou credit';
COMMENT ON COLUMN entries.reference IS 'Referencia externa (ex: numero NF)';
COMMENT ON COLUMN entries.batch_id IS 'Agrupa lancamentos relacionados';
COMMENT ON COLUMN entries.reconciled IS 'Se foi conciliado com extrato bancario';
COMMENT ON COLUMN entries.created_by IS 'Usuario que criou o lancamento';
