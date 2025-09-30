# Correção RLS - Módulo de Documentos

## 🎯 Objetivo

Remover o bypass de RLS com `createAdminClient()` nas Server Actions de documentos e implementar isolamento multi-tenant correto usando políticas RLS.

---

## 🚨 Problema Identificado

### Antes (INSEGURO):

```typescript
// ❌ PROBLEMA: Bypass de RLS com Admin Client
const { createAdminClient } = await import('@/lib/supabase');
const supabase = createAdminClient();

// Filtro manual por tenant_id (propenso a erros)
const { data } = await supabase
  .from('documents')
  .select('*')
  .eq('tenant_id', session.tenant_id); // ⚠️ Se esquecer, vaza dados!
```

**Riscos:**
- ✗ RLS desabilitado
- ✗ Segurança depende de filtros manuais
- ✗ Risco de vazamento de dados entre tenants
- ✗ Difícil de auditar

---

## ✅ Solução Implementada

### Depois (SEGURO):

```typescript
// ✅ SOLUÇÃO: RLS ativo com setRLSContext
const session = await requireAuth();
const supabase = await setRLSContext(session);

// RLS filtra automaticamente por tenant_id
const { data } = await supabase
  .from('documents')
  .select('*'); // ✅ Seguro! RLS garante isolamento
```

**Benefícios:**
- ✓ RLS ativo em todas as queries
- ✓ Isolamento garantido pelo banco de dados
- ✓ Impossível acessar dados de outro tenant
- ✓ Auditável e testável

---

## 📁 Arquivos Modificados

### 1. Migration SQL
**Arquivo:** `infra/migrations/016_documents_rls.sql`

```sql
-- Habilitar RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Ver apenas documentos do próprio tenant
CREATE POLICY "Users can view documents from their tenant" ON documents
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Política INSERT: Criar apenas no próprio tenant
CREATE POLICY "Users can create documents in their tenant" ON documents
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

-- Política UPDATE: Atualizar apenas documentos do próprio tenant
CREATE POLICY "Users can update documents from their tenant" ON documents
  FOR UPDATE
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- Política DELETE: Apenas admin/owner podem deletar
CREATE POLICY "Admins can delete documents from their tenant" ON documents
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    EXISTS (
      SELECT 1 FROM user_tenants 
      WHERE user_id = auth.uid() 
      AND tenant_id = current_tenant_id()
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );
```

### 2. Server Actions
**Arquivo:** `src/actions/documents.ts`

#### Mudanças em `getDocuments()`:
```diff
- // Usar Admin Client para bypass RLS (temporário)
- const { createAdminClient } = await import('@/lib/supabase');
- const supabase = createAdminClient();
+ const session = await requireAuth();
+ const supabase = await setRLSContext(session);

- // Construir query (filtro manual por tenant_id)
+ // Construir query (RLS vai filtrar automaticamente)
  let query = supabase
    .from('documents')
    .select('*', { count: 'exact' })
-   .eq('tenant_id', session.tenant_id);
```

#### Mudanças em `getDocumentDownloadUrl()`:
```diff
- const { createAdminClient } = await import('@/lib/supabase');
- const supabase = createAdminClient();
+ const session = await requireAuth();
+ const supabase = await setRLSContext(session);

- // Buscar documento (filtro manual por tenant_id)
+ // Buscar documento (RLS filtra automaticamente)
  const { data: document } = await supabase
    .from('documents')
    .select('id, path, name')
-   .eq('id', documentId)
-   .eq('tenant_id', session.tenant_id);
+   .eq('id', documentId);
```

#### Mudanças em `deleteDocument()`:
```diff
- const { createAdminClient } = await import('@/lib/supabase');
- const supabase = createAdminClient();
+ const session = await requireAuth();
+ const supabase = await setRLSContext(session);

- // Verificar permissão manualmente
- const { data: userTenant } = await supabase
-   .from('user_tenants')
-   .select('role')
-   .eq('user_id', session.user.id)
-   .eq('tenant_id', session.tenant_id);
- 
- if (!['owner', 'admin'].includes(userTenant.role)) {
-   return { error: 'Apenas administradores podem deletar' };
- }

+ // RLS policy já valida permissão (admin/owner)
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);
```

