import { z } from 'zod'

/**
 * Validates Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica)
 * Format: XX.XXX.XXX/XXXX-XX
 */
export function validateCNPJ(cnpj: string): boolean {
  // Remove non-numeric characters
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '')

  // Check if has 14 digits
  if (cleanCNPJ.length !== 14) return false

  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false

  // Validate first check digit
  let sum = 0
  let weight = 5
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i]) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleanCNPJ[12])) return false

  // Validate second check digit
  sum = 0
  weight = 6
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i]) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleanCNPJ[13])) return false

  return true
}

/**
 * Validates Brazilian CPF (Cadastro de Pessoas Físicas)
 * Format: XXX.XXX.XXX-XX
 */
export function validateCPF(cpf: string): boolean {
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/[^\d]/g, '')

  // Check if has 11 digits
  if (cleanCPF.length !== 11) return false

  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleanCPF)) return false

  // Validate first check digit
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i)
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleanCPF[9])) return false

  // Validate second check digit
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i)
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleanCPF[10])) return false

  return true
}

/**
 * Formats CNPJ with mask: XX.XXX.XXX/XXXX-XX
 */
export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/[^\d]/g, '')
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

/**
 * Formats CPF with mask: XXX.XXX.XXX-XX
 */
export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/[^\d]/g, '')
  return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
}

/**
 * Zod schema for CNPJ validation
 */
export const cnpjSchema = z
  .string()
  .min(1, 'CNPJ é obrigatório')
  .refine((val) => validateCNPJ(val), {
    message: 'CNPJ inválido',
  })

/**
 * Zod schema for CPF validation
 */
export const cpfSchema = z
  .string()
  .min(1, 'CPF é obrigatório')
  .refine((val) => validateCPF(val), {
    message: 'CPF inválido',
  })

/**
 * Zod schema for email validation
 */
export const emailSchema = z
  .string()
  .min(1, 'Email é obrigatório')
  .email('Email inválido')

/**
 * Zod schema for password validation
 */
export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Register form schema
 */
export const registerSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
    cnpj: cnpjSchema.optional(),
    cpf: cpfSchema.optional(),
    accountType: z.enum(['accountant', 'client']),
  })
  .refine(
    (data) => {
      // If accountant, CNPJ is required
      if (data.accountType === 'accountant') {
        return !!data.cnpj
      }
      // If client, either CNPJ or CPF is required
      return !!data.cnpj || !!data.cpf
    },
    {
      message: 'CNPJ ou CPF é obrigatório',
      path: ['cnpj'],
    }
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export type RegisterFormData = z.infer<typeof registerSchema>

/**
 * Client form schema
 */
export const clientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cnpj: cnpjSchema,
  email: emailSchema.optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export type ClientFormData = z.infer<typeof clientSchema>

