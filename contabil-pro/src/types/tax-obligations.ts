// Tipos para obrigações fiscais

export type TaxObligationType =
  | 'das' // DAS - Simples Nacional
  | 'irpj' // IRPJ - Imposto de Renda Pessoa Jurídica
  | 'csll' // CSLL - Contribuição Social sobre o Lucro Líquido
  | 'pis' // PIS - Programa de Integração Social
  | 'cofins' // COFINS - Contribuição para Financiamento da Seguridade Social
  | 'icms' // ICMS - Imposto sobre Circulação de Mercadorias e Serviços
  | 'iss' // ISS - Imposto sobre Serviços
  | 'inss' // INSS - Instituto Nacional do Seguro Social
  | 'fgts' // FGTS - Fundo de Garantia do Tempo de Serviço
  | 'dctfweb' // DCTFWeb - Declaração de Débitos e Créditos Tributários Federais
  | 'defis' // DEFIS - Declaração de Informações Socioeconômicas e Fiscais
  | 'dmed' // DMED - Declaração de Serviços Médicos e de Saúde
  | 'dirf' // DIRF - Declaração do Imposto de Renda Retido na Fonte
  | 'rais' // RAIS - Relação Anual de Informações Sociais
  | 'caged' // CAGED - Cadastro Geral de Empregados e Desempregados
  | 'esocial' // eSocial - Sistema de Escrituração Digital das Obrigações Fiscais
  | 'efd_contribuicoes' // EFD-Contribuições
  | 'sped_fiscal' // SPED Fiscal
  | 'other' // Outras obrigações

export type TaxObligationStatus = 'pending' | 'calculated' | 'paid' | 'overdue'

export type TaxObligationRecurrence = 'once' | 'monthly' | 'quarterly' | 'yearly'

export type RegimeTributario = 'simples_nacional' | 'lucro_presumido' | 'lucro_real' | 'mei'

export interface TaxObligation {
  id: string
  user_id: string
  client_id?: string | null
  type: TaxObligationType
  period_month: number // 1-12
  period_year: number
  due_date: string // ISO date
  amount?: number | null
  status: TaxObligationStatus
  regime_tributario?: RegimeTributario | null
  recurrence?: TaxObligationRecurrence | null
  calculated_at?: string | null
  paid_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface TaxObligationWithClient extends TaxObligation {
  client?: {
    id: string
    name: string
  } | null
}

// Formulário de criação/edição
export interface TaxObligationFormData {
  client_id?: string | null
  type: TaxObligationType
  period_month: number
  period_year: number
  due_date: string
  amount?: number | null
  status?: TaxObligationStatus
  regime_tributario?: RegimeTributario | null
  recurrence?: TaxObligationRecurrence | null
  notes?: string | null
}

// Filtros para listagem
export interface TaxObligationFilters {
  client_id?: string
  type?: TaxObligationType
  status?: TaxObligationStatus
  regime_tributario?: RegimeTributario
  period_month?: number
  period_year?: number
  from_date?: string
  to_date?: string
}

// Estatísticas
export interface TaxObligationStats {
  total: number
  pending: number
  calculated: number
  paid: number
  overdue: number
  total_amount: number
  pending_amount: number
  overdue_amount: number
}

// Labels para exibição
export const TAX_OBLIGATION_TYPE_LABELS: Record<TaxObligationType, string> = {
  das: 'DAS - Simples Nacional',
  irpj: 'IRPJ',
  csll: 'CSLL',
  pis: 'PIS',
  cofins: 'COFINS',
  icms: 'ICMS',
  iss: 'ISS',
  inss: 'INSS',
  fgts: 'FGTS',
  dctfweb: 'DCTFWeb',
  defis: 'DEFIS',
  dmed: 'DMED',
  dirf: 'DIRF',
  rais: 'RAIS',
  caged: 'CAGED',
  esocial: 'eSocial',
  efd_contribuicoes: 'EFD-Contribuições',
  sped_fiscal: 'SPED Fiscal',
  other: 'Outras',
}

export const TAX_OBLIGATION_STATUS_LABELS: Record<TaxObligationStatus, string> = {
  pending: 'Pendente',
  calculated: 'Calculado',
  paid: 'Pago',
  overdue: 'Atrasado',
}

export const REGIME_TRIBUTARIO_LABELS: Record<RegimeTributario, string> = {
  simples_nacional: 'Simples Nacional',
  lucro_presumido: 'Lucro Presumido',
  lucro_real: 'Lucro Real',
  mei: 'MEI',
}

// Datas de vencimento padrão por tipo (dia do mês)
export const DEFAULT_DUE_DATES: Partial<Record<TaxObligationType, number>> = {
  das: 20, // DAS vence dia 20
  dctfweb: 15, // DCTFWeb vence dia 15
  defis: 31, // DEFIS vence último dia de março
  inss: 20, // INSS vence dia 20
  fgts: 7, // FGTS vence dia 7
}
