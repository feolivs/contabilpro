// Tipo para o estado do formulário de login
export type LoginFormState = {
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string | null
  fieldErrors?: Record<string, string[]>
}

export const initialLoginFormState: LoginFormState = {
  status: 'idle',
  message: null,
  fieldErrors: {},
}

// Helper para selecionar tenant padrão
export function selectDefaultTenant(userTenants: any[]) {
  if (userTenants.length === 0) {
    return null
  }

  // Lógica: usar o mais recente (primeiro na lista ordenada por joined_at DESC)
  return userTenants[0]
}
