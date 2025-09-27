interface LancamentoDetalheProps {
  params: { id: string }
}

export default function LancamentoDetalhePage({ params }: LancamentoDetalheProps) {
  return (
    <section className='space-y-4 p-6'>
      <h1 className='text-2xl font-semibold'>Lancamento {params.id}</h1>
      <p className='text-sm text-muted-foreground'>
        Aqui voce visualizara partidas, anexos, historico de IA e conciliacoes relacionadas ao
        lancamento.
      </p>
    </section>
  )
}
