# 🔒 Storage Policies - Guia Completo

## ✅ Status Atual

**Data da Limpeza:** 2025-01-XX  
**Políticas Antigas:** 29 (duplicadas/conflitantes)  
**Políticas Atuais:** 4 (limpas e bem definidas)  
**Migration:** `017_storage_policies_cleanup.sql`  
**Projeto:** JoyceSoft (selnwgpyjctpjzdrfrey)

---

## 📋 Políticas Ativas

### 1. `tenant_can_view_documents` (SELECT)
**Quem:** Todos os usuários autenticados  
**O que:** Visualizar documentos do seu tenant  
**Validação:** Path deve começar com `tenant_id` do usuário

```sql
CREATE POLICY "tenant_can_view_documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documentos' 
  AND split_part(name, '/', 1) = (
    SELECT tenant_id::text 
    FROM user_tenants 
    WHERE user_id = auth.uid() 
    AND status = 'active' 
    LIMIT 1
  )
);
```

---

### 2. `tenant_can_upload_documents` (INSERT)
**Quem:** Todos os usuários autenticados  
**O que:** Fazer upload de documentos para seu tenant  
**Validações:**
- Path deve começar com `tenant_id` do usuário
- Path deve ter exatamente 4 segmentos: `{tenant_id}/{type}/{year}/{filename}`
- Extensão deve estar na lista permitida: `pdf, png, jpg, jpeg, webp, xml, csv, xlsx, docx, txt`

```sql
CREATE POLICY "tenant_can_upload_documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documentos' 
  AND split_part(name, '/', 1) = (
    SELECT tenant_id::text 
    FROM user_tenants 
    WHERE user_id = auth.uid() 
    AND status = 'active' 
    LIMIT 1
  )
  AND array_length(string_to_array(name, '/'), 1) = 4
  AND storage.extension(name) = ANY(ARRAY[
    'pdf','png','jpg','jpeg','webp','xml','csv','xlsx','docx','txt'
  ])
);
```

---

### 3. `admin_can_update_documents` (UPDATE)
**Quem:** Apenas admins (`owner` ou `admin`)  
**O que:** Atualizar documentos do seu tenant  
**Validação:** Usuário deve ter role `owner` ou `admin` no tenant

```sql
CREATE POLICY "admin_can_update_documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documentos' 
  AND EXISTS (
    SELECT 1 FROM user_tenants 
    WHERE user_id = auth.uid() 
    AND tenant_id::text = split_part(name, '/', 1)
    AND role IN ('owner', 'admin') 
    AND status = 'active'
  )
)
WITH CHECK (
  bucket_id = 'documentos' 
  AND EXISTS (
    SELECT 1 FROM user_tenants 
    WHERE user_id = auth.uid() 
    AND tenant_id::text = split_part(name, '/', 1)
    AND role IN ('owner', 'admin') 
    AND status = 'active'
  )
);
```

---

### 4. `admin_can_delete_documents` (DELETE)
**Quem:** Apenas admins (`owner` ou `admin`)  
**O que:** Deletar documentos do seu tenant  
**Validação:** Usuário deve ter role `owner` ou `admin` no tenant

```sql
CREATE POLICY "admin_can_delete_documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documentos' 
  AND EXISTS (
    SELECT 1 FROM user_tenants 
    WHERE user_id = auth.uid() 
    AND tenant_id::text = split_part(name, '/', 1)
    AND role IN ('owner', 'admin') 
    AND status = 'active'
  )
);
```

---

## 🔒 Segurança Multi-Tenant

### Isolamento por Path
Todas as políticas validam que o primeiro segmento do path (`split_part(name, '/', 1)`) corresponde ao `tenant_id` do usuário autenticado.

**Exemplo de Path Válido:**
```
550e8400-e29b-41d4-a716-446655440000/nfe/2025/abc123-nota.pdf
└─────────────────┬─────────────────┘ └┬┘ └┬─┘ └──────┬──────┘
            tenant_id              type year   filename
```

**Estrutura Obrigatória:**
1. **Segmento 1:** `tenant_id` (UUID do tenant)
2. **Segmento 2:** `type` (nfe, nfse, recibo, etc.)
3. **Segmento 3:** `year` (ano do documento)
4. **Segmento 4:** `filename` (hash-nome.extensão)

### Validação de Usuário
```sql
SELECT tenant_id::text 
FROM user_tenants 
WHERE user_id = auth.uid() 
AND status = 'active' 
LIMIT 1
```

**Garantias:**
- ✅ Usuário só acessa documentos do seu tenant
- ✅ Impossível acessar documentos de outro tenant
- ✅ Validação em nível de banco de dados (RLS)
- ✅ Não depende de validação client-side

