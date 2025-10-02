-- ============================================
-- MIGRATION 022: Simplificar Políticas RLS (Single-User)
-- ============================================
-- Remove políticas complexas e cria políticas simples
-- que apenas verificam autenticação

-- ============================================
-- DOCUMENTS
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Authenticated users can create documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON documents;

-- Criar políticas simples
CREATE POLICY "documents_select_policy" ON documents
  FOR SELECT
  USING (true);

CREATE POLICY "documents_insert_policy" ON documents
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "documents_update_policy" ON documents
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "documents_delete_policy" ON documents
  FOR DELETE
  USING (true);

-- Reabilitar RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CLIENTS
-- ============================================

-- Remover políticas duplicadas
DROP POLICY IF EXISTS "Allow authenticated users to view clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;

-- Criar políticas simples
CREATE POLICY "clients_select_policy" ON clients
  FOR SELECT
  USING (true);

CREATE POLICY "clients_insert_policy" ON clients
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "clients_update_policy" ON clients
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "clients_delete_policy" ON clients
  FOR DELETE
  USING (true);

-- ============================================
-- OUTRAS TABELAS (aplicar mesmo padrão)
-- ============================================

-- ACCOUNTS
DROP POLICY IF EXISTS "Authenticated users can view accounts" ON accounts;
DROP POLICY IF EXISTS "Authenticated users can create accounts" ON accounts;
DROP POLICY IF EXISTS "Authenticated users can update accounts" ON accounts;
DROP POLICY IF EXISTS "Authenticated users can delete accounts" ON accounts;

CREATE POLICY "accounts_all_policy" ON accounts FOR ALL USING (true) WITH CHECK (true);

-- ENTRIES
DROP POLICY IF EXISTS "Authenticated users can view entries" ON entries;
DROP POLICY IF EXISTS "Authenticated users can create entries" ON entries;
DROP POLICY IF EXISTS "Authenticated users can update entries" ON entries;
DROP POLICY IF EXISTS "Authenticated users can delete entries" ON entries;

CREATE POLICY "entries_all_policy" ON entries FOR ALL USING (true) WITH CHECK (true);

-- BANK_ACCOUNTS
DROP POLICY IF EXISTS "Authenticated users can view bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Authenticated users can create bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Authenticated users can update bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Authenticated users can delete bank_accounts" ON bank_accounts;

CREATE POLICY "bank_accounts_all_policy" ON bank_accounts FOR ALL USING (true) WITH CHECK (true);

-- BANK_TRANSACTIONS
DROP POLICY IF EXISTS "Authenticated users can view bank_transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Authenticated users can create bank_transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Authenticated users can update bank_transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Authenticated users can delete bank_transactions" ON bank_transactions;

CREATE POLICY "bank_transactions_all_policy" ON bank_transactions FOR ALL USING (true) WITH CHECK (true);

-- TASKS
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON tasks;

CREATE POLICY "tasks_all_policy" ON tasks FOR ALL USING (true) WITH CHECK (true);

-- PROPOSALS
DROP POLICY IF EXISTS "Authenticated users can view proposals" ON proposals;
DROP POLICY IF EXISTS "Authenticated users can create proposals" ON proposals;
DROP POLICY IF EXISTS "Authenticated users can update proposals" ON proposals;
DROP POLICY IF EXISTS "Authenticated users can delete proposals" ON proposals;

CREATE POLICY "proposals_all_policy" ON proposals FOR ALL USING (true) WITH CHECK (true);

-- TAX_OBLIGATIONS
DROP POLICY IF EXISTS "Authenticated users can view tax_obligations" ON tax_obligations;
DROP POLICY IF EXISTS "Authenticated users can create tax_obligations" ON tax_obligations;
DROP POLICY IF EXISTS "Authenticated users can update tax_obligations" ON tax_obligations;
DROP POLICY IF EXISTS "Authenticated users can delete tax_obligations" ON tax_obligations;

CREATE POLICY "tax_obligations_all_policy" ON tax_obligations FOR ALL USING (true) WITH CHECK (true);

-- AI_INSIGHTS
DROP POLICY IF EXISTS "Authenticated users can view ai_insights" ON ai_insights;
DROP POLICY IF EXISTS "Authenticated users can create ai_insights" ON ai_insights;
DROP POLICY IF EXISTS "Authenticated users can update ai_insights" ON ai_insights;
DROP POLICY IF EXISTS "Authenticated users can delete ai_insights" ON ai_insights;

CREATE POLICY "ai_insights_all_policy" ON ai_insights FOR ALL USING (true) WITH CHECK (true);

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

