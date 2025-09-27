import { format } from 'date-fns'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Entry } from '@/lib/validations'

type EntriesTableProps = {
  entries: (Entry & {
    client?: { name?: string | null } | null
    account?: { name?: string | null; code?: string | null } | null
  })[]
}

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

function formatDate(value?: string | Date | null) {
  if (!value) {
    return 'Sem data'
  }

  const date = typeof value === 'string' ? new Date(value) : value

  if (Number.isNaN(date.getTime())) {
    return 'Sem data'
  }

  return format(date, 'dd/MM/yyyy')
}

export function EntriesTable({ entries }: EntriesTableProps) {
  if (!entries.length) {
    return (
      <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
        Nenhum lancamento disponivel para exibir.
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descricao</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead className='text-right'>Tipo</TableHead>
            <TableHead className='text-right'>Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(entry => (
            <TableRow key={entry.id}>
              <TableCell>{formatDate(entry.date)}</TableCell>
              <TableCell className='font-medium'>{entry.description}</TableCell>
              <TableCell>{entry.client?.name ?? '-'}</TableCell>
              <TableCell>
                {entry.account
                  ? [entry.account.code, entry.account.name].filter(Boolean).join(' - ')
                  : '-'}
              </TableCell>
              <TableCell className='text-right capitalize'>{entry.type}</TableCell>
              <TableCell className='text-right'>{currency.format(entry.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
