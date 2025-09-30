-- ============================================
-- MIGRATION 013: Storage Policies para Documentos
-- ============================================
-- Cria políticas de acesso seguro ao bucket 'documentos'
-- com isolamento multi-tenant

-- ============================================
-- POLÍTICA 1: SELECT (Visualizar Documentos)
-- ============================================
CREATE POLICY "tenant_can_view_documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos'
  AND split_part(name, '/', 1) = (
    SELECT tenant_id::text 
    FROM user_tenants 
    WHERE user_id = auth.uid() 
      AND status = 'active'
    LIMIT 1
  )
);

-- ============================================
-- POLÍTICA 2: INSERT (Upload de Documentos)
-- ============================================
CREATE POLICY "tenant_can_upload_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos'
  -- Validar tenant_id no path
  AND split_part(name, '/', 1) = (
    SELECT tenant_id::text 
    FROM user_tenants 
    WHERE user_id = auth.uid() 
      AND status = 'active'
    LIMIT 1
  )
  -- Validar estrutura de path: tenant/type/year/file
  AND array_length(string_to_array(name, '/'), 1) = 4
  -- Validar extensão permitida
  AND storage.extension(name) = ANY(
    ARRAY['pdf','png','jpg','jpeg','webp','xml','csv','xlsx','docx','txt']
  )
);

-- ============================================
-- POLÍTICA 3: UPDATE (Atualizar Metadados)
-- ============================================
-- Apenas admin/owner podem atualizar
CREATE POLICY "admin_can_update_documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND EXISTS (
    SELECT 1 
    FROM user_tenants
    WHERE user_id = auth.uid()
      AND tenant_id::text = split_part(name, '/', 1)
      AND role IN ('owner', 'admin')
      AND status = 'active'
  )
);

-- ============================================
-- POLÍTICA 4: DELETE (Deletar Documentos)
-- ============================================
-- Apenas admin/owner podem deletar
CREATE POLICY "admin_can_delete_documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND EXISTS (
    SELECT 1 
    FROM user_tenants
    WHERE user_id = auth.uid()
      AND tenant_id::text = split_part(name, '/', 1)
      AND role IN ('owner', 'admin')
      AND status = 'active'
  )
);

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================
COMMENT ON POLICY "tenant_can_view_documents" ON storage.objects IS 
'Permite que usuários visualizem documentos do seu tenant. Path: {tenant_id}/{type}/{year}/{file}';

COMMENT ON POLICY "tenant_can_upload_documents" ON storage.objects IS 
'Permite upload apenas no tenant do usuário, com validação de path e extensão';

COMMENT ON POLICY "admin_can_update_documents" ON storage.objects IS 
'Apenas admin/owner podem atualizar metadados de documentos';

COMMENT ON POLICY "admin_can_delete_documents" ON storage.objects IS 
'Apenas admin/owner podem deletar documentos';

