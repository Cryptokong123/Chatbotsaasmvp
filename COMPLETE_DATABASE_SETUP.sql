-- ============================================================================
-- ChatForge AI - COMPLETE Database Setup Script
-- ============================================================================
-- Run this ENTIRE script in your Supabase SQL Editor
-- This will set up all tables, policies, functions, and triggers
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,

  -- Plans
  plan TEXT DEFAULT 'demo' CHECK (plan IN ('demo', 'starter', 'pro', 'enterprise')),
  agent_plan TEXT DEFAULT 'agent_demo' CHECK (agent_plan IN ('agent_demo', 'agent_starter', 'agent_pro', 'agent_enterprise')),
  bundle_plan TEXT CHECK (bundle_plan IN ('bundle_starter', 'bundle_pro', 'bundle_enterprise')),

  -- Billing
  remove_branding BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  agent_stripe_subscription_id TEXT,
  bundle_stripe_subscription_id TEXT,

  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX idx_bots_user_id ON public.bots(user_id);
CREATE INDEX idx_bots_is_active ON public.bots(is_active);

ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;

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
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_training_data_bot_id ON public.training_data(bot_id);
CREATE INDEX idx_training_data_source_type ON public.training_data(source_type);
CREATE INDEX idx_training_data_embedding ON public.training_data USING hnsw (embedding vector_cosine_ops);

ALTER TABLE public.training_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view training data for own bots" ON public.training_data
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bots WHERE bots.id = training_data.bot_id AND bots.user_id = auth.uid())
  );
CREATE POLICY "Users can insert training data for own bots" ON public.training_data
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.bots WHERE bots.id = training_data.bot_id AND bots.user_id = auth.uid())
  );
CREATE POLICY "Users can delete training data for own bots" ON public.training_data
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.bots WHERE bots.id = training_data.bot_id AND bots.user_id = auth.uid())
  );

-- ============================================================================
-- MESSAGES TABLE (conversation history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_bot_id ON public.messages(bot_id);
CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for own bots" ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bots WHERE bots.id = messages.bot_id AND bots.user_id = auth.uid())
  );
CREATE POLICY "Allow public insert for widget" ON public.messages
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PRESET_RESPONSES TABLE
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

CREATE INDEX idx_preset_responses_bot_id ON public.preset_responses(bot_id);
CREATE INDEX idx_preset_responses_active ON public.preset_responses(is_active) WHERE is_active = true;

ALTER TABLE public.preset_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage preset responses for own bots" ON public.preset_responses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.bots WHERE bots.id = preset_responses.bot_id AND bots.user_id = auth.uid())
  );

-- ============================================================================
-- BOT_ACTIONS TABLE (webhook actions for bots)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bot_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  method TEXT DEFAULT 'POST' CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  headers JSONB DEFAULT '{}',
  parameters JSONB DEFAULT '[]',
  requires_confirmation BOOLEAN DEFAULT true,
  confirmation_message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bot_id, name)
);

CREATE INDEX idx_bot_actions_bot_id ON public.bot_actions(bot_id);
CREATE INDEX idx_bot_actions_active ON public.bot_actions(is_active) WHERE is_active = true;

ALTER TABLE public.bot_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage actions for own bots" ON public.bot_actions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.bots WHERE bots.id = bot_actions.bot_id AND bots.user_id = auth.uid())
  );

-- ============================================================================
-- AGENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,

  -- Agent Configuration
  instructions TEXT DEFAULT 'You are a helpful AI assistant.',
  personality TEXT DEFAULT 'professional' CHECK (personality IN ('professional', 'friendly', 'casual', 'formal', 'enthusiastic')),
  response_style TEXT DEFAULT 'balanced' CHECK (response_style IN ('concise', 'balanced', 'detailed')),

  -- Status
  is_active BOOLEAN DEFAULT true,
  deployment_status TEXT DEFAULT 'draft' CHECK (deployment_status IN ('draft', 'staging', 'production', 'archived')),
  version TEXT DEFAULT '1.0.0',

  -- Advanced Features
  enable_sentiment_analysis BOOLEAN DEFAULT false,
  enable_multi_language BOOLEAN DEFAULT false,
  enable_handoff_to_human BOOLEAN DEFAULT false,
  enable_analytics BOOLEAN DEFAULT true,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_agents_is_active ON public.agents(is_active);
CREATE INDEX idx_agents_deployment_status ON public.agents(deployment_status);
CREATE INDEX idx_agents_tags ON public.agents USING GIN(tags);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agents" ON public.agents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own agents" ON public.agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agents" ON public.agents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agents" ON public.agents
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- PLATFORM_INTEGRATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.platform_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  platform TEXT NOT NULL CHECK (platform IN (
    'whatsapp', 'telegram', 'slack', 'discord', 'teams',
    'messenger', 'instagram', 'twitter', 'linkedin',
    'sms', 'voice', 'email', 'wechat', 'line', 'viber',
    'kakao', 'alexa', 'google_assistant', 'google_business', 'apple_business'
  )),
  platform_name TEXT,

  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
  is_active BOOLEAN DEFAULT true,

  credentials JSONB NOT NULL DEFAULT '{}',
  config JSONB DEFAULT '{}',

  webhook_url TEXT,
  webhook_secret TEXT,
  webhook_verified BOOLEAN DEFAULT false,

  last_connected_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_platform_integrations_unique ON public.platform_integrations(agent_id, platform);
