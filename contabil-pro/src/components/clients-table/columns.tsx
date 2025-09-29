'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { IconDots, IconPencil, IconTrash, IconEye, IconArrowUp, IconArrowDown, IconArrowsSort } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDocument } from '@/lib/document-utils'
import { type Client } from '@/lib/validations'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Componente de header ordenável
 */
function SortableHeader({ column, children }: { column: any; children: React.ReactNode }) {
  const isSorted = column.getIsSorted()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {children}
      {isSorted === 'asc' ? (
        <IconArrowUp className="ml-2 h-4 w-4" />
      ) : isSorted === 'desc' ? (
        <IconArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <IconArrowsSort className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  )
}

/**
 * Colunas da tabela de clientes com TanStack Table
 *
 * Features:
 * - Seleção múltipla (checkbox)
 * - Ordenação por colunas (clicável)
 * - Formatação de dados (documento, datas, valores)
 * - Menu de ações por linha
 * - Badges para status e regime
 * - Responsivo (colunas ocultas em mobile)
 */

export const clientColumns: ColumnDef<Client>[] = [
  // Coluna de seleção
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // Nome
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column}>Nome</SortableHeader>,
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      const tipoPessoa = row.original.tipo_pessoa

      return (
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            {tipoPessoa && (
              <span className="text-xs text-muted-foreground">
                {tipoPessoa === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </span>
            )}
          </div>
        </div>
      )
    },
  },

  // Documento (CPF/CNPJ)
  {
    accessorKey: 'document',
    header: ({ column }) => <SortableHeader column={column}>Documento</SortableHeader>,
    cell: ({ row }) => {
      const document = row.getValue('document') as string
      return <span className="font-mono text-sm">{formatDocument(document)}</span>
    },
  },

  // Email
  {
    accessorKey: 'email',
    header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
    cell: ({ row }) => {
      const email = row.getValue('email') as string | null
      return email ? (
        <span className="text-sm text-muted-foreground">{email}</span>
      ) : (
        <span className="text-xs text-muted-foreground italic">Não informado</span>
      )
    },
  },

  // Regime Tributário
  {
    accessorKey: 'regime_tributario',
    header: ({ column }) => <SortableHeader column={column}>Regime</SortableHeader>,
    cell: ({ row }) => {
      const regime = row.getValue('regime_tributario') as string | null

      if (!regime) return null

      const regimeColors: Record<string, string> = {
        MEI: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        Simples: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        Presumido: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        Real: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      }

      return (
        <Badge variant="outline" className={regimeColors[regime] || ''}>
          {regime}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },

  // Status
  {
    accessorKey: 'status',
    header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
    cell: ({ row }) => {
      const status = row.getValue('status') as string | null

      if (!status) return null

      const statusConfig: Record<string, { label: string; color: string }> = {
        ativo: { label: 'Ativo', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
        inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
        pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
        suspenso: { label: 'Suspenso', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
      }

      const config = statusConfig[status] || { label: status, color: '' }

      return (
        <Badge variant="outline" className={config.color}>
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },

  // Valor do Plano
  {
    accessorKey: 'valor_plano',
    header: ({ column }) => <SortableHeader column={column}>Valor do Plano</SortableHeader>,
    cell: ({ row }) => {
      const valor = row.getValue('valor_plano') as number | null
      
      if (!valor) return null

      return (
        <span className="font-medium">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(valor)}
        </span>
      )
    },
  },

  // Data de Criação
  {
    accessorKey: 'created_at',
    header: ({ column }) => <SortableHeader column={column}>Criado em</SortableHeader>,
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string
      
      return (
        <span className="text-sm text-muted-foreground">
          {format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })}
        </span>
      )
    },
  },

  // Última Atividade
  {
    accessorKey: 'ultima_atividade',
    header: ({ column }) => <SortableHeader column={column}>Última Atividade</SortableHeader>,
    cell: ({ row }) => {
      const date = row.getValue('ultima_atividade') as string | null
      
      if (!date) {
        return <span className="text-xs text-muted-foreground italic">Nunca</span>
      }

      return (
        <span className="text-sm text-muted-foreground">
          {format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })}
        </span>
      )
    },
  },

  // Ações
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      const client = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <IconDots className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => console.log('Ver', client.id)}>
              <IconEye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Editar', client.id)}>
              <IconPencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => console.log('Excluir', client.id)}
              className="text-destructive focus:text-destructive"
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
]

