# 📄 DOCUMENTOS CONTÁBEIS BRASILEIROS - GUIA COMPLETO

## 🎯 **TIPOS DE DOCUMENTOS E CAMPOS A EXTRAIR**

### **1. NFe - Nota Fiscal Eletrônica** 🧾

**Descrição:** Documento fiscal eletrônico que registra operações de circulação de mercadorias.

**Campos Obrigatórios:**
```typescript
{
  numero_nota: string;           // Ex: "000123456"
  serie: string;                 // Ex: "1"
  data_emissao: string;          // ISO 8601: "2025-09-30T10:30:00Z"
  cnpj_emitente: string;         // 14 dígitos
  nome_emitente: string;         // Razão Social
  cnpj_destinatario?: string;    // 14 dígitos
  nome_destinatario?: string;    // Razão Social
  valor_total: number;           // Ex: 1250.50
  valor_produtos: number;        // Ex: 1000.00
  valor_icms: number;            // Ex: 180.00
  valor_ipi?: number;            // Ex: 50.00
  cfop: string;                  // Ex: "5102"
  natureza_operacao: string;     // Ex: "Venda de mercadoria"
  chave_acesso: string;          // 44 dígitos
  protocolo_autorizacao?: string;
  data_autorizacao?: string;
}
```

**Palavras-chave para detecção:**
- "DANFE", "Nota Fiscal Eletrônica", "NFe"
- "Chave de Acesso", "Protocolo de Autorização"
- CFOP, ICMS, IPI

---

### **2. NFSe - Nota Fiscal de Serviço Eletrônica** 📋

**Descrição:** Documento fiscal eletrônico para prestação de serviços.

**Campos Obrigatórios:**
```typescript
{
  numero_nota: string;           // Ex: "000456"
  data_emissao: string;          // ISO 8601
  cnpj_prestador: string;        // 14 dígitos
  nome_prestador: string;        // Razão Social
  cnpj_tomador?: string;         // 14 dígitos
  nome_tomador?: string;         // Razão Social
  valor_servicos: number;        // Ex: 5000.00
  valor_iss: number;             // Ex: 250.00 (5%)
  iss_retido: boolean;           // true/false
  aliquota_iss: number;          // Ex: 5.0 (%)
  descricao_servico: string;     // Descrição detalhada
  codigo_servico?: string;       // Ex: "01.01" (Lista de Serviços)
  codigo_verificacao?: string;   // Código de verificação municipal
}
```

**Palavras-chave para detecção:**
- "Nota Fiscal de Serviço", "NFSe", "RPS"
- "ISS", "Prestador", "Tomador"
- "Código de Verificação"

---

### **3. Recibo** 🧾

**Descrição:** Comprovante de pagamento ou recebimento de valores.

**Campos Obrigatórios:**
```typescript
{
  data: string;                  // ISO 8601
  valor: number;                 // Ex: 1500.00
  pagador: string;               // Nome/CPF/CNPJ
  beneficiario: string;          // Nome/CPF/CNPJ
  descricao: string;             // Descrição do pagamento
  forma_pagamento?: string;      // "dinheiro", "pix", "transferencia", etc.
  referente_a?: string;          // Ex: "Serviços prestados em setembro/2025"
}
```

**Palavras-chave para detecção:**
- "Recibo", "Recebi de", "Valor de"
- "Referente a", "Pagamento"

---

### **4. Fatura/Boleto** 💳

**Descrição:** Documento de cobrança bancária.

**Campos Obrigatórios:**
```typescript
{
  numero: string;                // Número do documento
  data_vencimento: string;       // ISO 8601
  data_emissao?: string;         // ISO 8601
  valor: number;                 // Ex: 2500.00
  beneficiario: string;          // Nome do credor
  cnpj_beneficiario?: string;    // 14 dígitos
  pagador?: string;              // Nome do devedor
  codigo_barras?: string;        // 44 ou 47 dígitos
  linha_digitavel?: string;      // 47 dígitos com espaços
  nosso_numero?: string;         // Identificação do banco
  banco?: string;                // Ex: "001 - Banco do Brasil"
}
```

