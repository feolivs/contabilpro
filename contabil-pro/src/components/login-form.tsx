'use client'

import { useActionState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

import { loginAction } from '@/actions/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { initialLoginFormState } from '@/lib/auth-helpers'
import { cn } from '@/lib/utils'

import { toast } from 'sonner'

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const searchParams = useSearchParams()
  const next = searchParams.get('next')

  const [state, formAction, isPending] = useActionState(loginAction, initialLoginFormState)

  // Log para debug
  useEffect(() => {
    if (state.status !== 'idle') {
      console.log('Login form state:', state)
    }
  }, [state])

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props} data-testid='login-form'>
      <Card>
        <CardHeader>
          <CardTitle>Entre na sua conta</CardTitle>
          <CardDescription>Digite seu email e senha para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            {/* Campo hidden para o parâmetro next */}
            {next && <input type='hidden' name='next' value={next} />}

            <div className='flex flex-col gap-6'>
              {/* Mensagem de erro */}
              {state.status === 'error' && state.message && (
                <Alert variant='destructive'>
                  <AlertDescription>{state.message}</AlertDescription>
                </Alert>
              )}

              <div className='grid gap-3'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder='seu@email.com'
                  required
                  disabled={isPending}
                  data-testid='email-input'
                  aria-invalid={state.fieldErrors?.email ? 'true' : 'false'}
                />
                {state.fieldErrors?.email && (
                  <p className='text-sm text-destructive'>{state.fieldErrors.email[0]}</p>
                )}
              </div>

              <div className='grid gap-3'>
                <div className='flex items-center'>
                  <Label htmlFor='password'>Senha</Label>
                  <a
                    href='/forgot-password'
                    className='ml-auto inline-block text-sm underline-offset-4 hover:underline'
                  >
                    Esqueceu sua senha?
                  </a>
                </div>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  required
                  disabled={isPending}
                  data-testid='password-input'
                  aria-invalid={state.fieldErrors?.password ? 'true' : 'false'}
                />
                {state.fieldErrors?.password && (
                  <p className='text-sm text-destructive'>{state.fieldErrors.password[0]}</p>
                )}
              </div>

              <div className='flex flex-col gap-3'>
                <Button
                  type='submit'
                  className='w-full'
                  disabled={isPending}
                  data-testid='login-button'
                >
                  {isPending ? 'Entrando...' : 'Entrar'}
                </Button>

                <Button
                  variant='outline'
                  className='w-full'
                  disabled={isPending}
                  type='button'
                  onClick={() => {
                    // TODO: Implementar OAuth com Google
                    toast.info('Login com Google em breve', {
                      description: 'Estamos finalizando a integração.',
                    })
                  }}
                >
                  Entrar com Google
                </Button>
              </div>
            </div>

            <div className='mt-4 text-center text-sm'>
              Não tem uma conta?{' '}
              <a href='/register' className='underline underline-offset-4'>
                Criar conta
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
