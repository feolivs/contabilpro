-- ============================================================================
-- Migration 012: Melhorias nas políticas RLS para clients
-- ============================================================================
-- Objetivo: Garantir que RLS funciona corretamente com tenant_id
-- ============================================================================

-- ============================================================================
-- PARTE 1: Função helper para obter tenant_id do JWT
-- ============================================================================

-- Função melhorada para obter tenant_id do contexto JWT
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
DECLARE
  tenant_id UUID;
BEGIN
  -- Tentar obter do JWT claim
  tenant_id := current_setting('request.jwt.claims', true)::jsonb->>'tenant_id';
  
  -- Se não encontrou no JWT, tentar obter do setting manual
  IF tenant_id IS NULL THEN
    tenant_id := current_setting('app.current_tenant_id', true)::UUID;
  END IF;
  
  -- Se ainda não encontrou, retornar NULL (vai falhar no RLS)
  RETURN tenant_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION current_tenant_id() IS 'Retorna o tenant_id do contexto atual (JWT ou setting manual)';

-- ============================================================================
-- PARTE 2: Função para setar tenant_id manualmente (para jobs/admin)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_tenant_context(UUID) IS 'Define o tenant_id no contexto da sessão (para jobs administrativos)';

-- ============================================================================
-- PARTE 3: Recriar políticas RLS para clients (se necessário)
-- ============================================================================

-- Garantir que RLS está habilitado
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view clients from their tenant" ON clients;
DROP POLICY IF EXISTS "Users can create clients in their tenant" ON clients;
DROP POLICY IF EXISTS "Users can update clients from their tenant" ON clients;
DROP POLICY IF EXISTS "Admins can delete clients from their tenant" ON clients;

-- SELECT: Ver apenas clientes do próprio tenant
CREATE POLICY "Users can view clients from their tenant" ON clients
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- INSERT: Criar apenas no próprio tenant
CREATE POLICY "Users can create clients in their tenant" ON clients
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

-- UPDATE: Atualizar apenas clientes do próprio tenant
CREATE POLICY "Users can update clients from their tenant" ON clients
  FOR UPDATE
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- DELETE: Apenas admins podem deletar (e apenas do próprio tenant)
CREATE POLICY "Admins can delete clients from their tenant" ON clients
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    EXISTS (
      SELECT 1 
      FROM user_tenants 
      WHERE user_id = auth.uid() 
      AND tenant_id = current_tenant_id()
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- ============================================================================
-- PARTE 4: Políticas RLS para view materializada
-- ============================================================================

-- Habilitar RLS na view materializada
ALTER MATERIALIZED VIEW client_stats_by_tenant OWNER TO postgres;

-- Criar política para view (apenas leitura)
-- Nota: Views materializadas não suportam RLS diretamente, 
-- então criamos uma view regular com RLS em cima dela

CREATE OR REPLACE VIEW client_stats AS
SELECT * FROM client_stats_by_tenant
WHERE tenant_id = current_tenant_id();

COMMENT ON VIEW client_stats IS 'View com RLS sobre client_stats_by_tenant';

-- ============================================================================
-- PARTE 5: Função para busca com rate limit (preparação)
-- ============================================================================

-- Tabela para controle de rate limit
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user_action_time 
  ON rate_limit_log(user_id, action, created_at DESC);

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action VARCHAR(50),
  p_max_requests INTEGER DEFAULT 5,
  p_window_seconds INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Contar requisições no período
  SELECT COUNT(*) INTO request_count
  FROM rate_limit_log
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at > NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  
  -- Se excedeu o limite, retornar false
  IF request_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Registrar nova requisição
  INSERT INTO rate_limit_log (user_id, action)
  VALUES (p_user_id, p_action);
  
  -- Limpar logs antigos (> 1 hora)
  DELETE FROM rate_limit_log
  WHERE created_at < NOW() - INTERVAL '1 hour';
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_rate_limit(UUID, VARCHAR, INTEGER, INTEGER) IS 'Verifica e registra rate limit para ações do usuário';

-- ============================================================================
-- PARTE 6: Função de busca otimizada com FTS
-- ============================================================================

-- Função para busca de clientes com Full-Text Search
CREATE OR REPLACE FUNCTION search_clients(
  p_tenant_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  email VARCHAR(255),
  document VARCHAR(20),
  document_norm VARCHAR(20),
  status VARCHAR(20),
  regime_tributario VARCHAR(20),
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.email,
    c.document,
    c.document_norm,
    c.status,
    c.regime_tributario,
    GREATEST(
      similarity(c.name, p_query),
      similarity(c.document_norm, regexp_replace(p_query, '[^0-9]', '', 'g')),
      COALESCE(similarity(c.email, p_query), 0)
    ) as similarity
  FROM clients c
  WHERE c.tenant_id = p_tenant_id
    AND (
      c.name ILIKE '%' || p_query || '%'
      OR c.document_norm LIKE regexp_replace(p_query, '[^0-9]', '', 'g') || '%'
      OR c.email ILIKE '%' || p_query || '%'
    )
  ORDER BY similarity DESC, c.name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_clients(UUID, TEXT, INTEGER, INTEGER) IS 'Busca clientes com FTS e ranking por similaridade';

-- ============================================================================
-- PARTE 7: Função para keyset pagination (cursor-based)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_clients_paginated(
  p_tenant_id UUID,
  p_cursor_id UUID DEFAULT NULL,
  p_cursor_name VARCHAR(255) DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_status VARCHAR(20) DEFAULT NULL,
  p_regime VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  email VARCHAR(255),
  document VARCHAR(20),
  status VARCHAR(20),
  regime_tributario VARCHAR(20),
  ultima_atividade TIMESTAMP WITH TIME ZONE,
  has_next BOOLEAN
) AS $$
DECLARE
  result_count INTEGER;
BEGIN
  -- Buscar registros
  RETURN QUERY
  WITH results AS (
    SELECT 
      c.id,
      c.name,
      c.email,
      c.document,
      c.status,
      c.regime_tributario,
      c.ultima_atividade
    FROM clients c
    WHERE c.tenant_id = p_tenant_id
      AND (p_status IS NULL OR c.status = p_status)
      AND (p_regime IS NULL OR c.regime_tributario = p_regime)
      AND (
        p_cursor_id IS NULL 
        OR (c.name, c.id) > (p_cursor_name, p_cursor_id)
      )
    ORDER BY c.name ASC, c.id ASC
    LIMIT p_limit + 1
  )
  SELECT 
    r.id,
    r.name,
    r.email,
    r.document,
    r.status,
    r.regime_tributario,
    r.ultima_atividade,
    (SELECT COUNT(*) FROM results) > p_limit as has_next
  FROM results r
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_clients_paginated(UUID, UUID, VARCHAR, INTEGER, VARCHAR, VARCHAR) IS 'Paginação cursor-based para grandes volumes (>10k clientes)';

-- ============================================================================
-- PARTE 8: Trigger para refresh automático de stats (opcional)
-- ============================================================================

-- Função para refresh assíncrono (via pg_cron ou job externo)
CREATE OR REPLACE FUNCTION trigger_refresh_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas notificar que precisa refresh (não fazer refresh síncrono)
  PERFORM pg_notify('refresh_client_stats', NEW.tenant_id::TEXT);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar quando houver mudanças
DROP TRIGGER IF EXISTS notify_client_stats_refresh ON clients;
CREATE TRIGGER notify_client_stats_refresh
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_client_stats();

COMMENT ON FUNCTION trigger_refresh_client_stats() IS 'Notifica via pg_notify quando stats precisam ser atualizadas';

