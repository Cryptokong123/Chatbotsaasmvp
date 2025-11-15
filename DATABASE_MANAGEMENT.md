# Database Management Guide

This guide covers database health monitoring, backups, and maintenance for ChatForge AI.

## Health Monitoring

### Health Check Endpoint

Check the overall health of the application:

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 45
    },
    "auth": {
      "status": "up",
      "responseTime": 32
    },
    "environment": {
      "status": "ok"
    }
  },
  "version": "1.0.0",
  "uptime": 3600000
}
```

### Database Diagnostics

Get detailed database statistics (requires authentication):

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/db-diagnostics
```

Response includes:
- Table row counts
- Performance metrics
- Orphaned data detection
- User-specific statistics
- Health assessment

## Backups

### Automatic Backups (Recommended)

Supabase provides automatic daily backups on paid plans:

1. Go to Supabase Dashboard → Database → Backups
2. Configure backup schedule
3. Download backups as needed

### Manual Backups

#### Using the Backup Script

```bash
./scripts/backup-database.sh
```

This creates a backup in the `backups/` directory with timestamp.

#### Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Create backup
supabase db dump -f backups/manual-backup.sql
```

#### Using pg_dump

```bash
# Get your database URL from Supabase Dashboard → Settings → Database
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  > backup.sql
```

### Backup Schedule Recommendations

- **Development**: Weekly backups
- **Staging**: Daily backups
- **Production**: Daily automatic + weekly manual verification

## Restore

### ⚠️ IMPORTANT: Restore Considerations

- **Always test restores on staging first**
- **Create a backup before restoring**
- **Restoring will OVERWRITE all current data**
- **Notify users of downtime**

### Using the Restore Script

```bash
./scripts/restore-database.sh backups/backup_20240115_103000.sql
```

The script will:
1. Show a warning and ask for confirmation
2. Verify the backup file exists
3. Connect to your database
4. Restore the data

### Manual Restore

```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  -f backup.sql
```

## Maintenance Tasks

### Check for Orphaned Data

Run diagnostics endpoint to detect:
- Messages without conversations
- Training data without bots
- Other referential integrity issues

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/db-diagnostics | jq '.issues'
```

### Clean Up Old Error Logs

Error logs are useful for debugging but can grow large. Clean up old logs:

```sql
-- Delete error logs older than 30 days
DELETE FROM error_logs
WHERE created_at < NOW() - INTERVAL '30 days';
```

Add this as a cron job or scheduled task.

### Optimize Database Performance

#### Vacuum and Analyze

Run periodic maintenance (Supabase handles this automatically, but you can trigger manually):

```sql
VACUUM ANALYZE;
```

#### Check Slow Queries

Monitor query performance in Supabase Dashboard → Database → Query Performance.

### Index Maintenance

Check for missing indexes on frequently queried columns:

```sql
-- Find tables without indexes on foreign keys
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
```

## Migration Management

### Run Migrations

```bash
# Using the setup script
npm run setup

# Or run individual migrations
psql "your-database-url" -f migrations/add_conversations.sql
```

### Verify Migrations

```sql
-- Check if a table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'conversations';

-- Check if a column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'conversations';
```

### Migration Order

Migrations must be run in this order:

1. `schema.sql` - Base tables
2. `add_conversations.sql` - Conversations table
3. `add_sentiment_analysis.sql` - Sentiment tracking
4. `add_quick_replies.sql` - Quick reply templates
5. `add_conversation_flows.sql` - Flow builder
6. `add_webhooks.sql` - Webhook system
7. `add_team_collaboration.sql` - Team features
8. `add_error_logs.sql` - Error logging
9. `seed_data.sql` - Default data (after creating first user)

## Monitoring Best Practices

1. **Set up alerts** for database health check failures
2. **Monitor response times** - Alert if > 1000ms
3. **Track row counts** - Unusual growth might indicate issues
4. **Review error logs** weekly for patterns
5. **Test backups** monthly by restoring to staging

## Disaster Recovery

### Scenario: Data Loss

1. **Stop the application** to prevent further changes
2. **Identify the extent** of data loss
3. **Find the most recent backup** before the issue
4. **Test restore** on staging environment
5. **Restore to production** during maintenance window
6. **Verify data integrity** with diagnostics
7. **Investigate root cause** to prevent recurrence

### Scenario: Performance Degradation

1. **Check health endpoint** for slow queries
2. **Run diagnostics** to identify issues
3. **Review Supabase metrics** for resource usage
4. **Optimize queries** or add indexes as needed
5. **Consider scaling** if consistent high load

## Support

For issues:
1. Check logs: `app/api/log-error/route.ts`
2. Run diagnostics: `/api/admin/db-diagnostics`
3. Review Supabase Dashboard logs
4. Contact Supabase support for infrastructure issues
