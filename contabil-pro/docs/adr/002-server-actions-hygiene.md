# ADR-002: Server Actions Hygiene

**Status**: Aceito  
**Data**: 2024-12-29  
**Decisores**: Equipe de Desenvolvimento  

## Contexto

Durante o desenvolvimento do ContabilPRO, enfrentamos problemas recorrentes com Server Actions do Next.js onde arquivos marcados com `"use server"` exportavam objetos, tipos e constantes além de funções assíncronas. Isso causava:

1. **Erros de bundling**: "A 'use server' file can only export async functions, found object"
2. **Cache fantasma**: Turbopack mantinha cache antigo após correções
3. **Hydration issues**: Problemas de sincronização client/server
4. **Debugging complexo**: Difícil identificar a origem dos problemas

## Decisão

**Arquivos "use server" só expõem funções assíncronas; tudo não-funcional (tipos/constantes/validação) vai para `types/` e `schemas/`.**

### Regras Implementadas

#### 1. Separação Estrita de Responsabilidades
```
src/
├── actions/          # ✅ Apenas funções async
├── types/           # ✅ Tipos, interfaces, constantes
├── schemas/         # ✅ Validações Zod
└── services/        # ✅ Utilitários e helpers
```

#### 2. Convenções de Nomenclatura
- `*.action.ts` - Server Actions (funções async)
- `*.types.ts` - Tipos e interfaces TypeScript  
- `*.schema.ts` - Schemas de validação (Zod)
- `*.service.ts` - Serviços e utilitários

#### 3. Regras de Import
```typescript
// ✅ Permitido
import { ClientFormState } from '@/types/client.types'
import { clientSchema } from '@/schemas/client.schema'

// ❌ Proibido  
import { ClientFormState } from '@/actions/client.action'
```

#### 4. Verificação Automática
- Script `check-server-actions.js` para validação local
- CI job `server-actions-hygiene` para PRs
- Checklist obrigatório em code reviews

## Motivação

### Problemas Resolvidos
1. **Bundling**: Elimina conflitos de exportação em arquivos "use server"
2. **Cache**: Reduz problemas de cache stale do Turbopack
3. **Clareza**: Fronteira clara entre server/client code
4. **Manutenibilidade**: Fácil localizar e modificar código
5. **Onboarding**: Estrutura previsível para novos desenvolvedores

### Benefícios Técnicos
- **Zero erros de hydration** relacionados a Server Actions
- **Build determinístico** sem surpresas de bundling
- **Hot reload confiável** durante desenvolvimento
- **Debugging simplificado** com responsabilidades claras

## Consequências

### Positivas
- ✅ **Builds estáveis**: Sem erros de "use server" 
- ✅ **Cache previsível**: Invalidação controlada
- ✅ **Code reviews eficientes**: Checklist automatizado
- ✅ **Escalabilidade**: Estrutura cresce organizadamente
- ✅ **Menos bugs**: Prevenção automática de regressões

### Negativas
- ⚠️ **Refactoring inicial**: Mover código existente
- ⚠️ **Disciplina**: Equipe deve seguir convenções
- ⚠️ **Imports extras**: Mais linhas de import nos componentes

### Mitigações
- **Tooling**: Scripts automatizados para verificação
- **Documentação**: Guias claros e exemplos
- **CI/CD**: Validação automática em PRs
- **Templates**: Snippets para novos arquivos

## Implementação

### Fase 1: Correção Imediata ✅
- [x] Mover tipos de `actions/` para `types/`
- [x] Corrigir imports em componentes
- [x] Validar funcionamento de todas as páginas

### Fase 2: Automação ✅
- [x] Script de verificação `check-server-actions.js`
- [x] CI job `server-actions-hygiene`
- [x] Documentação de convenções

### Fase 3: Prevenção ✅
- [x] Checklist de PR
- [x] ADR documentado
- [x] Runbook para troubleshooting

## Monitoramento

### Métricas de Sucesso
- **Zero erros** de "use server" em builds
- **Tempo de build** estável (< 30s para dev)
- **Hot reload** funcionando em < 2s
- **PRs rejeitados** por hygiene < 5%

### Alertas
- Build failure por Server Actions hygiene
- Imports cruzados detectados em CI
- Cache invalidation manual frequente (> 3x/dia)

## Referências

- [Next.js Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Turbopack Caching Behavior](https://turbo.build/pack/docs/features/dev-server)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)

## Revisão

Esta decisão será revisada em **3 meses** (Março 2025) ou quando:
- Mudanças significativas no Next.js Server Actions
- Problemas de performance identificados
- Feedback negativo consistente da equipe
