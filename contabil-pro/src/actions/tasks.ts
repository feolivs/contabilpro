'use server'

// ============================================
// SERVER ACTIONS: Tarefas
// ============================================

import { revalidatePath } from 'next/cache'

import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import type {
  CreateTaskInput,
  TaskFiltersInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from '@/schemas/task.schema'
import {
  createTaskSchema,
  taskFiltersSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '@/schemas/task.schema'
import type { Task, TasksStats } from '@/types/tasks'

// ============================================
// Tipo de Resposta Padrão
// ============================================
type ActionResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

// ============================================
// ACTION 1: Listar Tarefas com Filtros
// ============================================
export async function getTasks(
  filters: Partial<TaskFiltersInput> = {}
): Promise<ActionResponse<{ tasks: Task[]; total: number }>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    // Validar filtros
    const validated = taskFiltersSchema.parse({
      ...filters,
      page: filters.page || 1,
      pageSize: filters.pageSize || 20,
    })

    // Construir query base
    let query = supabase.from('tasks').select(
      `
        *,
        client:clients(id, name),
        assigned_user:users!tasks_assigned_to_fkey(id, name),
        created_user:users!tasks_created_by_fkey(id, name)
      `,
      { count: 'exact' }
    )

    // Aplicar filtros
    if (validated.status) {
      query = query.eq('status', validated.status)
    }

    if (validated.priority) {
      query = query.eq('priority', validated.priority)
    }

    if (validated.type) {
      query = query.eq('type', validated.type)
    }

    if (validated.client_id) {
      query = query.eq('client_id', validated.client_id)
    }

    if (validated.assigned_to) {
      query = query.eq('assigned_to', validated.assigned_to)
    }

    if (validated.created_by) {
      query = query.eq('created_by', validated.created_by)
    }

    if (validated.due_date_from) {
      query = query.gte('due_date', validated.due_date_from)
    }

    if (validated.due_date_to) {
      query = query.lte('due_date', validated.due_date_to)
    }

    if (validated.overdue) {
      const today = new Date().toISOString().split('T')[0]
      query = query.lt('due_date', today).neq('status', 'completed')
    }

    if (validated.search) {
      query = query.or(`title.ilike.%${validated.search}%,description.ilike.%${validated.search}%`)
    }

    // Ordenação: prioridade > prazo > criação
    query = query
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    // Paginação
    const from = (validated.page - 1) * validated.pageSize
    const to = from + validated.pageSize - 1
    query = query.range(from, to)

    // Executar query
    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao buscar tarefas:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: {
        tasks: data as Task[],
        total: count || 0,
      },
    }
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// ============================================
// ACTION 2: Buscar Tarefa por ID
// ============================================
export async function getTaskById(id: string): Promise<ActionResponse<Task>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('tasks')
      .select(
        `
        *,
        client:clients(id, name),
        assigned_user:users!tasks_assigned_to_fkey(id, name),
        created_user:users!tasks_created_by_fkey(id, name)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar tarefa:', error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Tarefa não encontrada' }
    }

    return {
      success: true,
      data: data as Task,
    }
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// ============================================
// ACTION 3: Criar Tarefa
// ============================================
export async function createTask(input: CreateTaskInput): Promise<ActionResponse<Task>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    // Validar input
    const validated = createTaskSchema.parse(input)

    // Inserir tarefa
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...validated,
        created_by: session.user.id,
        assigned_to: validated.assigned_to || session.user.id,
      })
      .select(
        `
        *,
        client:clients(id, name),
        assigned_user:users!tasks_assigned_to_fkey(id, name),
        created_user:users!tasks_created_by_fkey(id, name)
      `
      )
      .single()

    if (error) {
      console.error('Erro ao criar tarefa:', error)
      return { success: false, error: error.message }
    }

    // Revalidar paths
    revalidatePath('/tarefas')
    if (validated.client_id) {
      revalidatePath(`/clientes/${validated.client_id}`)
    }

    return {
      success: true,
      data: data as Task,
    }
  } catch (error) {
    console.error('Erro ao criar tarefa:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// ============================================
// ACTION 4: Atualizar Tarefa
// ============================================
export async function updateTask(input: UpdateTaskInput): Promise<ActionResponse<Task>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    // Validar input
    const validated = updateTaskSchema.parse(input)
    const { id, ...updateData } = validated

    // Atualizar tarefa
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        client:clients(id, name),
        assigned_user:users!tasks_assigned_to_fkey(id, name),
        created_user:users!tasks_created_by_fkey(id, name)
      `
      )
      .single()

    if (error) {
      console.error('Erro ao atualizar tarefa:', error)
      return { success: false, error: error.message }
    }

    // Revalidar paths
    revalidatePath('/tarefas')
    if (data.client_id) {
      revalidatePath(`/clientes/${data.client_id}`)
    }

    return {
      success: true,
      data: data as Task,
    }
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// ============================================
// ACTION 5: Deletar Tarefa
// ============================================
export async function deleteTask(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    // Buscar tarefa antes de deletar (para revalidar paths)
    const { data: task } = await supabase.from('tasks').select('client_id').eq('id', id).single()

    // Deletar tarefa
    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      console.error('Erro ao deletar tarefa:', error)
      return { success: false, error: error.message }
    }

    // Revalidar paths
    revalidatePath('/tarefas')
    if (task?.client_id) {
      revalidatePath(`/clientes/${task.client_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// ============================================
// ACTION 6: Atualizar Status (Ação Rápida)
// ============================================
export async function updateTaskStatus(
  input: UpdateTaskStatusInput
): Promise<ActionResponse<Task>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    // Validar input
    const validated = updateTaskStatusSchema.parse(input)

    // Preparar dados de atualização
    const updateData: any = {
      status: validated.status,
    }

    // Se completando, adicionar timestamp
    if (validated.status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    // Atualizar status
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', validated.id)
      .select(
        `
        *,
        client:clients(id, name),
        assigned_user:users!tasks_assigned_to_fkey(id, name),
        created_user:users!tasks_created_by_fkey(id, name)
      `
      )
      .single()

    if (error) {
      console.error('Erro ao atualizar status:', error)
      return { success: false, error: error.message }
    }

    // Revalidar paths
    revalidatePath('/tarefas')
    if (data.client_id) {
      revalidatePath(`/clientes/${data.client_id}`)
    }

    return {
      success: true,
      data: data as Task,
    }
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// ============================================
// ACTION 7: Estatísticas de Tarefas
// ============================================
export async function getTasksStats(): Promise<ActionResponse<TasksStats>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    const today = new Date().toISOString().split('T')[0]

    // Buscar todas as tarefas (sem paginação para stats)
    const { data: tasks, error } = await supabase.from('tasks').select('status, due_date')

    if (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return { success: false, error: error.message }
    }

    // Calcular estatísticas
    const stats: TasksStats = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      total: tasks?.length || 0,
    }

    tasks?.forEach(task => {
      // Contar por status
      if (task.status === 'pending') stats.pending++
      if (task.status === 'in_progress') stats.in_progress++
      if (task.status === 'completed') stats.completed++

      // Contar atrasadas (não concluídas com prazo vencido)
      if (task.status !== 'completed' && task.due_date && task.due_date < today) {
        stats.overdue++
      }
    })

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}
