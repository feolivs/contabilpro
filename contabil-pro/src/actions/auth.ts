'use server'

import { redirect } from 'next/navigation'

import { type LoginFormState } from '@/lib/auth-helpers'
import { createServerClient } from '@/lib/supabase'

import type { PostgrestError } from '@supabase/supabase-js'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

const userTenantRowSchema = z.object({
  tenant_id: z.string(),
  role: z.string(),
  joined_at: z.string(),
  slug: z.string(),
  name: z.string(),
  status: z.string(),
})

type UserTenantRow = z.infer<typeof userTenantRowSchema>

type NormalizedUserTenant = {
  tenant_id: string
  role: string
  joined_at: string
  tenants: {
    id: string
    slug: string
    name: string
    status: string
  }
}

type UserTenantsResult = {
  tenants: NormalizedUserTenant[]
  error: PostgrestError | Error | null
}

export async function loginAction(
  prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  let redirectUrl: string | null = null

  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const next = formData.get('next') as string | null

    const validationResult = loginSchema.safeParse({ email, password })

    if (!validationResult.success) {
      return {
        status: 'error',
        message: 'Dados inválidos',
        fieldErrors: validationResult.error.flatten().fieldErrors,
      }
    }

    const { email: validEmail, password: validPassword } = validationResult.data

    const supabase = await createServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validEmail,
      password: validPassword,
    })

    if (error) {
      console.error('Erro de autenticação:', error)

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

    const { tenants: userTenants, error: userTenantsError } = await getUserTenants(
      data.session.user.id
    )

    if (userTenantsError || !userTenants || userTenants.length === 0) {
      console.error('Erro ao buscar tenants do usuário:', userTenantsError)

      let message = 'Usuário não associado a nenhuma empresa ativa.'

      if (userTenantsError) {
        message = 'Erro ao verificar empresas do usuário. Tente novamente.'
      } else if (!userTenants || userTenants.length === 0) {
        message =
          'Sua conta ainda não foi associada a nenhuma empresa. Entre em contato com o administrador para configurar seu acesso.'
      }

      return {
        status: 'error',
        message,
      }
    }

    // Seleção de tenant:
    // 1. Se houver apenas um tenant -> use esse
    // 2. Se houver vários -> use o mais recente (primeiro na lista ordenada)
    const selectedUserTenant = userTenants[0]
    const tenant = Array.isArray(selectedUserTenant.tenants)
      ? selectedUserTenant.tenants[0]
      : selectedUserTenant.tenants
    const tenantId = selectedUserTenant.tenant_id

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

    if (userTenants.length > 1) {
      console.log(
        `Usuário tem ${userTenants.length} empresas. Selecionando: ${tenant.name} (${tenant.slug})`
      )
    }

    redirectUrl = `/t/${tenant.slug}/dashboard`

    if (next && next !== 'null' && next.trim() !== '') {
      try {
        const nextUrl = new URL(next, 'http://localhost')
        const nextPath = nextUrl.pathname

        if (nextPath.startsWith('/t/')) {
          const pathSegments = nextPath.split('/').filter(Boolean)
          if (pathSegments.length >= 2 && pathSegments[0] === 't') {
            const nextTenantSlug = pathSegments[1]

            if (nextTenantSlug === tenant.slug) {
              redirectUrl = nextPath
            }
          }
        }
      } catch {
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

  if (redirectUrl) {
    redirect(redirectUrl)
  }

  return {
    status: 'error',
    message: 'Erro interno: redirecionamento não configurado.',
  }
}

async function getUserTenants(userId: string): Promise<UserTenantsResult> {
  const supabase = await createServerClient()

  const { data, error } = await supabase.rpc('get_user_tenants', {
    p_user_id: userId,
  })

  if (error || !data) {
    console.error('Erro ao buscar tenants do usuário:', error)
    return { tenants: [], error }
  }

  const parsedTenants = userTenantRowSchema.array().safeParse(data)

  if (!parsedTenants.success) {
    console.error('Formato de tenant inválido retornado pelo Supabase:', parsedTenants.error)
    return { tenants: [], error: new Error('Invalid tenant payload') }
  }

  const normalizedTenants = parsedTenants.data.map<NormalizedUserTenant>((row: UserTenantRow) => ({
    tenant_id: row.tenant_id,
    role: row.role,
    joined_at: row.joined_at,
    tenants: {
      id: row.tenant_id,
      slug: row.slug,
      name: row.name,
      status: row.status,
    },
  }))

  return { tenants: normalizedTenants, error: null }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Erro ao fazer logout:', error)
  }

  redirect('/login')
}
