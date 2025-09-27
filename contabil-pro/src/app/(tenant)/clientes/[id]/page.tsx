import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getClientById } from '@/actions/clients'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requirePermission } from '@/lib/rbac'

interface ClienteDetalheProps {
  params: { id: string }
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return 'Sem registro'
  }

  const date = typeof value === 'string' ? new Date(value) : value

  if (Number.isNaN(date.getTime())) {
    return 'Sem registro'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default async function ClienteDetalhePage({ params }: ClienteDetalheProps) {
  await requirePermission('clientes.read')

  const result = await getClientById(params.id)

  if (!result.success || !result.data) {
    notFound()
  }

  const client = result.data
  const details = [
    { label: 'Documento', value: client.document },
    { label: 'Email', value: client.email ?? 'Nao informado' },
    { label: 'Telefone', value: client.phone ?? 'Nao informado' },
    { label: 'Endereco', value: client.address ?? 'Nao informado' },
  ]

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>{client.name}</h1>
          <p className='text-muted-foreground'>
            Resumo do cadastro e status do cliente selecionado.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant={client.email ? 'default' : 'secondary'}>Cliente ativo</Badge>
          <Button asChild variant='outline' size='sm'>
            <Link href={`/clientes/${params.id}/editar`}>Editar cadastro</Link>
          </Button>
          <Button asChild size='sm'>
            <Link href='/clientes/importar'>Importar clientes</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
          <CardDescription>
            Informacoes basicas associadas ao cliente no tenant atual.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          {details.map(item => (
            <div key={item.label} className='space-y-1 rounded-lg border bg-muted/20 p-4'>
              <p className='text-xs uppercase text-muted-foreground'>{item.label}</p>
              <p className='text-sm font-medium'>{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atividade recente</CardTitle>
          <CardDescription>Resumo de passos realizados com este cliente.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-2 text-sm text-muted-foreground'>
          <p>
            Cadastro criado em{' '}
            <span className='font-medium text-foreground'>
              {formatDate(client.created_at ?? null)}
            </span>
          </p>
          <p>
            Ultima atualizacao em{' '}
            <span className='font-medium text-foreground'>
              {formatDate(client.updated_at ?? null)}
            </span>
          </p>
          <p>Em breve voce vera documentos, tarefas e timelines vinculadas aqui.</p>
        </CardContent>
      </Card>
    </div>
  )
}
