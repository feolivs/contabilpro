-- ============================================================================
-- Migration 011: Melhorias na tabela clients
-- ============================================================================
-- Objetivo: Preparar a tabela clients para o módulo completo
-- - Adicionar document_norm para unicidade robusta
-- - Adicionar novos campos do plano (regime, inscrições, etc)
-- - Criar triggers para normalização automática
-- - Criar views materializadas para KPIs
-- ============================================================================

-- ============================================================================
-- PARTE 1: Adicionar coluna document_norm e normalizar dados existentes
-- ============================================================================

-- Adicionar coluna document_norm (somente dígitos)
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS document_norm VARCHAR(20);

-- Função para normalizar documento (remove tudo exceto dígitos)
CREATE OR REPLACE FUNCTION normalize_document(doc TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(doc, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Normalizar documentos existentes
UPDATE clients 
SET document_norm = normalize_document(document)
WHERE document_norm IS NULL;

-- Tornar document_norm NOT NULL após popular
ALTER TABLE clients 
  ALTER COLUMN document_norm SET NOT NULL;

-- Remover constraint antiga de unicidade
DROP INDEX IF EXISTS idx_clients_tenant_document;

-- Criar nova constraint de unicidade usando document_norm
CREATE UNIQUE INDEX idx_clients_tenant_document_norm 
  ON clients(tenant_id, document_norm);

-- Criar índice para busca por document_norm
CREATE INDEX IF NOT EXISTS idx_clients_document_norm 
  ON clients(document_norm);

-- ============================================================================
-- PARTE 2: Trigger para normalização automática no INSERT/UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_normalize_client_document()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalizar document_norm automaticamente
  NEW.document_norm := normalize_document(NEW.document);
  
  -- Se document_type não foi informado, inferir do tamanho
  IF NEW.document_type IS NULL THEN
    IF length(NEW.document_norm) = 11 THEN
      NEW.document_type := 'cpf';
    ELSIF length(NEW.document_norm) = 14 THEN
      NEW.document_type := 'cnpj';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger BEFORE INSERT OR UPDATE
DROP TRIGGER IF EXISTS normalize_client_document ON clients;
CREATE TRIGGER normalize_client_document
  BEFORE INSERT OR UPDATE OF document ON clients
  FOR EACH ROW
  EXECUTE FUNCTION trigger_normalize_client_document();

-- ============================================================================
-- PARTE 3: Adicionar novos campos do plano de clientes
-- ============================================================================

-- Campos fiscais
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS tipo_pessoa VARCHAR(2) CHECK (tipo_pessoa IN ('PF', 'PJ')),
  ADD COLUMN IF NOT EXISTS regime_tributario VARCHAR(20) CHECK (regime_tributario IN ('MEI', 'Simples', 'Presumido', 'Real')),
  ADD COLUMN IF NOT EXISTS inscricao_estadual VARCHAR(20),
  ADD COLUMN IF NOT EXISTS inscricao_municipal VARCHAR(20);

-- Campos de contato adicionais
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS cep VARCHAR(9),
  ADD COLUMN IF NOT EXISTS responsavel_nome VARCHAR(255),
  ADD COLUMN IF NOT EXISTS responsavel_telefone VARCHAR(20);

-- Campos financeiros
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS dia_vencimento INTEGER CHECK (dia_vencimento BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS valor_plano DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS forma_cobranca VARCHAR(20);

-- Campos de gestão
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS ultima_atividade TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS score_risco INTEGER CHECK (score_risco BETWEEN 0 AND 100);

-- Atualizar status para incluir novos valores
ALTER TABLE clients 
  DROP CONSTRAINT IF EXISTS clients_status_check;

ALTER TABLE clients 
  ADD CONSTRAINT clients_status_check 
  CHECK (status IN ('active', 'inactive', 'ativo', 'inadimplente', 'onboarding', 'inativo'));

-- Migrar status antigos para novos (se necessário)
UPDATE clients SET status = 'ativo' WHERE status = 'active';
UPDATE clients SET status = 'inativo' WHERE status = 'inactive';

-- Remover valores antigos do check constraint
ALTER TABLE clients 
  DROP CONSTRAINT clients_status_check;

ALTER TABLE clients 
  ADD CONSTRAINT clients_status_check 
  CHECK (status IN ('ativo', 'inadimplente', 'onboarding', 'inativo'));

-- Converter tags de TEXT[] para JSONB (mais flexível)
-- Primeiro, criar nova coluna
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS tags_jsonb JSONB DEFAULT '[]';

-- Migrar dados existentes
UPDATE clients 
SET tags_jsonb = to_jsonb(tags)
WHERE tags IS NOT NULL AND tags_jsonb = '[]';

-- Remover coluna antiga (comentado por segurança - descomentar após validação)
-- ALTER TABLE clients DROP COLUMN IF EXISTS tags;
-- ALTER TABLE clients RENAME COLUMN tags_jsonb TO tags;

-- ============================================================================
-- PARTE 4: Índices adicionais para performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_clients_regime ON clients(regime_tributario) 
  WHERE regime_tributario IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_tipo_pessoa ON clients(tipo_pessoa) 
  WHERE tipo_pessoa IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_ultima_atividade ON clients(ultima_atividade DESC);

CREATE INDEX IF NOT EXISTS idx_clients_name_trgm ON clients USING gin(name gin_trgm_ops);

-- Habilitar extensão pg_trgm se não estiver habilitada (para busca fuzzy)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- PARTE 5: View materializada para KPIs (evita COUNT(*) em produção)
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS client_stats_by_tenant AS
SELECT 
  tenant_id,
  COUNT(*) as total_clients,
  COUNT(*) FILTER (WHERE status = 'ativo') as ativos,
  COUNT(*) FILTER (WHERE status = 'inadimplente') as inadimplentes,
  COUNT(*) FILTER (WHERE status = 'onboarding') as onboarding,
  COUNT(*) FILTER (WHERE status = 'inativo') as inativos,
  COUNT(*) FILTER (WHERE regime_tributario = 'MEI') as mei,
  COUNT(*) FILTER (WHERE regime_tributario = 'Simples') as simples,
  COUNT(*) FILTER (WHERE regime_tributario = 'Presumido') as presumido,
  COUNT(*) FILTER (WHERE regime_tributario = 'Real') as real,
  MAX(ultima_atividade) as ultima_atividade_geral,
  NOW() as updated_at
FROM clients
GROUP BY tenant_id;

-- Índice único para refresh concorrente
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_stats_tenant 
  ON client_stats_by_tenant(tenant_id);

-- ============================================================================
-- PARTE 6: Função para refresh da view materializada
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_client_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY client_stats_by_tenant;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 7: Trigger para atualizar ultima_atividade automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_client_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_atividade := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_client_activity ON clients;
CREATE TRIGGER update_client_activity
  BEFORE UPDATE ON clients
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION trigger_update_client_activity();

-- ============================================================================
-- PARTE 8: Função para derivar status inadimplente (preparação futura)
-- ============================================================================

-- Função que será usada quando o módulo financeiro estiver pronto
CREATE OR REPLACE FUNCTION get_client_status_with_financial(client_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  current_status VARCHAR(20);
  has_overdue BOOLEAN;
BEGIN
  -- Buscar status atual
  SELECT status INTO current_status FROM clients WHERE id = client_id;
  
  -- Verificar se existe tabela contas_a_receber (módulo financeiro)
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'contas_a_receber'
  ) THEN
    -- Verificar se há contas em atraso
    EXECUTE format('
      SELECT EXISTS(
        SELECT 1 FROM contas_a_receber 
        WHERE client_id = %L 
        AND status = ''pendente''
        AND vencimento < CURRENT_DATE
      )', client_id) INTO has_overdue;
    
    -- Se tem atraso, retornar inadimplente
    IF has_overdue THEN
      RETURN 'inadimplente';
    END IF;
  END IF;
  
  -- Caso contrário, retornar status atual
  RETURN current_status;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 9: Comentários e documentação
-- ============================================================================

COMMENT ON COLUMN clients.document_norm IS 'Documento normalizado (somente dígitos) para garantir unicidade';
COMMENT ON COLUMN clients.tipo_pessoa IS 'Tipo de pessoa: PF (Física) ou PJ (Jurídica)';
COMMENT ON COLUMN clients.regime_tributario IS 'Regime tributário: MEI, Simples, Presumido, Real';
COMMENT ON COLUMN clients.inscricao_estadual IS 'Inscrição Estadual (IE)';
COMMENT ON COLUMN clients.inscricao_municipal IS 'Inscrição Municipal (IM)';
COMMENT ON COLUMN clients.dia_vencimento IS 'Dia do mês para vencimento de cobranças (1-31)';
COMMENT ON COLUMN clients.valor_plano IS 'Valor mensal do plano contratado';
COMMENT ON COLUMN clients.forma_cobranca IS 'Forma de cobrança: boleto, pix, cartao';
COMMENT ON COLUMN clients.ultima_atividade IS 'Data/hora da última atividade do cliente';
COMMENT ON COLUMN clients.score_risco IS 'Score de risco do cliente (0-100)';

COMMENT ON MATERIALIZED VIEW client_stats_by_tenant IS 'View materializada com estatísticas agregadas de clientes por tenant (atualizar via refresh_client_stats())';

COMMENT ON FUNCTION normalize_document(TEXT) IS 'Remove caracteres não-numéricos de CPF/CNPJ';
COMMENT ON FUNCTION refresh_client_stats() IS 'Atualiza a view materializada client_stats_by_tenant';
COMMENT ON FUNCTION get_client_status_with_financial(UUID) IS 'Retorna status do cliente considerando inadimplência (quando módulo financeiro estiver ativo)';

-- ============================================================================
-- PARTE 10: Refresh inicial da view materializada
-- ============================================================================

SELECT refresh_client_stats();

