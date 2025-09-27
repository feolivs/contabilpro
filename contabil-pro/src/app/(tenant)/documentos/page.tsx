import Link from 'next/link'

export default function DocumentosPage() {
  return (
    <section className='space-y-4 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Documentos</h1>
        <Link className='text-sm text-primary' href='/dashboard'>
          Voltar para o dashboard
        </Link>
      </div>
      <p className='text-sm text-muted-foreground'>
        Area de documentos em construcao. Em breve voce vera os widgets e workflows dedicados aqui.
      </p>
    </section>
  )
}
