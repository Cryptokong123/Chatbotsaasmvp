-- ChatForge AI Database Schema
-- Multi-tenant SaaS architecture with RAG capabilities

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  plan TEXT DEFAULT 'demo' CHECK (plan IN ('demo', 'starter', 'pro', 'enterprise')),
  remove_branding BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- BOTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT DEFAULT 'You are a helpful assistant. Answer questions based on the provided context.',
  avatar_url TEXT,
  primary_color TEXT DEFAULT '#6C47FF',
  welcome_message TEXT DEFAULT 'Hi! How can I help you today?',
  placeholder_text TEXT DEFAULT 'Type your message...',
  is_active BOOLEAN DEFAULT true,
  -- Personality settings
  tone TEXT DEFAULT 'professional' CHECK (tone IN ('professional', 'friendly', 'casual', 'formal', 'enthusiastic')),
  formality TEXT DEFAULT 'balanced' CHECK (formality IN ('very_formal', 'formal', 'balanced', 'casual', 'very_casual')),
  use_emojis BOOLEAN DEFAULT false,
  response_length TEXT DEFAULT 'balanced' CHECK (response_length IN ('concise', 'balanced', 'detailed')),
  creativity_level DECIMAL(2,1) DEFAULT 0.7 CHECK (creativity_level >= 0 AND creativity_level <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bots_user_id ON public.bots(user_id);
CREATE INDEX idx_bots_is_active ON public.bots(is_active);

-- Enable RLS
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bots
CREATE POLICY "Users can view own bots" ON public.bots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bots" ON public.bots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bots" ON public.bots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bots" ON public.bots
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- TRAINING_DATA TABLE (with vector embeddings for RAG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('text', 'pdf', 'faq', 'url')),
  source_name TEXT,
  chunk_index INTEGER DEFAULT 0,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_training_data_bot_id ON public.training_data(bot_id);
CREATE INDEX idx_training_data_source_type ON public.training_data(source_type);

-- Vector similarity search index (using HNSW for fast approximate nearest neighbor)
CREATE INDEX idx_training_data_embedding ON public.training_data
  USING hnsw (embedding vector_cosine_ops);

-- Enable RLS
ALTER TABLE public.training_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_data
CREATE POLICY "Users can view training data for own bots" ON public.training_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bots
      WHERE bots.id = training_data.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert training data for own bots" ON public.training_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bots
      WHERE bots.id = training_data.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete training data for own bots" ON public.training_data
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.bots
      WHERE bots.id = training_data.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- ============================================================================
-- MESSAGES TABLE (conversation history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- Track conversations per visitor
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_bot_id ON public.messages(bot_id);
CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages for own bots" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bots
      WHERE bots.id = messages.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow public insert for widget" ON public.messages
  FOR INSERT WITH CHECK (true); -- Will be validated in API layer

-- ============================================================================
-- ALLOWED_DOMAINS TABLE (domain whitelisting for widgets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.allowed_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bot_id, domain)
);

-- Indexes
CREATE INDEX idx_allowed_domains_bot_id ON public.allowed_domains(bot_id);
CREATE INDEX idx_allowed_domains_domain ON public.allowed_domains(domain);

-- Enable RLS
ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies for allowed_domains
CREATE POLICY "Users can manage domains for own bots" ON public.allowed_domains
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bots
      WHERE bots.id = allowed_domains.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- ============================================================================
-- USAGE_STATS TABLE (for analytics and future billing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES public.bots(id) ON DELETE SET NULL,
  stat_type TEXT NOT NULL CHECK (stat_type IN ('message', 'training_upload', 'embedding')),
  count INTEGER DEFAULT 1,
  date DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bot_id, stat_type, date)
);

-- Indexes
CREATE INDEX idx_usage_stats_user_id ON public.usage_stats(user_id);
CREATE INDEX idx_usage_stats_date ON public.usage_stats(date DESC);

