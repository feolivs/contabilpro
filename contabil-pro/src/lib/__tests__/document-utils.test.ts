import { describe, expect, it } from 'vitest'
import {
  normalizeDocument,
  validateCPF,
  validateCNPJ,
  validateDocument,
  formatCPF,
  formatCNPJ,
  formatDocument,
  getDocumentType,
  getTipoPessoa,
  applyDocumentMask,
  generateRandomCPF,
  generateRandomCNPJ,
} from '../document-utils'

describe('Document Utils', () => {
  describe('normalizeDocument', () => {
    it('should remove all non-numeric characters', () => {
      expect(normalizeDocument('123.456.789-00')).toBe('12345678900')
      expect(normalizeDocument('12.345.678/0001-00')).toBe('12345678000100')
      expect(normalizeDocument('123-456-789.00')).toBe('12345678900')
      expect(normalizeDocument('abc123def456')).toBe('123456')
    })

    it('should handle empty string', () => {
      expect(normalizeDocument('')).toBe('')
    })

    it('should handle already normalized documents', () => {
      expect(normalizeDocument('12345678900')).toBe('12345678900')
      expect(normalizeDocument('12345678000100')).toBe('12345678000100')
    })
  })

  describe('validateCPF', () => {
    it('should validate correct CPFs', () => {
      expect(validateCPF('111.444.777-35')).toBe(true)
      expect(validateCPF('11144477735')).toBe(true)
      expect(validateCPF('123.456.789-09')).toBe(true)
      expect(validateCPF('12345678909')).toBe(true)
    })

    it('should reject CPFs with invalid check digits', () => {
      expect(validateCPF('123.456.789-00')).toBe(false)
      expect(validateCPF('12345678900')).toBe(false)
      expect(validateCPF('111.444.777-36')).toBe(false)
    })

    it('should reject CPFs with all same digits', () => {
      expect(validateCPF('111.111.111-11')).toBe(false)
      expect(validateCPF('00000000000')).toBe(false)
      expect(validateCPF('999.999.999-99')).toBe(false)
    })

    it('should reject CPFs with wrong length', () => {
      expect(validateCPF('123.456.789')).toBe(false)
      expect(validateCPF('123456789')).toBe(false)
      expect(validateCPF('123.456.789-001')).toBe(false)
    })

    it('should handle empty string', () => {
      expect(validateCPF('')).toBe(false)
    })
  })

  describe('validateCNPJ', () => {
    it('should validate correct CNPJs', () => {
      expect(validateCNPJ('11.222.333/0001-81')).toBe(true)
      expect(validateCNPJ('11222333000181')).toBe(true)
      expect(validateCNPJ('12.345.678/0001-95')).toBe(true)
      expect(validateCNPJ('12345678000195')).toBe(true)
    })

    it('should reject CNPJs with invalid check digits', () => {
      expect(validateCNPJ('11.222.333/0001-00')).toBe(false)
      expect(validateCNPJ('11222333000100')).toBe(false)
      expect(validateCNPJ('12.345.678/0001-00')).toBe(false)
    })

    it('should reject CNPJs with all same digits', () => {
      expect(validateCNPJ('11.111.111/1111-11')).toBe(false)
      expect(validateCNPJ('00000000000000')).toBe(false)
      expect(validateCNPJ('99.999.999/9999-99')).toBe(false)
    })

    it('should reject CNPJs with wrong length', () => {
      expect(validateCNPJ('11.222.333/0001')).toBe(false)
      expect(validateCNPJ('112223330001')).toBe(false)
      expect(validateCNPJ('11.222.333/0001-811')).toBe(false)
    })

    it('should handle empty string', () => {
      expect(validateCNPJ('')).toBe(false)
    })
  })

  describe('validateDocument', () => {
    it('should validate CPF when length is 11', () => {
      expect(validateDocument('111.444.777-35')).toBe(true)
      expect(validateDocument('123.456.789-09')).toBe(true)
    })

    it('should validate CNPJ when length is 14', () => {
      expect(validateDocument('11.222.333/0001-81')).toBe(true)
      expect(validateDocument('12.345.678/0001-95')).toBe(true)
    })

    it('should reject invalid documents', () => {
      expect(validateDocument('123.456.789-00')).toBe(false)
      expect(validateDocument('11.222.333/0001-00')).toBe(false)
    })

    it('should reject documents with wrong length', () => {
      expect(validateDocument('123456')).toBe(false)
      expect(validateDocument('12345678901234567')).toBe(false)
    })
  })

  describe('formatCPF', () => {
    it('should format CPF correctly', () => {
      expect(formatCPF('12345678900')).toBe('123.456.789-00')
      expect(formatCPF('11144477735')).toBe('111.444.777-35')
    })

    it('should handle already formatted CPF', () => {
      expect(formatCPF('123.456.789-00')).toBe('123.456.789-00')
    })

    it('should return original if length is wrong', () => {
      expect(formatCPF('123456789')).toBe('123456789')
      expect(formatCPF('123456789012')).toBe('123456789012')
    })
  })

  describe('formatCNPJ', () => {
    it('should format CNPJ correctly', () => {
      expect(formatCNPJ('12345678000100')).toBe('12.345.678/0001-00')
      expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81')
    })

    it('should handle already formatted CNPJ', () => {
      expect(formatCNPJ('12.345.678/0001-00')).toBe('12.345.678/0001-00')
    })

    it('should return original if length is wrong', () => {
      expect(formatCNPJ('123456789012')).toBe('123456789012')
      expect(formatCNPJ('1234567890012345')).toBe('1234567890012345')
    })
  })

  describe('formatDocument', () => {
    it('should format CPF when length is 11', () => {
      expect(formatDocument('12345678900')).toBe('123.456.789-00')
    })

    it('should format CNPJ when length is 14', () => {
      expect(formatDocument('12345678000100')).toBe('12.345.678/0001-00')
    })

    it('should return original for invalid lengths', () => {
      expect(formatDocument('123456')).toBe('123456')
      expect(formatDocument('12345678901234567')).toBe('12345678901234567')
    })
  })

  describe('getDocumentType', () => {
    it('should return "cpf" for 11-digit documents', () => {
      expect(getDocumentType('12345678900')).toBe('cpf')
      expect(getDocumentType('123.456.789-00')).toBe('cpf')
    })

    it('should return "cnpj" for 14-digit documents', () => {
      expect(getDocumentType('12345678000100')).toBe('cnpj')
      expect(getDocumentType('12.345.678/0001-00')).toBe('cnpj')
    })

    it('should return null for invalid lengths', () => {
      expect(getDocumentType('123456')).toBe(null)
      expect(getDocumentType('12345678901234567')).toBe(null)
      expect(getDocumentType('')).toBe(null)
    })
  })

  describe('getTipoPessoa', () => {
    it('should return "PF" for CPF', () => {
      expect(getTipoPessoa('12345678900')).toBe('PF')
      expect(getTipoPessoa('123.456.789-00')).toBe('PF')
    })

    it('should return "PJ" for CNPJ', () => {
      expect(getTipoPessoa('12345678000100')).toBe('PJ')
      expect(getTipoPessoa('12.345.678/0001-00')).toBe('PJ')
    })

    it('should return null for invalid documents', () => {
      expect(getTipoPessoa('123456')).toBe(null)
      expect(getTipoPessoa('')).toBe(null)
    })
  })

  describe('applyDocumentMask', () => {
    it('should apply CPF mask progressively', () => {
      expect(applyDocumentMask('123')).toBe('123')
      expect(applyDocumentMask('1234')).toBe('123.4')
      expect(applyDocumentMask('1234567')).toBe('123.456.7')
      expect(applyDocumentMask('1234567890')).toBe('123.456.789-0')
      expect(applyDocumentMask('12345678900')).toBe('123.456.789-00')
    })

    it('should apply CNPJ mask progressively', () => {
      expect(applyDocumentMask('123456789012')).toBe('12.345.678/9012')
      expect(applyDocumentMask('12345678901234')).toBe('12.345.678/9012-34')
    })

    it('should handle empty string', () => {
      expect(applyDocumentMask('')).toBe('')
    })

    it('should remove non-numeric characters before applying mask', () => {
      expect(applyDocumentMask('123.456.789-00')).toBe('123.456.789-00')
      expect(applyDocumentMask('12.345.678/0001-00')).toBe('12.345.678/0001-00')
    })
  })

  describe('generateRandomCPF', () => {
    it('should generate valid CPF', () => {
      const cpf = generateRandomCPF()
      expect(cpf).toHaveLength(11)
      expect(validateCPF(cpf)).toBe(true)
    })

    it('should generate different CPFs', () => {
      const cpf1 = generateRandomCPF()
      const cpf2 = generateRandomCPF()
      const cpf3 = generateRandomCPF()
      
      // Probabilidade muito baixa de gerar 3 CPFs iguais
      expect(cpf1 === cpf2 && cpf2 === cpf3).toBe(false)
    })
  })

  describe('generateRandomCNPJ', () => {
    it('should generate valid CNPJ', () => {
      const cnpj = generateRandomCNPJ()
      expect(cnpj).toHaveLength(14)
      expect(validateCNPJ(cnpj)).toBe(true)
    })

    it('should generate different CNPJs', () => {
      const cnpj1 = generateRandomCNPJ()
      const cnpj2 = generateRandomCNPJ()
      const cnpj3 = generateRandomCNPJ()
      
      // Probabilidade muito baixa de gerar 3 CNPJs iguais
      expect(cnpj1 === cnpj2 && cnpj2 === cnpj3).toBe(false)
    })
  })
})

