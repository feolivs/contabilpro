# 🔧 Parafusos Implementados - Preparação Pré-Implementação

Este documento descreve todas as melhorias críticas de arquitetura implementadas **antes** de executar o plano de clientes.

---

## ✅ 1. Unicidade de Documento com Normalização

### Problema
- Constraint `UNIQUE (tenant_id, document)` permite duplicatas como "12.345.678/0001-00" vs "12345678000100"

### Solução Implementada
- ✅ Criada coluna `document_norm` (somente dígitos)
- ✅ Constraint `UNIQUE (tenant_id, document_norm)`
- ✅ Trigger automático para normalização no INSERT/UPDATE
- ✅ Função `normalize_document(text)` em SQL
- ✅ Utilitários TypeScript em `src/lib/document-utils.ts`

### Arquivos
- `infra/migrations/011_clients_improvements.sql` (linhas 1-60)
- `src/lib/document-utils.ts`
- `src/lib/validations.ts` (atualizado)

### Como Usar
```typescript
import { normalizeDocument, validateDocument } from '@/lib/document-utils'

// Normalizar
const norm = normalizeDocument('12.345.678/0001-00') // "12345678000100"

// Validar
const valid = validateDocument('123.456.789-00') // true/false
```

---

## ✅ 2. Status Inadimplente Derivado

### Problema
- Status "inadimplente" manual é propenso a erros

### Solução Implementada
- ✅ Função `get_client_status_with_financial(client_id)` preparada
- ✅ Verifica existência da tabela `contas_a_receber` dinamicamente
- ✅ Retorna "inadimplente" se houver contas vencidas
- ✅ Tooltip "Ative financeiro para ver" quando módulo não estiver pronto

### Arquivos
- `infra/migrations/011_clients_improvements.sql` (linhas 220-250)

### Como Usar
```sql
-- Quando módulo financeiro estiver pronto
SELECT get_client_status_with_financial('client-uuid');
```

---

## ✅ 3. KPIs com Views Materializadas

### Problema
- `COUNT(*)` em produção vira gargalo com muitos clientes

### Solução Implementada
- ✅ View materializada `client_stats_by_tenant`
- ✅ Agregações pré-calculadas: total, ativos, inadimplentes, onboarding, por regime
- ✅ Função `refresh_client_stats()` para atualização
- ✅ Trigger para notificar quando precisa refresh (via `pg_notify`)
- ✅ Índice único para refresh concorrente

### Arquivos
- `infra/migrations/011_clients_improvements.sql` (linhas 150-180)
- `src/actions/clients-improved.ts` (`getClientStats()`)

### Como Usar
```typescript
import { getClientStats } from '@/actions/clients-improved'

const stats = await getClientStats()
// { total_clients: 150, ativos: 120, inadimplentes: 5, ... }
```

### Refresh Manual
```sql
SELECT refresh_client_stats();
```

### Configurar Refresh Automático (pg_cron)
```sql
-- A cada 5 minutos
SELECT cron.schedule('refresh-client-stats', '*/5 * * * *', 'SELECT refresh_client_stats()');
```

---

## ✅ 4. Busca Global Otimizada

### Problema
- Sem rate limit, debounce ou paginação eficiente

### Solução Implementada
- ✅ Rate limit: 5 req/10s/usuário (tabela `rate_limit_log`)
- ✅ Função `check_rate_limit()` em SQL
- ✅ Função `search_clients()` com FTS e ranking por similaridade
- ✅ Keyset pagination com `get_clients_paginated()` para >10k clientes
- ✅ Índices: `document_norm`, `name`, `name_trgm` (trigram)
- ✅ Extensão `pg_trgm` habilitada

### Arquivos
- `infra/migrations/012_client_rls_improvements.sql` (linhas 50-180)
- `src/lib/rate-limit.ts`
- `src/actions/clients-improved.ts` (`searchClients()`, `getClientsPaginated()`)

### Como Usar

#### Busca com Rate Limit
```typescript
import { searchClients } from '@/actions/clients-improved'

const results = await searchClients('João Silva', 10)
// Retorna até 10 resultados ordenados por similaridade
```

#### Paginação Cursor-Based
```typescript
import { getClientsPaginated } from '@/actions/clients-improved'

// Primeira página
const page1 = await getClientsPaginated(undefined, 20)

// Próxima página
const page2 = await getClientsPaginated(page1.cursor, 20)
```

