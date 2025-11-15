#!/bin/bash

# Database Restore Script for ChatForge AI
# Restores database from a backup file

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Please provide a backup file${NC}"
  echo "Usage: ./restore-database.sh <backup-file.sql>"
  echo ""
  echo "Available backups:"
  ls -1t backups/backup_*.sql 2>/dev/null | head -5 || echo "  No backups found"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
  exit 1
fi

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
elif [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo -e "${RED}Error: No .env file found${NC}"
  exit 1
fi

# Extract database connection info
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo -e "${RED}Error: NEXT_PUBLIC_SUPABASE_URL not set${NC}"
  exit 1
fi

PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -n 's/.*https:\/\/\(.*\)\.supabase\.co.*/\1/p')

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}WARNING: Database Restore${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Project: $PROJECT_REF"
echo "Backup file: $BACKUP_FILE"
echo ""
echo -e "${RED}This will OVERWRITE your current database!${NC}"
echo -e "${RED}All existing data will be LOST!${NC}"
echo ""
echo -e "${YELLOW}It is recommended to:${NC}"
echo "1. Create a backup of your current database first"
echo "2. Test restore on a development/staging environment"
echo "3. Ensure you have the correct backup file"
echo ""

read -p "Are you ABSOLUTELY SURE you want to restore? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${YELLOW}Restore cancelled.${NC}"
  exit 0
fi

echo ""
echo -e "${YELLOW}Starting database restore...${NC}"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo -e "${RED}Error: psql not found${NC}"
  echo "Please install PostgreSQL client:"
  echo "  macOS: brew install postgresql"
  echo "  Ubuntu: sudo apt-get install postgresql-client"
  echo "  Windows: Download from https://www.postgresql.org/download/"
  exit 1
fi

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
  echo -e "${YELLOW}Using Supabase CLI for restore...${NC}"

  read -p "Enter your database password: " -s DB_PASSWORD
  echo ""

  # Restore using Supabase CLI
  PGPASSWORD=$DB_PASSWORD psql -h db.${PROJECT_REF}.supabase.co -U postgres -d postgres -f $BACKUP_FILE

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Restore completed successfully!${NC}"
  else
    echo -e "${RED}Restore failed!${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}Supabase CLI not found.${NC}"
  echo "To restore manually:"
  echo "1. Get your database password from Supabase Dashboard -> Settings -> Database"
  echo "2. Run:"
  echo "   psql 'postgresql://postgres:[PASSWORD]@db.${PROJECT_REF}.supabase.co:5432/postgres' -f $BACKUP_FILE"
  exit 1
fi

echo ""
echo -e "${GREEN}Database restore complete!${NC}"
echo "Please verify your data in the application."
