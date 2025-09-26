-- Script para testar politicas RLS
-- Execute apos aplicar as migracoes

-- Criar dados de teste para validar RLS
DO $$
DECLARE
  tenant1_id UUID := gen_random_uuid();
  tenant2_id UUID := gen_random_uuid();
  user1_id UUID := gen_random_uuid();
  user2_id UUID := gen_random_uuid();
BEGIN
  -- Inserir tenants de teste
  INSERT INTO tenants (id, name, slug, document) VALUES
    (tenant1_id, 'Empresa A', 'empresa-a', '11111111000111'),
    (tenant2_id, 'Empresa B', 'empresa-b', '22222222000222');

  -- Inserir usuarios de teste
  INSERT INTO users (id, email, name) VALUES
    (user1_id, 'user1@empresaa.com', 'Usuario 1'),
    (user2_id, 'user2@empresab.com', 'Usuario 2');

  -- Associar usuarios aos tenants
  INSERT INTO user_tenants (user_id, tenant_id, role) VALUES
    (user1_id, tenant1_id, 'owner'),
    (user2_id, tenant2_id, 'owner');

  -- Inserir clientes de teste
  INSERT INTO clients (tenant_id, name, document, document_type) VALUES
    (tenant1_id, 'Cliente A1', '11111111111', 'cpf'),
    (tenant1_id, 'Cliente A2', '22222222222', 'cpf'),
    (tenant2_id, 'Cliente B1', '33333333333', 'cpf'),
    (tenant2_id, 'Cliente B2', '44444444444', 'cpf');

  RAISE NOTICE 'Dados de teste criados:';
  RAISE NOTICE 'Tenant 1 ID: %', tenant1_id;
  RAISE NOTICE 'Tenant 2 ID: %', tenant2_id;
  RAISE NOTICE 'User 1 ID: %', user1_id;
  RAISE NOTICE 'User 2 ID: %', user2_id;
END $$;

-- Funcao para testar RLS com diferentes usuarios
CREATE OR REPLACE FUNCTION test_rls_isolation()
RETURNS TABLE(test_name TEXT, result TEXT) AS $$
DECLARE
  tenant1_id UUID;
  tenant2_id UUID;
  user1_id UUID;
  user2_id UUID;
  client_count INTEGER;
BEGIN
  -- Obter IDs dos dados de teste
  SELECT id INTO tenant1_id FROM tenants WHERE slug = 'empresa-a';
  SELECT id INTO tenant2_id FROM tenants WHERE slug = 'empresa-b';
  SELECT id INTO user1_id FROM users WHERE email = 'user1@empresaa.com';
  SELECT id INTO user2_id FROM users WHERE email = 'user2@empresab.com';

  -- Teste 1: Simular contexto do usuario 1 (tenant A)
  PERFORM set_claim('tenant_id', tenant1_id::text);
  
  SELECT COUNT(*) INTO client_count FROM clients;
  
  RETURN QUERY SELECT 
    'User 1 can see clients from Tenant A'::TEXT,
    CASE WHEN client_count = 2 THEN 'PASS' ELSE 'FAIL: Expected 2, got ' || client_count END;

  -- Teste 2: Simular contexto do usuario 2 (tenant B)
  PERFORM set_claim('tenant_id', tenant2_id::text);
  
  SELECT COUNT(*) INTO client_count FROM clients;
  
  RETURN QUERY SELECT 
    'User 2 can see clients from Tenant B'::TEXT,
    CASE WHEN client_count = 2 THEN 'PASS' ELSE 'FAIL: Expected 2, got ' || client_count END;

  -- Teste 3: Sem contexto de tenant (deve retornar 0)
  PERFORM set_claim('tenant_id', NULL);
  
  SELECT COUNT(*) INTO client_count FROM clients;
  
  RETURN QUERY SELECT 
    'No tenant context returns no clients'::TEXT,
    CASE WHEN client_count = 0 THEN 'PASS' ELSE 'FAIL: Expected 0, got ' || client_count END;

END;
$$ LANGUAGE plpgsql;

-- Executar testes RLS
SELECT * FROM test_rls_isolation();

-- Limpar dados de teste
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS VOID AS $$
BEGIN
  DELETE FROM clients WHERE tenant_id IN (
    SELECT id FROM tenants WHERE slug IN ('empresa-a', 'empresa-b')
  );
  DELETE FROM user_tenants WHERE tenant_id IN (
    SELECT id FROM tenants WHERE slug IN ('empresa-a', 'empresa-b')
  );
  DELETE FROM users WHERE email IN ('user1@empresaa.com', 'user2@empresab.com');
  DELETE FROM tenants WHERE slug IN ('empresa-a', 'empresa-b');
  
  RAISE NOTICE 'Dados de teste removidos';
END;
$$ LANGUAGE plpgsql;

-- Descomentar para limpar dados de teste
-- SELECT cleanup_test_data();
