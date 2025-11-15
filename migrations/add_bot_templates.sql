-- Bot Templates Marketplace

-- Templates table
CREATE TABLE IF NOT EXISTS bot_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'customer_support',
    'sales',
    'faq',
    'lead_generation',
    'ecommerce',
    'education',
    'healthcare',
    'finance',
    'hr',
    'general'
  )),
  icon TEXT NOT NULL DEFAULT '🤖',
  primary_color TEXT NOT NULL DEFAULT '#3B82F6',
  system_prompt TEXT NOT NULL,
  welcome_message TEXT NOT NULL,
  placeholder_text TEXT DEFAULT 'Type your message...',
  display_name TEXT NOT NULL,
  use_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  preview_conversation JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template presets (common responses)
CREATE TABLE IF NOT EXISTS bot_template_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES bot_templates(id) ON DELETE CASCADE,
  trigger TEXT NOT NULL,
  response TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template actions (webhooks and integrations)
CREATE TABLE IF NOT EXISTS bot_template_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES bot_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('keyword', 'intent', 'event')),
  trigger_value TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('webhook', 'email', 'slack', 'zapier')),
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bot_templates_category ON bot_templates(category);
CREATE INDEX IF NOT EXISTS idx_bot_templates_featured ON bot_templates(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_bot_templates_active ON bot_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bot_template_presets_template ON bot_template_presets(template_id);
CREATE INDEX IF NOT EXISTS idx_bot_template_actions_template ON bot_template_actions(template_id);

-- Insert some default templates

-- 1. Customer Support Bot
INSERT INTO bot_templates (
  name,
  description,
  category,
  icon,
  primary_color,
  display_name,
  system_prompt,
  welcome_message,
  is_featured,
  tags,
  preview_conversation
) VALUES (
  'Customer Support Assistant',
  'A friendly support bot that helps customers with common questions, troubleshooting, and ticket creation.',
  'customer_support',
  '🎧',
  '#10B981',
  'Support Bot',
  'You are a helpful and empathetic customer support assistant. Your goal is to solve customer issues quickly and professionally. Always be polite, ask clarifying questions when needed, and escalate complex issues to human agents. Provide step-by-step troubleshooting when appropriate.',
  'Hi there! 👋 I''m your support assistant. I''m here to help you with any questions or issues you may have. How can I assist you today?',
  true,
  ARRAY['support', 'help', 'troubleshooting', 'tickets'],
  '[
    {"role": "assistant", "content": "Hi! How can I help you today?"},
    {"role": "user", "content": "I forgot my password"},
    {"role": "assistant", "content": "No problem! I can help you reset your password. I''ll send you a password reset link to your registered email address."}
  ]'::jsonb
);

-- 2. Sales & Lead Generation Bot
INSERT INTO bot_templates (
  name,
  description,
  category,
  icon,
  primary_color,
  display_name,
  system_prompt,
  welcome_message,
  is_featured,
  tags,
  preview_conversation
) VALUES (
  'Sales & Lead Qualifier',
  'Engage visitors, qualify leads, and schedule demos automatically. Perfect for SaaS and B2B companies.',
  'sales',
  '💼',
  '#8B5CF6',
  'Sales Assistant',
  'You are a professional sales assistant for a B2B company. Your goal is to understand the visitor''s needs, qualify them as potential leads, and schedule product demos. Ask about their company size, use case, budget, and timeline. Be consultative, not pushy. Collect contact information when appropriate.',
  'Welcome! 🚀 I''d love to learn more about your business and how our solution can help. What brings you here today?',
  true,
  ARRAY['sales', 'leads', 'demo', 'b2b'],
  '[
    {"role": "assistant", "content": "What brings you here today?"},
    {"role": "user", "content": "I''m interested in your product"},
    {"role": "assistant", "content": "Great! Can you tell me a bit about your company and what you''re looking to achieve?"}
  ]'::jsonb
);

