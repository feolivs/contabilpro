'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TasksStats } from './tasks-stats';
import { TaskFilters } from './task-filters';
import { TasksList } from './tasks-list';
import { TaskDialog } from './task-dialog';
import { useTasks } from '@/hooks/use-tasks';
import type { TaskFiltersInput } from '@/schemas/task.schema';
import type { Task } from '@/types/tasks';

export function TasksPageContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Partial<TaskFiltersInput>>({
    page: 1,
    pageSize: 20,
  });

  // Buscar tarefas com filtros
  const { data, isLoading, error } = useTasks({
    ...filters,
    page: currentPage,
  });

  // Handlers
  const handleNewTask = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleFiltersChange = (newFilters: Partial<TaskFiltersInput>) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset para primeira página ao mudar filtros
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      pageSize: 20,
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as tarefas e acompanhe prazos e responsabilidades.
          </p>
        </div>
        <Button onClick={handleNewTask}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Estatísticas */}
      <TasksStats />

      {/* Filtros */}
      <TaskFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {/* Lista de Tarefas */}
      <TasksList
        tasks={data?.tasks || []}
        total={data?.total || 0}
        currentPage={currentPage}
        pageSize={filters.pageSize || 20}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onEditTask={handleEditTask}
      />

      {/* Dialog de Criar/Editar */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
      />
    </div>
  );
}

