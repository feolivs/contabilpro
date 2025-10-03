/**
 * Validation schemas using Zod
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { ValidationError } from './types.ts'

// ============================================
// Zod Schemas
// ============================================

export const SendPushRequestSchema = z.object({
  user_id: z.string().uuid('user_id must be a valid UUID'),
  title: z.string().min(1, 'title is required').max(255, 'title must be at most 255 characters'),
  message: z.string().min(1, 'message is required').max(1000, 'message must be at most 1000 characters'),
  data: z.object({
    url: z.string().url().optional(),
    type: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  }).passthrough().optional(),
})

// ============================================
// Validation Functions
// ============================================

/**
 * Validate SendPushRequest payload
 */
export function validateSendPushRequest(payload: unknown) {
  try {
    return SendPushRequestSchema.parse(payload)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      throw new ValidationError(`Validation failed: ${messages}`)
    }
    throw error
  }
}

/**
 * Validate environment variables
 */
export function validateEnvironment() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
  ]

  const missing = required.filter(key => !Deno.env.get(key))

  if (missing.length > 0) {
    throw new ValidationError(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

