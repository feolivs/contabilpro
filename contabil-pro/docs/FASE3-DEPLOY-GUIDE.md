# 🚀 Guia de Deploy - Sistema de Notificações Push

Guia completo para fazer deploy do sistema de notificações push no Supabase.

## 📋 Pré-requisitos

- ✅ Supabase CLI instalado (`npx supabase`)
- ✅ Projeto Supabase criado (JoyceSoft: `selnwgpyjctpjzdrfrey`)
- ✅ VAPID keys geradas (já feito)
- ✅ Edge Functions implementadas

## 🔧 Passo 1: Configurar Secrets

Configure as variáveis de ambiente no Supabase:

```bash
# VAPID Keys (já geradas)
npx supabase secrets set VAPID_PUBLIC_KEY="BLRKoF2ITiRJJ9juURCY75YWhDuW9WEMjNng-bZxov7SP_8vGVdjDg9fI3vACyqbsYANQB0NCX7JSoAcnnHWxGM"

npx supabase secrets set VAPID_PRIVATE_KEY="o7hK_4LujfSfk4JbDuMG74yUO7SkGZKWpvjdDMbBDsc"

npx supabase secrets set VAPID_SUBJECT="mailto:contato@contabilpro.com"

# Supabase Credentials (auto-injetadas, mas necessárias para check-obligations)
npx supabase secrets set SUPABASE_URL="https://selnwgpyjctpjzdrfrey.supabase.co"

npx supabase secrets set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbG53Z3B5amN0cGp6ZHJmcmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDE5NzEsImV4cCI6MjA2NDcxNzk3MX0.x2GdGtvLbslKMBE2u3EWuwMijDg0_CAxp6McwjUei6k"
```

### Verificar Secrets

```bash
npx supabase secrets list
```

## 📦 Passo 2: Deploy das Edge Functions

### 2.1 Deploy send-push-notification

```bash
cd contabil-pro
npx supabase functions deploy send-push-notification
```

**Saída esperada:**
```
Deploying send-push-notification (project ref: selnwgpyjctpjzdrfrey)
✓ Deployed send-push-notification
```

### 2.2 Deploy check-obligations

```bash
npx supabase functions deploy check-obligations
```

**Saída esperada:**
```
Deploying check-obligations (project ref: selnwgpyjctpjzdrfrey)
✓ Deployed check-obligations
```

### 2.3 Verificar Deploy

```bash
npx supabase functions list
```

**Saída esperada:**
```
┌─────────────────────────┬─────────┬─────────────────────┐
│ NAME                    │ STATUS  │ UPDATED             │
├─────────────────────────┼─────────┼─────────────────────┤
│ send-push-notification  │ ACTIVE  │ 2025-10-03 15:30:00 │
│ check-obligations       │ ACTIVE  │ 2025-10-03 15:31:00 │
│ process-document        │ ACTIVE  │ 2025-09-15 10:00:00 │
└─────────────────────────┴─────────┴─────────────────────┘
```

## 🗄️ Passo 3: Configurar Database

### 3.1 Verificar Tabelas

Acesse **Supabase Dashboard** → **SQL Editor** e execute:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'notification_subscriptions');
```

**Resultado esperado:** 2 linhas

### 3.2 Verificar RLS Policies

```sql
-- Verificar policies de notifications
SELECT * FROM pg_policies WHERE tablename = 'notifications';

-- Verificar policies de notification_subscriptions
SELECT * FROM pg_policies WHERE tablename = 'notification_subscriptions';
```

### 3.3 Verificar Função SQL

```sql
-- Verificar se a função existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'check_tax_obligations_due';
```

## ⏰ Passo 4: Configurar Cron Job

### 4.1 Habilitar pg_cron

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
```

### 4.2 Criar Cron Job

```sql
-- Executar diariamente às 8h BRT (11h UTC)
SELECT cron.schedule(
  'check-obligations-daily',
  '0 11 * * *',
  $$
    SELECT net.http_post(
      url := 'https://selnwgpyjctpjzdrfrey.supabase.co/functions/v1/check-obligations',
      headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbG53Z3B5amN0cGp6ZHJmcmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDE5NzEsImV4cCI6MjA2NDcxNzk3MX0.x2GdGtvLbslKMBE2u3EWuwMijDg0_CAxp6McwjUei6k"}'::jsonb
    );
  $$
);
```

