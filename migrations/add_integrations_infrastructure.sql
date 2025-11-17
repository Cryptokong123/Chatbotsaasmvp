-- ============================================================================
-- Integration Infrastructure Schema
-- ============================================================================
-- Comprehensive database schema for managing 32+ integration adapters with:
-- - Multi-tenant integration instances
-- - Secure encrypted credentials storage
-- - Message history tracking
-- - Webhook configurations and logs
-- - Bidirectional sync state management
-- - Contact/user synchronization
-- - Event auditing and logging
-- ============================================================================

-- ============================================================================
-- INTEGRATION INSTANCES
-- ============================================================================
-- Stores integration instances per tenant with connection status and config
CREATE TABLE IF NOT EXISTS integration_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Tenant identification
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Integration details
  integration_type TEXT NOT NULL, -- e.g., 'hubspot', 'salesforce', 'slack'
  integration_category TEXT NOT NULL, -- e.g., 'crm', 'messaging', 'email'
  instance_name TEXT NOT NULL, -- User-friendly name
  description TEXT,

  -- Connection status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'initializing', 'connected', 'disconnected', 'error', 'reconnecting')
  ),

  -- Health monitoring
  is_healthy BOOLEAN DEFAULT false,
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_check_latency_ms INTEGER,
  circuit_breaker_state TEXT DEFAULT 'closed' CHECK (
    circuit_breaker_state IN ('closed', 'open', 'half_open')
  ),
  consecutive_failures INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMP WITH TIME ZONE,

  -- Configuration
  config JSONB DEFAULT '{}', -- Integration-specific configuration
  enabled BOOLEAN DEFAULT true,

  -- API configuration
  api_version TEXT,
  base_url TEXT,
  timeout_ms INTEGER DEFAULT 30000,
  retry_attempts INTEGER DEFAULT 3,
  retry_delay_ms INTEGER DEFAULT 1000,

  -- Rate limiting config
  rate_limit_max_requests INTEGER,
  rate_limit_window_ms INTEGER,
  rate_limit_strategy TEXT CHECK (rate_limit_strategy IN ('sliding', 'fixed')),

  -- Metrics
  requests_total BIGINT DEFAULT 0,
  requests_successful BIGINT DEFAULT 0,
  requests_failed BIGINT DEFAULT 0,
  total_latency_ms BIGINT DEFAULT 0,
  average_latency_ms NUMERIC,
  success_rate NUMERIC,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connected_at TIMESTAMP WITH TIME ZONE,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(tenant_id, integration_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_instances_tenant ON integration_instances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integration_instances_type ON integration_instances(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_instances_category ON integration_instances(integration_category);
CREATE INDEX IF NOT EXISTS idx_integration_instances_status ON integration_instances(status);
CREATE INDEX IF NOT EXISTS idx_integration_instances_enabled ON integration_instances(enabled);
CREATE INDEX IF NOT EXISTS idx_integration_instances_health ON integration_instances(is_healthy);
CREATE INDEX IF NOT EXISTS idx_integration_instances_created ON integration_instances(created_at DESC);

-- ============================================================================
-- INTEGRATION CREDENTIALS
-- ============================================================================
-- Stores encrypted credentials for integrations (API keys, OAuth tokens, etc.)
CREATE TABLE IF NOT EXISTS integration_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Reference to integration instance
  instance_id UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,

  -- Credential type
  credential_type TEXT NOT NULL CHECK (
    credential_type IN (
      'api_key', 'api_token', 'bearer_token', 'oauth', 'basic_auth',
      'webhook_secret', 'jwt', 'custom'
    )
  ),

  -- Encrypted credentials (using pgcrypto)
  encrypted_data BYTEA NOT NULL, -- Encrypted JSON blob of credentials
  encryption_key_id TEXT NOT NULL, -- Reference to encryption key

  -- OAuth-specific fields
  access_token_encrypted BYTEA,
  refresh_token_encrypted BYTEA,
  token_type TEXT,
  scope TEXT[],
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  last_rotated_at TIMESTAMP WITH TIME ZONE,
  rotation_required BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),

  -- Constraints
  UNIQUE(instance_id, credential_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credentials_instance ON integration_credentials(instance_id);
CREATE INDEX IF NOT EXISTS idx_credentials_type ON integration_credentials(credential_type);
CREATE INDEX IF NOT EXISTS idx_credentials_active ON integration_credentials(is_active);
CREATE INDEX IF NOT EXISTS idx_credentials_expires ON integration_credentials(expires_at);

-- ============================================================================
-- INTEGRATION MESSAGES
-- ============================================================================
-- Stores message history for all integrations
CREATE TABLE IF NOT EXISTS integration_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Integration reference
  instance_id UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,

  -- Message identification
  external_message_id TEXT, -- ID from the integration platform
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  thread_id TEXT, -- Thread/channel identifier

  -- Message direction
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),

  -- Sender/Recipient
  sender_id TEXT,
  sender_name TEXT,
  sender_email TEXT,
  recipient_id TEXT,
  recipient_name TEXT,
  recipient_email TEXT,

  -- Message content
  content_type TEXT DEFAULT 'text' CHECK (
    content_type IN ('text', 'rich_text', 'html', 'image', 'video', 'audio', 'file', 'card', 'template')
  ),
  text_content TEXT,
  html_content TEXT,
  raw_content JSONB, -- Original platform-specific message structure

  -- Attachments
  attachments JSONB DEFAULT '[]', -- Array of attachment objects
  has_attachments BOOLEAN DEFAULT false,

  -- Rich content
  buttons JSONB DEFAULT '[]',
  quick_replies JSONB DEFAULT '[]',
  cards JSONB DEFAULT '[]',

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'sending', 'sent', 'delivered', 'read', 'failed', 'deleted')
  ),
  delivery_status TEXT,
  read_status BOOLEAN DEFAULT false,

  -- Timestamps (from platform)
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Error handling
  error_code TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[],

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Full-text search
  search_vector tsvector
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_instance ON integration_messages(instance_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON integration_messages(integration_type);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON integration_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_external_id ON integration_messages(external_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON integration_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON integration_messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_status ON integration_messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON integration_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON integration_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON integration_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_tags ON integration_messages USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_messages_search ON integration_messages USING GIN(search_vector);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION update_message_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.text_content, '') || ' ' ||
    COALESCE(NEW.sender_name, '') || ' ' ||
    COALESCE(NEW.recipient_name, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_search
BEFORE INSERT OR UPDATE OF text_content, sender_name, recipient_name
ON integration_messages
FOR EACH ROW
EXECUTE FUNCTION update_message_search_vector();

-- ============================================================================
-- INTEGRATION WEBHOOKS
-- ============================================================================
-- Stores webhook configurations and logs
CREATE TABLE IF NOT EXISTS integration_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Integration reference
  instance_id UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,

  -- Webhook configuration
  webhook_url TEXT NOT NULL,
  webhook_secret_encrypted BYTEA,
  verification_token TEXT,

  -- Events subscription
  subscribed_events TEXT[] DEFAULT '{}',
  event_filters JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,

  -- Signature verification
  signature_header TEXT, -- e.g., 'x-hub-signature-256'
  signature_algorithm TEXT, -- e.g., 'sha256'

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_triggered_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(instance_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_instance ON integration_webhooks(instance_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_type ON integration_webhooks(integration_type);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON integration_webhooks(is_active);

-- ============================================================================
-- WEBHOOK EVENTS
-- ============================================================================
-- Logs all incoming webhook events
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Webhook reference
  webhook_id UUID REFERENCES integration_webhooks(id) ON DELETE SET NULL,
  instance_id UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,

  -- Event details
  event_type TEXT NOT NULL,
  event_id TEXT, -- External event ID from platform

  -- Request details
  request_headers JSONB,
  request_body JSONB NOT NULL,
  request_method TEXT DEFAULT 'POST',
  request_ip TEXT,

  -- Signature verification
  signature TEXT,
  signature_verified BOOLEAN,
  verification_error TEXT,

  -- Processing status
  status TEXT DEFAULT 'received' CHECK (
    status IN ('received', 'processing', 'processed', 'failed', 'ignored')
  ),
  processing_error TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,

  -- Response
  response_status INTEGER,
  response_body JSONB,

  -- Performance
  processing_time_ms INTEGER,

  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,

  -- Audit
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook ON webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_instance ON webhook_events(instance_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(integration_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received ON webhook_events(received_at DESC);

-- ============================================================================
-- INTEGRATION SYNC STATE
-- ============================================================================
-- Tracks bidirectional synchronization state across platforms
CREATE TABLE IF NOT EXISTS integration_sync_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Integration reference
  instance_id UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,

  -- Sync configuration
  entity_type TEXT NOT NULL, -- e.g., 'contact', 'message', 'ticket', 'deal'
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('one_way', 'two_way')),
  sync_frequency TEXT NOT NULL CHECK (
    sync_frequency IN ('real_time', 'hourly', 'daily', 'weekly', 'custom')
  ),
  custom_cron TEXT,

  -- Sync status
  is_enabled BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'idle' CHECK (
    status IN ('idle', 'running', 'paused', 'error', 'completed')
  ),

  -- Last sync details
  last_sync_started_at TIMESTAMP WITH TIME ZONE,
  last_sync_completed_at TIMESTAMP WITH TIME ZONE,
  last_sync_duration_ms INTEGER,
  last_sync_error TEXT,

  -- Sync statistics
  total_syncs BIGINT DEFAULT 0,
  successful_syncs BIGINT DEFAULT 0,
  failed_syncs BIGINT DEFAULT 0,

  -- Record tracking
  records_processed BIGINT DEFAULT 0,
  records_created BIGINT DEFAULT 0,
  records_updated BIGINT DEFAULT 0,
  records_deleted BIGINT DEFAULT 0,
  records_failed BIGINT DEFAULT 0,
  records_skipped BIGINT DEFAULT 0,

  -- Cursor/pagination for incremental sync
  last_sync_cursor TEXT,
  last_sync_timestamp TIMESTAMP WITH TIME ZONE,

  -- Conflict resolution
  conflict_resolution_strategy TEXT DEFAULT 'last_write_wins' CHECK (
    conflict_resolution_strategy IN (
      'last_write_wins', 'first_write_wins', 'manual', 'merge', 'platform_priority'
    )
  ),

  -- Filters and mapping
  sync_filters JSONB DEFAULT '{}',
  field_mapping JSONB DEFAULT '{}',

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(instance_id, entity_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sync_state_instance ON integration_sync_state(instance_id);
CREATE INDEX IF NOT EXISTS idx_sync_state_type ON integration_sync_state(integration_type);
CREATE INDEX IF NOT EXISTS idx_sync_state_entity ON integration_sync_state(entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_state_status ON integration_sync_state(status);
CREATE INDEX IF NOT EXISTS idx_sync_state_enabled ON integration_sync_state(is_enabled);

-- ============================================================================
-- INTEGRATION CONTACTS
-- ============================================================================
-- Stores contacts synchronized from integrations with deduplication
CREATE TABLE IF NOT EXISTS integration_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Integration reference
  instance_id UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,

  -- External identifiers
  external_id TEXT NOT NULL, -- ID from the integration platform
  external_ids JSONB DEFAULT '{}', -- IDs from multiple platforms for deduplication

  -- Contact details
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  company TEXT,
  job_title TEXT,

  -- Additional data
  avatar_url TEXT,
  timezone TEXT,
  locale TEXT,
  language TEXT,

  -- Contact type
  contact_type TEXT CHECK (contact_type IN ('person', 'company', 'lead', 'bot', 'unknown')),

  -- Social profiles
  social_profiles JSONB DEFAULT '{}',

  -- Custom fields from platform
  custom_fields JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_duplicate BOOLEAN DEFAULT false,
  master_contact_id UUID REFERENCES integration_contacts(id) ON DELETE SET NULL,

  -- Tags and segments
  tags TEXT[] DEFAULT '{}',
  segments TEXT[] DEFAULT '{}',

  -- Sync tracking
  last_synced_at TIMESTAMP WITH TIME ZONE,
  last_modified_at TIMESTAMP WITH TIME ZONE,
  sync_version INTEGER DEFAULT 1,

  -- Metadata
  raw_data JSONB, -- Original data from platform
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(instance_id, external_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_instance ON integration_contacts(instance_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON integration_contacts(integration_type);
CREATE INDEX IF NOT EXISTS idx_contacts_external_id ON integration_contacts(external_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON integration_contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON integration_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON integration_contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_master ON integration_contacts(master_contact_id);
CREATE INDEX IF NOT EXISTS idx_contacts_duplicate ON integration_contacts(is_duplicate);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON integration_contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contacts_external_ids ON integration_contacts USING GIN(external_ids);

-- ============================================================================
-- INTEGRATION EVENTS
-- ============================================================================
-- Audit log for all integration events and activities
CREATE TABLE IF NOT EXISTS integration_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Integration reference
  instance_id UUID REFERENCES integration_instances(id) ON DELETE SET NULL,
  integration_type TEXT NOT NULL,
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL, -- e.g., 'connection.established', 'message.sent', 'sync.completed'
  event_category TEXT, -- e.g., 'connection', 'message', 'sync', 'webhook', 'error'
  event_severity TEXT DEFAULT 'info' CHECK (
    event_severity IN ('info', 'warning', 'error', 'critical')
  ),

  -- Event data
  event_data JSONB DEFAULT '{}',
  error_details JSONB,

  -- Context
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  request_id TEXT,
  ip_address TEXT,
  user_agent TEXT,

  -- Performance
  duration_ms INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_instance ON integration_events(instance_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON integration_events(integration_type);
CREATE INDEX IF NOT EXISTS idx_events_tenant ON integration_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON integration_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_category ON integration_events(event_category);
CREATE INDEX IF NOT EXISTS idx_events_severity ON integration_events(event_severity);
CREATE INDEX IF NOT EXISTS idx_events_occurred ON integration_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user ON integration_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_tags ON integration_events USING GIN(tags);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update 'updated_at' timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables
CREATE TRIGGER trigger_update_integration_instances_updated_at
BEFORE UPDATE ON integration_instances
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_integration_credentials_updated_at
BEFORE UPDATE ON integration_credentials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_integration_messages_updated_at
BEFORE UPDATE ON integration_messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_integration_webhooks_updated_at
BEFORE UPDATE ON integration_webhooks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_integration_sync_state_updated_at
BEFORE UPDATE ON integration_sync_state
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_integration_contacts_updated_at
BEFORE UPDATE ON integration_contacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE integration_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own tenant's data

-- Integration Instances
CREATE POLICY "Users can view own integrations" ON integration_instances
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert own integrations" ON integration_instances
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update own integrations" ON integration_instances
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Users can delete own integrations" ON integration_instances
  FOR DELETE USING (tenant_id = auth.uid());

-- Integration Credentials
CREATE POLICY "Users can view own credentials" ON integration_credentials
  FOR SELECT USING (
    instance_id IN (SELECT id FROM integration_instances WHERE tenant_id = auth.uid())
  );

CREATE POLICY "Users can manage own credentials" ON integration_credentials
  FOR ALL USING (
    instance_id IN (SELECT id FROM integration_instances WHERE tenant_id = auth.uid())
  );

-- Integration Messages
CREATE POLICY "Users can view own messages" ON integration_messages
  FOR SELECT USING (
    instance_id IN (SELECT id FROM integration_instances WHERE tenant_id = auth.uid())
  );

CREATE POLICY "Users can manage own messages" ON integration_messages
  FOR ALL USING (
    instance_id IN (SELECT id FROM integration_instances WHERE tenant_id = auth.uid())
  );

-- Integration Webhooks
CREATE POLICY "Users can view own webhooks" ON integration_webhooks
  FOR SELECT USING (
    instance_id IN (SELECT id FROM integration_instances WHERE tenant_id = auth.uid())
  );

CREATE POLICY "Users can manage own webhooks" ON integration_webhooks
  FOR ALL USING (
    instance_id IN (SELECT id FROM integration_instances WHERE tenant_id = auth.uid())
  );

-- Webhook Events (read-only for users)
CREATE POLICY "Users can view own webhook events" ON webhook_events
  FOR SELECT USING (
    instance_id IN (SELECT id FROM integration_instances WHERE tenant_id = auth.uid())
  );

-- Sync State
CREATE POLICY "Users can view own sync state" ON integration_sync_state
  FOR SELECT USING (
    instance_id IN (SELECT id FROM integration_instances WHERE tenant_id = auth.uid())
  );

CREATE POLICY "Users can manage own sync state" ON integration_sync_state
  FOR ALL USING (
    instance_id IN (SELECT id FROM integration_instances WHERE tenant_id = auth.uid())
  );

-- Contacts
CREATE POLICY "Users can view own contacts" ON integration_contacts
  FOR SELECT USING (
    instance_id IN (SELECT id FROM integration_instances WHERE tenant_id = auth.uid())
  );

CREATE POLICY "Users can manage own contacts" ON integration_contacts
  FOR ALL USING (
    instance_id IN (SELECT id FROM integration_instances WHERE tenant_id = auth.uid())
  );

-- Events
CREATE POLICY "Users can view own events" ON integration_events
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Service can insert events" ON integration_events
  FOR INSERT WITH CHECK (true); -- Allow service role to insert events

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE integration_instances IS 'Stores integration instances per tenant with connection status, health monitoring, and metrics';
COMMENT ON TABLE integration_credentials IS 'Securely stores encrypted credentials for integrations with encryption key management';
COMMENT ON TABLE integration_messages IS 'Message history for all integrations with full-text search and rich content support';
COMMENT ON TABLE integration_webhooks IS 'Webhook configurations and signature verification settings';
COMMENT ON TABLE webhook_events IS 'Logs all incoming webhook events with processing status and retry tracking';
COMMENT ON TABLE integration_sync_state IS 'Tracks bidirectional synchronization state with conflict resolution';
COMMENT ON TABLE integration_contacts IS 'Synchronized contacts from integrations with deduplication support';
COMMENT ON TABLE integration_events IS 'Audit log for all integration events and activities';

-- ============================================================================
-- INTEGRATION CONVERSATIONS
-- ============================================================================
-- Tracks conversations, tickets, and threads across all integration platforms
CREATE TABLE IF NOT EXISTS integration_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Instance reference
  instance_id UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,

  -- External identifiers
  external_id TEXT NOT NULL,
  external_ids JSONB DEFAULT '{}', -- Map of platform-specific IDs

  -- Conversation details
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'pending', 'closed', 'resolved', 'archived', 'spam')
  ),
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  type TEXT CHECK (type IN ('chat', 'email', 'ticket', 'call', 'sms', 'social', 'other')),
  channel TEXT,

  -- Assignment
  assignee_id UUID, -- Internal user ID
  assignee_external_id TEXT, -- Platform-specific assignee ID
  team_id TEXT,

  -- Organization
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',

  -- Participants
  participants JSONB DEFAULT '[]', -- Array of participant objects

  -- Metrics
  message_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  first_message_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  response_time_ms INTEGER,
  resolution_time_ms INTEGER,
  satisfaction_score NUMERIC(3, 2), -- 0.00 to 5.00

  -- Status flags
  is_active BOOLEAN DEFAULT true,
  is_synced BOOLEAN DEFAULT false,
  sync_version INTEGER DEFAULT 1,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,

  -- Raw data
  raw_data JSONB,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE (instance_id, external_id)
);

-- Indexes for conversations
CREATE INDEX idx_conversations_instance ON integration_conversations(instance_id);
CREATE INDEX idx_conversations_status ON integration_conversations(status) WHERE is_active = true;
CREATE INDEX idx_conversations_assignee ON integration_conversations(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_conversations_type ON integration_conversations(type);
CREATE INDEX idx_conversations_priority ON integration_conversations(priority);
CREATE INDEX idx_conversations_tags ON integration_conversations USING GIN(tags);
CREATE INDEX idx_conversations_updated ON integration_conversations(updated_at DESC);
CREATE INDEX idx_conversations_last_message ON integration_conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_unread ON integration_conversations(unread_count) WHERE unread_count > 0;

-- Updated at trigger for conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON integration_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- IDEMPOTENCY KEYS
-- ============================================================================
-- Ensures operations are executed exactly once using idempotency keys
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Idempotency key
  key TEXT NOT NULL,

  -- Tenant/Instance reference
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES integration_instances(id) ON DELETE CASCADE,

  -- Operation details
  operation TEXT NOT NULL, -- e.g., 'send_message', 'create_contact'
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  ),

  -- Request tracking
  request_hash TEXT NOT NULL, -- SHA-256 hash of request body
  request_body JSONB,

  -- Response tracking
  response_status INTEGER,
  response_body JSONB,
  error TEXT,

  -- Lock management
  lock_expires_at TIMESTAMP WITH TIME ZONE,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Retry handling
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When this key expires

  -- Constraints
  UNIQUE (key, operation)
);

-- Indexes for idempotency keys
CREATE INDEX idx_idempotency_key_lookup ON idempotency_keys(key, operation);
CREATE INDEX idx_idempotency_tenant ON idempotency_keys(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_idempotency_instance ON idempotency_keys(instance_id) WHERE instance_id IS NOT NULL;
CREATE INDEX idx_idempotency_status ON idempotency_keys(status);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);
CREATE INDEX idx_idempotency_lock_expires ON idempotency_keys(lock_expires_at) WHERE lock_expires_at IS NOT NULL;
CREATE INDEX idx_idempotency_created ON idempotency_keys(created_at DESC);

-- Updated at trigger for idempotency keys
CREATE TRIGGER update_idempotency_keys_updated_at
  BEFORE UPDATE ON idempotency_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-cleanup expired idempotency keys (runs daily)
-- Note: This requires pg_cron extension which may not be available in all environments
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-expired-idempotency-keys', '0 2 * * *',
--   'DELETE FROM idempotency_keys WHERE expires_at < NOW()');

-- ============================================================================
-- ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE integration_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations" ON integration_conversations
  FOR SELECT USING (
    instance_id IN (SELECT id FROM integration_instances WHERE tenant_id = auth.uid())
  );

CREATE POLICY "Users can manage own conversations" ON integration_conversations
  FOR ALL USING (
    instance_id IN (SELECT id FROM integration_instances WHERE tenant_id = auth.uid())
  );

-- RLS Policies for idempotency keys
CREATE POLICY "Users can view own idempotency keys" ON idempotency_keys
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Users can manage own idempotency keys" ON idempotency_keys
  FOR ALL USING (tenant_id = auth.uid());

-- Service role can manage all idempotency keys (for background jobs)
CREATE POLICY "Service can manage idempotency keys" ON idempotency_keys
  FOR ALL USING (true); -- This will be restricted by service role permissions

-- ============================================================================
-- ADDITIONAL COMMENTS
-- ============================================================================

COMMENT ON TABLE integration_conversations IS 'Tracks conversations, tickets, and threads across all integration platforms with sync support';
COMMENT ON TABLE idempotency_keys IS 'Ensures operations are executed exactly once using idempotency keys with lock management and retry handling';
