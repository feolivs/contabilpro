# 🔌 Guia de Integração - Dashboard Compacta

## 📋 Checklist de Implementação

### 1. Migração SQL ✅

Execute a migração para adicionar `active_clients`:

```bash
# Via Supabase CLI
supabase db push

# Ou via SQL direto no Supabase Dashboard
# Execute o arquivo: infra/migrations/010_dashboard_active_clients.sql
```

**Verificar:**
```sql
-- Testar a função atualizada
SELECT dashboard_summary_v1(
  'seu-tenant-id'::uuid,
  30
);

-- Deve retornar active_clients no payload
```

### 2. Sparklines (Dados Reais)

Criar função SQL para retornar dados de sparkline:

```sql
-- infra/migrations/011_dashboard_sparklines.sql
CREATE OR REPLACE FUNCTION public.dashboard_sparklines(
  p_tenant_id uuid,
  p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'revenue', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'value', coalesce(sum(amount), 0),
          'date', entry_date::date
        ) ORDER BY entry_date
      )
      FROM entries
      WHERE tenant_id = p_tenant_id
        AND entry_type = 'credit'
        AND entry_date >= current_date - (p_days || ' days')::interval
      GROUP BY entry_date::date
    ),
    'expense', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'value', coalesce(sum(amount), 0),
          'date', entry_date::date
        ) ORDER BY entry_date
      )
      FROM entries
      WHERE tenant_id = p_tenant_id
        AND entry_type = 'debit'
        AND entry_date >= current_date - (p_days || ' days')::interval
      GROUP BY entry_date::date
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_sparklines(uuid, integer) TO authenticated;
```

**Server Action:**

```typescript
// src/actions/dashboard.ts
export async function getDashboardSparklines(
  rangeDays = 30
): Promise<ActionResponse<{
  revenue: SparklineData[]
  expense: SparklineData[]
}>> {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    const { data, error } = await supabase.rpc('dashboard_sparklines', {
      p_tenant_id: session.tenant_id,
      p_days: rangeDays,
    })

    if (error) throw new Error(error.message)

    return {
      success: true,
      data: {
        revenue: data?.revenue || [],
        expense: data?.expense || [],
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar sparklines',
    }
  }
}
```

**Uso na página:**

```typescript
// src/app/(tenant)/dashboard/page.tsx
const [summaryResult, trendResult, sparklinesResult] = await Promise.all([
  getDashboardSummary(),
  getDashboardTrend(),
  getDashboardSparklines(), // ✨ NOVO
])

const sparklines = sparklinesResult.success ? sparklinesResult.data : undefined

// Passar para o componente
<CompactKPIs summary={summary} sparklines={sparklines} />
```

### 3. Obrigações Fiscais (Dados Reais)

Criar função para buscar obrigações:

```sql
-- infra/migrations/012_tax_obligations.sql
CREATE OR REPLACE FUNCTION public.dashboard_tax_obligations(
  p_tenant_id uuid,
  p_days_ahead integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id::text,
        'name', name,
        'dueDate', due_date::text,
        'status', status,
        'amount', amount
      ) ORDER BY 
        CASE status
          WHEN 'overdue' THEN 1
          WHEN 'pending' THEN 2
          WHEN 'done' THEN 3
        END,
        due_date
    )
    FROM tax_obligations
    WHERE tenant_id = p_tenant_id
      AND due_date <= current_date + (p_days_ahead || ' days')::interval
    LIMIT 10
  );
END;
$$;
```

**Server Action:**

```typescript
// src/actions/dashboard.ts
export async function getTaxObligations(): Promise<ActionResponse<TaxObligation[]>> {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    const { data, error } = await supabase.rpc('dashboard_tax_obligations', {
      p_tenant_id: session.tenant_id,
      p_days_ahead: 30,
    })

    if (error) throw new Error(error.message)
    return { success: true, data: data || [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar obrigações',
    }
  }
}
```

**Uso na página:**

```typescript
const [summaryResult, obligationsResult] = await Promise.all([
  getDashboardSummary(),
  getTaxObligations(), // ✨ NOVO
])

const obligations = obligationsResult.success ? obligationsResult.data : undefined

<TaxObligationsPanel obligations={obligations} />
```

### 4. Tarefas Prioritárias (Dados Reais)

```typescript
// src/actions/dashboard.ts
export async function getPriorityTasks(): Promise<ActionResponse<PriorityTask[]>> {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, deadline, priority, completed')
      .eq('tenant_id', session.tenant_id)
      .eq('completed', false)
      .order('priority', { ascending: true })
      .order('deadline', { ascending: true })
      .limit(5)

    if (error) throw new Error(error.message)
    return { success: true, data: data || [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar tarefas',
    }
  }
}
```

