# Edge Functions - ContabilPRO

Este diretório contém as Edge Functions do ContabilPRO, executadas no runtime Deno da Supabase.

## 📋 Funções Disponíveis

### 1. parse-xml
Processa documentos fiscais XML (NF-e, NFSe, NFC-e).

### 2. parse-ofx
Processa extratos bancários no formato OFX.

## 🚀 Deploy

```bash
# Deploy todas as funções
npm run deploy_functions

# Deploy função específica
npx supabase functions deploy parse-xml --project-ref YOUR_PROJECT_REF
npx supabase functions deploy parse-ofx --project-ref YOUR_PROJECT_REF
```

## 🔐 Secrets Necessários

As Edge Functions requerem as seguintes variáveis de ambiente:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Para configurar secrets:

```bash
npx supabase secrets set SUPABASE_URL=your_url --project-ref YOUR_PROJECT_REF
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key --project-ref YOUR_PROJECT_REF
```

## 🧪 Testando Localmente

```bash
# Inicie o Supabase local
supabase start

# Sirva a função localmente
supabase functions serve parse-xml --env-file .env.local

# Teste com curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/parse-xml' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"documentId":"doc-id","clientId":"client-id"}'
```

## 📚 Documentação Individual

- [parse-xml/README.md](./parse-xml/README.md) - Parser de NF-e
- [parse-ofx/README.md](./parse-ofx/README.md) - Parser de OFX

## 🔧 Desenvolvimento

### Estrutura de uma Edge Function

```typescript
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Your logic here
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
```

### Boas Práticas

1. **Sempre use Service Role Key** - Nunca exponha ao cliente
2. **Valide inputs** - Verifique todos os parâmetros recebidos
3. **Error handling** - Capture e trate todos os erros
4. **Logging** - Use `console.log` para debugging
5. **CORS** - Configure headers corretamente
6. **Timeout** - Funções têm limite de 60 segundos

## 🐛 Debugging

### Ver logs em tempo real

```bash
supabase functions logs parse-xml --project-ref YOUR_PROJECT_REF
```

### Logs estruturados

```typescript
console.log(JSON.stringify({
  level: 'info',
  message: 'Processing document',
  documentId: doc.id,
  timestamp: new Date().toISOString()
}))
```

## 📊 Monitoramento

Acesse o dashboard do Supabase para ver:
- Invocações por função
- Tempo de execução
- Taxa de erro
- Logs detalhados

https://supabase.com/dashboard/project/YOUR_PROJECT_REF/functions

## 🔒 Segurança

- Service Role Key tem acesso total ao banco
- Use RLS policies mesmo em Edge Functions
- Valide origem das requisições
- Limite rate de chamadas se necessário
- Nunca logue dados sensíveis

## 📝 Changelog

### v1.0.0 (2025-01-08)
- ✅ Implementação inicial de parse-xml
- ✅ Implementação inicial de parse-ofx
- ✅ Suporte a NF-e completo
- ✅ Suporte a OFX SGML
- ✅ Detecção de duplicatas
- ✅ Error handling robusto

