-- ============================================
-- MIGRATION 020: Aumentar Limite de Storage para 100MB
-- ============================================
-- Aumenta o limite de tamanho de arquivo do bucket 'documentos'
-- de 50MB para 100MB para suportar documentos contábeis maiores

UPDATE storage.buckets 
SET file_size_limit = 104857600  -- 100MB (100 * 1024 * 1024)
WHERE id = 'documentos';

-- Verificar a atualização
SELECT 
  id, 
  name, 
  file_size_limit,
  file_size_limit / (1024 * 1024) as limit_mb
FROM storage.buckets 
WHERE id = 'documentos';