#### Mudanças em `registerUploadedDocument()`:
```diff
- // NOTA: Usando Admin Client para bypass RLS temporariamente
- const { createAdminClient } = await import('@/lib/supabase');
- const supabase = createAdminClient();
+ const session = await requireAuth();
+ const supabase = await setRLSContext(session);

- // Verificar duplicata (filtro manual por tenant_id)
+ // Verificar duplicata (RLS filtra automaticamente)
  const { data: existing } = await supabase
    .from('documents')
    .select('id, name, path')
-   .eq('tenant_id', session.tenant_id)
    .eq('hash', data.hash);
```

---

## 🔧 Como Aplicar

### 1. Aplicar Migration no Supabase

```bash
# Via Supabase CLI
supabase db push

# Ou via SQL Editor no Dashboard
# Copie e cole o conteúdo de infra/migrations/016_documents_rls.sql
```

### 2. Verificar RLS Ativo

```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'documents';
-- Deve retornar: rowsecurity = true

-- Listar políticas criadas
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'documents';
-- Deve retornar 4 políticas (SELECT, INSERT, UPDATE, DELETE)
```

### 3. Testar Isolamento

```sql
-- Teste 1: Simular usuário do Tenant A
SELECT set_config('request.jwt.claims', 
  '{"tenant_id": "tenant-a-uuid"}'::text, false);

SELECT COUNT(*) FROM documents;
-- Deve retornar apenas documentos do Tenant A

-- Teste 2: Simular usuário do Tenant B
SELECT set_config('request.jwt.claims', 
  '{"tenant_id": "tenant-b-uuid"}'::text, false);

SELECT COUNT(*) FROM documents;
-- Deve retornar apenas documentos do Tenant B

-- Teste 3: Sem contexto (deve retornar 0)
SELECT set_config('request.jwt.claims', NULL, false);
SELECT COUNT(*) FROM documents;
-- Deve retornar 0
```

---

## ✅ Checklist de Validação

- [x] Migration 016 criada
- [x] RLS habilitado na tabela `documents`
- [x] 4 políticas RLS criadas (SELECT, INSERT, UPDATE, DELETE)
- [x] `getDocuments()` corrigida (sem Admin Client)
- [x] `getDocumentDownloadUrl()` corrigida
- [x] `deleteDocument()` corrigida
- [x] `registerUploadedDocument()` corrigida
- [ ] Migration aplicada no Supabase
- [ ] Testes de isolamento executados
- [ ] Testes E2E de upload/download/delete

---

## 📊 Impacto

### Segurança
- ✅ **Isolamento garantido**: RLS impede acesso entre tenants
- ✅ **Auditável**: Políticas SQL são versionadas e revisáveis
- ✅ **Testável**: Testes de RLS podem ser automatizados

### Performance
- ✅ **Sem impacto**: RLS é otimizado pelo Postgres
- ✅ **Índices existentes**: `idx_documents_tenant_id` já existe

### Manutenção
- ✅ **Menos código**: Removidos filtros manuais
- ✅ **Menos bugs**: Impossível esquecer filtro de tenant
- ✅ **Mais confiável**: Segurança no banco, não na aplicação

---

## 🔍 Próximos Passos

1. Aplicar migration no ambiente de desenvolvimento
2. Executar testes de isolamento
3. Validar upload/download/delete funcionando
4. Aplicar em staging
5. Aplicar em produção (com backup)
6. Monitorar logs por 24h

---

## 📚 Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Migration 012: `client_rls_improvements.sql` (referência de implementação)
- ADR-001: Parametrizar tenant_id em RPCs

