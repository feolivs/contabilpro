/**
 * ============================================
 * EDGE FUNCTION: send-push-notification
 * ============================================
 * Envia notificações push via Web Push API
 * 
 * Payload:
 * {
 *   "user_id": "uuid",
 *   "title": "Título da notificação",
 *   "message": "Mensagem da notificação",
 *   "data": {
 *     "url": "/path",
 *     "type": "tax_obligation_due",
 *     "priority": "high"
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "sent_count": 2,
 *   "failed_count": 0,
 *   "notification_id": "uuid",
 *   "errors": []
 * }
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import type { SendPushRequest, SendPushResponse } from './utils/types.ts'
import { ValidationError, DatabaseError, PushError } from './utils/types.ts'
import { validateSendPushRequest, validateEnvironment } from './utils/validation.ts'
import { getUserSubscriptions, createNotification, logEvent } from './utils/supabase.ts'
import { configureWebPush, sendPushNotifications } from './utils/web-push.ts'

// ============================================
// CORS Headers
// ============================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create error response
 */
function errorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

/**
 * Create success response
 */
function successResponse(data: SendPushResponse) {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  const startTime = Date.now()

  try {
    // 1. Validate environment
    console.log('🚀 [send-push-notification] Starting...')
    validateEnvironment()
    configureWebPush()

    // 2. Parse and validate request
    const payload: SendPushRequest = await req.json()
    console.log(`📥 [Request] user_id: ${payload.user_id}, title: "${payload.title}"`)

    const validatedPayload = validateSendPushRequest(payload)

    // 3. Get user subscriptions
    console.log(`🔍 [Subscriptions] Fetching for user ${validatedPayload.user_id}...`)
    const subscriptions = await getUserSubscriptions(validatedPayload.user_id)

    if (subscriptions.length === 0) {
      console.log('⚠️  [Subscriptions] No active subscriptions found')
      
      // Still create notification in database for in-app display
      const notificationId = await createNotification(
        validatedPayload.user_id,
        validatedPayload.title,
        validatedPayload.message,
        validatedPayload.data
      )

      await logEvent('push_notification_no_subscriptions', {
        user_id: validatedPayload.user_id,
        notification_id: notificationId,
      })

      return successResponse({
        success: true,
        sent_count: 0,
        failed_count: 0,
        notification_id: notificationId,
      })
    }

    // 4. Send push notifications
    console.log(`📤 [Push] Sending to ${subscriptions.length} subscription(s)...`)
    const results = await sendPushNotifications(
      subscriptions,
      validatedPayload.title,
      validatedPayload.message,
      validatedPayload.data
    )

    // 5. Create notification record in database
    const notificationId = await createNotification(
      validatedPayload.user_id,
      validatedPayload.title,
      validatedPayload.message,
      validatedPayload.data
    )

    // 6. Prepare response
    const sentCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length
    const errors = results
      .filter(r => !r.success)
      .map(r => ({
        endpoint: r.endpoint.substring(0, 50) + '...',
        error: r.error || 'Unknown error',
        status_code: r.status_code,
      }))

    const duration = Date.now() - startTime

    // 7. Log event
    await logEvent('push_notification_sent', {
      user_id: validatedPayload.user_id,
      notification_id: notificationId,
      sent_count: sentCount,
      failed_count: failedCount,
      duration_ms: duration,
    })

    console.log(`✅ [Success] Sent: ${sentCount}, Failed: ${failedCount}, Duration: ${duration}ms`)

    return successResponse({
      success: true,
      sent_count: sentCount,
      failed_count: failedCount,
      notification_id: notificationId,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ [Error]', error)

    // Log error event
    try {
      await logEvent('push_notification_error', {
        error: error instanceof Error ? error.message : String(error),
        error_type: error instanceof Error ? error.constructor.name : 'Unknown',
        duration_ms: duration,
      })
    } catch (logError) {
      console.error('Failed to log error event:', logError)
    }

    // Handle specific error types
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400)
    }

    if (error instanceof DatabaseError) {
      return errorResponse('Database error: ' + error.message, 500)
    }

    if (error instanceof PushError) {
      return errorResponse('Push error: ' + error.message, 500)
    }

    // Generic error
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
})

console.log('✅ [send-push-notification] Edge Function ready!')

