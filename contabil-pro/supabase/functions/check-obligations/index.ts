/**
 * ============================================
 * EDGE FUNCTION: check-obligations
 * ============================================
 * Cron job que verifica obrigações fiscais vencendo
 * e envia notificações push automaticamente
 * 
 * Schedule: Diariamente às 8h BRT (11h UTC)
 * 
 * Fluxo:
 * 1. Chama função SQL check_tax_obligations_due()
 * 2. Busca notificações criadas nas últimas 24h
 * 3. Envia push para cada notificação via send-push-notification
 * 4. Registra logs e métricas
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

// ============================================
// Types
// ============================================

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data: Record<string, any>
  created_at: string
}

interface CheckResult {
  success: boolean
  notifications_found: number
  notifications_sent: number
  notifications_failed: number
  duration_ms: number
  errors?: string[]
}

// ============================================
// Supabase Client
// ============================================

function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ============================================
// Helper Functions
// ============================================

/**
 * Call SQL function to check tax obligations
 */
async function checkTaxObligations(): Promise<void> {
  const supabase = createSupabaseClient()

  console.log('📋 [Check] Calling check_tax_obligations_due()...')

  const { error } = await supabase.rpc('check_tax_obligations_due')

  if (error) {
    console.error('❌ [Check] Error calling function:', error)
    throw new Error(`Failed to check tax obligations: ${error.message}`)
  }

  console.log('✅ [Check] Function executed successfully')
}

/**
 * Get notifications created in the last 24 hours
 */
async function getRecentNotifications(): Promise<Notification[]> {
  const supabase = createSupabaseClient()

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  console.log(`🔍 [Notifications] Fetching since ${yesterday.toISOString()}...`)

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ [Notifications] Error fetching:', error)
    throw new Error(`Failed to fetch notifications: ${error.message}`)
  }

  console.log(`✅ [Notifications] Found ${data?.length || 0} notifications`)
  return data || []
}

/**
 * Send push notification via send-push-notification function
 */
async function sendPushNotification(notification: Notification): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials for push')
  }

  const functionUrl = `${supabaseUrl}/functions/v1/send-push-notification`

  console.log(`📤 [Push] Sending for notification ${notification.id}...`)

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: notification.user_id,
        title: notification.title,
        message: notification.message,
        data: notification.data,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`❌ [Push] Failed for ${notification.id}:`, error)
      return false
    }

    const result = await response.json()
    console.log(`✅ [Push] Sent for ${notification.id}:`, result)
    return true

  } catch (error) {
    console.error(`❌ [Push] Exception for ${notification.id}:`, error)
    return false
  }
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  const startTime = Date.now()

  console.log('🚀 [check-obligations] Starting cron job...')

  try {
    // 1. Check tax obligations (creates notifications)
    await checkTaxObligations()

    // 2. Get recent notifications
    const notifications = await getRecentNotifications()

    if (notifications.length === 0) {
      const duration = Date.now() - startTime
      console.log(`✅ [Complete] No notifications to send. Duration: ${duration}ms`)

      return new Response(
        JSON.stringify({
          success: true,
          notifications_found: 0,
          notifications_sent: 0,
          notifications_failed: 0,
          duration_ms: duration,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 3. Send push notifications
    console.log(`📤 [Push] Sending ${notifications.length} notification(s)...`)

    const results = await Promise.all(
      notifications.map(notification => sendPushNotification(notification))
    )

    const sentCount = results.filter(r => r).length
    const failedCount = results.filter(r => !r).length

    const duration = Date.now() - startTime

    console.log(`✅ [Complete] Sent: ${sentCount}, Failed: ${failedCount}, Duration: ${duration}ms`)

    return new Response(
      JSON.stringify({
        success: true,
        notifications_found: notifications.length,
        notifications_sent: sentCount,
        notifications_failed: failedCount,
        duration_ms: duration,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ [Error]', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration_ms: duration,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

console.log('✅ [check-obligations] Cron job ready!')

