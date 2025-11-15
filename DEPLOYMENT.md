# ChatForge AI - Deployment Guide

This guide covers deploying ChatForge AI to production environments.

## Prerequisites

Before deploying, ensure you have:

- [ ] Supabase project created and configured
- [ ] OpenAI API key (optional, for AI features)
- [ ] Domain name (for production)
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Initial user account created

## Environment Setup

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env.local
```

### 2. Configure Required Variables

Edit `.env.local` and set the following **REQUIRED** variables:

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration (REQUIRED)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Get your Supabase credentials from:
- Dashboard → Settings → API

### 3. Configure Optional Variables

For full functionality, also configure:

```bash
# AI Features (Recommended)
OPENAI_API_KEY=sk-your-openai-api-key

# Email Notifications (Recommended)
RESEND_API_KEY=re_your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com

# Error Tracking (Recommended for Production)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-token

# Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key

# Payments (If using Stripe)
STRIPE_SECRET_KEY=sk_your-stripe-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Rate Limiting (Recommended for Production)
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

### 4. Validate Environment

Run the validation script:

```bash
npm run setup
```

This will check all environment variables and report any issues.

## Database Setup

### 1. Run Migrations

Migrations must be run in this order:

```bash
# 1. Base schema (if not already applied in Supabase)
psql "your-database-url" -f supabase/schema.sql

# 2. Core tables
psql "your-database-url" -f migrations/add_conversations.sql

# 3. Feature migrations
psql "your-database-url" -f migrations/add_sentiment_analysis.sql
psql "your-database-url" -f migrations/add_quick_replies.sql
psql "your-database-url" -f migrations/add_conversation_flows.sql
psql "your-database-url" -f migrations/add_webhooks.sql
psql "your-database-url" -f migrations/add_team_collaboration.sql
psql "your-database-url" -f migrations/add_error_logs.sql
```

### 2. Seed Default Data

After creating your first user account:

```bash
psql "your-database-url" -f migrations/seed_data.sql
```

### 3. Verify Database

Check that all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

## Deployment Platforms

### Option 1: Vercel (Recommended)

Vercel offers the best Next.js deployment experience.

#### Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env.local`
   - Make sure to set them for **Production** environment

5. **Configure Domain:**
   - Go to Settings → Domains
   - Add your custom domain
   - Configure DNS according to Vercel instructions

#### Vercel Configuration

The `vercel.json` file should include:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://yourdomain.com"
  }
}
```

### Option 2: Docker

For self-hosting or other platforms.

#### Build Docker Image

```bash
docker build -t chatforge-ai .
```

#### Run Container

```bash
docker run -p 3000:3000 \
  --env-file .env.local \
  chatforge-ai
```

#### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run with:
```bash
docker-compose up -d
```

### Option 3: Manual VPS Deployment

For deploying to a VPS (DigitalOcean, AWS EC2, etc.):

#### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

#### 2. Clone and Build

```bash
# Clone repository
git clone your-repo-url
cd Chatbotsaasmvp

# Install dependencies
npm install

# Build application
npm run build
```

#### 3. Configure PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'chatforge-ai',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

#### 4. Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 5. Configure Nginx

Install and configure Nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 6. Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Post-Deployment Checklist

### Security

- [ ] SSL/TLS certificate installed
- [ ] Environment variables secured (not committed to git)
- [ ] Database RLS policies enabled
- [ ] Rate limiting configured
- [ ] CSP headers configured
- [ ] API keys rotated from development

### Performance

- [ ] Build optimization enabled
- [ ] CDN configured for static assets
- [ ] Database indexes created
- [ ] Image optimization enabled
- [ ] Caching headers configured

### Monitoring

- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (PostHog, GA)
- [ ] Uptime monitoring setup
- [ ] Health check endpoint accessible
- [ ] Database backups scheduled

### Testing

- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Database connections successful
- [ ] Email notifications working
- [ ] Chat widget embeds correctly
- [ ] Payment processing works (if applicable)

## Monitoring & Maintenance

### Health Checks

Monitor application health:

```bash
curl https://yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "up" },
    "auth": { "status": "up" }
  }
}
```

### Database Diagnostics

Check database health:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://yourdomain.com/api/admin/db-diagnostics
```

### Performance Monitoring

- Monitor Web Vitals in production
- Track API response times
- Monitor database query performance
- Set up alerts for slow queries (>1000ms)

### Database Backups

1. **Automatic Backups:**
   - Enable in Supabase Dashboard → Database → Backups
   - Configure retention period

2. **Manual Backups:**
   ```bash
   ./scripts/backup-database.sh
   ```

3. **Verify Backups:**
   - Test restore monthly on staging environment
   - Document restore procedures

## Scaling Considerations

### Horizontal Scaling

For high traffic:

1. **Deploy to multiple regions** (Vercel Edge Functions)
2. **Use CDN** for static assets
3. **Enable database connection pooling**
4. **Implement Redis** for rate limiting and caching

### Database Scaling

As you grow:

1. **Monitor connection pool usage**
2. **Add read replicas** for analytics queries
3. **Optimize slow queries**
4. **Archive old data**

### Cost Optimization

1. **Monitor API usage** (OpenAI, Supabase)
2. **Set up usage alerts**
3. **Implement request caching**
4. **Optimize database queries**

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Database Connection Issues

1. Check Supabase connection limits
2. Verify environment variables
3. Check RLS policies
4. Review error logs

### Performance Issues

1. Check health endpoint
2. Run database diagnostics
3. Review slow query logs
4. Monitor memory usage

### Error Tracking

Check errors in:
1. Sentry dashboard (if configured)
2. `/api/admin/db-diagnostics` endpoint
3. Supabase logs
4. Application logs

## Support & Resources

- **Documentation:** See README.md
- **Database Guide:** See DATABASE_MANAGEMENT.md
- **Issues:** Report at GitHub repository
- **Supabase Support:** https://supabase.com/support
- **Vercel Support:** https://vercel.com/support

## Security Considerations

### Secrets Management

- Never commit `.env.local` or `.env.production`
- Rotate API keys regularly
- Use environment-specific keys
- Enable MFA on all services

### Rate Limiting

- Configure Upstash Redis for distributed rate limiting
- Adjust limits based on your needs
- Monitor for abuse patterns

### Database Security

- Keep RLS policies enabled
- Regular security audits
- Monitor for unusual query patterns
- Keep Supabase updated

## Rollback Procedure

If deployment fails:

1. **Revert to previous version:**
   ```bash
   git revert HEAD
   git push
   ```

2. **Or use Vercel rollback:**
   - Go to Deployments
   - Click on previous working deployment
   - Click "Promote to Production"

3. **Restore database if needed:**
   ```bash
   ./scripts/restore-database.sh backups/last-good-backup.sql
   ```

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          vercel-args: '--prod'
```

## Post-Launch

After successful deployment:

1. **Monitor errors** for 24-48 hours
2. **Check analytics** for user behavior
3. **Verify backups** are running
4. **Test all critical flows**
5. **Document any issues** encountered
6. **Celebrate!** 🎉

---

For questions or issues, please check the documentation or open an issue in the repository.
