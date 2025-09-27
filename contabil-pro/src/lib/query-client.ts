import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Com SSR, geralmente queremos definir um staleTime padrÃ£o
        // acima de 0 para evitar refetch imediato no cliente
        staleTime: 60 * 1000, // 1 minuto
        gcTime: 5 * 60 * 1000, // 5 minutos (anteriormente cacheTime)
        retry: (failureCount: number, error: unknown) => {
          // NÃ£o tentar novamente em erros 4xx
          if (error instanceof Error && 'status' in error) {
            const status = (error as { status?: number }).status
            if (status >= 400 && status < 500) {
              return false
            }
          }
          return failureCount < 3
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Servidor: sempre criar um novo query client
    return makeQueryClient()
  } else {
    // Navegador: criar um query client se nÃ£o existir
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}
