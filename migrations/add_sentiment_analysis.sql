-- Sentiment Analysis for Conversations

-- Add sentiment fields to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3, 2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS sentiment_label TEXT DEFAULT 'neutral' CHECK (sentiment_label IN ('positive', 'neutral', 'negative', 'mixed')),
ADD COLUMN IF NOT EXISTS sentiment_analyzed_at TIMESTAMP WITH TIME ZONE;

-- Add sentiment tracking for individual messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative', 'mixed')),
ADD COLUMN IF NOT EXISTS emotions JSONB DEFAULT '{}';

-- Create sentiment analysis log table for tracking changes over time
CREATE TABLE IF NOT EXISTS sentiment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sentiment_score DECIMAL(3, 2) NOT NULL,
  sentiment_label TEXT NOT NULL CHECK (sentiment_label IN ('positive', 'neutral', 'negative', 'mixed')),
  emotions JSONB DEFAULT '{}',
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster sentiment queries
CREATE INDEX IF NOT EXISTS idx_conversations_sentiment ON conversations(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_messages_sentiment ON messages(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_sentiment_history_conversation ON sentiment_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_history_analyzed_at ON sentiment_history(analyzed_at);

-- Function to update conversation sentiment based on messages
CREATE OR REPLACE FUNCTION update_conversation_sentiment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the conversation's overall sentiment based on all messages
  UPDATE conversations
  SET
    sentiment_score = (
      SELECT AVG(sentiment_score)
      FROM messages
      WHERE conversation_id = NEW.conversation_id
        AND sentiment_score IS NOT NULL
    ),
    sentiment_label = (
      CASE
        WHEN (
          SELECT AVG(sentiment_score)
          FROM messages
          WHERE conversation_id = NEW.conversation_id
            AND sentiment_score IS NOT NULL
        ) >= 0.6 THEN 'positive'
        WHEN (
          SELECT AVG(sentiment_score)
          FROM messages
          WHERE conversation_id = NEW.conversation_id
            AND sentiment_score IS NOT NULL
        ) <= 0.4 THEN 'negative'
        ELSE 'neutral'
      END
    ),
    sentiment_analyzed_at = NOW()
  WHERE id = NEW.conversation_id;

  -- Log the sentiment change
  INSERT INTO sentiment_history (conversation_id, sentiment_score, sentiment_label)
  SELECT
    NEW.conversation_id,
    sentiment_score,
    sentiment_label
  FROM conversations
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation sentiment when message sentiment is added/updated
DROP TRIGGER IF EXISTS trigger_update_conversation_sentiment ON messages;
CREATE TRIGGER trigger_update_conversation_sentiment
  AFTER INSERT OR UPDATE OF sentiment_score
  ON messages
  FOR EACH ROW
  WHEN (NEW.sentiment_score IS NOT NULL)
  EXECUTE FUNCTION update_conversation_sentiment();

-- Grant permissions
ALTER TABLE sentiment_history ENABLE ROW LEVEL SECURITY;

-- Users can only see sentiment data for their own conversations
CREATE POLICY "Users can view sentiment for their conversations" ON sentiment_history
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN bots b ON c.bot_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Sample sentiment data comments
COMMENT ON COLUMN conversations.sentiment_score IS 'Overall sentiment score from 0 (negative) to 1 (positive), 0.5 is neutral';
COMMENT ON COLUMN conversations.sentiment_label IS 'Simplified sentiment label: positive, neutral, negative, or mixed';
COMMENT ON COLUMN messages.sentiment_score IS 'Message-level sentiment score from 0 (negative) to 1 (positive)';
COMMENT ON COLUMN messages.emotions IS 'Detected emotions with confidence scores, e.g., {"joy": 0.8, "surprise": 0.3}';
