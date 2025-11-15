#!/bin/bash

# ChatForge AI Migration Runner
# This script helps you run all database migrations

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║          ChatForge AI Migration Runner                    ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if migrations directory exists
if [ ! -d "migrations" ]; then
    echo "❌ Error: migrations directory not found!"
    exit 1
fi

# Count migration files
migration_count=$(ls -1 migrations/*.sql 2>/dev/null | wc -l)

if [ $migration_count -eq 0 ]; then
    echo "⚠️  No migration files found in migrations/"
    exit 0
fi

echo "📋 Found $migration_count migration file(s)"
echo ""
echo "🗄️  Migrations to run:"
echo ""

# List all migrations
for file in migrations/*.sql; do
    basename "$file"
done

echo ""
echo "⚠️  IMPORTANT: Migrations must be run in Supabase SQL Editor"
echo ""
echo "📝 Steps to run migrations:"
echo "  1. Go to your Supabase project dashboard"
echo "  2. Navigate to SQL Editor (left sidebar)"
echo "  3. Create a new query"
echo "  4. Copy the contents of each migration file (in order)"
echo "  5. Run each migration"
echo ""
echo "📁 Migration files are located in: $(pwd)/migrations/"
echo ""

# Ask if user wants to see a migration
read -p "Would you like to view a migration file? (y/n): " view_migration

if [ "$view_migration" = "y" ]; then
    echo ""
    echo "Available migrations:"
    select migration in migrations/*.sql "Exit"; do
        case $migration in
            "Exit")
                break
                ;;
            *)
                if [ -n "$migration" ]; then
                    echo ""
                    echo "╔═══════════════════════════════════════╗"
                    echo "║  $(basename "$migration")"
                    echo "╚═══════════════════════════════════════╝"
                    echo ""
                    cat "$migration"
                    echo ""
                fi
                ;;
        esac
        break
    done
fi

echo ""
echo "✅ Migration runner complete!"
echo ""
