-- ============================================================================
-- AGENTS INFRASTRUCTURE
-- Complete database schema for multi-platform agent system
-- ============================================================================

-- ============================================================================
-- AGENTS TABLE
-- Core table for storing agent configurations
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

-- Indexes for performance
CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_agents_is_active ON public.agents(is_active);
CREATE INDEX idx_agents_deployment_status ON public.agents(deployment_status);
CREATE INDEX idx_agents_tags ON public.agents USING GIN(tags);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
-- Stores platform connection configurations and credentials
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.platform_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Platform Details
  platform TEXT NOT NULL CHECK (platform IN (
    'whatsapp', 'telegram', 'slack', 'discord', 'teams',
    'messenger', 'instagram', 'twitter', 'linkedin',
    'sms', 'voice', 'email', 'wechat', 'line', 'viber',
    'kakao', 'alexa', 'google_assistant', 'google_business', 'apple_business'
  )),
  platform_name TEXT, -- User-friendly name for this integration

  -- Connection Status
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
  is_active BOOLEAN DEFAULT true,

  -- Credentials (encrypted in application layer)
  credentials JSONB NOT NULL DEFAULT '{}', -- Encrypted API keys, tokens, etc.
  config JSONB DEFAULT '{}', -- Platform-specific configuration

  -- Webhook Configuration
  webhook_url TEXT,
  webhook_secret TEXT,
  webhook_verified BOOLEAN DEFAULT false,

  -- Connection Metadata
  last_connected_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint: one platform integration per agent
CREATE UNIQUE INDEX idx_platform_integrations_unique ON public.platform_integrations(agent_id, platform);

-- Indexes
CREATE INDEX idx_platform_integrations_agent_id ON public.platform_integrations(agent_id);
CREATE INDEX idx_platform_integrations_user_id ON public.platform_integrations(user_id);
CREATE INDEX idx_platform_integrations_platform ON public.platform_integrations(platform);
CREATE INDEX idx_platform_integrations_status ON public.platform_integrations(status);

-- Enable RLS
ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
-- Tracks conversations across all platforms
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  platform_integration_id UUID NOT NULL REFERENCES public.platform_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Conversation Details
  platform_user_id TEXT NOT NULL, -- ID of the user on the platform
  platform_user_name TEXT,
  platform_conversation_id TEXT, -- Platform-specific conversation/thread ID

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'waiting', 'resolved', 'archived', 'handed_off')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Metrics
  message_count INTEGER DEFAULT 0,
  ai_message_count INTEGER DEFAULT 0,
  human_message_count INTEGER DEFAULT 0,

  -- Sentiment & Analysis
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  satisfaction_score INTEGER, -- 1 to 5

  -- Handoff
  handed_off_to TEXT, -- User ID or team if handed off to human
  handed_off_at TIMESTAMP WITH TIME ZONE,
  handoff_reason TEXT,

  -- Session Management
  session_data JSONB DEFAULT '{}',
  context JSONB DEFAULT '{}', -- Conversation context for AI

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agent_conversations_agent_id ON public.agent_conversations(agent_id);
CREATE INDEX idx_agent_conversations_platform_integration_id ON public.agent_conversations(platform_integration_id);
CREATE INDEX idx_agent_conversations_user_id ON public.agent_conversations(user_id);
CREATE INDEX idx_agent_conversations_status ON public.agent_conversations(status);
CREATE INDEX idx_agent_conversations_platform_user_id ON public.agent_conversations(platform_user_id);
CREATE INDEX idx_agent_conversations_last_message_at ON public.agent_conversations(last_message_at DESC);
CREATE INDEX idx_agent_conversations_tags ON public.agent_conversations USING GIN(tags);

-- Enable RLS
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
-- Stores all messages exchanged in agent conversations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Message Details
  platform_message_id TEXT, -- Platform-specific message ID
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'human', 'system')),

  -- Content
  message_type TEXT DEFAULT 'text' CHECK (message_type IN (
    'text', 'image', 'video', 'audio', 'file', 'location',
    'contact', 'sticker', 'template', 'interactive', 'system'
  )),
  content TEXT NOT NULL,
  rich_content JSONB DEFAULT '{}', -- Structured content (buttons, cards, etc.)

  -- Attachments
  attachments JSONB DEFAULT '[]', -- Array of attachment objects

  -- AI Metadata
  intent TEXT,
  entities JSONB DEFAULT '{}',
  confidence_score DECIMAL(3,2),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  sentiment_score DECIMAL(3,2),

  -- Processing
  processing_time_ms INTEGER,
  tokens_used INTEGER,
  model_used TEXT,

  -- Delivery Status
  delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN (
    'pending', 'sent', 'delivered', 'read', 'failed', 'deleted'
  )),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agent_messages_conversation_id ON public.agent_messages(conversation_id);
