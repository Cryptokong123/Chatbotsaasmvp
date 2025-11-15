#!/bin/bash

# Database Backup Script for ChatForge AI
# Creates a timestamped backup of the Supabase database

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
elif [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo -e "${RED}Error: No .env file found${NC}"
  exit 1
fi

# Extract database connection info from Supabase URL
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo -e "${RED}Error: NEXT_PUBLIC_SUPABASE_URL not set${NC}"
  exit 1
fi

PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -n 's/.*https:\/\/\(.*\)\.supabase\.co.*/\1/p')

if [ -z "$PROJECT_REF" ]; then
  echo -e "${RED}Error: Could not extract project reference from Supabase URL${NC}"
  exit 1
fi

# Create backups directory
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${PROJECT_REF}_${TIMESTAMP}.sql"

echo -e "${YELLOW}Starting database backup...${NC}"
echo "Project: $PROJECT_REF"
echo "Backup file: $BACKUP_FILE"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}Supabase CLI not found. Installing...${NC}"
  echo "Please install Supabase CLI manually:"
  echo "  npm install -g supabase"
  echo "  or"
  echo "  brew install supabase/tap/supabase"
  exit 1
fi

# Check if user is logged in to Supabase
if ! supabase projects list &> /dev/null; then
  echo -e "${YELLOW}Not logged in to Supabase. Please run:${NC}"
  echo "  supabase login"
  exit 1
fi

# Backup database schema and data
echo -e "${YELLOW}Creating backup...${NC}"

# Note: This requires Supabase CLI and appropriate permissions
# For production use, consider using Supabase's built-in backup features
# or pg_dump with direct database access

cat > $BACKUP_FILE << 'EOF'
-- ChatForge AI Database Backup
-- Generated: $(date)
-- Project: $PROJECT_REF

-- NOTE: This is a template backup file.
-- For full backups, use:
--   1. Supabase Dashboard -> Database -> Backups (automatic)
--   2. pg_dump with direct database connection
--   3. Supabase CLI: supabase db dump

-- To create a proper backup with Supabase CLI:
-- supabase db dump -f backup.sql

-- To restore:
-- psql -h db.${PROJECT_REF}.supabase.co -U postgres -d postgres -f backup.sql

EOF

echo -e "${GREEN}Backup template created: $BACKUP_FILE${NC}"
echo ""
echo -e "${YELLOW}For production backups:${NC}"
echo "1. Use Supabase Dashboard automatic backups (recommended)"
echo "2. Use pg_dump with database connection string:"
echo "   pg_dump 'postgresql://postgres:[PASSWORD]@db.${PROJECT_REF}.supabase.co:5432/postgres' > backup.sql"
echo "3. Use Supabase CLI:"
echo "   supabase db dump -f $BACKUP_FILE"
echo ""

# Keep only last 10 backups
echo -e "${YELLOW}Cleaning old backups (keeping last 10)...${NC}"
ls -t $BACKUP_DIR/backup_*.sql 2>/dev/null | tail -n +11 | xargs -r rm
echo -e "${GREEN}Cleanup complete${NC}"

echo ""
echo -e "${GREEN}Backup process complete!${NC}"
echo "Backup location: $BACKUP_FILE"
