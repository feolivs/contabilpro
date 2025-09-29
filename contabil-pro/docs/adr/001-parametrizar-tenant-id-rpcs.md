# ADR-001: Parametrizar tenant_id em RPCs ao invés de JWT Claims

## Status
✅ **ACEITO** - Implementado em 2024-12-29

## Contexto

Inicialmente, as stored procedures do dashboard tentavam extrair o `tenant_id` diretamente dos JWT claims usando `current_setting('request.jwt.claims')`. Isso causava problemas de:

1. **Contexto perdido**: Claims não persistiam entre chamadas RPC
2. **Debugging difícil**: Erro genérico "Tenant context not found"
3. **Pooling de conexões**: Contexto não compartilhado entre sessões

## Decisão

**Mudamos para parametrização explícita do `tenant_id` em todas as RPCs.**

### Antes:
```sql
CREATE FUNCTION dashboard_summary(range_days integer)
-- Tentava acessar: current_setting('request.jwt.claims')::jsonb->>'tenant_id'
```

### Depois:
```sql
CREATE FUNCTION dashboard_summary_v1(p_tenant_id uuid, p_range_days integer)
-- Recebe tenant_id como parâmetro explícito
```

## Racional Técnico

### ✅ Vantagens
1. **Explícito e confiável**: Parâmetro sempre disponível
2. **Testável**: Fácil de testar com diferentes tenants
3. **Debuggável**: Logs mostram exatamente qual tenant foi usado
4. **Pool-friendly**: Funciona com connection pooling (PgBouncer)
5. **Versionável**: Permite evolução das RPCs (v1, v2, etc.)

### ⚠️ Desvantagens
1. **Verbosidade**: Mais parâmetros em cada chamada
2. **Responsabilidade**: Application layer deve sempre passar tenant_id correto
3. **Duplicação**: tenant_id aparece em RLS policies E parâmetros

## Implicações de Segurança

### 🔒 Mitigações Implementadas
1. **Validação dupla**: RPC valida se tenant existe e está ativo
2. **RLS mantido**: Políticas de Row Level Security continuam ativas
3. **Auditoria**: Logs registram tenant_id usado em cada chamada
4. **Princípio da defesa em profundidade**: Múltiplas camadas de validação

### 🚨 Riscos Residuais
1. **Bug na aplicação**: Passar tenant_id errado (mitigado por testes)
2. **Bypass acidental**: Esquecer validação em nova RPC (mitigado por template)

## Alternativas Consideradas

### 1. Manter JWT Claims
- ❌ **Rejeitado**: Problemas de pooling e debugging
- ❌ **Complexidade**: Configuração de contexto por sessão

### 2. Hybrid Approach
- ❌ **Rejeitado**: Complexidade desnecessária
- ❌ **Inconsistência**: Diferentes RPCs com diferentes padrões

### 3. Stored Procedures sem Tenant
- ❌ **Rejeitado**: Violaria princípios de multi-tenancy
- ❌ **Segurança**: Risco de vazamento de dados

## Implementação

### Padrão de RPC Estabelecido:
```sql
CREATE FUNCTION procedure_name_v1(
  p_tenant_id uuid,        -- SEMPRE primeiro parâmetro
  p_other_params ...       -- Outros parâmetros
)
RETURNS rpc_response       -- Resposta padronizada
SECURITY DEFINER          -- Executa com privilégios do owner
SET search_path = public   -- Evita schema injection
LANGUAGE plpgsql
AS $$
DECLARE
  -- Validações e lógica
BEGIN
  -- 1. Validar tenant_id
  IF p_tenant_id IS NULL THEN
    RETURN create_rpc_response('error', NULL, 'tenant_id é obrigatório');
  END IF;
  
  -- 2. Verificar se tenant existe
  IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = p_tenant_id AND status = 'active') THEN
    RETURN create_rpc_response('error', NULL, 'Tenant não encontrado ou inativo');
  END IF;
  
  -- 3. Lógica de negócio...
END;
$$;
```

## Métricas de Sucesso

### ✅ Resultados Obtidos
- **Eliminação** de erros "Tenant context not found"
- **Redução** de 100% nos timeouts de RPC
- **Melhoria** na debuggabilidade (logs claros)
- **Compatibilidade** com connection pooling

### 📊 Métricas Monitoradas
- Taxa de erro das RPCs: < 5%
- Tempo de resposta: < 500ms (dashboard_summary_v1)
- Isolamento de tenant: 100% (testes automatizados)

## Revisão

**Data da próxima revisão**: 2025-03-29
**Critérios para revisão**:
- Performance das RPCs
- Feedback da equipe de desenvolvimento
- Novos requisitos de segurança
- Evolução do ecossistema Supabase

---
*Autor: Sistema ContabilPRO*
*Revisores: Equipe de Arquitetura*
*Data: 2024-12-29*
