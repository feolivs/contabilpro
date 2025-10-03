/**
 * TypeScript Types for send-push-notification Edge Function
 */

// ============================================
// Request/Response Types
// ============================================

export interface SendPushRequest {
  user_id: string
  title: string
  message: string
  data?: {
    url?: string
    type?: string
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    [key: string]: any
  }
}

export interface SendPushResponse {
  success: boolean
  sent_count: number
  failed_count: number
  notification_id?: string
  errors?: Array<{
    endpoint: string
    error: string
    status_code?: number
  }>
}

// ============================================
// Database Types
// ============================================

export interface NotificationSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent?: string
  created_at: string
  last_used_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  read_at?: string
  created_at: string
  updated_at: string
}

// ============================================
// Web Push Types
// ============================================

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: {
    url?: string
    [key: string]: any
  }
  actions?: Array<{
    action: string
    title: string
  }>
}

export interface PushResult {
  endpoint: string
  success: boolean
  error?: string
  status_code?: number
}

// ============================================
// Error Types
// ============================================

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class PushError extends Error {
  statusCode?: number
  
  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'PushError'
    this.statusCode = statusCode
  }
}

