-- Criar tabela de usuarios (estende auth.users do Supabase)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(20),
  settings JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

-- Trigger para updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE users IS 'Tabela de usuarios (estende auth.users do Supabase)';
COMMENT ON COLUMN users.id IS 'Referencia para auth.users(id)';
COMMENT ON COLUMN users.settings IS 'Configuracoes especificas do usuario (JSON)';
COMMENT ON COLUMN users.status IS 'Status do usuario: active, inactive, suspended';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp do ultimo login';
