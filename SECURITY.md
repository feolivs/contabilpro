# Política de Segurança - ContabilPRO

## 🔐 Visão Geral

A segurança é uma prioridade máxima no ContabilPRO. Este documento descreve nossas políticas e práticas de segurança.

## 🚨 Reportando Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança, **NÃO** abra uma issue pública.

### Como Reportar

1. **Email**: Envie um email para [feolivs6@gmail.com](mailto:feolivs6@gmail.com)
2. **Assunto**: "SECURITY: [Breve descrição]"
3. **Conteúdo**:
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Sugestões de correção (se houver)

### O que Esperar

- **Confirmação**: Resposta em até 48 horas
- **Avaliação**: Análise da vulnerabilidade em até 7 dias
- **Correção**: Patch desenvolvido e testado
- **Divulgação**: Coordenada após correção

## 🛡️ Práticas de Segurança

### 1. Autenticação e Autorização

#### Autenticação
- **Supabase Auth** para gerenciamento de usuários
- **JWT tokens** com expiração configurável
- **Refresh tokens** para sessões longas
- **MFA** (Multi-Factor Authentication) - planejado

#### Autorização
- **Row Level Security (RLS)** em todas as tabelas
- **Políticas granulares** por operação (SELECT, INSERT, UPDATE, DELETE)
- **Isolamento multi-tenant** via `user_id` e `client_id`

```sql
-- Exemplo de política RLS
CREATE POLICY "Users can only see their own documents"
ON documents FOR SELECT
USING (auth.uid() = user_id);
```

### 2. Gestão de Secrets

#### Nunca Commite Secrets
- ❌ API keys
- ❌ Database passwords
- ❌ Service role keys
- ❌ Tokens de acesso

#### Use Variáveis de Ambiente
```bash
# .env.local (NUNCA commitar)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key  # Server-side only!
```

#### Rotação de Secrets
- Rotacione secrets comprometidos **imediatamente**
- Agende rotação periódica (a cada 90 dias)
- Documente rotações no log de incidentes

### 3. Validação de Input

#### Frontend
```typescript
// Use Zod para validação
import { z } from 'zod'

const schema = z.object({
  cnpj: z.string().regex(/^\d{14}$/),
  email: z.string().email(),
})

const result = schema.safeParse(data)
```

#### Backend (Edge Functions)
```typescript
// Valide TODOS os inputs
if (!documentId || !clientId) {
  return new Response(
    JSON.stringify({ error: 'Missing required fields' }),
    { status: 400 }
  )
}
```

### 4. Proteção de Dados (LGPD)

#### Princípios
- **Minimização**: Colete apenas dados necessários
- **Consentimento**: Obtenha permissão explícita
- **Transparência**: Informe como os dados são usados
- **Segurança**: Proteja dados com criptografia
- **Direitos**: Permita acesso, correção e exclusão

#### Dados Sensíveis
- **Criptografia em repouso**: Supabase PostgreSQL
- **Criptografia em trânsito**: TLS/HTTPS
- **Logs**: Não registre dados sensíveis (CPF, CNPJ, valores)

#### Retenção
- **Documentos**: 5 anos (requisito fiscal)
- **Logs de acesso**: 6 meses
- **Dados de usuário**: Até solicitação de exclusão

### 5. Storage Seguro

#### Organização
```
storage/
└── documents/
    └── {user_id}/
        └── {client_id}/
            └── {type}/
                └── {filename}
```

#### Políticas
- **Upload**: Apenas usuário autenticado
- **Download**: Apenas owner do documento
- **Tamanho máximo**: 10MB
- **Tipos permitidos**: XML, OFX

```sql
-- Política de Storage
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 6. Edge Functions

#### Service Role Key
- **NUNCA** exponha ao cliente
- Use **apenas** em Edge Functions (server-side)
- Configure como secret no Supabase

```typescript
// ✅ Correto (Edge Function)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// ❌ ERRADO (Frontend)
const supabase = createClient(url, serviceRoleKey) // NUNCA!
```

#### Rate Limiting
- Implemente rate limiting para prevenir abuso
- Use Supabase Edge Functions rate limiting
- Monitore invocações anormais

### 7. Dependências

#### Auditoria Regular
```bash
# Verifique vulnerabilidades
npm audit

# Corrija automaticamente
npm audit fix
```

#### Atualizações
- Mantenha dependências atualizadas
- Use Dependabot para alertas
- Teste antes de atualizar versões major

### 8. CORS

#### Configuração Segura
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
```

#### Produção
- Configure `ALLOWED_ORIGIN` para domínio específico
- Nunca use `*` em produção

## 🔍 Monitoramento

### Logs
- **Acesso**: Registre tentativas de login
- **Erros**: Capture exceções sem expor stack traces
- **Atividades**: Documente ações críticas (upload, delete)

### Alertas
- Múltiplas tentativas de login falhadas
- Uploads anormalmente grandes
- Erros de RLS (tentativa de acesso não autorizado)
- Uso excessivo de API

## 🧪 Testes de Segurança

### RLS Tests
```bash
npm run test:integration:rls
```

### Checklist Pré-Deploy
- [ ] Todos os secrets configurados
- [ ] RLS ativo em todas as tabelas
- [ ] Validação de input implementada
- [ ] CORS configurado corretamente
- [ ] Logs não expõem dados sensíveis
- [ ] Dependências atualizadas
- [ ] Testes de segurança passando

## 📋 Compliance

### LGPD (Lei Geral de Proteção de Dados)
- ✅ Consentimento explícito
- ✅ Direito de acesso aos dados
- ✅ Direito de correção
- ✅ Direito de exclusão
- ✅ Portabilidade de dados
- ✅ Notificação de incidentes

### SPED Contábil
- ✅ Retenção de documentos fiscais (5 anos)
- ✅ Integridade de dados
- ✅ Rastreabilidade de alterações

## 🚨 Resposta a Incidentes

### Processo
1. **Detecção**: Identificar o incidente
2. **Contenção**: Limitar o impacto
3. **Erradicação**: Remover a causa
4. **Recuperação**: Restaurar operações
5. **Lições Aprendidas**: Documentar e melhorar

### Contatos de Emergência
- **Desenvolvedor Principal**: feolivs6@gmail.com
- **Supabase Support**: https://supabase.com/support

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [LGPD](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)

## 📝 Changelog de Segurança

### 2025-01-08
- ✅ Implementação inicial de RLS
- ✅ Configuração de Storage policies
- ✅ Validação de input com Zod
- ✅ Edge Functions com Service Role Key

---

**Segurança é responsabilidade de todos. Reporte vulnerabilidades de forma responsável.**

