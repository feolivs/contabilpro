-- Dados de exemplo para desenvolvimento
-- ATENCAO: Nao executar em producao!

-- Inserir tenant de exemplo
INSERT INTO tenants (id, name, slug, document, email, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'ContabilPRO Demo', 'contabil-pro-demo', '12345678000195', 'demo@contabilpro.com', '(11) 99999-9999')
ON CONFLICT (slug) DO NOTHING;

-- Inserir usuario de exemplo (deve corresponder a um usuario real no auth.users)
-- Este usuario deve ser criado via Supabase Auth primeiro
INSERT INTO users (id, email, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'demo@contabilpro.com', 'Usuario Demo')
ON CONFLICT (email) DO NOTHING;

-- Associar usuario ao tenant
INSERT INTO user_tenants (user_id, tenant_id, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'owner')
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Inserir plano de contas basico
INSERT INTO accounts (tenant_id, code, name, type, level) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', '1', 'ATIVO', 'asset', 1),
  ('550e8400-e29b-41d4-a716-446655440000', '1.1', 'ATIVO CIRCULANTE', 'asset', 2),
  ('550e8400-e29b-41d4-a716-446655440000', '1.1.01', 'Caixa e Equivalentes', 'asset', 3),
  ('550e8400-e29b-41d4-a716-446655440000', '1.1.01.001', 'Caixa', 'asset', 4),
  ('550e8400-e29b-41d4-a716-446655440000', '1.1.01.002', 'Bancos', 'asset', 4),
  
  ('550e8400-e29b-41d4-a716-446655440000', '2', 'PASSIVO', 'liability', 1),
  ('550e8400-e29b-41d4-a716-446655440000', '2.1', 'PASSIVO CIRCULANTE', 'liability', 2),
  ('550e8400-e29b-41d4-a716-446655440000', '2.1.01', 'Fornecedores', 'liability', 3),
  
  ('550e8400-e29b-41d4-a716-446655440000', '3', 'PATRIMONIO LIQUIDO', 'equity', 1),
  ('550e8400-e29b-41d4-a716-446655440000', '3.1', 'Capital Social', 'equity', 2),
  
  ('550e8400-e29b-41d4-a716-446655440000', '4', 'RECEITAS', 'revenue', 1),
  ('550e8400-e29b-41d4-a716-446655440000', '4.1', 'Receitas de Vendas', 'revenue', 2),
  ('550e8400-e29b-41d4-a716-446655440000', '4.1.01', 'Vendas de Produtos', 'revenue', 3),
  
  ('550e8400-e29b-41d4-a716-446655440000', '5', 'DESPESAS', 'expense', 1),
  ('550e8400-e29b-41d4-a716-446655440000', '5.1', 'Despesas Operacionais', 'expense', 2),
  ('550e8400-e29b-41d4-a716-446655440000', '5.1.01', 'Salarios e Encargos', 'expense', 3)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- Inserir clientes de exemplo
INSERT INTO clients (tenant_id, name, email, document, document_type, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Cliente Exemplo Ltda', 'cliente@exemplo.com', '98765432000123', 'cnpj', '(11) 88888-8888'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Joao Silva', 'joao@email.com', '12345678901', 'cpf', '(11) 77777-7777'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Maria Santos', 'maria@email.com', '98765432109', 'cpf', '(11) 66666-6666')
ON CONFLICT (tenant_id, document) DO NOTHING;

-- Inserir conta bancaria de exemplo
INSERT INTO bank_accounts (tenant_id, name, bank_code, bank_name, agency, account_number, balance) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Conta Corrente Principal', '001', 'Banco do Brasil', '1234-5', '12345-6', 50000.00)
ON CONFLICT DO NOTHING;

-- Inserir algumas tarefas de exemplo
INSERT INTO tasks (tenant_id, title, description, type, priority, due_date, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Calcular DAS do mes', 'Calcular e gerar DAS referente ao mes atual', 'tax_obligation', 'high', CURRENT_DATE + INTERVAL '5 days', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Revisar lancamentos', 'Revisar lancamentos contabeis do ultimo periodo', 'document_review', 'medium', CURRENT_DATE + INTERVAL '3 days', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Conciliar extrato bancario', 'Conciliar extrato bancario com lancamentos', 'reconciliation', 'high', CURRENT_DATE + INTERVAL '2 days', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT DO NOTHING;
