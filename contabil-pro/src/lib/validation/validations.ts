import { z } from 'zod'
import { validateDocument } from './document-utils'

/**
 * Schema de validação para Cliente
 * Inclui validação de CPF/CNPJ, campos fiscais, contato e financeiros
 */
export const clientSchema = z.object({
  // Identificadores
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),

  // Dados básicos
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  document: z
    .string()
    .min(11, 'Documento deve ter pelo menos 11 caracteres')
    .refine(validateDocument, 'CPF ou CNPJ inválido'),
  document_norm: z.string().optional(), // Preenchido automaticamente pelo trigger
  document_type: z.enum(['cpf', 'cnpj']).optional(), // Inferido automaticamente

  // Contato básico
  phone: z.string().max(20, 'Telefone muito longo').optional(),
  address: z.string().max(500, 'Endereço muito longo').optional(),
  city: z.string().max(100, 'Cidade muito longa').optional(),
  state: z.string().length(2, 'Estado deve ter 2 caracteres (UF)').optional(),
  zip_code: z.string().max(10, 'CEP muito longo').optional(),
  notes: z.string().max(1000, 'Observações muito longas').optional(),

  // Campos fiscais
  tipo_pessoa: z.enum(['PF', 'PJ'], {
    message: 'Tipo de pessoa deve ser PF ou PJ'
  }).optional(),
  regime_tributario: z.enum(['MEI', 'Simples', 'Presumido', 'Real'], {
    message: 'Regime tributário inválido'
  }).optional(),
  inscricao_estadual: z.string().max(20, 'Inscrição estadual muito longa').optional(),
  inscricao_municipal: z.string().max(20, 'Inscrição municipal muito longa').optional(),

  // Contato adicional
  cep: z.string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato 12345-678 ou 12345678')
    .optional()
    .or(z.literal('')),
  responsavel_nome: z.string().max(255, 'Nome do responsável muito longo').optional(),
  responsavel_telefone: z.string().max(20, 'Telefone do responsável muito longo').optional(),

  // Campos financeiros
  dia_vencimento: z.number()
    .int('Dia de vencimento deve ser um número inteiro')
    .min(1, 'Dia de vencimento deve ser entre 1 e 31')
    .max(31, 'Dia de vencimento deve ser entre 1 e 31')
    .optional(),
  valor_plano: z.number()
    .positive('Valor do plano deve ser positivo')
    .optional(),
  forma_cobranca: z.enum(['boleto', 'pix', 'cartao', 'transferencia'], {
    message: 'Forma de cobrança inválida'
  }).optional(),

  // Campos de gestão
  tags: z.array(z.string().max(50, 'Tag muito longa')).default([]),
  status: z.enum(['ativo', 'inadimplente', 'onboarding', 'inativo'], {
    message: 'Status inválido'
  }).default('ativo'),
  ultima_atividade: z.date().optional(),
  score_risco: z.number()
    .int('Score de risco deve ser um número inteiro')
    .min(0, 'Score de risco deve ser entre 0 e 100')
    .max(100, 'Score de risco deve ser entre 0 e 100')
    .optional(),

  // Timestamps
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
})

// Schema para Lançamento Contábil
export const entrySchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  client_id: z.string().uuid(),
  account_id: z.string().uuid(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['debit', 'credit']),
  date: z.date(),
  document_id: z.string().uuid().optional(),
  created_at: z.date().optional(),
})

export const bankAccountSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  bank_code: z.string().min(1, 'Bank code is required'),
  bank_name: z.string().min(1, 'Bank name is required'),
  agency: z.string().min(1, 'Agency is required'),
  account_number: z.string().min(1, 'Account number is required'),
  account_type: z.enum(['checking', 'savings', 'investment']).default('checking'),
  balance: z.number().optional(),
  is_active: z.boolean().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
})

// Schema para Conta Contábil
export const accountSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  code: z.string().min(1, 'Código é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  parent_id: z.string().uuid().optional(),
  created_at: z.date().optional(),
})

