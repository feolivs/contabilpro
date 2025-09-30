// ============================================
// TYPES: Documentos
// ============================================

export type DocumentType = 
  | 'nfe'        // Nota Fiscal Eletrônica
  | 'nfse'       // Nota Fiscal de Serviço
  | 'receipt'    // Recibo
  | 'invoice'    // Fatura
  | 'contract'   // Contrato
  | 'other';     // Outros

export interface Document {
  id: string;
  tenant_id: string;
  name: string;
  original_name: string;
  path: string;
  hash: string;
  size: number;
  mime_type: string;
  type: DocumentType | null;
  entry_id: string | null;
  client_id: string | null;
  metadata: Record<string, any>;
  ocr_text: string | null;
  ocr_confidence: number | null;
  processed: boolean;
  processed_at: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentWithRelations extends Document {
  client?: {
    id: string;
    name: string;
  } | null;
  entry?: {
    id: string;
    description: string;
  } | null;
  uploader?: {
    id: string;
    name: string;
  } | null;
}

export interface DocumentFilters {
  type?: DocumentType;
  client_id?: string;
  processed?: boolean;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}

export interface DocumentUploadResult {
  success: boolean;
  document?: Document;
  error?: string;
  duplicate?: boolean;
}

export interface DocumentListResult {
  documents: DocumentWithRelations[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DocumentEvent {
  id: string;
  tenant_id: string;
  document_id: string | null;
  user_id: string | null;
  event_type: 'upload' | 'view' | 'download' | 'delete' | 'link_entry' | 'link_client' | 'update';
  metadata: Record<string, any>;
  created_at: string;
}

