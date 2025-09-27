import { format } from 'date-fns'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Client } from '@/lib/validations'

type ClientsTableProps = {
  clients: Client[]
}

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

export function ClientsTable({ clients }: ClientsTableProps) {
  if (!clients.length) {
    return (
      <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
        Nenhum cliente cadastrado para este tenant.
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Cadastro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map(client => (
            <TableRow key={client.id}>
              <TableCell className='font-medium'>{client.name}</TableCell>
              <TableCell>{client.document}</TableCell>
              <TableCell>{client.email ?? '-'}</TableCell>
              <TableCell>{client.phone ?? '-'}</TableCell>
              <TableCell>{formatDate(client.created_at ?? null)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
