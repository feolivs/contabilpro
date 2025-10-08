-- ============================================
-- MIGRATION 003: Storage Setup
-- Description: Configure Supabase Storage for document uploads
-- Author: ContabilPRO Team
-- Date: 2025-10-08
-- ============================================

-- ============================================
-- CREATE STORAGE BUCKET
-- ============================================

-- Criar bucket para documentos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Bucket privado
  10485760, -- 10MB limit
  ARRAY[
    'text/xml',
    'application/xml',
    'application/x-ofx',
    'text/csv',
    'application/zip',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS POLICIES FOR STORAGE
-- ============================================

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own files
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- VERIFICATION
-- ============================================

-- Verificar se o bucket foi criado
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents') THEN
    RAISE NOTICE 'Storage bucket "documents" created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create storage bucket "documents"';
  END IF;
END $$;

