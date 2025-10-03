// ============================================
// PROCESSOR: XML (NFe/NFSe)
// ============================================

import type { NFeData, NFSeData, ProcessingResult } from '../utils/types.ts'

// ============================================
// Processar XML
// ============================================
export async function processXML(fileData: Uint8Array): Promise<ProcessingResult> {
  console.log('📋 Processando XML...')

  // 1. Converter para string
  const decoder = new TextDecoder('utf-8')
  const xmlString = decoder.decode(fileData)

  // 2. Detectar tipo de XML (NFe ou NFSe)
  const isNFe = xmlString.includes('<NFe') || xmlString.includes('<nfeProc')
  const isNFSe = xmlString.includes('<NFSe') || xmlString.includes('<RPS')

  if (isNFe) {
    console.log('📄 Detectado: NFe')
    return processNFe(xmlString)
  } else if (isNFSe) {
    console.log('📄 Detectado: NFSe')
    return processNFSe(xmlString)
  } else {
    throw new Error('Tipo de XML não suportado (esperado NFe ou NFSe)')
  }
}

// ============================================
// Processar NFe
// ============================================
function processNFe(xmlString: string): ProcessingResult {
  console.log('🔍 Extraindo dados da NFe...')

  // Extrair campos principais usando regex
  // Nota: Em produção, seria melhor usar um parser XML adequado
  const extractedData: NFeData = {
    numero_nota: extractXMLValue(xmlString, 'nNF') || '',
    serie: extractXMLValue(xmlString, 'serie') || '',
    data_emissao: extractXMLValue(xmlString, 'dhEmi') || '',
    cnpj_emitente: extractXMLValue(xmlString, 'emit>.*?CNPJ') || '',
    nome_emitente: extractXMLValue(xmlString, 'emit>.*?xNome') || '',
    cnpj_destinatario: extractXMLValue(xmlString, 'dest>.*?CNPJ'),
    nome_destinatario: extractXMLValue(xmlString, 'dest>.*?xNome'),
    valor_total: parseFloat(extractXMLValue(xmlString, 'vNF') || '0'),
    valor_produtos: parseFloat(extractXMLValue(xmlString, 'vProd') || '0'),
    valor_icms: parseFloat(extractXMLValue(xmlString, 'vICMS') || '0'),
    valor_ipi: parseFloat(extractXMLValue(xmlString, 'vIPI') || '0'),
    cfop: extractXMLValue(xmlString, 'CFOP') || '',
    natureza_operacao: extractXMLValue(xmlString, 'natOp') || '',
    chave_acesso: extractXMLValue(xmlString, 'chNFe') || '',
    protocolo_autorizacao: extractXMLValue(xmlString, 'nProt'),
  }

  // Gerar texto legível
  const text = `
NFe ${extractedData.numero_nota} - Série ${extractedData.serie}
Emitente: ${extractedData.nome_emitente} (${extractedData.cnpj_emitente})
Data: ${extractedData.data_emissao}
Valor Total: R$ ${extractedData.valor_total.toFixed(2)}
CFOP: ${extractedData.cfop}
Natureza: ${extractedData.natureza_operacao}
Chave de Acesso: ${extractedData.chave_acesso}
  `.trim()

  console.log('✅ NFe processada com sucesso')

  return {
    text,
    confidence: 1.0, // XML estruturado = alta confiança
    type: 'nfe',
    extracted_data: extractedData,
  }
}

// ============================================
// Processar NFSe
// ============================================
function processNFSe(xmlString: string): ProcessingResult {
  console.log('🔍 Extraindo dados da NFSe...')

  // Extrair campos principais
  // Nota: NFSe tem múltiplos padrões municipais, esta é uma implementação genérica
  const extractedData: NFSeData = {
    numero_nota: extractXMLValue(xmlString, 'Numero') || '',
    data_emissao: extractXMLValue(xmlString, 'DataEmissao') || '',
    cnpj_prestador: extractXMLValue(xmlString, 'Prestador>.*?Cnpj') || '',
    nome_prestador: extractXMLValue(xmlString, 'Prestador>.*?RazaoSocial') || '',
    cnpj_tomador: extractXMLValue(xmlString, 'Tomador>.*?Cnpj'),
    nome_tomador: extractXMLValue(xmlString, 'Tomador>.*?RazaoSocial'),
    valor_servicos: parseFloat(extractXMLValue(xmlString, 'ValorServicos') || '0'),
    valor_iss: parseFloat(extractXMLValue(xmlString, 'ValorIss') || '0'),
    iss_retido: extractXMLValue(xmlString, 'IssRetido') === '1',
    aliquota_iss: parseFloat(extractXMLValue(xmlString, 'Aliquota') || '0'),
    descricao_servico: extractXMLValue(xmlString, 'Discriminacao') || '',
    codigo_servico: extractXMLValue(xmlString, 'ItemListaServico'),
    codigo_verificacao: extractXMLValue(xmlString, 'CodigoVerificacao'),
  }

  // Gerar texto legível
  const text = `
NFSe ${extractedData.numero_nota}
Prestador: ${extractedData.nome_prestador} (${extractedData.cnpj_prestador})
Data: ${extractedData.data_emissao}
Valor dos Serviços: R$ ${extractedData.valor_servicos.toFixed(2)}
ISS: R$ ${extractedData.valor_iss.toFixed(2)} (${extractedData.iss_retido ? 'Retido' : 'Não Retido'})
Descrição: ${extractedData.descricao_servico}
  `.trim()

  console.log('✅ NFSe processada com sucesso')

  return {
    text,
    confidence: 1.0, // XML estruturado = alta confiança
    type: 'nfse',
    extracted_data: extractedData,
  }
}

// ============================================
// Extrair valor de tag XML usando regex
// ============================================
function extractXMLValue(xml: string, tagPattern: string): string | undefined {
  // Suporta padrões como "nNF" ou "emit>.*?CNPJ"
  const patterns = [
    new RegExp(`<${tagPattern}>(.*?)</${tagPattern.split('>')[0]}>`, 's'),
    new RegExp(`<${tagPattern}[^>]*>(.*?)</${tagPattern.split('>')[0]}>`, 's'),
  ]

  for (const pattern of patterns) {
    const match = xml.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return undefined
}
