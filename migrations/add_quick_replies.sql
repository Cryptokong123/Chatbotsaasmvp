-- Quick Reply Templates

CREATE TABLE IF NOT EXISTS quick_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  shortcut TEXT, -- Optional keyboard shortcut like "/hi", "/thanks"
  category TEXT DEFAULT 'general' CHECK (category IN (
    'greeting',
    'closing',
    'support',
    'sales',
    'technical',
    'billing',
    'general',
    'apology',
    'thank_you',
    'follow_up'
  )),
  is_global BOOLEAN DEFAULT false, -- If true, available across all bots
  use_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quick reply usage tracking
CREATE TABLE IF NOT EXISTS quick_reply_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quick_reply_id UUID NOT NULL REFERENCES quick_replies(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quick_replies_user ON quick_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_replies_bot ON quick_replies(bot_id);
CREATE INDEX IF NOT EXISTS idx_quick_replies_category ON quick_replies(category);
CREATE INDEX IF NOT EXISTS idx_quick_replies_shortcut ON quick_replies(shortcut);
CREATE INDEX IF NOT EXISTS idx_quick_reply_usage_quick_reply ON quick_reply_usage(quick_reply_id);
CREATE INDEX IF NOT EXISTS idx_quick_reply_usage_used_at ON quick_reply_usage(used_at);

-- Update function
CREATE OR REPLACE FUNCTION update_quick_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quick_replies_updated_at
  BEFORE UPDATE ON quick_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_quick_replies_updated_at();

-- Trigger to increment use_count when used
CREATE OR REPLACE FUNCTION increment_quick_reply_use_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE quick_replies
  SET use_count = use_count + 1
  WHERE id = NEW.quick_reply_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_quick_reply_use_count
  AFTER INSERT ON quick_reply_usage
  FOR EACH ROW
  EXECUTE FUNCTION increment_quick_reply_use_count();

-- Row Level Security
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_reply_usage ENABLE ROW LEVEL SECURITY;

-- Users can manage their own quick replies
CREATE POLICY "Users can view their own quick replies" ON quick_replies
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own quick replies" ON quick_replies
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own quick replies" ON quick_replies
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own quick replies" ON quick_replies
  FOR DELETE
  USING (user_id = auth.uid());

-- Users can view usage stats for their quick replies
CREATE POLICY "Users can view their quick reply usage" ON quick_reply_usage
  FOR SELECT
  USING (
    quick_reply_id IN (
      SELECT id FROM quick_replies WHERE user_id = auth.uid()
    )
  );

-- Insert some default quick reply templates
INSERT INTO quick_replies (user_id, title, message, shortcut, category, is_global)
VALUES
  -- Use a system user ID for global templates (you'll need to replace this with actual user ID)
  ((SELECT id FROM auth.users LIMIT 1), 'Welcome Greeting', 'Hi there! 👋 Thanks for reaching out. How can I help you today?', '/hi', 'greeting', true),
  ((SELECT id FROM auth.users LIMIT 1), 'Thank You', 'Thank you for contacting us! We appreciate your business. 😊', '/thanks', 'thank_you', true),
  ((SELECT id FROM auth.users LIMIT 1), 'Please Wait', 'Thanks for your patience! I''m looking into this for you now. I''ll get back to you shortly.', '/wait', 'support', true),
  ((SELECT id FROM auth.users LIMIT 1), 'Checking Status', 'Let me check on that for you. One moment please...', '/check', 'support', true),
  ((SELECT id FROM auth.users LIMIT 1), 'Issue Resolved', 'Great! I''m glad we could resolve this for you. Is there anything else I can help you with?', '/resolved', 'support', true),
  ((SELECT id FROM auth.users LIMIT 1), 'Apology', 'I sincerely apologize for the inconvenience. Let me make this right for you.', '/sorry', 'apology', true),
  ((SELECT id FROM auth.users LIMIT 1), 'Transfer to Human', 'I''m transferring you to a human agent who can better assist you. They''ll be with you shortly.', '/transfer', 'support', true),
  ((SELECT id FROM auth.users LIMIT 1), 'Business Hours', 'Our business hours are Monday-Friday, 9 AM to 6 PM EST. We''ll respond to your message as soon as we''re back online!', '/hours', 'general', true),
  ((SELECT id FROM auth.users LIMIT 1), 'Follow Up', 'I''ll follow up with you in 24 hours to ensure everything is working properly. Sound good?', '/followup', 'follow_up', true),
  ((SELECT id FROM auth.users LIMIT 1), 'More Information', 'To help you better, I need a bit more information. Could you please provide [specific details]?', '/moreinfo', 'support', true),
  ((SELECT id FROM auth.users LIMIT 1), 'Closing', 'Thanks for chatting with us today! Feel free to reach out anytime you need assistance. Have a great day! 🌟', '/bye', 'closing', true);

-- Comments
COMMENT ON TABLE quick_replies IS 'Pre-defined message templates for quick responses';
COMMENT ON COLUMN quick_replies.shortcut IS 'Keyboard shortcut to trigger this quick reply, e.g., /hi, /thanks';
COMMENT ON COLUMN quick_replies.is_global IS 'If true, this quick reply is available across all bots for this user';
COMMENT ON COLUMN quick_replies.use_count IS 'Number of times this quick reply has been used';
COMMENT ON TABLE quick_reply_usage IS 'Tracks when and where quick replies are used';
