-- Politicas RLS para tabela tenants
-- Usuarios so podem ver/editar tenants aos quais pertencem

-- SELECT: Ver apenas tenants aos quais o usuario pertence
CREATE POLICY "Users can view their tenants" ON tenants
  FOR SELECT
  USING (
    id IN (
      SELECT tenant_id 
      FROM user_tenants 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- INSERT: Apenas service role pode criar tenants
CREATE POLICY "Only service role can create tenants" ON tenants
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- UPDATE: Apenas owners e admins podem atualizar tenants
CREATE POLICY "Owners and admins can update tenants" ON tenants
  FOR UPDATE
  USING (
    id IN (
      SELECT tenant_id 
      FROM user_tenants 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- DELETE: Apenas owners podem deletar tenants
CREATE POLICY "Only owners can delete tenants" ON tenants
  FOR DELETE
  USING (
    id IN (
      SELECT tenant_id 
      FROM user_tenants 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
      AND status = 'active'
    )
  );
