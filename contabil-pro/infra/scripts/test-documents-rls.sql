-- ============================================
-- TESTE DE RLS: Módulo de Documentos
-- ============================================
-- Script para validar isolamento multi-tenant
-- na tabela documents após aplicação da migration 016

-- ============================================
-- SETUP: Criar dados de teste
-- ============================================

-- Limpar dados de teste anteriores
DELETE FROM documents WHERE name LIKE 'TEST_%';

-- Criar tenants de teste (se não existirem)
INSERT INTO tenants (id, name, slug, document, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Tenant A Test', 'tenant-a-test', '11111111000111', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Tenant B Test', 'tenant-b-test', '22222222000122', 'active')
ON CONFLICT (id) DO NOTHING;

-- Criar usuários de teste (se não existirem)
INSERT INTO users (id, email, name, status)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user-a@test.com', 'User A', 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user-b@test.com', 'User B', 'active')
ON CONFLICT (id) DO NOTHING;

-- Criar relacionamentos user-tenant
INSERT INTO user_tenants (user_id, tenant_id, role, status)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin', 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'admin', 'active')
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Criar documentos de teste
INSERT INTO documents (
  tenant_id, 
  name, 
  original_name, 
  path, 
  hash, 
  size, 
  mime_type, 
  uploaded_by
)
VALUES 
  -- Documentos do Tenant A
  (
    '11111111-1111-1111-1111-111111111111',
    'TEST_DOC_A1.pdf',
    'TEST_DOC_A1.pdf',
    '11111111-1111-1111-1111-111111111111/other/2025/abc123-test.pdf',
    'hash_a1_' || md5(random()::text),
    1024,
    'application/pdf',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'TEST_DOC_A2.pdf',
    'TEST_DOC_A2.pdf',
    '11111111-1111-1111-1111-111111111111/other/2025/def456-test.pdf',
    'hash_a2_' || md5(random()::text),
    2048,
    'application/pdf',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  -- Documentos do Tenant B
  (
    '22222222-2222-2222-2222-222222222222',
    'TEST_DOC_B1.pdf',
    'TEST_DOC_B1.pdf',
    '22222222-2222-2222-2222-222222222222/other/2025/ghi789-test.pdf',
    'hash_b1_' || md5(random()::text),
    3072,
    'application/pdf',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'TEST_DOC_B2.pdf',
    'TEST_DOC_B2.pdf',
    '22222222-2222-2222-2222-222222222222/other/2025/jkl012-test.pdf',
    'hash_b2_' || md5(random()::text),
    4096,
    'application/pdf',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  );

-- ============================================
-- TESTES DE ISOLAMENTO
-- ============================================

-- Função para executar testes
CREATE OR REPLACE FUNCTION test_documents_rls()
RETURNS TABLE(
  test_number INT,
  test_name TEXT,
  expected INT,
  actual INT,
  result TEXT
) AS $$
DECLARE
  tenant_a_id UUID := '11111111-1111-1111-1111-111111111111';
  tenant_b_id UUID := '22222222-2222-2222-2222-222222222222';
  doc_count INT;
BEGIN
  -- ============================================
  -- TESTE 1: Usuário do Tenant A vê apenas seus documentos
  -- ============================================
  PERFORM set_config('request.jwt.claims', 
    json_build_object('tenant_id', tenant_a_id)::text, 
    false);
  
  SELECT COUNT(*) INTO doc_count 
  FROM documents 
  WHERE name LIKE 'TEST_%';
  
  RETURN QUERY SELECT 
    1,
    'Tenant A vê apenas seus documentos'::TEXT,
    2,
    doc_count,
    CASE WHEN doc_count = 2 THEN '✅ PASS' ELSE '❌ FAIL' END;

  -- ============================================
  -- TESTE 2: Usuário do Tenant B vê apenas seus documentos
  -- ============================================
  PERFORM set_config('request.jwt.claims', 
    json_build_object('tenant_id', tenant_b_id)::text, 
    false);
  
  SELECT COUNT(*) INTO doc_count 
  FROM documents 
  WHERE name LIKE 'TEST_%';
  
  RETURN QUERY SELECT 
    2,
    'Tenant B vê apenas seus documentos'::TEXT,
    2,
    doc_count,
    CASE WHEN doc_count = 2 THEN '✅ PASS' ELSE '❌ FAIL' END;

  -- ============================================
  -- TESTE 3: Sem contexto de tenant retorna 0
  -- ============================================
  PERFORM set_config('request.jwt.claims', NULL, false);
  
  SELECT COUNT(*) INTO doc_count 
  FROM documents 
  WHERE name LIKE 'TEST_%';
  
  RETURN QUERY SELECT 
    3,
    'Sem contexto retorna 0 documentos'::TEXT,
    0,
    doc_count,
    CASE WHEN doc_count = 0 THEN '✅ PASS' ELSE '❌ FAIL' END;

  -- ============================================
  -- TESTE 4: Tenant A não pode ver documentos do Tenant B
  -- ============================================
  PERFORM set_config('request.jwt.claims', 
    json_build_object('tenant_id', tenant_a_id)::text, 
    false);
  
  SELECT COUNT(*) INTO doc_count 
  FROM documents 
  WHERE name LIKE 'TEST_DOC_B%';
  
  RETURN QUERY SELECT 
    4,
    'Tenant A não vê documentos do Tenant B'::TEXT,
    0,
    doc_count,
    CASE WHEN doc_count = 0 THEN '✅ PASS' ELSE '❌ FAIL' END;

  -- ============================================
  -- TESTE 5: Tenant B não pode ver documentos do Tenant A
  -- ============================================
  PERFORM set_config('request.jwt.claims', 
    json_build_object('tenant_id', tenant_b_id)::text, 
    false);
  
  SELECT COUNT(*) INTO doc_count 
  FROM documents 
  WHERE name LIKE 'TEST_DOC_A%';
  
  RETURN QUERY SELECT 
    5,
    'Tenant B não vê documentos do Tenant A'::TEXT,
    0,
    doc_count,
    CASE WHEN doc_count = 0 THEN '✅ PASS' ELSE '❌ FAIL' END;

  -- ============================================
  -- TESTE 6: INSERT com tenant_id correto funciona
  -- ============================================
  PERFORM set_config('request.jwt.claims', 
    json_build_object('tenant_id', tenant_a_id)::text, 
    false);
  
  BEGIN
    INSERT INTO documents (
      tenant_id, name, original_name, path, hash, size, mime_type, uploaded_by
    ) VALUES (
      tenant_a_id,
      'TEST_INSERT_A.pdf',
      'TEST_INSERT_A.pdf',
      tenant_a_id::text || '/other/2025/test-insert.pdf',
      'hash_insert_' || md5(random()::text),
      1024,
      'application/pdf',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    );
    
    RETURN QUERY SELECT 
      6,
      'INSERT com tenant_id correto funciona'::TEXT,
      1,
      1,
      '✅ PASS'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      6,
      'INSERT com tenant_id correto funciona'::TEXT,
      1,
      0,
      '❌ FAIL: ' || SQLERRM;
  END;

  -- ============================================
  -- TESTE 7: INSERT com tenant_id errado falha
  -- ============================================
  PERFORM set_config('request.jwt.claims', 
    json_build_object('tenant_id', tenant_a_id)::text, 
    false);
  
  BEGIN
    INSERT INTO documents (
      tenant_id, name, original_name, path, hash, size, mime_type, uploaded_by
    ) VALUES (
      tenant_b_id, -- ❌ Tentando inserir no Tenant B
      'TEST_HACK_B.pdf',
      'TEST_HACK_B.pdf',
      tenant_b_id::text || '/other/2025/test-hack.pdf',
      'hash_hack_' || md5(random()::text),
      1024,
      'application/pdf',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    );
    
    RETURN QUERY SELECT 
      7,
      'INSERT com tenant_id errado falha'::TEXT,
      0,
      1,
      '❌ FAIL: Deveria ter falhado!'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      7,
      'INSERT com tenant_id errado falha'::TEXT,
      0,
      0,
      '✅ PASS'::TEXT;
  END;

END;
$$ LANGUAGE plpgsql;

-- ============================================
-- EXECUTAR TESTES
-- ============================================
SELECT * FROM test_documents_rls();

-- ============================================
-- CLEANUP: Remover dados de teste
-- ============================================
DELETE FROM documents WHERE name LIKE 'TEST_%';
DELETE FROM user_tenants WHERE user_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
DELETE FROM users WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
DELETE FROM tenants WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

-- Remover função de teste
DROP FUNCTION IF EXISTS test_documents_rls();

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Todos os testes devem retornar ✅ PASS
-- 
-- test_number | test_name                                    | expected | actual | result
-- ------------|----------------------------------------------|----------|--------|----------
--           1 | Tenant A vê apenas seus documentos           |        2 |      2 | ✅ PASS
--           2 | Tenant B vê apenas seus documentos           |        2 |      2 | ✅ PASS
--           3 | Sem contexto retorna 0 documentos            |        0 |      0 | ✅ PASS
--           4 | Tenant A não vê documentos do Tenant B       |        0 |      0 | ✅ PASS
--           5 | Tenant B não vê documentos do Tenant A       |        0 |      0 | ✅ PASS
--           6 | INSERT com tenant_id correto funciona        |        1 |      1 | ✅ PASS
--           7 | INSERT com tenant_id errado falha            |        0 |      0 | ✅ PASS

