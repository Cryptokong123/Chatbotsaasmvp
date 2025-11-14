# ChatForge AI - Deployment Guide

Complete guide to deploying ChatForge AI to production.

---

## 🚀 Quick Start

This guide will help you deploy ChatForge AI using:
- **Vercel** for Next.js hosting
- **Supabase** for backend (database, auth, storage)
- **OpenAI** for AI capabilities

**Estimated Time:** 30-45 minutes

---

## 📋 Prerequisites

Before you begin, ensure you have:
- [ ] Node.js 18+ installed locally
- [ ] Git installed
- [ ] GitHub account
- [ ] OpenAI API account (with billing enabled)
- [ ] Vercel account (free tier works)
- [ ] Supabase account (free tier works)

---

## 1️⃣ Set Up Supabase

### Step 1: Create a New Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name:** chatforge-ai (or your preferred name)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users
4. Click "Create new project"
5. Wait ~2 minutes for provisioning

### Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `supabase/schema.sql` from this repo
4. Paste into the SQL editor
5. Click "Run"
6. Verify: Check the **Table Editor** - you should see tables: `users`, `bots`, `training_data`, `messages`, etc.

### Step 3: Enable Vector Extension

The schema should have enabled this, but verify:

1. Go to **Database** → **Extensions**
2. Search for "vector"
3. Ensure it's enabled (toggle on if not)

### Step 4: Get API Keys

1. Go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** `eyJhbGci...` (starts with eyJ)
   - **service_role key:** `eyJhbGci...` (different from anon key)

**⚠️ Important:** Keep the `service_role` key secret! Never expose it to the client.

---

## 2️⃣ Set Up OpenAI API

### Step 1: Create Account

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to **Billing** → Add payment method
4. Add $10-20 to start (you can set usage limits)

### Step 2: Get API Key

