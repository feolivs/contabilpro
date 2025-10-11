import { render, screen } from '@testing-library/react'
import { PayrollCard } from '@/components/features/payroll/payroll-card'
import type { PayrollSummary } from '@/hooks/use-payroll'

const mockPayroll: PayrollSummary = {
  id: '123',
  document_id: 'doc-123',
  client_id: 'client-123',
  user_id: 'user-123',
  reference_month: 1,
  reference_year: 2024,
  total_employees: 10,
  total_gross_salary: 50000,
  total_inss_employee: 5000,
  total_inss_employer: 10000,
  total_fgts: 4000,
  total_irrf: 2000,
  total_other_discounts: 500,
  total_net_salary: 42500,
  inss_employer_enabled: true,
  fgts_enabled: true,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
}

describe('PayrollCard', () => {
  const mockOnViewDetails = jest.fn()
  const mockOnReprocess = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render payroll information correctly', () => {
    render(
      <PayrollCard
        payroll={mockPayroll}
        onViewDetails={mockOnViewDetails}
        onReprocess={mockOnReprocess}
        onDelete={mockOnDelete}
      />
    )

    // Verificar competência (formato: "Janeiro 2024" sem barra)
    expect(screen.getByText('Janeiro 2024')).toBeInTheDocument()

    // Verificar número de funcionários
    expect(screen.getByText(/10/)).toBeInTheDocument()

    // Verificar salários (formatados)
    expect(screen.getByText(/R\$ 50\.000,00/)).toBeInTheDocument() // Bruto
    expect(screen.getByText(/R\$ 42\.500,00/)).toBeInTheDocument() // Líquido
  })

  it('should display INSS Patronal label when enabled', () => {
    render(
      <PayrollCard
        payroll={mockPayroll}
        onViewDetails={mockOnViewDetails}
        onReprocess={mockOnReprocess}
        onDelete={mockOnDelete}
      />
    )

    // Verifica se o label "INSS Patronal:" está presente
    expect(screen.getByText(/INSS Patronal:/)).toBeInTheDocument()
  })

  it('should display FGTS label when enabled', () => {
    render(
      <PayrollCard
        payroll={mockPayroll}
        onViewDetails={mockOnViewDetails}
        onReprocess={mockOnReprocess}
        onDelete={mockOnDelete}
      />
    )

    // Verifica se o label "FGTS:" está presente
    expect(screen.getByText(/FGTS:/)).toBeInTheDocument()
  })

  it('should display zero values when encargos disabled', () => {
    const payrollWithoutEncargos: PayrollSummary = {
      ...mockPayroll,
      inss_employer_enabled: false,
      fgts_enabled: false,
      total_inss_employer: null,
      total_fgts: null,
    }

    render(
      <PayrollCard
        payroll={payrollWithoutEncargos}
        onViewDetails={mockOnViewDetails}
        onReprocess={mockOnReprocess}
        onDelete={mockOnDelete}
      />
    )

    // Labels ainda aparecem, mas com valores zerados
    expect(screen.getByText(/INSS Patronal:/)).toBeInTheDocument()
    expect(screen.getByText(/FGTS:/)).toBeInTheDocument()
  })

  it('should handle 13th salary month correctly', () => {
    const payroll13th: PayrollSummary = {
      ...mockPayroll,
      reference_month: 13,
    }

    render(
      <PayrollCard
        payroll={payroll13th}
        onViewDetails={mockOnViewDetails}
        onReprocess={mockOnReprocess}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('13º Salário 2024')).toBeInTheDocument()
  })

  it('should handle null values gracefully', () => {
    const payrollWithNulls: PayrollSummary = {
      ...mockPayroll,
      total_inss_employer: null,
      total_fgts: null,
      total_irrf: null,
      total_other_discounts: null,
    }

    render(
      <PayrollCard
        payroll={payrollWithNulls}
        onViewDetails={mockOnViewDetails}
        onReprocess={mockOnReprocess}
        onDelete={mockOnDelete}
      />
    )

    // Deve renderizar sem erros
    expect(screen.getByText('Janeiro 2024')).toBeInTheDocument()
    // Valores nulos devem aparecer como R$ 0,00
    expect(screen.getAllByText('R$ 0,00').length).toBeGreaterThan(0)
  })
})