### 4.3 Verificar Cron Job

```sql
-- Listar cron jobs
SELECT * FROM cron.job;

-- Ver próxima execução
SELECT 
  jobname,
  schedule,
  active,
  nodename
FROM cron.job 
WHERE jobname = 'check-obligations-daily';
```

## 🧪 Passo 5: Testar em Produção

### 5.1 Teste Manual da Edge Function

```bash
curl -X POST \
  https://selnwgpyjctpjzdrfrey.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbG53Z3B5amN0cGp6ZHJmcmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDE5NzEsImV4cCI6MjA2NDcxNzk3MX0.x2GdGtvLbslKMBE2u3EWuwMijDg0_CAxp6McwjUei6k" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID_AQUI",
    "title": "Teste de Notificação",
    "message": "Esta é uma notificação de teste do sistema ContabilPRO",
    "data": {
      "type": "test",
      "priority": "normal"
    }
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "sent_count": 1,
  "failed_count": 0,
  "notification_id": "abc-123-def-456"
}
```

### 5.2 Teste do Cron Job

```bash
curl -X POST \
  https://selnwgpyjctpjzdrfrey.supabase.co/functions/v1/check-obligations \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbG53Z3B5amN0cGp6ZHJmcmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDE5NzEsImV4cCI6MjA2NDcxNzk3MX0.x2GdGtvLbslKMBE2u3EWuwMijDg0_CAxp6McwjUei6k"
```

**Resposta esperada:**
```json
{
  "success": true,
  "notifications_found": 0,
  "notifications_sent": 0,
  "notifications_failed": 0,
  "duration_ms": 234
}
```

## 📊 Passo 6: Monitoramento

### 6.1 Logs das Edge Functions

**Via Dashboard:**
- Acesse **Supabase Dashboard** → **Functions**
- Clique em `send-push-notification` ou `check-obligations`
- Veja logs em tempo real

**Via CLI:**
```bash
# Logs em tempo real
npx supabase functions logs send-push-notification --tail

# Logs do cron job
npx supabase functions logs check-obligations --tail
```

### 6.2 Histórico do Cron Job

```sql
-- Ver últimas 10 execuções
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-obligations-daily')
ORDER BY start_time DESC 
LIMIT 10;
```

### 6.3 Métricas de Notificações

```sql
-- Total de notificações por tipo
SELECT type, COUNT(*) as total
FROM notifications
GROUP BY type
ORDER BY total DESC;

-- Notificações enviadas hoje
SELECT COUNT(*) as total_hoje
FROM notifications
WHERE created_at >= CURRENT_DATE;

-- Subscriptions ativas por usuário
SELECT user_id, COUNT(*) as subscriptions
FROM notification_subscriptions
GROUP BY user_id;
```

## ⚠️ Troubleshooting

### Problema: Edge Function retorna 500

**Solução:**
1. Verificar logs: `npx supabase functions logs send-push-notification`
2. Verificar se secrets estão configurados: `npx supabase secrets list`
3. Verificar se VAPID keys são válidas

### Problema: Cron Job não executa

**Solução:**
1. Verificar se `pg_cron` está habilitado:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Verificar se o job está ativo:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'check-obligations-daily';
   ```

3. Ver erros:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE status = 'failed' 
   ORDER BY start_time DESC;
   ```

### Problema: Push não chega no navegador

**Solução:**
1. Verificar se o usuário tem subscription ativa
2. Verificar se o Service Worker está registrado
3. Verificar permissões do navegador
4. Testar em modo anônimo (sem extensões)

## ✅ Checklist Final

- [ ] Secrets configurados
- [ ] Edge Functions deployadas
- [ ] Tabelas criadas
- [ ] RLS policies ativas
- [ ] Cron job configurado
- [ ] Teste manual funcionando
- [ ] Logs sendo gerados
- [ ] Monitoramento configurado

## 📚 Próximos Passos

1. **Testes E2E:** Testar fluxo completo com usuário real
2. **Monitoramento:** Configurar alertas para falhas
3. **Otimização:** Ajustar performance se necessário
4. **Documentação:** Atualizar docs com feedback de produção

---

**Desenvolvido com ❤️ por ContabilPRO**  
**Data:** 03/10/2025

