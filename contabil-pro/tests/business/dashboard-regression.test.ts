/**
 * Testes de Regressão de Negócio - Dashboard
 *
 * OBJETIVO: Garantir que o ciclo contábil básico funciona corretamente
 * ORÁCULO: Valores esperados documentados para cada cenário
 */

import { createClient as createClientAction } from '@/actions/clients'
import { getDashboardSummary } from '@/actions/dashboard'
import { createEntry } from '@/actions/entries'

import { createClient } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

// Configuração de teste
const TEST_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000'
const TEST_USER_ID = 'test-user-123'

// Valores esperados (ORÁCULO)
const EXPECTED_VALUES = {
  INITIAL_STATE: {
    revenue: { current: 0, previous: 0 },
    expense: { current: 0, previous: 0 },
    newClients: { current: 0, previous: 0 },
  },
  AFTER_CLIENT_CREATION: {
    newClients: { current: 1, previous: 0 },
  },
  AFTER_REVENUE_ENTRY: {
    revenue: { current: 1000, previous: 0 },
  },
  AFTER_EXPENSE_ENTRY: {
    expense: { current: 500, previous: 0 },
  },
} as const

describe('Dashboard Business Regression Tests', () => {
  let supabase: ReturnType<typeof createClient>
  let testClientId: string
  let testAccountIds: { revenue: string; expense: string }

  beforeEach(async () => {
    // Setup: Limpar dados de teste
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Limpar dados existentes do tenant de teste
    await supabase.from('entries').delete().eq('tenant_id', TEST_TENANT_ID)
    await supabase.from('clients').delete().eq('tenant_id', TEST_TENANT_ID)

    // Criar contas de teste
    const { data: accounts } = await supabase
      .from('accounts')
      .insert([
        {
          id: 'acc-revenue-test',
          tenant_id: TEST_TENANT_ID,
          name: 'Receitas de Teste',
          type: 'revenue',
          code: '3.1.01',
        },
        {
          id: 'acc-expense-test',
          tenant_id: TEST_TENANT_ID,
          name: 'Despesas de Teste',
          type: 'expense',
          code: '4.1.01',
        },
      ])
      .select()

    testAccountIds = {
      revenue: 'acc-revenue-test',
      expense: 'acc-expense-test',
    }
  })

  afterEach(async () => {
    // Cleanup: Remover dados de teste
    await supabase.from('entries').delete().eq('tenant_id', TEST_TENANT_ID)
    await supabase.from('clients').delete().eq('tenant_id', TEST_TENANT_ID)
    await supabase.from('accounts').delete().eq('tenant_id', TEST_TENANT_ID)
  })

  describe('Happy Path - Ciclo Completo', () => {
    it('deve refletir cliente → lançamento → dashboard corretamente', async () => {
      // 1. Estado inicial - dashboard vazio
      const initialDashboard = await getDashboardSummary(30)
      expect(initialDashboard.success).toBe(true)
      expect(initialDashboard.data).toMatchObject(EXPECTED_VALUES.INITIAL_STATE)

      // 2. Criar cliente
      const clientResult = await createClientAction({
        name: 'Cliente Teste Regressão',
        email: 'teste@regressao.com',
        document: '12345678901',
        type: 'individual',
      })
      expect(clientResult.success).toBe(true)
      testClientId = clientResult.data!.id

      // 3. Verificar dashboard após cliente
      const dashboardAfterClient = await getDashboardSummary(30)
      expect(dashboardAfterClient.data?.newClients).toMatchObject(
        EXPECTED_VALUES.AFTER_CLIENT_CREATION.newClients
      )

      // 4. Lançar receita
      const revenueEntry = await createEntry({
        description: 'Receita de Teste',
        amount: 1000,
        date: new Date().toISOString().split('T')[0],
        type: 'credit',
        account_id: testAccountIds.revenue,
        client_id: testClientId,
      })
      expect(revenueEntry.success).toBe(true)

      // 5. Verificar dashboard após receita
      const dashboardAfterRevenue = await getDashboardSummary(30)
      expect(dashboardAfterRevenue.data?.revenue).toMatchObject(
        EXPECTED_VALUES.AFTER_REVENUE_ENTRY.revenue
      )

      // 6. Lançar despesa
      const expenseEntry = await createEntry({
        description: 'Despesa de Teste',
        amount: 500,
        date: new Date().toISOString().split('T')[0],
        type: 'debit',
        account_id: testAccountIds.expense,
      })
      expect(expenseEntry.success).toBe(true)

      // 7. Verificar dashboard final
      const finalDashboard = await getDashboardSummary(30)
      expect(finalDashboard.data?.expense).toMatchObject(
        EXPECTED_VALUES.AFTER_EXPENSE_ENTRY.expense
      )
    })
  })

  describe('Casos Limite', () => {
    it('deve ignorar lançamentos com data futura', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      await createEntry({
        description: 'Lançamento Futuro',
        amount: 999,
        date: futureDate.toISOString().split('T')[0],
        type: 'credit',
        account_id: testAccountIds.revenue,
      })

      const dashboard = await getDashboardSummary(30)
      expect(dashboard.data?.revenue.current).toBe(0)
    })

    it('deve lidar com cliente excluído graciosamente', async () => {
      // Criar e excluir cliente
      const client = await createClientAction({
        name: 'Cliente Temporário',
        email: 'temp@test.com',
        document: '99999999999',
        type: 'individual',
      })

      await supabase.from('clients').delete().eq('id', client.data!.id)

      // Dashboard não deve quebrar
      const dashboard = await getDashboardSummary(30)
      expect(dashboard.success).toBe(true)
    })
  })

  describe('Isolamento de Tenant', () => {
    it('deve isolar dados entre tenants', async () => {
      const OTHER_TENANT_ID = '999e8400-e29b-41d4-a716-446655440999'

      // Criar dados no outro tenant
      await supabase.from('accounts').insert({
        id: 'acc-other-tenant',
        tenant_id: OTHER_TENANT_ID,
        name: 'Conta Outro Tenant',
        type: 'revenue',
        code: '3.1.99',
      })

      await supabase.from('entries').insert({
        tenant_id: OTHER_TENANT_ID,
        account_id: 'acc-other-tenant',
        description: 'Receita Outro Tenant',
        amount: 5000,
        date: new Date().toISOString().split('T')[0],
        type: 'credit',
      })

      // Dashboard do tenant de teste deve permanecer zerado
      const dashboard = await getDashboardSummary(30)
      expect(dashboard.data?.revenue.current).toBe(0)

      // Cleanup
      await supabase.from('entries').delete().eq('tenant_id', OTHER_TENANT_ID)
      await supabase.from('accounts').delete().eq('tenant_id', OTHER_TENANT_ID)
    })
  })
})
