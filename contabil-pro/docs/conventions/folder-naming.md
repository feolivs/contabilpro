# Convenções de Pastas e Nomes

## 📁 **Estrutura de Pastas**

### **Server Actions**
```
src/actions/
├── auth.ts           # ✅ Apenas funções async
├── clients.ts        # ✅ Apenas funções async  
├── entries.ts        # ✅ Apenas funções async
├── bank-accounts.ts  # ✅ Apenas funções async
└── dashboard.ts      # ✅ Apenas funções async
```

**Regra**: Arquivos em `actions/` **DEVEM** conter apenas funções assíncronas exportadas.

### **Tipos e Constantes**
```
src/types/
├── auth.ts           # Tipos de autenticação
├── clients.ts        # Tipos de clientes
├── entries.ts        # Tipos de lançamentos
├── bank-accounts.ts  # Tipos de contas bancárias
└── dashboard.ts      # Tipos do dashboard
```

**Regra**: Tipos, interfaces, constantes e estados iniciais ficam em `types/`.

### **Schemas de Validação**
```
src/schemas/
├── auth.schema.ts    # Validações Zod para auth
├── client.schema.ts  # Validações Zod para clientes
├── entry.schema.ts   # Validações Zod para lançamentos
└── bank.schema.ts    # Validações Zod para bancos
```

**Regra**: Schemas Zod e validações ficam em `schemas/`.

### **Serviços**
```
src/services/
├── supabase.service.ts    # Cliente Supabase
├── auth.service.ts        # Lógica de autenticação
├── cache.service.ts       # Gerenciamento de cache
└── resilience.service.ts  # Circuit breakers
```

## 🏷️ **Sufixos Claros**

### **Arquivos por Responsabilidade**
- `*.action.ts` - Server Actions (funções async)
- `*.types.ts` - Tipos e interfaces TypeScript
- `*.schema.ts` - Schemas de validação (Zod)
- `*.service.ts` - Serviços e utilitários
- `*.test.ts` - Testes unitários
- `*.e2e.ts` - Testes end-to-end

### **Exemplos Práticos**
```
src/
├── actions/
│   ├── client.action.ts     # createClient, updateClient, deleteClient
│   └── entry.action.ts      # createEntry, updateEntry, deleteEntry
├── types/
│   ├── client.types.ts      # Client, ClientFormState, ClientFilters
│   └── entry.types.ts       # Entry, EntryFormState, EntryFilters
├── schemas/
│   ├── client.schema.ts     # clientSchema, createClientSchema
│   └── entry.schema.ts      # entrySchema, createEntrySchema
└── services/
    ├── database.service.ts  # Operações de banco
    └── validation.service.ts # Validações customizadas
```

## ⚡ **Regras de Import**

### **✅ Permitido**
```typescript
// Componentes importam tipos de types/
import { ClientFormState } from '@/types/client.types'

// Actions importam schemas de schemas/
import { clientSchema } from '@/schemas/client.schema'

// Actions importam serviços de services/
import { createSupabaseClient } from '@/services/supabase.service'
```

### **❌ Proibido**
```typescript
// ❌ Componentes NUNCA importam de actions/
import { ClientFormState } from '@/actions/client.action'

// ❌ Actions NUNCA exportam tipos/constantes
export const initialClientState = { ... } // ❌ ERRO!

// ❌ Misturar responsabilidades
export async function createClient() { ... }
export type ClientFormState = { ... } // ❌ ERRO!
```

## 🎯 **Benefícios**

1. **Clareza**: Cada pasta tem responsabilidade única
2. **Manutenibilidade**: Fácil localizar e modificar código
3. **Prevenção de Erros**: Evita problemas de bundling do Next.js
4. **Escalabilidade**: Estrutura cresce de forma organizada
5. **Onboarding**: Novos devs entendem rapidamente a organização

## 📋 **Checklist de Verificação**

- [ ] Arquivo em `actions/` exporta apenas funções async?
- [ ] Tipos estão em `types/` com sufixo `.types.ts`?
- [ ] Schemas estão em `schemas/` com sufixo `.schema.ts`?
- [ ] Imports seguem as regras permitidas?
- [ ] Nenhum arquivo mistura responsabilidades?
