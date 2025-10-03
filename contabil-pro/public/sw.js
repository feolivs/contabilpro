// Service Worker for Push Notifications
// Version: 1.0.0

const CACHE_NAME = 'contabilpro-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/fiscal',
  '/notificacoes',
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell')
      return cache.addAll(urlsToCache)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Push event - receive and display notification
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event)

  let notificationData = {
    title: 'ContabilPRO',
    body: 'Você tem uma nova notificação',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'default',
    data: {
      url: '/notificacoes',
    },
  }

  // Parse notification data from push event
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || data.type || notificationData.tag,
        data: {
          url: data.url || notificationData.data.url,
          notification_id: data.notification_id,
          type: data.type,
          ...data.data,
        },
        requireInteraction: data.priority === 'urgent' || data.priority === 'high',
        vibrate: data.priority === 'urgent' ? [200, 100, 200] : [100],
      }
    } catch (error) {
      console.error('[SW] Error parsing push data:', error)
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate,
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
    })
  )
})

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event)

  event.notification.close()

  // Handle action buttons
  if (event.action === 'close') {
    return
  }

  // Get URL from notification data
  const urlToOpen = event.notification.data?.url || '/notificacoes'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus()
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request)
    })
  )
})

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

