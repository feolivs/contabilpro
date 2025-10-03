/**
 * Push Notifications Library
 * Handles Web Push API integration with Service Worker
 */

import { subscribeToNotifications, unsubscribeFromNotifications } from '@/actions/notifications'

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  return getNotificationPermission() === 'granted'
}

/**
 * Register Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Push] Service Worker not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('[Push] Service Worker registered:', registration)

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready

    return registration
  } catch (error) {
    console.error('[Push] Service Worker registration failed:', error)
    return null
  }
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[Push] Notifications not supported')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    console.log('[Push] Permission result:', permission)
    return permission
  } catch (error) {
    console.error('[Push] Permission request failed:', error)
    return 'denied'
  }
}

/**
 * Convert base64 string to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Check support
    if (!isPushNotificationSupported()) {
      return {
        success: false,
        error: 'Push notifications não são suportadas neste navegador',
      }
    }

    // Request permission
    const permission = await requestNotificationPermission()
    if (permission !== 'granted') {
      return {
        success: false,
        error: 'Permissão de notificações negada',
      }
    }

    // Register service worker
    const registration = await registerServiceWorker()
    if (!registration) {
      return {
        success: false,
        error: 'Falha ao registrar Service Worker',
      }
    }

    // Get VAPID public key from environment
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) {
      return {
        success: false,
        error: 'VAPID public key não configurada',
      }
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    console.log('[Push] Subscription created:', subscription)

    // Send subscription to server
    const subscriptionData = {
      endpoint: subscription.endpoint,
      p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
      auth: arrayBufferToBase64(subscription.getKey('auth')!),
      user_agent: navigator.userAgent,
    }

    const result = await subscribeToNotifications(subscriptionData)

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Erro ao salvar subscription no servidor',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[Push] Subscribe error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      return { success: true }
    }

    // Unsubscribe from push manager
    await subscription.unsubscribe()

    // Remove subscription from server
    const result = await unsubscribeFromNotifications(subscription.endpoint)

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Erro ao remover subscription do servidor',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[Push] Unsubscribe error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  try {
    if (!('serviceWorker' in navigator)) {
      return null
    }

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    return subscription
  } catch (error) {
    console.error('[Push] Get subscription error:', error)
    return null
  }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isSubscribedToPush(): Promise<boolean> {
  const subscription = await getPushSubscription()
  return subscription !== null
}

/**
 * Send test notification
 */
export async function sendTestNotification(): Promise<void> {
  if (!areNotificationsEnabled()) {
    throw new Error('Notificações não estão habilitadas')
  }

  const registration = await navigator.serviceWorker.ready

  await registration.showNotification('ContabilPRO - Teste', {
    body: 'Esta é uma notificação de teste. Se você está vendo isso, as notificações estão funcionando!',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'test',
    requireInteraction: false,
    vibrate: [100, 50, 100],
  })
}

/**
 * Helper: Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

