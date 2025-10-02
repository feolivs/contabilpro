# 🚀 FASE 2: EDGE FUNCTIONS + OCR + EXTRAÇÃO DE DADOS

## 📊 **ANÁLISE COMPLETA DO ESTADO ATUAL**

### **✅ O que já está pronto**

#### **1. Infraestrutura Supabase**
- ✅ **Projeto:** JoyceSoft (ID: `selnwgpyjctpjzdrfrey`)
- ✅ **Região:** sa-east-1 (São Paulo)
- ✅ **Status:** ACTIVE_HEALTHY
- ✅ **OpenAI API Key:** Configurada nos secrets ✅
- ✅ **Bucket Storage:** `documentos` (50MB, privado)
- ✅ **Storage Policies:** 4 políticas limpas (Fase 1 concluída)

#### **2. Tabelas do Banco**

**Tabela `documents`** (19 colunas):
```sql
- id, tenant_id, name, original_name, path, hash
- size, mime_type, type (nfe|nfse|receipt|invoice|contract|other)
- entry_id, client_id, metadata (JSONB)
- ocr_text (TEXT) ← Será preenchido pela Edge Function
- ocr_confidence (DECIMAL 0-1) ← Será preenchido pela Edge Function
- processed (BOOLEAN) ← Será atualizado para TRUE
- processed_at (TIMESTAMP) ← Será preenchido
- uploaded_by, created_at, updated_at
```

**Tabela `ai_insights`** (10 colunas):
```sql
- id, tenant_id, entry_id
- type (classification|reconciliation|anomaly|etc.)
- confidence (DECIMAL 0-1)
- data (JSONB) ← Dados extraídos do documento
- status (pending|awaiting_confirmation|confirmed|rejected|needs_review)
- reviewed_by, reviewed_at, created_at
```

**Tabela `document_events`** (auditoria LGPD):
```sql
- id, tenant_id, document_id, user_id
- event_type (upload|process_start|process_complete|process_error|etc.)
- metadata (JSONB), created_at
```

#### **3. Tipos de Documentos Suportados**

| Tipo | Label | Campos a Extrair |
|------|-------|------------------|
| **nfe** | Nota Fiscal Eletrônica | numero_nota, serie, data_emissao, cnpj_emitente, nome_emitente, valor_total, cfop, natureza_operacao, chave_acesso |
| **nfse** | Nota Fiscal de Serviço | numero_nota, data_emissao, cnpj_prestador, nome_prestador, valor_servicos, iss_retido, descricao_servico |
| **receipt** | Recibo | data, valor, pagador, beneficiario, descricao, forma_pagamento |
| **invoice** | Fatura/Boleto | numero, data_vencimento, valor, beneficiario, codigo_barras, linha_digitavel |
| **contract** | Contrato | partes, objeto, valor, vigencia_inicio, vigencia_fim, clausulas_principais |
| **das** | DAS - Simples Nacional | periodo_apuracao, valor_total, vencimento, cnpj, codigo_barras |
| **darf** | DARF | codigo_receita, periodo_apuracao, valor_principal, multa, juros, valor_total, vencimento |
| **extrato** | Extrato Bancário | banco, agencia, conta, periodo, saldo_inicial, saldo_final, transacoes[] |
| **other** | Outros | campos_relevantes (genérico) |

---

## 🎯 **OBJETIVO DA FASE 2**

Implementar Edge Function que:
1. ✅ Recebe notificação de upload de documento
2. ✅ Baixa arquivo do Storage
3. ✅ Detecta tipo (PDF/Imagem/XML)
4. ✅ Processa com **GPT-4o-mini** (custo otimizado):
   - OCR de imagens
   - Extração de texto de PDFs
   - Classificação automática
   - Extração de dados estruturados
5. ✅ Atualiza documento no banco
6. ✅ Cria AI Insight com dados extraídos
7. ✅ Registra eventos de auditoria

---

## 💰 **ESTRATÉGIA DE MODELOS (CUSTO OTIMIZADO)**

