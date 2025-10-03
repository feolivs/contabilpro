# 🔔 FASE 3: Notificações Push - PLANO DE EXECUÇÃO

**Data de Início:** 03/10/2025  
**Prazo Estimado:** 2 semanas  
**Prioridade:** ⭐⭐⭐⭐⭐ CRÍTICA

---

## 🎯 OBJETIVO

Implementar sistema completo de notificações push para alertar contadores sobre prazos fiscais, evitando multas e atrasos.

---

## 📋 ESCOPO

### Notificações Automáticas:
1. **7 dias antes** do vencimento
2. **3 dias antes** do vencimento
3. **No dia** do vencimento
4. **Obrigações atrasadas** (diariamente)

### Tipos de Notificações:
- 🔔 **Push Notifications** (Web Push API)
- 📧 **Email** (opcional - Fase 4)
- 📱 **SMS** (opcional - Fase 4)

---

## 🏗️ ARQUITETURA

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│ NotificationBell → NotificationList → NotificationItem  │
│         ↓                                                │
│ Service Worker (sw.js) ← Web Push API                   │
└─────────────────────────────────────────────────────────┘
                           ↑
                           │
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Supabase + Edge Functions)         │
├─────────────────────────────────────────────────────────┤
│ Tabela: notifications                                    │
│ Tabela: notification_subscriptions                       │
│ Trigger: check_tax_obligations_due()                     │
│ Edge Function: send-push-notification                    │
│ Cron Job: check-obligations (diário às 8h)              │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 ESTRUTURA DE DADOS

### Tabela `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'tax_obligation_due', 'task_reminder', etc
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Dados adicionais (tax_obligation_id, etc)
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_read (read),
  INDEX idx_notifications_created_at (created_at)
);
```

### Tabela `notification_subscriptions`
```sql
CREATE TABLE notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_notification_subscriptions_user_id (user_id)
);
```

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### **ETAPA 1: Database & Migrations** (2 horas)

**Arquivos:**
- `infra/migrations/029_create_notifications.sql`
- `infra/migrations/030_create_notification_subscriptions.sql`
- `infra/migrations/031_create_notification_triggers.sql`

**Tarefas:**
1. ✅ Criar tabela `notifications`
2. ✅ Criar tabela `notification_subscriptions`
3. ✅ Criar função `check_tax_obligations_due()`
4. ✅ Criar trigger para gerar notificações automaticamente
5. ✅ Habilitar RLS por `user_id`
6. ✅ Aplicar migrations no Supabase

---

### **ETAPA 2: Types & Actions** (3 horas)

**Arquivos:**
- `src/types/notifications.ts` (100 linhas)
- `src/actions/notifications.ts` (250 linhas)

**Types:**
```typescript
export type NotificationType = 
  | 'tax_obligation_due_7d'
  | 'tax_obligation_due_3d'
  | 'tax_obligation_due_today'
  | 'tax_obligation_overdue'
  | 'task_reminder'
  | 'document_uploaded'
  | 'client_message'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  read_at?: string
  created_at: string
}

