export default function RegisterPage() {
  return (
    <div className='mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6'>
      <header className='space-y-2 text-center'>
        <h1 className='text-2xl font-semibold'>Criar conta</h1>
        <p className='text-sm text-muted-foreground'>
          Registre seu escritorio para testar o ContabilPRO.
        </p>
      </header>
      <form className='grid gap-4'>
        <div className='grid gap-2'>
          <label className='text-sm font-medium' htmlFor='name'>
            Nome completo
          </label>
          <input
            className='rounded border px-3 py-2'
            id='name'
            name='name'
            placeholder='Maria Silva'
          />
        </div>
        <div className='grid gap-2'>
          <label className='text-sm font-medium' htmlFor='email'>
            Email corporativo
          </label>
          <input
            className='rounded border px-3 py-2'
            id='email'
            name='email'
            placeholder='contato@escritorio.com'
            type='email'
          />
        </div>
        <div className='grid gap-2'>
          <label className='text-sm font-medium' htmlFor='password'>
            Senha
          </label>
          <input
            className='rounded border px-3 py-2'
            id='password'
            name='password'
            type='password'
          />
        </div>
        <button
          className='rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'
          type='submit'
        >
          Criar conta
        </button>
      </form>
    </div>
  )
}