-- Enable RLS
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usage_stats
CREATE POLICY "Users can view own usage stats" ON public.usage_stats
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to match similar training data (vector similarity search)
CREATE OR REPLACE FUNCTION match_training_data(
  query_embedding vector(1536),
  match_bot_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  source_name text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    training_data.id,
    training_data.content,
    1 - (training_data.embedding <=> query_embedding) as similarity,
    training_data.source_name
  FROM training_data
  WHERE training_data.bot_id = match_bot_id
    AND 1 - (training_data.embedding <=> query_embedding) > match_threshold
  ORDER BY training_data.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bots_updated_at BEFORE UPDATE ON public.bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL SETUP
-- ============================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- WEBHOOKS TABLE (for integrations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhooks_bot_id ON public.webhooks(bot_id);

-- Enable RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhooks
CREATE POLICY "Users can manage webhooks for own bots" ON public.webhooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bots
      WHERE bots.id = webhooks.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- ============================================================================
-- AUDIT_LOGS TABLE (for compliance and security)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- PRESET_RESPONSES TABLE (quick responses that bypass AI)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.preset_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  match_type TEXT DEFAULT 'exact' CHECK (match_type IN ('exact', 'contains', 'starts_with')),
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_preset_responses_bot_id ON public.preset_responses(bot_id);
CREATE INDEX idx_preset_responses_active ON public.preset_responses(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.preset_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for preset_responses
CREATE POLICY "Users can manage preset responses for own bots" ON public.preset_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bots
      WHERE bots.id = preset_responses.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_preset_responses_updated_at BEFORE UPDATE ON public.preset_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BOT_ACTIONS TABLE (webhook actions for bots)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bot_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "cancel_order"
  display_name TEXT NOT NULL, -- e.g., "Cancel Order"
  description TEXT NOT NULL, -- What this action does
  webhook_url TEXT NOT NULL, -- Customer's endpoint
  method TEXT DEFAULT 'POST' CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  headers JSONB DEFAULT '{}', -- Custom headers (API keys, etc.)
  parameters JSONB DEFAULT '[]', -- Expected parameters with schema
  requires_confirmation BOOLEAN DEFAULT true, -- Ask user before executing
  confirmation_message TEXT, -- Custom confirmation prompt
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bot_id, name)
);

-- Indexes
CREATE INDEX idx_bot_actions_bot_id ON public.bot_actions(bot_id);
CREATE INDEX idx_bot_actions_active ON public.bot_actions(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.bot_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bot_actions
CREATE POLICY "Users can manage actions for own bots" ON public.bot_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bots
      WHERE bots.id = bot_actions.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_bot_actions_updated_at BEFORE UPDATE ON public.bot_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ACTION_LOGS TABLE (track action executions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID NOT NULL REFERENCES public.bot_actions(id) ON DELETE CASCADE,
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- Link to conversation
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'executed', 'failed', 'cancelled')),
  request_payload JSONB DEFAULT '{}', -- What was sent
  response_payload JSONB DEFAULT '{}', -- What was received
  http_status INTEGER,
  error_message TEXT,
  execution_time_ms INTEGER, -- How long it took
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_action_logs_action_id ON public.action_logs(action_id);
CREATE INDEX idx_action_logs_bot_id ON public.action_logs(bot_id);
CREATE INDEX idx_action_logs_session_id ON public.action_logs(session_id);
CREATE INDEX idx_action_logs_status ON public.action_logs(status);
CREATE INDEX idx_action_logs_created_at ON public.action_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for action_logs
CREATE POLICY "Users can view action logs for own bots" ON public.action_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bots
      WHERE bots.id = action_logs.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow public insert for action logs" ON public.action_logs
  FOR INSERT WITH CHECK (true); -- Validated in API layer

-- ============================================================================
-- CONVERSATION_RATINGS TABLE (thumbs up/down for responses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversation_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating IN (-1, 1)), -- -1 = thumbs down, 1 = thumbs up
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversation_ratings_message ON public.conversation_ratings(message_id);
CREATE INDEX idx_conversation_ratings_bot ON public.conversation_ratings(bot_id);
CREATE INDEX idx_conversation_ratings_created ON public.conversation_ratings(created_at DESC);

-- Enable RLS
ALTER TABLE public.conversation_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view ratings for own bots" ON public.conversation_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bots
      WHERE bots.id = conversation_ratings.bot_id
      AND bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow public insert for ratings" ON public.conversation_ratings
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- Additional Indexes for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_messages_bot_session ON public.messages(bot_id, session_id);
CREATE INDEX IF NOT EXISTS idx_training_bot_created ON public.training_data(bot_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_date ON public.usage_stats(user_id, date DESC);