-- 3. FAQ Bot
INSERT INTO bot_templates (
  name,
  description,
  category,
  icon,
  primary_color,
  display_name,
  system_prompt,
  welcome_message,
  is_featured,
  tags,
  preview_conversation
) VALUES (
  'FAQ & Knowledge Base',
  'Answer common questions instantly using your knowledge base. Reduces support load and improves response time.',
  'faq',
  '📚',
  '#3B82F6',
  'FAQ Bot',
  'You are a knowledgeable FAQ assistant. Answer questions clearly and concisely based on the company''s knowledge base. If you don''t know the answer, admit it and offer to connect the user with a human agent. Always provide accurate information.',
  'Hi! 👋 I have answers to many common questions. What would you like to know?',
  true,
  ARRAY['faq', 'knowledge', 'questions', 'answers'],
  '[
    {"role": "assistant", "content": "What would you like to know?"},
    {"role": "user", "content": "What are your business hours?"},
    {"role": "assistant", "content": "We''re open Monday-Friday, 9 AM to 6 PM EST. Our chatbot is available 24/7!"}
  ]'::jsonb
);

-- 4. E-commerce Assistant
INSERT INTO bot_templates (
  name,
  description,
  category,
  icon,
  primary_color,
  display_name,
  system_prompt,
  welcome_message,
  is_featured,
  tags,
  preview_conversation
) VALUES (
  'E-commerce Shopping Assistant',
  'Help customers find products, track orders, and make purchase decisions. Increase conversions and reduce cart abandonment.',
  'ecommerce',
  '🛍️',
  '#EC4899',
  'Shopping Assistant',
  'You are a helpful e-commerce shopping assistant. Help customers find the right products, answer questions about shipping and returns, track orders, and provide product recommendations. Be enthusiastic about the products and help remove friction from the buying process.',
  'Welcome to our store! 🛍️ I''m here to help you find exactly what you''re looking for. What can I help you with today?',
  true,
  ARRAY['ecommerce', 'shopping', 'products', 'orders'],
  '[
    {"role": "assistant", "content": "What can I help you find today?"},
    {"role": "user", "content": "I''m looking for running shoes"},
    {"role": "assistant", "content": "Great! I can help with that. What''s your budget and what type of running do you do?"}
  ]'::jsonb
);

-- 5. Lead Generation Bot
INSERT INTO bot_templates (
  name,
  description,
  category,
  icon,
  primary_color,
  display_name,
  system_prompt,
  welcome_message,
  tags,
  preview_conversation
) VALUES (
  'Lead Capture & Qualification',
  'Capture visitor information and qualify leads 24/7. Integrates with your CRM and email marketing tools.',
  'lead_generation',
  '🎯',
  '#F59E0B',
  'Lead Bot',
  'You are a lead generation specialist. Your goal is to engage website visitors, understand their needs, and collect their contact information. Ask about their business, challenges, and goals. Be friendly and conversational, not robotic. Qualify leads by asking about budget, timeline, and decision-making authority.',
  'Hi there! 👋 Thanks for visiting. I''d love to learn more about your business. What''s your biggest challenge right now?',
  false,
  ARRAY['leads', 'qualification', 'crm', 'conversion'],
  '[
    {"role": "assistant", "content": "What''s your biggest challenge?"},
    {"role": "user", "content": "We need to improve our sales process"},
    {"role": "assistant", "content": "I can help with that! Can you tell me more about your current process?"}
  ]'::jsonb
);

-- 6. HR & Recruitment Bot
INSERT INTO bot_templates (
  name,
  description,
  category,
  icon,
  primary_color,
  display_name,
  system_prompt,
  welcome_message,
  tags,
  preview_conversation
) VALUES (
  'HR & Recruitment Assistant',
  'Screen candidates, answer HR questions, and schedule interviews. Streamline your hiring process.',
  'hr',
  '👥',
  '#6366F1',
  'HR Assistant',
  'You are an HR and recruitment assistant. Help candidates with job applications, answer questions about positions and company culture, and pre-screen applicants. Be professional, welcoming, and inclusive. Collect relevant information about candidates'' experience and qualifications.',
  'Welcome! 🌟 Thanks for your interest in joining our team. I''m here to help you with the application process. Are you looking to apply for a specific position?',
  false,
  ARRAY['hr', 'recruiting', 'hiring', 'jobs'],
  '[
    {"role": "assistant", "content": "Are you looking to apply for a specific position?"},
    {"role": "user", "content": "Yes, the Software Engineer role"},
    {"role": "assistant", "content": "Excellent! Can you tell me about your relevant experience?"}
  ]'::jsonb
);

