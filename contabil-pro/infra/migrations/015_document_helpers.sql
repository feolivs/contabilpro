-- ============================================
-- MIGRATION 015: Funções Auxiliares para Documentos
-- ============================================

-- ============================================
-- FUNÇÃO: Gerar Path de Documento
-- ============================================
CREATE OR REPLACE FUNCTION generate_document_path(
  p_tenant_id UUID,
  p_type VARCHAR,
  p_filename VARCHAR,
  p_hash VARCHAR
) RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_extension TEXT;
  v_clean_name TEXT;
BEGIN
  -- Ano atual
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Extrair extensão (última parte após último ponto)
  v_extension := LOWER(SUBSTRING(p_filename FROM '\.([^.]+)$'));
  
  -- Se não encontrou extensão, usar 'bin'
  IF v_extension IS NULL OR v_extension = '' THEN
    v_extension := 'bin';
  END IF;
  
  -- Limpar nome do arquivo (remover extensão e caracteres especiais)
  v_clean_name := REGEXP_REPLACE(
    SUBSTRING(p_filename FROM '^(.+)\.[^.]+$'),
    '[^a-zA-Z0-9_-]',
    '_',
    'g'
  );
  
  -- Se não conseguiu extrair nome, usar 'document'
  IF v_clean_name IS NULL OR v_clean_name = '' THEN
    v_clean_name := 'document';
  END IF;
  
  -- Limitar tamanho do nome (50 caracteres)
  v_clean_name := SUBSTRING(v_clean_name FROM 1 FOR 50);
  
  -- Retornar path no formato: {tenant}/{type}/{year}/{hash}-{name}.{ext}
  RETURN FORMAT(
    '%s/%s/%s/%s-%s.%s',
    p_tenant_id,
    COALESCE(p_type, 'other'),
    v_year,
    SUBSTRING(p_hash FROM 1 FOR 8), -- Primeiros 8 chars do hash
    v_clean_name,
    v_extension
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION generate_document_path IS 
'Gera path padronizado para documentos: {tenant}/{type}/{year}/{hash}-{name}.{ext}';

-- ============================================
-- FUNÇÃO: Buscar Documentos com Full-Text Search
-- ============================================
CREATE OR REPLACE FUNCTION search_documents(
  p_tenant_id UUID,
  p_search_text TEXT DEFAULT NULL,
  p_type VARCHAR DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
) RETURNS TABLE (
  id UUID,
  name VARCHAR,
  type VARCHAR,
  size BIGINT,
  mime_type VARCHAR,
  client_id UUID,
  entry_id UUID,
  processed BOOLEAN,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.type,
    d.size,
    d.mime_type,
    d.client_id,
    d.entry_id,
    d.processed,
    d.created_at,
    CASE 
      WHEN p_search_text IS NOT NULL THEN
        ts_rank(
          to_tsvector('portuguese', coalesce(d.ocr_text, '') || ' ' || d.name),
          websearch_to_tsquery('portuguese', p_search_text)
        )
      ELSE 0.0
    END as rank
  FROM documents d
  WHERE d.tenant_id = p_tenant_id
    AND (p_search_text IS NULL OR 
         to_tsvector('portuguese', coalesce(d.ocr_text, '') || ' ' || d.name) @@ 
         websearch_to_tsquery('portuguese', p_search_text))
    AND (p_type IS NULL OR d.type = p_type)
    AND (p_client_id IS NULL OR d.client_id = p_client_id)
  ORDER BY 
    CASE WHEN p_search_text IS NOT NULL THEN rank ELSE 0 END DESC,
    d.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_documents IS 
'Busca documentos com filtros e full-text search opcional';

