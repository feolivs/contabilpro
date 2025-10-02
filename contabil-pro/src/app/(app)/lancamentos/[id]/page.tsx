import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getEntryById } from '@/actions/entries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requirePermission } from '@/lib/auth/rbac'

interface LancamentoDetalheProps {
  params: Promise<{ id: string  }>
}

function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return '0,00'
  }

  const amount = typeof value === 'string' ? Number(value) : value

  if (Number.isNaN(amount)) {
    return '0,00'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return 'Sem data'
  }

  const date = typeof value === 'string' ? new Date(value) : value

  if (Number.isNaN(date.getTime())) {
    return 'Sem data'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(date)
}

export default async function LancamentoDetalhePage({ params }: LancamentoDetalheProps) {
  const { id } = await params

  await requirePermission('lancamentos.read')

  const result = await getEntryById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const entry = result.data
  const clientName = entry.client?.name ?? 'Nao associado'
  const accountName = entry.account?.code
    ? `${entry.account.code} - ${entry.account.name ?? ''}`
    : (entry.account?.name ?? 'Nao associado')

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Lancamento {entry.id?.slice(0, 8)}</h1>
          <p className='text-muted-foreground'>Detalhes completos do lancamento selecionado.</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant={entry.type === 'credit' ? 'default' : 'secondary'} className='uppercase'>
            {entry.type === 'credit' ? 'Credito' : 'Debito'}
          </Badge>
          <Button asChild variant='outline' size='sm'>
            <Link href={`/lancamentos/${id}/editar`}>Editar lancamento</Link>
          </Button>
          <Button asChild size='sm'>
            <Link href='/lancamentos/importar'>Importar lancamentos</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo financeiro</CardTitle>
          <CardDescription>Valores e categorizacao do lancamento.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-1 rounded-lg border bg-muted/20 p-4'>
            <p className='text-xs uppercase text-muted-foreground'>Valor</p>
            <p className='text-lg font-semibold text-foreground'>
              {formatCurrency(entry.amount ?? 0)}
            </p>
          </div>
          <div className='space-y-1 rounded-lg border bg-muted/20 p-4'>
            <p className='text-xs uppercase text-muted-foreground'>Data</p>
            <p className='text-sm font-medium text-foreground'>{formatDate(entry.date)}</p>
          </div>
          <div className='space-y-1 rounded-lg border bg-muted/20 p-4'>
            <p className='text-xs uppercase text-muted-foreground'>Conta contabel</p>
            <p className='text-sm font-medium text-foreground'>{accountName}</p>
          </div>
          <div className='space-y-1 rounded-lg border bg-muted/20 p-4'>
            <p className='text-xs uppercase text-muted-foreground'>Cliente relacionado</p>
            <p className='text-sm font-medium text-foreground'>{clientName}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Descricao e anexos</CardTitle>
          <CardDescription>Contexto adicional para auditoria e conciliacao.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3 text-sm text-muted-foreground'>
          <div>
            <p className='text-xs uppercase text-muted-foreground'>Descricao</p>
            <p className='text-base font-medium text-foreground'>{entry.description}</p>
          </div>
          <div>
            <p className='text-xs uppercase text-muted-foreground'>Documento vinculado</p>
            <p className='text-foreground'>{entry.document_id ?? 'Nenhum documento associado'}</p>
          </div>
          <p>Em breve voce encontrara timeline de IA, anexos e sugestoes de conciliacao aqui.</p>
        </CardContent>
      </Card>
    </div>
  )
}
