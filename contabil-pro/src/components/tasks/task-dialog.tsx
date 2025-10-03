'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks';
import { createTaskSchema, updateTaskSchema } from '@/schemas/task.schema';
import type { CreateTaskInput, UpdateTaskInput } from '@/schemas/task.schema';
import type { Task } from '@/types/tasks';
import {
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
} from '@/types/tasks';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  clientId?: string;
  clientName?: string;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  clientId,
  clientName,
}: TaskDialogProps) {
  const isEditing = !!task;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  // Form - usar any temporariamente para resolver conflito de tipos
  const form = useForm<any>({
    resolver: zodResolver(isEditing ? updateTaskSchema : createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'other',
      priority: 'medium',
      due_date: '',
      client_id: clientId,
    },
  });

  // Reset form quando abrir/fechar ou mudar task
  useEffect(() => {
    if (open) {
      if (task) {
        // Converter ISO datetime para formato de input date (YYYY-MM-DD)
        const dueDateValue = task.due_date
          ? task.due_date.split('T')[0]
          : '';

        form.reset({
          id: task.id,
          title: task.title,
          description: task.description || '',
          type: task.type,
          priority: task.priority,
          due_date: dueDateValue,
          client_id: task.client_id || clientId,
        });
      } else {
        form.reset({
          title: '',
          description: '',
          type: 'other',
          priority: 'medium',
          due_date: '',
          client_id: clientId,
        });
      }
    }
  }, [open, task, clientId, form]);

  // Submit
  const onSubmit = async (data: any) => {
    if (isEditing) {
      const result = await updateTask.mutateAsync(data as UpdateTaskInput);
      if (result.success) {
        onOpenChange(false);
      }
    } else {
      const result = await createTask.mutateAsync(data as CreateTaskInput);
      if (result.success) {
        onOpenChange(false);
      }
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações da tarefa.'
              : clientName
              ? `Criar nova tarefa para ${clientName}.`
              : 'Criar nova tarefa.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Título */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Calcular DAS de Outubro"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes adicionais sobre a tarefa..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo e Prioridade */}
            <div className="grid grid-cols-2 gap-4">
              {/* Tipo */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Prioridade */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Data de Vencimento */}
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Vencimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Deixe em branco se não houver prazo definido
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar' : 'Criar Tarefa'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

