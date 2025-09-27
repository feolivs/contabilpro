'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase'
import { type LoginFormState, selectDefaultTenant } from '@/lib/auth-helpers'

// Schema de validação para login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

// Server Action para login
export async function loginAction(
  prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  let redirectUrl: string | null = null

  try {
    // Extrair dados do formulário
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const next = formData.get('next') as string | null

    // Validar dados
    const validationResult = loginSchema.safeParse({ email, password })
    
    if (!validationResult.success) {
      return {
        status: 'error',
        message: 'Dados inválidos',
        fieldErrors: validationResult.error.flatten().fieldErrors,
      }
    }

    const { email: validEmail, password: validPassword } = validationResult.data

    // Criar cliente Supabase
    const supabase = await createServerClient()

    // Tentar fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validEmail,
      password: validPassword,
    })

    if (error) {
      console.error('Erro de autenticação:', error)
      
      // Mapear erros específicos do Supabase
      let message = 'Erro ao fazer login'
      if (error.message.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos'
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Email não confirmado. Verifique sua caixa de entrada.'
      } else if (error.message.includes('Too many requests')) {
        message = 'Muitas tentativas. Tente novamente em alguns minutos.'
      }

      return {
        status: 'error',
        message,
      }
    }

    if (!data.session?.user) {
      return {
        status: 'error',
        message: 'Falha na autenticação',
      }
    }

    // Descobrir tenant(s) do usuário através da tabela user_tenants
    const { tenants: userTenants, error: userTenantsError } = await getUserTenants(data.session.user.id)

    if (userTenantsError || !userTenants || userTenants.length === 0) {
      console.error('Erro ao buscar tenants do usuário:', userTenantsError)

      // Mensagem mais específica baseada no erro
      let message = 'Usuário não associado a nenhuma empresa ativa.'

      if (userTenantsError) {
        message = 'Erro ao verificar empresas do usuário. Tente novamente.'
      } else if (!userTenants || userTenants.length === 0) {
        message = 'Sua conta ainda não foi associada a nenhuma empresa. Entre em contato com o administrador para configurar seu acesso.'
      }

      return {
        status: 'error',
        message,
      }
    }

    // Lógica de seleção de tenant:
    // 1. Se houver apenas 1 tenant → use esse
    // 2. Se houver vários → use o mais recente (primeiro na lista ordenada)
    const selectedUserTenant = userTenants[0]
    const tenant = Array.isArray(selectedUserTenant.tenants)
      ? selectedUserTenant.tenants[0]
      : selectedUserTenant.tenants
    const tenantId = selectedUserTenant.tenant_id

    // Log para debug e informação
    const logInfo = {
      userId: data.session.user.id,
      totalTenants: userTenants.length,
      selectedTenant: {
        id: tenantId,
        slug: tenant.slug,
        name: tenant.name,
        role: selectedUserTenant.role,
      },
      allTenants: userTenants.map(ut => {
        const t = Array.isArray(ut.tenants) ? ut.tenants[0] : ut.tenants
        return {
          slug: t.slug,
          name: t.name,
          role: ut.role,
        }
      }),
    }

    console.log('Tenants disponíveis para o usuário:', logInfo)

    // Se o usuário tem múltiplos tenants, informar qual foi selecionado
    if (userTenants.length > 1) {
      console.log(`Usuário tem ${userTenants.length} empresas. Selecionando: ${tenant.name} (${tenant.slug})`)
      // TODO: Futuramente, implementar seletor de empresa na UI
    }

    // Determinar URL de redirecionamento - SEMPRE com tenant específico
    redirectUrl = `/t/${tenant.slug}/dashboard`

    if (next && next !== 'null' && next.trim() !== '') {
      try {
        // Validar se o next é uma URL válida e segura
        const nextUrl = new URL(next, 'http://localhost')
        const nextPath = nextUrl.pathname

        // Aceitar apenas URLs que começam com /t/ (tenant-specific)
        if (nextPath.startsWith('/t/')) {
          // Verificar se o tenant no next corresponde ao tenant do usuário
          const pathSegments = nextPath.split('/').filter(Boolean)
          if (pathSegments.length >= 2 && pathSegments[0] === 't') {
            const nextTenantSlug = pathSegments[1]

            // Se o tenant no next corresponde ao tenant do usuário, usar o next
            if (nextTenantSlug === tenant.slug) {
              redirectUrl = nextPath
            }
            // Se não corresponde, redirecionar para o dashboard do tenant correto
            // (mantém redirectUrl como está)
          }
        }
        // URLs que não começam com /t/ são ignoradas por segurança
      } catch {
        // Se next não for uma URL válida, usar dashboard padrão
        console.log('Parâmetro next inválido, usando dashboard padrão:', next)
      }
    }

    console.log('Login bem-sucedido - redirecionando:', {
      userId: data.session.user.id,
      email: data.session.user.email,
      tenantId,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      redirectUrl,
      hadNext: !!next,
      originalNext: next,
    })

  } catch (error) {
    console.error('Erro inesperado no login:', error)
    return {
      status: 'error',
      message: 'Erro interno do servidor. Tente novamente.',
    }
  }

  // Redirecionar após login bem-sucedido
  // IMPORTANTE: Sempre redireciona para URL completa com tenant específico
  // O redirect() deve estar FORA do try/catch pois lança NEXT_REDIRECT
  if (redirectUrl) {
    redirect(redirectUrl)
  }

  // Fallback - não deveria chegar aqui
  return {
    status: 'error',
    message: 'Erro interno: redirecionamento não configurado.',
  }
}



// Helper para descobrir tenants de um usuário (Server Action)
async function getUserTenants(userId: string) {
  const supabase = await createServerClient()

  // Usar query SQL direta para evitar problemas com RLS e JOINs complexos
  const { data: userTenants, error } = await supabase.rpc('get_user_tenants', {
    p_user_id: userId
  })

  if (error || !userTenants) {
    console.error('Erro ao buscar tenants do usuário:', error)
    return { tenants: [], error }
  }

  // Mapear para o formato esperado
  const normalizedTenants = userTenants.map((row: any) => ({
    tenant_id: row.tenant_id,
    role: row.role,
    joined_at: row.joined_at,
    tenants: {
      id: row.tenant_id,
      slug: row.slug,
      name: row.name,
      status: row.status
    }
  }))

  return { tenants: normalizedTenants, error: null }
}

// Server Action para logout
export async function logoutAction(): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Erro ao fazer logout:', error)
  }

  redirect('/login')
}