1. Go to **API Keys**
2. Click "Create new secret key"
3. Name it "ChatForge AI Production"
4. Copy the key (starts with `sk-`)
5. Save it securely (you won't see it again!)

### Step 3: Set Usage Limits (Recommended)

1. Go to **Billing** → **Usage limits**
2. Set a monthly cap (e.g., $50) to avoid surprises
3. Enable email alerts at 75% and 90%

---

## 3️⃣ Deploy to Vercel

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ChatForge AI"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/chatforge-ai.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Select your `chatforge-ai` repository
5. Click "Import"

### Step 3: Configure Environment Variables

In the Vercel project settings, add these environment variables:

**Required:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**How to add:**
1. In Vercel project → **Settings** → **Environment Variables**
2. Add each variable
3. Select all environments (Production, Preview, Development)
4. Click "Save"

### Step 4: Deploy

1. Click "Deploy" in Vercel
2. Wait ~2 minutes for build
3. Once deployed, click "Visit" to see your live app
4. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
5. Redeploy for the change to take effect

---

## 4️⃣ Configure Custom Domain (Optional)

### If You Have a Custom Domain:

1. In Vercel project → **Settings** → **Domains**
2. Add your domain (e.g., `chatforge.ai`)
3. Follow Vercel's DNS instructions
4. Wait for DNS propagation (~10 minutes to 48 hours)
5. Update `NEXT_PUBLIC_APP_URL` to your custom domain
6. Redeploy

---

## 5️⃣ Verify Deployment

### Test Each Feature:

**1. Authentication:**
- Visit `/register`
- Create a test account
- Verify email is sent (check Supabase Auth logs)
- Log in at `/login`

**2. Dashboard:**
- Create a new bot
- Verify it appears in dashboard
- Edit bot settings

**3. Training Data:**
- Go to Training Data page
- Upload some test content
- Verify it's stored (check Supabase table editor)

**4. Widget:**
- Get embed code from a bot
- Test on a simple HTML page:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget Test</title>
</head>
<body>
  <h1>Test Page</h1>

  <script
    src="https://your-domain.vercel.app/widget.js"
    data-bot-id="YOUR_BOT_ID">
  </script>
</body>
</html>
```

**5. AI Responses:**
- Open the widget
- Send a test message
- Verify you get an AI response
- Check Supabase messages table

---

## 6️⃣ Production Checklist

Before going fully live:

### Security
- [ ] Verify RLS (Row Level Security) policies in Supabase
- [ ] Ensure service role key is not exposed
- [ ] Set up CORS properly for widget
- [ ] Enable rate limiting (Vercel Pro or custom)
- [ ] Add CSRF protection

### Performance
- [ ] Test widget load time (<1 second)
- [ ] Verify API response times (<2 seconds)
- [ ] Check database query performance
- [ ] Enable Vercel Analytics

### Monitoring
- [ ] Set up error tracking (Sentry recommended)
- [ ] Configure uptime monitoring (UptimeRobot or similar)
- [ ] Set up logging (Vercel logs or external)
- [ ] Monitor OpenAI API usage and costs

### Legal & Compliance
- [ ] Add Terms of Service page
- [ ] Add Privacy Policy page
- [ ] Add cookie consent banner (if needed)
- [ ] Configure email sending (Supabase or SendGrid)

---

## 7️⃣ Environment Variables Reference

### Complete List

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# OpenAI
OPENAI_API_KEY=sk-...

# App Configuration
NEXT_PUBLIC_APP_URL=https://chatforge.ai

# Optional: Analytics
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX

# Optional: Error Tracking
SENTRY_DSN=https://...

# Optional: Email (if not using Supabase)
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=noreply@chatforge.ai
```

---

## 8️⃣ Scaling Considerations

### When You Grow:

**Database:**
- Supabase free tier: 500MB database, good for ~10K users
- Upgrade to Pro ($25/mo) for 8GB and better performance
- Consider connection pooling for high traffic

**OpenAI Costs:**
- Free tier users: ~$0.01-0.05 per user/month
- Monitor usage in OpenAI dashboard
- Set hard limits to avoid surprises
- Consider caching common responses

**Vercel:**
- Free tier: 100GB bandwidth/month
- Upgrade to Pro ($20/mo) for better limits
- Use CDN for static assets

**Recommended Monitoring:**
- Set up alerts at:
  - 1,000 users
  - $100/month in OpenAI costs
  - 80% of database capacity

---

## 9️⃣ Backup & Disaster Recovery

### Automatic Backups (Supabase)

Supabase Pro includes:
- Daily backups (7-day retention)
- Point-in-time recovery

**Manual Backup:**
```bash
# Backup database (requires Supabase CLI)
supabase db dump -f backup.sql

# Backup to local file
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Restore Process

If something goes wrong:
1. Go to Supabase dashboard → **Database** → **Backups**
2. Select a backup point
3. Click "Restore"
4. Wait for completion (~5-10 minutes)

---

## 🔟 Troubleshooting

### Common Issues

**Widget not loading:**
- Check browser console for errors
- Verify `NEXT_PUBLIC_APP_URL` is correct
- Check CORS settings in API routes
- Ensure bot ID is valid

**AI not responding:**
- Check OpenAI API key is valid
- Verify billing is enabled on OpenAI
- Check API usage limits not exceeded
- Review server logs in Vercel

**Database errors:**
- Verify RLS policies allow operations
- Check service role key is correct
- Review Supabase logs for specific errors

**Authentication issues:**
- Check Supabase auth settings
- Verify email templates are configured
- Test with different email providers

### Getting Help

- **Documentation:** Check this file and code comments
- **Logs:** Vercel dashboard → your-project → Deployments → [latest] → Logs
- **Supabase Logs:** Supabase dashboard → Logs
- **Community:** Post in relevant forums with specific error messages

---

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Vercel Docs](https://vercel.com/docs)

---

## 🎉 You're Live!

Congratulations! ChatForge AI is now running in production.

**Next Steps:**
1. Monitor your first users
2. Gather feedback
3. Iterate on features
4. Scale as needed

**Remember:**
- Start small, scale as you grow
- Monitor costs closely
- Keep security top of mind
- Listen to your users

---

**Last Updated:** January 2025

Need help? Create an issue on GitHub or reach out to the team.
