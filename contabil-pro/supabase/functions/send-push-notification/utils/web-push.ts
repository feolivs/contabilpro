/**
 * Web Push API Integration
 */

import webpush from 'npm:web-push@3.6.7'
import type {
  NotificationSubscription,
  PushSubscription,
  PushPayload,
  PushResult,
} from './types.ts'
import { PushError } from './types.ts'
import { removeSubscription, updateSubscriptionLastUsed } from './supabase.ts'

// ============================================
// Web Push Configuration
// ============================================

/**
 * Configure web-push with VAPID keys
 */
export function configureWebPush() {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:contato@contabilpro.com'

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new PushError('Missing VAPID keys')
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  console.log('[WebPush] Configured with VAPID keys')
}

// ============================================
// Push Notification Functions
// ============================================

/**
 * Convert database subscription to Web Push subscription format
 */
function toWebPushSubscription(sub: NotificationSubscription): PushSubscription {
  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  }
}

/**
 * Create push payload
 */
function createPushPayload(
  title: string,
  message: string,
  data?: Record<string, any>
): PushPayload {
  return {
    title,
    body: message,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: {
      url: data?.url || '/notificacoes',
      ...data,
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
      },
      {
        action: 'close',
        title: 'Fechar',
      },
    ],
  }
}

/**
 * Send push notification to a single subscription
 */
async function sendPushToSubscription(
  subscription: NotificationSubscription,
  payload: PushPayload
): Promise<PushResult> {
  const webPushSub = toWebPushSubscription(subscription)
  const payloadString = JSON.stringify(payload)

  try {
    console.log(`[WebPush] Sending to endpoint: ${subscription.endpoint.substring(0, 50)}...`)

    await webpush.sendNotification(webPushSub, payloadString)

    // Update last_used_at timestamp
    await updateSubscriptionLastUsed(subscription.id)

    console.log(`[WebPush] ✅ Successfully sent to subscription ${subscription.id}`)

    return {
      endpoint: subscription.endpoint,
      success: true,
    }
  } catch (error: any) {
    console.error(`[WebPush] ❌ Error sending to subscription ${subscription.id}:`, error)

    const statusCode = error?.statusCode || error?.status || 0

    // Handle specific error codes
    if (statusCode === 410 || statusCode === 404) {
      // Subscription expired or not found - remove it
      console.log(`[WebPush] Removing expired subscription ${subscription.id}`)
      try {
        await removeSubscription(subscription.id)
      } catch (removeError) {
        console.error('[WebPush] Failed to remove subscription:', removeError)
      }
    }

    return {
      endpoint: subscription.endpoint,
      success: false,
      error: error?.message || 'Unknown error',
      status_code: statusCode,
    }
  }
}

/**
 * Send push notifications to multiple subscriptions
 */
export async function sendPushNotifications(
  subscriptions: NotificationSubscription[],
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<PushResult[]> {
  if (subscriptions.length === 0) {
    console.log('[WebPush] No subscriptions to send to')
    return []
  }

  console.log(`[WebPush] Sending push to ${subscriptions.length} subscription(s)`)

  const payload = createPushPayload(title, message, data)

  // Send to all subscriptions in parallel
  const results = await Promise.all(
    subscriptions.map(sub => sendPushToSubscription(sub, payload))
  )

  const successCount = results.filter(r => r.success).length
  const failedCount = results.filter(r => !r.success).length

  console.log(`[WebPush] Results: ${successCount} sent, ${failedCount} failed`)

  return results
}

/**
 * Send test notification
 */
export async function sendTestNotification(
  subscription: NotificationSubscription
): Promise<PushResult> {
  const payload = createPushPayload(
    '🔔 Notificação de Teste',
    'Esta é uma notificação de teste do ContabilPRO!',
    {
      type: 'test',
      url: '/config',
    }
  )

  return sendPushToSubscription(subscription, payload)
}

