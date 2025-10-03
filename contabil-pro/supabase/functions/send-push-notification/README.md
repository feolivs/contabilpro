# 🔔 Edge Function: send-push-notification

Envia notificações push para usuários via Web Push API.

---

## 📋 Descrição

Esta Edge Function é responsável por:
1. Validar o payload de entrada
2. Buscar subscriptions ativas do usuário
3. Enviar notificações push via Web Push API
4. Registrar notificação no banco de dados
5. Remover subscriptions inválidas/expiradas
6. Retornar estatísticas de envio

---

## 🚀 Como Usar

### Endpoint

```
POST https://your-project.supabase.co/functions/v1/send-push-notification
```

### Headers

```
Authorization: Bearer YOUR_ANON_KEY
Content-Type: application/json
```

### Payload

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Obrigação Fiscal Vencendo",
  "message": "DAS vence em 3 dias. Não esqueça de pagar!",
  "data": {
    "url": "/fiscal",
    "type": "tax_obligation_due_3d",
    "priority": "high",
    "obligation_id": "123"
  }
}
```

### Response (Success)

```json
{
  "success": true,
  "sent_count": 2,
  "failed_count": 0,
  "notification_id": "660e8400-e29b-41d4-a716-446655440000"
}
```

### Response (Partial Failure)

```json
{
  "success": true,
  "sent_count": 1,
  "failed_count": 1,
  "notification_id": "660e8400-e29b-41d4-a716-446655440000",
  "errors": [
    {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "error": "Subscription expired",
      "status_code": 410
    }
  ]
}
```

### Response (Error)

```json
{
  "error": "Validation failed: user_id must be a valid UUID"
}
```

---

## 🔧 Variáveis de Ambiente

### Obrigatórias

- `SUPABASE_URL` - URL do projeto Supabase (auto-injetada)
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço (auto-injetada)
- `VAPID_PUBLIC_KEY` - Chave pública VAPID
- `VAPID_PRIVATE_KEY` - Chave privada VAPID

### Opcionais

- `VAPID_SUBJECT` - Email de contato (default: `mailto:contato@contabilpro.com`)

---

## 📦 Estrutura de Arquivos

```
send-push-notification/
├── index.ts              # Handler principal
├── utils/
│   ├── types.ts          # TypeScript types
│   ├── validation.ts     # Validação Zod
│   ├── supabase.ts       # Cliente Supabase + queries
│   └── web-push.ts       # Integração Web Push API
└── README.md             # Esta documentação
```

---

## 🧪 Testes Locais

### 1. Iniciar Supabase Local

```bash
cd contabil-pro
npx supabase start
```

### 2. Servir a Função

```bash
npx supabase functions serve send-push-notification --env-file .env.local
```

### 3. Testar com cURL

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-push-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Teste de Notificação",
    "message": "Esta é uma notificação de teste!",
    "data": {
      "url": "/notificacoes",
      "type": "test"
    }
  }'
```

---

## 🚀 Deploy

### 1. Configurar Secrets

```bash
# Configurar VAPID keys
npx supabase secrets set VAPID_PUBLIC_KEY="BG7..."
npx supabase secrets set VAPID_PRIVATE_KEY="..."
npx supabase secrets set VAPID_SUBJECT="mailto:contato@contabilpro.com"
```

### 2. Deploy da Função

```bash
npx supabase functions deploy send-push-notification
```

### 3. Verificar Deploy

```bash
npx supabase functions list
```

---

## 📊 Logs e Monitoramento

### Ver Logs em Tempo Real

```bash
npx supabase functions logs send-push-notification --follow
```

### Ver Logs Históricos

```bash
npx supabase functions logs send-push-notification --limit 100
```

### Eventos Logados

- `push_notification_sent` - Notificação enviada com sucesso
- `push_notification_no_subscriptions` - Usuário sem subscriptions
- `push_notification_error` - Erro no processamento

---

## 🔐 Segurança

### RLS (Row Level Security)

A função usa `SUPABASE_SERVICE_ROLE_KEY` para bypassar RLS, mas:
- Valida `user_id` antes de buscar subscriptions
- Remove subscriptions inválidas automaticamente
- Registra todos os eventos para auditoria

### VAPID Keys

- **Nunca** commitar as chaves no código
- Usar `supabase secrets` para configurar
- Rotacionar chaves periodicamente

---

## 🐛 Troubleshooting

### Erro: "Missing VAPID keys"

**Solução:** Configurar secrets via CLI:
```bash
npx supabase secrets set VAPID_PUBLIC_KEY="..."
npx supabase secrets set VAPID_PRIVATE_KEY="..."
```

### Erro: "No active subscriptions found"

**Causa:** Usuário não tem subscriptions ativas.

**Solução:** Verificar se o usuário habilitou notificações em `/config`.

### Erro: "Subscription expired" (410)

**Causa:** Subscription foi revogada pelo browser.

**Solução:** A função remove automaticamente. Usuário precisa reativar notificações.

### Erro: "Database error"

**Causa:** Problema de conexão ou RLS.

**Solução:** Verificar se as tabelas existem e RLS está configurado.

---

## 📚 Referências

- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [web-push library](https://github.com/web-push-libs/web-push)
- [VAPID Protocol](https://datatracker.ietf.org/doc/html/rfc8292)

---

**Desenvolvido com ❤️ por Augment Agent**  
**Data:** 03/10/2025

