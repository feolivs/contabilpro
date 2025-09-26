-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  document VARCHAR(20) NOT NULL, -- CPF ou CNPJ
  document_type VARCHAR(10) NOT NULL CHECK (document_type IN ('cpf', 'cnpj')),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  notes TEXT,
  tags TEXT[], -- Array de tags para categorizacao
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN(tags);

-- Constraint para evitar documentos duplicados por tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_tenant_document 
  ON clients(tenant_id, document);

-- Trigger para updated_at
CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE clients IS 'Tabela de clientes por tenant';
COMMENT ON COLUMN clients.tenant_id IS 'Referencia para o tenant (RLS)';
COMMENT ON COLUMN clients.document IS 'CPF ou CNPJ do cliente';
COMMENT ON COLUMN clients.document_type IS 'Tipo do documento: cpf ou cnpj';
COMMENT ON COLUMN clients.tags IS 'Array de tags para categorizacao';
COMMENT ON COLUMN clients.status IS 'Status do cliente: active, inactive';
