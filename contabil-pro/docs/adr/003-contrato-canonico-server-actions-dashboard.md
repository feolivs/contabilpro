# ADR-003: Contrato Canônico para Server Actions do Dashboard

**Status**: Aceito  
**Data**: 2025-01-29  
**Decisores**: Equipe de Desenvolvimento  

## Contexto

Durante o desenvolvimento do dashboard do ContabilPRO, identificamos violações críticas das regras de higiene de Server Actions:

1. **Violação "use server"**: O arquivo `src/actions/dashboard.ts` exportava uma interface `ActionResponse<T>` junto com funções assíncronas, violando a regra fundamental de que arquivos "use server" só podem exportar funções assíncronas.

2. **Imports incorretos**: Componentes importavam tipos diretamente de `@/actions/dashboard`, burlando a fronteira arquitetural entre componentes e actions.

3. **Tipos duplicados**: Existiam definições inconsistentes de `ActionResponse<T>` vs `ResilientResponse<T>`, gerando confusão de contrato.

4. **Falta de padronização**: Diferentes funções do dashboard retornavam tipos diferentes, dificultando o tratamento uniforme de respostas.

## Decisão

**Estabelecer um contrato canônico unificado para todas as Server Actions do dashboard, com separação estrita de responsabilidades e tipos centralizados.**

### Mudanças Implementadas

#### 1. Criação de `src/types/actions.ts`
- **ActionResponse<T>**: Tipo canônico para respostas de Server Actions
- **FormState**: Para integração com useFormState do React
- **ImportState**: Para operações de importação em lote
- **Helpers**: `createSuccessResponse`, `createErrorResponse`, type guards

#### 2. Saneamento de `src/actions/dashboard.ts`
- ✅ Removida interface `ActionResponse<T>` duplicada
- ✅ Mantidas apenas funções assíncronas exportadas
- ✅ Padronização: `getDashboardTrend` e `getRecentActivity` retornam `ActionResponse<T>`
- ✅ Mantido: `getDashboardSummary` retorna `ResilientResponse<T>` (sistema de cache)

#### 3. Correção de Imports em Componentes
- ✅ `src/components/section-cards.tsx`: `DashboardSummary` de `@/types/dashboard`
- ✅ `src/components/chart-area-interactive.tsx`: `TrendPoint` de `@/types/dashboard`
- ✅ `src/components/recent-activity-list.tsx`: `RecentActivityItem` de `@/types/dashboard`
- ✅ `src/app/(tenant)/dashboard/page.tsx`: `DashboardSummary` de `@/types/dashboard`

## Consequências

### Positivas
- ✅ **Conformidade total** com regras "use server"
- ✅ **Fronteira clara** entre componentes e actions
- ✅ **Tipo canônico** para todas as respostas de actions
- ✅ **Manutenibilidade** melhorada com tipos centralizados
- ✅ **Consistência** no tratamento de erros e sucessos

### Negativas
- ⚠️ **Refactor necessário** em outros módulos para adotar o padrão
- ⚠️ **Curva de aprendizado** para novos desenvolvedores sobre a separação

### Riscos Mitigados
- 🛡️ **Build failures** por violações "use server"
- 🛡️ **Cache fantasma** do Turbopack
- 🛡️ **Inconsistências** de tipos entre módulos

## Implementação

### Estrutura Final
```
src/
├── actions/
│   └── dashboard.ts          # ✅ Apenas funções async
├── types/
│   ├── actions.ts           # ✅ Tipos canônicos para actions
│   └── dashboard.ts         # ✅ Tipos específicos do dashboard
└── components/
    ├── section-cards.tsx    # ✅ Importa de @/types/
    ├── chart-area-interactive.tsx
    └── recent-activity-list.tsx
```

### Validação
- ✅ Script `check-server-actions.js` passa sem erros
- ✅ Dashboard renderiza corretamente
- ✅ Zero imports de `@/actions/` em componentes
- ✅ Uma única definição de `ActionResponse<T>`

## Próximos Passos

1. **Aplicar padrão** em outros módulos (clientes, lançamentos, bancos)
2. **Atualizar CI/CD** para validar conformidade automaticamente
3. **Documentar** guidelines para novos desenvolvedores
4. **Migrar** tipos legados para o novo padrão

## Referências

- [ADR-002: Server Actions Hygiene](./002-server-actions-hygiene.md)
- [Next.js Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Runbook: Saúde do Dashboard](../runbooks/dashboard-health-check.md)
