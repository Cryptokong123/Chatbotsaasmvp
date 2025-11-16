# Database Migrations

## Required Migrations for Flows and Forms

To enable the Conversation Flows and Pre-Chat Forms features, you need to run the following SQL migrations against your Supabase database.

### Option 1: Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of each migration file below
6. Click **Run** to execute

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

## Migrations to Run

### 1. Pre-Chat Forms System

**File:** `migrations/add_pre_chat_forms.sql`

This migration creates:
- `pre_chat_forms` - Form definitions
- `pre_chat_form_fields` - Individual form fields with validation
- `pre_chat_form_submissions` - User submissions linked to conversations
- Row Level Security policies
- Indexes for performance

**To run:**
1. Open `migrations/add_pre_chat_forms.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click Run

### 2. Enhanced Conversation Flows

**File:** `migrations/enhance_conversation_flows.sql`

This migration creates:
- Updates to `conversation_flows` table (adds entry_node_id, variables_schema)
- `flow_execution_state` - Runtime flow state tracking
- `flow_templates` - Pre-built flow templates
- `flow_operators` - Conditional logic operators reference
- Row Level Security policies
- Indexes for performance

**To run:**
1. Open `migrations/enhance_conversation_flows.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click Run

## Verification

After running the migrations, verify they were successful:

```sql
-- Check that all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'pre_chat_forms',
  'pre_chat_form_fields',
  'pre_chat_form_submissions',
  'flow_execution_state',
  'flow_templates',
  'flow_operators'
);

-- Should return 6 rows
```

## Troubleshooting

### "relation already exists" errors
This is normal if you've run the migrations before. The migrations use `CREATE TABLE IF NOT EXISTS` so they're idempotent.

### "permission denied" errors
Make sure you're using a Service Role key or running in the SQL Editor as an admin.

### Row Level Security issues
If you can't see data after migrations, check that:
1. You're logged in as the correct user
2. Your user owns the bots you're trying to access
3. RLS policies are enabled (they should be by the migrations)

## Next Steps

After running migrations:
1. ✅ Navigate to Bot Dashboard → Conversation Flows
2. ✅ Navigate to Bot Dashboard → Pre-Chat Forms
3. ✅ Create your first flow from a template
4. ✅ Build a pre-chat form for your bot

## Rollback (if needed)

To remove these features:

```sql
-- WARNING: This will delete all flow and form data!

DROP TABLE IF EXISTS pre_chat_form_submissions CASCADE;
DROP TABLE IF EXISTS pre_chat_form_fields CASCADE;
DROP TABLE IF EXISTS pre_chat_forms CASCADE;
DROP TABLE IF EXISTS flow_execution_state CASCADE;
DROP TABLE IF EXISTS flow_templates CASCADE;
DROP TABLE IF EXISTS flow_operators CASCADE;

-- Revert conversation_flows changes
ALTER TABLE conversation_flows DROP COLUMN IF EXISTS entry_node_id;
ALTER TABLE conversation_flows DROP COLUMN IF EXISTS variables_schema;
```
