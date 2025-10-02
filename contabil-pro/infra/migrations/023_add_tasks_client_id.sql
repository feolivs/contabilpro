-- Migration 023: Adicionar client_id na tabela tasks
-- Data: 02/10/2025
-- Objetivo: Permitir vinculação de tarefas a clientes específicos

-- Adicionar coluna client_id na tabela tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Criar índice para melhor performance nas queries por cliente
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);

-- Comentário explicativo
COMMENT ON COLUMN tasks.client_id IS 'Cliente vinculado à tarefa (opcional). Permite filtrar tarefas por cliente.';

