# 🚀 Proposta de Melhorias - Timeline e Notificações

**Data:** 03/10/2025  
**Objetivo:** Implementar filtros de data na timeline e sistema de notificações push  
**Prioridade:** Alta (solicitação explícita do usuário)

---

## 📋 Índice

1. [Filtros de Data na Timeline](#1-filtros-de-data-na-timeline)
2. [Sistema de Notificações Push](#2-sistema-de-notificações-push)
3. [Melhorias Adicionais](#3-melhorias-adicionais)
4. [Cronograma de Implementação](#4-cronograma-de-implementação)

---

## 1. Filtros de Data na Timeline

### 1.1 Requisito

> "Visualização em timeline expandida, com filtros por data, tipo de evento (ex: 'pagamento recebido', 'declaração enviada')"

### 1.2 Análise Técnica

**✅ Backend já suporta:**
```typescript
export interface TimelineFilters {
  client_id: string;
  event_type?: TimelineEventType | TimelineEventType[];
  from_date?: string;  // ✅ Já existe
  to_date?: string;    // ✅ Já existe
  page?: number;
  pageSize?: number;
}
```

**❌ Frontend não implementa:**
- Não há componente de seleção de data
- Hook `useClientTimeline` não recebe datas
- UI não mostra filtros de período

### 1.3 Proposta de Implementação

#### **Passo 1: Criar Componente de Filtro de Data**

```typescript
// contabil-pro/src/components/timeline/timeline-filters.tsx
'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'

interface TimelineFiltersProps {
  onDateRangeChange: (range: DateRange | undefined) => void
  onPresetSelect: (preset: string) => void
}

const PRESETS = [
  { label: 'Hoje', value: 'today' },
  { label: 'Últimos 7 dias', value: '7d' },
  { label: 'Últimos 30 dias', value: '30d' },
  { label: 'Este mês', value: 'month' },
  { label: 'Últimos 3 meses', value: '3m' },
  { label: 'Este ano', value: 'year' },
]

export function TimelineFilters({ onDateRangeChange, onPresetSelect }: TimelineFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isOpen, setIsOpen] = useState(false)

  const handlePresetClick = (preset: string) => {
    onPresetSelect(preset)
    setIsOpen(false)
  }

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    onDateRangeChange(range)
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return 'Selecionar período'
    if (!dateRange.to) return format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
    return `${format(dateRange.from, 'dd/MM', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Presets Rápidos */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.value}
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Seletor de Data Customizado */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="range"
            selected={dateRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      {/* Botão Limpar */}
      {dateRange?.from && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDateRange(undefined)
            onDateRangeChange(undefined)
          }}
        >
          Limpar
        </Button>
      )}
    </div>
  )
}
```

#### **Passo 2: Atualizar Hook useClientTimeline**

```typescript
// contabil-pro/src/hooks/use-timeline.ts
interface UseClientTimelineOptions {
  category?: TimelineCategory;
  limit?: number;
  fromDate?: string;  // ✅ Adicionar
  toDate?: string;    // ✅ Adicionar
}

export function useClientTimeline(
  clientId: string,
  options: UseClientTimelineOptions = {}
) {
  const { category, limit = 20, fromDate, toDate } = options;

  const filters: TimelineFilters = {
    client_id: clientId,
    event_type: getEventTypes(category),
    from_date: fromDate,  // ✅ Passar para backend
    to_date: toDate,      // ✅ Passar para backend
    pageSize: limit,
  };

  // ... resto do código
}
```

#### **Passo 3: Integrar no ClientTimelineSection**

```typescript
// contabil-pro/src/components/timeline/client-timeline-section.tsx
import { TimelineFilters } from './timeline-filters'
import { subDays, startOfMonth, startOfYear } from 'date-fns'

export function ClientTimelineSection({ clientId }: ClientTimelineSectionProps) {
  const [activeCategory, setActiveCategory] = useState<TimelineCategory | "all">("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>()

  const {
    events,
    isLoading,
    error,
    hasMore,
    loadMore,
    isLoadingMore
  } = useClientTimeline(clientId, {
    category: activeCategory === "all" ? undefined : activeCategory,
    fromDate: dateRange?.from?.toISOString(),
    toDate: dateRange?.to?.toISOString(),
    limit: visibleCount
  })

  const handlePresetSelect = (preset: string) => {
    const now = new Date()
    let from: Date
    let to: Date = now

    switch (preset) {
      case 'today':
        from = new Date(now.setHours(0, 0, 0, 0))
        break
      case '7d':
        from = subDays(now, 7)
        break
      case '30d':
        from = subDays(now, 30)
        break
      case 'month':
        from = startOfMonth(now)
        break
      case '3m':
        from = subDays(now, 90)
        break
      case 'year':
        from = startOfYear(now)
        break
      default:
        from = subDays(now, 30)
    }

    setDateRange({ from, to })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Timeline do Cliente</h2>
        <p className="text-muted-foreground">
          Histórico completo de atividades e eventos
        </p>
      </div>

      {/* ✅ ADICIONAR FILTROS DE DATA */}
      <TimelineFilters
        onDateRangeChange={setDateRange}
        onPresetSelect={handlePresetSelect}
      />

      <Tabs value={activeCategory} onValueChange={(v) => handleCategoryChange(v as TimelineCategory | "all")}>
        {/* ... resto do código */}
      </Tabs>
    </div>
  )
}
```

### 1.4 Validação Backend

**Verificar se a query Supabase suporta filtros de data:**

```typescript
// contabil-pro/src/actions/timeline.ts
export async function getClientTimeline(filters: TimelineFilters) {
  const supabase = await createServerClient()
  
  let query = supabase
    .from('timeline_events')
    .select('*')
    .eq('client_id', filters.client_id)
  
  // ✅ Adicionar filtros de data
  if (filters.from_date) {
    query = query.gte('created_at', filters.from_date)
  }
  
  if (filters.to_date) {
    query = query.lte('created_at', filters.to_date)
  }
  
  // ... resto da query
}
```

### 1.5 Testes Necessários

- [ ] Filtro "Hoje" retorna apenas eventos de hoje
- [ ] Filtro "Últimos 7 dias" funciona corretamente
- [ ] Range customizado funciona
- [ ] Limpar filtros restaura todos os eventos
- [ ] Filtros de data + categoria funcionam juntos
- [ ] Performance com muitos eventos

---

## 2. Sistema de Notificações Push

### 2.1 Requisito

> "notificações push para lembretes"

### 2.2 Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DE NOTIFICAÇÕES              │
└─────────────────────────────────────────────────────────────┘

1. TRIGGERS (Supabase)
   ├─ task_due_soon (24h antes)
   ├─ document_pending_review
   ├─ tax_obligation_due
   └─ bank_reconciliation_available

2. TABELA notifications
   ├─ id, user_id, client_id
   ├─ type, title, message
   ├─ read, clicked
   ├─ created_at, expires_at
   └─ metadata (JSON)

3. EDGE FUNCTION (Supabase)
   ├─ send-push-notification
   ├─ Usa Web Push API
   └─ Envia para service worker

4. SERVICE WORKER (Frontend)
   ├─ sw.js registrado
   ├─ Recebe notificações
   ├─ Mostra no sistema
   └─ Lida com cliques

5. UI COMPONENTS
   ├─ NotificationBell (header)
   ├─ NotificationList (dropdown)
   ├─ NotificationSettings (config)
   └─ PermissionPrompt (onboarding)
```

### 2.3 Implementação Passo a Passo

#### **Fase 1: Infraestrutura (Semana 1)**

**1.1 Criar Tabela de Notificações**

```sql
-- contabil-pro/infra/migrations/XXX_create_notifications.sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN (
    'task_due_soon',
    'task_overdue',
    'document_pending',
    'tax_obligation_due',
    'bank_reconciliation',
    'client_inactive'
  )),
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  
  read BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) 
    REFERENCES tenants(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read) WHERE read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());
```

**1.2 Criar Triggers Automáticos**

```sql
-- Trigger: Tarefa vencendo em 24h
CREATE OR REPLACE FUNCTION notify_task_due_soon()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.due_date IS NOT NULL 
     AND NEW.status != 'completed'
     AND NEW.due_date - INTERVAL '24 hours' <= NOW()
     AND NEW.due_date > NOW()
  THEN
    INSERT INTO notifications (
      tenant_id, user_id, client_id, type, title, message, metadata
    )
    SELECT 
      NEW.tenant_id,
      NEW.assigned_to,
      NEW.client_id,
      'task_due_soon',
      'Tarefa vencendo em breve',
      'A tarefa "' || NEW.title || '" vence em menos de 24 horas',
      jsonb_build_object('task_id', NEW.id, 'due_date', NEW.due_date)
    WHERE NEW.assigned_to IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_task_due_soon
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_due_soon();
```

#### **Fase 2: Backend (Semana 2)**

**2.1 Edge Function para Enviar Push**

```typescript
// contabil-pro/supabase/functions/send-push-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PushPayload {
  notification_id: string
  user_id: string
  title: string
  message: string
  url?: string
}

serve(async (req) => {
  try {
    const { notification_id, user_id, title, message, url }: PushPayload = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Buscar subscription do usuário
    const { data: subscription } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .single()
    
    if (!subscription) {
      return new Response(JSON.stringify({ error: 'No subscription found' }), {
        status: 404,
      })
    }
    
    // Enviar notificação via Web Push
    const webpush = await import('https://esm.sh/web-push@3.6.6')
    
    await webpush.sendNotification(
      subscription.subscription_data,
      JSON.stringify({
        title,
        body: message,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: {
          url: url || '/dashboard',
          notification_id,
        },
      })
    )
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
})
```

#### **Fase 3: Frontend (Semana 3)**

**3.1 Service Worker**

```typescript
// contabil-pro/public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json()
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    data: data.data,
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' },
    ],
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/dashboard'
    event.waitUntil(
      clients.openWindow(url)
    )
  }
})
```

**3.2 Componente NotificationBell**

```typescript
// contabil-pro/src/components/notifications/notification-bell.tsx
'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationList } from './notification-list'

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <NotificationList
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}
```

### 2.4 Tipos de Notificações Sugeridas

| Tipo | Trigger | Prioridade | Exemplo |
|------|---------|------------|---------|
| **Tarefa Vencendo** | 24h antes | 🔴 Alta | "Tarefa 'Revisar DAS' vence amanhã" |
| **Tarefa Atrasada** | Após vencimento | 🔴 Alta | "Tarefa 'Conciliar extrato' está atrasada" |
| **Documento Pendente** | Upload sem revisão | 🟡 Média | "12 documentos aguardando revisão" |
| **Obrigação Fiscal** | 7 dias antes | 🔴 Alta | "DAS vence em 7 dias - R$ 1.250,00" |
| **Conciliação Disponível** | Novo extrato | 🟡 Média | "Novo extrato bancário disponível" |
| **Cliente Inativo** | 30 dias sem atividade | 🟢 Baixa | "Cliente ABC sem atividade há 30 dias" |

---

## 3. Melhorias Adicionais

### 3.1 Busca Textual na Timeline

```typescript
// Adicionar campo de busca
<Input
  placeholder="Buscar eventos..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="max-w-sm"
/>

// Filtrar eventos localmente
const filteredEvents = events.filter(event =>
  event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  event.description?.toLowerCase().includes(searchTerm.toLowerCase())
)
```

### 3.2 Exportação de Timeline

```typescript
// Botão de exportar
<Button variant="outline" onClick={handleExport}>
  <Download className="mr-2 h-4 w-4" />
  Exportar PDF
</Button>

// Função de exportação
const handleExport = async () => {
  const pdf = await generateTimelinePDF(events, client)
  pdf.download(`timeline-${client.name}.pdf`)
}
```

---

## 4. Cronograma de Implementação

### Sprint 1 (Semana 1-2): Filtros de Data
- [ ] Dia 1-2: Criar componente TimelineFilters
- [ ] Dia 3: Atualizar hook useClientTimeline
- [ ] Dia 4: Integrar no ClientTimelineSection
- [ ] Dia 5: Validar backend e queries
- [ ] Dia 6-7: Testes e ajustes
- [ ] Dia 8: Deploy e monitoramento

**Entregável:** Timeline com filtros de data funcionais

### Sprint 2 (Semana 3-4): Infraestrutura de Notificações
- [ ] Dia 1-2: Criar tabela notifications
- [ ] Dia 3-4: Implementar triggers automáticos
- [ ] Dia 5-6: Criar Edge Function
- [ ] Dia 7-8: Testes de integração

**Entregável:** Backend de notificações pronto

### Sprint 3 (Semana 5-6): Frontend de Notificações
- [ ] Dia 1-2: Implementar Service Worker
- [ ] Dia 3-4: Criar componentes UI
- [ ] Dia 5-6: Integrar com backend
- [ ] Dia 7-8: Testes e refinamentos

**Entregável:** Sistema de notificações completo

### Sprint 4 (Semana 7): Polimento e Lançamento
- [ ] Dia 1-2: Testes end-to-end
- [ ] Dia 3: Documentação
- [ ] Dia 4: Treinamento da equipe
- [ ] Dia 5: Deploy gradual (beta)
- [ ] Dia 6-7: Monitoramento e ajustes

**Entregável:** Features em produção

---

## 📊 Estimativa de Esforço

| Feature | Complexidade | Tempo | Prioridade |
|---------|--------------|-------|------------|
| Filtros de Data | Baixa | 2-3 dias | 🔴 Alta |
| Busca Textual | Baixa | 1 dia | 🟡 Média |
| Exportação PDF | Média | 2 dias | 🟢 Baixa |
| Notificações Backend | Alta | 1 semana | 🔴 Alta |
| Notificações Frontend | Alta | 1 semana | 🔴 Alta |
| Service Worker | Média | 3 dias | 🔴 Alta |

**Total Estimado:** 4-6 semanas para implementação completa

---

## ✅ Critérios de Aceitação

### Filtros de Data
- [ ] Usuário pode selecionar período customizado
- [ ] Presets (hoje, 7d, 30d, etc.) funcionam
- [ ] Filtros persistem ao trocar de aba
- [ ] Performance adequada com muitos eventos
- [ ] Feedback visual claro do filtro ativo

### Notificações Push
- [ ] Usuário recebe notificação no navegador
- [ ] Clicar na notificação abre a página correta
- [ ] Badge de contador atualiza em tempo real
- [ ] Usuário pode marcar como lida
- [ ] Usuário pode desativar notificações
- [ ] Funciona em Chrome, Firefox, Edge

---

**Próximo Passo:** Aprovação para iniciar implementação dos filtros de data (Sprint 1)

