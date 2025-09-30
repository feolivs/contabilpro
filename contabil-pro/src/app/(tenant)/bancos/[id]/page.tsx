import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getBankAccountById } from '@/actions/bank-accounts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { requirePermission } from '@/lib/auth/rbac'

interface ContaBancariaDetalheProps {
  params: Promise<{ id: string  }>
}

function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 'R$ 0,00'
  }

  const amount = typeof value === 'string' ? Number(value) : value

  if (Number.isNaN(amount)) {
    return 'R$ 0,00'
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

export default async function ContaBancariaDetalhePage({ params }: ContaBancariaDetalheProps) {
  await requirePermission('bancos.read')

  const result = await getBankAccountById((await params).id)

  if (!result.success || !result.data) {
    notFound()
  }

  const { account, transactions } = result.data

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>{account.name}</h1>
          <p className='text-muted-foreground'>
            Dados completos e extrato sincronizado da conta bancaria.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant={account.is_active === false ? 'secondary' : 'default'}>
            {account.is_active === false ? 'Inativa' : 'Ativa'}
          </Badge>
          <Button asChild variant='outline' size='sm'>
            <Link href={`/bancos/${params.id}/editar`}>Editar conta</Link>
          </Button>
          <Button asChild size='sm'>
            <Link href={`/bancos/importar?account=${params.id}`}>Importar transacoes</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo da conta</CardTitle>
          <CardDescription>
            Informacoes cadastradas para integracoes e conciliacoes.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-1 rounded-lg border bg-muted/20 p-4'>
            <p className='text-xs uppercase text-muted-foreground'>Banco</p>
            <p className='text-sm font-medium text-foreground'>
              {account.bank_code} - {account.bank_name}
            </p>
          </div>
          <div className='space-y-1 rounded-lg border bg-muted/20 p-4'>
            <p className='text-xs uppercase text-muted-foreground'>Agencia e conta</p>
            <p className='text-sm font-medium text-foreground'>
              {account.agency} - {account.account_number}
            </p>
          </div>
          <div className='space-y-1 rounded-lg border bg-muted/20 p-4'>
            <p className='text-xs uppercase text-muted-foreground'>Tipo de conta</p>
            <p className='text-sm font-medium text-foreground'>
              {account.account_type ?? 'Nao definido'}
            </p>
          </div>
          <div className='space-y-1 rounded-lg border bg-muted/20 p-4'>
            <p className='text-xs uppercase text-muted-foreground'>Saldo atual</p>
            <p className='text-lg font-semibold text-foreground'>
              {formatCurrency(account.balance ?? 0)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transacoes recentes</CardTitle>
          <CardDescription>Extrato importado para conciliacao contabeis.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
              Nenhuma transacao importada para esta conta ainda.
            </div>
          ) : (
            <div className='overflow-hidden rounded-lg border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead className='text-right'>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        <p className='font-medium text-foreground'>{transaction.description}</p>
                        <p className='text-xs text-muted-foreground'>
                          Ref: {transaction.external_id}
                        </p>
                      </TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={transaction.status === 'reconciled' ? 'default' : 'secondary'}
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
