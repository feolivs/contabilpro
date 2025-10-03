'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/push-notifications'

/**
 * Component to register Service Worker on mount
 * Should be included in the root layout
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    // Only register in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SW === 'true') {
      registerServiceWorker()
        .then((registration) => {
          if (registration) {
            console.log('[App] Service Worker registered successfully')
          }
        })
        .catch((error) => {
          console.error('[App] Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}

