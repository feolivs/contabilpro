// ============================================
// UTILS: Cliente Supabase
// ============================================

import type { AIInsight, DocumentEvent, DocumentType } from './types.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// Criar cliente Supabase Admin
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ============================================
// Baixar arquivo do Storage
// ============================================
export async function downloadFile(storagePath: string): Promise<Uint8Array> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase.storage.from('documentos').download(storagePath)

  if (error) {
    throw new Error(`Erro ao baixar arquivo: ${error.message}`)
  }

  return new Uint8Array(await data.arrayBuffer())
}

// ============================================
// Atualizar documento no banco
// ============================================
export async function updateDocument(
  documentId: string,
  updates: {
    ocr_text?: string
    ocr_confidence?: number
    type?: DocumentType
    processed?: boolean
    processed_at?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  const supabase = createSupabaseClient()

  const { error } = await supabase.from('documents').update(updates).eq('id', documentId)

  if (error) {
    throw new Error(`Erro ao atualizar documento: ${error.message}`)
  }
}

// ============================================
// Criar AI Insight
// ============================================
export async function createAIInsight(insight: AIInsight): Promise<void> {
  const supabase = createSupabaseClient()

  const { error } = await supabase.from('ai_insights').insert({
    entry_id: insight.entry_id || null,
    type: insight.type,
    confidence: insight.confidence,
    data: insight.data,
    status: insight.status,
  })

  if (error) {
    throw new Error(`Erro ao criar AI Insight: ${error.message}`)
  }
}

// ============================================
// Registrar evento de auditoria
// ============================================
export async function logEvent(event: DocumentEvent): Promise<void> {
  const supabase = createSupabaseClient()

  const { error } = await supabase.from('document_events').insert({
    document_id: event.document_id,
    event_type: event.event_type,
    metadata: event.metadata,
  })

  if (error) {
    console.error('Erro ao registrar evento:', error)
    // Não falhar o processamento por causa de log
  }
}

// ============================================
// Converter arquivo para base64
// ============================================
export function toBase64(data: Uint8Array): string {
  const binString = Array.from(data, byte => String.fromCodePoint(byte)).join('')
  return btoa(binString)
}

// ============================================
// Detectar tipo de arquivo pelo mime type
// ============================================
export function detectFileType(mimeType: string): 'pdf' | 'image' | 'xml' | 'unknown' {
  if (mimeType === 'application/pdf') {
    return 'pdf'
  }

  if (mimeType.startsWith('image/')) {
    return 'image'
  }

  if (mimeType === 'application/xml' || mimeType === 'text/xml') {
    return 'xml'
  }

  return 'unknown'
}
