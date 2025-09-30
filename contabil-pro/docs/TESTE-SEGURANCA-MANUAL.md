# 🔒 TESTE DE SEGURANÇA MULTI-TENANT - MANUAL

## 🎯 **OBJETIVO**
Validar que o isolamento multi-tenant está funcionando corretamente.

---

## 📋 **PRÉ-REQUISITOS**

✅ **Tenant 1 (Já existe):**
- Nome: ContabilPRO Teste
- Slug: `contabil-pro-teste`
- ID: `550e8400-e29b-41d4-a716-446655440000`
- Usuário: teste@contabilpro.com

✅ **Tenant 2 (Criado para teste):**
- Nome: Empresa Teste 2
- Slug: `empresa-teste-2`
- ID: `650e8400-e29b-41d4-a716-446655440001`
- Usuário: **PRECISA CRIAR**

---

## 🧪 **TESTE 1: Criar Segundo Usuário**

### **Passo 1.1: Criar usuário no Supabase Auth**

1. Abrir Supabase Dashboard: https://supabase.com/dashboard/project/selnwgpyjctpjzdrfrey
2. Ir em **Authentication** → **Users**
3. Clicar em **Add User** → **Create new user**
4. Preencher:
   - Email: `teste2@contabilpro.com`
   - Password: `Teste123!` (ou outra senha)
   - Auto Confirm User: ✅ **SIM**
5. Clicar em **Create User**
6. **Copiar o User ID** gerado

### **Passo 1.2: Associar usuário ao Tenant 2**

Execute no SQL Editor do Supabase:

```sql
-- Substituir {USER_ID} pelo ID copiado acima
INSERT INTO users (id, email, name, created_at, updated_at)
VALUES (
  '{USER_ID}',
  'teste2@contabilpro.com',
  'Usuário Teste 2',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Associar ao Tenant 2
INSERT INTO user_tenants (user_id, tenant_id, role, status)
VALUES (
  '{USER_ID}',
  '650e8400-e29b-41d4-a716-446655440001',
  'owner',
  'active'
);
```

---

## 🧪 **TESTE 2: Validar Isolamento de Visualização**

### **Passo 2.1: Upload como Usuário 1**

1. ✅ Logar como: `teste@contabilpro.com`
2. ✅ Acessar: http://localhost:3000/documentos
3. ✅ Fazer upload de um arquivo: `Documento-Tenant-1.pdf`
4. ✅ Verificar que aparece na listagem
5. ✅ **Copiar o ID do documento** (aparece na URL ou console)

### **Passo 2.2: Tentar Acessar como Usuário 2**

1. ✅ Fazer **logout**
2. ✅ Logar como: `teste2@contabilpro.com`
3. ✅ Acessar: http://localhost:3000/documentos
4. ✅ **VERIFICAR:** Lista deve estar vazia (não mostra documentos do Tenant 1)

### **Passo 2.3: Tentar Download Direto (Bypass)**

1. ✅ Ainda logado como Usuário 2
2. ✅ Abrir Console do Browser (F12)
3. ✅ Executar:

```javascript
// Substituir {DOCUMENT_ID} pelo ID copiado no Passo 2.1
const response = await fetch('/api/documents/{DOCUMENT_ID}/download');
const data = await response.json();
console.log(data);
```

4. ✅ **VERIFICAR:** Deve retornar erro "Documento não encontrado"

---

## 🧪 **TESTE 3: Validar Isolamento de Storage**

### **Passo 3.1: Verificar Paths no Storage**

Execute no SQL Editor do Supabase:

```sql
-- Documentos do Tenant 1
SELECT name, created_at 
FROM storage.objects 
WHERE bucket_id = 'documentos' 
  AND name LIKE '550e8400-e29b-41d4-a716-446655440000%'
ORDER BY created_at DESC;

-- Documentos do Tenant 2 (deve estar vazio)
SELECT name, created_at 
FROM storage.objects 
WHERE bucket_id = 'documentos' 
  AND name LIKE '650e8400-e29b-41d4-a716-446655440001%'
ORDER BY created_at DESC;
```

### **Passo 3.2: Upload como Usuário 2**

1. ✅ Logado como: `teste2@contabilpro.com`
2. ✅ Fazer upload de: `Documento-Tenant-2.pdf`
3. ✅ Executar SQL acima novamente
4. ✅ **VERIFICAR:** Agora deve aparecer arquivo no path do Tenant 2

---

## 🧪 **TESTE 4: Validar Auditoria**

### **Passo 4.1: Verificar Eventos do Tenant 1**

Execute no SQL Editor:

```sql
SELECT 
  de.event_type,
  de.created_at,
  de.metadata,
  u.email as user_email,
  d.name as document_name
FROM document_events de
LEFT JOIN users u ON de.user_id = u.id
LEFT JOIN documents d ON de.document_id = d.id
WHERE de.tenant_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY de.created_at DESC
LIMIT 10;
```

### **Passo 4.2: Verificar Eventos do Tenant 2**

```sql
SELECT 
  de.event_type,
  de.created_at,
  de.metadata,
  u.email as user_email,
  d.name as document_name
FROM document_events de
LEFT JOIN users u ON de.user_id = u.id
LEFT JOIN documents d ON de.document_id = d.id
WHERE de.tenant_id = '650e8400-e29b-41d4-a716-446655440001'
ORDER BY de.created_at DESC
LIMIT 10;
```

**VERIFICAR:** Eventos devem estar separados por tenant.

---

## ✅ **CHECKLIST DE VALIDAÇÃO**

- [ ] Usuário 2 criado e associado ao Tenant 2
- [ ] Usuário 1 fez upload de documento
- [ ] Usuário 2 NÃO vê documentos do Usuário 1
- [ ] Tentativa de download direto falha (erro 404)
- [ ] Paths no Storage estão separados por tenant_id
- [ ] Auditoria registra eventos por tenant
- [ ] Nenhum vazamento de dados entre tenants

---

## 🚨 **SE ALGUM TESTE FALHAR**

### **Problema: Usuário 2 vê documentos do Tenant 1**
- ❌ **CRÍTICO:** Isolamento multi-tenant quebrado
- 🔧 **Ação:** Revisar filtros `tenant_id` nas queries

### **Problema: Download direto funciona**
- ❌ **CRÍTICO:** Bypass de segurança
- 🔧 **Ação:** Revisar validação de `tenant_id` na action

### **Problema: Paths no Storage misturados**
- ❌ **CRÍTICO:** Isolamento de Storage quebrado
- 🔧 **Ação:** Revisar função `generate_document_path`

---

## 🎉 **RESULTADO ESPERADO**

✅ **TODOS OS TESTES DEVEM PASSAR**

Se todos passarem:
1. ✅ Isolamento multi-tenant está funcionando
2. ✅ Segurança validada
3. ✅ Pronto para produção (nesse aspecto)

---

**Status:** ⏳ Aguardando execução

