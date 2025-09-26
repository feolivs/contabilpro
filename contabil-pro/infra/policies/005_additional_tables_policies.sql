-- Politicas RLS para tabelas adicionais

-- ============================================================================
-- BANK_ACCOUNTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view bank accounts from their tenant" ON bank_accounts
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "Managers can create bank accounts in their tenant" ON bank_accounts
  FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id() AND
    current_tenant_id() IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
      AND status = 'active'
    )
  );

CREATE POLICY "Managers can update bank accounts from their tenant" ON bank_accounts
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id() AND
    current_tenant_id() IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
      AND status = 'active'
    )
  );

-- ============================================================================
-- BANK_TRANSACTIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view bank transactions from their tenant" ON bank_transactions
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "System can create bank transactions" ON bank_transactions
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Accountants can update bank transactions from their tenant" ON bank_transactions
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id() AND
    current_tenant_id() IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'accountant')
      AND status = 'active'
    )
  );

-- ============================================================================
-- TAX_OBLIGATIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view tax obligations from their tenant" ON tax_obligations
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "Accountants can manage tax obligations in their tenant" ON tax_obligations
  FOR ALL
  USING (
    tenant_id = current_tenant_id() AND
    current_tenant_id() IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'accountant')
      AND status = 'active'
    )
  );

-- ============================================================================
-- TASKS POLICIES
-- ============================================================================

CREATE POLICY "Users can view tasks from their tenant" ON tasks
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "Users can create tasks in their tenant" ON tasks
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Users can update their assigned tasks or created tasks" ON tasks
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id() AND
    (assigned_to = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY "Managers can delete tasks from their tenant" ON tasks
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    (
      created_by = auth.uid() OR
      current_tenant_id() IN (
        SELECT tenant_id FROM user_tenants 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
        AND status = 'active'
      )
    )
  );

-- ============================================================================
-- PROPOSALS POLICIES
-- ============================================================================

CREATE POLICY "Users can view proposals from their tenant" ON proposals
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "Users can create proposals in their tenant" ON proposals
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Users can update their created proposals" ON proposals
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id() AND
    created_by = auth.uid()
  );

CREATE POLICY "Managers can delete proposals from their tenant" ON proposals
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    (
      created_by = auth.uid() OR
      current_tenant_id() IN (
        SELECT tenant_id FROM user_tenants 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
        AND status = 'active'
      )
    )
  );

-- ============================================================================
-- AI_INSIGHTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view AI insights from their tenant" ON ai_insights
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "System can create AI insights" ON ai_insights
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Accountants can update AI insights from their tenant" ON ai_insights
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id() AND
    current_tenant_id() IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'accountant')
      AND status = 'active'
    )
  );

-- ============================================================================
-- USER_TENANTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view their tenant relationships" ON user_tenants
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage user tenant relationships" ON user_tenants
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );
