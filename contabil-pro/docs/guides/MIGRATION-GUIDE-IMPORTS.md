# 🔄 Guia de Migração de Imports - ContabilPRO

**Versão:** 1.0  
**Data:** 2025-09-30

---

## 📋 Tabela de Migração Rápida

| Antes | Depois |
|-------|--------|
| `@/components/client-modal` | `@/components/clients` ou `@/components/clients/modal` |
| `@/components/client-edit-form` | `@/components/clients` ou `@/components/clients/edit-form` |
| `@/components/client-details-card` | `@/components/clients` ou `@/components/clients/details-card` |
| `@/components/client-stats` | `@/components/clients` ou `@/components/clients/stats` |
| `@/components/client-import-advanced` | `@/components/clients` ou `@/components/clients/import-advanced` |
| `@/components/clients-table` | `@/components/clients` ou `@/components/clients/table` |
| `@/components/bulk-actions` | `@/components/common` ou `@/components/common/bulk-actions` |
| `@/components/saved-filters` | `@/components/common` ou `@/components/common/saved-filters` |
| `@/components/empty-state` | `@/components/common` ou `@/components/common/empty-state` |
| `@/components/search-form` | `@/components/common` ou `@/components/common/search-form` |

---

## 🎯 Padrões de Import Recomendados

### ✅ Opção 1: Import Centralizado (Recomendado)

```typescript
// Componentes de clientes
import { 
  ClientModal, 
  ClientEditForm, 
  ClientDetailsCard,
  ClientStats,
  ClientImportAdvanced,
  DataTable,
  clientColumns 
} from '@/components/clients'

// Componentes comuns
import { 
  BulkActions, 
  SavedFilters, 
  EmptyState,
  SearchForm 
} from '@/components/common'
```

**Vantagens:**
- Imports mais limpos
- Fácil de ler
- Autocomplete melhor

---

### ✅ Opção 2: Import Direto

```typescript
// Componentes de clientes
import { ClientModal } from '@/components/clients/modal'
import { ClientEditForm } from '@/components/clients/edit-form'
import { DataTable } from '@/components/clients/table'

// Componentes comuns
import { BulkActions } from '@/components/common/bulk-actions'
import { EmptyState } from '@/components/common/empty-state'
```

**Vantagens:**
- Mais explícito
- Melhor para tree-shaking (em teoria)

---

## 🔍 Exemplos de Migração

### Exemplo 1: Página de Listagem

**Antes:**
```typescript
import { DataTable, clientColumns } from '@/components/clients-table'
import { EmptyState } from '@/components/empty-state'
import { ClientStats } from '@/components/client-stats'
```

**Depois:**
```typescript
import { DataTable, clientColumns, ClientStats } from '@/components/clients'
import { EmptyState } from '@/components/common'
```

---

### Exemplo 2: Página de Detalhes

**Antes:**
```typescript
import { ClientDetailsCard } from '@/components/client-details-card'
```

**Depois:**
```typescript
import { ClientDetailsCard } from '@/components/clients'
```

---

### Exemplo 3: Página de Edição

**Antes:**
```typescript
import { ClientEditForm } from '@/components/client-edit-form'
```

**Depois:**
```typescript
import { ClientEditForm } from '@/components/clients'
```

---

### Exemplo 4: Tabela com Ações

**Antes:**
```typescript
import { DataTable } from '@/components/clients-table'
import { BulkActions } from '@/components/bulk-actions'
import { SavedFilters } from '@/components/saved-filters'
```

**Depois:**
```typescript
import { DataTable } from '@/components/clients'
import { BulkActions, SavedFilters } from '@/components/common'
```

---

## 🚫 Componentes Removidos

Estes componentes foram **removidos** e não devem mais ser usados:

### ❌ `@/components/data-table`
**Motivo:** Duplicado, não usado  
**Alternativa:** Use `@/components/clients/table` para tabela de clientes

### ❌ `@/components/command-palette-wrapper`
**Motivo:** Wrapper desnecessário  
**Alternativa:** Use `@/components/command-palette` diretamente

### ❌ `@/components/nav-main`
### ❌ `@/components/nav-secondary`
### ❌ `@/components/nav-documents`
### ❌ `@/components/nav-user`
**Motivo:** Templates não integrados  
**Alternativa:** Use `@/components/app-sidebar` e `@/components/app-sidebar-nav`

---

## 🛠️ Script de Migração Automática

Se você tiver muitos arquivos para migrar, pode usar este script:

```bash
# Substituir imports de clientes
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i \
  -e "s|@/components/client-modal|@/components/clients|g" \
  -e "s|@/components/client-edit-form|@/components/clients|g" \
  -e "s|@/components/client-details-card|@/components/clients|g" \
  -e "s|@/components/client-stats|@/components/clients|g" \
  -e "s|@/components/clients-table|@/components/clients|g"

# Substituir imports comuns
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i \
  -e "s|@/components/bulk-actions|@/components/common|g" \
  -e "s|@/components/saved-filters|@/components/common|g" \
  -e "s|@/components/empty-state|@/components/common|g" \
  -e "s|@/components/search-form|@/components/common|g"
```

---

## ✅ Checklist de Migração

- [ ] Atualizar imports em páginas de clientes
- [ ] Atualizar imports em componentes
- [ ] Remover imports de componentes deletados
- [ ] Testar compilação (`npm run build`)
- [ ] Testar tipos (`npm run type-check`)
- [ ] Testar aplicação (`npm run dev`)
- [ ] Atualizar documentação interna

---

## 🆘 Troubleshooting

### Erro: "Cannot find module '@/components/client-modal'"

**Solução:** Atualize o import para:
```typescript
import { ClientModal } from '@/components/clients'
```

### Erro: "Cannot find module '@/components/clients-table'"

**Solução:** Atualize o import para:
```typescript
import { DataTable, clientColumns } from '@/components/clients'
```

### Erro: "Module has no exported member 'ClientModal'"

**Solução:** Verifique se está importando de `@/components/clients` (com 's' no final)

---

## 📞 Suporte

Se encontrar problemas durante a migração:

1. Verifique o arquivo `docs/REORGANIZACAO-COMPONENTES.md`
2. Consulte os exemplos acima
3. Execute `npm run build` para ver erros específicos
4. Verifique os arquivos `src/components/clients/index.ts` e `src/components/common/index.ts`

---

**Última atualização:** 2025-09-30  
**Autor:** Augment Agent

