-- Webhooks System for Integrations

-- Webhook Endpoints
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE, -- NULL = apply to all bots
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT, -- For webhook signature verification
  events TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- Array of event types to subscribe to
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  headers JSONB DEFAULT '{}', -- Custom headers to send
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook Delivery Log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_number INTEGER DEFAULT 1,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_bot ON webhooks(bot_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_type ON webhook_deliveries(event_type);

-- Update trigger
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhooks_updated_at();

-- Row Level Security
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Users can manage their own webhooks
CREATE POLICY "Users can view own webhooks" ON webhooks
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create webhooks" ON webhooks
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own webhooks" ON webhooks
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own webhooks" ON webhooks
  FOR DELETE
  USING (user_id = auth.uid());

-- Users can view delivery logs for their webhooks
CREATE POLICY "Users can view webhook deliveries" ON webhook_deliveries
  FOR SELECT
  USING (
    webhook_id IN (
      SELECT id FROM webhooks WHERE user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE webhooks IS 'Webhook endpoints for real-time event notifications';
COMMENT ON TABLE webhook_deliveries IS 'Log of all webhook delivery attempts and responses';
COMMENT ON COLUMN webhooks.events IS 'Array of event types: conversation.created, message.received, etc.';
COMMENT ON COLUMN webhooks.secret IS 'Secret key for HMAC signature verification';
COMMENT ON COLUMN webhooks.retry_count IS 'Number of retry attempts for failed deliveries';
