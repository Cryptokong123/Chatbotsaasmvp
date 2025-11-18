# Database Setup Guide

## Quick Start (5 minutes)

### Step 1: Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Click **New Project**
3. Fill in project details:
   - **Project Name**: ChatForge AI (or your preference)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click **Create new project** (takes ~2 minutes)

### Step 2: Get Your API Keys
Once your project is created:

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)

3. Add them to your **Vercel Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

### Step 3: Run Database Setup Script

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file: `setup-database.sql` (in your project root)
4. Copy the ENTIRE contents and paste into the SQL Editor
5. Click **Run** (green play button)
6. Wait for confirmation message ✅

**That's it!** Your database is now fully set up with all tables, indexes, and security policies.

---

## Optional: Additional Features (Run if needed)

If you want to add extra features, run these migrations in order in the SQL Editor:

### Core Features (Required for most functionality)
```bash
# Run these in Supabase SQL Editor, one at a time:
1. migrations/add_conversations.sql          # Chat conversations
2. migrations/add_conversation_metadata.sql  # Conversation tracking
3. migrations/create_agents_infrastructure.sql # AI agents
4. migrations/add_integrations_infrastructure.sql # Third-party integrations
```

### Optional Features (Add as needed)
```bash
5. migrations/add_api_keys.sql              # API key management
6. migrations/add_webhooks.sql              # Webhook support
7. migrations/add_bot_templates.sql         # Bot templates
8. migrations/add_conversation_flows.sql    # Flow builder
9. migrations/enhance_conversation_flows.sql # Enhanced flows
10. migrations/add_notifications.sql         # Notifications
11. migrations/add_team_collaboration.sql    # Team features
12. migrations/add_sentiment_analysis.sql    # Sentiment tracking
13. migrations/add_quick_replies.sql         # Quick reply buttons
14. migrations/add_pre_chat_forms.sql        # Pre-chat forms
15. migrations/add_error_logs.sql            # Error logging
16. migrations/seed_data.sql                 # Sample data
```

---

## Database Schema Overview

Your database includes:

### Core Tables
- **users** - User accounts (extends Supabase Auth)
- **bots** - Chatbot configurations
- **training_data** - Knowledge base with vector embeddings
- **sessions** - Chat sessions
- **messages** - Chat messages
- **analytics** - Usage analytics

### Features
- ✅ **Row Level Security (RLS)** - Multi-tenant data isolation
- ✅ **Vector Search** - Semantic search with pgvector
- ✅ **Real-time** - Live chat updates
- ✅ **Full-text Search** - Fast text search
- ✅ **Automatic Timestamps** - Created/updated tracking
- ✅ **Cascade Deletes** - Clean data relationships

---

## Verification

Check your tables were created:

1. In Supabase, go to **Table Editor** (left sidebar)
2. You should see tables like:
   - users
   - bots
   - training_data
   - sessions
   - messages
   - analytics
   - ... and more

---

## Environment Variables for Vercel

Add these to your Vercel project:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# OpenAI (Optional - for AI features)
OPENAI_API_KEY=sk-...

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App URL (Required for production)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## Troubleshooting

### Error: "relation already exists"
- **Solution**: Your database already has some tables. Either:
  1. Drop the existing tables in SQL Editor: `DROP TABLE IF EXISTS table_name CASCADE;`
  2. Or skip the parts of the script that create existing tables

### Error: "extension vector does not exist"
- **Solution**: The pgvector extension isn't enabled. Run:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

### Error: "permission denied"
- **Solution**: Make sure you're running the script as the database owner
- Check you're in the SQL Editor, not the regular editor

---

## Next Steps

After database setup:

1. ✅ Add environment variables to Vercel
2. ✅ Redeploy your Vercel project
3. ✅ Test the app - it should now work without database errors!

---

## Need Help?

- Check the [Supabase Documentation](https://supabase.com/docs)
- Review migration files in `migrations/` folder for specific feature details
- Each table has RLS policies - make sure your queries authenticate properly
