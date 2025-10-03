# Edge Function: check-obligations

Cron job que verifica obrigações fiscais vencendo e envia notificações push automaticamente.

## 📋 Funcionalidade

Esta função é executada **diariamente às 8h BRT (11h UTC)** e:

1. ✅ Chama a função SQL `check_tax_obligations_due()` que:
   - Verifica obrigações fiscais vencendo nos próximos 7 dias
   - Cria notificações automaticamente via trigger
   
2. ✅ Busca notificações criadas nas últimas 24 horas

3. ✅ Envia push notification para cada notificação via `send-push-notification`

4. ✅ Registra logs e métricas de execução

## 🔧 Configuração

### 1. Deploy da Função

```bash
npx supabase functions deploy check-obligations
```

### 2. Configurar Secrets

```bash
npx supabase secrets set SUPABASE_URL="https://selnwgpyjctpjzdrfrey.supabase.co"
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
npx supabase secrets set SUPABASE_ANON_KEY="eyJhbGc..."
```

### 3. Configurar Cron Job

Execute este SQL no Supabase Dashboard (SQL Editor):

```sql
-- Habilitar extensão pg_cron (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Criar cron job para executar diariamente às 8h BRT (11h UTC)
SELECT cron.schedule(
  'check-obligations-daily',
  '0 11 * * *', -- 11h UTC = 8h BRT
  $$
    SELECT net.http_post(
      url := 'https://selnwgpyjctpjzdrfrey.supabase.co/functions/v1/check-obligations',
      headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbG53Z3B5amN0cGp6ZHJmcmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDE5NzEsImV4cCI6MjA2NDcxNzk3MX0.x2GdGtvLbslKMBE2u3EWuwMijDg0_CAxp6McwjUei6k"}'::jsonb
    );
  $$
);
```

### 4. Verificar Cron Job

```sql
-- Listar cron jobs
SELECT * FROM cron.job;

-- Ver histórico de execuções
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-obligations-daily')
ORDER BY start_time DESC 
LIMIT 10;
```

### 5. Remover Cron Job (se necessário)

```sql
SELECT cron.unschedule('check-obligations-daily');
```

## 🧪 Testes

### Teste Manual

```bash
# Chamar a função diretamente
curl -X POST \
  https://selnwgpyjctpjzdrfrey.supabase.co/functions/v1/check-obligations \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### Resposta Esperada

```json
{
  "success": true,
  "notifications_found": 3,
  "notifications_sent": 3,
  "notifications_failed": 0,
  "duration_ms": 1234
}
```

## 📊 Logs

Os logs podem ser visualizados em:
- **Supabase Dashboard** → Functions → check-obligations → Logs
- **Real-time**: `npx supabase functions logs check-obligations --tail`

Exemplo de logs:

```
🚀 [check-obligations] Starting cron job...
📋 [Check] Calling check_tax_obligations_due()...
✅ [Check] Function executed successfully
🔍 [Notifications] Fetching since 2025-10-02T11:00:00.000Z...
✅ [Notifications] Found 3 notifications
📤 [Push] Sending 3 notification(s)...
📤 [Push] Sending for notification abc-123...
✅ [Push] Sent for abc-123: { sent_count: 1, failed_count: 0 }
✅ [Complete] Sent: 3, Failed: 0, Duration: 1234ms
```

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    CRON JOB (8h BRT)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  1. check_tax_obligations_due()                             │
│     - Verifica obrigações vencendo em 7 dias                │
│     - Trigger cria notificações automaticamente             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Buscar notificações das últimas 24h                     │
│     SELECT * FROM notifications WHERE created_at >= NOW()-1d│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Para cada notificação:                                  │
│     POST /functions/v1/send-push-notification               │
│     - Busca subscriptions do usuário                        │
│     - Envia push via Web Push API                           │
│     - Remove subscriptions expiradas                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Retornar métricas                                       │
│     { sent: 3, failed: 0, duration_ms: 1234 }              │
└─────────────────────────────────────────────────────────────┘
```

## ⚠️ Troubleshooting

### Cron não está executando

1. Verificar se `pg_cron` está habilitado:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Verificar se o job está ativo:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'check-obligations-daily';
   ```

3. Ver erros de execução:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE status = 'failed' 
   ORDER BY start_time DESC;
   ```

### Notificações não estão sendo enviadas

1. Verificar se a função SQL está criando notificações:
   ```sql
   SELECT * FROM notifications 
   WHERE created_at >= NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

2. Verificar logs da função `send-push-notification`

3. Verificar se há subscriptions ativas:
   ```sql
   SELECT * FROM notification_subscriptions 
   WHERE user_id = 'user-id-here';
   ```

## 📚 Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

**Desenvolvido com ❤️ por ContabilPRO**  
**Data:** 03/10/2025