-- 7. Healthcare Assistant
INSERT INTO bot_templates (
  name,
  description,
  category,
  icon,
  primary_color,
  display_name,
  system_prompt,
  welcome_message,
  tags,
  preview_conversation
) VALUES (
  'Healthcare & Appointment Bot',
  'Help patients schedule appointments, find doctors, and get basic health information. HIPAA-ready architecture.',
  'healthcare',
  '🏥',
  '#14B8A6',
  'Health Assistant',
  'You are a healthcare appointment assistant. Help patients schedule appointments, find the right doctor or specialist, and answer basic questions about services. NEVER provide medical advice or diagnoses - always direct medical questions to healthcare professionals. Be compassionate and patient.',
  'Hello! 👋 I''m here to help you schedule an appointment or answer questions about our services. How can I assist you today?',
  false,
  ARRAY['healthcare', 'appointments', 'medical', 'patients'],
  '[
    {"role": "assistant", "content": "How can I help you today?"},
    {"role": "user", "content": "I need to schedule a checkup"},
    {"role": "assistant", "content": "I can help with that! Do you have a preferred date and time?"}
  ]'::jsonb
);

-- 8. Education & Tutoring Bot
INSERT INTO bot_templates (
  name,
  description,
  category,
  icon,
  primary_color,
  display_name,
  system_prompt,
  welcome_message,
  tags,
  preview_conversation
) VALUES (
  'Educational Assistant & Tutor',
  'Answer student questions, provide learning resources, and guide students through course content.',
  'education',
  '📖',
  '#06B6D4',
  'Study Buddy',
  'You are an educational assistant and tutor. Help students understand concepts, answer questions about course material, and provide study resources. Be patient, encouraging, and adjust your explanations to the student''s level. Use examples and analogies to clarify difficult concepts.',
  'Hi! 📚 I''m here to help you learn. What subject or topic would you like help with today?',
  false,
  ARRAY['education', 'learning', 'tutoring', 'students'],
  '[
    {"role": "assistant", "content": "What would you like to learn about?"},
    {"role": "user", "content": "Can you explain photosynthesis?"},
    {"role": "assistant", "content": "Of course! Photosynthesis is how plants make food using sunlight. Let me break it down..."}
  ]'::jsonb
);

-- Add some sample presets for Customer Support template
INSERT INTO bot_template_presets (template_id, trigger, response, priority)
SELECT
  id,
  'hours',
  'Our business hours are Monday-Friday, 9 AM to 6 PM EST. However, this chatbot is available 24/7 to assist you!',
  10
FROM bot_templates WHERE name = 'Customer Support Assistant';

INSERT INTO bot_template_presets (template_id, trigger, response, priority)
SELECT
  id,
  'shipping',
  'We offer free shipping on orders over $50. Standard shipping takes 3-5 business days, and express shipping takes 1-2 business days.',
  9
FROM bot_templates WHERE name = 'Customer Support Assistant';

INSERT INTO bot_template_presets (template_id, trigger, response, priority)
SELECT
  id,
  'refund',
  'Our refund policy allows returns within 30 days of purchase. Items must be unused and in original packaging. Would you like to start a return?',
  8
FROM bot_templates WHERE name = 'Customer Support Assistant';

-- Update function
CREATE OR REPLACE FUNCTION update_bot_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bot_templates_updated_at
  BEFORE UPDATE ON bot_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_bot_templates_updated_at();

-- Grant permissions (adjust based on your RLS policies)
-- These templates are public read-only for all authenticated users
ALTER TABLE bot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_template_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_template_actions ENABLE ROW LEVEL SECURITY;

-- Everyone can read templates
CREATE POLICY "Templates are publicly readable" ON bot_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Template presets are publicly readable" ON bot_template_presets
  FOR SELECT USING (true);

CREATE POLICY "Template actions are publicly readable" ON bot_template_actions
  FOR SELECT USING (true);
