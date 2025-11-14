-- ChatForge AI Seed Data
-- Sample data for development and testing

-- Note: This is sample data for development only
-- In production, users will be created through authentication

-- Sample bot configurations for reference
-- (Will be created by users after signup)

/*
Example bot creation after user signup:

INSERT INTO public.bots (user_id, name, description, instructions, welcome_message)
VALUES (
  'USER_ID_HERE',
  'Customer Support Bot',
  'Handles customer inquiries about our products and services',
  'You are a friendly customer support assistant. Use the provided context to answer questions accurately. If you don''t know something, be honest and suggest contacting human support.',
  'Welcome! I''m here to help you with any questions about our products and services.'
);
*/

-- Sample training data structure (for reference)
/*
INSERT INTO public.training_data (bot_id, content, source_type, source_name, chunk_index)
VALUES (
  'BOT_ID_HERE',
  'Our product offers 24/7 customer support through multiple channels including email, chat, and phone.',
  'text',
  'Company FAQ',
  0
);
*/

-- Sample allowed domains (for reference)
/*
INSERT INTO public.allowed_domains (bot_id, domain)
VALUES
  ('BOT_ID_HERE', 'example.com'),
  ('BOT_ID_HERE', 'www.example.com'),
  ('BOT_ID_HERE', 'localhost:3000'); -- For development
*/
