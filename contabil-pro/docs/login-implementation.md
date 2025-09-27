# Implementação do Sistema de Login

## ✅ O que foi implementado

### 1. Server Action de Login (`src/actions/auth.ts`)
- ✅ Validação de email e senha com Zod
- ✅ Autenticação via Supabase Auth
- ✅ **Descoberta inteligente de tenant** via tabela `user_tenants`
  - Se 1 tenant → usa esse
  - Se múltiplos → usa o mais recente (joined_at DESC)
  - Se nenhum → mensagem clara de onboarding
- ✅ **Redirecionamento sempre específico** para `/t/<slug>/dashboard`
- ✅ **Validação de segurança** do parâmetro `next` (só aceita URLs do mesmo tenant)
- ✅ Tratamento de erros com mensagens amigáveis
- ✅ Logs detalhados para debug

### 2. Componente LoginForm (`src/components/login-form.tsx`)
- ✅ Formulário conectado à Server Action
- ✅ Estados de loading/erro
- ✅ Campos com `name` e `data-testid` para testes
- ✅ Validação de campos com feedback visual
- ✅ Suporte ao parâmetro `next` via URL params

### 3. Componente Alert (`src/components/ui/alert.tsx`)
- ✅ Componente para exibir mensagens de erro
- ✅ Variantes (default, destructive)

## 🚀 Melhorias Implementadas

### Login sem dependência do JWT
- **Antes**: Sistema dependia do `tenant_id` estar no JWT do usuário
- **Agora**: Descobre tenant através do relacionamento `user_tenants` após autenticação
- **Benefício**: Funciona independente de auth hooks ou configurações complexas no Supabase

### Descoberta inteligente de tenant
- **1 tenant**: Usa automaticamente
- **Múltiplos tenants**: Seleciona o mais recente (por `joined_at`)
- **Nenhum tenant**: Mensagem clara para onboarding
- **Log detalhado**: Mostra todos os tenants disponíveis para debug

### Redirecionamento seguro e específico
- **Sempre redireciona** para `/t/<slug>/dashboard` (nunca genérico `/dashboard`)
- **Valida parâmetro `next`**: Só aceita URLs do mesmo tenant do usuário
- **Evita loops**: Middleware recebe URL completa e não precisa "adivinhar" tenant

### Helpers reutilizáveis
- `getUserTenants(userId)`: Busca tenants de um usuário
- `selectDefaultTenant(tenants)`: Lógica de seleção de tenant padrão

## 🔧 Como testar

### Pré-requisitos
1. **Supabase configurado** com as variáveis de ambiente:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
   SUPABASE_SERVICE_ROLE_KEY=sua_service_key
   ```

2. **Banco de dados migrado** com as tabelas:
   - `tenants`
   - `users` 
   - `user_tenants`

3. **Dados de exemplo** inseridos (executar `infra/seeds/001_sample_data.sql`)

### Criar usuário de teste no Supabase Auth

**IMPORTANTE**: O usuário deve existir tanto no Supabase Auth quanto na tabela `users` local.

1. **Via Supabase Dashboard**:
   - Ir em Authentication > Users
   - Criar usuário com email: `demo@contabilpro.com`
   - Definir senha: `senha123`
   - Confirmar email automaticamente

2. **Via SQL** (executar no Supabase SQL Editor):
   ```sql
   -- Inserir na tabela users local (se não existir)
   INSERT INTO users (id, email, name) VALUES
     ('550e8400-e29b-41d4-a716-446655440001', 'demo@contabilpro.com', 'Usuario Demo')
   ON CONFLICT (email) DO NOTHING;

   -- Associar ao tenant (se não existir)
   INSERT INTO user_tenants (user_id, tenant_id, role) VALUES
     ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'owner')
   ON CONFLICT (user_id, tenant_id) DO NOTHING;
   ```

### Fluxos de teste

#### 1. **Fluxo feliz (login bem-sucedido)**
1. Acessar `/login`
2. Preencher:
   - Email: `demo@contabilpro.com`
   - Senha: `senha123`
3. Clicar "Entrar"
4. **Resultado esperado**: Redirecionamento para `/t/contabil-pro-demo/dashboard`

#### 2. **Fluxo com parâmetro `next`**
1. Acessar `/t/contabil-pro-demo/clientes` sem estar logado
2. **Resultado esperado**: Redirecionamento para `/login?next=/t/contabil-pro-demo/clientes`
3. Fazer login
4. **Resultado esperado**: Redirecionamento para `/t/contabil-pro-demo/clientes`

#### 3. **Fluxo de erro (credenciais inválidas)**
1. Acessar `/login`
2. Preencher email/senha incorretos
3. Clicar "Entrar"
4. **Resultado esperado**: Permanecer na tela de login com mensagem de erro

#### 4. **Estados de loading**
1. Preencher formulário
2. Clicar "Entrar"
3. **Resultado esperado**:
   - Botão muda para "Entrando..."
   - Campos ficam desabilitados
   - Após resposta, volta ao normal

#### 5. **Usuário com múltiplos tenants**
1. Criar usuário associado a múltiplos tenants:
   ```sql
   -- Criar segundo tenant
   INSERT INTO tenants (id, name, slug, document, email) VALUES
     ('550e8400-e29b-41d4-a716-446655440002', 'Empresa Teste', 'empresa-teste', '98765432000123', 'teste@empresa.com');

   -- Associar usuário ao segundo tenant
   INSERT INTO user_tenants (user_id, tenant_id, role, joined_at) VALUES
     ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'admin', NOW() + INTERVAL '1 day');
   ```
2. Fazer login com `demo@contabilpro.com`
3. **Resultado esperado**: Redireciona para o tenant mais recente (empresa-teste)
4. **Verificar logs**: Console deve mostrar todos os tenants disponíveis

## 🐛 Possíveis problemas e soluções

### 1. "Usuário não associado a nenhuma empresa"
**Causa**: Usuário existe no Supabase Auth mas não na tabela `user_tenants`
**Solução**: Executar SQL acima para associar usuário ao tenant

### 2. "Empresa não encontrada ou inativa"
**Causa**: Tenant não existe ou está inativo
**Solução**: Verificar se o tenant existe na tabela `tenants` com `status = 'active'`

### 3. Redirecionamento não funciona
**Causa**: Middleware não consegue resolver o tenant
**Solução**: Verificar se o slug do tenant está correto e se o middleware está funcionando

### 4. Erro de CORS ou cookies
**Causa**: Configuração de domínio no Supabase
**Solução**: Adicionar `http://localhost:3001` nas URLs permitidas no Supabase

## 🔍 Debug

### Logs importantes
- Console do navegador: erros de validação e estados do formulário
- Console do servidor: erros de autenticação e busca de tenant
- Network tab: requests para Supabase Auth

### Verificar dados
```sql
-- Verificar se usuário existe
SELECT * FROM auth.users WHERE email = 'demo@contabilpro.com';

-- Verificar associação com tenant
SELECT ut.*, t.name, t.slug 
FROM user_tenants ut
JOIN tenants t ON ut.tenant_id = t.id
WHERE ut.user_id = '550e8400-e29b-41d4-a716-446655440001';
```

## 📋 Próximos passos

1. **Testar fluxo completo** com usuário real
2. **Implementar OAuth com Google** (botão já existe, mas não funcional)
3. **Adicionar testes automatizados** (BDD já configurado)
4. **Implementar recuperação de senha**
5. **Adicionar rate limiting** para segurança