export interface NotificationSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent?: string
  created_at: string
  last_used_at: string
}
```

**Actions:**
1. `getNotifications(filters)` - Listar notificações
2. `getUnreadCount()` - Contador de não lidas
3. `markAsRead(id)` - Marcar como lida
4. `markAllAsRead()` - Marcar todas como lidas
5. `deleteNotification(id)` - Deletar notificação
6. `subscribeToNotifications(subscription)` - Registrar subscription
7. `unsubscribeFromNotifications(endpoint)` - Remover subscription

---

### **ETAPA 3: Service Worker** (4 horas)

**Arquivos:**
- `public/sw.js` (150 linhas)
- `src/lib/push-notifications.ts` (200 linhas)

**Recursos:**
1. Registrar Service Worker
2. Solicitar permissão de notificações
3. Gerar VAPID keys
4. Subscribe/Unsubscribe
5. Receber e exibir notificações
6. Click handler (redirecionar para página relevante)

---

### **ETAPA 4: UI Components** (5 horas)

**Arquivos:**
- `src/components/notifications/notification-bell.tsx` (120 linhas)
- `src/components/notifications/notification-list.tsx` (150 linhas)
- `src/components/notifications/notification-item.tsx` (100 linhas)
- `src/components/notifications/notification-settings.tsx` (80 linhas)

**NotificationBell:**
- Ícone de sino no header
- Badge com contador de não lidas
- Dropdown com lista de notificações
- Botão "Marcar todas como lidas"
- Link para "Ver todas"

**NotificationList:**
- Lista paginada de notificações
- Filtros (todas, não lidas, lidas)
- Ordenação por data
- Empty state

**NotificationItem:**
- Título e mensagem
- Data relativa ("há 2 horas")
- Ícone por tipo
- Botão "Marcar como lida"
- Botão "Deletar"
- Click para navegar

**NotificationSettings:**
- Toggle para habilitar/desabilitar push
- Configurar tipos de notificações
- Testar notificação

---

### **ETAPA 5: Edge Function** (4 horas)

**Arquivos:**
- `supabase/functions/send-push-notification/index.ts` (200 linhas)
- `supabase/functions/check-obligations/index.ts` (150 linhas)

**send-push-notification:**
- Receber payload (user_id, title, message, data)
- Buscar subscriptions do usuário
- Enviar push notification via Web Push API
- Registrar notificação no banco
- Tratar erros (subscription inválida, etc)

**check-obligations:**
- Executar diariamente às 8h (cron)
- Buscar obrigações vencendo em 7d, 3d, hoje
- Buscar obrigações atrasadas
- Gerar notificações
- Chamar send-push-notification

---

### **ETAPA 6: Integração & Testes** (4 horas)

**Tarefas:**
1. Integrar NotificationBell no layout principal
2. Criar página `/notificacoes`
3. Adicionar NotificationSettings em `/config`
4. Testar fluxo completo:
   - Solicitar permissão
   - Receber notificação
   - Marcar como lida
   - Deletar notificação
5. Testar cron job
6. Testar em diferentes browsers
7. Capturar screenshots
8. Documentar

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Meta |
|---------|------|
| **Tempo de Resposta** | < 500ms |
| **Taxa de Entrega** | > 95% |
| **Taxa de Click** | > 30% |
| **Permissões Concedidas** | > 60% |

---

## 🧪 CENÁRIOS DE TESTE

### Teste 1: Notificação 7 dias antes
```gherkin
Given uma obrigação fiscal vencendo em 7 dias
When o cron job executar
Then uma notificação deve ser criada
And um push deve ser enviado
And o contador de não lidas deve aumentar
```

### Teste 2: Notificação no dia
```gherkin
Given uma obrigação fiscal vencendo hoje
When o cron job executar
Then uma notificação URGENTE deve ser criada
And um push deve ser enviado com prioridade alta
```

### Teste 3: Marcar como lida
```gherkin
Given uma notificação não lida
When o usuário clicar em "Marcar como lida"
Then a notificação deve ser marcada como lida
And o contador deve diminuir
```

---

## 🔐 SEGURANÇA

1. **VAPID Keys:** Armazenar em variáveis de ambiente
2. **RLS:** Políticas por `user_id`
3. **Rate Limiting:** Máximo 100 notificações/dia por usuário
4. **Validação:** Validar subscriptions antes de enviar
5. **HTTPS:** Obrigatório para Web Push API

---

## 📝 VARIÁVEIS DE AMBIENTE

```env
# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:contato@contabilpro.com

# Supabase Edge Functions
SUPABASE_FUNCTION_URL=https://...
SUPABASE_ANON_KEY=...
```

---

## 🚀 PRÓXIMOS PASSOS (PÓS-FASE 3)

### Fase 4: Melhorias Adicionais
- Email notifications
- SMS notifications
- Notificações agrupadas
- Notificações personalizadas
- Analytics de notificações

---

## 💡 OBSERVAÇÕES

1. **Web Push API:** Funciona apenas em HTTPS (exceto localhost)
2. **Service Worker:** Deve estar em `/public/sw.js`
3. **VAPID Keys:** Gerar com `web-push generate-vapid-keys`
4. **Browser Support:** Chrome, Firefox, Edge, Safari 16+
5. **Permissões:** Usuário deve conceder explicitamente

---

**Desenvolvido com ❤️ por Augment Agent**  
**Data:** 03/10/2025

