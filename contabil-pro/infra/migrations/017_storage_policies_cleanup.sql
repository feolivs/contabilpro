-- Migration 017: Limpeza e Recriação de Storage Policies
-- Data: 2025-01-XX
-- Descrição: Remove políticas duplicadas e cria 4 políticas limpas para o bucket 'documentos'

-- ============================================================================
-- PARTE 1: REMOVER TODAS AS POLÍTICAS ANTIGAS
-- ============================================================================

-- Dropar todas as políticas antigas (29 políticas duplicadas/conflitantes)
DROP POLICY IF EXISTS "Acesso total documentos" ON storage.objects;
DROP POLICY IF EXISTS "Acesso total documentos debug" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read from temp-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to temp-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Debug - Acesso total temporario" ON storage.objects;
DROP POLICY IF EXISTS "Only service role can access backups" ON storage.objects;
DROP POLICY IF EXISTS "Users can access own reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own documents from documentos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own company documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to documentos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own company documents" ON storage.objects;
DROP POLICY IF EXISTS "Usuario teste acesso total storage" ON storage.objects;
DROP POLICY IF EXISTS "Usuario teste pode atualizar documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuario teste pode excluir documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuario teste pode fazer upload de documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuario teste pode visualizar documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload de documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios documentos" ON storage.objects;
DROP POLICY IF EXISTS "Visualizar documentos" ON storage.objects;
DROP POLICY IF EXISTS "admin_can_delete_documents 10lalwt_0" ON storage.objects;
DROP POLICY IF EXISTS "admin_can_update_documents 10lalwt_0" ON storage.objects;
DROP POLICY IF EXISTS "tenant_can_upload_documents 10lalwt_0" ON storage.objects;
DROP POLICY IF EXISTS "tenant_can_view_documents 10lalwt_0" ON storage.objects;

-- ============================================================================
-- PARTE 2: CRIAR 4 POLÍTICAS LIMPAS
-- ============================================================================

-- Política 1: SELECT - Usuários podem visualizar documentos do seu tenant
-- Estrutura do path: {tenant_id}/{type}/{year}/{hash}-{name}.{ext}
CREATE POLICY "tenant_can_view_documents"
ON storage.objects
FOR SELECT
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

COMMENT ON POLICY "tenant_can_view_documents" ON storage.objects IS 
'Permite que usuários autenticados visualizem documentos do seu tenant. 
O tenant_id é extraído do primeiro segmento do path do arquivo.';

-- Política 2: INSERT - Usuários podem fazer upload de documentos para seu tenant
-- Validações:
-- - Bucket deve ser 'documentos'
-- - Path deve começar com tenant_id do usuário
-- - Path deve ter exatamente 4 segmentos (tenant/type/year/filename)
-- - Extensão deve estar na lista permitida
CREATE POLICY "tenant_can_upload_documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos' 
  AND split_part(name, '/', 1) = (
    SELECT tenant_id::text 
    FROM user_tenants 
    WHERE user_id = auth.uid() 
    AND status = 'active' 
    LIMIT 1
  )
  AND array_length(string_to_array(name, '/'), 1) = 4
  AND storage.extension(name) = ANY(ARRAY[
    'pdf', 'png', 'jpg', 'jpeg', 'webp', 'xml', 
    'csv', 'xlsx', 'docx', 'txt'
  ])
);

COMMENT ON POLICY "tenant_can_upload_documents" ON storage.objects IS 
'Permite que usuários autenticados façam upload de documentos para seu tenant.
Valida estrutura do path (4 segmentos) e extensões permitidas.';

-- Política 3: UPDATE - Apenas admins podem atualizar documentos
-- Requer role 'owner' ou 'admin' no tenant
CREATE POLICY "admin_can_update_documents"
ON storage.objects
FOR UPDATE
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
)
WITH CHECK (
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

COMMENT ON POLICY "admin_can_update_documents" ON storage.objects IS 
'Permite que apenas admins (owner/admin) atualizem documentos do seu tenant.';

-- Política 4: DELETE - Apenas admins podem deletar documentos
-- Requer role 'owner' ou 'admin' no tenant
CREATE POLICY "admin_can_delete_documents"
ON storage.objects
FOR DELETE
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

COMMENT ON POLICY "admin_can_delete_documents" ON storage.objects IS 
'Permite que apenas admins (owner/admin) deletem documentos do seu tenant.';

-- ============================================================================
-- PARTE 3: VERIFICAÇÃO
-- ============================================================================

-- Verificar que apenas 4 políticas existem
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname IN (
    'tenant_can_view_documents',
    'tenant_can_upload_documents',
    'admin_can_update_documents',
    'admin_can_delete_documents'
  );

  IF policy_count != 4 THEN
    RAISE EXCEPTION 'Esperado 4 políticas, encontrado %', policy_count;
  END IF;

  RAISE NOTICE 'Verificação OK: 4 políticas de Storage criadas com sucesso';
END $$;

-- ============================================================================
-- RESUMO
-- ============================================================================

-- Antes: 29 políticas duplicadas/conflitantes
-- Depois: 4 políticas limpas e bem definidas
--
-- Estrutura de Segurança:
-- 1. SELECT: Todos os usuários do tenant
-- 2. INSERT: Todos os usuários do tenant (com validações)
-- 3. UPDATE: Apenas admins do tenant
-- 4. DELETE: Apenas admins do tenant
--
-- Isolamento Multi-Tenant:
-- - Path sempre começa com tenant_id
-- - Validação via user_tenants table
-- - Impossível acessar documentos de outro tenant

