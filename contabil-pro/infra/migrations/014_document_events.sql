-- ============================================
-- MIGRATION 014: Tabela de Auditoria de Documentos
-- ============================================
-- Para conformidade com LGPD e rastreabilidade

CREATE TABLE IF NOT EXISTS document_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Tipo de evento
  event_type VARCHAR(50) NOT NULL CHECK (
    event_type IN (
      'upload', 'view', 'download', 'delete', 
      'link_entry', 'link_client', 'update'
    )
  ),
  
  -- Metadados do evento
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_document_events_tenant_created 
  ON document_events(tenant_id, created_at DESC);

CREATE INDEX idx_document_events_document 
  ON document_events(document_id, created_at DESC) 
  WHERE document_id IS NOT NULL;

CREATE INDEX idx_document_events_user 
  ON document_events(user_id, created_at DESC) 
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_document_events_type 
  ON document_events(event_type);

-- Índice GIN para busca em metadata
CREATE INDEX idx_document_events_metadata 
  ON document_events USING GIN(metadata);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE document_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_events_from_tenant"
ON document_events FOR SELECT
TO authenticated
USING (tenant_id = current_tenant_id());

CREATE POLICY "system_can_insert_events"
ON document_events FOR INSERT
TO authenticated
WITH CHECK (tenant_id = current_tenant_id());

-- ============================================
-- FUNÇÃO AUXILIAR: Registrar Evento
-- ============================================
CREATE OR REPLACE FUNCTION log_document_event(
  p_document_id UUID,
  p_event_type VARCHAR,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Obter tenant_id do documento
  SELECT tenant_id INTO v_tenant_id
  FROM documents
  WHERE id = p_document_id;
  
  -- Se não encontrou, usar tenant atual
  IF v_tenant_id IS NULL THEN
    v_tenant_id := current_tenant_id();
  END IF;
  
  -- Inserir evento
  INSERT INTO document_events (
    tenant_id,
    document_id,
    user_id,
    event_type,
    metadata
  ) VALUES (
    v_tenant_id,
    p_document_id,
    auth.uid(),
    p_event_type,
    p_metadata
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_document_event IS 
'Registra evento de documento para auditoria (LGPD)';

COMMENT ON TABLE document_events IS 
'Auditoria de eventos de documentos para conformidade LGPD';

