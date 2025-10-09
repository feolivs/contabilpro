import { tool } from '@openai/agents';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// 1. QUERY INVOICES TOOL - Buscar notas fiscais
// ============================================================================

export const queryInvoicesTool = tool({
  name: 'query_invoices',
  description: 'Busca notas fiscais (NF-e, NFSe, NFC-e) de um cliente específico. Use para responder perguntas sobre faturamento, fornecedores, produtos vendidos, etc.',
  parameters: z.object({
    clientId: z.string().uuid().describe('ID do cliente (obrigatório)'),
    startDate: z.string().optional().describe('Data inicial no formato YYYY-MM-DD'),
    endDate: z.string().optional().describe('Data final no formato YYYY-MM-DD'),
    type: z.enum(['incoming', 'outgoing']).optional().describe('Tipo: incoming (compras) ou outgoing (vendas)'),
    limit: z.number().optional().default(10).describe('Número máximo de resultados (padrão: 10)')
  }),
  execute: async ({ clientId, startDate, endDate, type, limit }, { context }) => {
    const supabase = context.supabase as SupabaseClient;
    
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .order('issue_date', { ascending: false })
      .limit(limit || 10);
    
    if (startDate) {
      query = query.gte('issue_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('issue_date', endDate);
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error querying invoices', error);
      return { error: error.message, data: [] };
    }
    
    return {
      count: data?.length || 0,
      data: data || [],
      summary: {
        totalAmount: data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
        avgAmount: data?.length ? (data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) / data.length) : 0
      }
    };
  }
});

// ============================================================================
// 2. QUERY BANK TRANSACTIONS TOOL - Buscar transações bancárias
// ============================================================================

export const queryBankTransactionsTool = tool({
  name: 'query_bank_transactions',
  description: 'Busca transações bancárias (OFX) de um cliente específico. Use para responder perguntas sobre movimentação bancária, saldo, pagamentos, recebimentos, etc.',
  parameters: z.object({
    clientId: z.string().uuid().describe('ID do cliente (obrigatório)'),
    startDate: z.string().optional().describe('Data inicial no formato YYYY-MM-DD'),
    endDate: z.string().optional().describe('Data final no formato YYYY-MM-DD'),
    type: z.enum(['debit', 'credit']).optional().describe('Tipo: debit (saída) ou credit (entrada)'),
    limit: z.number().optional().default(10).describe('Número máximo de resultados (padrão: 10)')
  }),
  execute: async ({ clientId, startDate, endDate, type, limit }, { context }) => {
    const supabase = context.supabase as SupabaseClient;
    
    let query = supabase
      .from('bank_transactions')
      .select('*')
      .eq('client_id', clientId)
      .order('transaction_date', { ascending: false })
      .limit(limit || 10);
    
    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error querying bank transactions', error);
      return { error: error.message, data: [] };
    }
    
    return {
      count: data?.length || 0,
      data: data || [],
      summary: {
        totalDebits: data?.filter(t => t.type === 'debit').reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) || 0,
        totalCredits: data?.filter(t => t.type === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        netAmount: data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      }
    };
  }
});

// ============================================================================
// 3. QUERY PAYROLL TOOL - Buscar dados de folha de pagamento
// ============================================================================

