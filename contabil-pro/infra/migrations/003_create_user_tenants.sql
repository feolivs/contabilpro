-- Criar tabela de relacionamento usuario-tenant (many-to-many)
CREATE TABLE IF NOT EXISTS user_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'manager', 'accountant', 'user')),
  permissions JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para evitar duplicatas
  UNIQUE(user_id, tenant_id)
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_role ON user_tenants(role);
CREATE INDEX IF NOT EXISTS idx_user_tenants_status ON user_tenants(status);
CREATE INDEX IF NOT EXISTS idx_user_tenants_created_at ON user_tenants(created_at);

-- Trigger para updated_at
CREATE TRIGGER update_user_tenants_updated_at 
  BEFORE UPDATE ON user_tenants 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE user_tenants IS 'Relacionamento many-to-many entre usuarios e tenants';
COMMENT ON COLUMN user_tenants.role IS 'Papel do usuario no tenant: owner, admin, manager, accountant, user';
COMMENT ON COLUMN user_tenants.permissions IS 'Permissoes especificas do usuario no tenant (JSON)';
COMMENT ON COLUMN user_tenants.status IS 'Status do relacionamento: active, inactive, pending';
COMMENT ON COLUMN user_tenants.invited_by IS 'Usuario que fez o convite';
COMMENT ON COLUMN user_tenants.invited_at IS 'Timestamp do convite';
COMMENT ON COLUMN user_tenants.joined_at IS 'Timestamp quando o usuario aceitou o convite';
