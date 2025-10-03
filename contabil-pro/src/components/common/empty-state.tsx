'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import {
  IconFileText,
  IconPlus,
  IconReceipt,
  IconSearch,
  IconUpload,
  IconUsers,
} from '@tabler/icons-react'

interface EmptyStateProps {
  type?: 'clients' | 'documents' | 'entries' | 'search' | 'custom'
  title?: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

/**
 * Componente EmptyState - Estado vazio com call-to-action
 *
 * Features:
 * - Tipos pré-configurados (clients, documents, entries, search)
 * - Customizável (título, descrição, ícone, ações)
 * - Ações primária e secundária
 * - Responsivo
 * - Acessível
 */
export function EmptyState({
  type = 'custom',
  title,
  description,
  icon,
  action,
  secondaryAction,
}: EmptyStateProps) {
  // Configurações pré-definidas por tipo
  const presets = {
    clients: {
      icon: IconUsers,
      title: 'Nenhum cliente cadastrado',
      description: 'Comece adicionando seu primeiro cliente para gerenciar sua carteira.',
      action: {
        label: 'Adicionar Cliente',
        icon: IconPlus,
      },
      secondaryAction: {
        label: 'Importar CSV',
        icon: IconUpload,
      },
    },
    documents: {
      icon: IconFileText,
      title: 'Nenhum documento encontrado',
      description: 'Faça upload de documentos fiscais para começar a organizar sua contabilidade.',
      action: {
        label: 'Fazer Upload',
        icon: IconUpload,
      },
    },
    entries: {
      icon: IconReceipt,
      title: 'Nenhum lançamento registrado',
      description:
        'Registre seu primeiro lançamento contábil para começar a controlar suas finanças.',
      action: {
        label: 'Novo Lançamento',
        icon: IconPlus,
      },
    },
    search: {
      icon: IconSearch,
      title: 'Nenhum resultado encontrado',
      description: 'Tente ajustar os filtros ou termos de busca para encontrar o que procura.',
      action: {
        label: 'Limpar Filtros',
        icon: IconSearch,
      },
    },
    custom: {
      icon: icon || IconUsers,
      title: title || 'Nenhum item encontrado',
      description: description || 'Não há itens para exibir no momento.',
    },
  }

  const config = type === 'custom' ? presets.custom : presets[type]
  const Icon = config.icon

  return (
    <Card className='border-dashed'>
      <CardContent className='flex flex-col items-center justify-center py-12 px-6 text-center'>
        {/* Ícone */}
        <div className='mb-4 rounded-full bg-muted p-4'>
          <Icon className='h-10 w-10 text-muted-foreground' />
        </div>

        {/* Título */}
        <h3 className='mb-2 text-lg font-semibold'>{title || config.title}</h3>

        {/* Descrição */}
        <p className='mb-6 max-w-sm text-sm text-muted-foreground'>
          {description || config.description}
        </p>

        {/* Ações */}
        <div className='flex flex-col gap-2 sm:flex-row'>
          {action && (
            <Button onClick={action.onClick} variant={action.variant || 'default'}>
              {type !== 'custom' &&
                presets[type].action?.icon &&
                (() => {
                  const ActionIcon = presets[type].action!.icon!
                  return <ActionIcon className='mr-2 h-4 w-4' />
                })()}
              {action.label}
            </Button>
          )}

          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant='outline'>
              {type !== 'custom' &&
                type in presets &&
                'secondaryAction' in presets[type] &&
                (presets[type] as any).secondaryAction?.icon &&
                (() => {
                  const SecondaryIcon = (presets[type] as any).secondaryAction!.icon!
                  return <SecondaryIcon className='mr-2 h-4 w-4' />
                })()}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Versão inline do EmptyState (sem Card)
 * Útil para usar dentro de tabelas ou listas
 */
export function EmptyStateInline({
  type = 'custom',
  title,
  description,
  icon,
  action,
}: Omit<EmptyStateProps, 'secondaryAction'>) {
  const presets = {
    clients: {
      icon: IconUsers,
      title: 'Nenhum cliente',
      description: 'Adicione seu primeiro cliente',
    },
    documents: {
      icon: IconFileText,
      title: 'Nenhum documento',
      description: 'Faça upload de documentos',
    },
    entries: {
      icon: IconReceipt,
      title: 'Nenhum lançamento',
      description: 'Registre um lançamento',
    },
    search: {
      icon: IconSearch,
      title: 'Nenhum resultado',
      description: 'Tente ajustar os filtros',
    },
    custom: {
      icon: icon || IconUsers,
      title: title || 'Nenhum item',
      description: description || 'Não há itens',
    },
  }

  const config = type === 'custom' ? presets.custom : presets[type]
  const Icon = config.icon

  return (
    <div className='flex flex-col items-center justify-center py-8 px-6 text-center'>
      <Icon className='mb-3 h-8 w-8 text-muted-foreground' />
      <h4 className='mb-1 text-sm font-medium'>{title || config.title}</h4>
      <p className='mb-4 text-xs text-muted-foreground'>{description || config.description}</p>
      {action && (
        <Button onClick={action.onClick} variant={action.variant || 'outline'} size='sm'>
          {action.label}
        </Button>
      )}
    </div>
  )
}
