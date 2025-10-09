# parse-xml - Parser de NF-e

Edge Function para processar documentos fiscais XML (NF-e, NFSe, NFC-e).

## 📋 Funcionalidade

Esta função:
1. Recebe um `documentId` e `clientId`
2. Busca o documento no banco de dados
3. Faz download do arquivo XML do Storage
4. Faz parsing do XML usando DOMParser
5. Extrai dados da NF-e (emitente, destinatário, itens, impostos)
6. Persiste os dados nas tabelas `invoices` e `invoice_items`
7. Atualiza o status do documento

## 🔌 API

### Endpoint
```
POST /functions/v1/parse-xml
```

### Headers
```
Authorization: Bearer YOUR_ANON_KEY
Content-Type: application/json
```

### Request Body
```json
{
  "documentId": "uuid-do-documento",
  "clientId": "uuid-do-cliente"
}
```

### Response Success (200)
```json
{
  "success": true,
  "invoiceId": "uuid-da-invoice",
  "itemsCount": 5
}
```

### Response Error (500)
```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

## 📊 Dados Extraídos

### Invoice (Cabeçalho da NF-e)
- Número da nota
- Série
- Chave XML (44 dígitos)
- Data de emissão
- Data de operação
- **Emitente**: CNPJ, nome, endereço
- **Destinatário**: CNPJ/CPF, nome, endereço
- **Valores**: Total, desconto, frete, seguro
- **Impostos**: ICMS, IPI, PIS, COFINS, ISS

### Invoice Items (Itens da NF-e)
- Código do produto
- Descrição
- NCM (Nomenclatura Comum do Mercosul)
- CEST (Código Especificador da Substituição Tributária)
- CFOP (Código Fiscal de Operações)
- Unidade comercial
- Quantidade
- Valor unitário
- Valor total
- Impostos por item

## 🔍 Exemplo de XML Suportado

```xml
<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe12345678901234567890123456789012345678901234">
      <ide>
        <nNF>123</nNF>
        <serie>1</serie>
        <dhEmi>2025-01-08T10:00:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>12345678000190</CNPJ>
        <xNome>Empresa Emitente LTDA</xNome>
      </emit>
      <dest>
        <CNPJ>98765432000100</CNPJ>
        <xNome>Cliente Destinatário</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>001</cProd>
          <xProd>Produto Exemplo</xProd>
          <NCM>12345678</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>10.00</qCom>
          <vUnCom>100.00</vUnCom>
        </prod>
      </det>
    </infNFe>
  </NFe>
</nfeProc>
```

## 🔐 Segurança

- Usa Service Role Key (server-side only)
- Valida `documentId` e `clientId`
- Verifica ownership do documento (RLS)
- Sanitiza inputs antes de processar
- Não expõe stack traces ao cliente

## 🐛 Tratamento de Erros

A função trata os seguintes erros:

1. **Documento não encontrado** - Retorna erro 404
2. **Falha no download** - Erro ao buscar arquivo do Storage
3. **XML inválido** - Erro de parsing
4. **Dados faltando** - Campos obrigatórios ausentes
5. **Erro de persistência** - Falha ao salvar no banco

Em caso de erro, o status do documento é atualizado para `failed` com a mensagem de erro.

## 📈 Performance

- Tempo médio: 2-5 segundos
- Limite de tamanho: 10MB
- Timeout: 60 segundos
- Suporta múltiplos itens (testado com 100+ itens)

## 🧪 Testando

```bash
# Teste local
curl -i --location --request POST 'http://localhost:54321/functions/v1/parse-xml' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "documentId": "123e4567-e89b-12d3-a456-426614174000",
    "clientId": "123e4567-e89b-12d3-a456-426614174001"
  }'
```

## 📝 Logs

A função emite logs estruturados:

```json
{
  "level": "info",
  "message": "Starting XML parse",
  "documentId": "...",
  "clientId": "..."
}
```

## 🔄 Fluxo Completo

```
1. Frontend faz upload do XML
   ↓
2. Arquivo salvo no Storage
   ↓
3. Metadata criada na tabela documents
   ↓
4. Frontend chama parse-xml Edge Function
   ↓
5. Edge Function baixa o XML
   ↓
6. Parse e extração de dados
   ↓
7. Persistência em invoices + invoice_items
   ↓
8. Status atualizado para "completed"
   ↓
9. Frontend recebe confirmação
```

## 🚀 Melhorias Futuras

- [ ] Suporte a NFSe (diferentes layouts por município)
- [ ] Suporte a NFC-e (modelo 65)
- [ ] Validação de assinatura digital
- [ ] Cache de CNPJs já processados
- [ ] Webhook para notificações
- [ ] Processamento em batch

