import { cookies } from 'next/headers'

import {
  type CookieOptions,
  createBrowserClient,
  createServerClient as createSupabaseServerClient,
} from '@supabase/ssr'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'

// Cliente para uso no browser (componentes client-side)
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase browser client configuration')
  }

  return createBrowserClient(url, anonKey)
}

// Cliente para uso no servidor (Server Actions, API Routes)
export async function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase server client configuration')
  }

  const cookieStore = cookies()

  return createSupabaseServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  })
}

// Cliente com service role para operacoes administrativas (somente servidor)
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient must only be called on the server')
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration')
  }

  return createSupabaseAdminClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-contabilpro-admin': 'true',
      },
    },
  })
}

