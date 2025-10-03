-- Migration: Create notification_subscriptions table
-- Description: Tabela para armazenar subscriptions de Web Push API
-- Author: Augment Agent
-- Date: 2025-10-03

-- Create notification_subscriptions table
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_user_id ON notification_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_endpoint ON notification_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_last_used ON notification_subscriptions(last_used_at DESC);

-- Enable RLS
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their subscriptions" ON notification_subscriptions;
DROP POLICY IF EXISTS "Users can insert their subscriptions" ON notification_subscriptions;
DROP POLICY IF EXISTS "Users can update their subscriptions" ON notification_subscriptions;
DROP POLICY IF EXISTS "Users can delete their subscriptions" ON notification_subscriptions;

-- Create RLS policies
CREATE POLICY "Users can view their subscriptions"
  ON notification_subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their subscriptions"
  ON notification_subscriptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their subscriptions"
  ON notification_subscriptions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their subscriptions"
  ON notification_subscriptions
  FOR DELETE
  USING (user_id = auth.uid());

-- Create function to update last_used_at
CREATE OR REPLACE FUNCTION update_subscription_last_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_used_at on update
DROP TRIGGER IF EXISTS trigger_update_subscription_last_used ON notification_subscriptions;
CREATE TRIGGER trigger_update_subscription_last_used
  BEFORE UPDATE ON notification_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_last_used();

-- Add comments
COMMENT ON TABLE notification_subscriptions IS 'Armazena subscriptions de Web Push API para envio de notificações push';
COMMENT ON COLUMN notification_subscriptions.endpoint IS 'URL do endpoint de push notification fornecido pelo browser';
COMMENT ON COLUMN notification_subscriptions.p256dh IS 'Chave pública P-256 para criptografia';
COMMENT ON COLUMN notification_subscriptions.auth IS 'Chave de autenticação para criptografia';
COMMENT ON COLUMN notification_subscriptions.user_agent IS 'User agent do browser que criou a subscription';
COMMENT ON COLUMN notification_subscriptions.last_used_at IS 'Data e hora do último uso da subscription (para limpeza de subscriptions antigas)';

