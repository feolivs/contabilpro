-- ============================================
-- Migration 018: Políticas para Edge Functions
-- ============================================
-- Permite que Edge Functions (usando service role) atualizem documentos
-- sem depender de current_tenant_id()

-- ============================================
-- 1. Criar política para service role atualizar documentos
-- ============================================

-- Remover política antiga de UPDATE (se existir)
DROP POLICY IF EXISTS "Users can update documents from their tenant" ON documents;

-- Criar nova política de UPDATE que permite:
-- 1. Usuários autenticados atualizarem seus próprios documentos
-- 2. Service role (Edge Functions) atualizarem qualquer documento
CREATE POLICY "Users and service role can update documents" ON documents
  FOR UPDATE
  USING (
    -- Service role pode atualizar qualquer documento
    auth.role() = 'service_role'
    OR
    -- Usuários autenticados podem atualizar documentos do próprio tenant
    (auth.role() = 'authenticated' AND tenant_id = current_tenant_id())
  )
  WITH CHECK (
    -- Service role pode atualizar qualquer documento
    auth.role() = 'service_role'
    OR
    -- Usuários autenticados podem atualizar documentos do próprio tenant
    (auth.role() = 'authenticated' AND tenant_id = current_tenant_id())
  );

-- ============================================
-- 2. Criar política para service role criar AI Insights
-- ============================================

-- Verificar se RLS está habilitado em ai_insights
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view ai_insights from their tenant" ON ai_insights;
DROP POLICY IF EXISTS "Users can create ai_insights in their tenant" ON ai_insights;
DROP POLICY IF EXISTS "Users can update ai_insights from their tenant" ON ai_insights;

-- SELECT: Ver apenas insights do próprio tenant
CREATE POLICY "Users can view ai_insights from their tenant" ON ai_insights
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR
    (auth.role() = 'authenticated' AND tenant_id = current_tenant_id())
  );

-- INSERT: Service role e usuários podem criar insights
CREATE POLICY "Service role and users can create ai_insights" ON ai_insights
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (auth.role() = 'authenticated' AND tenant_id = current_tenant_id())
  );

-- UPDATE: Service role e usuários podem atualizar insights
CREATE POLICY "Service role and users can update ai_insights" ON ai_insights
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR
    (auth.role() = 'authenticated' AND tenant_id = current_tenant_id())
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (auth.role() = 'authenticated' AND tenant_id = current_tenant_id())
  );

-- ============================================
-- 3. Criar política para service role criar eventos
-- ============================================

-- Verificar se RLS está habilitado em document_events
ALTER TABLE document_events ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view document_events from their tenant" ON document_events;
DROP POLICY IF EXISTS "Users can create document_events in their tenant" ON document_events;

-- SELECT: Ver apenas eventos do próprio tenant
CREATE POLICY "Users can view document_events from their tenant" ON document_events
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR
    (auth.role() = 'authenticated' AND tenant_id = current_tenant_id())
  );

-- INSERT: Service role e usuários podem criar eventos
CREATE POLICY "Service role and users can create document_events" ON document_events
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (auth.role() = 'authenticated' AND tenant_id = current_tenant_id())
  );

-- ============================================
-- 4. Comentários
-- ============================================

COMMENT ON POLICY "Users and service role can update documents" ON documents IS
  'Permite que Edge Functions (service role) atualizem documentos durante processamento, e usuários atualizem documentos do próprio tenant';

COMMENT ON POLICY "Service role and users can create ai_insights" ON ai_insights IS
  'Permite que Edge Functions criem AI Insights durante processamento automático';

COMMENT ON POLICY "Service role and users can create document_events" ON document_events IS
  'Permite que Edge Functions registrem eventos de auditoria durante processamento';