---

## 🧪 Como Testar

### Teste 1: Verificar Políticas Criadas
```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;
```

**Resultado Esperado:** 4 políticas

---

### Teste 2: Validar Path Structure
```sql
-- ✅ Path válido (4 segmentos, extensão permitida)
SELECT 
  array_length(string_to_array('tenant-id/nfe/2025/file.pdf', '/'), 1) as segments,
  storage.extension('tenant-id/nfe/2025/file.pdf') as extension;
-- Resultado: segments=4, extension=pdf

-- ❌ Path inválido (3 segmentos)
SELECT 
  array_length(string_to_array('tenant-id/nfe/file.pdf', '/'), 1) as segments;
-- Resultado: segments=3 (rejeitado pela política)

-- ❌ Extensão inválida
SELECT 
  storage.extension('tenant-id/nfe/2025/file.exe') as extension;
-- Resultado: extension=exe (rejeitado pela política)
```

---

### Teste 3: Isolamento Multi-Tenant (Completo)
Execute o script de teste completo:
```bash
psql $DATABASE_URL -f infra/scripts/test-storage-policies.sql
```

**Testes Incluídos:**
1. ✅ Verificar 4 políticas criadas
2. ✅ Listar detalhes das políticas
3. ✅ Simular contexto de usuário
4. ✅ Validar estrutura de path
5. ✅ Verificar isolamento multi-tenant
6. ✅ Verificar permissões de admin
7. ✅ Verificar extensões permitidas

---

## 🚨 Problemas Resolvidos

### ❌ Antes da Limpeza
- 29 políticas duplicadas/conflitantes
- Políticas de "debug" em produção
- Políticas de "teste" em produção
- Nomenclatura inconsistente
- Difícil de auditar
- Performance degradada
- Risco de segurança

### ✅ Depois da Limpeza
- 4 políticas limpas e bem definidas
- Nomenclatura consistente (`tenant_*`, `admin_*`)
- Validações claras e documentadas
- Fácil de auditar e manter
- Performance otimizada
- Segurança garantida

---

## 📊 Matriz de Permissões

| Operação | Usuário Normal | Admin | Owner |
|----------|----------------|-------|-------|
| **SELECT** (Visualizar) | ✅ Seu tenant | ✅ Seu tenant | ✅ Seu tenant |
| **INSERT** (Upload) | ✅ Seu tenant | ✅ Seu tenant | ✅ Seu tenant |
| **UPDATE** (Atualizar) | ❌ Não | ✅ Seu tenant | ✅ Seu tenant |
| **DELETE** (Deletar) | ❌ Não | ✅ Seu tenant | ✅ Seu tenant |

---

## 🔧 Manutenção

### Adicionar Nova Extensão Permitida
```sql
-- Editar política tenant_can_upload_documents
-- Adicionar extensão ao array:
AND storage.extension(name) = ANY(ARRAY[
  'pdf','png','jpg','jpeg','webp','xml','csv','xlsx','docx','txt',
  'nova_extensao'  -- ← Adicionar aqui
])
```

### Adicionar Nova Role com Permissões de Admin
```sql
-- Editar políticas admin_can_update_documents e admin_can_delete_documents
-- Adicionar role ao array:
AND role IN ('owner', 'admin', 'nova_role')  -- ← Adicionar aqui
```

---

## 📝 Histórico de Mudanças

### 2025-01-XX - Limpeza Completa
- ❌ Removidas 29 políticas antigas
- ✅ Criadas 4 políticas limpas
- ✅ Documentação completa
- ✅ Scripts de teste criados
- ✅ Migration `017_storage_policies_cleanup.sql`

---

## 🆘 Troubleshooting

### Erro: "new row violates row-level security policy"
**Causa:** Path não corresponde ao tenant_id do usuário  
**Solução:** Verificar que o path começa com o tenant_id correto

### Erro: "extension not allowed"
**Causa:** Extensão do arquivo não está na lista permitida  
**Solução:** Adicionar extensão à política ou usar extensão permitida

### Erro: "insufficient permissions to update/delete"
**Causa:** Usuário não tem role `owner` ou `admin`  
**Solução:** Promover usuário ou usar conta admin

---

## 📚 Referências

- **Migration:** `infra/migrations/017_storage_policies_cleanup.sql`
- **Testes:** `infra/scripts/test-storage-policies.sql`
- **Documentação Antiga:** `docs/STORAGE-POLICIES-MANUAL.md` (deprecated)
- **Supabase Storage Docs:** https://supabase.com/docs/guides/storage
- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security

