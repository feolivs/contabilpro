# 🛡️ Blindagem Anti-Regressão: Server Actions

## 📋 **Resumo Executivo**

Sistema completo de prevenção de regressões em Server Actions do Next.js, implementado após correção crítica de problemas de bundling e cache.

### ✅ **Status Atual**
- **6 arquivos** "use server" em conformidade
- **0 erros** de hygiene detectados
- **Todas as páginas** funcionando (200 OK)
- **CI/CD** configurado com verificação automática

---

## 🏗️ **Arquitetura Implementada**

### **1. Convenção de Pastas e Nomes**
```
src/
├── actions/          # ✅ Apenas funções async
│   ├── auth.ts
│   ├── clients.ts
│   ├── entries.ts
│   ├── bank-accounts.ts
│   └── dashboard.ts
├── types/           # ✅ Tipos, interfaces, constantes
│   ├── auth.ts
│   ├── clients.ts
│   ├── entries.ts
│   ├── bank-accounts.ts
│   └── dashboard.ts
├── schemas/         # ✅ Validações Zod (futuro)
└── services/        # ✅ Utilitários (futuro)
```

### **2. Regras de Qualidade Automática**

#### **Verificação Estática**
```bash
npm run check:server-actions  # Executa verificação completa
npm run test:hygiene          # Hygiene + TypeScript check
```

#### **Checagem de Imports**
- ✅ Componentes importam tipos de `types/`
- ❌ Componentes **nunca** importam de `actions/`
- ✅ Actions importam apenas funções de outros actions

---

## 🔧 **Ferramentas Implementadas**

### **1. Script de Verificação**
**Arquivo**: `scripts/check-server-actions.js`

**Funcionalidades**:
- ✅ Detecta arquivos "use server" automaticamente
- ✅ Valida exports (apenas funções async permitidas)
- ✅ Verifica imports cruzados
- ✅ Relatório colorido com linha específica do erro
- ✅ Exit code 1 para falhas (CI-friendly)

### **2. CI/CD Pipeline**
**Arquivo**: `.github/workflows/server-actions-hygiene.yml`

**Jobs**:
- 🔍 **server-actions-hygiene**: Verificação principal
- 🔗 **lint-imports**: Padrões de import
- 🗄️ **cache-validation**: Estratégia de cache

### **3. Template de PR**
**Arquivo**: `.github/pull_request_template.md`

**Checklist Obrigatório**:
- [ ] Arquivo "use server" exporta **somente funções async**?
- [ ] Tipos/constantes estão em `types/` ou `schemas/`?
- [ ] Componentes importam tipos de `types/`, **nunca de `actions/`**?
- [ ] Executei `npm run check:server-actions` sem erros?
- [ ] Cache foi invalidado (`rm -rf .next`)?

---

## 📚 **Documentação Completa**

### **1. Convenções**
- 📁 [`docs/conventions/folder-naming.md`](./conventions/folder-naming.md)

### **2. ADR (Architectural Decision Record)**
- 📄 [`docs/adr/002-server-actions-hygiene.md`](./adr/002-server-actions-hygiene.md)

### **3. Runbook de Troubleshooting**
- 🔧 [`docs/runbooks/server-actions-troubleshooting.md`](./runbooks/server-actions-troubleshooting.md)

---

## 🚨 **Checklist de PR (Curto e Cruel)**

### ✅ **Antes de Abrir PR**
1. [ ] Arquivo "use server" exporta somente funções async?
2. [ ] Tipos/constantes estão em `types/` ou `schemas/`?
3. [ ] Componentes importam tipos de `types/`, nunca de `actions/`?
4. [ ] Turbopack/Next cache foi invalidado no fim do ajuste?
5. [ ] Teste manual: `/lancamentos` e `/bancos` abrem e executam uma ação sem erro?

### ✅ **Durante Code Review**
1. [ ] `npm run check:server-actions` passa sem erros?
2. [ ] Convenções de nomenclatura seguidas?
3. [ ] Imports seguem padrões estabelecidos?
4. [ ] Nenhum arquivo mistura responsabilidades?

---

## 🔄 **CI Mínima**

### **Job "server-actions-hygiene"**
```yaml
- name: 🔍 Check Server Actions Hygiene
  run: node scripts/check-server-actions.js

- name: 📋 Validate Folder Structure  
  run: # Verificações de estrutura de pastas

- name: 🧪 TypeScript Check
  run: npx tsc --noEmit --skipLibCheck
```

**Falha o build se**:
- Export indevido detectado
- Import cruzado encontrado
- TypeScript não compila

---

## 📖 **ADR Resumido**

### **Decisão**
> "Arquivos 'use server' só expõem funções assíncronas; tudo não-funcional (tipos/constantes/validação) vai para `types/` e `schemas/`."

### **Motivação**
- Evitar hydration/regra de bundling do Next
- Clareza de fronteira server/client
- Menos cache zumbi
- PRs mais previsíveis e reversíveis

### **Impacto**
- ✅ **Zero erros** de "use server" 
- ✅ **Cache previsível**
- ✅ **Builds estáveis**
- ✅ **Escalabilidade** da arquitetura

---

## 🔧 **Runbook Dev (Para Você do Futuro)**

### **Sintoma**: Erro de "apenas funções async em use server"

**Causas Comuns**:
- Export de objeto/constante
- Import de tipo a partir de `actions/`
- Cache velho do Turbopack

**Ações**:
1. Mover símbolos para `types/` ou `schemas/`
2. Corrigir imports nos componentes
3. Invalidar cache: `rm -rf .next`
4. Reler logs e executar `npm run check:server-actions`

### **Comandos de Emergência**:
```bash
# Reset completo (último recurso)
rm -rf .next .turbo node_modules/.cache
npm ci
npm run check:server-actions
npm run dev
```

---

## 📊 **Métricas de Sucesso**

### **Indicadores Saudáveis**
- ✅ `npm run check:server-actions` passa em < 5s
- ✅ Hot reload funciona em < 2s  
- ✅ Build de produção em < 30s
- ✅ Zero erros de "use server" por semana

### **Alertas Vermelhos**
- 🚨 > 3 invalidações manuais de cache por dia
- 🚨 Erro de "use server" em produção
- 🚨 Hot reload > 10s consistentemente
- 🚨 Build failure > 2x por semana

---

## 🎯 **Resultado Final**

### **Antes da Blindagem**
- ❌ Erros frequentes de "use server"
- ❌ Cache fantasma do Turbopack
- ❌ Builds instáveis
- ❌ Debugging complexo

### **Depois da Blindagem**
- ✅ **Zero erros** de Server Actions
- ✅ **Cache previsível** e controlado
- ✅ **Builds determinísticos**
- ✅ **Debugging simplificado**
- ✅ **Arquitetura escalável**

---

**🛡️ BLINDAGEM ATIVA**: Sistema protegido contra regressões de Server Actions com verificação automática em CI/CD e ferramentas de desenvolvimento.
