# ✅ Task 1.1: Validadores de CPF/CNPJ

**Status:** ✅ CONCLUÍDA  
**Data:** 2025-09-29  
**Responsável:** Augment Agent

---

## 📋 Objetivo

Criar funções de validação de CPF e CNPJ com algoritmos completos de validação de dígitos verificadores, incluindo testes unitários abrangentes.

---

## ✅ O que foi implementado

### 1. Funções de Validação (já existentes em `src/lib/document-utils.ts`)

#### ✅ `normalizeDocument(document: string): string`
- Remove todos os caracteres não-numéricos
- Exemplo: `"123.456.789-00"` → `"12345678900"`

#### ✅ `validateCPF(cpf: string): boolean`
- Valida CPF usando algoritmo de dígitos verificadores
- Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
- Valida primeiro e segundo dígitos verificadores
- Retorna `true` para CPFs válidos, `false` para inválidos

#### ✅ `validateCNPJ(cnpj: string): boolean`
- Valida CNPJ usando algoritmo de dígitos verificadores
- Rejeita CNPJs com todos os dígitos iguais (ex: 11.111.111/1111-11)
- Valida primeiro e segundo dígitos verificadores
- Retorna `true` para CNPJs válidos, `false` para inválidos

#### ✅ `validateDocument(document: string): boolean`
- Valida automaticamente CPF ou CNPJ baseado no tamanho
- 11 dígitos → valida como CPF
- 14 dígitos → valida como CNPJ
- Outros tamanhos → retorna `false`

### 2. Funções Auxiliares (bônus)

#### ✅ `formatCPF(cpf: string): string`
- Formata CPF: `12345678900` → `123.456.789-00`

#### ✅ `formatCNPJ(cnpj: string): string`
- Formata CNPJ: `12345678000100` → `12.345.678/0001-00`

#### ✅ `formatDocument(document: string): string`
- Formata automaticamente CPF ou CNPJ

#### ✅ `getDocumentType(document: string): 'cpf' | 'cnpj' | null`
- Detecta o tipo de documento baseado no tamanho

#### ✅ `getTipoPessoa(document: string): 'PF' | 'PJ' | null`
- Retorna tipo de pessoa baseado no documento
- CPF → `'PF'` (Pessoa Física)
- CNPJ → `'PJ'` (Pessoa Jurídica)

#### ✅ `applyDocumentMask(value: string): string`
- Aplica máscara progressivamente conforme o usuário digita
- Útil para inputs de formulário

#### ✅ `generateRandomCPF(): string`
- Gera CPF válido aleatório (para testes)

#### ✅ `generateRandomCNPJ(): string`
- Gera CNPJ válido aleatório (para testes)

---

## 🧪 Testes Unitários

### Arquivo: `src/lib/__tests__/document-utils.test.ts`

**Total de testes:** 40  
**Status:** ✅ Todos passando

### Cobertura de Testes:

#### `normalizeDocument` (3 testes)
- ✅ Remove caracteres não-numéricos
- ✅ Lida com string vazia
- ✅ Lida com documentos já normalizados

#### `validateCPF` (5 testes)
- ✅ Valida CPFs corretos
- ✅ Rejeita CPFs com dígitos verificadores inválidos
- ✅ Rejeita CPFs com todos os dígitos iguais
- ✅ Rejeita CPFs com tamanho incorreto
- ✅ Lida com string vazia

#### `validateCNPJ` (5 testes)
- ✅ Valida CNPJs corretos
- ✅ Rejeita CNPJs com dígitos verificadores inválidos
- ✅ Rejeita CNPJs com todos os dígitos iguais
- ✅ Rejeita CNPJs com tamanho incorreto
- ✅ Lida com string vazia

#### `validateDocument` (4 testes)
- ✅ Valida CPF quando tamanho é 11
- ✅ Valida CNPJ quando tamanho é 14
- ✅ Rejeita documentos inválidos
- ✅ Rejeita documentos com tamanho incorreto

