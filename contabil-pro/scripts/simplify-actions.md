# Script de Simplificação - Remover Multi-Tenant

## Mudanças Necessárias em Todos os Arquivos de Actions

### 1. Remover imports de setRLSContext
```typescript
// ANTES:
import { requireAuth, setRLSContext } from '@/lib/auth';

// DEPOIS:
import { requireAuth } from '@/lib/auth';
```

### 2. Substituir setRLSContext por createServerClient
```typescript
// ANTES:
const session = await requireAuth();
const supabase = await setRLSContext(session);

// DEPOIS:
await requireAuth(); // Apenas verificar autenticação
const supabase = await createServerClient();
```

### 3. Remover filtros .eq('tenant_id', session.tenant_id)
```typescript
// ANTES:
.eq('tenant_id', session.tenant_id)

// DEPOIS:
// Remover completamente - RLS simplificado filtra automaticamente
```

### 4. Remover parâmetros p_tenant_id de RPCs
```typescript
// ANTES:
await supabase.rpc('generate_document_path', {
  p_tenant_id: session.tenant_id,
  p_type: type,
  p_filename: filename,
})

// DEPOIS:
await supabase.rpc('generate_document_path', {
  p_type: type,
  p_filename: filename,
})
```

### 5. Remover tenant_id de inserts
```typescript
// ANTES:
.insert({
  tenant_id: session.tenant_id,
  name: 'test',
  ...
})

// DEPOIS:
.insert({
  name: 'test',
  ...
})
```

## Arquivos a Modificar

- [x] src/actions/documents.ts (em andamento)
- [ ] src/actions/clients.ts
- [ ] src/actions/clients-simple.ts
- [ ] src/actions/entries.ts
- [ ] src/actions/tasks.ts
- [ ] src/actions/proposals.ts
- [ ] src/lib/auth.ts (simplificar verifySession)

