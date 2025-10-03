import {
  accountSchema,
  bankTransactionSchema,
  clientMultiStepSchema,
  clientSchema,
  clientStep1Schema,
  clientStep2Schema,
  clientStep3Schema,
  createClientSchema,
  documentSchema,
  entrySchema,
  updateClientSchema,
} from '../validations'
import { describe, expect, it } from 'vitest'

describe('Validation Schemas', () => {
  describe('clientSchema', () => {
    it('should validate a valid client', () => {
      const validClient = {
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Client',
        email: 'test@client.com',
        document: '12345678909', // CPF válido
        phone: '(11) 99999-9999',
        address: 'Test Address',
      }

      const result = clientSchema.safeParse(validClient)
      expect(result.success).toBe(true)
    })

    it('should reject client with invalid email', () => {
      const invalidClient = {
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Client',
        email: 'invalid-email',
        document: '12345678901',
      }

      const result = clientSchema.safeParse(invalidClient)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email inválido')
      }
    })

    it('should reject client without required fields', () => {
      const invalidClient = {
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        // missing name and document
      }

      const result = clientSchema.safeParse(invalidClient)
      expect(result.success).toBe(false)
    })

    it('should reject client with short document', () => {
      const invalidClient = {
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Client',
        document: '123', // too short
      }

      const result = clientSchema.safeParse(invalidClient)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Documento deve ter pelo menos 11 caracteres')
      }
    })
  })

  describe('entrySchema', () => {
    it('should validate a valid entry', () => {
      const validEntry = {
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        client_id: '550e8400-e29b-41d4-a716-446655440001',
        account_id: '550e8400-e29b-41d4-a716-446655440002',
        description: 'Test Entry',
        amount: 1000.5,
        type: 'debit' as const,
        date: new Date(),
      }

      const result = entrySchema.safeParse(validEntry)
      expect(result.success).toBe(true)
    })

    it('should reject entry with negative amount', () => {
      const invalidEntry = {
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        client_id: '550e8400-e29b-41d4-a716-446655440001',
        account_id: '550e8400-e29b-41d4-a716-446655440002',
        description: 'Test Entry',
        amount: -100, // negative amount
        type: 'debit' as const,
        date: new Date(),
      }

      const result = entrySchema.safeParse(invalidEntry)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Valor deve ser positivo')
      }
    })

    it('should reject entry with invalid type', () => {
      const invalidEntry = {
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        client_id: '550e8400-e29b-41d4-a716-446655440001',
        account_id: '550e8400-e29b-41d4-a716-446655440002',
        description: 'Test Entry',
        amount: 1000,
        type: 'invalid' as never, // invalid type
        date: new Date(),
      }

      const result = entrySchema.safeParse(invalidEntry)
      expect(result.success).toBe(false)
    })
  })

  describe('accountSchema', () => {
    it('should validate a valid account', () => {
      const validAccount = {
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        code: '1.1.01.001',
        name: 'Caixa',
        type: 'asset' as const,
      }

      const result = accountSchema.safeParse(validAccount)
      expect(result.success).toBe(true)
    })

    it('should reject account with invalid type', () => {
      const invalidAccount = {
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        code: '1.1.01.001',
        name: 'Caixa',
        type: 'invalid' as never,
      }

      const result = accountSchema.safeParse(invalidAccount)
      expect(result.success).toBe(false)
    })
  })

  describe('documentSchema', () => {
    it('should validate a valid document', () => {
      const validDocument = {
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'test-document.pdf',
        path: '/documents/test-document.pdf',
        hash: 'abc123def456',
        size: 1024,
        mime_type: 'application/pdf',
      }

      const result = documentSchema.safeParse(validDocument)
      expect(result.success).toBe(true)
    })

    it('should reject document with negative size', () => {
      const invalidDocument = {
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'test-document.pdf',
        path: '/documents/test-document.pdf',
        hash: 'abc123def456',
        size: -1024, // negative size
        mime_type: 'application/pdf',
      }

      const result = documentSchema.safeParse(invalidDocument)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Tamanho deve ser positivo')
      }
    })
  })

  describe('bankTransactionSchema', () => {
    it('should validate a valid bank transaction', () => {
      const validTransaction = {
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        bank_account_id: '550e8400-e29b-41d4-a716-446655440001',
        external_id: 'ext-123',
        description: 'Test Transaction',
        amount: 500.0,
        date: new Date(),
        type: 'credit' as const,
      }

      const result = bankTransactionSchema.safeParse(validTransaction)
      expect(result.success).toBe(true)
    })

    it('should set default status to pending', () => {
      const transaction = {
        tenant_id: '550e8400-e29b-41d4-a716-446655440000',
        bank_account_id: '550e8400-e29b-41d4-a716-446655440001',
        external_id: 'ext-123',
        description: 'Test Transaction',
        amount: 500.0,
        date: new Date(),
        type: 'credit' as const,
      }

      const result = bankTransactionSchema.parse(transaction)
      expect(result.status).toBe('pending')
    })
  })

  describe('createClientSchema', () => {
    it('should validate client creation without auto-generated fields', () => {
      const newClient = {
        name: 'Test Client',
        document: '12345678909',
        email: 'test@example.com',
        tipo_pessoa: 'PF' as const,
        regime_tributario: 'MEI' as const,
        status: 'ativo' as const,
      }

      const result = createClientSchema.safeParse(newClient)
      expect(result.success).toBe(true)
    })

    it('should accept extra fields (omit removes them)', () => {
      const newClient = {
        tenant_id: '550e8400-e29b-41d4-a716-446655440000', // Será ignorado
        name: 'Test Client',
        document: '12345678909',
      }

      const result = createClientSchema.safeParse(newClient)
      // Zod omit não rejeita campos extras, apenas os remove
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('tenant_id')
      }
    })
  })

  describe('updateClientSchema', () => {
    it('should validate partial client update', () => {
      const update = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Updated Name',
      }

      const result = updateClientSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should require id field', () => {
      const update = {
        name: 'Updated Name',
      }

      const result = updateClientSchema.safeParse(update)
      expect(result.success).toBe(false)
    })
  })

  describe('clientStep1Schema', () => {
    it('should validate fiscal data step', () => {
      const step1 = {
        tipo_pessoa: 'PJ' as const,
        document: '12345678000195',
        name: 'Empresa Teste LTDA',
        regime_tributario: 'Simples' as const,
        inscricao_estadual: '123456789',
      }

      const result = clientStep1Schema.safeParse(step1)
      expect(result.success).toBe(true)
    })

    it('should require tipo_pessoa', () => {
      const step1 = {
        document: '12345678000195',
        name: 'Empresa Teste LTDA',
      }

      const result = clientStep1Schema.safeParse(step1)
      expect(result.success).toBe(false)
    })
  })

  describe('clientStep2Schema', () => {
    it('should validate contact data step', () => {
      const step2 = {
        email: 'contato@empresa.com',
        phone: '(11) 99999-9999',
        cep: '12345-678',
        address: 'Rua Teste, 123',
        city: 'São Paulo',
        state: 'SP',
      }

      const result = clientStep2Schema.safeParse(step2)
      expect(result.success).toBe(true)
    })

    it('should validate CEP format', () => {
      const step2Valid = { cep: '12345-678' }
      expect(clientStep2Schema.safeParse(step2Valid).success).toBe(true)

      const step2Invalid = { cep: '12345' }
      expect(clientStep2Schema.safeParse(step2Invalid).success).toBe(false)
    })
  })

  describe('clientStep3Schema', () => {
    it('should validate financial data step', () => {
      const step3 = {
        dia_vencimento: 10,
        valor_plano: 299.9,
        forma_cobranca: 'boleto' as const,
        tags: ['mei', 'ecommerce'],
      }

      const result = clientStep3Schema.safeParse(step3)
      expect(result.success).toBe(true)
    })

    it('should validate dia_vencimento range', () => {
      const step3Valid = { dia_vencimento: 15 }
      expect(clientStep3Schema.safeParse(step3Valid).success).toBe(true)

      const step3Invalid1 = { dia_vencimento: 0 }
      expect(clientStep3Schema.safeParse(step3Invalid1).success).toBe(false)

      const step3Invalid2 = { dia_vencimento: 32 }
      expect(clientStep3Schema.safeParse(step3Invalid2).success).toBe(false)
    })
  })

  describe('clientMultiStepSchema', () => {
    it('should validate complete multi-step form', () => {
      const completeForm = {
        tipo_pessoa: 'PJ' as const,
        document: '12345678000195',
        name: 'Empresa Teste LTDA',
        regime_tributario: 'Simples' as const,
        email: 'contato@empresa.com',
        phone: '(11) 99999-9999',
        cep: '12345-678',
        dia_vencimento: 10,
        valor_plano: 299.9,
        forma_cobranca: 'boleto' as const,
      }

      const result = clientMultiStepSchema.safeParse(completeForm)
      expect(result.success).toBe(true)
    })
  })
})
