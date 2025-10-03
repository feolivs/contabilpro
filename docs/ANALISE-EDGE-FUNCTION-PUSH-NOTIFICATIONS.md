# 📊 Análise: Edge Function para Push Notifications

**Data:** 03/10/2025  
**Projeto:** ContabilPRO  
**Referência:** Projeto JoyceSoft (selnwgpyjctpjzdrfrey)

---

## 🎯 Objetivo

Analisar a infraestrutura do Supabase no projeto JoyceSoft e planejar a implementação da Edge Function `send-push-notification` para o ContabilPRO, garantindo que seguimos as melhores práticas e a documentação oficial.

---

## 📋 Estado Atual

### ✅ Já Implementado (83%)

1. **Database (100%)**
   - ✅ Tabela `notifications` com RLS
   - ✅ Tabela `notification_subscriptions` com RLS
   - ✅ Função SQL `check_tax_obligations_due()`
   - ✅ Triggers automáticos

2. **Frontend (100%)**
   - ✅ Service Worker (`public/sw.js`)
   - ✅ Biblioteca de push (`src/lib/push-notifications.ts`)
   - ✅ Componentes UI (NotificationBell, List, Item, Settings)
   - ✅ VAPID keys geradas

3. **Dependências (100%)**
   - ✅ `web-push@3.6.7` instalado
   - ✅ `@supabase/supabase-js@2.58.0`
   - ✅ Supabase CLI v2.40.7 (local)

### ⏳ Pendente (17%)

1. **Edge Function `send-push-notification`** (0%)
2. **Cron Job `check-obligations`** (0%)
3. **Configuração de Secrets** (0%)
4. **Deploy e Testes** (0%)

---

## 🏗️ Infraestrutura Supabase

### Projeto JoyceSoft (Referência)
```json
{
  "id": "selnwgpyjctpjzdrfrey",
  "name": "JoyceSoft",
  "region": "sa-east-1",
  "status": "ACTIVE_HEALTHY",
  "database": {
    "host": "db.selnwgpyjctpjzdrfrey.supabase.co",
    "version": "17.4.1.037",
    "postgres_engine": "17"
  }
}
```

### Configuração Local (ContabilPRO)
```toml
project_id = "contabil-pro"
[api]
port = 54321
[db]
port = 54322
major_version = 17
[studio]
port = 54323
```

### Edge Function Existente
- ✅ `process-document` já implementada
- ✅ Usa Deno + TypeScript
- ✅ Estrutura modular (processors + utils)
- ✅ CORS configurado
- ✅ Error handling robusto

---

## 📚 Documentação Oficial Analisada

### 1. Edge Functions (Deno)

**Estrutura Básica:**
```typescript
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const payload = await req.json()
    // Process...
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
})
```

**Variáveis de Ambiente:**
- `SUPABASE_URL` - URL do projeto
- `SUPABASE_ANON_KEY` - Chave pública
- `SUPABASE_SERVICE_ROLE_KEY` - Chave privada (admin)
- Custom: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`

### 2. Web Push API

**Exemplo Oficial (Expo):**
```typescript
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const payload = await req.json()
  
  // Buscar subscription do usuário
  const { data } = await supabase
    .from('profiles')
    .select('expo_push_token')
    .eq('id', payload.record.user_id)
    .single()
  
  // Enviar push
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}`
    },
    body: JSON.stringify({
      to: data?.expo_push_token,
      sound: 'default',
      body: payload.record.body
    })
  })
  
  return new Response(JSON.stringify(res), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 3. Cron Jobs (pg_cron)

**Agendar Função:**
```sql
SELECT cron.schedule(
  'invoke-function-every-minute',
  '* * * * *', -- cron syntax
  $$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') 
        || '/functions/v1/function-name',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
      ),
      body := concat('{"time": "', now(), '"}')::jsonb
    ) AS request_id;
  $$
);
```

**Secrets no Vault:**
```sql
SELECT vault.create_secret('https://project-ref.supabase.co', 'project_url');
SELECT vault.create_secret('YOUR_ANON_KEY', 'anon_key');
```

### 4. Deploy

**Comandos CLI:**
```bash
# Deploy função específica
supabase functions deploy send-push-notification

# Configurar secrets
supabase secrets set --env-file .env.local

# Ou individual
supabase secrets set VAPID_PUBLIC_KEY="..."
supabase secrets set VAPID_PRIVATE_KEY="..."
```

---

## 🎨 Arquitetura Proposta

### Estrutura de Arquivos
```
supabase/functions/
├── send-push-notification/
│   ├── index.ts              # Handler principal
│   ├── utils/
│   │   ├── supabase.ts       # Cliente Supabase
│   │   ├── web-push.ts       # Integração Web Push
│   │   └── types.ts          # TypeScript types
│   └── README.md             # Documentação
└── check-obligations/
    ├── index.ts              # Cron job handler
    └── README.md
