export default function PricingPage() {
  return (
    <section className='mx-auto flex max-w-4xl flex-col gap-8 py-16'>
      <header className='text-center'>
        <h1 className='text-3xl font-bold'>Planos e precos</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Escolha o plano ideal para o momento do seu escritorio contabil.
        </p>
      </header>
      <div className='grid gap-6 md:grid-cols-3'>
        {[
          { name: 'Essencial', price: 'R$ 199/mensal', description: 'Ideal para ate 50 empresas.' },
          { name: 'Pro', price: 'R$ 399/mensal', description: 'Recursos completos e automacoes.' },
          {
            name: 'Enterprise',
            price: 'Sob consulta',
            description: 'Suporte dedicado e integracoes sob medida.',
          },
        ].map(plan => (
          <div key={plan.name} className='rounded-lg border p-6 shadow-sm'>
            <h2 className='text-lg font-semibold'>{plan.name}</h2>
            <p className='mt-2 text-2xl font-bold'>{plan.price}</p>
            <p className='mt-3 text-sm text-muted-foreground'>{plan.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
