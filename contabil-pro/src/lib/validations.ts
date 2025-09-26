import { z } from 'zod'

// Schema para Cliente
export const clientSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional(),
  document: z.string().min(11, 'Documento deve ter pelo menos 11 caracteres'),
  phone: z.string().optional(),
  address: z.string().optional(),
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

export type Client = z.infer<typeof clientSchema>
export type Entry = z.infer<typeof entrySchema>
export type Account = z.infer<typeof accountSchema>
export type Document = z.infer<typeof documentSchema>
export type BankTransaction = z.infer<typeof bankTransactionSchema>