### **GPT-4o-mini** - Modelo Principal
- **Custo:** $0.150/1M tokens input, $0.600/1M tokens output
- **Uso:** Classificação + Extração + OCR
- **Vantagens:**
  - 82% mais barato que GPT-4o
  - Suporta Vision (OCR de imagens)
  - Excelente para tarefas estruturadas
  - JSON mode nativo

### **Estimativa de Custos**

| Operação | Tokens Input | Tokens Output | Custo/Doc |
|----------|--------------|---------------|-----------|
| OCR Imagem | ~1.500 | ~500 | $0.00052 |
| Classificação | ~500 | ~100 | $0.00013 |
| Extração Dados | ~1.000 | ~300 | $0.00033 |
| **TOTAL/DOC** | ~3.000 | ~900 | **$0.00098** |

**Custo mensal (1.000 docs):** ~$1.00 USD 💰

---

## 📋 **PLANO DE IMPLEMENTAÇÃO**

### **Tarefa 1: Criar Estrutura de Edge Functions** ⏱️ 30min

```bash
supabase/
└── functions/
    └── process-document/
        ├── index.ts                    # Orquestrador principal
        ├── processors/
        │   ├── pdf-processor.ts        # Processar PDFs
        │   ├── image-processor.ts      # OCR de imagens
        │   └── xml-processor.ts        # Parser de NFe/NFSe
        └── utils/
            ├── openai.ts               # Cliente OpenAI (GPT-4o-mini)
            ├── supabase.ts             # Cliente Supabase
            └── types.ts                # Tipos TypeScript
```

### **Tarefa 2: Implementar Utils** ⏱️ 2h

#### **2.1: Cliente OpenAI (`utils/openai.ts`)**
- Configurar GPT-4o-mini
- Função de OCR (Vision)
- Função de classificação
- Função de extração estruturada
- Prompts otimizados para cada tipo de documento

#### **2.2: Cliente Supabase (`utils/supabase.ts`)**
- Criar cliente admin
- Função para baixar arquivo do Storage
- Função para atualizar documento
- Função para criar AI Insight
- Função para registrar eventos

#### **2.3: Tipos (`utils/types.ts`)**
- Interfaces de request/response
- Tipos de documentos
- Tipos de dados extraídos

### **Tarefa 3: Implementar Processadores** ⏱️ 4h

#### **3.1: Image Processor (`processors/image-processor.ts`)**
- Converter imagem para base64
- Chamar GPT-4o-mini Vision
- Extrair texto completo
- Retornar texto + confiança

#### **3.2: PDF Processor (`processors/pdf-processor.ts`)**
- Tentar extrair texto nativo (pdf-parse)
- Se falhar, converter para imagem e usar Vision
- Retornar texto + confiança

#### **3.3: XML Processor (`processors/xml-processor.ts`)**
- Parser de NFe (estrutura padrão)
- Parser de NFSe (múltiplos padrões municipais)
- Validação de assinatura digital (futuro)
- Retornar dados estruturados

### **Tarefa 4: Implementar Orquestrador** ⏱️ 2h

#### **4.1: Orquestrador Principal (`index.ts`)**
```typescript
1. Receber payload: { document_id, tenant_id, storage_path, mime_type }
2. Validar entrada
3. Baixar arquivo do Storage
4. Detectar tipo de arquivo
5. Chamar processador apropriado
6. Classificar documento (GPT-4o-mini)
7. Extrair dados estruturados (GPT-4o-mini)
8. Atualizar documento no banco
9. Criar AI Insight
10. Registrar eventos
11. Retornar resultado
```

### **Tarefa 5: Deploy e Testes** ⏱️ 1h

#### **5.1: Deploy**
```bash
# Login no Supabase
supabase login

# Link com projeto
supabase link --project-ref selnwgpyjctpjzdrfrey

# Deploy da função
supabase functions deploy process-document

# Verificar secrets
supabase secrets list
```

#### **5.2: Testes**
- Testar com imagem (JPG/PNG)
- Testar com PDF nativo
- Testar com PDF escaneado
- Testar com XML (NFe)
- Verificar atualização no banco
- Verificar criação de AI Insight

### **Tarefa 6: Integrar com Upload** ⏱️ 30min

