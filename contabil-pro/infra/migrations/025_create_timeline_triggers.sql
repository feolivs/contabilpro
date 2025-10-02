-- Migration 025: Criar triggers para registro automático na timeline
-- Data: 02/10/2025
-- Objetivo: Registrar automaticamente eventos na timeline quando ações ocorrem

-- ============================================================================
-- TRIGGER 1: Documentos
-- ============================================================================

-- Função para registrar eventos de documentos na timeline
CREATE OR REPLACE FUNCTION log_document_timeline()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas registrar se o documento estiver vinculado a um cliente
  IF NEW.client_id IS NOT NULL THEN
    INSERT INTO client_timeline (
      tenant_id,
      client_id,
      event_type,
      title,
      description,
      document_id,
      user_id,
      metadata
    ) VALUES (
      NEW.tenant_id,
      NEW.client_id,
      'document_uploaded',
      'Documento adicionado: ' || NEW.name,
      CASE 
        WHEN NEW.description IS NOT NULL THEN NEW.description
        ELSE NULL
      END,
      NEW.id,
      NEW.uploaded_by,
      jsonb_build_object(
        'file_size', NEW.size,
        'mime_type', NEW.mime_type,
        'file_name', NEW.name
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para INSERT de documentos
DROP TRIGGER IF EXISTS document_timeline_trigger ON documents;
CREATE TRIGGER document_timeline_trigger
AFTER INSERT ON documents
FOR EACH ROW
EXECUTE FUNCTION log_document_timeline();

-- ============================================================================
-- TRIGGER 2: Tarefas
-- ============================================================================

-- Função para registrar eventos de tarefas na timeline
CREATE OR REPLACE FUNCTION log_task_timeline()
RETURNS TRIGGER AS $$
DECLARE
  event_type_value VARCHAR(50);
  event_title TEXT;
BEGIN
  -- Apenas registrar se a tarefa estiver vinculada a um cliente
  IF NEW.client_id IS NOT NULL THEN
    
    -- Determinar tipo de evento baseado na operação
    IF TG_OP = 'INSERT' THEN
      event_type_value := 'task_created';
      event_title := 'Tarefa criada: ' || NEW.title;
      
      INSERT INTO client_timeline (
        tenant_id,
        client_id,
        event_type,
        title,
        description,
        task_id,
        user_id,
        metadata
      ) VALUES (
        NEW.tenant_id,
        NEW.client_id,
        event_type_value,
        event_title,
        NEW.description,
        NEW.id,
        NEW.created_by,
        jsonb_build_object(
          'priority', NEW.priority,
          'status', NEW.status,
          'type', NEW.type,
          'due_date', NEW.due_date
        )
      );
      
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
      -- Mudança de status
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
        tenant_id,
        client_id,
        event_type,
        title,
        description,
        task_id,
        user_id,
        metadata
      ) VALUES (
        NEW.tenant_id,
        NEW.client_id,
        event_type_value,
        event_title,
        NEW.description,
        NEW.id,
        COALESCE(NEW.assigned_to, NEW.created_by),
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'priority', NEW.priority,
          'type', NEW.type
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para INSERT e UPDATE de tarefas
DROP TRIGGER IF EXISTS task_timeline_trigger ON tasks;
CREATE TRIGGER task_timeline_trigger
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION log_task_timeline();

-- ============================================================================
-- TRIGGER 3: Lançamentos (Entries)
-- ============================================================================

-- Função para registrar eventos de lançamentos na timeline
CREATE OR REPLACE FUNCTION log_entry_timeline()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas registrar se o lançamento estiver vinculado a um cliente
  IF NEW.client_id IS NOT NULL THEN
    
    IF TG_OP = 'INSERT' THEN
      INSERT INTO client_timeline (
        tenant_id,
        client_id,
        event_type,
        title,
        description,
        entry_id,
        user_id,
        metadata
      ) VALUES (
        NEW.tenant_id,
        NEW.client_id,
        'entry_created',
        'Lançamento registrado: ' || COALESCE(NEW.description, 'Sem descrição'),
        NEW.description,
        NEW.id,
        NEW.created_by,
        jsonb_build_object(
          'amount', NEW.amount,
          'entry_date', NEW.entry_date,
          'type', NEW.type
        )
      );
      
    ELSIF TG_OP = 'UPDATE' THEN
      INSERT INTO client_timeline (
        tenant_id,
        client_id,
        event_type,
        title,
        description,
        entry_id,
        user_id,
        metadata
      ) VALUES (
        NEW.tenant_id,
        NEW.client_id,
        'entry_updated',
        'Lançamento atualizado: ' || COALESCE(NEW.description, 'Sem descrição'),
        NEW.description,
        NEW.id,
        NEW.created_by,
        jsonb_build_object(
          'amount', NEW.amount,
          'entry_date', NEW.entry_date,
          'type', NEW.type
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para INSERT e UPDATE de lançamentos
DROP TRIGGER IF EXISTS entry_timeline_trigger ON entries;
CREATE TRIGGER entry_timeline_trigger
AFTER INSERT OR UPDATE ON entries
FOR EACH ROW
EXECUTE FUNCTION log_entry_timeline();

-- Comentários
COMMENT ON FUNCTION log_document_timeline() IS 'Registra eventos de documentos na timeline do cliente';
COMMENT ON FUNCTION log_task_timeline() IS 'Registra eventos de tarefas na timeline do cliente';
COMMENT ON FUNCTION log_entry_timeline() IS 'Registra eventos de lançamentos na timeline do cliente';