**Palavras-chave para detecção:**
- "Boleto", "Fatura", "Duplicata"
- "Código de Barras", "Linha Digitável"
- "Vencimento", "Nosso Número"

---

### **5. DAS - Simples Nacional** 🏦

**Descrição:** Documento de Arrecadação do Simples Nacional.

**Campos Obrigatórios:**
```typescript
{
  periodo_apuracao: string;      // Ex: "09/2025" (MM/YYYY)
  valor_total: number;           // Ex: 1250.00
  vencimento: string;            // ISO 8601
  cnpj: string;                  // 14 dígitos
  razao_social?: string;         // Nome da empresa
  codigo_barras: string;         // 48 dígitos
  linha_digitavel?: string;      // Com espaços
  receita_bruta?: number;        // Base de cálculo
  aliquota?: number;             // Ex: 6.0 (%)
}
```

**Palavras-chave para detecção:**
- "DAS", "Simples Nacional"
- "Período de Apuração"
- "Receita Bruta"

---

### **6. DARF - Documento de Arrecadação de Receitas Federais** 🏛️

**Descrição:** Guia para pagamento de tributos federais.

**Campos Obrigatórios:**
```typescript
{
  codigo_receita: string;        // Ex: "0190" (IRPJ)
  periodo_apuracao: string;      // Ex: "09/2025"
  vencimento: string;            // ISO 8601
  cnpj_cpf: string;              // 11 ou 14 dígitos
  valor_principal: number;       // Ex: 5000.00
  multa?: number;                // Ex: 50.00
  juros?: number;                // Ex: 25.00
  valor_total: number;           // Ex: 5075.00
  numero_referencia?: string;    // Número de referência
}
```

**Palavras-chave para detecção:**
- "DARF", "Receitas Federais"
- "Código da Receita"
- "IRPJ", "CSLL", "PIS", "COFINS"

---

### **7. Extrato Bancário** 🏦

**Descrição:** Relatório de movimentações bancárias.

**Campos Obrigatórios:**
```typescript
{
  banco: string;                 // Ex: "001 - Banco do Brasil"
  agencia: string;               // Ex: "1234-5"
  conta: string;                 // Ex: "12345-6"
  periodo_inicio: string;        // ISO 8601
  periodo_fim: string;           // ISO 8601
  saldo_inicial: number;         // Ex: 10000.00
  saldo_final: number;           // Ex: 8500.00
  total_creditos: number;        // Ex: 5000.00
  total_debitos: number;         // Ex: 6500.00
  transacoes: Array<{
    data: string;                // ISO 8601
    descricao: string;           // Ex: "PIX RECEBIDO"
    valor: number;               // Ex: 1500.00
    tipo: "credito" | "debito";
    saldo?: number;              // Saldo após transação
  }>;
}
```

**Palavras-chave para detecção:**
- "Extrato", "Movimentação", "Saldo"
- "Agência", "Conta Corrente"
- "Crédito", "Débito"

---

### **8. Contrato** 📜

**Descrição:** Documento de acordo entre partes.

**Campos Obrigatórios:**
```typescript
{
  numero?: string;               // Número do contrato
  data_assinatura?: string;      // ISO 8601
  partes: string[];              // ["Contratante: ...", "Contratado: ..."]
  objeto: string;                // Descrição do objeto do contrato
  valor?: number;                // Valor total (se aplicável)
  vigencia_inicio?: string;      // ISO 8601
  vigencia_fim?: string;         // ISO 8601
  clausulas_principais?: string[]; // Principais cláusulas
  forma_pagamento?: string;      // Descrição
}
```

**Palavras-chave para detecção:**
- "Contrato", "Acordo", "Instrumento"
- "Contratante", "Contratado"
- "Cláusula", "Vigência"

---

### **9. Comprovante de Pagamento** 💸

**Descrição:** Comprovante de transferência bancária, PIX, etc.

