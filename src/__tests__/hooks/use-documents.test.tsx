import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDocuments, useDocumentStats, useDeleteDocument, useReprocessDocument } from '@/hooks/use-documents'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return Wrapper
}

describe('useDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch documents successfully', async () => {
    const mockDocuments = [
      {
        id: '1',
        filename: 'test.xml',
        type: 'nfe',
        status: 'completed',
        client_id: 'client-1',
        user_id: 'test-user-id',
        clients: { id: 'client-1', name: 'Test Client', cnpj: '12345678000190' },
      },
    ]

    const mockSupabase = createClient()
    ;(mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockDocuments, error: null }),
    })

    const { result } = renderHook(() => useDocuments(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockDocuments)
  })

  it('should apply filters correctly', async () => {
    const mockSupabase = createClient()
    const eqMock = jest.fn().mockReturnThis()
    
    ;(mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: eqMock,
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })

    renderHook(() => useDocuments({ clientId: 'client-1', type: 'nfe', status: 'completed' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(eqMock).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(eqMock).toHaveBeenCalledWith('client_id', 'client-1')
      expect(eqMock).toHaveBeenCalledWith('type', 'nfe')
      expect(eqMock).toHaveBeenCalledWith('status', 'completed')
    })
  })

  it('should not fetch when user is not authenticated', () => {
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
    })

    const { result } = renderHook(() => useDocuments(), {
      wrapper: createWrapper(),
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })
})

describe('useDocumentStats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should calculate stats correctly', async () => {
    const mockDocuments = [
      { status: 'completed', type: 'nfe' },
      { status: 'completed', type: 'ofx' },
      { status: 'failed', type: 'nfe' },
      { status: 'processing', type: 'nfe' },
      { status: 'pending', type: 'ofx' },
    ]

    const mockSupabase = createClient()
    ;(mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockDocuments, error: null }),
    })

    const { result } = renderHook(() => useDocumentStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    expect(result.current.data).toEqual({
      total: 5,
      completed: 2,
      failed: 1,
      processing: 1,
      pending: 1,
      byType: { nfe: 3, ofx: 2 },
      successRate: 40, // 2/5 = 40%
    })
  })
})

describe('useDeleteDocument', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should delete document and cleanup storage', async () => {
    const mockSupabase = createClient()
    const mockDocument = { storage_path: 'user/client/nfe/test.xml' }

    ;(mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockDocument, error: null }),
      delete: jest.fn().mockResolvedValue({ error: null }),
    })

    ;(mockSupabase.storage.from as jest.Mock).mockReturnValue({
      remove: jest.fn().mockResolvedValue({ error: null }),
    })

    const { result } = renderHook(() => useDeleteDocument(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync('doc-id')

    await waitFor(() => {
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('documents')
      expect(mockSupabase.from).toHaveBeenCalledWith('documents')
    })
  })
})

describe('useReprocessDocument', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reset document status and trigger Edge Function', async () => {
    const mockSupabase = createClient()
    
    ;(mockSupabase.from as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    })

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })

    const { result } = renderHook(() => useReprocessDocument(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      documentId: 'doc-id',
      clientId: 'client-id',
      type: 'nfe',
    })

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('documents')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/parse-xml'),
        expect.any(Object)
      )
    })
  })

  it('should use parse-ofx for OFX documents', async () => {
    const mockSupabase = createClient()
    
    ;(mockSupabase.from as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    })

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })

    const { result } = renderHook(() => useReprocessDocument(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      documentId: 'doc-id',
      clientId: 'client-id',
      type: 'ofx',
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/parse-ofx'),
        expect.any(Object)
      )
    })
  })
})

