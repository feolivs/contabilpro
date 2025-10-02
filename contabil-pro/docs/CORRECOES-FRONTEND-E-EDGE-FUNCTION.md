# 🔧 CORREÇÕES: Frontend + Edge Function

## 🐛 **PROBLEMAS IDENTIFICADOS E RESOLVIDOS**

### **Problema 1: Edge Function não estava sendo invocada**

**Causa:** O upload estava usando `registerUploadedDocument` em vez de `uploadDocument`, e essa função não tinha a invocação da Edge Function.

**Solução:**
- ✅ Adicionada invocação da Edge Function em `registerUploadedDocument`
- ✅ Logs detalhados para debug
- ✅ Tratamento de erro sem falhar o upload

**Arquivo modificado:**
- `contabil-pro/src/actions/documents.ts` (linhas 530-574)

**Código adicionado:**
```typescript
// 4. Invocar Edge Function para processamento automático
console.log('🚀 [registerUploadedDocument] Invocando Edge Function...', {
  document_id: document.id,
  tenant_id: session.tenant_id,
  storage_path: data.path,
  mime_type: data.mime_type,
});

const { data: invokeData, error: invokeError } = await supabase.functions.invoke(
  'process-document',
  {
    body: {
      document_id: document.id,
      tenant_id: session.tenant_id,
      storage_path: data.path,
      mime_type: data.mime_type,
    },
  }
);

if (invokeError) {
  console.error('⚠️ [registerUploadedDocument] Erro ao invocar Edge Function:', invokeError);
} else {
  console.log('✅ [registerUploadedDocument] Edge Function invocada com sucesso:', invokeData);
}
```

---

### **Problema 2: Falta UI para visualizar dados extraídos**

**Causa:** Não havia interface para visualizar:
- Texto extraído por OCR
- Dados estruturados (metadata)
- Confiança do processamento
- Status do documento

**Solução:**
- ✅ Criado `DocumentDetailsDialog` component
- ✅ Adicionado botão "Visualizar Detalhes" no menu de ações
- ✅ Interface completa com todas as informações

**Arquivos criados/modificados:**
1. `contabil-pro/src/components/documents/document-details-dialog.tsx` (novo)
2. `contabil-pro/src/components/documents/documents-table.tsx` (modificado)
3. `contabil-pro/src/components/ui/scroll-area.tsx` (novo)
4. `contabil-pro/src/lib/utils.ts` (adicionadas funções `formatBytes` e `formatDate`)

---

### **Problema 3: Componentes UI faltando**

**Causa:** Componentes do shadcn/ui não estavam instalados.

**Solução:**
- ✅ Instalado `@radix-ui/react-scroll-area`
- ✅ Criado componente `ScrollArea`
- ✅ Adicionadas funções utilitárias

---

## 📋 **ARQUIVOS MODIFICADOS/CRIADOS**

### **1. Server Actions**
- ✅ `contabil-pro/src/actions/documents.ts`
  - Adicionada invocação da Edge Function em `registerUploadedDocument`

### **2. Componentes UI**
- ✅ `contabil-pro/src/components/documents/document-details-dialog.tsx` (NOVO)
  - Dialog completo para visualizar detalhes do documento
  - Mostra: status, tipo, tamanho, data, cliente, uploader
  - Mostra: confiança do OCR, dados extraídos, texto OCR
  - Botões: Fechar, Baixar

- ✅ `contabil-pro/src/components/documents/documents-table.tsx`
  - Adicionado botão "Visualizar Detalhes" no menu de ações
  - Importado `DocumentDetailsDialog`
  - Adicionado estado para controlar dialog

- ✅ `contabil-pro/src/components/ui/scroll-area.tsx` (NOVO)
  - Componente de scroll area do Radix UI

### **3. Utilitários**
- ✅ `contabil-pro/src/lib/utils.ts`
  - Adicionada função `formatBytes(bytes, decimals)`
  - Adicionada função `formatDate(date, formatStr)`

### **4. Dependências**
- ✅ Instalado `@radix-ui/react-scroll-area`

---

## 🎨 **INTERFACE DO DIALOG DE DETALHES**

### **Seções do Dialog:**

1. **Header**
   - Ícone de arquivo
   - Nome do documento
   - Botão fechar

2. **Status e Informações Básicas**
   - Badge de status (Processado, Aguardando, Requer Revisão)
   - Badge de tipo (NFe, NFSe, Recibo, etc.)
   - Tamanho do arquivo
   - Data de upload
   - Cliente vinculado (se houver)
   - Usuário que fez upload

3. **Confiança do OCR**
   - Barra de progresso visual
   - Percentual de confiança

4. **Dados Extraídos** (se houver)
   - Ícone Sparkles
   - Grid com todos os campos extraídos
   - Formato: chave → valor

5. **Texto Extraído** (se houver)
   - Ícone Eye
   - Texto em formato monospace
   - Limitado a 1000 caracteres (com "...")

6. **Processamento Pendente** (se não processado)
   - Ícone de loading animado
   - Mensagem informativa

7. **Footer**
   - Botão "Fechar"
   - Botão "Baixar" (com loading state)

---

## 🧪 **COMO TESTAR**

### **Teste 1: Upload e Invocação da Edge Function**

1. Acesse: http://localhost:3001/documentos
2. Faça upload de um documento (imagem, PDF ou XML)
3. **Verificar nos logs do terminal:**
   ```
   🚀 [registerUploadedDocument] Invocando Edge Function...
   ✅ [registerUploadedDocument] Edge Function invocada com sucesso
   ```
