-- Politicas RLS para tabela users
-- Usuarios podem ver outros usuarios do mesmo tenant

-- SELECT: Ver usuarios do mesmo tenant
CREATE POLICY "Users can view users from same tenant" ON users
  FOR SELECT
  USING (
    id = auth.uid() OR -- Sempre pode ver a si mesmo
    id IN (
      SELECT DISTINCT u.user_id
      FROM user_tenants u
      INNER JOIN user_tenants my_tenants ON u.tenant_id = my_tenants.tenant_id
      WHERE my_tenants.user_id = auth.uid()
      AND u.status = 'active'
      AND my_tenants.status = 'active'
    )
  );

-- INSERT: Apenas service role pode criar usuarios (via auth)
CREATE POLICY "Only service role can create users" ON users
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- UPDATE: Usuarios podem atualizar apenas seus proprios dados
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE
  USING (id = auth.uid());

-- DELETE: Apenas service role pode deletar usuarios
CREATE POLICY "Only service role can delete users" ON users
  FOR DELETE
  USING (auth.role() = 'service_role');
