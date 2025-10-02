-- Migration 024: Criar tabela client_timeline
-- Data: 02/10/2025
-- Objetivo: Registrar timeline de atividades relacionadas aos clientes

-- Criar tabela de timeline de atividades do cliente
CREATE TABLE IF NOT EXISTS client_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Tipo e conteúdo do evento
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Relacionamentos opcionais (para rastreabilidade)
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  
  -- Auditoria
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_client_timeline_client_id ON client_timeline(client_id);
CREATE INDEX IF NOT EXISTS idx_client_timeline_created_at ON client_timeline(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_timeline_event_type ON client_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_client_timeline_tenant_id ON client_timeline(tenant_id);

-- Habilitar RLS
ALTER TABLE client_timeline ENABLE ROW LEVEL SECURITY;

-- Política RLS: Usuários podem ver timeline do seu tenant
CREATE POLICY "Users can view timeline from their tenant" ON client_timeline
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- Política RLS: Sistema pode inserir eventos
CREATE POLICY "System can insert timeline events" ON client_timeline
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

-- Comentários
COMMENT ON TABLE client_timeline IS 'Timeline de atividades relacionadas aos clientes';
COMMENT ON COLUMN client_timeline.event_type IS 'Tipo do evento (document_uploaded, task_completed, entry_created, etc.)';
COMMENT ON COLUMN client_timeline.title IS 'Título descritivo do evento';
COMMENT ON COLUMN client_timeline.description IS 'Descrição detalhada do evento (opcional)';
COMMENT ON COLUMN client_timeline.metadata IS 'Dados adicionais específicos do tipo de evento em formato JSON';
COMMENT ON COLUMN client_timeline.document_id IS 'ID do documento relacionado (se aplicável)';
COMMENT ON COLUMN client_timeline.task_id IS 'ID da tarefa relacionada (se aplicável)';
COMMENT ON COLUMN client_timeline.entry_id IS 'ID do lançamento relacionado (se aplicável)';
COMMENT ON COLUMN client_timeline.user_id IS 'Usuário que realizou a ação';