// Schema para Documento
export const documentSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório'),
  path: z.string().min(1, 'Caminho é obrigatório'),
  hash: z.string().min(1, 'Hash é obrigatório'),
  size: z.number().positive('Tamanho deve ser positivo'),
  mime_type: z.string().min(1, 'Tipo MIME é obrigatório'),
  entry_id: z.string().uuid().optional(),
  created_at: z.date().optional(),
})

// Schema para Transação Bancária
export const bankTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  bank_account_id: z.string().uuid(),
  external_id: z.string().min(1, 'ID externo é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number(),
  date: z.date(),
  type: z.enum(['debit', 'credit']),
  status: z.enum(['pending', 'reconciled', 'ignored']).default('pending'),
  created_at: z.date().optional(),
})

// Schema para criação de cliente (sem campos gerados automaticamente)
export const createClientSchema = clientSchema.omit({
  id: true,
  tenant_id: true,
  document_norm: true,
  document_type: true,
  created_at: true,
  updated_at: true,
  ultima_atividade: true,
})

// Schema para atualização de cliente (todos os campos opcionais exceto ID)
export const updateClientSchema = clientSchema
  .omit({
    tenant_id: true,
    document_norm: true,
    document_type: true,
    created_at: true,
  })
  .partial()
  .required({ id: true })

// Schema para formulário multi-step - Step 1: Dados Fiscais
export const clientStep1Schema = z.object({
  tipo_pessoa: z.enum(['PF', 'PJ'], {
    message: 'Selecione o tipo de pessoa'
  }),
  document: z
    .string()
    .min(11, 'Documento deve ter pelo menos 11 caracteres')
    .refine(validateDocument, 'CPF ou CNPJ inválido'),
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  inscricao_estadual: z.string().max(20, 'Inscrição estadual muito longa').optional(),
  inscricao_municipal: z.string().max(20, 'Inscrição municipal muito longa').optional(),
  regime_tributario: z.enum(['MEI', 'Simples', 'Presumido', 'Real']).optional(),
})

// Schema para formulário multi-step - Step 2: Contato
export const clientStep2Schema = z.object({
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().max(20, 'Telefone muito longo').optional(),
  responsavel_nome: z.string().max(255, 'Nome do responsável muito longo').optional(),
  responsavel_telefone: z.string().max(20, 'Telefone do responsável muito longo').optional(),
  cep: z.string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato 12345-678')
    .optional()
    .or(z.literal('')),
  address: z.string().max(500, 'Endereço muito longo').optional(),
  city: z.string().max(100, 'Cidade muito longa').optional(),
  state: z.string().length(2, 'Estado deve ter 2 caracteres (UF)').optional(),
})

// Schema para formulário multi-step - Step 3: Financeiro
export const clientStep3Schema = z.object({
  dia_vencimento: z.number()
    .int('Dia de vencimento deve ser um número inteiro')
    .min(1, 'Dia de vencimento deve ser entre 1 e 31')
    .max(31, 'Dia de vencimento deve ser entre 1 e 31')
    .optional(),
  valor_plano: z.number()
    .positive('Valor do plano deve ser positivo')
    .optional(),
  forma_cobranca: z.enum(['boleto', 'pix', 'cartao', 'transferencia']).optional(),
  tags: z.array(z.string().max(50, 'Tag muito longa')).default([]),
})

// Schema completo do formulário multi-step
export const clientMultiStepSchema = clientStep1Schema
  .merge(clientStep2Schema)
  .merge(clientStep3Schema)

// Tipos TypeScript
export type Client = z.infer<typeof clientSchema>
export type CreateClient = z.infer<typeof createClientSchema>
export type UpdateClient = z.infer<typeof updateClientSchema>
export type ClientStep1 = z.infer<typeof clientStep1Schema>
export type ClientStep2 = z.infer<typeof clientStep2Schema>
export type ClientStep3 = z.infer<typeof clientStep3Schema>
export type ClientMultiStep = z.infer<typeof clientMultiStepSchema>

export type Entry = z.infer<typeof entrySchema>
export type BankAccount = z.infer<typeof bankAccountSchema>
export type Account = z.infer<typeof accountSchema>
export type Document = z.infer<typeof documentSchema>
export type BankTransaction = z.infer<typeof bankTransactionSchema>
