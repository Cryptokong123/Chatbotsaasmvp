-- Create conversation metadata table for tags and notes
CREATE TABLE IF NOT EXISTS conversation_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, bot_id)
);

-- Add RLS policies
ALTER TABLE conversation_metadata ENABLE ROW LEVEL SECURITY;

-- Users can only access their own conversation metadata
CREATE POLICY "Users can view own conversation metadata"
  ON conversation_metadata
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation metadata"
  ON conversation_metadata
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation metadata"
  ON conversation_metadata
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversation metadata"
  ON conversation_metadata
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_metadata_session_id ON conversation_metadata(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metadata_bot_id ON conversation_metadata(bot_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metadata_user_id ON conversation_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metadata_tags ON conversation_metadata USING GIN(tags);
