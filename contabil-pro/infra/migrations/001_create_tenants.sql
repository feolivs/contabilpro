-- Criar tabela de tenants (organizacoes/empresas)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  document VARCHAR(20) UNIQUE NOT NULL, -- CNPJ
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  settings JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_document ON tenants(document);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at 
  BEFORE UPDATE ON tenants 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE tenants IS 'Tabela de organizacoes/empresas (multi-tenancy)';
COMMENT ON COLUMN tenants.slug IS 'Identificador unico amigavel para URLs';
COMMENT ON COLUMN tenants.document IS 'CNPJ da empresa';
COMMENT ON COLUMN tenants.settings IS 'Configuracoes especificas do tenant (JSON)';
COMMENT ON COLUMN tenants.status IS 'Status do tenant: active, inactive, suspended';
