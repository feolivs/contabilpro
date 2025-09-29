# 🔧 Guia Rápido: Parafusos Implementados

Este guia fornece instruções práticas para usar as melhorias implementadas.

---

## 🚀 Início Rápido

### 1. Aplicar Migrations

```bash
cd contabil-pro

# Opção 1: Via script TypeScript (recomendado)
npm run db:apply-improvements

# Opção 2: Via Supabase CLI
supabase db push

# Opção 3: Manualmente no SQL Editor
# Copiar e executar:
# - infra/migrations/011_clients_improvements.sql
# - infra/migrations/012_client_rls_improvements.sql
```

### 2. Verificar Instalação

```sql
-- Verificar se document_norm existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name = 'document_norm';

-- Verificar view materializada
SELECT * FROM client_stats_by_tenant LIMIT 1;

-- Verificar funções
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'normalize_document',
  'current_tenant_id',
  'refresh_client_stats',
  'check_rate_limit',
  'search_clients'
);
```

---

## 📚 Exemplos de Uso

### Criar Cliente (com normalização automática)

```typescript
import { createClientImproved } from '@/actions/clients-improved'

const result = await createClientImproved({
  name: 'João Silva',
  document: '12.345.678/0001-00', // Será normalizado automaticamente
  email: 'joao@example.com',
  tipo_pessoa: 'PJ',
  regime_tributario: 'Simples',
  status: 'onboarding',
})

if (result.success) {
  console.log('Cliente criado:', result.data)
}
```

### Buscar Clientes (com rate limiting)

```typescript
import { searchClients } from '@/actions/clients-improved'

// Máximo 5 buscas a cada 10 segundos
const results = await searchClients('João', 10)

results.forEach(client => {
  console.log(`${client.name} - ${client.document} (${client.similarity})`)
})
```

### Obter KPIs (view materializada)

```typescript
import { getClientStats } from '@/actions/clients-improved'

const stats = await getClientStats()

console.log(`Total: ${stats.total_clients}`)
console.log(`Ativos: ${stats.ativos}`)
console.log(`Inadimplentes: ${stats.inadimplentes}`)
console.log(`MEI: ${stats.mei}`)
```

### Buscar CEP (server-side)

```typescript
import { fetchAddressByCEP } from '@/actions/clients-improved'

const result = await fetchAddressByCEP('01310-100')

if (result.success) {
  console.log(result.data.fullAddress)
  // "Avenida Paulista, São Paulo, SP"
}
```

### Paginação Cursor-Based

```typescript
import { getClientsPaginated } from '@/actions/clients-improved'

// Primeira página
const page1 = await getClientsPaginated(undefined, 20, {
  status: 'ativo',
  regime: 'MEI',
})

console.log(`Clientes: ${page1.data.length}`)
console.log(`Tem mais: ${page1.hasNext}`)

// Próxima página
if (page1.hasNext) {
  const page2 = await getClientsPaginated(page1.cursor, 20)
}
```

### Validar Documento

```typescript
import { validateDocument, formatDocument } from '@/lib/document-utils'

// Validar
const valid = validateDocument('123.456.789-00')
console.log(valid) // true ou false

// Formatar
const formatted = formatDocument('12345678900')
console.log(formatted) // "123.456.789-00"
```

### Debounce em Busca

```typescript
'use client'

import { useState } from 'react'
import { debounce } from '@/lib/rate-limit'
import { searchClients } from '@/actions/clients-improved'

export function SearchInput() {
  const [results, setResults] = useState([])
  
  const debouncedSearch = debounce(async (query: string) => {
    const data = await searchClients(query)
    setResults(data)
  }, 300) // 300ms
  
  return (
    <input
      type="text"
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Buscar clientes..."
    />
  )
}
```

---

## 🔄 Manutenção

### Refresh Manual de Stats

```sql
-- Executar quando necessário
SELECT refresh_client_stats();
```

