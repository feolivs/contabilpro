'use server'

import { redirect } from 'next/navigation'

import { type LoginFormState } from '@/lib/auth/helpers'
import { createServerClient } from '@/lib/supabase'

import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

// Tipos removidos - não mais necessários sem multi-tenant

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

    console.log('Login bem-sucedido:', {
      userId: data.session.user.id,
      email: data.session.user.email,
    });

    // Redirecionar para dashboard ou página solicitada
    redirectUrl = '/dashboard'

    if (next && next !== 'null' && next.trim() !== '') {
      try {
        const nextUrl = new URL(next, 'http://localhost')
        const nextPath = nextUrl.pathname

        // Usar o caminho solicitado se for válido
        if (nextPath && nextPath !== '/' && !nextPath.startsWith('/login')) {
          redirectUrl = nextPath
        }
      } catch {
        console.log('Parâmetro next inválido, usando dashboard padrão:', next)
      }
    }

    console.log('Login bem-sucedido - redirecionando:', {
      userId: data.session.user.id,
      email: data.session.user.email,
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

// Função getUserTenants removida - não mais necessária sem multi-tenant

export async function logoutAction(): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Erro ao fazer logout:', error)
  }

  redirect('/login')
}
