'use client'

import { useMemo, useState } from 'react'

import { TaskCard } from '@/components/tasks/task-card'
import { TaskDialog } from '@/components/tasks/task-dialog'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDeleteTask, useTasks, useUpdateTaskStatus } from '@/hooks/use-tasks'
import type { Task, TaskStatus } from '@/types/tasks'

import { AlertCircle, ListTodo, Loader2, Plus } from 'lucide-react'

interface ClientTasksSectionProps {
  clientId: string
  clientName: string
}

export function ClientTasksSection({ clientId, clientName }: ClientTasksSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TaskStatus | 'all'>('all')

  // Buscar tarefas do cliente
  const { data, isLoading, error } = useTasks({
    client_id: clientId,
    pageSize: 100, // Buscar todas para filtrar localmente
  })

  // Mutations
  const updateStatus = useUpdateTaskStatus()
  const deleteTask = useDeleteTask()

  // Calcular contadores por status
  const counts = useMemo(() => {
    if (!data?.tasks) {
      return {
        all: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
      }
    }

    return {
      all: data.tasks.length,
      pending: data.tasks.filter(t => t.status === 'pending').length,
      in_progress: data.tasks.filter(t => t.status === 'in_progress').length,
      completed: data.tasks.filter(t => t.status === 'completed').length,
    }
  }, [data?.tasks])

  // Filtrar tarefas por tab ativa
  const filteredTasks = useMemo(() => {
    if (!data?.tasks) return []
    if (activeTab === 'all') return data.tasks
    return data.tasks.filter(task => task.status === activeTab)
  }, [data?.tasks, activeTab])

  // Handlers
  const handleNewTask = () => {
    setEditingTask(null)
    setDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setDialogOpen(true)
  }

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
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <ListTodo className='h-5 w-5 text-muted-foreground' />
              <CardTitle>Tarefas do Cliente</CardTitle>
            </div>
          </div>
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

  // Error State
  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <ListTodo className='h-5 w-5 text-muted-foreground' />
              <CardTitle>Tarefas do Cliente</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <AlertCircle className='h-12 w-12 text-destructive mb-4' />
            <h3 className='text-lg font-semibold mb-2'>Erro ao carregar tarefas</h3>
            <p className='text-sm text-muted-foreground mb-4'>
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
            <Button variant='outline' onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalTasks = data?.total || 0

  // Empty State
  if (totalTasks === 0) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <ListTodo className='h-5 w-5 text-muted-foreground' />
                <CardTitle>Tarefas do Cliente</CardTitle>
                <Badge variant='secondary'>0</Badge>
              </div>
              <Button onClick={handleNewTask} size='sm'>
                <Plus className='mr-2 h-4 w-4' />
                Nova Tarefa
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='rounded-full bg-muted p-4 mb-4'>
                <ListTodo className='h-8 w-8 text-muted-foreground' />
              </div>
              <h3 className='text-lg font-semibold mb-2'>Nenhuma tarefa criada</h3>
              <p className='text-sm text-muted-foreground mb-6 max-w-sm'>
                Crie tarefas para organizar o trabalho relacionado ao cliente{' '}
                <strong>{clientName}</strong>
              </p>
              <Button onClick={handleNewTask}>
                <Plus className='mr-2 h-4 w-4' />
                Criar Primeira Tarefa
              </Button>
            </div>
          </CardContent>
        </Card>

        <TaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          task={editingTask}
          clientId={clientId}
          clientName={clientName}
        />
      </>
    )
  }

  // Main Content
  return (
    <>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <ListTodo className='h-5 w-5 text-muted-foreground' />
              <CardTitle>Tarefas do Cliente</CardTitle>
              <Badge variant='secondary'>{totalTasks}</Badge>
            </div>
            <Button onClick={handleNewTask} size='sm'>
              <Plus className='mr-2 h-4 w-4' />
              Nova Tarefa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TaskStatus | 'all')}>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='all'>
                Todas
                <Badge variant='secondary' className='ml-2'>
                  {counts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value='pending'>
                Pendentes
                <Badge variant='secondary' className='ml-2'>
                  {counts.pending}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value='in_progress'>
                Em Andamento
                <Badge variant='secondary' className='ml-2'>
                  {counts.in_progress}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value='completed'>
                Concluídas
                <Badge variant='secondary' className='ml-2'>
                  {counts.completed}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Conteúdo das Tabs */}
            {(['all', 'pending', 'in_progress', 'completed'] as const).map(tab => (
              <TabsContent key={tab} value={tab} className='mt-4'>
                {filteredTasks.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-8 text-center'>
                    <ListTodo className='h-12 w-12 text-muted-foreground mb-3' />
                    <p className='text-sm text-muted-foreground'>
                      Nenhuma tarefa{' '}
                      {tab === 'all'
                        ? ''
                        : tab === 'pending'
                          ? 'pendente'
                          : tab === 'in_progress'
                            ? 'em andamento'
                            : 'concluída'}
                    </p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {filteredTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStart={handleStartTask}
                        onComplete={handleCompleteTask}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        clientId={clientId}
        clientName={clientName}
      />

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
