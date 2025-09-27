import Link from 'next/link'

export default function LandingPage() {
  const highlights = [
    {
      title: 'IA para classificacao',
      body: 'Sugestoes automaticas de conta e centro de custo com explicacao auditavel.',
    },
    {
      title: 'Automacao fiscal',
      body: 'NFe, NFSe nacional e calculo de guias sem planilha manual.',
    },
    {
      title: 'Open Finance',
      body: 'Conciliacao bancaria assistida com rastreabilidade completa.',
    },
  ]

  return (
    <div className='flex min-h-screen flex-col'>
      <header className='flex h-14 items-center justify-between border-b px-6'>
        <Link className='font-semibold' href='/'>
          ContabilPRO
        </Link>
        <nav className='flex gap-4 text-sm'>
          <Link href='#features'>Recursos</Link>
          <Link href='/pricing'>Precos</Link>
          <Link href='/login'>Entrar</Link>
        </nav>
      </header>

      <main className='flex-1'>
        <section className='flex flex-col items-center gap-6 px-6 py-20 text-center'>
          <p className='text-sm font-medium text-primary'>Multi-tenant com RLS pronto para uso</p>
          <h1 className='text-4xl font-bold sm:text-5xl'>
            Contabilidade moderna com IA e automacao
          </h1>
          <p className='max-w-2xl text-sm text-muted-foreground'>
            Uma so plataforma para importar XML, conciliar extratos do Open Finance, gerar guias
            fiscais e colaborar com os clientes em tempo real.
          </p>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Link
              className='rounded bg-primary px-5 py-2 text-sm font-medium text-primary-foreground'
              href='/register'
            >
              Comecar gratis
            </Link>
            <Link className='rounded border px-5 py-2 text-sm font-medium' href='/pricing'>
              Ver planos
            </Link>
          </div>
        </section>

        <section id='features' className='bg-muted/30 px-6 py-16'>
          <div className='mx-auto grid max-w-5xl gap-6 md:grid-cols-3'>
            {highlights.map(feature => (
              <article
                key={feature.title}
                className='rounded-lg border bg-background p-6 shadow-sm'
              >
                <h2 className='text-lg font-semibold'>{feature.title}</h2>
                <p className='mt-2 text-sm text-muted-foreground'>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className='flex flex-col items-center gap-2 border-t px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between'>
        <span>(c) {new Date().getFullYear()} ContabilPRO</span>
        <div className='flex gap-4'>
          <Link href='/about'>Sobre</Link>
          <Link href='/privacidade'>Privacidade</Link>
          <Link href='/termos'>Termos</Link>
        </div>
      </footer>
    </div>
  )
}
