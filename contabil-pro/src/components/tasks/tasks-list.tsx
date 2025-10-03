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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useDeleteTask, useUpdateTaskStatus } from '@/hooks/use-tasks'
import type { Task } from '@/types/tasks'

import { TaskCard } from './task-card'
import { ListTodo, Loader2 } from 'lucide-react'

interface TasksListProps {
  tasks: Task[]
  total: number
  currentPage: number
  pageSize: number
  isLoading: boolean
  onPageChange: (page: number) => void
  onEditTask: (task: Task) => void
}

export function TasksList({
  tasks,
  total,
  currentPage,
  pageSize,
  isLoading,
  onPageChange,
  onEditTask,
}: TasksListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)

  const updateStatus = useUpdateTaskStatus()
  const deleteTask = useDeleteTask()

  const totalPages = Math.ceil(total / pageSize)

  // Handlers
  const handleStartTask = (taskId: string) => {
    updateStatus.mutate({ id: taskId, status: 'in_progress' })
  }

  const handleCompleteTask = (taskId: string) => {
    updateStatus.mutate({ id: taskId, status: 'completed' })
  }

  const handleDeleteClick = (taskId: string) => {
    setTaskToDelete(taskId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      deleteTask.mutate(taskToDelete)
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
    }
  }

  // Loading State
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-12'>
            <Loader2 className='h-8 w-8 text-muted-foreground animate-spin mb-4' />
            <p className='text-sm text-muted-foreground'>Carregando tarefas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty State
  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='rounded-full bg-muted p-4 mb-4'>
              <ListTodo className='h-8 w-8 text-muted-foreground' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>Nenhuma tarefa encontrada</h3>
            <p className='text-sm text-muted-foreground max-w-sm'>
              Não há tarefas que correspondam aos filtros selecionados. Tente ajustar os filtros ou
              criar uma nova tarefa.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Main Content
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            Tarefas ({total} {total === 1 ? 'tarefa' : 'tarefas'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStart={handleStartTask}
                onComplete={handleCompleteTask}
                onEdit={onEditTask}
                onDelete={handleDeleteClick}
                showClient={true}
              />
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className='mt-6'>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                      className={
                        currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>

                  {/* Páginas */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber: number

                    if (totalPages <= 5) {
                      pageNumber = i + 1
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i
                    } else {
                      pageNumber = currentPage - 2 + i
                    }

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => onPageChange(pageNumber)}
                          isActive={currentPage === pageNumber}
                          className='cursor-pointer'
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                      className={
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <p className='text-center text-sm text-muted-foreground mt-2'>
                Página {currentPage} de {totalPages}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta tarefa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