#### Debounce no Cliente
```typescript
import { debounce } from '@/lib/rate-limit'

const debouncedSearch = debounce(async (query: string) => {
  const results = await searchClients(query)
  setResults(results)
}, 300) // 300ms
```

---

## ✅ 5. Modal Multi-Step com Salvamento Parcial

### Solução Implementada
- ✅ Schema Zod permite campos opcionais
- ✅ Status padrão: "onboarding" (permite salvar após Passo 1)
- ✅ Passos 2 e 3 são opcionais
- ✅ Server Action `createClientFromFormImproved()` aceita dados parciais

### Arquivos
- `src/lib/validations.ts` (campos opcionais)
- `src/actions/clients-improved.ts` (`createClientFromFormImproved()`)

### Como Usar
```typescript
// Passo 1: Apenas dados fiscais (mínimo)
const minimalClient = {
  name: 'João Silva',
  document: '123.456.789-00',
  tipo_pessoa: 'PF',
  status: 'onboarding', // Indica cadastro incompleto
}

await createClientImproved(minimalClient)
// ✅ Salvo com sucesso, pode completar depois
```

---

## ✅ 6. CEP/Endereços Server-Side

### Problema
- Busca de CEP no cliente causa CORS/timeout

### Solução Implementada
- ✅ Server Action `fetchAddressByCEP()` com rate limit
- ✅ Cache em memória (1 hora de TTL)
- ✅ Retry automático (até 3 tentativas)
- ✅ Timeout de 5 segundos
- ✅ Normalização e formatação automática

### Arquivos
- `src/lib/cep-utils.ts`
- `src/actions/clients-improved.ts` (`fetchAddressByCEP()`)

### Como Usar
```typescript
import { fetchAddressByCEP } from '@/actions/clients-improved'

const result = await fetchAddressByCEP('01310-100')

if (result.success) {
  console.log(result.data)
  // {
  //   cep: '01310-100',
  //   street: 'Avenida Paulista',
  //   city: 'São Paulo',
  //   state: 'SP',
  //   fullAddress: 'Avenida Paulista, São Paulo, SP'
  // }
}
```

---

## ✅ 7. RLS e Contexto JWT

### Solução Implementada
- ✅ Função `current_tenant_id()` melhorada
- ✅ Suporta JWT claim e setting manual
- ✅ Função `set_tenant_context(uuid)` para jobs administrativos
- ✅ Políticas RLS recriadas usando `current_tenant_id()`
- ✅ Helper `setRLSContext()` em TypeScript

### Arquivos
- `infra/migrations/012_client_rls_improvements.sql` (linhas 1-50)
- `src/lib/auth.ts` (já existente)

### Como Usar

#### Em Server Actions (automático)
```typescript
const session = await requireAuth()
const supabase = await setRLSContext(session)
// RLS configurado automaticamente via JWT
```

#### Em Jobs Administrativos
```sql
-- Setar contexto manualmente
SELECT set_tenant_context('tenant-uuid');

-- Agora queries respeitam RLS
SELECT * FROM clients; -- Apenas do tenant setado
```

---

## ✅ 8. TanStack Table SSR+CSR Híbrido

### Solução Implementada
- ✅ Dados paginados vêm do servidor (`getClientsPaginated()`)
- ✅ Filtros/ordenação/seleção mantidos no cliente (CSR)
- ✅ Evita `.select(*)` gigante
- ✅ Cursor-based pagination para grandes volumes

### Arquivos
- `src/actions/clients-improved.ts` (`getClientsPaginated()`)

### Como Usar
```typescript
// Server Component
export default async function ClientsPage() {
  const initialData = await getClientsPaginated(undefined, 20)
  
  return <ClientsDataTable initialData={initialData} />
}

// Client Component
'use client'
function ClientsDataTable({ initialData }) {
  const [data, setData] = useState(initialData.data)
  const [cursor, setCursor] = useState(initialData.cursor)
  
  // Filtros/ordenação no cliente
  const table = useReactTable({
    data,
    columns,
    // ... configuração TanStack Table
  })
  
  // Carregar mais do servidor
  const loadMore = async () => {
    const next = await getClientsPaginated(cursor, 20)
    setData([...data, ...next.data])
    setCursor(next.cursor)
  }
}
```

---

## ✅ 9. Import com Preview e Processamento Assíncrono

