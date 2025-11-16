-- Pre-Chat Forms System
-- Allows collecting user information before starting a conversation

-- Form Definitions
CREATE TABLE IF NOT EXISTS pre_chat_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  show_on_load BOOLEAN DEFAULT false, -- Show immediately vs on first message
  required_to_chat BOOLEAN DEFAULT false, -- User must complete form to chat
  submit_button_text TEXT DEFAULT 'Start Chat',
  welcome_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form Fields
CREATE TABLE IF NOT EXISTS pre_chat_form_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES pre_chat_forms(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- Internal name for the field
  field_label TEXT NOT NULL, -- Display label
  field_type TEXT NOT NULL CHECK (field_type IN (
    'text', 'email', 'phone', 'number', 'textarea',
    'select', 'radio', 'checkbox', 'date', 'time'
  )),
  placeholder TEXT,
  default_value TEXT,
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB DEFAULT '{}', -- { "min": 5, "max": 100, "pattern": "regex" }
  options JSONB DEFAULT '[]', -- For select, radio, checkbox: [{"label": "Option 1", "value": "opt1"}]
  conditional_logic JSONB DEFAULT NULL, -- Show field only if condition met: {"field": "other_field_name", "operator": "equals", "value": "yes"}
  order_index INTEGER NOT NULL DEFAULT 0,
  help_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form Submissions
CREATE TABLE IF NOT EXISTS pre_chat_form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES pre_chat_forms(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  form_data JSONB NOT NULL, -- Submitted form values: {"name": "John", "email": "john@example.com"}
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pre_chat_forms_bot ON pre_chat_forms(bot_id);
CREATE INDEX IF NOT EXISTS idx_pre_chat_forms_active ON pre_chat_forms(is_active);
CREATE INDEX IF NOT EXISTS idx_pre_chat_form_fields_form ON pre_chat_form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_pre_chat_form_fields_order ON pre_chat_form_fields(form_id, order_index);
CREATE INDEX IF NOT EXISTS idx_pre_chat_submissions_form ON pre_chat_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_pre_chat_submissions_session ON pre_chat_form_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_pre_chat_submissions_conversation ON pre_chat_form_submissions(conversation_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_pre_chat_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pre_chat_forms
  BEFORE UPDATE ON pre_chat_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_pre_chat_forms_updated_at();

-- Row Level Security
ALTER TABLE pre_chat_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_chat_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_chat_form_submissions ENABLE ROW LEVEL SECURITY;

-- Users can manage forms for their bots
CREATE POLICY "Users can view own forms" ON pre_chat_forms
  FOR SELECT
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create forms" ON pre_chat_forms
  FOR INSERT
  WITH CHECK (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own forms" ON pre_chat_forms
  FOR UPDATE
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own forms" ON pre_chat_forms
  FOR DELETE
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

-- Form fields policies
CREATE POLICY "Users can view own form fields" ON pre_chat_form_fields
  FOR SELECT
  USING (
    form_id IN (
      SELECT f.id FROM pre_chat_forms f
      JOIN bots b ON f.bot_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own form fields" ON pre_chat_form_fields
  FOR ALL
  USING (
    form_id IN (
      SELECT f.id FROM pre_chat_forms f
      JOIN bots b ON f.bot_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Public can submit forms (widget usage)
CREATE POLICY "Allow form submissions" ON pre_chat_form_submissions
  FOR INSERT
  WITH CHECK (true); -- Validated in API layer

-- Users can view their form submissions
CREATE POLICY "Users can view form submissions" ON pre_chat_form_submissions
  FOR SELECT
  USING (
    form_id IN (
      SELECT f.id FROM pre_chat_forms f
      JOIN bots b ON f.bot_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE pre_chat_forms IS 'Form definitions shown before or during chat initiation';
COMMENT ON TABLE pre_chat_form_fields IS 'Individual fields in pre-chat forms with validation and conditional logic';
COMMENT ON TABLE pre_chat_form_submissions IS 'User-submitted form data linked to conversations';
COMMENT ON COLUMN pre_chat_form_fields.validation_rules IS 'JSON validation rules: min, max, pattern, custom validators';
COMMENT ON COLUMN pre_chat_form_fields.conditional_logic IS 'Show/hide field based on other field values';
COMMENT ON COLUMN pre_chat_form_submissions.form_data IS 'Complete form submission data as key-value pairs';
