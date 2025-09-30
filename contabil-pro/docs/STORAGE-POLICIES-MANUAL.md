# 🔒 APLICAR STORAGE POLICIES MANUALMENTE

As políticas de Storage precisam ser aplicadas manualmente no Dashboard do Supabase porque requerem permissões especiais.

---

## 📍 **PASSO A PASSO**

### **1. Acessar o Dashboard**
```
1. Abrir: https://supabase.com/dashboard
2. Selecionar projeto: JoyceSoft (selnwgpyjctpjzdrfrey)
3. Ir em: Storage > Policies
4. Selecionar bucket: documentos
```

### **2. Criar Política 1: SELECT (Visualizar)**
```
Nome: tenant_can_view_documents
Operação: SELECT
Target roles: authenticated

Policy definition:
```

```sql
bucket_id = 'documentos'
AND split_part(name, '/', 1) = (
  SELECT tenant_id::text 
  FROM user_tenants 
  WHERE user_id = auth.uid() 
    AND status = 'active'
  LIMIT 1
)
```

### **3. Criar Política 2: INSERT (Upload)**
```
Nome: tenant_can_upload_documents
Operação: INSERT
Target roles: authenticated

Policy definition:
```

```sql
bucket_id = 'documentos'
AND split_part(name, '/', 1) = (
  SELECT tenant_id::text 
  FROM user_tenants 
  WHERE user_id = auth.uid() 
    AND status = 'active'
  LIMIT 1
)
AND array_length(string_to_array(name, '/'), 1) = 4
AND storage.extension(name) = ANY(
  ARRAY['pdf','png','jpg','jpeg','webp','xml','csv','xlsx','docx','txt']
)
```

### **4. Criar Política 3: UPDATE (Atualizar)**
```
Nome: admin_can_update_documents
Operação: UPDATE
Target roles: authenticated

Policy definition:
```

```sql
bucket_id = 'documentos'
AND EXISTS (
  SELECT 1 
  FROM user_tenants
  WHERE user_id = auth.uid()
    AND tenant_id::text = split_part(name, '/', 1)
    AND role IN ('owner', 'admin')
    AND status = 'active'
)
```

### **5. Criar Política 4: DELETE (Deletar)**
```
Nome: admin_can_delete_documents
Operação: DELETE
Target roles: authenticated

Policy definition:
```

```sql
bucket_id = 'documentos'
AND EXISTS (
  SELECT 1 
  FROM user_tenants
  WHERE user_id = auth.uid()
    AND tenant_id::text = split_part(name, '/', 1)
    AND role IN ('owner', 'admin')
    AND status = 'active'
)
```

---

## ✅ **VALIDAÇÃO**

Após criar as 4 políticas, testar:

1. **Teste de Isolamento:**
   - Usuário A não deve ver documentos do Tenant B
   - Path deve seguir: `{tenant_id}/{type}/{year}/{file}`

2. **Teste de Permissões:**
   - Usuário comum pode fazer upload
   - Usuário comum NÃO pode deletar
   - Admin/Owner pode deletar

3. **Teste de Validação:**
   - Apenas extensões permitidas
   - Path deve ter 4 partes
   - Tamanho máximo: 50MB (já configurado no bucket)

---

## 🎯 **ESTRUTURA DE PATH**

Os documentos são organizados assim:
```
documentos/
  {tenant_id}/
    nfe/
      2025/
        abc123de-nota-fiscal-123.pdf
    receipt/
      2025/
        xyz789ab-recibo-pagamento.jpg
    other/
      2025/
        def456gh-documento.pdf
```

**Formato:** `{tenant_id}/{type}/{year}/{hash}-{name}.{ext}`

---

## 🚨 **IMPORTANTE**

- **NÃO** criar políticas com "Acesso total" ou "Debug"
- **SEMPRE** validar tenant_id no path
- **SEMPRE** validar extensões permitidas
- **SEMPRE** separar permissões por role (admin vs usuário)

---

## 📞 **PRÓXIMOS PASSOS**

Após aplicar as políticas:
1. ✅ Testar upload de documento
2. ✅ Testar download
3. ✅ Testar delete (como admin)
4. ✅ Verificar isolamento multi-tenant

**Status:** ⏳ Aguardando aplicação manual das políticas

