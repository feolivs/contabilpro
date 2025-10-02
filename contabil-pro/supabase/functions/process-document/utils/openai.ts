// ============================================
// UTILS: Cliente OpenAI (GPT-4o-mini)
// ============================================

import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts';
import type { ClassificationResult, DocumentType, ExtractedData } from './types.ts';

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

// Modelo a ser usado (GPT-4o-mini para custo otimizado)
const MODEL = 'gpt-4o-mini';

// ============================================
// Classificar Documento
// ============================================
export async function classifyDocument(text: string): Promise<ClassificationResult> {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `Você é um classificador de documentos contábeis brasileiros.
Classifique o documento em UMA das categorias:
- nfe: Nota Fiscal Eletrônica (DANFE, chave de acesso 44 dígitos)
- nfse: Nota Fiscal de Serviço Eletrônica (ISS, prestador/tomador)
- receipt: Recibo (comprovante de pagamento simples)
- invoice: Fatura/Boleto (código de barras, vencimento)
- contract: Contrato (partes, cláusulas, vigência)
- das: DAS - Simples Nacional (período de apuração, receita bruta)
- darf: DARF - Tributos Federais (código da receita, IRPJ/CSLL)
- extrato: Extrato Bancário (movimentações, saldo)
- other: Outros documentos

Retorne JSON com:
{
  "type": "nfe",
  "confidence": 0.95,
  "reasoning": "Documento contém chave de acesso NFe e DANFE"
}`,
      },
      {
        role: 'user',
        content: text.substring(0, 4000), // Limitar a 4000 caracteres
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    type: result.type || 'other',
    confidence: result.confidence || 0.5,
    reasoning: result.reasoning || 'Classificação automática',
  };
}

// ============================================
// Extrair Dados Estruturados
// ============================================
export async function extractStructuredData(
  text: string,
  documentType: DocumentType
): Promise<ExtractedData> {
  const prompts: Record<DocumentType, string> = {
    nfe: `Extraia dados da Nota Fiscal Eletrônica (NFe):
- numero_nota: Número da nota
- serie: Série
- data_emissao: Data de emissão (ISO 8601)
- cnpj_emitente: CNPJ do emitente (14 dígitos)
- nome_emitente: Nome/Razão Social do emitente
- cnpj_destinatario: CNPJ do destinatário (opcional)
- nome_destinatario: Nome do destinatário (opcional)
- valor_total: Valor total (número)
- valor_produtos: Valor dos produtos (opcional)
- valor_icms: Valor do ICMS (opcional)
- cfop: Código Fiscal de Operações
- natureza_operacao: Natureza da operação
- chave_acesso: Chave de acesso (44 dígitos)`,

    nfse: `Extraia dados da Nota Fiscal de Serviço Eletrônica (NFSe):
- numero_nota: Número da nota
- data_emissao: Data de emissão (ISO 8601)
- cnpj_prestador: CNPJ do prestador (14 dígitos)
- nome_prestador: Nome/Razão Social do prestador
- cnpj_tomador: CNPJ do tomador (opcional)
- nome_tomador: Nome do tomador (opcional)
- valor_servicos: Valor dos serviços (número)
- valor_iss: Valor do ISS (número)
- iss_retido: ISS retido (true/false)
- aliquota_iss: Alíquota do ISS em % (opcional)
- descricao_servico: Descrição do serviço
- codigo_servico: Código do serviço (opcional)`,

    receipt: `Extraia dados do Recibo:
- data: Data (ISO 8601)
- valor: Valor (número)
- pagador: Nome do pagador
- beneficiario: Nome do beneficiário
- descricao: Descrição do pagamento
- forma_pagamento: Forma de pagamento (opcional)
- referente_a: Referente a (opcional)`,

    invoice: `Extraia dados da Fatura/Boleto:
- numero: Número do documento
- data_vencimento: Data de vencimento (ISO 8601)
- data_emissao: Data de emissão (ISO 8601, opcional)
- valor: Valor (número)
- beneficiario: Nome do beneficiário
- cnpj_beneficiario: CNPJ do beneficiário (opcional)
- pagador: Nome do pagador (opcional)
- codigo_barras: Código de barras (opcional)
- linha_digitavel: Linha digitável (opcional)
- nosso_numero: Nosso número (opcional)
- banco: Nome do banco (opcional)`,

    das: `Extraia dados do DAS - Simples Nacional:
- periodo_apuracao: Período de apuração (MM/YYYY)
- valor_total: Valor total a pagar (número)
- vencimento: Data de vencimento (ISO 8601)
- cnpj: CNPJ do contribuinte (14 dígitos)
- razao_social: Razão social (opcional)
- codigo_barras: Código de barras
- linha_digitavel: Linha digitável (opcional)
- receita_bruta: Receita bruta (opcional)
- aliquota: Alíquota em % (opcional)`,

    darf: `Extraia dados do DARF:
- codigo_receita: Código da receita
- periodo_apuracao: Período de apuração (MM/YYYY)
- vencimento: Data de vencimento (ISO 8601)
- cnpj_cpf: CNPJ ou CPF (11 ou 14 dígitos)
- valor_principal: Valor principal (número)
- multa: Multa (número, opcional)
- juros: Juros (número, opcional)
- valor_total: Valor total (número)
- numero_referencia: Número de referência (opcional)`,

    extrato: `Extraia dados do Extrato Bancário:
- banco: Nome do banco
- agencia: Agência
- conta: Conta
- periodo_inicio: Período início (ISO 8601)
- periodo_fim: Período fim (ISO 8601)
- saldo_inicial: Saldo inicial (número)
- saldo_final: Saldo final (número)
- total_creditos: Total de créditos (opcional)
- total_debitos: Total de débitos (opcional)`,

    contract: `Extraia dados do Contrato:
- numero: Número do contrato (opcional)
- data_assinatura: Data de assinatura (ISO 8601, opcional)
- partes: Array com nomes das partes (contratante, contratado)
- objeto: Objeto do contrato
- valor: Valor (número, opcional)
- vigencia_inicio: Vigência início (ISO 8601, opcional)
- vigencia_fim: Vigência fim (ISO 8601, opcional)`,

    other: `Extraia informações relevantes do documento.`,
  };

  const prompt = prompts[documentType] || prompts.other;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `Você é um extrator de dados de documentos contábeis brasileiros.
${prompt}

Retorne JSON com os campos extraídos. Use null para campos não encontrados.
Para valores monetários, use números (ex: 1250.50).
Para datas, use formato ISO 8601 (ex: "2025-09-30T10:30:00Z").
Para CNPJ/CPF, mantenha apenas dígitos.`,
      },
      {
        role: 'user',
        content: text.substring(0, 4000),
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ============================================
// OCR de Imagem (GPT-4o-mini Vision)
// ============================================
export async function ocrImage(
  base64Image: string,
  mimeType: string
): Promise<{ text: string; confidence: number }> {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extraia TODO o texto desta imagem de documento contábil. Mantenha a formatação e estrutura. Seja preciso e completo.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: 'high', // Alta qualidade para melhor OCR
            },
          },
        ],
      },
    ],
    max_tokens: 4096,
  });

  const text = response.choices[0].message.content || '';
  
  // Estimar confiança baseado no tamanho do texto extraído
  const confidence = text.length > 100 ? 0.9 : text.length > 50 ? 0.7 : 0.5;

  return { text, confidence };
}

