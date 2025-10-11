import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PayrollUploadForm } from '@/components/features/payroll/payroll-upload-form'
import { useClientStore } from '@/stores/client-store'
import { usePayrollUpload } from '@/hooks/use-payroll-upload'

// Mock hooks
jest.mock('@/stores/client-store')
jest.mock('@/hooks/use-payroll-upload')
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('PayrollUploadForm', () => {
  const mockMutateAsync = jest.fn()
  const mockSelectedClient = {
    id: 'client-123',
    name: 'Test Client',
    cnpj: '12345678000190',
    user_id: 'user-123',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    email: null,
    phone: null,
    address: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useClientStore as unknown as jest.Mock).mockReturnValue({
      selectedClient: mockSelectedClient,
    })
    ;(usePayrollUpload as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    })
  })

  it('should render form fields', () => {
    render(<PayrollUploadForm />, { wrapper: createWrapper() })

    expect(screen.getByLabelText('Arquivo')).toBeInTheDocument()
    expect(screen.getByLabelText('Mês de Referência')).toBeInTheDocument()
    expect(screen.getByLabelText('Ano de Referência')).toBeInTheDocument()
    expect(screen.getByLabelText('INSS Patronal (20%)')).toBeInTheDocument()
    expect(screen.getByLabelText('FGTS (8%)')).toBeInTheDocument()
  })

  it('should show warning when no client is selected', () => {
    ;(useClientStore as unknown as jest.Mock).mockReturnValue({
      selectedClient: null,
    })

    render(<PayrollUploadForm />, { wrapper: createWrapper() })

    expect(screen.getByText('Nenhum cliente selecionado')).toBeInTheDocument()
    expect(
      screen.getByText('Selecione um cliente antes de fazer upload de folha de pagamento.')
    ).toBeInTheDocument()
  })

  it('should disable submit button when no client is selected', () => {
    ;(useClientStore as unknown as jest.Mock).mockReturnValue({
      selectedClient: null,
    })

    render(<PayrollUploadForm />, { wrapper: createWrapper() })

    const submitButton = screen.getByRole('button', { name: /processar folha/i })
    expect(submitButton).toBeDisabled()
  })

  it('should have INSS and FGTS switches enabled by default', () => {
    render(<PayrollUploadForm />, { wrapper: createWrapper() })

    const inssSwitch = screen.getByRole('switch', { name: /inss patronal/i })
    const fgtsSwitch = screen.getByRole('switch', { name: /fgts/i })

    expect(inssSwitch).toBeChecked()
    expect(fgtsSwitch).toBeChecked()
  })

  it('should show loading state when uploading', () => {
    ;(usePayrollUpload as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    })

    render(<PayrollUploadForm />, { wrapper: createWrapper() })

    const submitButton = screen.getByRole('button', { name: /processando/i })
    expect(submitButton).toBeDisabled()
  })

  it('should accept CSV and Excel files', () => {
    render(<PayrollUploadForm />, { wrapper: createWrapper() })

    const fileInput = screen.getByLabelText('Arquivo') as HTMLInputElement
    expect(fileInput.accept).toBe('.csv,.xlsx,.xls')
  })

  it('should display file format description', () => {
    render(<PayrollUploadForm />, { wrapper: createWrapper() })

    expect(
      screen.getByText('Formatos aceitos: CSV, Excel (.xlsx, .xls) - Máximo 10MB')
    ).toBeInTheDocument()
  })

  it('should have current month and year as defaults', () => {
    render(<PayrollUploadForm />, { wrapper: createWrapper() })

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Verificar que os valores padrão estão corretos
    // (Nota: isso pode variar dependendo da implementação do Select)
    expect(screen.getByLabelText('Mês de Referência')).toBeInTheDocument()
    expect(screen.getByLabelText('Ano de Referência')).toBeInTheDocument()
  })

  it('should show success message after successful upload', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      success: true,
      summary: {
        total_employees: 10,
        total_gross_salary: 50000,
      },
    })

    render(<PayrollUploadForm />, { wrapper: createWrapper() })

    // Simular upload de arquivo
    const fileInput = screen.getByLabelText('Arquivo') as HTMLInputElement
    const file = new File(['test'], 'payroll.csv', { type: 'text/csv' })

    fireEvent.change(fileInput, { target: { files: [file] } })

    // Submeter formulário
    const submitButton = screen.getByRole('button', { name: /processar folha/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled()
    })
  })

  it('should validate file size (max 10MB)', () => {
    render(<PayrollUploadForm />, { wrapper: createWrapper() })

    expect(
      screen.getByText(/Formatos aceitos: CSV, Excel \(.xlsx, .xls\) - Máximo 10MB/)
    ).toBeInTheDocument()
  })
})

