export default function ImportarLancamentosPage() {
  return (
    <section className='space-y-4 p-6'>
      <h1 className='text-2xl font-semibold'>Importar arquivos</h1>
      <p className='text-sm text-muted-foreground'>
        Pipeline de importacao (OFX, CSV, XML) sera integrado aqui com idempotencia e auditoria.
      </p>
    </section>
  )
}
