-- ============================================
-- MIGRATION 016: RLS Policies para Tabela Documents
-- ============================================
-- Habilita Row Level Security na tabela documents
-- e cria políticas para isolamento multi-tenant

-- ============================================
-- PARTE 1: Habilitar RLS
-- ============================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 2: Remover Políticas Antigas (se existirem)
-- ============================================
DROP POLICY IF EXISTS "Users can view documents from their tenant" ON documents;
DROP POLICY IF EXISTS "Users can create documents in their tenant" ON documents;
DROP POLICY IF EXISTS "Users can update documents from their tenant" ON documents;
DROP POLICY IF EXISTS "Admins can delete documents from their tenant" ON documents;

-- ============================================
-- PARTE 3: Criar Políticas RLS
-- ============================================

-- SELECT: Ver apenas documentos do próprio tenant
CREATE POLICY "Users can view documents from their tenant" ON documents
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- INSERT: Criar apenas no próprio tenant
CREATE POLICY "Users can create documents in their tenant" ON documents
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

-- UPDATE: Atualizar apenas documentos do próprio tenant
CREATE POLICY "Users can update documents from their tenant" ON documents
  FOR UPDATE
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- DELETE: Apenas admin/owner podem deletar (e apenas do próprio tenant)
CREATE POLICY "Admins can delete documents from their tenant" ON documents
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

-- ============================================
-- PARTE 4: Comentários
-- ============================================
COMMENT ON POLICY "Users can view documents from their tenant" ON documents IS 
'Permite que usuários visualizem documentos do seu tenant';

COMMENT ON POLICY "Users can create documents in their tenant" ON documents IS 
'Permite que usuários criem documentos no seu tenant';

COMMENT ON POLICY "Users can update documents from their tenant" ON documents IS 
'Permite que usuários atualizem documentos do seu tenant';

COMMENT ON POLICY "Admins can delete documents from their tenant" ON documents IS 
'Apenas admin/owner podem deletar documentos do seu tenant';

