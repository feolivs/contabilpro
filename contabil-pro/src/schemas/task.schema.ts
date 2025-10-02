/**
 * Schemas Zod para validação de Tarefas
 */

import { z } from 'zod';

// ============================================================================
// Schemas de Enums
// ============================================================================

export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const taskTypeSchema = z.enum([
  'reminder',
  'tax_obligation',
  'document_review',
  'client_meeting',
  'report_generation',
  'other',
]);

// ============================================================================
// Schema Base de Tarefa
// ============================================================================

export const baseTaskSchema = z.object({
  title: z
    .string()
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(255, 'Título deve ter no máximo 255 caracteres')
    .trim(),

  description: z
    .string()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .trim()
    .optional(),

  type: taskTypeSchema,

  priority: taskPrioritySchema.default('medium'),

  status: taskStatusSchema.default('pending'),

  due_date: z
    .string()
    .datetime({ message: 'Data de vencimento inválida' })
    .optional()
    .nullable()
    .transform((val) => val || undefined),

  client_id: z
    .string()
    .uuid({ message: 'ID do cliente inválido' })
    .optional()
    .nullable()
    .transform((val) => val || undefined),

  assigned_to: z
    .string()
    .uuid({ message: 'ID do usuário inválido' })
    .optional()
    .nullable()
    .transform((val) => val || undefined),
});

// ============================================================================
// Schema para Criar Tarefa
// ============================================================================

export const createTaskSchema = baseTaskSchema;

// ============================================================================
// Schema para Atualizar Tarefa
// ============================================================================

export const updateTaskSchema = baseTaskSchema.partial().extend({
  id: z.string().uuid({ message: 'ID da tarefa inválido' }),
});

// ============================================================================
// Schema para Atualizar Status (ação rápida)
// ============================================================================

export const updateTaskStatusSchema = z.object({
  id: z.string().uuid({ message: 'ID da tarefa inválido' }),
  status: taskStatusSchema,
});

// ============================================================================
// Schema para Filtros
// ============================================================================

export const taskFiltersSchema = z.object({
  // Filtros básicos
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  type: taskTypeSchema.optional(),

  // Filtros por relacionamento
  client_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),

  // Filtros por data
  due_date_from: z.string().datetime().optional(),
  due_date_to: z.string().datetime().optional(),
  overdue: z.boolean().optional(),

  // Busca textual
  search: z.string().trim().optional(),

  // Paginação
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

// ============================================================================
// Tipos TypeScript Inferidos
// ============================================================================

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type TaskType = z.infer<typeof taskTypeSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;

