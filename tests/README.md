# ContabilPRO - Test Suite

Este diretório contém todos os testes do projeto ContabilPRO.

## 📋 Estrutura de Testes

```
tests/
├── rls/                    # Testes de Row Level Security (RLS)
│   └── documents.test.ts   # Validação de políticas multi-tenant
└── README.md               # Este arquivo

src/__tests__/
├── hooks/                  # Testes de hooks React
│   └── use-documents.test.ts
└── components/             # Testes de componentes
    └── file-upload-zone.test.tsx
```

## 🧪 Tipos de Testes

### 1. **Testes Unitários** (`src/__tests__/`)
Testam unidades isoladas de código (hooks, componentes, funções).

**Hooks testados:**
- `useDocuments` - Listagem e filtros
- `useDocumentStats` - Cálculo de estatísticas
- `useDeleteDocument` - Exclusão de documentos
- `useReprocessDocument` - Reprocessamento

**Componentes testados:**
- `FileUploadZone` - Upload com drag-and-drop
- Validação de cliente selecionado
- Validação de tipos de arquivo

### 2. **Testes de Integração** (`tests/rls/`)
Testam a integração entre múltiplos componentes e o banco de dados.

**RLS (Row Level Security):**
- Isolamento multi-tenant
- Políticas de SELECT, INSERT, UPDATE, DELETE
- Prevenção de vazamento de dados entre usuários

## 🚀 Comandos de Teste

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm run test:coverage

# Executar apenas testes RLS
npm run test:integration:rls
```

## 📊 Cobertura de Código

Metas de cobertura configuradas em `jest.config.js`:
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

## 🔧 Configuração

### Jest (`jest.config.js`)
- Ambiente: `jsdom` (para testes de componentes React)
- Setup: `jest.setup.js` (mocks e configurações globais)
- Aliases: `@/*` mapeado para `src/*`

### Mocks Globais (`jest.setup.js`)
- Supabase client
- Next.js router
- Zustand stores (auth, client)
- Sonner toast

## ✅ Checklist de Testes

Antes de fazer merge/deploy, garanta que:

- [ ] Todos os testes passam (`npm test`)
- [ ] Cobertura mínima atingida (`npm run test:coverage`)
- [ ] Testes RLS validados (`npm run test:integration:rls`)
- [ ] Type-check passa (`npm run type-check`)
- [ ] Linting passa (`npm run lint`)

## 📝 Escrevendo Novos Testes

### Exemplo: Teste de Hook

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useMyHook', () => {
  it('should fetch data', async () => {
    const { result } = renderHook(() => useMyHook(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})
```

### Exemplo: Teste de Componente

```typescript
import { render, screen } from '@testing-library/react'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## 🐛 Debugging

Para debugar testes:

```bash
# Executar um teste específico
npm test -- use-documents.test.ts

# Executar com verbose
npm test -- --verbose

# Executar com watch e apenas testes que falharam
npm run test:watch -- --onlyFailures
```

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)

## 🔐 Testes de Segurança (RLS)

Os testes RLS são **críticos** para garantir isolamento multi-tenant.

**Cenários testados:**
1. Usuário A não pode acessar dados do Usuário B
2. Políticas de SELECT, INSERT, UPDATE, DELETE funcionam corretamente
3. Cascade delete funciona sem violar RLS
4. Storage paths respeitam isolamento

**Nota:** Os testes RLS atuais são placeholders. Para implementação completa, é necessário:
- Supabase local instance (`supabase start`)
- Múltiplos usuários de teste
- Clientes Supabase com diferentes contextos de auth

## 🎯 Próximos Passos

1. Implementar testes E2E com Playwright
2. Adicionar testes de performance
3. Implementar testes RLS completos com Supabase local
4. Adicionar testes de acessibilidade (a11y)
5. Configurar CI/CD para executar testes automaticamente

