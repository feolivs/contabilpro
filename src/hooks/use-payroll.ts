import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/supabase/database.types';

export type PayrollSummary = Tables<'payroll_summaries'>;
export type PayrollEntry = Tables<'payroll_entries'>;

interface UsePayrollParams {
  clientId: string;
  referenceYear?: number;
  enabled?: boolean;
}

export function usePayroll({ clientId, referenceYear, enabled = true }: UsePayrollParams) {
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: ['payroll', clientId, referenceYear],
    queryFn: async (): Promise<PayrollSummary[]> => {
      let query = supabase
        .from('payroll_summaries')
        .select('*')
        .eq('client_id', clientId)
        .order('reference_year', { ascending: false })
        .order('reference_month', { ascending: false });

      if (referenceYear) {
        query = query.eq('reference_year', referenceYear);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payroll:', error);
        throw new Error(`Erro ao buscar folhas de pagamento: ${error.message}`);
      }

      return data || [];
    },
    enabled: enabled && !!clientId,
  });
}

// ============================================================================
// HOOK: Buscar folha específica
// ============================================================================

interface PayrollDetail {
  summary: PayrollSummary;
  entries: PayrollEntry[];
}

export function usePayrollDetail(payrollId: string, enabled = true) {
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: ['payroll', payrollId],
    queryFn: async (): Promise<PayrollDetail> => {
      // Buscar summary
      const { data: summary, error: summaryError } = await supabase
        .from('payroll_summaries')
        .select('*')
        .eq('id', payrollId)
        .single();

      if (summaryError) {
        console.error('Error fetching payroll summary:', summaryError);
        throw new Error(`Erro ao buscar folha de pagamento: ${summaryError.message}`);
      }

      // Buscar entries
      const { data: entries, error: entriesError } = await supabase
        .from('payroll_entries')
        .select('*')
        .eq('payroll_summary_id', payrollId)
        .order('employee_name', { ascending: true });

      if (entriesError) {
        console.error('Error fetching payroll entries:', entriesError);
        throw new Error(`Erro ao buscar lançamentos: ${entriesError.message}`);
      }

      return {
        summary,
        entries: entries || [],
      };
    },
    enabled: enabled && !!payrollId,
  });
}

// ============================================================================
// HOOK: Estatísticas de folha
// ============================================================================

export interface PayrollStats {
  totalEmployees: number;
  totalGrossSalary: number;
  totalNetSalary: number;
  averageGrossSalary: number;
  averageNetSalary: number;
  monthsWithData: number;
}

interface UsePayrollStatsParams {
  clientId: string;
  startYear?: number;
  endYear?: number;
  enabled?: boolean;
}

export function usePayrollStats({
  clientId,
  startYear,
  endYear,
  enabled = true,
}: UsePayrollStatsParams) {
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: ['payroll-stats', clientId, startYear, endYear],
    queryFn: async (): Promise<PayrollStats> => {
      let query = supabase
        .from('payroll_summaries')
        .select('*')
        .eq('client_id', clientId);

      if (startYear) {
        query = query.gte('reference_year', startYear);
      }

      if (endYear) {
        query = query.lte('reference_year', endYear);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payroll stats:', error);
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return {
          totalEmployees: 0,
          totalGrossSalary: 0,
          totalNetSalary: 0,
          averageGrossSalary: 0,
          averageNetSalary: 0,
          monthsWithData: 0,
        };
      }

      const monthsWithData = data.length;
      const totalEmployees = data.reduce((sum: number, p: PayrollSummary) => sum + p.total_employees, 0);
      const totalGrossSalary = data.reduce((sum: number, p: PayrollSummary) => sum + p.total_gross_salary, 0);
      const totalNetSalary = data.reduce((sum: number, p: PayrollSummary) => sum + p.total_net_salary, 0);

      return {
        totalEmployees: Math.round(totalEmployees / monthsWithData),
        totalGrossSalary,
        totalNetSalary,
        averageGrossSalary: Math.round(totalGrossSalary / monthsWithData),
        averageNetSalary: Math.round(totalNetSalary / monthsWithData),
        monthsWithData,
      };
    },
    enabled: enabled && !!clientId,
  });
}

// ============================================================================
// HELPER: Formatar competência
// ============================================================================

export function formatPayrollReference(month: number, year: number): string {
  if (month === 13) {
    return `13º Salário ${year}`;
  }

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  return `${monthNames[month - 1]} ${year}`;
}

// ============================================================================
// HELPER: Formatar moeda
// ============================================================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