CREATE INDEX idx_platform_integrations_agent_id ON public.platform_integrations(agent_id);
CREATE INDEX idx_platform_integrations_user_id ON public.platform_integrations(user_id);
CREATE INDEX idx_platform_integrations_platform ON public.platform_integrations(platform);
CREATE INDEX idx_platform_integrations_status ON public.platform_integrations(status);

ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own platform integrations" ON public.platform_integrations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own platform integrations" ON public.platform_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own platform integrations" ON public.platform_integrations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own platform integrations" ON public.platform_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- AGENT_CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  platform_integration_id UUID NOT NULL REFERENCES public.platform_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  platform_user_id TEXT NOT NULL,
  platform_user_name TEXT,
  platform_conversation_id TEXT,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'waiting', 'resolved', 'archived', 'handed_off')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  message_count INTEGER DEFAULT 0,
  ai_message_count INTEGER DEFAULT 0,
  human_message_count INTEGER DEFAULT 0,

  sentiment_score DECIMAL(3,2),
  satisfaction_score INTEGER,

  handed_off_to TEXT,
  handed_off_at TIMESTAMP WITH TIME ZONE,
  handoff_reason TEXT,

  session_data JSONB DEFAULT '{}',
  context JSONB DEFAULT '{}',

  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,

  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agent_conversations_agent_id ON public.agent_conversations(agent_id);
CREATE INDEX idx_agent_conversations_platform_integration_id ON public.agent_conversations(platform_integration_id);
CREATE INDEX idx_agent_conversations_user_id ON public.agent_conversations(user_id);
CREATE INDEX idx_agent_conversations_status ON public.agent_conversations(status);
CREATE INDEX idx_agent_conversations_platform_user_id ON public.agent_conversations(platform_user_id);
CREATE INDEX idx_agent_conversations_last_message_at ON public.agent_conversations(last_message_at DESC);
CREATE INDEX idx_agent_conversations_tags ON public.agent_conversations USING GIN(tags);

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent conversations" ON public.agent_conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own agent conversations" ON public.agent_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agent conversations" ON public.agent_conversations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agent conversations" ON public.agent_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- AGENT_MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  platform_message_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'human', 'system')),

  message_type TEXT DEFAULT 'text' CHECK (message_type IN (
    'text', 'image', 'video', 'audio', 'file', 'location',
    'contact', 'sticker', 'template', 'interactive', 'system'
  )),
  content TEXT NOT NULL,
  rich_content JSONB DEFAULT '{}',

  attachments JSONB DEFAULT '[]',

  intent TEXT,
  entities JSONB DEFAULT '{}',
  confidence_score DECIMAL(3,2),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  sentiment_score DECIMAL(3,2),

  processing_time_ms INTEGER,
  tokens_used INTEGER,
  model_used TEXT,

  delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN (
    'pending', 'sent', 'delivered', 'read', 'failed', 'deleted'
  )),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agent_messages_conversation_id ON public.agent_messages(conversation_id);
CREATE INDEX idx_agent_messages_agent_id ON public.agent_messages(agent_id);
CREATE INDEX idx_agent_messages_user_id ON public.agent_messages(user_id);
CREATE INDEX idx_agent_messages_created_at ON public.agent_messages(created_at DESC);
CREATE INDEX idx_agent_messages_direction ON public.agent_messages(direction);
CREATE INDEX idx_agent_messages_sender_type ON public.agent_messages(sender_type);
CREATE INDEX idx_agent_messages_delivery_status ON public.agent_messages(delivery_status);

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent messages" ON public.agent_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own agent messages" ON public.agent_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agent messages" ON public.agent_messages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agent messages" ON public.agent_messages
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- API_KEYS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  description TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key ON public.api_keys(key) WHERE is_active = true;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- ALLOWED_DOMAINS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.allowed_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bot_id, domain)
);

CREATE INDEX idx_allowed_domains_bot_id ON public.allowed_domains(bot_id);
CREATE INDEX idx_allowed_domains_domain ON public.allowed_domains(domain);

ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage domains for own bots" ON public.allowed_domains
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.bots WHERE bots.id = allowed_domains.bot_id AND bots.user_id = auth.uid())
  );

-- ============================================================================
-- USAGE_STATS TABLE
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

CREATE INDEX idx_usage_stats_user_id ON public.usage_stats(user_id);
CREATE INDEX idx_usage_stats_date ON public.usage_stats(date DESC);

ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

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

-- Update conversation message count when message is added
CREATE OR REPLACE FUNCTION increment_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.agent_conversations
  SET
    message_count = message_count + 1,
    ai_message_count = CASE WHEN NEW.sender_type = 'agent' THEN ai_message_count + 1 ELSE ai_message_count END,
    human_message_count = CASE WHEN NEW.sender_type = 'user' THEN human_message_count + 1 ELSE human_message_count END,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bots_updated_at BEFORE UPDATE ON public.bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preset_responses_updated_at BEFORE UPDATE ON public.preset_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bot_actions_updated_at BEFORE UPDATE ON public.bot_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_integrations_updated_at BEFORE UPDATE ON public.platform_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_conversations_updated_at BEFORE UPDATE ON public.agent_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_messages_updated_at BEFORE UPDATE ON public.agent_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER increment_message_count_trigger AFTER INSERT ON public.agent_messages
  FOR EACH ROW EXECUTE FUNCTION increment_conversation_message_count();

-- ============================================================================
-- DONE!
-- ============================================================================

-- You can verify the setup by running:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
