-- Migration 026: Remover tenant_id da tabela client_timeline
-- Data: 03/10/2025
-- Objetivo: Refatorar para single-user (sem multi-tenant)

-- ============================================================================
-- 1. REMOVER CONSTRAINT E COLUNA tenant_id
-- ============================================================================

-- Remover índice
DROP INDEX IF EXISTS idx_client_timeline_tenant_id;

-- Remover políticas RLS antigas (que usam tenant_id)
DROP POLICY IF EXISTS "Users can view timeline from their tenant" ON client_timeline;
DROP POLICY IF EXISTS "System can insert timeline events" ON client_timeline;

-- Remover coluna tenant_id
ALTER TABLE client_timeline 
DROP COLUMN IF EXISTS tenant_id;

-- ============================================================================
-- 2. ATUALIZAR POLÍTICAS RLS (por owner_id)
-- ============================================================================

-- Política RLS: Usuários podem ver timeline dos seus clientes
CREATE POLICY "Users can view their clients timeline" ON client_timeline
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE owner_id = auth.uid()
    )
  );

-- Política RLS: Usuários podem inserir eventos na timeline dos seus clientes
CREATE POLICY "Users can insert timeline events for their clients" ON client_timeline
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. ATUALIZAR TRIGGERS (remover tenant_id)
-- ============================================================================

-- Trigger para documentos
CREATE OR REPLACE FUNCTION log_document_timeline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    INSERT INTO client_timeline (
      client_id, event_type, title, description,
      document_id, user_id, metadata
    ) VALUES (
      NEW.client_id, 'document_uploaded',
      'Documento adicionado: ' || NEW.name,
      NEW.description, NEW.id, NEW.uploaded_by,
      jsonb_build_object('file_size', NEW.size, 'mime_type', NEW.mime_type, 'file_name', NEW.name)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
        client_id, event_type, title, description,
        task_id, user_id, metadata
      ) VALUES (
        NEW.client_id, event_type_value, event_title,
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
        client_id, event_type, title, description,
        task_id, user_id, metadata
      ) VALUES (
        NEW.client_id, event_type_value, event_title,
        NEW.description, NEW.id, COALESCE(NEW.assigned_to, NEW.created_by),
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'priority', NEW.priority, 'type', NEW.type)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para lançamentos
CREATE OR REPLACE FUNCTION log_entry_timeline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO client_timeline (
        client_id, event_type, title, description,
        entry_id, user_id, metadata
      ) VALUES (
        NEW.client_id, 'entry_created',
        'Lançamento registrado: ' || COALESCE(NEW.description, 'Sem descrição'),
        NEW.description, NEW.id, NEW.created_by,
        jsonb_build_object('amount', NEW.amount, 'entry_date', NEW.entry_date, 'type', NEW.type)
      );
      
    ELSIF TG_OP = 'UPDATE' THEN
      INSERT INTO client_timeline (
        client_id, event_type, title, description,
        entry_id, user_id, metadata
      ) VALUES (
        NEW.client_id, 'entry_updated',
        'Lançamento atualizado: ' || COALESCE(NEW.description, 'Sem descrição'),
        NEW.description, NEW.id, NEW.created_by,
        jsonb_build_object('amount', NEW.amount, 'entry_date', NEW.entry_date, 'type', NEW.type)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE client_timeline IS 'Timeline de atividades relacionadas aos clientes (single-user, sem tenant_id)';
COMMENT ON COLUMN client_timeline.client_id IS 'Cliente relacionado ao evento';
COMMENT ON COLUMN client_timeline.event_type IS 'Tipo do evento (document_uploaded, task_completed, entry_created, etc.)';
COMMENT ON COLUMN client_timeline.title IS 'Título descritivo do evento';
COMMENT ON COLUMN client_timeline.description IS 'Descrição detalhada do evento (opcional)';
COMMENT ON COLUMN client_timeline.metadata IS 'Dados adicionais específicos do tipo de evento em formato JSON';
COMMENT ON COLUMN client_timeline.user_id IS 'Usuário que gerou o evento';
COMMENT ON COLUMN client_timeline.created_at IS 'Data e hora do evento';

