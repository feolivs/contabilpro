-- ============================================
-- MIGRATION 021: Remover Constraints de Tenant (Single-User Mode)
-- ============================================
-- Remove a obrigatoriedade de tenant_id em todas as tabelas
-- para permitir uso single-user sem multi-tenancy

-- Documentos
ALTER TABLE documents ALTER COLUMN tenant_id DROP NOT NULL;

-- Contas Contábeis
ALTER TABLE accounts ALTER COLUMN tenant_id DROP NOT NULL;

-- AI Insights
ALTER TABLE ai_insights ALTER COLUMN tenant_id DROP NOT NULL;

-- Contas Bancárias
ALTER TABLE bank_accounts ALTER COLUMN tenant_id DROP NOT NULL;

-- Transações Bancárias
ALTER TABLE bank_transactions ALTER COLUMN tenant_id DROP NOT NULL;

-- Clientes
ALTER TABLE clients ALTER COLUMN tenant_id DROP NOT NULL;

-- Eventos de Documentos
ALTER TABLE document_events ALTER COLUMN tenant_id DROP NOT NULL;

-- Lançamentos Contábeis
ALTER TABLE entries ALTER COLUMN tenant_id DROP NOT NULL;

-- Chaves de Idempotência
ALTER TABLE idempotency_keys ALTER COLUMN tenant_id DROP NOT NULL;

-- Propostas
ALTER TABLE proposals ALTER COLUMN tenant_id DROP NOT NULL;

-- Tarefas
ALTER TABLE tasks ALTER COLUMN tenant_id DROP NOT NULL;

-- Obrigações Fiscais
ALTER TABLE tax_obligations ALTER COLUMN tenant_id DROP NOT NULL;

-- Relação Usuário-Tenant
ALTER TABLE user_tenants ALTER COLUMN tenant_id DROP NOT NULL;

-- Verificar resultado
SELECT 
  table_name, 
  column_name, 
  is_nullable 
FROM information_schema.columns 
WHERE column_name = 'tenant_id' 
  AND table_schema = 'public' 
ORDER BY table_name;

