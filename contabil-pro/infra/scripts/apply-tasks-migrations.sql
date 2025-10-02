-- Script para aplicar todas as migrations de Tarefas e Timeline
-- Execute este script no Supabase SQL Editor
-- Data: 02/10/2025

-- ============================================================================
-- MIGRATION 023: Adicionar client_id em tasks
-- ============================================================================

\echo 'Aplicando Migration 023: Adicionar client_id em tasks...'

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);

COMMENT ON COLUMN tasks.client_id IS 'Cliente vinculado à tarefa (opcional). Permite filtrar tarefas por cliente.';

\echo 'Migration 023 aplicada com sucesso!'

-- ============================================================================
-- MIGRATION 024: Criar tabela client_timeline
-- ============================================================================

\echo 'Aplicando Migration 024: Criar tabela client_timeline...'

CREATE TABLE IF NOT EXISTS client_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_timeline_client_id ON client_timeline(client_id);
CREATE INDEX IF NOT EXISTS idx_client_timeline_created_at ON client_timeline(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_timeline_event_type ON client_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_client_timeline_tenant_id ON client_timeline(tenant_id);

ALTER TABLE client_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view timeline from their tenant" ON client_timeline;
CREATE POLICY "Users can view timeline from their tenant" ON client_timeline
  FOR SELECT
  USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS "System can insert timeline events" ON client_timeline;
CREATE POLICY "System can insert timeline events" ON client_timeline
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

COMMENT ON TABLE client_timeline IS 'Timeline de atividades relacionadas aos clientes';
COMMENT ON COLUMN client_timeline.event_type IS 'Tipo do evento (document_uploaded, task_completed, entry_created, etc.)';
COMMENT ON COLUMN client_timeline.metadata IS 'Dados adicionais específicos do tipo de evento em formato JSON';

\echo 'Migration 024 aplicada com sucesso!'

-- ============================================================================
-- MIGRATION 025: Criar triggers de timeline
-- ============================================================================

\echo 'Aplicando Migration 025: Criar triggers de timeline...'

-- Trigger para documentos
CREATE OR REPLACE FUNCTION log_document_timeline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    INSERT INTO client_timeline (
      tenant_id, client_id, event_type, title, description,
      document_id, user_id, metadata
    ) VALUES (
      NEW.tenant_id, NEW.client_id, 'document_uploaded',
      'Documento adicionado: ' || NEW.name,
      NEW.description, NEW.id, NEW.uploaded_by,
      jsonb_build_object('file_size', NEW.size, 'mime_type', NEW.mime_type, 'file_name', NEW.name)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS document_timeline_trigger ON documents;
CREATE TRIGGER document_timeline_trigger
AFTER INSERT ON documents
FOR EACH ROW
EXECUTE FUNCTION log_document_timeline();

-- Trigger para tarefas
CREATE OR REPLACE FUNCTION log_task_timeline()
RETURNS TRIGGER AS $$
DECLARE
  event_type_value VARCHAR(50);
  event_title TEXT;
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      event_type_value := 'task_created';
      event_title := 'Tarefa criada: ' || NEW.title;
      
      INSERT INTO client_timeline (
        tenant_id, client_id, event_type, title, description,
        task_id, user_id, metadata
      ) VALUES (
        NEW.tenant_id, NEW.client_id, event_type_value, event_title,
        NEW.description, NEW.id, NEW.created_by,
        jsonb_build_object('priority', NEW.priority, 'status', NEW.status, 'type', NEW.type, 'due_date', NEW.due_date)
      );
      
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
      CASE NEW.status
        WHEN 'in_progress' THEN
          event_type_value := 'task_started';
          event_title := 'Tarefa iniciada: ' || NEW.title;
        WHEN 'completed' THEN
          event_type_value := 'task_completed';
          event_title := 'Tarefa concluída: ' || NEW.title;
        WHEN 'cancelled' THEN
          event_type_value := 'task_cancelled';
          event_title := 'Tarefa cancelada: ' || NEW.title;
        ELSE
          event_type_value := 'task_updated';
          event_title := 'Tarefa atualizada: ' || NEW.title;
      END CASE;
      
      INSERT INTO client_timeline (
        tenant_id, client_id, event_type, title, description,
        task_id, user_id, metadata
      ) VALUES (
        NEW.tenant_id, NEW.client_id, event_type_value, event_title,
        NEW.description, NEW.id, COALESCE(NEW.assigned_to, NEW.created_by),
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'priority', NEW.priority, 'type', NEW.type)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS task_timeline_trigger ON tasks;
CREATE TRIGGER task_timeline_trigger
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION log_task_timeline();

-- Trigger para lançamentos
CREATE OR REPLACE FUNCTION log_entry_timeline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO client_timeline (
        tenant_id, client_id, event_type, title, description,
        entry_id, user_id, metadata
      ) VALUES (
        NEW.tenant_id, NEW.client_id, 'entry_created',
        'Lançamento registrado: ' || COALESCE(NEW.description, 'Sem descrição'),
        NEW.description, NEW.id, NEW.created_by,
        jsonb_build_object('amount', NEW.amount, 'entry_date', NEW.entry_date, 'type', NEW.type)
      );
    ELSIF TG_OP = 'UPDATE' THEN
      INSERT INTO client_timeline (
        tenant_id, client_id, event_type, title, description,
        entry_id, user_id, metadata
      ) VALUES (
        NEW.tenant_id, NEW.client_id, 'entry_updated',
        'Lançamento atualizado: ' || COALESCE(NEW.description, 'Sem descrição'),
        NEW.description, NEW.id, NEW.created_by,
        jsonb_build_object('amount', NEW.amount, 'entry_date', NEW.entry_date, 'type', NEW.type)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS entry_timeline_trigger ON entries;
CREATE TRIGGER entry_timeline_trigger
AFTER INSERT OR UPDATE ON entries
FOR EACH ROW
EXECUTE FUNCTION log_entry_timeline();

COMMENT ON FUNCTION log_document_timeline() IS 'Registra eventos de documentos na timeline do cliente';
COMMENT ON FUNCTION log_task_timeline() IS 'Registra eventos de tarefas na timeline do cliente';
COMMENT ON FUNCTION log_entry_timeline() IS 'Registra eventos de lançamentos na timeline do cliente';

\echo 'Migration 025 aplicada com sucesso!'

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

\echo ''
\echo '============================================'
\echo 'VERIFICAÇÃO DAS MIGRATIONS'
\echo '============================================'
\echo ''

-- Verificar coluna client_id em tasks
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'client_id'
    ) 
    THEN '✅ Coluna tasks.client_id criada'
    ELSE '❌ Coluna tasks.client_id NÃO encontrada'
  END as status;

-- Verificar tabela client_timeline
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'client_timeline'
    ) 
    THEN '✅ Tabela client_timeline criada'
    ELSE '❌ Tabela client_timeline NÃO encontrada'
  END as status;

-- Verificar triggers
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'document_timeline_trigger'
    ) 
    THEN '✅ Trigger document_timeline_trigger criado'
    ELSE '❌ Trigger document_timeline_trigger NÃO encontrado'
  END as status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'task_timeline_trigger'
    ) 
    THEN '✅ Trigger task_timeline_trigger criado'
    ELSE '❌ Trigger task_timeline_trigger NÃO encontrado'
  END as status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'entry_timeline_trigger'
    ) 
    THEN '✅ Trigger entry_timeline_trigger criado'
    ELSE '❌ Trigger entry_timeline_trigger NÃO encontrado'
  END as status;

\echo ''
\echo '============================================'
\echo 'TODAS AS MIGRATIONS APLICADAS COM SUCESSO!'
\echo '============================================'

