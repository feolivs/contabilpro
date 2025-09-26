import React from 'react'
import { ThemeProvider } from 'next-themes'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'

// Mock data para testes
export const mockTenant = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Tenant',
  slug: 'test-tenant',
  document: '12345678000195',
  email: 'test@tenant.com',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'test@user.com',
  name: 'Test User',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockClient = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  tenant_id: mockTenant.id,
  name: 'Test Client',
  email: 'test@client.com',
  document: '12345678901',
  document_type: 'cpf' as const,
  phone: '(11) 99999-9999',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockAccount = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  tenant_id: mockTenant.id,
  code: '1.1.01.001',
  name: 'Caixa',
  type: 'asset' as const,
  level: 4,
  is_active: true,
  accepts_entries: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockEntry = {
  id: '550e8400-e29b-41d4-a716-446655440004',
  tenant_id: mockTenant.id,
  client_id: mockClient.id,
  account_id: mockAccount.id,
  description: 'Test Entry',
  amount: 1000.0,
  type: 'debit' as const,
  date: new Date().toISOString().split('T')[0],
  created_by: mockUser.id,
  created_at: new Date().toISOString(),
}

// Provider personalizado para testes
interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute='class' defaultTheme='light'>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

// Função customizada de render
const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// Helper para simular sessão autenticada
export const mockAuthSession = {
  user: {
    id: mockUser.id,
    email: mockUser.email,
    app_metadata: {
      tenant_id: mockTenant.id,
      role: 'owner',
    },
  },
  tenant_id: mockTenant.id,
  role: 'owner',
}

// Helper para criar Server Action mock
export const createServerActionMock = <T extends any[], R>(
  implementation?: (...args: T) => Promise<{ success: boolean; data?: R; error?: string }>,
) => {
  return vi.fn().mockImplementation(implementation || (async () => ({ success: true, data: null })))
}

// Helper para simular delay em testes assíncronos
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper para criar dados de formulário
export const createFormData = (data: Record<string, string>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