### Configurar Refresh Automático (pg_cron)

```sql
-- Instalar extensão (se não estiver instalada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar refresh a cada 5 minutos
SELECT cron.schedule(
  'refresh-client-stats',
  '*/5 * * * *',
  'SELECT refresh_client_stats()'
);

-- Ver jobs agendados
SELECT * FROM cron.job;

-- Remover job
SELECT cron.unschedule('refresh-client-stats');
```

### Limpar Rate Limit Logs Antigos

```sql
-- Limpar logs com mais de 24 horas
DELETE FROM rate_limit_log
WHERE created_at < NOW() - INTERVAL '24 hours';

-- Agendar limpeza automática (diária às 3h)
SELECT cron.schedule(
  'cleanup-rate-limit-logs',
  '0 3 * * *',
  'DELETE FROM rate_limit_log WHERE created_at < NOW() - INTERVAL ''24 hours'''
);
```

---

## 🐛 Troubleshooting

### Erro: "duplicate key value violates unique constraint"

**Causa:** Tentando inserir cliente com documento duplicado.

**Solução:**
```typescript
// Verificar se já existe
const { data } = await supabase
  .from('clients')
  .select('id, name')
  .eq('tenant_id', tenantId)
  .eq('document_norm', normalizeDocument(document))
  .single()

if (data) {
  console.log('Cliente já existe:', data)
}
```

### Erro: "function check_rate_limit does not exist"

**Causa:** Migration 012 não foi aplicada.

**Solução:**
```bash
npm run db:apply-improvements
```

### View materializada desatualizada

**Causa:** Stats não foram atualizados após mudanças.

**Solução:**
```sql
SELECT refresh_client_stats();
```

### Rate limit muito restritivo

**Causa:** Configuração padrão pode ser muito baixa para seu caso.

**Solução:**
```typescript
// Aumentar limite temporariamente
await requireRateLimit(userId, 'search_clients', {
  maxRequests: 20, // Aumentar de 5 para 20
  windowSeconds: 10,
})
```

---

## 📊 Monitoramento

### Ver Atividade de Rate Limiting

```sql
-- Ações mais frequentes nas últimas 24h
SELECT 
  action,
  COUNT(*) as total,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(created_at) as last_action
FROM rate_limit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY action
ORDER BY total DESC;
```

### Ver Stats de Clientes

```sql
-- Stats por tenant
SELECT 
  t.name as tenant_name,
  s.total_clients,
  s.ativos,
  s.inadimplentes,
  s.mei,
  s.simples
FROM client_stats_by_tenant s
JOIN tenants t ON t.id = s.tenant_id
ORDER BY s.total_clients DESC;
```

### Ver Performance de Buscas

```sql
-- Buscas mais lentas (se tiver logging habilitado)
SELECT 
  user_id,
  action,
  created_at,
  EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at))) as seconds_between
FROM rate_limit_log
WHERE action = 'search_clients'
ORDER BY created_at DESC
LIMIT 100;
```

---

## 🎯 Próximos Passos

Agora que os parafusos estão apertados:

1. ✅ Implementar UI do plano de clientes
2. ✅ Criar componentes com TanStack Table
3. ✅ Adicionar modal multi-step
4. ✅ Implementar busca global (Cmd+K)
5. ✅ Criar dashboard de KPIs

Consulte `plano-clientes.md` para o roadmap completo.

---

## 📖 Documentação Completa

- [PARAFUSOS-IMPLEMENTADOS.md](./PARAFUSOS-IMPLEMENTADOS.md) - Documentação técnica completa
- [plano-clientes.md](./plano-clientes.md) - Plano de implementação da UI

---

## 🆘 Suporte

Se encontrar problemas:

1. Verificar logs do Supabase
2. Verificar se migrations foram aplicadas
3. Verificar políticas RLS
4. Consultar documentação técnica

Para dúvidas específicas, consulte os comentários nos arquivos SQL e TypeScript.