#### **6.1: Atualizar Server Action (`src/actions/documents.ts`)**
```typescript
// Após inserir documento no banco, invocar Edge Function
const { error: invokeError } = await supabase.functions.invoke(
  'process-document',
  {
    body: {
      document_id: document.id,
      tenant_id: session.tenant_id,
      storage_path: storagePath,
      mime_type: file.type,
    },
  }
);
```

---

## 📊 **PROMPTS OTIMIZADOS PARA GPT-4o-mini**

### **Prompt de Classificação**
```
Você é um classificador de documentos contábeis brasileiros.
Classifique o documento em UMA das categorias:
- nfe: Nota Fiscal Eletrônica
- nfse: Nota Fiscal de Serviço Eletrônica
- receipt: Recibo
- invoice: Fatura/Boleto
- contract: Contrato
- das: DAS - Simples Nacional
- darf: DARF
- extrato: Extrato Bancário
- other: Outros

Retorne JSON:
{
  "type": "nfe",
  "confidence": 0.95,
  "reasoning": "Documento contém chave de acesso NFe e DANFE"
}
```

### **Prompt de Extração (NFe)**
```
Extraia os seguintes dados da Nota Fiscal Eletrônica:
- numero_nota: Número da nota
- serie: Série
- data_emissao: Data de emissão (ISO 8601)
- cnpj_emitente: CNPJ do emitente
- nome_emitente: Nome/Razão Social do emitente
- valor_total: Valor total (número)
- cfop: Código Fiscal de Operações
- natureza_operacao: Natureza da operação
- chave_acesso: Chave de acesso (44 dígitos)

Retorne JSON com os campos. Use null para campos não encontrados.
```

### **Prompt de Extração (DAS)**
```
Extraia os seguintes dados do DAS - Simples Nacional:
- periodo_apuracao: Período de apuração (MM/YYYY)
- valor_total: Valor total a pagar (número)
- vencimento: Data de vencimento (ISO 8601)
- cnpj: CNPJ do contribuinte
- codigo_barras: Código de barras

Retorne JSON com os campos. Use null para campos não encontrados.
```

---

## ✅ **CRITÉRIOS DE ACEITAÇÃO**

### **Funcionalidades**
- [ ] Edge Function deployada e acessível
- [ ] Upload de imagem invoca função automaticamente
- [ ] OCR extrai texto de imagens
- [ ] PDF nativo tem texto extraído
- [ ] PDF escaneado usa Vision
- [ ] XML (NFe) é parseado corretamente
- [ ] Documento é classificado automaticamente
- [ ] Dados estruturados são extraídos
- [ ] Campo `ocr_text` é preenchido
- [ ] Campo `ocr_confidence` é preenchido
- [ ] Campo `processed` é atualizado para TRUE
- [ ] Campo `processed_at` é preenchido
- [ ] AI Insight é criado com dados extraídos
- [ ] Eventos de auditoria são registrados

### **Performance**
- [ ] Processamento completa em < 10 segundos
- [ ] Custo por documento < $0.001 USD
- [ ] Sem timeouts

### **Segurança**
- [ ] Apenas Edge Function pode atualizar `processed`
- [ ] RLS continua funcionando
- [ ] Secrets não são expostos

---

## 🚀 **PRÓXIMOS PASSOS IMEDIATOS**

1. **Criar estrutura de pastas** (5min)
2. **Implementar `utils/types.ts`** (15min)
3. **Implementar `utils/openai.ts`** (1h)
4. **Implementar `utils/supabase.ts`** (30min)
5. **Implementar `processors/image-processor.ts`** (1h)
6. **Implementar `processors/pdf-processor.ts`** (1h)
7. **Implementar `processors/xml-processor.ts`** (1h)
8. **Implementar `index.ts`** (1h)
9. **Deploy e testes** (1h)
10. **Integrar com upload** (30min)

**TOTAL:** ~8 horas

---

## 📚 **REFERÊNCIAS**

- [OpenAI GPT-4o-mini](https://platform.openai.com/docs/models/gpt-4o-mini)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [NFe - Manual de Integração](http://www.nfe.fazenda.gov.br/)
- [NFSe - Padrão Nacional](https://www.gov.br/nfse/)

---

**Pronto para começar a implementação?** 🚀