#### `formatCPF` (3 testes)
- ✅ Formata CPF corretamente
- ✅ Lida com CPF já formatado
- ✅ Retorna original se tamanho incorreto

#### `formatCNPJ` (3 testes)
- ✅ Formata CNPJ corretamente
- ✅ Lida com CNPJ já formatado
- ✅ Retorna original se tamanho incorreto

#### `formatDocument` (3 testes)
- ✅ Formata CPF quando tamanho é 11
- ✅ Formata CNPJ quando tamanho é 14
- ✅ Retorna original para tamanhos inválidos

#### `getDocumentType` (3 testes)
- ✅ Retorna "cpf" para documentos de 11 dígitos
- ✅ Retorna "cnpj" para documentos de 14 dígitos
- ✅ Retorna null para tamanhos inválidos

#### `getTipoPessoa` (3 testes)
- ✅ Retorna "PF" para CPF
- ✅ Retorna "PJ" para CNPJ
- ✅ Retorna null para documentos inválidos

#### `applyDocumentMask` (4 testes)
- ✅ Aplica máscara de CPF progressivamente
- ✅ Aplica máscara de CNPJ progressivamente
- ✅ Lida com string vazia
- ✅ Remove caracteres não-numéricos antes de aplicar máscara

#### `generateRandomCPF` (2 testes)
- ✅ Gera CPF válido
- ✅ Gera CPFs diferentes

#### `generateRandomCNPJ` (2 testes)
- ✅ Gera CNPJ válido
- ✅ Gera CNPJs diferentes

---

## 📊 Resultado dos Testes

```bash
npm test -- src/lib/__tests__/document-utils.test.ts

 Test Files  1 passed (1)
      Tests  40 passed (40)
   Duration  1.48s
```

**Cobertura:** 100% das funções testadas  
**Performance:** Todos os testes executam em < 10ms

---

## 🔗 Integração com Schema Zod

As funções já estão integradas no `clientSchema` em `src/lib/validations.ts`:

```typescript
import { validateDocument } from './document-utils'

export const clientSchema = z.object({
  // ...
  document: z
    .string()
    .min(11, 'Documento deve ter pelo menos 11 caracteres')
    .refine(validateDocument, 'CPF ou CNPJ inválido'),
  // ...
})
```

---

## ✅ Critérios de Aceitação

- [x] Valida CPF corretamente (com dígitos verificadores)
- [x] Valida CNPJ corretamente
- [x] Rejeita documentos inválidos
- [x] Testes unitários passando (40/40)
- [x] Cobertura de 100% das funções
- [x] Performance adequada (< 10ms por teste)
- [x] Integrado com Zod no clientSchema

---

## 📝 Observações

1. **Funções já existiam:** As funções de validação já estavam implementadas no arquivo `src/lib/document-utils.ts` com algoritmos completos e corretos.

2. **Testes criados:** Foram criados 40 testes unitários abrangentes cobrindo todos os casos de uso e edge cases.

3. **Funções extras:** Além das funções de validação, o arquivo também contém funções úteis de formatação, máscara e geração de documentos para testes.

4. **Qualidade do código:** O código segue as melhores práticas:
   - Funções puras (sem efeitos colaterais)
   - Bem documentadas com JSDoc
   - Algoritmos corretos de validação de dígitos verificadores
   - Tratamento de edge cases (strings vazias, todos dígitos iguais, etc.)

---

## 🚀 Próximos Passos

A Task 1.1 está **100% concluída**. Podemos prosseguir para:

- **Task 1.2:** Atualizar Schema Zod com todos os novos campos
- **EPIC 2:** Implementar Command Palette (busca global)

---

## 📚 Referências

- [Algoritmo de validação de CPF](https://www.macoratti.net/alg_cpf.htm)
- [Algoritmo de validação de CNPJ](https://www.macoratti.net/alg_cnpj.htm)
- [Zod Documentation](https://zod.dev/)
- [Vitest Documentation](https://vitest.dev/)

