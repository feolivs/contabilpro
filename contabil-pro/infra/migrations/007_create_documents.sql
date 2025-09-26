-- Criar tabela de documentos (storage + metadados)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  path TEXT NOT NULL, -- Caminho no Supabase Storage
  hash VARCHAR(64) NOT NULL, -- SHA-256 para idempotencia
  size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  type VARCHAR(50), -- Tipo do documento (nfe, nfse, receipt, etc.)
  entry_id UUID REFERENCES entries(id), -- Documento anexo a lancamento
  client_id UUID REFERENCES clients(id), -- Documento relacionado a cliente
  metadata JSONB DEFAULT '{}', -- Metadados especificos (ex: dados da NFe)
  ocr_text TEXT, -- Texto extraido por OCR
  ocr_confidence DECIMAL(3,2), -- Confianca do OCR (0-1)
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(hash);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_entry_id ON documents(entry_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_processed ON documents(processed);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_mime_type ON documents(mime_type);

-- Indice para busca full-text no OCR
CREATE INDEX IF NOT EXISTS idx_documents_ocr_text 
  ON documents USING GIN(to_tsvector('portuguese', ocr_text));

-- Constraint para evitar duplicatas por hash e tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_tenant_hash 
  ON documents(tenant_id, hash);

-- Trigger para updated_at
CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE documents IS 'Documentos armazenados no Supabase Storage';
COMMENT ON COLUMN documents.tenant_id IS 'Referencia para o tenant (RLS)';
COMMENT ON COLUMN documents.path IS 'Caminho no Supabase Storage';
COMMENT ON COLUMN documents.hash IS 'SHA-256 para garantir idempotencia';
COMMENT ON COLUMN documents.type IS 'Tipo: nfe, nfse, receipt, contract, etc.';
COMMENT ON COLUMN documents.metadata IS 'Metadados especificos do tipo (JSON)';
COMMENT ON COLUMN documents.ocr_text IS 'Texto extraido por OCR';
COMMENT ON COLUMN documents.ocr_confidence IS 'Confianca do OCR (0.0 a 1.0)';
