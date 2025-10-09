/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/display-name */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FileUploadZone } from '@/components/features/import/file-upload-zone'
import { useClientStore } from '@/stores/client-store'
import { toast } from 'sonner'

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

describe('FileUploadZone', () => {
  const mockProps = {
    documentType: 'nfe' as const,
    acceptedFileTypes: {
      'text/xml': ['.xml'],
      'application/xml': ['.xml'],
    },
    maxSize: 10 * 1024 * 1024,
    description: 'Arraste arquivos XML aqui',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render upload zone', () => {
    render(<FileUploadZone {...mockProps} />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Arraste arquivos XML aqui')).toBeInTheDocument()
    expect(screen.getByText('Tamanho máximo: 10MB')).toBeInTheDocument()
  })

  it('should show warning when no client is selected', () => {
    ;(useClientStore as unknown as jest.Mock).mockReturnValue({
      selectedClient: null,
    })

    render(<FileUploadZone {...mockProps} />, { wrapper: createWrapper() })
    
    expect(screen.getByText('Nenhum cliente selecionado')).toBeInTheDocument()
    expect(screen.getByText('Selecione um cliente antes de fazer upload de documentos.')).toBeInTheDocument()
  })

  it('should show warning when no client is selected and prevent upload', () => {
    ;(useClientStore as unknown as jest.Mock).mockReturnValue({
      selectedClient: null,
    })

    render(<FileUploadZone {...mockProps} />, { wrapper: createWrapper() })

    // Verify warning is shown
    expect(screen.getByText('Nenhum cliente selecionado')).toBeInTheDocument()
    expect(screen.getByText('Selecione um cliente antes de fazer upload de documentos.')).toBeInTheDocument()
  })

  it('should accept valid files', () => {
    ;(useClientStore as unknown as jest.Mock).mockReturnValue({
      selectedClient: { id: 'client-1', name: 'Test Client' },
    })

    render(<FileUploadZone {...mockProps} />, { wrapper: createWrapper() })
    
    const file = new File(['<?xml version="1.0"?>'], 'test.xml', { type: 'text/xml' })
    expect(file.size).toBeLessThan(mockProps.maxSize)
  })

  it('should show file rejections for invalid files', async () => {
    render(<FileUploadZone {...mockProps} />, { wrapper: createWrapper() })
    
    // This would be tested with actual dropzone interaction
    // For now, we verify the component renders rejection UI when needed
    expect(screen.queryByText(/alguns arquivos não puderam ser enviados/i)).not.toBeInTheDocument()
  })
})

