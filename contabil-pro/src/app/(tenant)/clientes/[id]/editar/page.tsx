interface EditarClienteProps {
  params: { id: string }
}

export default function EditarClientePage({ params }: EditarClienteProps) {
  return (
    <section className='space-y-4 p-6'>
      <h1 className='text-2xl font-semibold'>Editar cliente {params.id}</h1>
      <p className='text-sm text-muted-foreground'>
        Em breve voce podera ajustar dados cadastrais, enviar comunicados e revisar permissões do
        cliente.
      </p>
    </section>
  )
}
