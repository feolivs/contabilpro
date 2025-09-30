/**
 * Helper para upload direto ao Supabase Storage (client-side)
 * Evita limite de 1MB do Next.js Server Actions
 */

import { createClient } from '@/lib/supabase-client';

/**
 * Calcula hash SHA-256 de um arquivo (client-side)
 */
export async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Faz upload direto ao Supabase Storage (client-side)
 */
export async function uploadToStorage(
  file: File,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await supabase.storage
      .from('documentos')
      .upload(path, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao fazer upload' };
  }
}

