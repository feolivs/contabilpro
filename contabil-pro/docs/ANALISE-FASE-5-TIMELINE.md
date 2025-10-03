# 📊 Análise Completa - FASE 5: Timeline do Cliente

**Data:** 02/10/2025  
**Escopo:** Implementação da Timeline de Atividades do Cliente  
**Status:** 📋 Planejamento (Não Executado)

---

## 📋 ÍNDICE

1. [Resumo Executivo](#resumo-executivo)
2. [O Que Já Está Pronto](#o-que-já-está-pronto)
3. [O Que Precisa Ser Implementado](#o-que-precisa-ser-implementado)
4. [Estrutura dos Componentes](#estrutura-dos-componentes)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Integração na Página](#integração-na-página)
7. [Estimativas](#estimativas)
8. [Desafios e Considerações](#desafios-e-considerações)
9. [Checklist de Implementação](#checklist-de-implementação)

---

## 🎯 RESUMO EXECUTIVO

### Objetivo

Implementar uma **timeline visual e interativa** que exibe o histórico cronológico de todas as atividades relacionadas a um cliente específico, incluindo:

- 📄 Documentos (upload/delete)
- 📋 Tarefas (criação/início/conclusão/cancelamento/atualização)
- 💰 Lançamentos (criação/atualização)
- 👤 Atualizações do cliente
- 📝 Notas adicionadas

### Status Atual

**Infraestrutura:** ✅ 100% Completa  
**Backend:** ✅ 100% Completo  
**Frontend:** ❌ 0% (Não iniciado)

### Escopo da FASE 5

**Componentes a Criar:**
1. `TimelineEvent` - Componente individual de evento (~120 linhas)
2. `ClientTimelineSection` - Seção principal com filtros (~250 linhas)

**Arquivos a Modificar:**
1. `src/app/(app)/clientes/[id]/page.tsx` - Adicionar seção de timeline

**Total Estimado:** ~370 linhas de código | 2-3 horas

---

## ✅ O QUE JÁ ESTÁ PRONTO

### 1. Infraestrutura de Banco de Dados

**Migration:** `024_create_client_timeline.sql`

```sql
CREATE TABLE client_timeline (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  document_id UUID,
  task_id UUID,
  entry_id UUID,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Índices:**
- `idx_client_timeline_client_id` - Performance em queries por cliente
- `idx_client_timeline_event_type` - Filtros por tipo
- `idx_client_timeline_created_at` - Ordenação cronológica
- `idx_client_timeline_tenant_id` - RLS

**RLS Policies:**
- SELECT: Filtrado por `tenant_id`
- INSERT: Filtrado por `tenant_id`

---

### 2. Triggers Automáticos

**Migration:** `025_create_timeline_triggers.sql`

**Triggers Implementados:**

1. **`log_document_timeline()`**
   - Dispara em: INSERT/DELETE em `documents`
   - Eventos: `document_uploaded`, `document_deleted`

2. **`log_task_timeline()`**
   - Dispara em: INSERT/UPDATE em `tasks`
   - Eventos: `task_created`, `task_started`, `task_completed`, `task_cancelled`, `task_updated`
   - Lógica: Detecta mudanças de status automaticamente

3. **`log_entry_timeline()`**
   - Dispara em: INSERT/UPDATE em `entries`
   - Eventos: `entry_created`, `entry_updated`

**Benefício:** Eventos são registrados automaticamente sem necessidade de código manual!

---

### 3. Types TypeScript

**Arquivo:** `src/types/timeline.ts` (172 linhas)

**Tipos Principais:**

```typescript
export type TimelineEventType =
  | 'document_uploaded'
  | 'document_deleted'
  | 'task_created'
  | 'task_started'
  | 'task_completed'
  | 'task_cancelled'
  | 'task_updated'
  | 'entry_created'
  | 'entry_updated'
  | 'client_updated'
  | 'note_added';

export interface TimelineEvent {
  id: string;
  tenant_id: string;
  client_id: string;
  event_type: TimelineEventType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  document_id?: string;
  task_id?: string;
  entry_id?: string;
  user_id: string;
  created_at: string;
  
  // Relacionamentos
  user?: { id: string; name: string };
  client?: { id: string; name: string };
  document?: { id: string; name: string };
  task?: { id: string; title: string };
  entry?: { id: string; description?: string };
}
```

**Configuração de Eventos:**

```typescript
export const TIMELINE_EVENT_CONFIG: Record<TimelineEventType, TimelineEventConfig> = {
  document_uploaded: { icon: '📄', color: 'text-blue-600', label: 'Documento adicionado' },
  document_deleted: { icon: '🗑️', color: 'text-red-600', label: 'Documento removido' },
  task_created: { icon: '📋', color: 'text-green-600', label: 'Tarefa criada' },
  task_started: { icon: '▶️', color: 'text-yellow-600', label: 'Tarefa iniciada' },
  task_completed: { icon: '✅', color: 'text-green-600', label: 'Tarefa concluída' },
  task_cancelled: { icon: '❌', color: 'text-red-600', label: 'Tarefa cancelada' },
  task_updated: { icon: '✏️', color: 'text-orange-600', label: 'Tarefa atualizada' },
  entry_created: { icon: '💰', color: 'text-purple-600', label: 'Lançamento criado' },
  entry_updated: { icon: '✏️', color: 'text-orange-600', label: 'Lançamento atualizado' },
  client_updated: { icon: '👤', color: 'text-blue-600', label: 'Cliente atualizado' },
  note_added: { icon: '📝', color: 'text-gray-600', label: 'Nota adicionada' },
};
```

**Filtros de Categoria:**

```typescript
export const TIMELINE_CATEGORY_FILTERS = [
  { value: 'all', label: 'Todas', icon: '📊' },
  { value: 'documents', label: 'Documentos', icon: '📄', 
    types: ['document_uploaded', 'document_deleted'] },
  { value: 'tasks', label: 'Tarefas', icon: '📋', 
    types: ['task_created', 'task_started', 'task_completed', 'task_cancelled', 'task_updated'] },
  { value: 'entries', label: 'Lançamentos', icon: '💰', 
    types: ['entry_created', 'entry_updated'] },
  { value: 'other', label: 'Outros', icon: '📝', 
    types: ['client_updated', 'note_added'] },
];
```

---

### 4. Server Actions

**Arquivo:** `src/actions/timeline.ts` (169 linhas)

**Actions Implementadas:**

1. **`getClientTimeline(filters)`**
   - Busca eventos do cliente com paginação
   - Filtros: `event_type`, `from_date`, `to_date`, `page`, `pageSize`
   - Inclui relacionamentos (user, client, document, task, entry)
   - Ordenação: Mais recente primeiro
   - Retorna: `{ events: TimelineEvent[], total: number }`

2. **`logTimelineEvent(input)`** (Opcional)
   - Registra evento manual
   - Útil para eventos customizados
   - Exemplo: Notas adicionadas manualmente

---

### 5. React Query Hooks

**Arquivo:** `src/hooks/use-timeline.ts` (66 linhas)

**Hooks Implementados:**

1. **`useClientTimeline(filters)`**
   - Query para buscar eventos
   - Cache: 30 segundos
   - Enabled: Apenas se `client_id` estiver presente
   - Retorna: `{ data, isLoading, error }`

2. **`useLogTimelineEvent()`**
   - Mutation para registrar evento manual
   - Invalidação automática de cache
   - Toast notifications

---

## ❌ O QUE PRECISA SER IMPLEMENTADO

### Componentes UI (Frontend)

**1. TimelineEvent Component**
- Arquivo: `src/components/timeline/timeline-event.tsx`
- Linhas: ~120
- Tempo: 1 hora

**2. ClientTimelineSection Component**
- Arquivo: `src/components/clients/client-timeline-section.tsx`
- Linhas: ~250
- Tempo: 1.5-2 horas

**3. Integração na Página**
- Arquivo: `src/app/(app)/clientes/[id]/page.tsx`
- Modificação: Adicionar import e componente
- Tempo: 15 minutos

---

## 🎨 ESTRUTURA DOS COMPONENTES

### Componente 1: TimelineEvent

**Propósito:** Exibir um evento individual da timeline

**Props:**
```typescript
interface TimelineEventProps {
  event: TimelineEvent;
  showClient?: boolean; // Para uso em outras páginas
}
```

**Estrutura Visual:**
```
┌─────────────────────────────────────────┐
│ 📄 [Ícone] Documento adicionado         │
│ ├─ Título do evento                     │
│ ├─ Descrição (se houver)                │
│ ├─ 👤 Nome do usuário                   │
│ ├─ 🕐 há 2 horas                        │
│ └─ [Link para recurso] (se aplicável)  │
└─────────────────────────────────────────┘
```

**Features:**
- ✅ Ícone colorido por tipo (do `TIMELINE_EVENT_CONFIG`)
- ✅ Título e descrição
- ✅ Nome do usuário que executou a ação
- ✅ Timestamp relativo (ex: "há 2 horas", "ontem", "3 dias atrás")
- ✅ Link para recurso relacionado (documento, tarefa, lançamento)
- ✅ Hover effect
- ✅ Responsivo

**Dependências:**
- `date-fns` - Para formatação de datas
- `date-fns/locale/ptBR` - Localização PT-BR
- `lucide-react` - Ícones adicionais (opcional)
- `@/components/ui/card` - Card do shadcn/ui
- `@/types/timeline` - Types e configs

---

### Componente 2: ClientTimelineSection

**Propósito:** Seção principal de timeline na página do cliente

**Props:**
```typescript
interface ClientTimelineSectionProps {
  clientId: string;
}
```

**Estrutura Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Timeline de Atividades                               │
│ Histórico cronológico de todas as atividades           │
├─────────────────────────────────────────────────────────┤
│ [Todas] [Documentos] [Tarefas] [Lançamentos] [Outros] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📄 Documento adicionado - há 2 horas               │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ▶️ Tarefa iniciada - há 5 horas                    │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ✅ Tarefa concluída - ontem                        │ │
│ └─────────────────────────────────────────────────────┘ │
│ ...                                                     │
│ [Carregar mais] ou [Paginação]                         │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- ✅ Tabs por categoria (Todas, Documentos, Tarefas, Lançamentos, Outros)
- ✅ Badge com contador de eventos por categoria
- ✅ Lista de `TimelineEvent` components
- ✅ Paginação (botão "Carregar mais" ou números de página)
- ✅ Loading state (skeleton)
- ✅ Empty state por categoria
- ✅ Error handling
- ✅ Scroll suave
- ✅ Responsivo

**Estado Interno:**
```typescript
const [activeCategory, setActiveCategory] = useState<'all' | 'documents' | 'tasks' | 'entries' | 'other'>('all');
const [page, setPage] = useState(1);
```

**Hooks Utilizados:**
```typescript
const { data, isLoading, error } = useClientTimeline({
  client_id: clientId,
  event_type: getEventTypesForCategory(activeCategory),
  page,
  pageSize: 20,
});
```

---

## 🔄 FLUXO DE DADOS

### 1. Registro Automático de Eventos

```
[Ação do Usuário]
       ↓
[INSERT/UPDATE no banco]
       ↓
[Trigger dispara]
       ↓
[Função log_*_timeline()]
       ↓
[INSERT em client_timeline]
       ↓
[Evento registrado! ✅]
```

**Exemplo:** Usuário cria uma tarefa
1. `createTask()` insere em `tasks`
2. Trigger `task_timeline_trigger` dispara
3. Função `log_task_timeline()` detecta INSERT
4. Insere evento `task_created` em `client_timeline`
5. Timeline atualiza automaticamente (React Query)

---

### 2. Busca e Exibição de Eventos

```
[ClientTimelineSection]
       ↓
[useClientTimeline(filters)]
       ↓
[getClientTimeline() Server Action]
       ↓
[Query Supabase com filtros]
       ↓
[Retorna eventos + total]
       ↓
[React Query cache]
       ↓
[Renderiza TimelineEvents]
```

---

### 3. Filtros por Categoria

```
[Usuário clica em "Tarefas"]
       ↓
[setActiveCategory('tasks')]
       ↓
[getEventTypesForCategory('tasks')]
       ↓
[Retorna: ['task_created', 'task_started', ...]]
       ↓
[useClientTimeline com event_type filtrado]
       ↓
[Busca apenas eventos de tarefas]
       ↓
[Renderiza lista filtrada]
```

---

## 🔗 INTEGRAÇÃO NA PÁGINA

### Arquivo: `src/app/(app)/clientes/[id]/page.tsx`

**Modificações Necessárias:**

1. **Adicionar Import:**
```typescript
import { ClientTimelineSection } from '@/components/clients/client-timeline-section'
```

2. **Adicionar Componente:**
```typescript
{/* Timeline de Atividades */}
<ClientTimelineSection clientId={client.id} />
```

**Posição Sugerida:** Após `ClientTasksSection` e antes de `ClientDocumentsSection`

**Ordem Final:**
1. Header + Badges
2. Grid de Cards (Dados Básicos, Fiscais, etc.)
3. Observações
4. Atividade Recente (card existente - pode ser removido)
5. **ClientTasksSection** ✅
6. **ClientTimelineSection** ⬅️ NOVO
7. **ClientDocumentsSection** ✅

---

## ⏱️ ESTIMATIVAS

### Tempo de Implementação

| Componente | Linhas | Tempo | Complexidade |
|------------|--------|-------|--------------|
| TimelineEvent | ~120 | 1h | Baixa |
| ClientTimelineSection | ~250 | 1.5-2h | Média |
| Integração na página | ~5 | 15min | Baixa |
| Testes manuais | - | 30min | - |
| **TOTAL** | **~375** | **3-3.5h** | **Média** |

### Complexidade por Tarefa

**Baixa Complexidade:**
- ✅ TimelineEvent (componente simples de exibição)
- ✅ Integração na página (apenas import + render)

**Média Complexidade:**
- ⚠️ ClientTimelineSection (tabs, filtros, paginação, estados)

**Alta Complexidade:**
- ❌ Nenhuma (infraestrutura já pronta!)

---

## ⚠️ DESAFIOS E CONSIDERAÇÕES

### 1. Performance

**Desafio:** Timeline pode ter centenas de eventos

**Soluções:**
- ✅ Paginação (20 eventos por página)
- ✅ React Query cache (30s)
- ✅ Índices no banco (já criados)
- ✅ Lazy loading (carregar mais ao scroll)

---

### 2. Formatação de Datas

**Desafio:** Exibir timestamps de forma amigável

**Solução:**
```typescript
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const timeAgo = formatDistanceToNow(new Date(event.created_at), {
  addSuffix: true,
  locale: ptBR,
});
// Resultado: "há 2 horas", "há 3 dias", "há 1 mês"
```

---

### 3. Links para Recursos

**Desafio:** Criar links para documentos, tarefas, lançamentos

**Solução:**
```typescript
const getResourceLink = (event: TimelineEvent) => {
  if (event.document_id) return `/documentos/${event.document_id}`;
  if (event.task_id) return `/tarefas/${event.task_id}`;
  if (event.entry_id) return `/lancamentos/${event.entry_id}`;
  return null;
};
```

---

### 4. Empty States

**Desafio:** Mensagens específicas por categoria

**Solução:**
```typescript
const emptyMessages = {
  all: 'Nenhuma atividade registrada ainda',
  documents: 'Nenhum documento foi adicionado ou removido',
  tasks: 'Nenhuma tarefa foi criada ou atualizada',
  entries: 'Nenhum lançamento foi registrado',
  other: 'Nenhuma outra atividade registrada',
};
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Preparação
- [ ] Revisar types em `src/types/timeline.ts`
- [ ] Revisar hooks em `src/hooks/use-timeline.ts`
- [ ] Revisar actions em `src/actions/timeline.ts`
- [ ] Verificar se triggers estão ativos no Supabase

### Componente TimelineEvent
- [ ] Criar arquivo `src/components/timeline/timeline-event.tsx`
- [ ] Implementar estrutura básica do card
- [ ] Adicionar ícone e cor por tipo
- [ ] Formatar timestamp com `date-fns`
- [ ] Adicionar nome do usuário
- [ ] Implementar link para recurso (se aplicável)
- [ ] Adicionar hover effects
- [ ] Testar responsividade
- [ ] Adicionar aria-labels para acessibilidade

### Componente ClientTimelineSection
- [ ] Criar arquivo `src/components/clients/client-timeline-section.tsx`
- [ ] Implementar estrutura do Card
- [ ] Adicionar Tabs por categoria
- [ ] Implementar filtro por categoria
- [ ] Integrar `useClientTimeline` hook
- [ ] Renderizar lista de TimelineEvents
- [ ] Implementar paginação (botão "Carregar mais")
- [ ] Adicionar loading state (skeleton)
- [ ] Adicionar empty states por categoria
- [ ] Adicionar error handling
- [ ] Testar responsividade

### Integração
- [ ] Modificar `src/app/(app)/clientes/[id]/page.tsx`
- [ ] Adicionar import de ClientTimelineSection
- [ ] Renderizar componente após ClientTasksSection
- [ ] Passar `clientId` como prop
- [ ] Testar integração

### Testes
- [ ] Criar tarefa e verificar evento na timeline
- [ ] Iniciar tarefa e verificar evento
- [ ] Concluir tarefa e verificar evento
- [ ] Upload documento e verificar evento
- [ ] Deletar documento e verificar evento
- [ ] Testar filtros por categoria
- [ ] Testar paginação
- [ ] Testar links para recursos
- [ ] Testar empty states
- [ ] Testar loading states
- [ ] Testar error handling
- [ ] Testar responsividade (mobile/tablet/desktop)

### Documentação
- [ ] Criar `FASE-5-TIMELINE-COMPLETA.md`
- [ ] Documentar componentes criados
- [ ] Adicionar exemplos de uso
- [ ] Documentar possíveis melhorias futuras

### Commit
- [ ] Commit dos componentes
- [ ] Commit da documentação
- [ ] Push para repositório

---

## 🎯 PRÓXIMOS PASSOS

**Após FASE 5:**
- FASE 6: Polimento e Melhorias (opcional)
- Testes automatizados (E2E)
- Melhorias de performance
- Animações e transições

---

**Análise completa! Pronto para implementação quando solicitado. ✨**

