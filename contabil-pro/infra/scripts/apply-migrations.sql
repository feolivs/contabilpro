-- Script para aplicar todas as migracoes em ordem
-- Execute este arquivo no Supabase SQL Editor ou via CLI

-- 1. Criar tabelas base
\i migrations/001_create_tenants.sql
\i migrations/002_create_users.sql
\i migrations/003_create_user_tenants.sql
\i migrations/004_create_clients.sql
\i migrations/005_create_accounts.sql
\i migrations/006_create_entries.sql
\i migrations/007_create_documents.sql
\i migrations/008_create_additional_tables.sql

-- 2. Aplicar politicas RLS
\i policies/001_enable_rls.sql
\i policies/002_tenant_policies.sql
\i policies/003_user_policies.sql
\i policies/004_main_tables_policies.sql
\i policies/005_additional_tables_policies.sql

-- 3. Inserir dados de exemplo (opcional)
\i seeds/001_sample_data.sql

-- Verificar se RLS esta habilitado em todas as tabelas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'tenants', 'users', 'user_tenants', 'clients', 'accounts', 
  'entries', 'documents', 'bank_accounts', 'bank_transactions',
  'tax_obligations', 'tasks', 'proposals', 'ai_insights'
)
ORDER BY tablename;
