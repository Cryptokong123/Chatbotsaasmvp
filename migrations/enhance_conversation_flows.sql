-- Enhanced Conversation Flows with Node Types
-- Adds support for complex conversation flows with various node types

-- Update conversation_flows to add more metadata
ALTER TABLE conversation_flows
ADD COLUMN IF NOT EXISTS entry_node_id TEXT, -- Starting node
ADD COLUMN IF NOT EXISTS variables_schema JSONB DEFAULT '{}'; -- Define expected variables

-- Flow Node Types Reference (stored in nodes JSONB)
-- Each node has: { id, type, position: {x, y}, data: {...} }
--
-- Node Types:
-- 1. 'start' - Entry point
-- 2. 'message' - Bot sends a message
-- 3. 'question' - Ask user for input
-- 4. 'condition' - Branch based on logic
-- 5. 'api_call' - External API request
-- 6. 'set_variable' - Store/update variable
-- 7. 'form' - Collect multiple fields
-- 8. 'end' - Terminate flow
-- 9. 'handoff' - Transfer to human
-- 10. 'intent_check' - Route based on AI intent detection

-- Flow Execution State
CREATE TABLE IF NOT EXISTS flow_execution_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES conversation_flows(id) ON DELETE CASCADE,
  current_node_id TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- Runtime variables
  execution_path JSONB DEFAULT '[]', -- Array of node IDs visited
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'paused', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Flow Templates (pre-built flows users can clone)
CREATE TABLE IF NOT EXISTS flow_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'lead_capture', 'support', 'sales', 'onboarding'
  thumbnail_url TEXT,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  variables_schema JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conditional Logic Operators Table (for reference and validation)
CREATE TABLE IF NOT EXISTS flow_operators (
  operator TEXT PRIMARY KEY,
  description TEXT,
  applies_to TEXT[] -- Data types: 'string', 'number', 'boolean', 'array'
);

-- Insert standard operators
INSERT INTO flow_operators (operator, description, applies_to) VALUES
  ('equals', 'Exact match', ARRAY['string', 'number', 'boolean']),
  ('not_equals', 'Not equal to', ARRAY['string', 'number', 'boolean']),
  ('contains', 'String contains substring', ARRAY['string']),
  ('not_contains', 'String does not contain', ARRAY['string']),
  ('starts_with', 'String starts with', ARRAY['string']),
  ('ends_with', 'String ends with', ARRAY['string']),
  ('greater_than', 'Numeric greater than', ARRAY['number']),
  ('less_than', 'Numeric less than', ARRAY['number']),
  ('greater_or_equal', 'Greater than or equal', ARRAY['number']),
  ('less_or_equal', 'Less than or equal', ARRAY['number']),
  ('is_empty', 'Value is empty/null', ARRAY['string', 'array']),
  ('is_not_empty', 'Value exists', ARRAY['string', 'array']),
  ('matches_regex', 'Matches regular expression', ARRAY['string']),
  ('in_array', 'Value is in array', ARRAY['string', 'number']),
  ('not_in_array', 'Value is not in array', ARRAY['string', 'number'])
ON CONFLICT (operator) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flow_execution_state_conversation ON flow_execution_state(conversation_id);
CREATE INDEX IF NOT EXISTS idx_flow_execution_state_flow ON flow_execution_state(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_execution_state_status ON flow_execution_state(status);
CREATE INDEX IF NOT EXISTS idx_flow_templates_category ON flow_templates(category);
CREATE INDEX IF NOT EXISTS idx_flow_templates_public ON flow_templates(is_public);

-- Row Level Security
ALTER TABLE flow_execution_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flow execution states" ON flow_execution_state
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN bots b ON c.bot_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage flow execution" ON flow_execution_state
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view public templates" ON flow_templates
  FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates" ON flow_templates
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates" ON flow_templates
  FOR UPDATE
  USING (created_by = auth.uid());

-- Function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE flow_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE flow_execution_state IS 'Runtime state of flow execution for each conversation';
COMMENT ON TABLE flow_templates IS 'Pre-built flow templates that users can clone';
COMMENT ON COLUMN flow_execution_state.variables IS 'Runtime variables collected during flow execution';
COMMENT ON COLUMN flow_execution_state.execution_path IS 'Array of node IDs showing the path taken';

-- Example flow node structures (for documentation):
/*

START NODE:
{
  "id": "start-1",
  "type": "start",
  "position": {"x": 100, "y": 100},
  "data": {
    "label": "Start"
  }
}

MESSAGE NODE:
{
  "id": "msg-1",
  "type": "message",
  "position": {"x": 200, "y": 200},
  "data": {
    "message": "Welcome to our support!",
    "delay": 0
  }
}

QUESTION NODE:
{
  "id": "q-1",
  "type": "question",
  "position": {"x": 300, "y": 300},
  "data": {
    "question": "What's your order number?",
    "variable_name": "order_number",
    "validation": {
      "type": "regex",
      "pattern": "^[A-Z0-9]{6}$",
      "error_message": "Please enter a valid 6-character order number"
    },
    "input_type": "text"
  }
}

CONDITION NODE:
{
  "id": "cond-1",
  "type": "condition",
  "position": {"x": 400, "y": 400},
  "data": {
    "conditions": [
      {
        "variable": "order_status",
        "operator": "equals",
        "value": "shipped",
        "next_node": "msg-shipped"
      },
      {
        "variable": "order_status",
        "operator": "equals",
        "value": "pending",
        "next_node": "msg-pending"
      }
    ],
    "default_next_node": "msg-unknown"
  }
}

FORM NODE:
{
  "id": "form-1",
  "type": "form",
  "position": {"x": 500, "y": 500},
  "data": {
    "title": "Contact Information",
    "fields": [
      {"name": "name", "label": "Full Name", "type": "text", "required": true},
      {"name": "email", "label": "Email", "type": "email", "required": true},
      {"name": "phone", "label": "Phone", "type": "phone", "required": false}
    ]
  }
}

API_CALL NODE:
{
  "id": "api-1",
  "type": "api_call",
  "position": {"x": 600, "y": 600},
  "data": {
    "url": "https://api.example.com/orders/{{order_number}}",
    "method": "GET",
    "headers": {"Authorization": "Bearer {{api_key}}"},
    "store_response_in": "order_data",
    "on_success": "next-node-id",
    "on_error": "error-node-id"
  }
}

*/
