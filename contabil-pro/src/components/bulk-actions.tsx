'use client'

import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { IconCheck, IconChevronDown, IconTrash, IconX } from '@tabler/icons-react'
import { toast } from 'sonner'

interface BulkActionsProps {
  selectedCount: number
  selectedIds: string[]
  onAction: (action: 'activate' | 'deactivate' | 'delete', ids: string[]) => Promise<void>
  onClearSelection: () => void
}

/**
 * Componente de Ações em Massa
 *
 * Permite executar ações em múltiplos registros selecionados:
 * - Ativar clientes
 * - Inativar clientes
 * - Excluir clientes (com confirmação)
 */
export function BulkActions({
  selectedCount,
  selectedIds,
  onAction,
  onClearSelection,
}: BulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  if (selectedCount === 0) return null

  const handleAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    // Confirmação para exclusão
    if (action === 'delete') {
      setShowDeleteDialog(true)
      return
    }

    setIsLoading(true)

    try {
      await onAction(action, selectedIds)

      const actionLabels = {
        activate: 'ativados',
        deactivate: 'inativados',
        delete: 'excluídos',
      }

      toast.success(`${selectedCount} cliente(s) ${actionLabels[action]} com sucesso!`)
      onClearSelection()
    } catch (error) {
      console.error('Erro ao executar ação:', error)
      toast.error('Erro ao executar ação em massa')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    setShowDeleteDialog(false)
    setIsLoading(true)

    try {
      await onAction('delete', selectedIds)
      toast.success(`${selectedCount} cliente(s) excluído(s) com sucesso!`)
      onClearSelection()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir clientes')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className='flex items-center gap-2 rounded-lg border bg-muted/50 p-2'>
        <div className='flex items-center gap-2 px-2'>
          <span className='text-sm font-medium'>
            {selectedCount} {selectedCount === 1 ? 'selecionado' : 'selecionados'}
          </span>
        </div>

        <div className='flex items-center gap-1'>
          {/* Ativar */}
          <Button
            variant='ghost'
            size='sm'
            onClick={() => handleAction('activate')}
            disabled={isLoading}
          >
            <IconCheck className='mr-2 h-4 w-4' />
            Ativar
          </Button>

          {/* Inativar */}
          <Button
            variant='ghost'
            size='sm'
            onClick={() => handleAction('deactivate')}
            disabled={isLoading}
          >
            <IconX className='mr-2 h-4 w-4' />
            Inativar
          </Button>

          {/* Mais ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' disabled={isLoading}>
                Mais
                <IconChevronDown className='ml-2 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                className='text-destructive focus:text-destructive'
                onClick={() => handleAction('delete')}
              >
                <IconTrash className='mr-2 h-4 w-4' />
                Excluir selecionados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className='mx-2 h-6 w-px bg-border' />

          {/* Limpar seleção */}
          <Button variant='ghost' size='sm' onClick={onClearSelection} disabled={isLoading}>
            Limpar
          </Button>
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedCount}{' '}
              {selectedCount === 1 ? 'cliente' : 'clientes'}?
              <br />
              <br />
              Esta ação não pode ser desfeita. Todos os dados relacionados também serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/**
 * Versão compacta do BulkActions para uso em espaços reduzidos
 */
export function BulkActionsCompact({
  selectedCount,
  selectedIds,
  onAction,
  onClearSelection,
}: BulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  if (selectedCount === 0) return null

  const handleAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (action === 'delete') {
      setShowDeleteDialog(true)
      return
    }

    setIsLoading(true)

    try {
      await onAction(action, selectedIds)

      const actionLabels = {
        activate: 'ativados',
        deactivate: 'inativados',
        delete: 'excluídos',
      }

      toast.success(`${selectedCount} cliente(s) ${actionLabels[action]}!`)
      onClearSelection()
    } catch (error) {
      toast.error('Erro ao executar ação')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    setShowDeleteDialog(false)
    setIsLoading(true)

    try {
      await onAction('delete', selectedIds)
      toast.success(`${selectedCount} cliente(s) excluído(s)!`)
      onClearSelection()
    } catch (error) {
      toast.error('Erro ao excluir')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className='flex items-center gap-2'>
        <span className='text-sm text-muted-foreground'>
          {selectedCount} selecionado{selectedCount !== 1 && 's'}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' disabled={isLoading}>
              Ações
              <IconChevronDown className='ml-2 h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => handleAction('activate')}>
              <IconCheck className='mr-2 h-4 w-4' />
              Ativar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('deactivate')}>
              <IconX className='mr-2 h-4 w-4' />
              Inativar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='text-destructive focus:text-destructive'
              onClick={() => handleAction('delete')}
            >
              <IconTrash className='mr-2 h-4 w-4' />
              Excluir
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClearSelection}>Limpar seleção</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialog de confirmação */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir {selectedCount} {selectedCount === 1 ? 'cliente' : 'clientes'}? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
