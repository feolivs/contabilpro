# Runbook: Saúde do Dashboard em 2 Minutos

## 🎯 **Objetivo**
Verificar rapidamente se o dashboard do ContabilPRO está funcionando corretamente após mudanças ou em caso de incidentes.

## ⏱️ **Tempo Estimado**: 2 minutos

---

## 🔍 **Checklist de Saúde (30 segundos)**

### 1. Server Actions Hygiene
```bash
# Verificar conformidade das Server Actions
node scripts/check-server-actions.js
# ✅ Esperado: "Todos os Server Actions estão em conformidade!"
```

### 2. Imports Corretos
```bash
# Verificar se não há imports incorretos de actions em componentes
findstr /r /s "from.*@/actions/dashboard" src\components\*.tsx src\app\**\*.tsx
# ✅ Esperado: Nenhum resultado (exit code 1)
```

### 3. Tipo Canônico
```bash
# Verificar se existe apenas uma definição de ActionResponse
findstr /r /s "interface.*ActionResponse" src\types\actions.ts
# ✅ Esperado: Uma linha com a definição
```

---

## 🌐 **Teste Funcional (90 segundos)**

### 1. Iniciar Servidor (30s)
```bash
npm run dev
# ✅ Esperado: "Ready in ~1-3s" sem erros
```

### 2. Acessar Dashboard (30s)
- **URL**: `http://localhost:3001/t/contabil-pro-teste/dashboard`
- **✅ Esperado**: 
  - Página carrega sem erro 500/404
  - 3 cartões de métricas visíveis
  - Gráfico de tendência renderizado
  - Lista de atividades recentes

### 3. Verificar Logs (30s)
```bash
# No terminal do servidor, verificar:
# ✅ GET /t/contabil-pro-teste/dashboard 200 in <1000ms
# ❌ Qualquer erro 500 ou stack trace
```

---

## 📊 **Métricas de Performance**

### Targets Esperados
- **P95 das RPCs**: < 500ms
- **Tempo de carregamento**: < 2s
- **Taxa de erro**: < 5%

### Comandos de Verificação
```bash
# Verificar tempo de resposta das actions (em logs do servidor)
# Buscar por: "GET /t/.../dashboard 200 in XXXms"

# Se P95 > 500ms, verificar:
# 1. Índices do banco de dados
# 2. Queries das RPCs dashboard_summary_v1, dashboard_trend, dashboard_recent_activity
# 3. Cache do sistema de resiliência
```

---

## 🚨 **Ações em Caso de Falha**

### Erro: "use server file can only export async functions"
```bash
# 1. Verificar arquivos problemáticos
node scripts/check-server-actions.js --verbose

# 2. Limpar cache
rm -rf .next
npm run dev

# 3. Se persistir, verificar se há exports não-async em src/actions/
```

### Erro: "Cannot find module '@/actions/dashboard'"
```bash
# 1. Verificar imports incorretos
findstr /r /s "@/actions/dashboard" src\components\*.tsx

# 2. Corrigir imports para @/types/dashboard
# Exemplo: DashboardSummary, TrendPoint, RecentActivityItem
```

### Dashboard não carrega (500/404)
```bash
# 1. Verificar se Supabase está rodando
supabase status

# 2. Verificar se as RPCs existem no banco
psql $DATABASE_URL -c "\df dashboard_*"

# 3. Verificar logs de erro no terminal do Next.js
```

### Performance degradada (P95 > 500ms)
```bash
# 1. Verificar cache do sistema de resiliência
# Logs devem mostrar: "source: 'live'" para dados frescos

# 2. Verificar índices do banco
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM dashboard_summary_v1('tenant-id', 30)"

# 3. Se necessário, invalidar cache
# (implementar endpoint /api/cache/invalidate)
```

---

## 📋 **Checklist de PR**

Antes de aprovar PRs que afetam o dashboard:

- [ ] ✅ Script `check-server-actions.js` passa
- [ ] ✅ Zero imports de `@/actions/` em componentes  
- [ ] ✅ Dashboard carrega em < 2s
- [ ] ✅ 3 cartões de métricas funcionando
- [ ] ✅ Gráfico renderiza sem erro
- [ ] ✅ P95 das RPCs < 500ms
- [ ] ✅ Testes de regressão passam

---

## 🔗 **Links Úteis**

- [ADR-003: Contrato Canônico Dashboard](../adr/003-contrato-canonico-server-actions-dashboard.md)
- [Server Actions Troubleshooting](./server-actions-troubleshooting.md)
- [Dashboard Regression Tests](../../tests/business/dashboard-regression.test.ts)
