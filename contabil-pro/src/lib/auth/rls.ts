'use server'

import type { AuthSession } from '@/types/auth'

import { createServerClient } from '../supabase'
import { verifySession } from './index'

/**
 * Helper para obter cliente Supabase autenticado
 * Verifica a sessão e retorna o cliente configurado
 */
export async function setRLSContext(session?: AuthSession) {
  const activeSession = session ?? (await verifySession())

  if (!activeSession) {
    return null
  }

  // Retorna o cliente Supabase já autenticado
  return await createServerClient()
}
