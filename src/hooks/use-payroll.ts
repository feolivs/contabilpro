import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';

export interface PayrollSummary {
  id: string;
  document_id: string;
  client_id: string;
  user_id: string;
  reference_month: number;
  reference_year: number;
  total_employees: number;
  total_gross_salary: number;
  total_inss_employee: number;
  total_inss_employer: number;
  total_fgts: number;
  total_irrf: number;
  total_other_discounts: number;
  total_net_salary: number;
  inss_employer_enabled: boolean;
  fgts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

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

interface UsePayrollDetailParams {
  payrollId: string;
  enabled?: boolean;
}

export function usePayrollDetail({ payrollId, enabled = true }: UsePayrollDetailParams) {
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: ['payroll', payrollId],
    queryFn: async (): Promise<PayrollSummary> => {
      const { data, error } = await supabase
        .from('payroll_summaries')
        .select('*')
        .eq('id', payrollId)
        .single();

      if (error) {
        console.error('Error fetching payroll detail:', error);
        throw new Error(`Erro ao buscar folha de pagamento: ${error.message}`);
      }

      return data;
    },
    enabled: enabled && !!payrollId,
  });
}

// ============================================================================
// HOOK: Estatísticas de folha
// ============================================================================

interface PayrollStats {
  totalMonths: number;
  avgEmployees: number;
  avgGrossSalary: number;
  avgNetSalary: number;
  avgSalaryPerEmployee: number;
  totalPaid: number;
  totalEncargos: number;
  encargosPercentage: number;
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
          totalMonths: 0,
          avgEmployees: 0,
          avgGrossSalary: 0,
          avgNetSalary: 0,
          avgSalaryPerEmployee: 0,
          totalPaid: 0,
          totalEncargos: 0,
          encargosPercentage: 0,
        };
      }

      const totalMonths = data.length;
      const totalEmployees = data.reduce((sum, p) => sum + p.total_employees, 0);
      const totalGrossSalary = data.reduce((sum, p) => sum + p.total_gross_salary, 0);
      const totalNetSalary = data.reduce((sum, p) => sum + p.total_net_salary, 0);
      const totalEncargos = data.reduce(
        (sum, p) =>
          sum +
          p.total_inss_employee +
          p.total_inss_employer +
          p.total_fgts +
          p.total_irrf,
        0
      );

      return {
        totalMonths,
        avgEmployees: Math.round(totalEmployees / totalMonths),
        avgGrossSalary: Math.round(totalGrossSalary / totalMonths),
        avgNetSalary: Math.round(totalNetSalary / totalMonths),
        avgSalaryPerEmployee:
          totalEmployees > 0
            ? Math.round(totalGrossSalary / totalEmployees)
            : 0,
        totalPaid: totalNetSalary,
        totalEncargos,
        encargosPercentage:
          totalGrossSalary > 0
            ? Math.round((totalEncargos / totalGrossSalary) * 100 * 100) / 100
            : 0,
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