### Solução Preparada
- ✅ Estrutura de rate limiting para imports (3 imports/5min)
- ✅ Função de dedupe por `document_norm`
- ✅ Preparado para processamento assíncrono (>1k linhas)

### Arquivos
- `src/lib/rate-limit.ts` (config `import_clients`)
- `src/actions/clients-improved.ts` (estrutura preparada)

### Próximos Passos (implementar quando necessário)
1. Criar Server Action `previewImport(file)`
2. Criar Server Action `confirmImport(file, options)`
3. Integrar com fila (Supabase Edge Functions ou pg_cron)
4. Criar UI de preview com tabela

---

## ✅ 10. Telemetria Mínima

### Solução Preparada
- ✅ Estrutura de rate limiting serve como log de eventos
- ✅ Tabela `rate_limit_log` registra todas as ações

### Eventos Rastreados
- `search_clients` - Buscas realizadas
- `create_client` - Clientes criados
- `import_clients` - Imports realizados
- `fetch_cep` - Consultas de CEP

### Como Consultar
```sql
-- Eventos por usuário nas últimas 24h
SELECT 
  action,
  COUNT(*) as total,
  MAX(created_at) as last_action
FROM rate_limit_log
WHERE user_id = 'user-uuid'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY action
ORDER BY total DESC;
```

### Próximos Passos (implementar quando necessário)
1. Criar dashboard de telemetria
2. Integrar com analytics (PostHog, Mixpanel, etc)
3. Adicionar eventos customizados

---

## 📋 Como Aplicar as Migrations

### 1. Via Script TypeScript (Recomendado)
```bash
cd contabil-pro
npm run apply-migrations
```

### 2. Via Supabase CLI
```bash
supabase db push
```

### 3. Via SQL Editor (Supabase Dashboard)
1. Abrir SQL Editor
2. Copiar conteúdo de `infra/migrations/011_clients_improvements.sql`
3. Executar
4. Copiar conteúdo de `infra/migrations/012_client_rls_improvements.sql`
5. Executar

---

## 🧪 Como Testar

### 1. Normalização de Documentos
```sql
-- Inserir cliente com documento formatado
INSERT INTO clients (tenant_id, name, document)
VALUES ('tenant-uuid', 'Teste', '12.345.678/0001-00');

-- Verificar normalização
SELECT document, document_norm FROM clients WHERE name = 'Teste';
-- document: "12.345.678/0001-00"
-- document_norm: "12345678000100"

-- Tentar duplicar (deve falhar)
INSERT INTO clients (tenant_id, name, document)
VALUES ('tenant-uuid', 'Teste 2', '12345678000100');
-- ERROR: duplicate key value violates unique constraint
```

### 2. KPIs
```sql
-- Ver stats
SELECT * FROM client_stats_by_tenant WHERE tenant_id = 'tenant-uuid';

-- Refresh manual
SELECT refresh_client_stats();
```

### 3. Rate Limiting
```typescript
// Fazer 6 buscas rápidas (deve falhar na 6ª)
for (let i = 0; i < 6; i++) {
  await searchClients('teste')
}
// Error: Rate limit excedido. Tente novamente em X segundos.
```

### 4. Busca
```typescript
const results = await searchClients('João')
console.log(results)
// Ordenado por similaridade
```

### 5. CEP
```typescript
const address = await fetchAddressByCEP('01310-100')
console.log(address.data?.fullAddress)
// "Avenida Paulista, São Paulo, SP"
```

---

## 📊 Métricas de Performance Esperadas

| Operação | Antes | Depois | Melhoria |
|----------|-------|--------|----------|
| KPIs (COUNT) | ~500ms | ~50ms | **10x** |
| Busca (10k clientes) | ~800ms | ~200ms | **4x** |
| Paginação (100k clientes) | Timeout | ~150ms | **∞** |
| Duplicação de documento | Permitida | Bloqueada | **100%** |

---

## 🚀 Próximos Passos

Agora que os "parafusos" estão apertados, você pode:

1. ✅ Executar o plano de clientes (`plano-clientes.md`)
2. ✅ Implementar UI com confiança
3. ✅ Escalar sem preocupações de performance
4. ✅ Garantir integridade de dados

---

## 📚 Referências

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Materialized Views](https://www.postgresql.org/docs/current/sql-creatematerializedview.html)
- [pg_trgm Extension](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Cursor-Based Pagination](https://www.sitepoint.com/paginating-real-time-data-cursor-based-pagination/)