CREATE INDEX idx_agent_messages_agent_id ON public.agent_messages(agent_id);
CREATE INDEX idx_agent_messages_user_id ON public.agent_messages(user_id);
CREATE INDEX idx_agent_messages_created_at ON public.agent_messages(created_at DESC);
CREATE INDEX idx_agent_messages_direction ON public.agent_messages(direction);
CREATE INDEX idx_agent_messages_sender_type ON public.agent_messages(sender_type);
CREATE INDEX idx_agent_messages_delivery_status ON public.agent_messages(delivery_status);

-- Enable RLS
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own agent messages" ON public.agent_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent messages" ON public.agent_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent messages" ON public.agent_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent messages" ON public.agent_messages
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- AGENT_DEPLOYMENTS TABLE
-- Tracks agent versions and deployments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Version Information
  version TEXT NOT NULL,
  version_name TEXT,
  changelog TEXT,

  -- Environment
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),

  -- Deployment Details
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'deploying', 'active', 'rolled_back', 'failed')),
  deployment_strategy TEXT DEFAULT 'direct' CHECK (deployment_strategy IN ('direct', 'blue_green', 'canary')),
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),

  -- Configuration Snapshot
  config_snapshot JSONB NOT NULL, -- Complete agent configuration at deployment time

  -- Metrics
  total_messages INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  average_response_time_ms INTEGER,
  error_count INTEGER DEFAULT 0,

  -- Deployment Metadata
  deployed_by UUID REFERENCES public.users(id),
  deployed_at TIMESTAMP WITH TIME ZONE,
  rolled_back_at TIMESTAMP WITH TIME ZONE,
  rollback_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agent_deployments_agent_id ON public.agent_deployments(agent_id);
CREATE INDEX idx_agent_deployments_user_id ON public.agent_deployments(user_id);
CREATE INDEX idx_agent_deployments_environment ON public.agent_deployments(environment);
CREATE INDEX idx_agent_deployments_status ON public.agent_deployments(status);
CREATE INDEX idx_agent_deployments_version ON public.agent_deployments(version);

