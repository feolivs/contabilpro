// ============================================
// TYPES: Edge Function Process Document
// ============================================

// Tipos de documentos suportados
export type DocumentType =
  | 'nfe' // Nota Fiscal Eletrônica
  | 'nfse' // Nota Fiscal de Serviço
  | 'receipt' // Recibo
  | 'invoice' // Fatura/Boleto
  | 'contract' // Contrato
  | 'das' // DAS - Simples Nacional
  | 'darf' // DARF - Tributos Federais
  | 'extrato' // Extrato Bancário
  | 'other' // Outros

// Request da Edge Function
export interface ProcessDocumentRequest {
  document_id: string
  storage_path: string
  mime_type: string
}

// Response da Edge Function
export interface ProcessDocumentResponse {
  success: boolean
  document_id: string
  processed: boolean
  ocr_text?: string
  ocr_confidence?: number
  type?: DocumentType
  extracted_data?: Record<string, any>
  error?: string
}

// Resultado do processamento
export interface ProcessingResult {
  text: string
  confidence: number
  type: DocumentType
  extracted_data: Record<string, any>
}

// Resultado da classificação
export interface ClassificationResult {
  type: DocumentType
  confidence: number
  reasoning: string
}

// Dados extraídos de NFe
export interface NFeData {
  numero_nota: string
  serie: string
  data_emissao: string
  cnpj_emitente: string
  nome_emitente: string
  cnpj_destinatario?: string
  nome_destinatario?: string
  valor_total: number
  valor_produtos?: number
  valor_icms?: number
  valor_ipi?: number
  cfop: string
  natureza_operacao: string
  chave_acesso: string
  protocolo_autorizacao?: string
}

// Dados extraídos de NFSe
export interface NFSeData {
  numero_nota: string
  data_emissao: string
  cnpj_prestador: string
  nome_prestador: string
  cnpj_tomador?: string
  nome_tomador?: string
  valor_servicos: number
  valor_iss: number
  iss_retido: boolean
  aliquota_iss?: number
  descricao_servico: string
  codigo_servico?: string
  codigo_verificacao?: string
}

// Dados extraídos de Recibo
export interface ReceiptData {
  data: string
  valor: number
  pagador: string
  beneficiario: string
  descricao: string
  forma_pagamento?: string
  referente_a?: string
}

// Dados extraídos de Fatura/Boleto
export interface InvoiceData {
  numero: string
  data_vencimento: string
  data_emissao?: string
  valor: number
  beneficiario: string
  cnpj_beneficiario?: string
  pagador?: string
  codigo_barras?: string
  linha_digitavel?: string
  nosso_numero?: string
  banco?: string
}

// Dados extraídos de DAS
export interface DASData {
  periodo_apuracao: string
  valor_total: number
  vencimento: string
  cnpj: string
  razao_social?: string
  codigo_barras: string
  linha_digitavel?: string
  receita_bruta?: number
  aliquota?: number
}

// Dados extraídos de DARF
export interface DARFData {
  codigo_receita: string
  periodo_apuracao: string
  vencimento: string
  cnpj_cpf: string
  valor_principal: number
  multa?: number
  juros?: number
  valor_total: number
  numero_referencia?: string
}

// Dados extraídos de Extrato Bancário
export interface ExtratoData {
  banco: string
  agencia: string
  conta: string
  periodo_inicio: string
  periodo_fim: string
  saldo_inicial: number
  saldo_final: number
  total_creditos?: number
  total_debitos?: number
  transacoes?: Array<{
    data: string
    descricao: string
    valor: number
    tipo: 'credito' | 'debito'
    saldo?: number
  }>
}

// Dados extraídos de Contrato
export interface ContractData {
  numero?: string
  data_assinatura?: string
  partes: string[]
  objeto: string
  valor?: number
  vigencia_inicio?: string
  vigencia_fim?: string
  clausulas_principais?: string[]
  forma_pagamento?: string
}

// Union type de todos os dados extraídos
export type ExtractedData =
  | NFeData
  | NFSeData
  | ReceiptData
  | InvoiceData
  | DASData
  | DARFData
  | ExtratoData
  | ContractData
  | Record<string, any>

// Evento de auditoria
export interface DocumentEvent {
  document_id: string
  event_type: 'process_start' | 'process_complete' | 'process_error' | 'ocr_complete' | 'classify'
  metadata: Record<string, any>
}

// AI Insight
export interface AIInsight {
  entry_id?: string
  type: 'classification' | 'extraction'
  confidence: number
  data: Record<string, any>
  status: 'pending' | 'awaiting_confirmation' | 'confirmed' | 'rejected' | 'needs_review'
}
