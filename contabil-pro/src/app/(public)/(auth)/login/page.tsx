import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className='w-full'>
      <div className='text-center mb-8'>
        <h1 className='text-2xl font-bold tracking-tight'>Entre na sua conta</h1>
        <p className='text-sm text-muted-foreground mt-2'>Acesse o sistema ContabilPRO</p>
      </div>
      <LoginForm />
    </div>
  )
}
