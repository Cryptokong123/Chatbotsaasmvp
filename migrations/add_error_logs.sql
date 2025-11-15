-- Error Logging System (Optional)
-- This table stores client-side and server-side errors for debugging

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'fatal')),
  message TEXT NOT NULL,
  error_name TEXT,
  error_message TEXT,
  error_stack TEXT,
  url TEXT,
  user_agent TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

-- Row Level Security
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own error logs
CREATE POLICY "Users can view own error logs" ON error_logs
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Service role can insert error logs (for server-side logging)
-- Client-side code will use the API endpoint which has service role access
CREATE POLICY "Service role can insert error logs" ON error_logs
  FOR INSERT
  WITH CHECK (true);

-- Admin users can view all error logs (optional - requires admin role)
-- Uncomment if you have an admin system
-- CREATE POLICY "Admins can view all error logs" ON error_logs
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM auth.users
--       WHERE id = auth.uid()
--       AND raw_user_meta_data->>'role' = 'admin'
--     )
--   );

-- Comments
COMMENT ON TABLE error_logs IS 'Client and server-side error logs for debugging and monitoring';
COMMENT ON COLUMN error_logs.level IS 'Error severity: info, warning, error, fatal';
COMMENT ON COLUMN error_logs.context IS 'Additional context about where/when the error occurred';
COMMENT ON COLUMN error_logs.user_agent IS 'Browser user agent string (for client-side errors)';

-- Auto-cleanup old error logs (optional)
-- Keep only last 30 days of error logs to save space
-- Run this as a scheduled job or cron task

-- Example cleanup query (run periodically):
-- DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '30 days';
