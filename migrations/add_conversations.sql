-- Conversations Table
-- Tracks individual conversations/sessions with metadata

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- External session ID for widget
  user_identifier TEXT, -- Email, name, or anonymous ID
  user_email TEXT,
  user_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  -- Response time tracking
  first_message_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  first_response_at TIMESTAMP WITH TIME ZONE, -- When bot first responded
  avg_response_time_ms INTEGER, -- Average bot response time in milliseconds
  total_messages INTEGER DEFAULT 0,
  -- Assignment and collaboration
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bot_id, session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_bot_id ON conversations(bot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_tags ON conversations USING GIN(tags);

-- Conversation Ratings
CREATE TABLE IF NOT EXISTS conversation_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_ratings_conversation ON conversation_ratings(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_ratings_rating ON conversation_ratings(rating);

-- Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_ratings ENABLE ROW LEVEL SECURITY;

-- Users can view conversations for their own bots
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE
  USING (
    bot_id IN (
      SELECT id FROM bots WHERE user_id = auth.uid()
    )
  );

-- Allow widgets to create conversations
CREATE POLICY "Allow widget to create conversations" ON conversations
  FOR INSERT
  WITH CHECK (true); -- Validated in API layer

-- Users can view ratings for their conversations
CREATE POLICY "Users can view ratings" ON conversation_ratings
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN bots b ON c.bot_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Allow public to create ratings (validated in API)
CREATE POLICY "Allow public rating insert" ON conversation_ratings
  FOR INSERT
  WITH CHECK (true);

-- Update trigger for conversations
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

-- Function to update conversation stats when messages are added
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_conversation_id UUID;
  v_bot_response_times INTEGER[];
  v_avg_response_time INTEGER;
BEGIN
  -- Get or create conversation for this session
  INSERT INTO conversations (bot_id, session_id, first_message_at, last_message_at)
  VALUES (NEW.bot_id, NEW.session_id, NEW.created_at, NEW.created_at)
  ON CONFLICT (bot_id, session_id)
  DO UPDATE SET
    last_message_at = NEW.created_at,
    total_messages = conversations.total_messages + 1
  RETURNING id INTO v_conversation_id;

  -- If this is a bot message, calculate response time
  IF NEW.role = 'assistant' THEN
    -- Get the most recent user message before this bot message
    WITH recent_user_msg AS (
      SELECT created_at
      FROM messages
      WHERE bot_id = NEW.bot_id
        AND session_id = NEW.session_id
        AND role = 'user'
        AND created_at < NEW.created_at
      ORDER BY created_at DESC
      LIMIT 1
    )
    UPDATE conversations
    SET
      first_response_at = COALESCE(first_response_at, NEW.created_at),
      avg_response_time_ms = (
        SELECT AVG(
          EXTRACT(EPOCH FROM (bot_msg.created_at - user_msg.created_at)) * 1000
        )::INTEGER
        FROM messages bot_msg
        JOIN LATERAL (
          SELECT created_at
          FROM messages
          WHERE bot_id = bot_msg.bot_id
            AND session_id = bot_msg.session_id
            AND role = 'user'
            AND created_at < bot_msg.created_at
          ORDER BY created_at DESC
          LIMIT 1
        ) user_msg ON true
        WHERE bot_msg.bot_id = NEW.bot_id
          AND bot_msg.session_id = NEW.session_id
          AND bot_msg.role = 'assistant'
      )
    WHERE id = v_conversation_id;
  END IF;

  -- Add conversation_id to the message metadata if needed
  IF NEW.metadata IS NULL THEN
    NEW.metadata = jsonb_build_object('conversation_id', v_conversation_id);
  ELSE
    NEW.metadata = NEW.metadata || jsonb_build_object('conversation_id', v_conversation_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation stats on message insert
CREATE TRIGGER trigger_update_conversation_stats
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_stats();

-- Comments
COMMENT ON TABLE conversations IS 'Individual conversation sessions with metadata and tracking';
COMMENT ON COLUMN conversations.session_id IS 'External session ID from the widget';
COMMENT ON COLUMN conversations.avg_response_time_ms IS 'Average time in milliseconds for bot to respond';
COMMENT ON COLUMN conversations.first_response_at IS 'When the bot first responded in this conversation';
COMMENT ON TABLE conversation_ratings IS 'User ratings and feedback for conversations';
