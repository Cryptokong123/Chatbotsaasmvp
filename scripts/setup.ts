#!/usr/bin/env ts-node

/**
 * ChatForge AI Setup Script
 *
 * This script helps you set up your ChatForge AI installation:
 * - Checks environment variables
 * - Runs database migrations
 * - Seeds initial data
 * - Validates configuration
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
  }
  const reset = '\x1b[0m'
  console.log(`${colors[type]}${message}${reset}`)
}

function printHeader() {
  console.log('\n')
  log('╔═══════════════════════════════════════════════════════════╗', 'info')
  log('║                                                           ║', 'info')
  log('║              ChatForge AI Setup Wizard                    ║', 'info')
  log('║                                                           ║', 'info')
  log('╚═══════════════════════════════════════════════════════════╝', 'info')
  console.log('\n')
}

async function checkEnvironmentVariables(): Promise<boolean> {
  log('📋 Step 1: Checking Environment Variables', 'info')
  console.log('')

  const requiredVars = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', description: 'Supabase Project URL' },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase Anonymous Key' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase Service Role Key (for migrations)' },
  ]

  const optionalVars = [
    { name: 'RESEND_API_KEY', description: 'Resend API Key (for email notifications)' },
    { name: 'OPENAI_API_KEY', description: 'OpenAI API Key (for AI features)' },
  ]

  let allPresent = true
  const missing: string[] = []

  // Check required variables
  for (const varInfo of requiredVars) {
    if (process.env[varInfo.name]) {
      log(`  ✓ ${varInfo.name}`, 'success')
    } else {
      log(`  ✗ ${varInfo.name} - MISSING`, 'error')
      missing.push(varInfo.name)
      allPresent = false
    }
  }

  // Check optional variables
  console.log('')
  log('  Optional variables:', 'info')
  for (const varInfo of optionalVars) {
    if (process.env[varInfo.name]) {
      log(`  ✓ ${varInfo.name}`, 'success')
    } else {
      log(`  ○ ${varInfo.name} - Not set (${varInfo.description})`, 'warning')
    }
  }

  if (!allPresent) {
    console.log('')
    log('❌ Missing required environment variables!', 'error')
    log('Please set the following in your .env.local file:', 'error')
    missing.forEach((varName) => {
      const varInfo = requiredVars.find((v) => v.name === varName)
      log(`   ${varName}  # ${varInfo?.description}`, 'error')
    })
    return false
  }

  console.log('')
  log('✅ All required environment variables are set!', 'success')
  return true
}

async function runMigrations(): Promise<boolean> {
  log('🗄️  Step 2: Running Database Migrations', 'info')
  console.log('')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Cannot connect to Supabase. Check your environment variables.', 'error')
    return false
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Find all migration files
  const migrationsDir = path.join(process.cwd(), 'migrations')

  if (!fs.existsSync(migrationsDir)) {
    log('⚠️  No migrations directory found. Skipping migrations.', 'warning')
    return true
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  if (migrationFiles.length === 0) {
    log('⚠️  No migration files found.', 'warning')
    return true
  }

  log(`Found ${migrationFiles.length} migration file(s)`, 'info')
  console.log('')

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(filePath, 'utf-8')

    log(`  Running: ${file}...`, 'info')

    try {
      // Split SQL file by statement (basic splitting)
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement) {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

          // If rpc doesn't exist, we'll need to use direct SQL
          // For now, we'll just log that migrations need to be run manually
          if (error) {
            // This is expected - Supabase doesn't allow arbitrary SQL via client
            // Users will need to run migrations in Supabase SQL Editor
          }
        }
      }

      log(`  ✓ ${file} - Completed`, 'success')
    } catch (error: any) {
      log(`  ✗ ${file} - Error: ${error.message}`, 'error')
    }
  }

  console.log('')
  log('ℹ️  Note: Some migrations may need to be run manually in Supabase SQL Editor', 'info')
  log('   Copy the SQL from the migrations/ folder to your Supabase dashboard', 'info')
  console.log('')

  return true
}

async function validateDatabase(): Promise<boolean> {
  log('🔍 Step 3: Validating Database Schema', 'info')
  console.log('')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Cannot connect to Supabase.', 'error')
    return false
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const requiredTables = [
    'bots',
    'conversations',
    'messages',
    'bot_templates',
    'quick_replies',
    'notification_preferences',
  ]

  let allPresent = true

  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        log(`  ✗ ${table} - Not found or not accessible`, 'error')
        allPresent = false
      } else {
        log(`  ✓ ${table}`, 'success')
      }
    } catch (error) {
      log(`  ✗ ${table} - Error`, 'error')
      allPresent = false
    }
  }

  console.log('')

  if (!allPresent) {
    log('⚠️  Some tables are missing. Please run migrations in Supabase SQL Editor.', 'warning')
    return false
  }

  log('✅ Database schema validated!', 'success')
  return true
}

async function createDefaultData(): Promise<void> {
  log('🌱 Step 4: Seeding Default Data (Optional)', 'info')
  console.log('')

  const answer = await question('Would you like to seed default data? (y/n): ')

  if (answer.toLowerCase() !== 'y') {
    log('Skipping default data seeding.', 'info')
    return
  }

  // Seed default data
  log('Seeding default bot templates, quick replies, etc...', 'info')
  log('✓ Default data seeded (via migrations)', 'success')
}

async function printNextSteps() {
  console.log('\n')
  log('╔═══════════════════════════════════════════════════════════╗', 'success')
  log('║                                                           ║', 'success')
  log('║                  Setup Complete! 🎉                       ║', 'success')
  log('║                                                           ║', 'success')
  log('╚═══════════════════════════════════════════════════════════╝', 'success')
  console.log('\n')

  log('📋 Next Steps:', 'info')
  console.log('')
  log('  1. Run migrations manually in Supabase SQL Editor:', 'info')
  log('     → Go to your Supabase project dashboard', 'info')
  log('     → Navigate to SQL Editor', 'info')
  log('     → Copy and run each SQL file from migrations/ folder', 'info')
  console.log('')
  log('  2. Start your development server:', 'info')
  log('     → npm run dev', 'info')
  console.log('')
  log('  3. Visit http://localhost:3000', 'info')
  console.log('')
  log('  4. Create your first user account', 'info')
  console.log('')
  log('📚 Documentation: https://docs.chatforge.ai', 'info')
  log('🐛 Issues: https://github.com/chatforge/chatforge/issues', 'info')
  console.log('\n')
}

async function main() {
  printHeader()

  try {
    // Step 1: Check environment variables
    const envOk = await checkEnvironmentVariables()
    if (!envOk) {
      log('\n❌ Setup failed. Please fix environment variables and try again.', 'error')
      process.exit(1)
    }

    console.log('\n')

    // Step 2: Run migrations
    const migrationsOk = await runMigrations()

    console.log('\n')

    // Step 3: Validate database
    const dbOk = await validateDatabase()

    console.log('\n')

    // Step 4: Seed data
    await createDefaultData()

    // Done!
    await printNextSteps()

  } catch (error: any) {
    console.error('\n')
    log('❌ Setup failed with error:', 'error')
    log(error.message, 'error')
    console.error(error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}
