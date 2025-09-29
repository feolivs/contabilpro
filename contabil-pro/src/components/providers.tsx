'use client'

import { useState } from 'react'
import { ThemeProvider } from 'next-themes'

import { Toaster } from '@/components/ui/sonner'
import { getQueryClient } from '@/lib/query-client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Criar query client no cliente para evitar problemas de hidratação
  const [queryClient] = useState(() => getQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
        {children}
        <Toaster richColors position='top-right' />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
