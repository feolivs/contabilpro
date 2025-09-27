export default function ForgotPasswordPage() {
  return (
    <div className='mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6'>
      <header className='space-y-2 text-center'>
        <h1 className='text-2xl font-semibold'>Recuperar senha</h1>
        <p className='text-sm text-muted-foreground'>
          Enviaremos um link de recuperacao para o email informado.
        </p>
      </header>
      <form className='grid gap-4'>
        <div className='grid gap-2'>
          <label className='text-sm font-medium' htmlFor='email'>
            Email cadastrado
          </label>
          <input
            className='rounded border px-3 py-2'
            id='email'
            name='email'
            placeholder='contato@escritorio.com'
            type='email'
            required
          />
        </div>
        <button
          className='rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'
          type='submit'
        >
          Enviar instrucao
        </button>
      </form>
    </div>
  )
}