-- Enable RLS
ALTER TABLE public.agent_deployments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own agent deployments" ON public.agent_deployments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent deployments" ON public.agent_deployments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent deployments" ON public.agent_deployments
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- AGENT_ANALYTICS TABLE
-- Stores aggregated analytics data
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  platform_integration_id UUID REFERENCES public.platform_integrations(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Time Period
  period_type TEXT NOT NULL CHECK (period_type IN ('hour', 'day', 'week', 'month')),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Message Metrics
  total_messages INTEGER DEFAULT 0,
  incoming_messages INTEGER DEFAULT 0,
  outgoing_messages INTEGER DEFAULT 0,

  -- Conversation Metrics
  total_conversations INTEGER DEFAULT 0,
  new_conversations INTEGER DEFAULT 0,
  active_conversations INTEGER DEFAULT 0,
  resolved_conversations INTEGER DEFAULT 0,

  -- Performance Metrics
  average_response_time_ms INTEGER,
  median_response_time_ms INTEGER,
  p95_response_time_ms INTEGER,
  p99_response_time_ms INTEGER,

  -- Quality Metrics
  average_sentiment_score DECIMAL(3,2),
  positive_sentiment_count INTEGER DEFAULT 0,
  negative_sentiment_count INTEGER DEFAULT 0,
  neutral_sentiment_count INTEGER DEFAULT 0,

  -- User Metrics
  unique_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  average_satisfaction_score DECIMAL(3,2),

  -- AI Metrics
  average_confidence_score DECIMAL(3,2),
  low_confidence_count INTEGER DEFAULT 0,
  total_tokens_used BIGINT DEFAULT 0,
  total_api_calls INTEGER DEFAULT 0,

  -- Error Metrics
  error_count INTEGER DEFAULT 0,
  timeout_count INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,

  -- Handoff Metrics
  handoff_count INTEGER DEFAULT 0,
  handoff_rate DECIMAL(5,2),

  -- Cost Metrics
  estimated_cost DECIMAL(10,4),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint for period analytics
CREATE UNIQUE INDEX idx_agent_analytics_unique ON public.agent_analytics(
  agent_id,
  COALESCE(platform_integration_id, '00000000-0000-0000-0000-000000000000'::UUID),
  period_type,
  period_start
);

-- Indexes
CREATE INDEX idx_agent_analytics_agent_id ON public.agent_analytics(agent_id);
CREATE INDEX idx_agent_analytics_platform_integration_id ON public.agent_analytics(platform_integration_id);
CREATE INDEX idx_agent_analytics_user_id ON public.agent_analytics(user_id);
CREATE INDEX idx_agent_analytics_period ON public.agent_analytics(period_type, period_start DESC);

-- Enable RLS
ALTER TABLE public.agent_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own agent analytics" ON public.agent_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent analytics" ON public.agent_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- AGENT_USAGE_LOGS TABLE
-- Detailed usage logs for billing and metering
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  platform_integration_id UUID REFERENCES public.platform_integrations(id) ON DELETE SET NULL,

  -- Usage Type
  usage_type TEXT NOT NULL CHECK (usage_type IN (
    'message_sent', 'message_received', 'api_call', 'webhook_call',
    'storage', 'ai_inference', 'voice_minute', 'sms_sent', 'email_sent'
  )),

  -- Quantity
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL, -- 'message', 'api_call', 'token', 'mb', 'minute', etc.

  -- Metadata
  platform TEXT,
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.agent_messages(id) ON DELETE SET NULL,

  -- Cost Calculation
  unit_price DECIMAL(10,6),
  total_cost DECIMAL(10,4),
  currency TEXT DEFAULT 'USD',

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for billing queries
CREATE INDEX idx_agent_usage_logs_user_id ON public.agent_usage_logs(user_id);
CREATE INDEX idx_agent_usage_logs_agent_id ON public.agent_usage_logs(agent_id);
CREATE INDEX idx_agent_usage_logs_created_at ON public.agent_usage_logs(created_at DESC);
CREATE INDEX idx_agent_usage_logs_usage_type ON public.agent_usage_logs(usage_type);
CREATE INDEX idx_agent_usage_logs_billing_period ON public.agent_usage_logs(user_id, created_at) WHERE total_cost > 0;

-- Enable RLS
ALTER TABLE public.agent_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own usage logs" ON public.agent_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- Update USERS table for agent plans
-- ============================================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS agent_plan TEXT DEFAULT 'agent_demo'
  CHECK (agent_plan IN ('agent_demo', 'agent_starter', 'agent_pro', 'agent_enterprise'));

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bundle_plan TEXT
  CHECK (bundle_plan IN ('bundle_starter', 'bundle_pro', 'bundle_enterprise'));

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS agent_stripe_subscription_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bundle_stripe_subscription_id TEXT;

-- ============================================================================
-- TRIGGERS for automated updates
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_integrations_updated_at BEFORE UPDATE ON public.platform_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_conversations_updated_at BEFORE UPDATE ON public.agent_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_messages_updated_at BEFORE UPDATE ON public.agent_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_deployments_updated_at BEFORE UPDATE ON public.agent_deployments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

CREATE TRIGGER increment_message_count_trigger AFTER INSERT ON public.agent_messages
  FOR EACH ROW EXECUTE FUNCTION increment_conversation_message_count();

-- ============================================================================
-- SAMPLE DATA / SEED (Optional - for development)
-- ============================================================================

COMMENT ON TABLE public.agents IS 'Core table storing agent configurations for multi-platform deployments';
COMMENT ON TABLE public.platform_integrations IS 'Platform connection configurations (WhatsApp, Telegram, Slack, etc.)';
COMMENT ON TABLE public.agent_conversations IS 'Conversation sessions across all platforms';
COMMENT ON TABLE public.agent_messages IS 'Individual messages within conversations';
COMMENT ON TABLE public.agent_deployments IS 'Agent version control and deployment history';
COMMENT ON TABLE public.agent_analytics IS 'Aggregated analytics data for agents';
COMMENT ON TABLE public.agent_usage_logs IS 'Detailed usage logs for billing and metering';
