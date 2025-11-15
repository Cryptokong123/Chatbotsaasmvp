-- Conversation Flow Builder

-- Conversation Flows (visual builder)
CREATE TABLE IF NOT EXISTS conversation_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  trigger_type TEXT DEFAULT 'keyword' CHECK (trigger_type IN ('keyword', 'intent', 'always', 'button_click')),
  trigger_value TEXT,
  nodes JSONB DEFAULT '[]', -- Array of flow nodes
  edges JSONB DEFAULT '[]', -- Array of connections between nodes
  variables JSONB DEFAULT '{}', -- Flow variables
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flow Analytics
CREATE TABLE IF NOT EXISTS flow_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES conversation_flows(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversation_flows_bot ON conversation_flows(bot_id);
CREATE INDEX IF NOT EXISTS idx_conversation_flows_active ON conversation_flows(is_active);
CREATE INDEX IF NOT EXISTS idx_flow_analytics_flow ON flow_analytics(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_analytics_executed_at ON flow_analytics(executed_at DESC);

-- Update trigger
CREATE OR REPLACE FUNCTION update_conversation_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_flows_updated_at
  BEFORE UPDATE ON conversation_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_flows_updated_at();

-- Row Level Security
ALTER TABLE conversation_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_analytics ENABLE ROW LEVEL SECURITY;

-- Users can manage flows for their bots
CREATE POLICY "Users can view own flows" ON conversation_flows
  FOR SELECT
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create flows" ON conversation_flows
  FOR INSERT
  WITH CHECK (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own flows" ON conversation_flows
  FOR UPDATE
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own flows" ON conversation_flows
  FOR DELETE
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

-- Users can view analytics for their flows
CREATE POLICY "Users can view flow analytics" ON flow_analytics
  FOR SELECT
  USING (
    flow_id IN (
      SELECT f.id FROM conversation_flows f
      JOIN bots b ON f.bot_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE conversation_flows IS 'Visual conversation flows built with the flow editor';
COMMENT ON COLUMN conversation_flows.nodes IS 'Array of flow nodes with type, config, and position';
COMMENT ON COLUMN conversation_flows.edges IS 'Array of connections between nodes';
COMMENT ON TABLE flow_analytics IS 'Analytics for flow execution and performance';
