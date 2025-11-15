-- Seed Data for ChatForge AI
-- Run this AFTER you have created your first user account

-- Note: Replace 'YOUR_USER_EMAIL' with your actual email address
-- Or run: SELECT id FROM auth.users WHERE email = 'your@email.com';

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the first user (you can change this to get a specific user)
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Please create a user account first before running seed data.';
    RETURN;
  END IF;

  RAISE NOTICE 'Using user ID: %', v_user_id;

  -- Seed Quick Replies (only if not already seeded)
  IF NOT EXISTS (SELECT 1 FROM quick_replies WHERE shortcut = '/hi') THEN
    INSERT INTO quick_replies (user_id, title, message, shortcut, category, is_global)
    VALUES
      (v_user_id, 'Welcome Greeting', 'Hi there! 👋 Thanks for reaching out. How can I help you today?', '/hi', 'greeting', true),
      (v_user_id, 'Thank You', 'Thank you for contacting us! We appreciate your business. 😊', '/thanks', 'thank_you', true),
      (v_user_id, 'Please Wait', 'Thanks for your patience! I''m looking into this for you now. I''ll get back to you shortly.', '/wait', 'support', true),
      (v_user_id, 'Checking Status', 'Let me check on that for you. One moment please...', '/check', 'support', true),
      (v_user_id, 'Issue Resolved', 'Great! I''m glad we could resolve this for you. Is there anything else I can help you with?', '/resolved', 'support', true),
      (v_user_id, 'Apology', 'I sincerely apologize for the inconvenience. Let me make this right for you.', '/sorry', 'apology', true),
      (v_user_id, 'Transfer to Human', 'I''m transferring you to a human agent who can better assist you. They''ll be with you shortly.', '/transfer', 'support', true),
      (v_user_id, 'Business Hours', 'Our business hours are Monday-Friday, 9 AM to 6 PM EST. We''ll respond to your message as soon as we''re back online!', '/hours', 'general', true),
      (v_user_id, 'Follow Up', 'I''ll follow up with you in 24 hours to ensure everything is working properly. Sound good?', '/followup', 'follow_up', true),
      (v_user_id, 'More Information', 'To help you better, I need a bit more information. Could you please provide [specific details]?', '/moreinfo', 'support', true),
      (v_user_id, 'Closing', 'Thanks for chatting with us today! Feel free to reach out anytime you need assistance. Have a great day! 🌟', '/bye', 'closing', true);

    RAISE NOTICE 'Seeded % quick reply templates', 11;
  ELSE
    RAISE NOTICE 'Quick replies already seeded, skipping';
  END IF;

END $$;