export const queryPayrollTool = tool({
  name: 'query_payroll',
  description: 'Busca dados de folha de pagamento de um cliente específico. Use para responder perguntas sobre salários, encargos, INSS, FGTS, IRRF, etc.',
  parameters: z.object({
    clientId: z.string().uuid().describe('ID do cliente (obrigatório)'),
    referenceMonth: z.number().optional().describe('Mês de referência (1-13, onde 13 é 13º salário)'),
    referenceYear: z.number().optional().describe('Ano de referência'),
    limit: z.number().optional().default(12).describe('Número máximo de resultados (padrão: 12)')
  }),
  execute: async ({ clientId, referenceMonth, referenceYear, limit }, { context }) => {
    const supabase = context.supabase as SupabaseClient;
    
    let query = supabase
      .from('payroll_summaries')
      .select('*')
      .eq('client_id', clientId)
      .order('reference_year', { ascending: false })
      .order('reference_month', { ascending: false })
      .limit(limit || 12);
    
    if (referenceMonth) {
      query = query.eq('reference_month', referenceMonth);
    }
    
    if (referenceYear) {
      query = query.eq('reference_year', referenceYear);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error querying payroll', error);
      return { error: error.message, data: [] };
    }
    
    return {
      count: data?.length || 0,
      data: data || [],
      summary: {
        totalGrossSalary: data?.reduce((sum, p) => sum + (p.total_gross_salary || 0), 0) || 0,
        totalNetSalary: data?.reduce((sum, p) => sum + (p.total_net_salary || 0), 0) || 0,
        totalINSSEmployee: data?.reduce((sum, p) => sum + (p.total_inss_employee || 0), 0) || 0,
        totalINSSEmployer: data?.reduce((sum, p) => sum + (p.total_inss_employer || 0), 0) || 0,
        totalFGTS: data?.reduce((sum, p) => sum + (p.total_fgts || 0), 0) || 0,
        totalIRRF: data?.reduce((sum, p) => sum + (p.total_irrf || 0), 0) || 0,
        avgEmployees: data?.length ? Math.round(data.reduce((sum, p) => sum + (p.total_employees || 0), 0) / data.length) : 0
      }
    };
  }
});

// ============================================================================
// 4. QUERY FINANCIAL SUMMARY TOOL - Resumo financeiro
// ============================================================================

export const queryFinancialSummaryTool = tool({
  name: 'query_financial_summary',
  description: 'Obtém um resumo financeiro consolidado de um cliente para um período específico. Use para responder perguntas sobre visão geral financeira, DRE simplificada, etc.',
  parameters: z.object({
    clientId: z.string().uuid().describe('ID do cliente (obrigatório)'),
    startDate: z.string().describe('Data inicial no formato YYYY-MM-DD'),
    endDate: z.string().describe('Data final no formato YYYY-MM-DD')
  }),
  execute: async ({ clientId, startDate, endDate }, { context }) => {
    const supabase = context.supabase as SupabaseClient;
    
    // Buscar notas fiscais de saída (receitas)
    const { data: outgoingInvoices } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('client_id', clientId)
      .eq('type', 'outgoing')
      .gte('issue_date', startDate)
      .lte('issue_date', endDate);
    
    // Buscar notas fiscais de entrada (custos)
    const { data: incomingInvoices } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('client_id', clientId)
      .eq('type', 'incoming')
      .gte('issue_date', startDate)
      .lte('issue_date', endDate);
    
    // Buscar folha de pagamento
    const { data: payroll } = await supabase
      .from('payroll_summaries')
      .select('total_gross_salary, total_inss_employer, total_fgts')
      .eq('client_id', clientId);
    
    // Buscar transações bancárias
    const { data: transactions } = await supabase
      .from('bank_transactions')
      .select('amount, type')
      .eq('client_id', clientId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);
    
    const totalRevenue = outgoingInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
    const totalCosts = incomingInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
    const totalPayroll = payroll?.reduce((sum, p) => sum + (p.total_gross_salary || 0) + (p.total_inss_employer || 0) + (p.total_fgts || 0), 0) || 0;
    const bankDebits = transactions?.filter(t => t.type === 'debit').reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) || 0;
    const bankCredits = transactions?.filter(t => t.type === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    
    return {
      period: { startDate, endDate },
      revenue: {
        total: totalRevenue,
        invoiceCount: outgoingInvoices?.length || 0
      },
      costs: {
        purchases: totalCosts,
        payroll: totalPayroll,
        total: totalCosts + totalPayroll
      },
      grossProfit: totalRevenue - totalCosts - totalPayroll,
      grossMargin: totalRevenue > 0 ? ((totalRevenue - totalCosts - totalPayroll) / totalRevenue * 100) : 0,
      banking: {
        credits: bankCredits,
        debits: bankDebits,
        net: bankCredits - bankDebits
      }
    };
  }
});

// ============================================================================
// EXPORTAR TODAS AS TOOLS
// ============================================================================

export const tools = [
  queryInvoicesTool,
  queryBankTransactionsTool,
  queryPayrollTool,
  queryFinancialSummaryTool
];

