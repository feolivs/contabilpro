interface ClienteDetalheProps {
  params: { id: string }
}

export default function ClienteDetalhePage({ params }: ClienteDetalheProps) {
  return (
    <section className='space-y-4 p-6'>
      <h1 className='text-2xl font-semibold'>Cliente {params.id}</h1>
      <p className='text-sm text-muted-foreground'>
        Espaco reservado para timeline, documentos e interacoes do cliente selecionado.
      </p>
    </section>
  )
}
