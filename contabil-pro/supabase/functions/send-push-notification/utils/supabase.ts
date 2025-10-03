/**
 * Supabase Client and Database Operations
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import type { NotificationSubscription, Notification } from './types.ts'
import { DatabaseError } from './types.ts'

// ============================================
// Supabase Client
// ============================================

/**
 * Create Supabase client with service role key
 */
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseKey) {
    throw new DatabaseError('Missing Supabase credentials')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ============================================
// Database Queries
// ============================================

/**
 * Get all active subscriptions for a user
 */
export async function getUserSubscriptions(
  userId: string
): Promise<NotificationSubscription[]> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('notification_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('last_used_at', { ascending: false })

  if (error) {
    console.error('[Supabase] Error fetching subscriptions:', error)
    throw new DatabaseError(`Failed to fetch subscriptions: ${error.message}`)
  }

  console.log(`[Supabase] Found ${data?.length || 0} subscriptions for user ${userId}`)
  return data || []
}

/**
 * Remove invalid subscription
 */
export async function removeSubscription(subscriptionId: string): Promise<void> {
  const supabase = createSupabaseClient()

  const { error } = await supabase
    .from('notification_subscriptions')
    .delete()
    .eq('id', subscriptionId)

  if (error) {
    console.error('[Supabase] Error removing subscription:', error)
    throw new DatabaseError(`Failed to remove subscription: ${error.message}`)
  }

  console.log(`[Supabase] Removed invalid subscription: ${subscriptionId}`)
}

/**
 * Update subscription last_used_at timestamp
 */
export async function updateSubscriptionLastUsed(subscriptionId: string): Promise<void> {
  const supabase = createSupabaseClient()

  const { error } = await supabase
    .from('notification_subscriptions')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', subscriptionId)

  if (error) {
    console.error('[Supabase] Error updating subscription:', error)
    // Non-critical error, just log it
  }
}

/**
 * Create notification record in database
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<string> {
  const supabase = createSupabaseClient()

  const notificationData = {
    user_id: userId,
    type: data?.type || 'push_notification',
    title,
    message,
    data: data || {},
    read: false,
  }

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select('id')
    .single()

  if (error) {
    console.error('[Supabase] Error creating notification:', error)
    throw new DatabaseError(`Failed to create notification: ${error.message}`)
  }

  console.log(`[Supabase] Created notification: ${notification.id}`)
  return notification.id
}

/**
 * Log event for observability
 */
export async function logEvent(
  eventType: string,
  metadata: Record<string, any>
): Promise<void> {
  console.log(`[Event] ${eventType}:`, JSON.stringify(metadata, null, 2))
  
  // TODO: Implement event logging to a dedicated table if needed
  // For now, just console.log for Supabase Edge Function logs
}

