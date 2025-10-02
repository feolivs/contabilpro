import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { BankAccount } from '@/lib/validations'

interface BankAccountsTableProps {
  accounts: BankAccount[]
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

export function BankAccountsTable({ accounts }: BankAccountsTableProps) {
  if (!accounts.length) {
    return (
      <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
        Nenhuma conta bancaria cadastrada ainda.
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Banco</TableHead>
            <TableHead>Agencia</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead className='text-right'>Saldo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map(account => (
            <TableRow key={account.id}>
              <TableCell className='font-medium'>{account.name}</TableCell>
              <TableCell>
                {account.bank_code} - {account.bank_name}
              </TableCell>
              <TableCell>{account.agency}</TableCell>
              <TableCell>{account.account_number}</TableCell>
              <TableCell className='text-right'>{formatCurrency(account.balance ?? 0)}</TableCell>
              <TableCell>
                <Badge variant={account.is_active === false ? 'secondary' : 'default'}>
                  {account.is_active === false ? 'Inativa' : 'Ativa'}
                </Badge>
              </TableCell>
              <TableCell className='text-right'>
                <Button asChild variant='ghost' size='sm'>
                  <Link href={`/bancos/${account.id}`}>Ver detalhes</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
