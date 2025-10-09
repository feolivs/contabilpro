# Guia de Contribuição - ContabilPRO

Obrigado por considerar contribuir para o ContabilPRO! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Padrões de Código](#padrões-de-código)
- [Processo de Pull Request](#processo-de-pull-request)
- [Estrutura de Commits](#estrutura-de-commits)
- [Testes](#testes)

## 🤝 Código de Conduta

Este projeto adere a um código de conduta. Ao participar, você concorda em manter um ambiente respeitoso e inclusivo.

## 🚀 Como Contribuir

### Reportando Bugs

1. Verifique se o bug já foi reportado nas [Issues](https://github.com/feolivs/contabilpro/issues)
2. Se não, crie uma nova issue com:
   - Título claro e descritivo
   - Passos para reproduzir o problema
   - Comportamento esperado vs. atual
   - Screenshots (se aplicável)
   - Versão do Node.js e sistema operacional

### Sugerindo Melhorias

1. Abra uma issue com a tag `enhancement`
2. Descreva claramente a melhoria proposta
3. Explique por que seria útil para o projeto
4. Forneça exemplos de uso, se possível

### Contribuindo com Código

1. **Fork** o repositório
2. **Clone** seu fork localmente
3. **Crie uma branch** para sua feature/fix
4. **Faça suas alterações**
5. **Teste** suas alterações
6. **Commit** seguindo os padrões
7. **Push** para seu fork
8. **Abra um Pull Request**

## 💻 Padrões de Código

### TypeScript

- Use **TypeScript strict mode**
- Sempre defina tipos explícitos
- Evite `any` - use `unknown` quando necessário
- Prefira interfaces para objetos públicos

```typescript
// ✅ Bom
interface User {
  id: string
  email: string
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Ruim
function getUser(id: any): any {
  // ...
}
```

### React

- Use **componentes funcionais** com hooks
- Evite classes
- Extraia lógica complexa para custom hooks
- Use `memo` apenas quando necessário

```typescript
// ✅ Bom
export function MyComponent({ data }: MyComponentProps) {
  const [state, setState] = useState()
  // ...
}

// ❌ Ruim
export class MyComponent extends React.Component {
  // ...
}
```

### Organização de Arquivos

```
src/
├── app/              # Rotas (Next.js App Router)
├── components/
│   ├── ui/          # Componentes reutilizáveis (shadcn/ui)
│   └── features/    # Componentes específicos de features
├── hooks/           # Custom hooks
├── lib/             # Utilities e configurações
├── stores/          # Zustand stores
└── __tests__/       # Testes
```

### Nomenclatura

- **Componentes**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useAuth.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (`UserData`)

### Imports

Organize imports na seguinte ordem:

```typescript
// 1. React e bibliotecas externas
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Imports internos (usando alias @/)
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

// 3. Imports relativos
import { helper } from './helper'

// 4. Types
import type { User } from '@/types'
```

## 🔄 Processo de Pull Request

### Antes de Abrir um PR

1. ✅ Certifique-se de que o código compila sem erros
2. ✅ Execute todos os testes: `npm test`
3. ✅ Execute o linter: `npm run lint`
4. ✅ Execute o type-check: `npm run type-check`
5. ✅ Atualize a documentação, se necessário
6. ✅ Adicione testes para novas funcionalidades

### Template de PR

```markdown
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Checklist
- [ ] Código segue os padrões do projeto
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Todos os testes passam
- [ ] Linter passa sem erros
```

### Revisão de Código

- Seja respeitoso e construtivo
- Explique o "porquê" das sugestões
- Aceite feedback de forma positiva
- Responda a todos os comentários

## 📝 Estrutura de Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

### Exemplos

```bash
feat(auth): add password reset functionality

Implements password reset flow with email verification.
Closes #123

fix(upload): prevent duplicate file uploads

Adds validation to check if file already exists before upload.

docs(readme): update installation instructions

test(hooks): add tests for useDocuments hook

chore(deps): update dependencies to latest versions
```

## 🧪 Testes

### Escrevendo Testes

- Teste comportamento, não implementação
- Use nomes descritivos
- Siga o padrão AAA (Arrange, Act, Assert)

```typescript
describe('useDocuments', () => {
  it('should fetch documents successfully', async () => {
    // Arrange
    const mockData = [{ id: '1', name: 'test.xml' }]
    
    // Act
    const { result } = renderHook(() => useDocuments())
    
    // Assert
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData)
    })
  })
})
```

### Cobertura de Testes

- Mantenha cobertura mínima de 50%
- Priorize testes para:
  - Lógica de negócio
  - Hooks customizados
  - Componentes críticos
  - Funções utilitárias

## 🔐 Segurança

### Diretrizes

- **Nunca** commite secrets ou credenciais
- Use variáveis de ambiente para configurações sensíveis
- Valide todos os inputs do usuário
- Siga princípios de least privilege
- Mantenha dependências atualizadas

### Reportando Vulnerabilidades

Se encontrar uma vulnerabilidade de segurança, **NÃO** abra uma issue pública. Entre em contato diretamente com os mantenedores.

## 📚 Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Testing Library](https://testing-library.com/)

## ❓ Dúvidas

Se tiver dúvidas sobre como contribuir, sinta-se à vontade para:

- Abrir uma issue com a tag `question`
- Entrar em contato com os mantenedores
- Consultar a documentação existente

---

**Obrigado por contribuir para o ContabilPRO! 🎉**