**Campos Obrigatórios:**
```typescript
{
  data: string;                  // ISO 8601
  valor: number;                 // Ex: 1500.00
  tipo: string;                  // "pix", "ted", "doc", "transferencia"
  pagador: string;               // Nome
  cpf_cnpj_pagador?: string;     // 11 ou 14 dígitos
  beneficiario: string;          // Nome
  cpf_cnpj_beneficiario?: string; // 11 ou 14 dígitos
  banco_origem?: string;         // Ex: "001"
  banco_destino?: string;        // Ex: "237"
  id_transacao?: string;         // ID único da transação
  autenticacao?: string;         // Código de autenticação
}
```

**Palavras-chave para detecção:**
- "Comprovante", "PIX", "TED", "DOC"
- "Transferência", "Pagamento"
- "Autenticação"

---

### **10. Guia de INSS** 🏥

**Descrição:** Guia de recolhimento de contribuição previdenciária.

**Campos Obrigatórios:**
```typescript
{
  competencia: string;           // Ex: "09/2025"
  vencimento: string;            // ISO 8601
  cnpj: string;                  // 14 dígitos
  valor_inss: number;            // Ex: 1200.00
  codigo_pagamento: string;      // Ex: "2100"
  codigo_barras?: string;        // 48 dígitos
  identificador?: string;        // Identificador único
}
```

**Palavras-chave para detecção:**
- "INSS", "GPS", "Guia da Previdência"
- "Contribuição Previdenciária"
- "Competência"

---

### **11. Guia de FGTS** 🏠

**Descrição:** Guia de recolhimento do FGTS.

**Campos Obrigatórios:**
```typescript
{
  competencia: string;           // Ex: "09/2025"
  vencimento: string;            // ISO 8601
  cnpj: string;                  // 14 dígitos
  valor_fgts: number;            // Ex: 800.00
  codigo_barras?: string;        // 48 dígitos
  conectividade_social?: string; // Número do conectividade social
}
```

**Palavras-chave para detecção:**
- "FGTS", "SEFIP", "GFIP"
- "Conectividade Social"
- "Competência"

---

### **12. Nota de Débito/Crédito** 📊

**Descrição:** Documento de ajuste de valores.

**Campos Obrigatórios:**
```typescript
{
  numero: string;                // Número do documento
  data_emissao: string;          // ISO 8601
  tipo: "debito" | "credito";    // Tipo de nota
  valor: number;                 // Ex: 500.00
  emitente: string;              // Nome
  destinatario: string;          // Nome
  motivo: string;                // Descrição do ajuste
  documento_referencia?: string; // NFe, NFSe, etc. relacionada
}
```

**Palavras-chave para detecção:**
- "Nota de Débito", "Nota de Crédito"
- "Ajuste", "Correção"

---

## 🎯 **RESUMO DE PRIORIDADES**

### **Alta Prioridade** (Fase 2)
1. ✅ NFe
2. ✅ NFSe
3. ✅ Recibo
4. ✅ Fatura/Boleto
5. ✅ DAS

### **Média Prioridade** (Fase 3)
6. ✅ DARF
7. ✅ Extrato Bancário
8. ✅ Comprovante de Pagamento

### **Baixa Prioridade** (Fase 4)
9. ✅ Contrato
10. ✅ Guia de INSS
11. ✅ Guia de FGTS
12. ✅ Nota de Débito/Crédito

---

## 📚 **REFERÊNCIAS NORMATIVAS**

- [NFe - Manual de Integração](http://www.nfe.fazenda.gov.br/)
- [NFSe - Padrão Nacional](https://www.gov.br/nfse/)
- [Simples Nacional](http://www8.receita.fazenda.gov.br/SimplesNacional/)
- [DARF - Receita Federal](https://www.gov.br/receitafederal/)
- [INSS - Previdência Social](https://www.gov.br/inss/)
- [FGTS - Caixa Econômica](https://www.caixa.gov.br/fgts/)

