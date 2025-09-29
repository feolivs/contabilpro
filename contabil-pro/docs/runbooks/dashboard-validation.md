# Runbook: Validação do Dashboard em 2 Minutos

## 🎯 Objetivo
Verificar rapidamente se o dashboard está funcionando corretamente em produção.

## ⏱️ Tempo Estimado: 2 minutos

## 🔍 Checklist de Validação

### 1. Acesso Básico (30s)
```bash
# Verificar se a aplicação responde
curl -I https://contabilpro.com/health
# Esperado: HTTP 200

# Verificar autenticação
curl -I https://contabilpro.com/t/demo/dashboard
# Esperado: HTTP 200 ou 302 (redirect para login)
```

### 2. Métricas do Dashboard (60s)
```sql
-- Conectar ao banco e executar:
SELECT 
  procedure_name,
  COUNT(*) as calls_last_hour,
  AVG(execution_time_ms) as avg_time_ms,
  COUNT(*) FILTER (WHERE status = 'error') as errors
FROM rpc_metrics 
WHERE called_at >= now() - interval '1 hour'
  AND procedure_name LIKE 'dashboard_%'
GROUP BY procedure_name;
```

**Valores Esperados:**
- `dashboard_summary_v1`: < 500ms média, < 5% erro
- `dashboard_trend`: < 1000ms média, < 5% erro  
- `dashboard_recent_activity`: < 300ms média, < 5% erro

### 3. Teste Funcional (30s)
```bash
# Usar conta de teste
export TEST_TENANT="demo-tenant"
export TEST_TOKEN="<token-de-teste>"

# Verificar endpoint de métricas
curl -H "Authorization: Bearer $TEST_TOKEN" \
  "https://contabilpro.com/api/dashboard/summary?tenant=$TEST_TENANT"

# Esperado: JSON com revenue, expense, newClients, etc.
```

## 🚨 Alertas Críticos

### Dashboard Não Carrega
```bash
# 1. Verificar logs da aplicação
kubectl logs -f deployment/contabilpro-web --tail=50

# 2. Verificar conexão com banco
psql $DATABASE_URL -c "SELECT 1;"

# 3. Verificar RPCs
psql $DATABASE_URL -c "SELECT * FROM rpc_error_alerts;"
```

### Performance Degradada
```sql
-- Verificar queries lentas
SELECT 
  procedure_name,
  MAX(execution_time_ms) as max_time,
  AVG(execution_time_ms) as avg_time
FROM rpc_metrics 
WHERE called_at >= now() - interval '10 minutes'
GROUP BY procedure_name
HAVING AVG(execution_time_ms) > 1000;
```

### Taxa de Erro Alta
```sql
-- Investigar erros específicos
SELECT 
  error_code,
  error_message,
  COUNT(*) as occurrences,
  MAX(called_at) as last_occurrence
FROM rpc_metrics 
WHERE status = 'error' 
  AND called_at >= now() - interval '1 hour'
GROUP BY error_code, error_message
ORDER BY occurrences DESC;
```

## 🔧 Ações Corretivas

### Problema: RPC Timeout
1. Verificar índices: `EXPLAIN ANALYZE SELECT ...`
2. Verificar cardinalidade: `SELECT count(*) FROM entries;`
3. Se > 100k registros, considerar particionamento

### Problema: Cache Miss Alto
1. Verificar configuração Next.js: `revalidate` settings
2. Limpar cache: `revalidateTag('dashboard')`
3. Verificar Redis (se aplicável)

### Problema: Isolamento de Tenant
1. Verificar RLS: `SELECT current_setting('request.jwt.claims');`
2. Testar com tenant diferente
3. Verificar logs de segurança

## 📊 Métricas de Sucesso
- ✅ Tempo de resposta < 2s
- ✅ Taxa de erro < 5%
- ✅ Disponibilidade > 99.9%
- ✅ Cache hit rate > 80%

## 🆘 Escalação
- **Nível 1**: Reiniciar aplicação
- **Nível 2**: Verificar banco de dados
- **Nível 3**: Contatar equipe de desenvolvimento

---
*Última atualização: 2024-12-29*
*Próxima revisão: 2025-01-29*