4. **Verificar no Dashboard do Supabase:**
   - Acesse: https://supabase.com/dashboard/project/selnwgpyjctpjzdrfrey/functions
   - Deve aparecer execução da função `process-document`

### **Teste 2: Visualizar Detalhes do Documento**

1. Na tabela de documentos, clique no menu (⋮) de um documento
2. Clique em "Visualizar Detalhes"
3. **Verificar:**
   - ✅ Dialog abre corretamente
   - ✅ Informações básicas aparecem
   - ✅ Se processado: confiança do OCR aparece
   - ✅ Se processado: dados extraídos aparecem
   - ✅ Se processado: texto OCR aparece
   - ✅ Se não processado: mensagem de "Processamento em andamento"

### **Teste 3: Processamento Completo End-to-End**

1. Faça upload de uma imagem de documento
2. Aguarde ~10-15 segundos
3. Recarregue a página
4. Clique em "Visualizar Detalhes"
5. **Verificar:**
   - ✅ Status = "Processado"
   - ✅ Tipo foi classificado automaticamente
   - ✅ Confiança do OCR >= 60%
   - ✅ Texto extraído está presente
   - ✅ Dados estruturados foram extraídos (se aplicável)

### **Teste 4: Verificar no Banco de Dados**

```sql
-- Ver documentos processados
SELECT 
  id, 
  name, 
  type, 
  processed, 
  ocr_confidence,
  LENGTH(ocr_text) as text_length,
  processed_at,
  metadata
FROM documents
WHERE processed = true
ORDER BY processed_at DESC
LIMIT 5;

-- Ver AI Insights criados
SELECT 
  id,
  type,
  confidence,
  status,
  data,
  created_at
FROM ai_insights
ORDER BY created_at DESC
LIMIT 5;
```

---

## 📊 **LOGS ESPERADOS**

### **No Terminal (Next.js)**

```
POST /t/contabil-pro-teste/documentos 200 in 500ms
🚀 [registerUploadedDocument] Invocando Edge Function... {
  document_id: '9878d797-f68f-445f-9420-6a7fec6ec47b',
  tenant_id: '550e8400-e29b-41d4-a716-446655440000',
  storage_path: '550e8400-e29b-41d4-a716-446655440000/other/2025/...',
  mime_type: 'application/pdf'
}
✅ [registerUploadedDocument] Edge Function invocada com sucesso: { ... }
```

### **No Dashboard do Supabase (Edge Function Logs)**

```
Processamento iniciado: {
  document_id: '...',
  tenant_id: '...',
  storage_path: '...',
  mime_type: '...'
}

Arquivo baixado: 12.1 MB
Tipo detectado: pdf
Processando PDF...
Texto extraído: 5432 caracteres
Classificando documento...
Tipo classificado: invoice (confiança: 0.92)
Extraindo dados estruturados...
Dados extraídos: { numero_nota: '123', valor_total: '1500.00', ... }
Documento atualizado com sucesso
AI Insight criado
Eventos de auditoria registrados
Processamento concluído com sucesso
```

---

## 🎯 **CHECKLIST DE VALIDAÇÃO**

### **Infraestrutura**
- [x] Edge Function deployada
- [x] Políticas RLS atualizadas
- [x] Secrets configurados (OPENAI_API_KEY)
- [ ] Edge Function sendo invocada (verificar logs)
- [ ] Edge Function executando com sucesso

### **Frontend**
- [x] Componente `DocumentDetailsDialog` criado
- [x] Botão "Visualizar Detalhes" adicionado
- [x] Componente `ScrollArea` criado
- [x] Funções `formatBytes` e `formatDate` criadas
- [ ] Dialog abre corretamente
- [ ] Todas as informações aparecem
- [ ] Botão "Baixar" funciona

### **Processamento**
- [ ] Upload invoca Edge Function
- [ ] Edge Function processa documento
- [ ] Documento é atualizado no banco
- [ ] OCR extrai texto
- [ ] Classificação automática funciona
- [ ] Dados estruturados são extraídos
- [ ] AI Insight é criado

---

## 🐛 **TROUBLESHOOTING**

### **Edge Function não aparece no Dashboard**

**Possíveis causas:**
1. Erro na invocação (verificar logs do terminal)
2. Erro de autenticação (verificar SUPABASE_URL e keys)
3. Timeout (documento muito grande)

**Como verificar:**
```bash
# Ver logs da Edge Function
cd contabil-pro
npx supabase functions logs process-document
```

### **Dialog não abre**

**Possíveis causas:**
1. Erro de importação (verificar console do browser)
2. Estado não está sendo atualizado

**Como verificar:**
- Abrir DevTools → Console
- Procurar por erros de React/TypeScript

### **Dados extraídos não aparecem**

**Possíveis causas:**
1. Edge Function não executou
2. Processamento falhou
3. Metadata está vazio

**Como verificar:**
```sql
SELECT id, name, processed, metadata, ocr_text
FROM documents
WHERE id = 'DOCUMENT_ID';
```

---

## 🎉 **RESULTADO ESPERADO**

Após todas as correções:

1. ✅ **Upload funciona** e invoca Edge Function
2. ✅ **Edge Function processa** documento automaticamente
3. ✅ **Documento é atualizado** com OCR e classificação
4. ✅ **UI mostra detalhes** completos do documento
5. ✅ **Usuário pode visualizar** texto extraído e dados estruturados
6. ✅ **Sistema end-to-end** funcionando perfeitamente

---

**Próximo passo: TESTAR!** 🚀

Faça upload de um documento e verifique se:
1. Logs aparecem no terminal
2. Edge Function aparece no Dashboard do Supabase
3. Documento é processado
4. Dialog de detalhes mostra todas as informações

