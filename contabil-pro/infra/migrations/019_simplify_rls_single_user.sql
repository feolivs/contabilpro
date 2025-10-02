-- ============================================================================
-- Migration 019: Simplificar RLS para sistema single-user
-- ============================================================================
-- Objetivo: Remover complexidade de multi-tenant e usar apenas autenticação básica
-- ============================================================================

-- ============================================================================
-- PARTE 1: Remover políticas RLS antigas baseadas em tenant_id
-- ============================================================================

-- CLIENTS
DROP POLICY IF EXISTS "Users can view clients from their tenant" ON clients;
DROP POLICY IF EXISTS "Users can create clients in their tenant" ON clients;
DROP POLICY IF EXISTS "Users can update clients from their tenant" ON clients;
DROP POLICY IF EXISTS "Admins can delete clients from their tenant" ON clients;

-- DOCUMENTS
DROP POLICY IF EXISTS "Users can view documents from their tenant" ON documents;
DROP POLICY IF EXISTS "Users can create documents in their tenant" ON documents;
DROP POLICY IF EXISTS "Users can update documents from their tenant" ON documents;
DROP POLICY IF EXISTS "Users and service role can update documents" ON documents;
DROP POLICY IF EXISTS "Admins can delete documents from their tenant" ON documents;

-- ACCOUNTS
DROP POLICY IF EXISTS "Users can view accounts from their tenant" ON accounts;
DROP POLICY IF EXISTS "Managers can create accounts in their tenant" ON accounts;
DROP POLICY IF EXISTS "Managers can update accounts from their tenant" ON accounts;
DROP POLICY IF EXISTS "Admins can delete accounts from their tenant" ON accounts;

-- ENTRIES
DROP POLICY IF EXISTS "Users can view entries from their tenant" ON entries;
DROP POLICY IF EXISTS "Accountants can create entries in their tenant" ON entries;

-- BANK_ACCOUNTS
DROP POLICY IF EXISTS "Users can view bank accounts from their tenant" ON bank_accounts;
DROP POLICY IF EXISTS "Managers can create bank accounts in their tenant" ON bank_accounts;
DROP POLICY IF EXISTS "Managers can update bank accounts from their tenant" ON bank_accounts;
DROP POLICY IF EXISTS "Admins can delete bank accounts from their tenant" ON bank_accounts;

-- BANK_TRANSACTIONS
DROP POLICY IF EXISTS "Users can view bank transactions from their tenant" ON bank_transactions;
DROP POLICY IF EXISTS "System can create bank transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Accountants can update bank transactions from their tenant" ON bank_transactions;

-- TAX_OBLIGATIONS
DROP POLICY IF EXISTS "Accountants can manage tax obligations in their tenant" ON tax_obligations;

-- TASKS
DROP POLICY IF EXISTS "Users can view tasks from their tenant" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their tenant" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks from their tenant" ON tasks;
DROP POLICY IF EXISTS "Task assignees can update their tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can delete tasks from their tenant" ON tasks;

-- PROPOSALS
DROP POLICY IF EXISTS "Users can view proposals from their tenant" ON proposals;
DROP POLICY IF EXISTS "Managers can create proposals in their tenant" ON proposals;
DROP POLICY IF EXISTS "Managers can update proposals from their tenant" ON proposals;
DROP POLICY IF EXISTS "Admins can delete proposals from their tenant" ON proposals;

-- AI_INSIGHTS
DROP POLICY IF EXISTS "Users can view AI insights from their tenant" ON ai_insights;
DROP POLICY IF EXISTS "System can create AI insights" ON ai_insights;
DROP POLICY IF EXISTS "Accountants can update AI insights from their tenant" ON ai_insights;

-- ============================================================================
-- PARTE 2: Criar políticas RLS simples (apenas autenticação)
-- ============================================================================

-- CLIENTS: Usuários autenticados podem fazer tudo
CREATE POLICY "Authenticated users can view clients" ON clients
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create clients" ON clients
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clients" ON clients
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete clients" ON clients
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- DOCUMENTS: Usuários autenticados podem fazer tudo
CREATE POLICY "Authenticated users can view documents" ON documents
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create documents" ON documents
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update documents" ON documents
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete documents" ON documents
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ACCOUNTS: Usuários autenticados podem fazer tudo
CREATE POLICY "Authenticated users can manage accounts" ON accounts
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ENTRIES: Usuários autenticados podem ver e criar (entries são imutáveis)
CREATE POLICY "Authenticated users can view entries" ON entries
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create entries" ON entries
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- BANK_ACCOUNTS: Usuários autenticados podem fazer tudo
CREATE POLICY "Authenticated users can manage bank accounts" ON bank_accounts
  FOR ALL
  USING (auth.role() = 'authenticated');

-- BANK_TRANSACTIONS: Usuários autenticados podem fazer tudo
CREATE POLICY "Authenticated users can manage bank transactions" ON bank_transactions
  FOR ALL
  USING (auth.role() = 'authenticated');

-- TAX_OBLIGATIONS: Usuários autenticados podem fazer tudo
CREATE POLICY "Authenticated users can manage tax obligations" ON tax_obligations
  FOR ALL
  USING (auth.role() = 'authenticated');

-- TASKS: Usuários autenticados podem fazer tudo
CREATE POLICY "Authenticated users can manage tasks" ON tasks
  FOR ALL
  USING (auth.role() = 'authenticated');

-- PROPOSALS: Usuários autenticados podem fazer tudo
CREATE POLICY "Authenticated users can manage proposals" ON proposals
  FOR ALL
  USING (auth.role() = 'authenticated');

-- AI_INSIGHTS: Usuários autenticados podem fazer tudo
CREATE POLICY "Authenticated users can manage ai insights" ON ai_insights
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- PARTE 3: Comentários e documentação
-- ============================================================================

COMMENT ON TABLE clients IS 'Tabela de clientes - RLS simplificado para single-user';
COMMENT ON TABLE documents IS 'Tabela de documentos - RLS simplificado para single-user';
COMMENT ON TABLE accounts IS 'Tabela de contas contábeis - RLS simplificado para single-user';
COMMENT ON TABLE entries IS 'Tabela de lançamentos - RLS simplificado para single-user';
COMMENT ON TABLE bank_accounts IS 'Tabela de contas bancárias - RLS simplificado para single-user';
COMMENT ON TABLE bank_transactions IS 'Tabela de transações bancárias - RLS simplificado para single-user';
COMMENT ON TABLE tax_obligations IS 'Tabela de obrigações fiscais - RLS simplificado para single-user';
COMMENT ON TABLE tasks IS 'Tabela de tarefas - RLS simplificado para single-user';
COMMENT ON TABLE proposals IS 'Tabela de propostas - RLS simplificado para single-user';
COMMENT ON TABLE ai_insights IS 'Tabela de insights de IA - RLS simplificado para single-user';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN (
  'clients', 'documents', 'accounts', 'entries', 
  'bank_accounts', 'bank_transactions', 'tax_obligations',
  'tasks', 'proposals', 'ai_insights'
)
ORDER BY tablename, cmd;