```

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│                    TRIGGER AUTOMÁTICO                    │
│  check_tax_obligations_due() → INSERT notifications     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              CRON JOB (check-obligations)                │
│  Executa diariamente às 8h BRT                          │
│  1. Busca notificações não enviadas                     │
│  2. Chama send-push-notification para cada uma          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         EDGE FUNCTION (send-push-notification)           │
│  1. Valida payload (user_id, title, message)            │
│  2. Busca subscriptions ativas do usuário               │
│  3. Envia push via Web Push API                         │
│  4. Registra notificação no banco                       │
│  5. Remove subscriptions inválidas                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  SERVICE WORKER (sw.js)                  │
│  1. Recebe push event                                   │
│  2. Exibe notificação no browser                        │
│  3. Handle click → navega para URL                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementação Detalhada

### 1. Edge Function: send-push-notification

**Payload de Entrada:**
```typescript
interface SendPushRequest {
  user_id: string
  title: string
  message: string
  data?: {
    url?: string
    type?: string
    [key: string]: any
  }
}
```

**Resposta:**
```typescript
interface SendPushResponse {
  success: boolean
  sent_count: number
  failed_count: number
  errors?: Array<{
    endpoint: string
    error: string
  }>
}
```

**Lógica Principal:**
1. Validar payload com Zod
2. Buscar subscriptions: `SELECT * FROM notification_subscriptions WHERE user_id = $1`
3. Para cada subscription:
   - Enviar push via `web-push` library
   - Se erro 410 (Gone): remover subscription
   - Se erro 404/403: marcar como inválida
4. Inserir notificação: `INSERT INTO notifications (...)`
5. Retornar estatísticas

---

## 📊 Comparação: Expo vs Web Push

| Aspecto | Expo Push | Web Push API |
|---------|-----------|--------------|
| **Plataforma** | React Native | Web (PWA) |
| **Dependência** | Expo SDK | Nativa do browser |
| **Custo** | Grátis (limites) | Grátis (ilimitado) |
| **Setup** | Mais simples | Mais complexo |
| **Controle** | Menos | Total |
| **Nosso Caso** | ❌ Não aplicável | ✅ **ESCOLHIDO** |

**Decisão:** Usar **Web Push API** pois:
- ✅ ContabilPRO é web app (Next.js)
- ✅ Sem dependências externas
- ✅ Controle total sobre payload
- ✅ Funciona offline (Service Worker)

---

## 🔐 Segurança e Secrets

### Secrets Necessários

1. **VAPID Keys** (já gerados)
   ```bash
   VAPID_PUBLIC_KEY="BG7..."
   VAPID_PRIVATE_KEY="..."
   ```

2. **Supabase** (auto-injetados)
   ```bash
   SUPABASE_URL="https://..."
   SUPABASE_ANON_KEY="eyJ..."
   SUPABASE_SERVICE_ROLE_KEY="eyJ..."
   ```

### Configuração

**Local (.env.local):**
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BG7..."
VAPID_PRIVATE_KEY="..."
```

**Supabase (via CLI):**
```bash
supabase secrets set VAPID_PUBLIC_KEY="BG7..."
supabase secrets set VAPID_PRIVATE_KEY="..."
```

---

## ✅ Checklist de Implementação

### Fase 1: Edge Function (2h)
- [ ] Criar estrutura `supabase/functions/send-push-notification/`
- [ ] Implementar `index.ts` com handler principal
- [ ] Criar `utils/supabase.ts` (cliente + queries)
- [ ] Criar `utils/web-push.ts` (integração Web Push)
- [ ] Criar `utils/types.ts` (interfaces TypeScript)
- [ ] Adicionar validação Zod
- [ ] Implementar error handling
- [ ] Adicionar logging

### Fase 2: Cron Job (1h)
- [ ] Criar `supabase/functions/check-obligations/`
- [ ] Implementar handler do cron
- [ ] Buscar notificações pendentes
- [ ] Chamar send-push-notification
- [ ] Adicionar retry logic
- [ ] Logging e métricas

### Fase 3: Deploy (30min)
- [ ] Configurar secrets no Supabase
- [ ] Deploy das funções
- [ ] Configurar cron schedule (SQL)
- [ ] Testar manualmente

### Fase 4: Testes (30min)
- [ ] Teste de envio manual
- [ ] Teste do cron job
- [ ] Validar recebimento no browser
- [ ] Testar error handling
- [ ] Documentar

---

## 🚀 Próximos Passos

1. **Criar Edge Function** seguindo estrutura da `process-document`
2. **Integrar web-push library** (já instalada)
3. **Testar localmente** com `supabase functions serve`
4. **Deploy** para projeto JoyceSoft (teste)
5. **Configurar cron** via SQL
6. **Validar** fluxo completo

---

## 📝 Notas Importantes

1. **Deno vs Node.js:**
   - Edge Functions usam Deno (não Node.js)
   - Imports via `npm:` prefix: `import webpush from 'npm:web-push'`
   - Sem `package.json` na função

2. **CORS:**
   - Sempre incluir headers CORS
   - Handle OPTIONS requests

3. **Error Handling:**
   - Subscriptions inválidas devem ser removidas
   - Retry logic para falhas temporárias
   - Logging detalhado

4. **Performance:**
   - Batch processing (múltiplas subscriptions)
   - Timeout de 5 minutos (padrão Edge Functions)
   - Considerar queue para alto volume

---

**Desenvolvido com ❤️ por Augment Agent**  
**Data:** 03/10/2025

