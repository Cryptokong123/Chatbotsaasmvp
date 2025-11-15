# ChatForge AI - Setup Guide

## Quick Setup

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Notifications (Optional)
RESEND_API_KEY=your_resend_api_key

# AI Features (Optional)
OPENAI_API_KEY=your_openai_api_key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Database Migrations

**Option A: Using the Migration Runner Script**
```bash
chmod +x scripts/run-migrations.sh
./scripts/run-migrations.sh
```

**Option B: Manual Migration (Recommended)**

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **SQL Editor** in the left sidebar
3. Open each migration file from the `migrations/` folder (in order)
4. Copy the SQL and run it in the SQL Editor

**Migration Order:**
1. `add_notifications.sql`
2. `add_bot_templates.sql`
3. `add_sentiment_analysis.sql`
4. `add_quick_replies.sql`

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Features Included

✅ **13 Major Features:**
1. Loading Skeletons
2. Empty State Illustrations
3. Email Notification System
4. Global Search (Cmd+K)
5. PDF/DOCX Document Upload
6. Bot Templates Marketplace
7. Real-Time Analytics Dashboard
8. Sentiment Analysis
9. Quick Reply Templates
10. Conversation Search with Autocomplete
11. Dark Mode Support
12. Keyboard Shortcuts System
13. AI Auto-Tagging

## Troubleshooting

### Database Connection Issues

```bash
# Test your Supabase connection
curl -H "apikey: YOUR_ANON_KEY" https://your-project.supabase.co/rest/v1/
```

### Missing Tables

If you see "relation does not exist" errors, run the migrations manually in Supabase SQL Editor.

### Email Notifications Not Working

1. Sign up for [Resend](https://resend.com)
2. Get your API key
3. Add `RESEND_API_KEY` to `.env.local`
4. Restart your dev server

## Next Steps

1. Create your first user account
2. Create a bot using templates
3. Upload training data (PDF/DOCX)
4. Test the chat widget
5. Check analytics dashboard
6. Set up email notifications

## Documentation

- [Full Documentation](./IMPROVEMENTS_TODO.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [API Documentation](./docs/API.md)

## Support

- 🐛 [Report Issues](https://github.com/chatforge/chatforge/issues)
- 💬 [Discussions](https://github.com/chatforge/chatforge/discussions)
- 📧 Email: support@chatforge.ai