### 5. Alertas Inteligentes (Regras Simples)

```typescript
// src/actions/dashboard.ts
export async function getSmartAlerts(): Promise<ActionResponse<SmartAlert[]>> {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    const alerts: SmartAlert[] = []

    // Regra 1: Despesas atípicas
    const { data: expenseAnomaly } = await supabase.rpc('detect_expense_anomaly', {
      p_tenant_id: session.tenant_id,
    })

    if (expenseAnomaly?.is_anomaly) {
      alerts.push({
        id: 'anomaly-1',
        type: 'anomaly',
        title: 'Despesa atípica detectada',
        description: `Despesa de "${expenseAnomaly.category}" ${expenseAnomaly.increase}% acima da média.`,
        dismissible: true,
      })
    }

    // Regra 2: Conciliações pendentes
    const { count: pendingReconciliations } = await supabase
      .from('bank_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', session.tenant_id)
      .is('reconciled_entry_id', null)
      .gte('match_score', 0.95)

    if (pendingReconciliations && pendingReconciliations > 0) {
      alerts.push({
        id: 'suggestion-1',
        type: 'suggestion',
        title: 'Conciliações pendentes',
        description: `${pendingReconciliations} transações com match >95% aguardando confirmar`,
        action: {
          label: 'Revisar',
          onClick: () => {}, // Implementar navegação
        },
        dismissible: true,
      })
    }

    // Regra 3: Documentos faltantes
    const { count: missingDocs } = await supabase
      .from('entries')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', session.tenant_id)
      .is('document_id', null)

    if (missingDocs && missingDocs > 0) {
      alerts.push({
        id: 'missing-1',
        type: 'missing',
        title: 'Documentos faltantes',
        description: `${missingDocs} lançamentos sem comprovante`,
        dismissible: false,
      })
    }

    return { success: true, data: alerts }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar alertas',
    }
  }
}
```

### 6. Drill-down nos KPIs

Implementar navegação ao clicar nos KPIs:

```typescript
// src/app/(tenant)/dashboard/page.tsx
'use client'

import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()

  const handleKPIClick = (kpi: string) => {
    switch (kpi) {
      case 'revenue':
        router.push('/lancamentos?type=credit&period=30d')
        break
      case 'expense':
        router.push('/lancamentos?type=debit&period=30d')
        break
      case 'netIncome':
        router.push('/relatorios/dre?period=30d')
        break
      case 'activeClients':
        router.push('/clientes?filter=active')
        break
    }
  }

  return (
    <CompactKPIs 
      summary={summary} 
      sparklines={sparklines}
      onKPIClick={handleKPIClick} // ✨ Adicionar handler
    />
  )
}
```

## 🧪 Testes

### Teste Manual

1. **KPIs:**
   - [ ] Valores exibidos corretamente
   - [ ] Variações calculadas
   - [ ] Sparklines renderizados
   - [ ] Clique navega para drill-down

2. **Painéis:**
   - [ ] Obrigações ordenadas por urgência
   - [ ] Tarefas com checkboxes funcionais
   - [ ] Alertas dismissíveis

3. **Responsividade:**
   - [ ] Mobile: 1 coluna
   - [ ] Tablet: 2 colunas
   - [ ] Desktop: layout completo

### Teste de Performance

```typescript
// Medir tempo de carregamento
console.time('dashboard-load')
const data = await getDashboardSummary()
console.timeEnd('dashboard-load')
// Target: < 500ms
```

## 📊 Monitoramento

Adicionar telemetria para entender uso:

```typescript
// src/lib/analytics.ts
export function trackKPIClick(kpi: string) {
  // Implementar com seu provider de analytics
  analytics.track('dashboard_kpi_clicked', { kpi })
}

export function trackAlertDismissed(alertId: string) {
  analytics.track('dashboard_alert_dismissed', { alertId })
}
```

## 🎯 Checklist Final

- [ ] Migração SQL executada
- [ ] Sparklines com dados reais
- [ ] Obrigações fiscais conectadas
- [ ] Tarefas do sistema integradas
- [ ] Alertas inteligentes funcionando
- [ ] Drill-down implementado
- [ ] Testes manuais passando
- [ ] Performance < 500ms
- [ ] Telemetria configurada

---

**Próximo passo:** Execute a migração SQL e comece a integrar os dados reais!

