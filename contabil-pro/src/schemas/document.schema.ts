// ============================================
// SCHEMAS: Validação com Zod
// ============================================

import { z } from 'zod';

// Schema de tipo de documento
export const documentTypeSchema = z.enum([
  'nfe',
  'nfse',
  'receipt',
  'invoice',
  'contract',
  'other',
]);

// Schema de upload
export const uploadDocumentSchema = z.object({
  type: documentTypeSchema.optional(),
  client_id: z.string().uuid().optional(),
  entry_id: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

// Schema de filtros
export const documentFiltersSchema = z.object({
  type: documentTypeSchema.optional(),
  client_id: z.string().uuid().optional(),
  processed: z.boolean().optional(),
  search: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export type DocumentFiltersInput = z.infer<typeof documentFiltersSchema>;

// Schema de atualização
export const updateDocumentSchema = z.object({
  id: z.string().uuid(),
  type: documentTypeSchema.optional(),
  client_id: z.string().uuid().nullable().optional(),
  entry_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

// Validação de arquivo
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/xml',
  'text/xml',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export const ALLOWED_EXTENSIONS = [
  'pdf', 'png', 'jpg', 'jpeg', 'webp', 
  'xml', 'csv', 'xlsx', 'docx', 'txt'
];

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: 'Arquivo muito grande. Máximo: 50MB' 
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Tipo de arquivo não permitido' 
    };
  }

  return { valid: true };
}

