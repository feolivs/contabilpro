'use server'

import { revalidatePath } from 'next/cache'

import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import type { ActionResponse } from '@/types/actions'
import type {
  Notification,
  NotificationFilters,
  NotificationStats,
  NotificationSubscription,
  SubscriptionFormData,
} from '@/types/notifications'

import { z } from 'zod'

/**
 * Validation schemas
 */
const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  user_agent: z.string().optional(),
})

/**
 * Get notifications with optional filters
 */
export async function getNotifications(
  filters?: NotificationFilters
): Promise<ActionResponse<Notification[]>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.read !== undefined) {
      query = query.eq('read', filters.read)
    }

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.from_date) {
      query = query.gte('created_at', filters.from_date)
    }

    if (filters?.to_date) {
      query = query.lte('created_at', filters.to_date)
    }

    // Apply pagination
    const limit = filters?.limit || 50
    const offset = filters?.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('[getNotifications] Error:', error)
      return {
        success: false,
        error: 'Erro ao buscar notificações',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('[getNotifications] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(): Promise<ActionResponse<number>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('read', false)

    if (error) {
      console.error('[getUnreadCount] Error:', error)
      return {
        success: false,
        error: 'Erro ao buscar contador de notificações',
      }
    }

    return {
      success: true,
      data: count || 0,
    }
  } catch (error) {
    console.error('[getUnreadCount] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(): Promise<ActionResponse<NotificationStats>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('notifications')
      .select('type, read')
      .eq('user_id', session.user.id)

    if (error) {
      console.error('[getNotificationStats] Error:', error)
      return {
        success: false,
        error: 'Erro ao buscar estatísticas de notificações',
      }
    }

    const stats: NotificationStats = {
      total: data?.length || 0,
      unread: data?.filter(n => !n.read).length || 0,
      read: data?.filter(n => n.read).length || 0,
      by_type: {} as Record<string, number>,
    }

    // Count by type
    data?.forEach(notification => {
      const type = notification.type
      stats.by_type[type] = (stats.by_type[type] || 0) + 1
    })

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    console.error('[getNotificationStats] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(id: string): Promise<ActionResponse<Notification>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('[markAsRead] Error:', error)
      return {
        success: false,
        error: 'Erro ao marcar notificação como lida',
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/notificacoes')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[markAsRead] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)
      .eq('read', false)

    if (error) {
      console.error('[markAllAsRead] Error:', error)
      return {
        success: false,
        error: 'Erro ao marcar todas as notificações como lidas',
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/notificacoes')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('[markAllAsRead] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('[deleteNotification] Error:', error)
      return {
        success: false,
        error: 'Erro ao deletar notificação',
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/notificacoes')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('[deleteNotification] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToNotifications(
  input: SubscriptionFormData
): Promise<ActionResponse<NotificationSubscription>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    // Validate input
    const validatedInput = subscriptionSchema.parse(input)

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('notification_subscriptions')
      .select('id')
      .eq('endpoint', validatedInput.endpoint)
      .single()

    if (existing) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('notification_subscriptions')
        .update({
          p256dh: validatedInput.p256dh,
          auth: validatedInput.auth,
          user_agent: validatedInput.user_agent,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('[subscribeToNotifications] Update error:', error)
        return {
          success: false,
          error: 'Erro ao atualizar subscription',
        }
      }

      return {
        success: true,
        data,
      }
    }

    // Create new subscription
    const { data, error } = await supabase
      .from('notification_subscriptions')
      .insert({
        user_id: session.user.id,
        endpoint: validatedInput.endpoint,
        p256dh: validatedInput.p256dh,
        auth: validatedInput.auth,
        user_agent: validatedInput.user_agent,
      })
      .select()
      .single()

    if (error) {
      console.error('[subscribeToNotifications] Insert error:', error)
      return {
        success: false,
        error: 'Erro ao criar subscription',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[subscribeToNotifications] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromNotifications(
  endpoint: string
): Promise<ActionResponse<void>> {
  try {
    const session = await requireAuth()
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('notification_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('[unsubscribeFromNotifications] Error:', error)
      return {
        success: false,
        error: 'Erro ao remover subscription',
      }
    }

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('[unsubscribeFromNotifications] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}
