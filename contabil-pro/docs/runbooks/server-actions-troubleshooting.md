# Runbook: Server Actions Troubleshooting

## 🚨 **Sintomas Comuns**

### 1. Erro: "A 'use server' file can only export async functions, found object"

**Sintoma**: Build falha com erro de exportação inválida em arquivo "use server"

**Diagnóstico Rápido**:
```bash
# Verificar arquivos problemáticos
node scripts/check-server-actions.js

# Buscar exports não-async em actions/
grep -r "^export (const|let|var|type|interface)" src/actions/
```

**Causas Comuns**:
- ❌ Export de constante: `export const initialState = { ... }`
- ❌ Export de tipo: `export type FormState = { ... }`
- ❌ Export de interface: `export interface Client { ... }`
- ❌ Função não-async: `export function helper() { ... }`

**Solução**:
1. **Mover tipos/constantes** para `src/types/`
2. **Corrigir imports** nos componentes
3. **Invalidar cache** do Next.js

```bash
# Passo a passo
rm -rf .next
npm run check:server-actions
npm run dev
```

### 2. Erro: "Export [name] doesn't exist in target module"

**Sintoma**: Componente não consegue importar tipo de arquivo de action

**Diagnóstico**:
```bash
# Verificar imports cruzados
grep -r "from '@/actions/" src/app/ src/components/ | grep -E "(State|Type|Interface)"
```

**Solução**:
```typescript
// ❌ Antes
import { ClientFormState } from '@/actions/clients'

// ✅ Depois  
import { ClientFormState } from '@/types/clients'
```

### 3. Cache "Zumbi" do Turbopack

**Sintoma**: Correções não refletem no browser, erros persistem após fix

**Diagnóstico**:
```bash
# Verificar se .next existe
ls -la .next/

# Verificar timestamp dos arquivos
find .next/ -name "*.js" -newer src/actions/clients.ts
```

**Solução Definitiva**:
```bash
# 1. Parar servidor
Ctrl+C

# 2. Limpar cache completamente
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

# 3. Reinstalar dependências (se necessário)
npm ci

# 4. Reiniciar
npm run dev
```

## 🔧 **Comandos de Diagnóstico**

### Verificação Completa
```bash
# Script principal de verificação
npm run check:server-actions

# Verificação manual detalhada
node scripts/check-server-actions.js --verbose
```

### Análise de Imports
```bash
# Encontrar imports problemáticos
grep -r "from '@/actions/" src/ | grep -v "\.action\." | head -10

# Verificar estrutura de pastas
tree src/ -I "node_modules|.next"
```

### Cache e Build
```bash
# Limpar tudo
npm run clean

# Build de produção para testar
npm run build

# Verificar tamanho dos bundles
npm run analyze
```

## 📋 **Checklist de PR (Curto e Cruel)**

### ✅ **Antes de Abrir PR**
- [ ] Arquivo "use server" exporta somente funções async?
- [ ] Tipos/constantes estão em `types/` ou `schemas/`?
- [ ] Componentes importam tipos de `types/`, nunca de `actions/`?
- [ ] Turbopack/Next cache foi invalidado no fim do ajuste?
- [ ] Teste manual: `/lancamentos` e `/bancos` abrem e executam uma ação sem erro?

### ✅ **Durante Code Review**
- [ ] `npm run check:server-actions` passa sem erros?
- [ ] Convenções de nomenclatura seguidas?
- [ ] Imports seguem padrões estabelecidos?
- [ ] Nenhum arquivo mistura responsabilidades?

### ✅ **Antes de Merge**
- [ ] CI job `server-actions-hygiene` passou?
- [ ] Build de produção funciona?
- [ ] Hot reload funciona em desenvolvimento?

## 🚀 **Comandos de Emergência**

### Reset Completo (Último Recurso)
```bash
#!/bin/bash
echo "🚨 RESET COMPLETO - Use apenas em emergência"

# Parar todos os processos Node
pkill -f "next dev"

# Limpar todos os caches
rm -rf .next
rm -rf node_modules/.cache  
rm -rf .turbo
rm -rf dist

# Reinstalar dependências
rm -rf node_modules
rm package-lock.json
npm install

# Verificar integridade
npm run check:server-actions
npm run type-check

# Reiniciar
npm run dev

echo "✅ Reset completo finalizado"
```

### Verificação de Integridade
```bash
#!/bin/bash
echo "🔍 Verificando integridade do projeto..."

# 1. Estrutura de pastas
echo "📁 Verificando estrutura..."
[ -d "src/actions" ] && echo "✅ src/actions/" || echo "❌ src/actions/ missing"
[ -d "src/types" ] && echo "✅ src/types/" || echo "❌ src/types/ missing"

# 2. Server Actions
echo "🔧 Verificando Server Actions..."
node scripts/check-server-actions.js

# 3. TypeScript
echo "📝 Verificando tipos..."
npx tsc --noEmit --skipLibCheck

# 4. Build test
echo "🏗️ Testando build..."
npm run build

echo "✅ Verificação completa"
```

## 📞 **Escalação**

### Nível 1: Auto-resolução (5 min)
1. Executar `npm run check:server-actions`
2. Limpar cache: `rm -rf .next && npm run dev`
3. Verificar logs do terminal

### Nível 2: Investigação (15 min)
1. Analisar arquivos modificados recentemente
2. Verificar imports cruzados
3. Testar em branch limpa

### Nível 3: Suporte Técnico (30 min)
1. Documentar problema no GitHub Issue
2. Incluir logs completos e arquivos afetados
3. Mencionar @tech-lead no Slack

## 📊 **Métricas de Sucesso**

### Indicadores Saudáveis
- ✅ `npm run check:server-actions` passa em < 5s
- ✅ Hot reload funciona em < 2s
- ✅ Build de produção em < 30s
- ✅ Zero erros de "use server" por semana

### Alertas Vermelhos
- 🚨 > 3 invalidações manuais de cache por dia
- 🚨 Erro de "use server" em produção
- 🚨 Hot reload > 10s consistentemente
- 🚨 Build failure > 2x por semana

## 🔄 **Prevenção**

### Automação
- CI job obrigatório em PRs
- Pre-commit hooks para verificação
- Templates de código padronizados

### Educação
- Onboarding com foco em Server Actions
- Code review guidelines atualizados
- Sessões de troubleshooting mensais
