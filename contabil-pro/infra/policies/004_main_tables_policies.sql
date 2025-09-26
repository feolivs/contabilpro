-- Politicas RLS para tabelas principais com tenant_id

-- ============================================================================
-- CLIENTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view clients from their tenant" ON clients
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "Users can create clients in their tenant" ON clients
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Users can update clients from their tenant" ON clients
  FOR UPDATE
  USING (tenant_id = current_tenant_id());

CREATE POLICY "Admins can delete clients from their tenant" ON clients
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    current_tenant_id() IN (
      SELECT tenant_id 
      FROM user_tenants 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- ============================================================================
-- ACCOUNTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view accounts from their tenant" ON accounts
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "Managers can create accounts in their tenant" ON accounts
  FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id() AND
    current_tenant_id() IN (
      SELECT tenant_id 
      FROM user_tenants 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
      AND status = 'active'
    )
  );

CREATE POLICY "Managers can update accounts from their tenant" ON accounts
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id() AND
    current_tenant_id() IN (
      SELECT tenant_id 
      FROM user_tenants 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can delete accounts from their tenant" ON accounts
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    current_tenant_id() IN (
      SELECT tenant_id 
      FROM user_tenants 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- ============================================================================
-- ENTRIES POLICIES (Ledger Imutavel)
-- ============================================================================

CREATE POLICY "Users can view entries from their tenant" ON entries
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "Accountants can create entries in their tenant" ON entries
  FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id() AND
    current_tenant_id() IN (
      SELECT tenant_id 
      FROM user_tenants 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager', 'accountant')
      AND status = 'active'
    )
  );

-- ENTRIES SAO IMUTAVEIS - Sem UPDATE nem DELETE
-- Ajustes devem gerar novos lancamentos

-- ============================================================================
-- DOCUMENTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view documents from their tenant" ON documents
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "Users can create documents in their tenant" ON documents
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Users can update documents from their tenant" ON documents
  FOR UPDATE
  USING (tenant_id = current_tenant_id());

CREATE POLICY "Admins can delete documents from their tenant" ON documents
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    current_tenant_id() IN (
      SELECT tenant_id 
      FROM user_tenants 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );
