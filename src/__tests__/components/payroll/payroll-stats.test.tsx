import { render, screen } from '@testing-library/react'
import { PayrollStats } from '@/components/features/payroll/payroll-stats'
import type { PayrollStats as PayrollStatsType } from '@/hooks/use-payroll'

// Mock do hook usePayrollStats
jest.mock('@/hooks/use-payroll', () => ({
  ...jest.requireActual('@/hooks/use-payroll'),
  usePayrollStats: jest.fn(),
}))

import { usePayrollStats } from '@/hooks/use-payroll'

const mockStats: PayrollStatsType = {
  totalEmployees: 25,
  totalGrossSalary: 125000,
  totalNetSalary: 100000,
  averageGrossSalary: 5000,
  averageNetSalary: 4000,
  monthsWithData: 6,
}

describe('PayrollStats', () => {
  beforeEach(() => {
    // Mock do hook para retornar dados mockados
    ;(usePayrollStats as jest.Mock).mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render all stat cards', () => {
    render(<PayrollStats stats={mockStats} />)

    // Verificar títulos dos cards
    expect(screen.getByText('Total de Funcionários')).toBeInTheDocument()
    expect(screen.getByText('Salário Bruto Total')).toBeInTheDocument()
    expect(screen.getByText('Salário Líquido Total')).toBeInTheDocument()
    expect(screen.getByText('Meses com Dados')).toBeInTheDocument()
  })

  it('should display total employees correctly', () => {
    render(<PayrollStats stats={mockStats} />)

    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('should display total gross salary formatted', () => {
    render(<PayrollStats stats={mockStats} />)

    expect(screen.getByText(/R\$ 125\.000,00/)).toBeInTheDocument()
  })

  it('should display total net salary formatted', () => {
    render(<PayrollStats stats={mockStats} />)

    expect(screen.getByText(/R\$ 100\.000,00/)).toBeInTheDocument()
  })

  it('should display months with data', () => {
    render(<PayrollStats stats={mockStats} />)

    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('should handle zero values', () => {
    const zeroStats: PayrollStatsType = {
      totalEmployees: 0,
      totalGrossSalary: 0,
      totalNetSalary: 0,
      averageGrossSalary: 0,
      averageNetSalary: 0,
      monthsWithData: 0,
    }

    render(<PayrollStats stats={zeroStats} />)

    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText(/R\$ 0,00/)).toBeInTheDocument()
  })

  it('should render all icons', () => {
    const { container } = render(<PayrollStats stats={mockStats} />)

    // Verificar que os ícones estão presentes (via classes Lucide)
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThanOrEqual(4)
  })
})

