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
-- Additional Indexes for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_messages_bot_session ON public.messages(bot_id, session_id);
CREATE INDEX IF NOT EXISTS idx_training_bot_created ON public.training_data(bot_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_date ON public.usage_stats(user_id, date DESC);
